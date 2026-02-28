/**
 * Supabase Edge Function: spotify-proxy
 *
 * Server-side proxy for Spotify OAuth token exchange.
 * Keeps SPOTIFY_CLIENT_SECRET on the server — never exposed to the frontend.
 *
 * Endpoints (via `action` field):
 * - token_exchange: Exchange authorization code for access + refresh tokens
 * - token_refresh: Refresh an expired access token
 *
 * @see https://developer.spotify.com/documentation/web-api/tutorials/code-flow
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';

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

  // ── Load secrets ──────────────────────────────────────────────────────
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    return new Response(JSON.stringify({ error: 'Spotify credentials not configured on server' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // ── Token Exchange (code → tokens) ────────────────────────────────
    if (action === 'token_exchange') {
      const { code, redirect_uri } = body;

      if (!code || !redirect_uri) {
        return new Response(JSON.stringify({ error: 'Missing code or redirect_uri' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
      });

      const tokenRes = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: params.toString(),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        console.error('[spotify-proxy] Token exchange failed:', tokenData);
        return new Response(JSON.stringify({
          error: 'Token exchange failed',
          details: tokenData.error_description ?? tokenData.error,
        }), {
          status: tokenRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Return tokens (access_token, refresh_token, expires_in, scope)
      // NEVER return client_secret!
      return new Response(JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Token Refresh ─────────────────────────────────────────────────
    if (action === 'token_refresh') {
      const { refresh_token } = body;

      if (!refresh_token) {
        return new Response(JSON.stringify({ error: 'Missing refresh_token' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
      });

      const tokenRes = await fetch(SPOTIFY_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: params.toString(),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok) {
        console.error('[spotify-proxy] Token refresh failed:', tokenData);
        return new Response(JSON.stringify({
          error: 'Token refresh failed',
          details: tokenData.error_description ?? tokenData.error,
        }), {
          status: tokenRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? refresh_token, // Spotify may or may not return a new one
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
        scope: tokenData.scope,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Unknown action ──────────────────────────────────────────────────
    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[spotify-proxy] Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
