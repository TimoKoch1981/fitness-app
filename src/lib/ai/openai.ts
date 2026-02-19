/**
 * OpenAI AI Provider — Cloud LLM integration.
 * Communicates with OpenAI API at api.openai.com.
 *
 * Uses raw fetch() instead of the openai npm package
 * to stay dependency-free and consistent with OllamaProvider.
 *
 * Streaming format: SSE (Server-Sent Events)
 * Each line: "data: {json}\n\n" with choices[0].delta.content
 * Final line: "data: [DONE]\n\n"
 *
 * @see https://platform.openai.com/docs/api-reference/chat/create
 */

import type { AIProvider } from './provider';
import type { ChatMessage, AIResponse, StreamCallback } from './types';
import type { HealthContext } from '../../types/health';

/** Timeout for the initial connection (first byte) — 15s (OpenAI is fast) */
const CONNECT_TIMEOUT_MS = 15_000;
/** Timeout for total response — 120s */
const TOTAL_TIMEOUT_MS = 120_000;

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }

  getName(): string {
    return `OpenAI (${this.model})`;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;
    try {
      const response = await fetch(`${OPENAI_BASE_URL}/models`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${this.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Blocking chat — waits for the entire response before returning.
   * Use chatStream() instead for better UX.
   */
  async chat(messages: ChatMessage[], _context?: HealthContext): Promise<AIResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TOTAL_TIMEOUT_MS);

    try {
      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = (errorData as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`;
        throw new Error(`OpenAI error: ${errorMsg}`);
      }

      const data = await response.json();

      return {
        content: data.choices?.[0]?.message?.content ?? '',
        model: data.model ?? this.model,
        tokensUsed: data.usage?.total_tokens,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('OpenAI timeout — die Antwort hat zu lange gedauert. Versuche es nochmal.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Streaming chat — calls onChunk with accumulated text as tokens arrive.
   * Returns the final AIResponse when done.
   *
   * OpenAI streams SSE (Server-Sent Events):
   *   data: {"choices":[{"delta":{"content":"token"}}]}
   *   data: [DONE]
   */
  async chatStream(
    messages: ChatMessage[],
    onChunk: StreamCallback,
    _context?: HealthContext,
  ): Promise<AIResponse> {
    const controller = new AbortController();
    const totalTimeout = setTimeout(() => controller.abort(), TOTAL_TIMEOUT_MS);

    try {
      const connectTimeout = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2048,
          stream: true,
          stream_options: { include_usage: true },
        }),
      });

      clearTimeout(connectTimeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = (errorData as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`;
        throw new Error(`OpenAI error: ${errorMsg}`);
      }

      if (!response.body) {
        throw new Error('OpenAI returned no response body for streaming');
      }

      // Read the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let model = this.model;
      let tokensUsed = 0;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();

          // Skip empty lines and comments
          if (!trimmed || trimmed.startsWith(':')) continue;

          // SSE format: "data: {json}" or "data: [DONE]"
          if (!trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6); // Remove "data: " prefix

          // Stream finished
          if (data === '[DONE]') continue;

          try {
            const chunk = JSON.parse(data);

            // Extract content delta
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              onChunk(accumulated);
            }

            // Model info from first chunk
            if (chunk.model) {
              model = chunk.model;
            }

            // Usage info (only in final chunk with stream_options.include_usage)
            if (chunk.usage?.total_tokens) {
              tokensUsed = chunk.usage.total_tokens;
            }
          } catch {
            console.warn('[OpenAI] Skipped malformed stream chunk:', data.slice(0, 100));
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim() && buffer.trim().startsWith('data: ')) {
        const data = buffer.trim().slice(6);
        if (data !== '[DONE]') {
          try {
            const chunk = JSON.parse(data);
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              onChunk(accumulated);
            }
            if (chunk.usage?.total_tokens) {
              tokensUsed = chunk.usage.total_tokens;
            }
          } catch {
            // ignore
          }
        }
      }

      return {
        content: accumulated,
        model,
        tokensUsed,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('OpenAI timeout — die Antwort hat zu lange gedauert. Versuche es nochmal.');
      }
      throw error;
    } finally {
      clearTimeout(totalTimeout);
    }
  }
}
