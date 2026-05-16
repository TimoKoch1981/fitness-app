/**
 * resend-webhook — Resend Webhook Endpoint fuer Bounce-/Complaint-Handling (PH4).
 *
 * Empfaengt Webhook-Events von Resend, validiert Svix-Signatur, schreibt
 * Suppression-Eintrag + email_logs-Update in Supabase.
 *
 * Konfiguration (USER-ACTION):
 *   1. Resend-Dashboard -> Webhooks -> Add Endpoint
 *      URL: https://fudda.de/functions/v1/resend-webhook
 *   2. Events abonnieren:
 *      - email.bounced     -> hard_bounce  -> Suppression
 *      - email.complained  -> complaint    -> Suppression
 *      - email.delivered   -> status update (best-effort)
 *      - email.opened      -> status update (best-effort, optional)
 *      - email.clicked     -> status update (best-effort, optional)
 *   3. Webhook-Secret kopieren (`whsec_xxx`)
 *      In /opt/fitbuddy/.env als RESEND_WEBHOOK_SECRET=whsec_xxx setzen
 *
 * Sicherheit:
 *   - Svix-Signatur-Validation (HMAC-SHA256) ist PFLICHT
 *   - Replay-Schutz via timestamp toleranceSeconds=300
 *   - Idempotenz: add_email_suppression + log_email_event sind ON CONFLICT DO NOTHING / UPDATE
 *   - service_role-Key fuer DB-Writes (RLS bypass)
 */

// @ts-expect-error -- Deno runtime imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-expect-error -- Deno runtime imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.40.0';

const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// ── Svix-Signatur-Validation ──────────────────────────────────────────────
//
// Resend nutzt Svix fuer Webhooks. Spezifikation:
//   Header svix-id        : msg_xxxxx (unique message ID)
//   Header svix-timestamp : unix seconds
//   Header svix-signature : "v1,<base64-sig>" (space-delimited bei multi-sig)
//   Signed content        : `${svix_id}.${svix_timestamp}.${body}`
//   Secret-Format         : "whsec_<base64-encoded-secret>"
//   HMAC                  : SHA-256(decode(secret), signed_content) -> base64

/**
 * Decode whsec_<base64> to raw bytes.
 */
function decodeWhsec(secret: string): Uint8Array {
  const raw = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  const bin = atob(raw);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function verifySvixSignature(
  body: string,
  svixId: string | null,
  svixTimestamp: string | null,
  svixSignature: string | null,
  secret: string,
  toleranceSeconds = 300,
): Promise<boolean> {
  if (!svixId || !svixTimestamp || !svixSignature || !secret) return false;

  const ts = parseInt(svixTimestamp);
  if (!ts) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > toleranceSeconds) return false;

  const enc = new TextEncoder();
  const keyBytes = decodeWhsec(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signed = `${svixId}.${svixTimestamp}.${body}`;
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(signed));
  const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));

  // svix-signature: "v1,<sig> v1,<sig>" — accept any match
  const provided = svixSignature.split(' ').map(p => p.trim());
  for (const p of provided) {
    const [version, sigB64] = p.split(',');
    if (version !== 'v1' || !sigB64) continue;
    // Konstantzeit-Vergleich
    if (sigB64.length !== expectedB64.length) continue;
    let mismatch = 0;
    for (let i = 0; i < sigB64.length; i++) {
      mismatch |= sigB64.charCodeAt(i) ^ expectedB64.charCodeAt(i);
    }
    if (mismatch === 0) return true;
  }
  return false;
}

// ── Webhook-Event-Typen ───────────────────────────────────────────────────

interface ResendWebhookEvent {
  type: string;  // 'email.bounced' | 'email.complained' | 'email.delivered' | 'email.opened' | 'email.clicked'
  created_at: string;
  data: {
    email_id: string;
    from?: string;
    to?: string[];
    subject?: string;
    bounce_type?: string;     // 'hard' | 'soft' | 'undetermined' (bei email.bounced)
    bounced?: { reason?: string; type?: string };
  };
}

// ── Mapping Resend-Event -> DB-Status + Suppression-Reason ────────────────

function mapEventToStatus(type: string): string | null {
  switch (type) {
    case 'email.sent': return 'sent';
    case 'email.delivered': return 'delivered';
    case 'email.bounced': return 'bounced';
    case 'email.complained': return 'complained';
    case 'email.opened': return 'opened';
    case 'email.clicked': return 'clicked';
    default: return null;
  }
}

function shouldSuppress(event: ResendWebhookEvent): { reason: string; notes: string } | null {
  if (event.type === 'email.bounced') {
    const bounceType = event.data.bounce_type ?? event.data.bounced?.type ?? 'undetermined';
    if (bounceType === 'hard') {
      return {
        reason: 'hard_bounce',
        notes: `Resend bounce: ${event.data.bounced?.reason ?? 'unspecified'}`,
      };
    }
    return null;  // soft-bounce noch nicht suppressen; Resend macht repeat-soft selbst
  }
  if (event.type === 'email.complained') {
    return { reason: 'complaint', notes: 'Resend spam complaint' };
  }
  return null;
}

// ── Webhook-Handler ───────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!RESEND_WEBHOOK_SECRET) {
    console.error('[resend-webhook] RESEND_WEBHOOK_SECRET not configured');
    return new Response(
      JSON.stringify({ error: 'Webhook not configured. See setup docs.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[resend-webhook] Missing SUPABASE_URL or SERVICE_ROLE_KEY');
    return new Response(
      JSON.stringify({ error: 'Server misconfigured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // 1. Raw body lesen (Signatur ist ueber raw bytes)
  const body = await req.text();

  // 2. Signatur validieren
  const svixId = req.headers.get('svix-id');
  const svixTs = req.headers.get('svix-timestamp');
  const svixSig = req.headers.get('svix-signature');

  const valid = await verifySvixSignature(body, svixId, svixTs, svixSig, RESEND_WEBHOOK_SECRET);
  if (!valid) {
    console.warn('[resend-webhook] Invalid signature', { svixId, svixTs });
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Payload parsen
  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(body) as ResendWebhookEvent;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const messageId = event.data?.email_id;
  const recipient = event.data?.to?.[0]?.toLowerCase().trim();
  console.log('[resend-webhook]', event.type, messageId, recipient);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 4. Log-Status updaten (best-effort)
  const status = mapEventToStatus(event.type);
  if (status && messageId) {
    const { error: logErr } = await supabase.rpc('log_email_event', {
      p_resend_message_id: messageId,
      p_status: status,
      p_raw_event: event,
    });
    if (logErr) console.error('[resend-webhook] log_email_event failed:', logErr.message);
  }

  // 5. Suppression bei bounce/complaint
  const supp = shouldSuppress(event);
  if (supp && recipient) {
    const { error: suppErr } = await supabase.rpc('add_email_suppression', {
      p_email: recipient,
      p_reason: supp.reason,
      p_notes: supp.notes,
    });
    if (suppErr) {
      console.error('[resend-webhook] add_email_suppression failed:', suppErr.message);
      // Trotzdem 200 zurueck — Webhook-Retry hilft nicht bei DB-Schema-Problemen
    } else {
      console.log('[resend-webhook] Suppressed:', recipient, supp.reason);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
