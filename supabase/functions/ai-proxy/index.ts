/**
 * Supabase Edge Function: ai-proxy
 *
 * Server-side proxy for OpenAI API calls.
 * Keeps the OPENAI_API_KEY on the server — never exposed to the frontend.
 *
 * Supports:
 * - Chat completions (streaming + non-streaming)
 * - Vision (base64 image in messages)
 * - JSON response_format
 *
 * Security:
 * - Auth: Validates Supabase JWT via Authorization header
 * - Rate Limiting: 60 requests per user per hour (in-memory)
 * - Token Logging: Logs token usage per request (console.log)
 *
 * @see https://supabase.com/docs/guides/functions
 */

// Deno v2 — no npm imports needed, just standard fetch + Deno APIs
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Expose-Headers': 'X-Token-Count, Retry-After, X-Provider',
};

const OPENAI_BASE_URL = 'https://api.openai.com/v1';
const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION = '2023-06-01';

// ── Rate Limiting ─────────────────────────────────────────────────────
const RATE_LIMIT_MAX_REQUESTS = 60;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Decode a JWT payload without verification (auth is already handled by
 * Supabase Kong gateway — we only need to extract the `sub` claim).
 */
function extractUserIdFromJWT(token: string): string | null {
  try {
    const parts = token.replace(/^Bearer\s+/i, '').split('.');
    if (parts.length !== 3) return null;
    // Base64url → Base64 → decode (add padding for atob compatibility)
    let payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    // Add padding if needed
    while (payload.length % 4 !== 0) payload += '=';
    const decoded = atob(payload);
    const json = JSON.parse(decoded);
    return json.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * Check rate limit for a given user ID.
 * Returns { allowed: true } or { allowed: false, retryAfterSeconds }.
 */
function checkRateLimit(userId: string): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  // Clean up expired entry
  if (entry && now >= entry.resetAt) {
    rateLimitMap.delete(userId);
  }

  const current = rateLimitMap.get(userId);

  if (!current) {
    // First request in this window
    rateLimitMap.set(userId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((current.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  // Increment counter
  current.count++;
  return { allowed: true };
}

/**
 * Periodically clean up expired rate limit entries to prevent memory leaks.
 * Runs every 10 minutes.
 */
setInterval(() => {
  const now = Date.now();
  for (const [userId, entry] of rateLimitMap) {
    if (now >= entry.resetAt) {
      rateLimitMap.delete(userId);
    }
  }
}, 10 * 60 * 1000);

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Validate auth ───────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Extract user ID from JWT for rate limiting ────────────────────
  // Note: Supabase anon key JWT has no 'sub' claim, so we fallback to 'anon'
  const userId = extractUserIdFromJWT(authHeader) ?? 'anon';

  // ── Rate limit check ──────────────────────────────────────────────
  const rateLimitResult = checkRateLimit(userId);
  if (!rateLimitResult.allowed) {
    console.warn(`[ai-proxy] Rate limit exceeded for user ${userId}`);
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. Max 60 requests per hour.' }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.retryAfterSeconds),
        },
      },
    );
  }

  try {
    const body = await req.json();
    const {
      messages,
      model = 'gpt-4o-mini',
      stream = false,
      max_tokens = 8192,
      temperature = 0.7,
      top_p,
      response_format,
      stream_options,
      tools,
      tool_choice,
      provider = 'openai', // NEW: 'openai' | 'anthropic'
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Branch: Anthropic ──────────────────────────────────────────────
    // Anthropic only supports non-streaming for our use case (SystemAgent).
    // If streaming is requested with Anthropic, fall back to OpenAI silently.
    if (provider === 'anthropic' && !stream) {
      const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
      if (!anthropicKey) {
        // Key not configured → caller should fall back to OpenAI client-side
        return new Response(
          JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured on server', fallback: 'openai' }),
          {
            status: 503,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'X-Provider': 'anthropic-missing',
            },
          },
        );
      }
      return await handleAnthropicRequest({
        anthropicKey,
        userId,
        model,
        messages,
        max_tokens,
        temperature,
        tools,
        tool_choice,
      });
    }

    // ── Get OpenAI key (default path) ─────────────────────────────────
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured on server' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Build OpenAI request ────────────────────────────────────────
    const openaiBody: Record<string, unknown> = {
      model,
      messages,
      max_tokens,
      temperature,
      stream,
    };

    if (top_p !== undefined) openaiBody.top_p = top_p;
    if (response_format) openaiBody.response_format = response_format;
    if (stream && stream_options) openaiBody.stream_options = stream_options;
    if (tools && Array.isArray(tools) && tools.length > 0) {
      openaiBody.tools = tools;
      if (tool_choice !== undefined) openaiBody.tool_choice = tool_choice;
    }

    const openaiResponse = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify(openaiBody),
    });

    // ── Handle errors from OpenAI ───────────────────────────────────
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      const errorMsg = (errorData as { error?: { message?: string } }).error?.message
        ?? `OpenAI HTTP ${openaiResponse.status}`;
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: openaiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Streaming: pipe SSE through ─────────────────────────────────
    if (stream && openaiResponse.body) {
      // Note: Token usage for streaming requests is logged client-side
      // or via stream_options.include_usage when supported.
      console.log(`[ai-proxy] Streaming request | user=${userId} | model=${model}`);
      return new Response(openaiResponse.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // ── Non-streaming: return JSON + log token usage ────────────────
    const data = await openaiResponse.json();

    // Log token usage from OpenAI response (usage.total_tokens)
    const usage = (data as { usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }).usage;
    if (usage) {
      console.log(
        `[ai-proxy] Token usage | user=${userId} | model=${model} | ` +
        `prompt=${usage.prompt_tokens ?? 0} | completion=${usage.completion_tokens ?? 0} | ` +
        `total=${usage.total_tokens ?? 0}`
      );
    }

    // Include token count as response header for client-side tracking
    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': 'application/json',
    };
    if (usage?.total_tokens) {
      responseHeaders['X-Token-Count'] = String(usage.total_tokens);
    }

    responseHeaders['X-Provider'] = 'openai';
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ── Anthropic Handler ────────────────────────────────────────────────────
//
// Anthropic's Messages API differs from OpenAI in three places:
//   1. The system message is a top-level `system` field (not a message role)
//   2. Tools use `input_schema` (not `parameters` wrapped in a function object)
//   3. The response has `content[]` blocks with type 'text' | 'tool_use' instead
//      of `choices[].message.tool_calls`
//
// We translate the OpenAI-shaped request to Anthropic-shape, fire the call,
// then translate the response BACK to OpenAI shape so the frontend's existing
// sseParser / parseCompletionResponse path keeps working unchanged.

interface AnthropicRequestArgs {
  anthropicKey: string;
  userId: string;
  model: string;
  messages: Array<{ role: string; content: unknown }>;
  max_tokens: number;
  temperature: number;
  tools?: Array<{ type: string; function: { name: string; description?: string; parameters: unknown } }>;
  tool_choice?: string | { type: string; function?: { name: string } };
}

async function handleAnthropicRequest(args: AnthropicRequestArgs): Promise<Response> {
  const { anthropicKey, userId, model, messages, max_tokens, temperature, tools, tool_choice } = args;

  // ── Split out system message(s) ────────────────────────────────────
  const systemParts: string[] = [];
  const userAssistantMessages: Array<{ role: string; content: unknown }> = [];
  for (const m of messages) {
    if (m.role === 'system' && typeof m.content === 'string') {
      systemParts.push(m.content);
    } else if (m.role === 'user' || m.role === 'assistant') {
      userAssistantMessages.push(m);
    }
  }

  // ── Map OpenAI tools → Anthropic tools ─────────────────────────────
  const anthropicTools = (tools ?? [])
    .filter((t) => t.type === 'function')
    .map((t) => ({
      name: t.function.name,
      description: t.function.description ?? '',
      input_schema: t.function.parameters,
    }));

  // ── Map OpenAI tool_choice → Anthropic tool_choice ────────────────
  let anthropicToolChoice: Record<string, unknown> | undefined;
  if (tool_choice === 'required') {
    anthropicToolChoice = { type: 'any' };
  } else if (tool_choice === 'auto') {
    anthropicToolChoice = { type: 'auto' };
  } else if (tool_choice === 'none') {
    anthropicToolChoice = undefined; // no tools usage — Anthropic uses no field for this; just omit tools
  } else if (typeof tool_choice === 'object' && tool_choice?.type === 'function') {
    anthropicToolChoice = { type: 'tool', name: tool_choice.function?.name };
  }

  // ── Build Anthropic request ────────────────────────────────────────
  const anthropicBody: Record<string, unknown> = {
    model,
    messages: userAssistantMessages,
    max_tokens,
    temperature,
  };
  if (systemParts.length > 0) {
    anthropicBody.system = systemParts.join('\n\n');
  }
  if (anthropicTools.length > 0) {
    anthropicBody.tools = anthropicTools;
    if (anthropicToolChoice) anthropicBody.tool_choice = anthropicToolChoice;
  }

  console.log(`[ai-proxy] Anthropic request | user=${userId} | model=${model} | tools=${anthropicTools.length}`);

  const anthropicResponse = await fetch(`${ANTHROPIC_BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(anthropicBody),
  });

  if (!anthropicResponse.ok) {
    const errorData = await anthropicResponse.json().catch(() => ({}));
    const errorMsg = (errorData as { error?: { message?: string } }).error?.message
      ?? `Anthropic HTTP ${anthropicResponse.status}`;
    console.warn(`[ai-proxy] Anthropic error: ${errorMsg}`);
    return new Response(
      JSON.stringify({ error: errorMsg, fallback: 'openai' }),
      {
        status: anthropicResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Provider': 'anthropic-error',
        },
      },
    );
  }

  const anthropicData = await anthropicResponse.json() as {
    model?: string;
    content?: Array<{ type: string; text?: string; id?: string; name?: string; input?: unknown }>;
    stop_reason?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  // ── Map Anthropic response → OpenAI shape ─────────────────────────
  const textBlocks = (anthropicData.content ?? [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('');

  const toolUseBlocks = (anthropicData.content ?? []).filter((b) => b.type === 'tool_use');
  const tool_calls = toolUseBlocks.length > 0
    ? toolUseBlocks.map((b) => ({
        id: b.id ?? '',
        type: 'function' as const,
        function: {
          name: b.name ?? '',
          arguments: JSON.stringify(b.input ?? {}),
        },
      }))
    : undefined;

  const promptTokens = anthropicData.usage?.input_tokens ?? 0;
  const completionTokens = anthropicData.usage?.output_tokens ?? 0;
  const totalTokens = promptTokens + completionTokens;

  console.log(
    `[ai-proxy] Anthropic usage | user=${userId} | model=${anthropicData.model ?? model} | ` +
    `prompt=${promptTokens} | completion=${completionTokens} | total=${totalTokens}`
  );

  const openaiShapedResponse = {
    model: anthropicData.model ?? model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant' as const,
        content: textBlocks,
        ...(tool_calls ? { tool_calls } : {}),
      },
      finish_reason: anthropicData.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
    }],
    usage: {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
    },
  };

  return new Response(JSON.stringify(openaiShapedResponse), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-Provider': 'anthropic',
      'X-Token-Count': String(totalTokens),
    },
  });
}
