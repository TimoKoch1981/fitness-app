/**
 * Supabase AI Provider — Routes AI requests through the ai-proxy Edge Function.
 *
 * Keeps the OpenAI API key server-side (never in the browser).
 * The Edge Function reads OPENAI_API_KEY from Supabase Secrets.
 *
 * For streaming: Uses raw fetch() with SSE parsing (same format as OpenAI).
 * For non-streaming: Uses supabase.functions.invoke() or raw fetch().
 *
 * Auth: Passes VITE_SUPABASE_ANON_KEY as Bearer token.
 */

import type { AIProvider } from './provider';
import type { ChatMessage, AIResponse, StreamCallback } from './types';
import type { HealthContext } from '../../types/health';
import { parseSSEStream, parseCompletionResponse } from './sseParser';

/** Timeout for the initial connection — 15s */
const CONNECT_TIMEOUT_MS = 15_000;
/** Timeout for total response — 120s */
const TOTAL_TIMEOUT_MS = 120_000;

export class SupabaseAIProvider implements AIProvider {
  private functionsUrl: string;
  private anonKey: string;
  private model: string;

  constructor(supabaseUrl: string, anonKey: string, model: string = 'gpt-4o-mini') {
    // Edge Function URL: {supabaseUrl}/functions/v1/ai-proxy
    this.functionsUrl = `${supabaseUrl}/functions/v1/ai-proxy`;
    this.anonKey = anonKey;
    this.model = model;
  }

  getName(): string {
    return `Supabase Proxy (${this.model})`;
  }

  async isAvailable(): Promise<boolean> {
    // We can't easily health-check the Edge Function without sending a real request.
    // Trust that it's available if we have the URL and key.
    return !!(this.functionsUrl && this.anonKey);
  }

  /**
   * Blocking chat — sends request through Edge Function, waits for full response.
   */
  async chat(messages: ChatMessage[], _context?: HealthContext): Promise<AIResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TOTAL_TIMEOUT_MS);

    try {
      const response = await fetch(this.functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 2048,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = (errorData as { error?: string }).error ?? `HTTP ${response.status}`;
        throw new Error(`AI Proxy error: ${errorMsg}`);
      }

      const data = await response.json();
      return parseCompletionResponse(data, this.model);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('AI Proxy timeout — die Antwort hat zu lange gedauert. Versuche es nochmal.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Streaming chat — sends request through Edge Function, streams SSE back.
   * The Edge Function pipes the OpenAI SSE stream directly.
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

      const response = await fetch(this.functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`,
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
        const errorMsg = (errorData as { error?: string }).error ?? `HTTP ${response.status}`;
        throw new Error(`AI Proxy error: ${errorMsg}`);
      }

      if (!response.body) {
        throw new Error('AI Proxy returned no response body for streaming');
      }

      const result = await parseSSEStream(response.body, onChunk, this.model);

      return {
        content: result.content,
        model: result.model,
        tokensUsed: result.tokensUsed,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('AI Proxy timeout — die Antwort hat zu lange gedauert. Versuche es nochmal.');
      }
      throw error;
    } finally {
      clearTimeout(totalTimeout);
    }
  }
}

/**
 * Make a non-streaming completion request through the ai-proxy Edge Function.
 * Used by vision.ts and emailExtractor.ts for one-off requests.
 *
 * @param supabaseUrl - VITE_SUPABASE_URL
 * @param anonKey - VITE_SUPABASE_ANON_KEY
 * @param messages - Chat messages (including vision content)
 * @param options - Model, temperature, max_tokens overrides
 * @returns Raw OpenAI response JSON
 */
export async function proxyCompletionRequest(
  supabaseUrl: string,
  anonKey: string,
  messages: Array<{ role: string; content: unknown }>,
  options: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    response_format?: unknown;
  } = {},
): Promise<{ choices?: Array<{ message?: { content?: string } }>; model?: string; usage?: { total_tokens?: number } }> {
  const functionsUrl = `${supabaseUrl}/functions/v1/ai-proxy`;

  const response = await fetch(functionsUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      model: options.model ?? 'gpt-4o-mini',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 2048,
      stream: false,
      ...(options.response_format ? { response_format: options.response_format } : {}),
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = (errorData as { error?: string }).error ?? `HTTP ${response.status}`;
    throw new Error(`AI Proxy error: ${errorMsg}`);
  }

  return response.json();
}
