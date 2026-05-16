/**
 * stripe-webhook — Stripe Webhook Endpoint fuer Subscription-Sync.
 *
 * Empfaengt Webhook-Events von Stripe, validiert Signatur, schreibt
 * Subscription-Status + Payment-Audit-Log in Supabase.
 *
 * Konfiguration (USER-ACTION):
 *   1. Stripe-Account anlegen
 *   2. Webhook-Endpoint im Stripe-Dashboard: https://fudda.de/functions/v1/stripe-webhook
 *   3. Events abonnieren: customer.subscription.*, invoice.payment_succeeded,
 *      invoice.payment_failed, customer.deleted
 *   4. Webhook-Secret als env-var setzen: STRIPE_WEBHOOK_SECRET=whsec_xxx
 *   5. STRIPE_SECRET_KEY als env-var setzen: sk_live_xxx (oder sk_test_xxx fuer Dev)
 *   6. Price-IDs in env-var: STRIPE_PRICE_PRO=price_xxx, STRIPE_PRICE_ELITE=price_xxx
 *
 * Sicherheit:
 *   - Signatur-Validation (HMAC-SHA256) ist PFLICHT — sonst kann jeder Webhook simulieren
 *   - Idempotenz via stripe_event_id (UNIQUE in payment_events)
 *   - service_role-Key fuer DB-Writes (RLS bypass)
 *
 * Source-of-Truth: Stripe. Diese Function ist nur Sync-Layer.
 */

// @ts-expect-error -- Deno runtime imports
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
// @ts-expect-error -- Deno runtime imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.40.0';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// ── Stripe-Signatur-Validation ────────────────────────────────────────────

/**
 * Stripe-Signatur per HMAC-SHA256 mit shared Secret.
 * Format: `t=timestamp,v1=signature`
 *
 * Toleranz: Default 5 min (rejects replay attacks).
 */
async function verifyStripeSignature(
  body: string,
  signatureHeader: string | null,
  secret: string,
  toleranceSeconds = 300,
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(',').map(p => {
      const [k, v] = p.split('=');
      return [k, v];
    }),
  );

  const timestamp = parseInt(parts.t || '0');
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  // Replay-Schutz
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) return false;

  // HMAC-Berechnung
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const computed = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${body}`));
  const computedHex = Array.from(new Uint8Array(computed))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Konstantzeit-Vergleich
  if (computedHex.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computedHex.length; i++) {
    mismatch |= computedHex.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Webhook-Handler ───────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!STRIPE_WEBHOOK_SECRET || !STRIPE_SECRET_KEY) {
    console.error('[stripe-webhook] Missing env: STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY');
    return new Response(
      JSON.stringify({ error: 'Webhook not configured. See setup docs.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  // Signatur validieren — bei Fehler 400 (Stripe wird retryen wenn 4xx/5xx)
  const validSig = await verifyStripeSignature(body, sig, STRIPE_WEBHOOK_SECRET);
  if (!validSig) {
    console.warn('[stripe-webhook] Invalid signature');
    return new Response('Invalid signature', { status: 400 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const eventId = event.id as string;
  const eventType = event.type as string;
  const eventData = (event.data as { object: Record<string, unknown> })?.object ?? {};

  // ── Audit-Log (idempotency via UNIQUE auf stripe_event_id) ──
  const { error: auditErr } = await supabase
    .from('payment_events')
    .insert({
      user_id: extractUserId(eventData),
      stripe_event_id: eventId,
      event_type: eventType,
      amount_cents: (eventData.amount_paid as number) ?? (eventData.amount as number) ?? null,
      currency: (eventData.currency as string) ?? null,
      raw_payload: event,
    });

  if (auditErr) {
    // Duplicate? Treat as already-processed (Stripe retries are normal)
    if (auditErr.code === '23505') {
      console.log('[stripe-webhook] Duplicate event ignored:', eventId);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    console.error('[stripe-webhook] Audit insert failed:', auditErr);
  }

  // ── Event-Dispatch ──
  try {
    switch (eventType) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(supabase, eventData);
        break;

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        // Payment-Status wird sich aus subscription.updated ergeben — hier nur Audit-Log
        break;

      case 'customer.deleted':
        await handleCustomerDeleted(supabase, eventData);
        break;

      default:
        console.log('[stripe-webhook] Unhandled event type:', eventType);
    }
  } catch (err) {
    console.error('[stripe-webhook] Handler error:', err);
    return new Response(JSON.stringify({ error: 'Handler failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────

function extractUserId(eventData: Record<string, unknown>): string | null {
  const metadata = (eventData.metadata as Record<string, string>) ?? {};
  return metadata.user_id ?? metadata.supabase_user_id ?? null;
}

async function syncSubscription(
  supabase: ReturnType<typeof createClient>,
  sub: Record<string, unknown>,
): Promise<void> {
  const userId = extractUserId(sub);
  if (!userId) {
    console.warn('[stripe-webhook] No user_id in subscription metadata:', sub.id);
    return;
  }

  // Price-ID → Plan-Tier-Mapping
  const items = (sub.items as { data: Array<{ price: { id: string } }> })?.data ?? [];
  const priceId = items[0]?.price?.id ?? '';
  const planTier = mapPriceIdToTier(priceId);

  await supabase.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: sub.id as string,
    status: sub.status as string,
    plan_tier: planTier,
    current_period_start: sub.current_period_start
      ? new Date((sub.current_period_start as number) * 1000).toISOString()
      : null,
    current_period_end: sub.current_period_end
      ? new Date((sub.current_period_end as number) * 1000).toISOString()
      : null,
    cancel_at_period_end: (sub.cancel_at_period_end as boolean) ?? false,
    trial_end: sub.trial_end
      ? new Date((sub.trial_end as number) * 1000).toISOString()
      : null,
  }, { onConflict: 'user_id' });
}

async function handleCustomerDeleted(
  supabase: ReturnType<typeof createClient>,
  customer: Record<string, unknown>,
): Promise<void> {
  const customerId = customer.id as string;
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      plan_tier: 'free',
    })
    .eq('stripe_customer_id', customerId);
}

function mapPriceIdToTier(priceId: string): 'free' | 'pro' | 'elite' {
  // Price-IDs aus env vars
  if (priceId === Deno.env.get('STRIPE_PRICE_PRO')) return 'pro';
  if (priceId === Deno.env.get('STRIPE_PRICE_ELITE')) return 'elite';
  return 'free';
}
