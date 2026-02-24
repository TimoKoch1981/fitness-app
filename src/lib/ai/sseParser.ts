/**
 * Shared SSE (Server-Sent Events) parser for OpenAI-compatible streams.
 *
 * Used by both OpenAIProvider (direct) and SupabaseAIProvider (via Edge Function).
 *
 * OpenAI SSE format:
 *   data: {"choices":[{"delta":{"content":"token"}}]}
 *   data: [DONE]
 */

import type { AIResponse, StreamCallback } from './types';

export interface SSEParseResult {
  content: string;
  model: string;
  tokensUsed: number;
}

/**
 * Parse an SSE stream from an OpenAI-compatible chat completions endpoint.
 *
 * @param body - ReadableStream from fetch response
 * @param onChunk - Callback with accumulated text on each token
 * @param defaultModel - Fallback model name
 * @returns Final accumulated response
 */
export async function parseSSEStream(
  body: ReadableStream<Uint8Array>,
  onChunk: StreamCallback,
  defaultModel: string,
): Promise<SSEParseResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let accumulated = '';
  let model = defaultModel;
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
        console.warn('[SSE] Skipped malformed stream chunk:', data.slice(0, 100));
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

  return { content: accumulated, model, tokensUsed };
}

/**
 * Make a non-streaming chat completion request and parse the response.
 * Shared between OpenAI direct and Supabase proxy.
 */
export function parseCompletionResponse(data: {
  choices?: Array<{ message?: { content?: string } }>;
  model?: string;
  usage?: { total_tokens?: number };
}, defaultModel: string): AIResponse {
  return {
    content: data.choices?.[0]?.message?.content ?? '',
    model: data.model ?? defaultModel,
    tokensUsed: data.usage?.total_tokens,
  };
}
