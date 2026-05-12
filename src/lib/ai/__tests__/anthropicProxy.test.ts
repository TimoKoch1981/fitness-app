/**
 * Tests for AnthropicProxyProvider.
 *
 * Focus: the OpenAI-shape response coming back from the proxy is parsed
 * correctly, and 503 / 5xx errors surface as AnthropicUnavailableError so
 * the SystemAgent can fall back cleanly.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnthropicProxyProvider, AnthropicUnavailableError } from '../anthropicProxy';

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
});

const provider = new AnthropicProxyProvider(
  'https://fudda.de',
  'anon-test-key',
  'claude-sonnet-4-5',
);

describe('AnthropicProxyProvider', () => {
  it('reports its name with the configured model', () => {
    expect(provider.getName()).toBe('Anthropic Proxy (claude-sonnet-4-5)');
  });

  it('isAvailable returns true when URL + key configured', async () => {
    await expect(provider.isAvailable()).resolves.toBe(true);
  });

  it('sends provider:anthropic in the body and forwards tools', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        model: 'claude-sonnet-4-5-20250929',
        choices: [{
          message: {
            role: 'assistant',
            content: '',
            tool_calls: [{
              id: 'tu_1',
              type: 'function',
              function: { name: 'log_meal', arguments: '{"name":"Skyr","calories":350,"protein":30,"carbs":40,"fat":5}' },
            }],
          },
          finish_reason: 'tool_calls',
        }],
        usage: { prompt_tokens: 120, completion_tokens: 60, total_tokens: 180 },
      }),
    });

    const tools = [{
      type: 'function' as const,
      function: { name: 'log_meal', description: 'log a meal', parameters: { type: 'object' } },
    }];

    const result = await provider.chat(
      [{ role: 'user', content: 'log 500g skyr' }],
      undefined,
      { tools, tool_choice: 'required' },
    );

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const bodySent = JSON.parse(call[1].body);
    expect(bodySent.provider).toBe('anthropic');
    expect(bodySent.model).toBe('claude-sonnet-4-5');
    expect(bodySent.tools).toEqual(tools);
    expect(bodySent.tool_choice).toBe('required');
    expect(bodySent.stream).toBe(false);

    // Response is already in OpenAI-shape thanks to the proxy
    expect(result.tool_calls).toHaveLength(1);
    expect(result.tool_calls?.[0].function.name).toBe('log_meal');
  });

  it('throws AnthropicUnavailableError on HTTP 503 (server key missing)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'ANTHROPIC_API_KEY not configured on server', fallback: 'openai' }),
    });

    await expect(
      provider.chat([{ role: 'user', content: 'hi' }]),
    ).rejects.toBeInstanceOf(AnthropicUnavailableError);
  });

  it('throws AnthropicUnavailableError on HTTP 502/503/504', async () => {
    for (const status of [500, 502, 503, 504]) {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status,
        json: async () => ({ error: 'transient' }),
      });
      await expect(
        provider.chat([{ role: 'user', content: 'hi' }]),
      ).rejects.toBeInstanceOf(AnthropicUnavailableError);
    }
  });

  it('throws a plain Error on HTTP 400 (caller bug, not a fallback case)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'malformed messages' }),
    });

    await expect(
      provider.chat([{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow(/Anthropic Proxy error/);

    // But it should NOT be the fallback-specific type
    await expect(
      provider.chat([{ role: 'user', content: 'hi' }]),
    ).rejects.not.toBeInstanceOf(AnthropicUnavailableError);
  });

  it('chatStream throws — streaming is intentionally not implemented', async () => {
    await expect(
      provider.chatStream([{ role: 'user', content: 'hi' }], () => {}),
    ).rejects.toThrow(/does not implement chatStream/);
  });
});
