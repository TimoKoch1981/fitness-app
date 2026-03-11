/**
 * Shared SSE (Server-Sent Events) parser for OpenAI-compatible streams.
 *
 * Used by both OpenAIProvider (direct) and SupabaseAIProvider (via Edge Function).
 *
 * OpenAI SSE format:
 *   data: {"choices":[{"delta":{"content":"token"}}]}
 *   data: [DONE]
 *
 * Function Calling format (non-streaming):
 *   choices[0].message.tool_calls: [{ id, type, function: { name, arguments } }]
 *
 * Function Calling format (streaming):
 *   choices[0].delta.tool_calls: [{ index, id?, type?, function: { name?, arguments? } }]
 */

import type { AIResponse, StreamCallback, ToolCall } from './types';

export interface SSEParseResult {
  content: string;
  model: string;
  tokensUsed: number;
  /** Tool calls accumulated from streaming chunks */
  tool_calls?: ToolCall[];
}

/**
 * Parse an SSE stream from an OpenAI-compatible chat completions endpoint.
 * Handles both text content streaming and Function Calling tool_calls.
 *
 * @param body - ReadableStream from fetch response
 * @param onChunk - Callback with accumulated text on each token
 * @param defaultModel - Fallback model name
 * @returns Final accumulated response (with tool_calls if present)
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

  // Tool call accumulation for streaming Function Calling
  const toolCallMap = new Map<number, { id: string; type: string; name: string; arguments: string }>();

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
        const delta = chunk.choices?.[0]?.delta;
        if (delta?.content) {
          accumulated += delta.content;
          onChunk(accumulated);
        }

        // Extract streaming tool_calls (Function Calling)
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCallMap.has(idx)) {
              toolCallMap.set(idx, {
                id: tc.id ?? '',
                type: tc.type ?? 'function',
                name: tc.function?.name ?? '',
                arguments: '',
              });
            }
            const entry = toolCallMap.get(idx)!;
            if (tc.id) entry.id = tc.id;
            if (tc.function?.name) entry.name = tc.function.name;
            if (tc.function?.arguments) entry.arguments += tc.function.arguments;
          }
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
        const delta = chunk.choices?.[0]?.delta;
        if (delta?.content) {
          accumulated += delta.content;
          onChunk(accumulated);
        }
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCallMap.has(idx)) {
              toolCallMap.set(idx, {
                id: tc.id ?? '',
                type: tc.type ?? 'function',
                name: tc.function?.name ?? '',
                arguments: '',
              });
            }
            const entry = toolCallMap.get(idx)!;
            if (tc.id) entry.id = tc.id;
            if (tc.function?.name) entry.name = tc.function.name;
            if (tc.function?.arguments) entry.arguments += tc.function.arguments;
          }
        }
        if (chunk.usage?.total_tokens) {
          tokensUsed = chunk.usage.total_tokens;
        }
      } catch {
        // ignore
      }
    }
  }

  // Convert accumulated tool calls to ToolCall[]
  const tool_calls: ToolCall[] | undefined = toolCallMap.size > 0
    ? Array.from(toolCallMap.values()).map(tc => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.name, arguments: tc.arguments },
      }))
    : undefined;

  return { content: accumulated, model, tokensUsed, tool_calls };
}

/**
 * Parse a non-streaming chat completion response.
 * Shared between OpenAI direct and Supabase proxy.
 * Extracts tool_calls if present (Function Calling).
 */
export function parseCompletionResponse(data: {
  choices?: Array<{
    message?: {
      content?: string;
      tool_calls?: Array<{
        id: string;
        type: string;
        function: { name: string; arguments: string };
      }>;
    };
  }>;
  model?: string;
  usage?: { total_tokens?: number };
}, defaultModel: string): AIResponse {
  const message = data.choices?.[0]?.message;

  const response: AIResponse = {
    content: message?.content ?? '',
    model: data.model ?? defaultModel,
    tokensUsed: data.usage?.total_tokens,
  };

  // Extract tool_calls (Function Calling)
  if (message?.tool_calls?.length) {
    response.tool_calls = message.tool_calls.map(tc => ({
      id: tc.id,
      type: 'function' as const,
      function: { name: tc.function.name, arguments: tc.function.arguments },
    }));
  }

  return response;
}
