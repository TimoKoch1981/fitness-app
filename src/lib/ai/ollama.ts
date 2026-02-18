/**
 * Ollama AI Provider - Local LLM integration.
 * Communicates with Ollama REST API at localhost:11434.
 *
 * Supports both blocking (chat) and streaming (chatStream) modes.
 * Streaming is preferred for UX — shows tokens as they arrive.
 *
 * CORS: Ollama needs OLLAMA_ORIGINS=* environment variable
 * or run with: OLLAMA_ORIGINS="http://localhost:5173" ollama serve
 *
 * @see https://github.com/ollama/ollama/blob/main/docs/api.md
 */

import type { AIProvider } from './provider';
import type { ChatMessage, AIResponse, StreamCallback } from './types';
import type { HealthContext } from '../../types/health';

/** Timeout for the initial connection (first byte) — 30s */
const CONNECT_TIMEOUT_MS = 30_000;
/** Timeout for total response (streaming may take longer) — 120s */
const TOTAL_TIMEOUT_MS = 120_000;

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3.1:8b') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  getName(): string {
    return `Ollama (${this.model})`;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
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
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 512,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      return {
        content: data.message?.content ?? '',
        model: data.model ?? this.model,
        tokensUsed: data.eval_count,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Ollama timeout — die Antwort hat zu lange gedauert. Versuche es nochmal.');
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
   * Ollama streams NDJSON: each line is a JSON object with `message.content` (token fragment)
   * and `done: true` on the final chunk.
   */
  async chatStream(
    messages: ChatMessage[],
    onChunk: StreamCallback,
    _context?: HealthContext,
  ): Promise<AIResponse> {
    const controller = new AbortController();
    const totalTimeout = setTimeout(() => controller.abort(), TOTAL_TIMEOUT_MS);

    try {
      // Connection timeout: abort if no response within CONNECT_TIMEOUT_MS
      const connectTimeout = setTimeout(() => controller.abort(), CONNECT_TIMEOUT_MS);

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: 512,
          },
        }),
      });

      clearTimeout(connectTimeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama error (${response.status}): ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Ollama returned no response body for streaming');
      }

      // Read the NDJSON stream
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

        // Process complete lines (NDJSON — one JSON object per line)
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // keep incomplete last line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const chunk = JSON.parse(trimmed);

            // Accumulate content
            if (chunk.message?.content) {
              accumulated += chunk.message.content;
              onChunk(accumulated);
            }

            // Final chunk has done: true and metadata
            if (chunk.done) {
              model = chunk.model ?? model;
              tokensUsed = chunk.eval_count ?? 0;
            }
          } catch {
            // Skip malformed JSON lines (shouldn't happen but be safe)
            console.warn('[Ollama] Skipped malformed stream chunk:', trimmed.slice(0, 100));
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const chunk = JSON.parse(buffer.trim());
          if (chunk.message?.content) {
            accumulated += chunk.message.content;
            onChunk(accumulated);
          }
          if (chunk.done) {
            model = chunk.model ?? model;
            tokensUsed = chunk.eval_count ?? 0;
          }
        } catch {
          // ignore
        }
      }

      return {
        content: accumulated,
        model,
        tokensUsed,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Ollama timeout — die Antwort hat zu lange gedauert. Versuche es nochmal.');
      }
      throw error;
    } finally {
      clearTimeout(totalTimeout);
    }
  }
}
