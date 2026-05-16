/**
 * email-unsubscribe — User-faehiges Unsubscribe-Endpoint (PH4).
 *
 * Pflicht-Endpoint fuer:
 *   - DSGVO Art. 21 (Widerspruchsrecht)
 *   - CAN-SPAM §5 (Unsubscribe-Link in jeder Mail)
 *   - RFC 8058 (One-Click-Unsubscribe Gmail/Yahoo Pflicht ab 2024)
 *
 * URL-Format:
 *   GET  /functions/v1/email-unsubscribe?email=<email>&token=<hmac>
 *     -> HTML "Du bist abgemeldet" anzeigen
 *   POST /functions/v1/email-unsubscribe?email=<email>&token=<hmac>
 *   POST mit Body "List-Unsubscribe=One-Click"
 *     -> JSON {ok:true} fuer Gmail/Yahoo One-Click
 *
 * Token-Validation:
 *   token MUSS = base64url(hmac_sha256(EMAIL_UNSUBSCRIBE_SECRET, lower(email)))
 *   sein. Verhindert dass Angreifer wahllos Emails abmelden koennen.
 *
 * Idempotenz: add_email_suppression nutzt ON CONFLICT DO NOTHING.
 *
 * Required env vars:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - EMAIL_UNSUBSCRIBE_SECRET    - shared mit send-welcome-email & co.
 */

// ── Token-Helper ──────────────────────────────────────────────────────────
async function expectedToken(email: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(email.toLowerCase().trim()));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

// ── HTML-Responses ────────────────────────────────────────────────────────
const HTML_SUCCESS = `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Abgemeldet | FitBuddy</title>
<style>body{margin:0;padding:40px 20px;background:#f0fdf4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;}
.card{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08);text-align:center;}
h1{margin:0 0 12px;font-size:22px;color:#0d9488;} p{margin:8px 0;line-height:1.6;font-size:15px;color:#4a4a4a;}
.icon{font-size:48px;margin-bottom:8px;}</style></head>
<body><div class="card">
<div class="icon">&#x2713;</div>
<h1>Du bist abgemeldet</h1>
<p>Diese Email-Adresse erhaelt keine weiteren FitBuddy-Benachrichtigungen mehr.</p>
<p style="color:#888;font-size:13px;margin-top:24px;">Du kannst dich jederzeit erneut anmelden, indem du dich auf <a href="https://fudda.de" style="color:#0d9488;">fudda.de</a> einloggst.</p>
</div></body></html>`;

const HTML_ERROR = `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Fehler | FitBuddy</title>
<style>body{margin:0;padding:40px 20px;background:#fef2f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;}
.card{max-width:480px;margin:40px auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08);text-align:center;}
h1{margin:0 0 12px;font-size:22px;color:#dc2626;} p{margin:8px 0;line-height:1.6;font-size:15px;color:#4a4a4a;}
.icon{font-size:48px;margin-bottom:8px;}</style></head>
<body><div class="card">
<div class="icon">&#x26A0;</div>
<h1>Ungueltiger Link</h1>
<p>Dieser Abmelde-Link ist nicht gueltig oder abgelaufen.</p>
<p style="color:#888;font-size:13px;margin-top:24px;">Bitte kontaktiere uns ueber den Feedback-Button in der App, wenn du Hilfe brauchst.</p>
</div></body></html>`;

// ── Handler ───────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const SECRET = Deno.env.get('EMAIL_UNSUBSCRIBE_SECRET') ?? '';

  if (!SUPABASE_URL || !SERVICE_KEY || !SECRET) {
    console.error('[email-unsubscribe] Missing env vars');
    return new Response(HTML_ERROR, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const url = new URL(req.url);
  const email = url.searchParams.get('email')?.toLowerCase().trim() ?? '';
  const providedToken = url.searchParams.get('token') ?? '';

  if (!email || !providedToken) {
    return new Response(HTML_ERROR, {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Token validieren
  const expected = await expectedToken(email, SECRET);
  if (!constantTimeEq(expected, providedToken)) {
    console.warn('[email-unsubscribe] Invalid token for', email);
    return new Response(HTML_ERROR, {
      status: 403,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Suppression eintragen (idempotent via RPC)
  const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/add_email_suppression`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_email: email,
      p_reason: 'manual_unsubscribe',
      p_notes: req.method === 'POST' ? 'One-Click via List-Unsubscribe-Post' : 'User click on email link',
    }),
  });

  if (!rpcRes.ok) {
    const errBody = await rpcRes.text();
    console.error('[email-unsubscribe] RPC failed:', rpcRes.status, errBody);
    return new Response(HTML_ERROR, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  console.log('[email-unsubscribe] Suppressed:', email, 'via', req.method);

  // RFC 8058 One-Click: JSON Response statt HTML
  if (req.method === 'POST') {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(HTML_SUCCESS, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Cache-Control: kein Caching, sonst zeigt CDN spaeter alten Success obwohl Token rotiert sein koennte
      'Cache-Control': 'no-store, max-age=0',
    },
  });
});
