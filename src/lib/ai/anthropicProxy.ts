/**
 * Anthropic Provider — Routes Anthropic (Claude) requests through ai-proxy.
 *
 * Wire-protocol: identical to SupabaseAIProvider (same endpoint, JSON shape),
 * but with `provider: 'anthropic'` in the request body. The Edge Function
 * translates request/response between OpenAI and Anthropic so the client
 * stays format-agnostic.
 *
 * Streaming: NOT supported here. SystemAgent is non-streaming by design,
 * and that's the only place we'll route through Anthropic. If someone calls
 * chatStream() on this provider, the request automatically falls back to
 * OpenAI server-side (the proxy treats `provider: anthropic + stream: true`
 * as OpenAI). This keeps the AIProvider interface intact.
 *
 * Server-side requirement: ANTHROPIC_API_KEY in the Edge Function env.
 * If absent, the proxy returns HTTP 503 with { fallback: 'openai' } — the
 * caller (SystemAgent) decides whether to retry against OpenAI.
 */

import type { AIProvider, ChatOptions } from './provider';
import type { ChatMessage, AIResponse, StreamCallback } from './types';
import type { HealthContext } from '../../types/health';
import { parseCompletionResponse } from './sseParser';

const TOTAL_TIMEOUT_MS = 120_000;

/** Custom error so callers (SystemAgent) can distinguish missing-key from real errors. */
export class AnthropicUnavailableError extends Error {
  public readonly httpStatus: number;
  constructor(message: string, httpStatus: number) {
    super(message);
    this.name = 'AnthropicUnavailableError';
    this.httpStatus = httpStatus;
  }
}

export class AnthropicProxyProvider implements AIProvider {
  private functionsUrl: string;
  private anonKey: string;
  private model: string;

  constructor(supabaseUrl: string, anonKey: string, model: string) {
    this.functionsUrl = `${supabaseUrl}/functions/v1/ai-proxy`;
    this.anonKey = anonKey;
    this.model = model;
  }

  getName(): string {
    return `Anthropic Proxy (${this.model})`;
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.functionsUrl && this.anonKey);
  }

  /**
   * Blocking chat against Claude via the ai-proxy. Used by SystemAgent.
   *
   * Throws `AnthropicUnavailableError` on 503 (no key) or 5xx — so the caller
   * can fall back to OpenAI cleanly. All other errors bubble.
   */
  async chat(messages: ChatMessage[], _context?: HealthContext, options?: ChatOptions): Promise<AIResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TOTAL_TIMEOUT_MS);

    try {
      const body: Record<string, unknown> = {
        provider: 'anthropic',
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 8192,
        stream: false,
      };

      if (options?.tools?.length) {
        body.tools = options.tools;
        body.tool_choice = options.tool_choice ?? 'auto';
      }

      const response = await fetch(this.functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = (errorData as { error?: string }).error ?? `HTTP ${response.status}`;
        // 503 = key missing on server; 5xx = transient — both should trigger client-side fallback
        if (response.status === 503 || response.status >= 500) {
          throw new AnthropicUnavailableError(errorMsg, response.status);
        }
        throw new Error(`Anthropic Proxy error: ${errorMsg}`);
      }

      const data = await response.json();
      // The proxy already returns OpenAI-shape, so the existing parser works.
      return parseCompletionResponse(data, this.model);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AnthropicUnavailableError('Anthropic timeout', 504);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Streaming is not implemented for Anthropic in this codebase. The SystemAgent
   * (the only consumer) only uses chat(), not chatStream(). If anyone ever does
   * call this, throw clearly so the bug surfaces rather than silently degrading.
   */
  async chatStream(
    _messages: ChatMessage[],
    _onChunk: StreamCallback,
    _context?: HealthContext,
    _options?: ChatOptions,
  ): Promise<AIResponse> {
    throw new Error('AnthropicProxyProvider does not implement chatStream. Use OpenAI for streaming.');
  }
}
