-- Phase 3 / PL1b: Subscription-Schema fuer Stripe-Integration
--
-- Speichert Stripe-Subscription-Status pro User. Source-of-Truth ist Stripe;
-- diese Tabelle ist nur Cache + Plan-Tier-Check fuer schnellen Frontend-Zugriff.
-- Sync via Webhook (siehe supabase/functions/stripe-webhook/).

CREATE TYPE plan_tier AS ENUM ('free', 'pro', 'elite');
CREATE TYPE subscription_status AS ENUM (
  'trialing', 'active', 'past_due', 'canceled', 'incomplete',
  'incomplete_expired', 'unpaid', 'paused'
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id       text UNIQUE,                          -- cus_xxx
  stripe_subscription_id   text UNIQUE,                          -- sub_xxx
  status                   subscription_status NOT NULL DEFAULT 'trialing',
  plan_tier                plan_tier NOT NULL DEFAULT 'free',
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean NOT NULL DEFAULT false,
  trial_end                timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE subscriptions IS
  'Subscription-Cache fuer Stripe. Source-of-Truth ist Stripe; sync via webhook.';

-- RLS: User darf nur eigene Subscription lesen
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert/Update nur via service_role (Webhook). Keine User-Inserts.
-- (Default: keine FOR INSERT/UPDATE Policy = nur service_role kann.)

CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan_tier ON subscriptions(plan_tier);

-- Trigger: updated_at automatisch setzen
CREATE OR REPLACE FUNCTION set_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_subscriptions_updated_at();

-- ── Helper: aktuellen Plan-Tier eines Users abrufen (used in RLS-Policies fuer Feature-Gating) ─

CREATE OR REPLACE FUNCTION get_user_plan_tier(p_user_id uuid)
RETURNS plan_tier
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier plan_tier;
BEGIN
  SELECT plan_tier INTO v_tier
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status IN ('trialing', 'active');
  RETURN COALESCE(v_tier, 'free');
END;
$$;

COMMENT ON FUNCTION get_user_plan_tier(uuid) IS
  'Returns the active plan tier for a user. Used by RLS policies + feature flags. Falls back to "free".';

GRANT EXECUTE ON FUNCTION get_user_plan_tier(uuid) TO authenticated;

-- ── Payments-Audit-Log ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_events (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_event_id      text UNIQUE NOT NULL,                    -- evt_xxx
  event_type           text NOT NULL,                            -- 'invoice.paid', 'customer.subscription.updated', etc.
  amount_cents         integer,                                  -- nullable for non-payment events
  currency             text,                                     -- 'eur', 'usd'
  raw_payload          jsonb NOT NULL,
  processed_at         timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE payment_events IS
  'Audit-Log aller eingehenden Stripe-Webhook-Events. Idempotenz via stripe_event_id.';

CREATE INDEX idx_payment_events_user ON payment_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_payment_events_type ON payment_events(event_type);

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- User sieht eigene Payment-Events (fuer Receipt-Anzeige)
CREATE POLICY "payment_events_select_own"
  ON payment_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ── AI-Quota-Tracking (PL2 Foundation) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_user_quotas (
  user_id               uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start          date NOT NULL DEFAULT date_trunc('month', now())::date,
  tokens_consumed       bigint NOT NULL DEFAULT 0,
  cost_cents_x100       bigint NOT NULL DEFAULT 0,
  last_request_at       timestamptz
);

COMMENT ON TABLE ai_user_quotas IS
  'Monthly AI usage per user. Reset by trigger when period_start < current month.';

ALTER TABLE ai_user_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_user_quotas_select_own"
  ON ai_user_quotas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RPC: Check + Increment Quota atomar (verwendet von ai-proxy)
CREATE OR REPLACE FUNCTION check_and_increment_ai_quota(
  p_user_id uuid,
  p_tokens integer,
  p_cost_cents_x100 integer
)
RETURNS TABLE(allowed boolean, reason text, tokens_used bigint, tier plan_tier)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier plan_tier;
  v_quota record;
  v_token_limit bigint;
  v_current_month date := date_trunc('month', now())::date;
BEGIN
  v_tier := get_user_plan_tier(p_user_id);

  -- Plan-spezifische Limits (in Tokens pro Monat)
  v_token_limit := CASE v_tier
    WHEN 'free' THEN 100000     -- ~50 chats/Monat
    WHEN 'pro' THEN 1000000     -- ~500 chats/Monat
    WHEN 'elite' THEN 10000000  -- praktisch unlimited
  END;

  -- Quota-Zeile lazy initialisieren oder ggf. resetten
  INSERT INTO ai_user_quotas (user_id, period_start, tokens_consumed, cost_cents_x100, last_request_at)
  VALUES (p_user_id, v_current_month, 0, 0, now())
  ON CONFLICT (user_id) DO UPDATE
  SET period_start = CASE
    WHEN ai_user_quotas.period_start < v_current_month
    THEN v_current_month
    ELSE ai_user_quotas.period_start
  END,
  tokens_consumed = CASE
    WHEN ai_user_quotas.period_start < v_current_month
    THEN 0
    ELSE ai_user_quotas.tokens_consumed
  END,
  cost_cents_x100 = CASE
    WHEN ai_user_quotas.period_start < v_current_month
    THEN 0
    ELSE ai_user_quotas.cost_cents_x100
  END;

  SELECT * INTO v_quota FROM ai_user_quotas WHERE user_id = p_user_id;

  -- Quota-Check
  IF v_quota.tokens_consumed + p_tokens > v_token_limit THEN
    RETURN QUERY SELECT false, 'quota_exceeded'::text, v_quota.tokens_consumed, v_tier;
    RETURN;
  END IF;

  -- Increment
  UPDATE ai_user_quotas
  SET tokens_consumed = tokens_consumed + p_tokens,
      cost_cents_x100 = cost_cents_x100 + p_cost_cents_x100,
      last_request_at = now()
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT true, 'ok'::text, (v_quota.tokens_consumed + p_tokens), v_tier;
END;
$$;

COMMENT ON FUNCTION check_and_increment_ai_quota IS
  'Atomic quota-check + increment fuer ai-proxy. Returns allowed/reason/tokens_used/tier.';

GRANT EXECUTE ON FUNCTION check_and_increment_ai_quota TO authenticated, anon;
