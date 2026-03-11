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
  'Access-Control-Expose-Headers': 'X-Token-Count, Retry-After',
};

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

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

  // ── Get OpenAI key from server secrets ──────────────────────────────
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured on server' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
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
    } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
        status: 400,
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
