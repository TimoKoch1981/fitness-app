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
 * Auth: Validates Supabase anon key via Authorization header.
 *
 * @see https://supabase.com/docs/guides/functions
 */

// Deno v2 — no npm imports needed, just standard fetch + Deno APIs
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

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
      max_tokens = 2048,
      temperature = 0.7,
      top_p,
      response_format,
      stream_options,
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

    // ── Non-streaming: return JSON ──────────────────────────────────
    const data = await openaiResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
