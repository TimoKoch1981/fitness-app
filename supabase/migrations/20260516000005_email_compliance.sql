-- Phase 4 / PH4: Email-Compliance (Bounce-Handling + Suppression + Unsubscribe)
--
-- DSGVO/CAN-SPAM Pflicht:
--   1. Hard-Bounces nicht wieder anschreiben (sonst Sender-Reputation kaputt)
--   2. Spam-Complaints sofort suppressen (sonst Domain auf Blacklist)
--   3. Unsubscribe-Link in jeder transactional/marketing Email (CAN-SPAM §5)
--   4. Audit-Trail welche Mail wann an wen rausging (DSGVO Art. 30 Verarbeitungs-
--      verzeichnis + Beweissicherung bei Abuse-Komplaints)
--
-- Architektur:
--   email_logs        - jede gesendete Mail (template + recipient + status)
--   email_suppressions - Email-Blacklist (PK email), kein send mehr
--
-- Flow:
--   send-welcome-email
--     -> check email in suppressions? -> skip + log status='suppressed'
--     -> Resend POST -> log status='sent' + message_id
--   resend-webhook (HMAC-validiert)
--     -> event.bounced/complained -> insert suppression + update log
--     -> event.delivered/opened   -> update log (best-effort, not required)
--   email-unsubscribe?token=...
--     -> token=base64url(hmac(email, secret)) -> insert suppression

-- ── email_logs ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resend_message_id   text,                      -- nullable: bei suppressed-skip kein Resend-call
  template            text NOT NULL,             -- 'welcome' | 'password-reset' | etc.
  recipient           text NOT NULL,             -- lowercased email
  status              text NOT NULL CHECK (status IN (
                        'sent', 'suppressed', 'failed',
                        'delivered', 'bounced', 'complained', 'opened', 'clicked'
                      )),
  sent_at             timestamptz NOT NULL DEFAULT now(),
  bounced_at          timestamptz,
  raw_event           jsonb,                     -- webhook payload fuer Audit
  CONSTRAINT email_logs_recipient_format CHECK (recipient = lower(recipient))
);

COMMENT ON TABLE email_logs IS
  'PH4: Audit-Trail jeder ausgehenden Email + Resend-Webhook-Events. DSGVO Art.30.';

CREATE INDEX idx_email_logs_recipient ON email_logs(recipient, sent_at DESC);
CREATE INDEX idx_email_logs_user ON email_logs(user_id, sent_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_email_logs_resend_msg ON email_logs(resend_message_id) WHERE resend_message_id IS NOT NULL;
CREATE INDEX idx_email_logs_status ON email_logs(status, sent_at DESC);

-- RLS: nur service_role darf lesen. User-faehiges Self-Lookup via RPC.
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- User darf eigene Logs sehen (Transparenz: "welche Mails hat FitBuddy mir geschickt?")
CREATE POLICY "email_logs_select_own"
  ON email_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ── email_suppressions ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS email_suppressions (
  email               text PRIMARY KEY,
  reason              text NOT NULL CHECK (reason IN (
                        'hard_bounce', 'soft_bounce_repeat', 'complaint',
                        'manual_unsubscribe', 'admin_block'
                      )),
  added_at            timestamptz NOT NULL DEFAULT now(),
  added_by            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes               text,
  CONSTRAINT email_suppressions_email_lower CHECK (email = lower(email))
);

COMMENT ON TABLE email_suppressions IS
  'PH4: Email-Blacklist. send-welcome-email & andere transactional Mails MUESSEN vorher checken. Eintrag = nie mehr senden.';

CREATE INDEX idx_email_suppressions_added ON email_suppressions(added_at DESC);
CREATE INDEX idx_email_suppressions_reason ON email_suppressions(reason);

ALTER TABLE email_suppressions ENABLE ROW LEVEL SECURITY;

-- User darf SEINE eigene Suppression-Eintraege sehen (Transparenz)
CREATE POLICY "email_suppressions_select_own"
  ON email_suppressions FOR SELECT
  TO authenticated
  USING (
    email = (SELECT lower(email) FROM auth.users WHERE id = auth.uid())
  );

-- ── RPC: is_email_suppressed(text) ─────────────────────────────────────────
-- Edge Functions koennten direkt querien, aber RPC ist test-baar + cached.

CREATE OR REPLACE FUNCTION is_email_suppressed(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM email_suppressions
    WHERE email = lower(trim(p_email))
  );
$$;

COMMENT ON FUNCTION is_email_suppressed(text) IS
  'PH4: Check ob Email auf Suppression-Liste. Edge Functions rufen vor jedem Resend-Call.';

GRANT EXECUTE ON FUNCTION is_email_suppressed(text) TO service_role, authenticated, anon;

-- ── RPC: add_email_suppression (idempotent, service-role-only via SECURITY DEFINER) ──

CREATE OR REPLACE FUNCTION add_email_suppression(
  p_email   text,
  p_reason  text,
  p_notes   text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_email));
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Email cannot be empty';
  END IF;
  IF p_reason NOT IN ('hard_bounce','soft_bounce_repeat','complaint','manual_unsubscribe','admin_block') THEN
    RAISE EXCEPTION 'Invalid reason: %', p_reason;
  END IF;

  INSERT INTO email_suppressions (email, reason, notes)
  VALUES (v_email, p_reason, p_notes)
  ON CONFLICT (email) DO NOTHING;
END;
$$;

COMMENT ON FUNCTION add_email_suppression(text, text, text) IS
  'PH4: Email zur Suppression-Liste hinzufuegen. Idempotent (ON CONFLICT DO NOTHING). Wird von resend-webhook + email-unsubscribe Edge Functions genutzt.';

GRANT EXECUTE ON FUNCTION add_email_suppression(text, text, text) TO service_role;

-- ── RPC: log_email_event (idempotent merge auf resend_message_id) ──────────

CREATE OR REPLACE FUNCTION log_email_event(
  p_resend_message_id text,
  p_status            text,
  p_raw_event         jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_resend_message_id IS NULL OR p_resend_message_id = '' THEN
    RETURN;  -- silently ignore — webhook events ohne msg_id sind unbrauchbar
  END IF;

  UPDATE email_logs
  SET
    status     = p_status,
    bounced_at = CASE WHEN p_status IN ('bounced','complained') THEN now() ELSE bounced_at END,
    raw_event  = COALESCE(p_raw_event, raw_event)
  WHERE resend_message_id = p_resend_message_id;
END;
$$;

COMMENT ON FUNCTION log_email_event(text, text, jsonb) IS
  'PH4: Resend-Webhook ruft das auf, um Email-Log-Status zu aktualisieren (delivered/bounced/...).';

GRANT EXECUTE ON FUNCTION log_email_event(text, text, jsonb) TO service_role;
