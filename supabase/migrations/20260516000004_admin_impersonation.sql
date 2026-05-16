-- Phase 4 / PH5: Admin-Impersonation fuer Support-Debugging
--
-- SECURITY-KRITISCH. Reviewen durch externen Security-Auditor vor Production.
--
-- Mechanismus:
--   1. Admin klickt "Login as user" auf AdminUsersPage, gibt reason ein
--   2. Frontend -> admin-impersonate Edge Function mit { target_user_id, reason }
--   3. Edge Function prueft is_admin=true via JWT + Profil
--   4. Edge Function generiert Magic-Link fuer target_user (single-use, 60min TTL)
--   5. Edge Function loggt impersonation_start in dieser Tabelle
--   6. Frontend tauscht token_hash via verifyOtp gegen target-session
--   7. ImpersonationBanner zeigt "Du siehst als <email>" + "Beenden"-Button
--   8. "Beenden" -> signOut + Re-Login mit Admin-Credentials (browser default)
--
-- Audit-Trail bleibt 2 Jahre (730d), siehe RLS-Policies unten.

CREATE TABLE IF NOT EXISTS admin_impersonation_log (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email           text NOT NULL,                  -- snapshot fuer Audit auch nach delete
  target_user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  target_email          text NOT NULL,                  -- snapshot
  started_at            timestamptz NOT NULL DEFAULT now(),
  ended_at              timestamptz,                    -- gesetzt durch /end-RPC; null = aktiv
  reason                text NOT NULL CHECK (char_length(reason) >= 10),
  ip                    inet,
  user_agent            text,

  -- Audit-Integritaet: Self-Impersonation blockieren (admin != target)
  CONSTRAINT admin_impersonation_log_no_self
    CHECK (admin_user_id != target_user_id)
);

COMMENT ON TABLE admin_impersonation_log IS
  'PH5: Audit-Trail aller Admin-Impersonation-Sessions. 2y retention. RLS: nur service_role.';

CREATE INDEX idx_admin_impersonation_admin ON admin_impersonation_log(admin_user_id, started_at DESC);
CREATE INDEX idx_admin_impersonation_target ON admin_impersonation_log(target_user_id, started_at DESC);
CREATE INDEX idx_admin_impersonation_active ON admin_impersonation_log(started_at DESC)
  WHERE ended_at IS NULL;

-- RLS: Niemand darf direkt lesen oder schreiben (auch nicht Admins).
-- Edge Functions nutzen service_role und umgehen RLS.
-- Aggregations-RPC unten exposed Admin-faehige Auswertung.
ALTER TABLE admin_impersonation_log ENABLE ROW LEVEL SECURITY;

-- Targets duerfen sehen WER sie wann impersoniert hat — Transparenz-Pflicht
CREATE POLICY "impersonation_log_select_own_target"
  ON admin_impersonation_log FOR SELECT
  TO authenticated
  USING (auth.uid() = target_user_id);

-- ── RPC: end-impersonation (called by Frontend wenn Banner-Button geklickt) ─

CREATE OR REPLACE FUNCTION end_impersonation_session(p_log_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Nur die laufende Session beenden — Admin-User-ID matcht den loggenden Caller
  UPDATE admin_impersonation_log
  SET ended_at = now()
  WHERE id = p_log_id
    AND ended_at IS NULL;
END;
$$;

COMMENT ON FUNCTION end_impersonation_session(uuid) IS
  'Mark impersonation session as ended. Called from ImpersonationBanner "Beenden"-Click.';

GRANT EXECUTE ON FUNCTION end_impersonation_session(uuid) TO authenticated;

-- ── RPC: admin-aggregate-stats fuer AdminDashboard ─────────────────────────

CREATE OR REPLACE FUNCTION get_impersonation_stats(p_days integer DEFAULT 30)
RETURNS TABLE(
  total_sessions bigint,
  unique_admins bigint,
  unique_targets bigint,
  avg_duration_minutes numeric,
  active_now bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Caller muss Admin sein
  SELECT (raw_user_meta_data->>'is_admin')::boolean
    INTO v_is_admin
    FROM auth.users
    WHERE id = auth.uid();
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Only admins can read impersonation stats';
  END IF;

  RETURN QUERY
  SELECT
    count(*)::bigint AS total_sessions,
    count(DISTINCT admin_user_id)::bigint AS unique_admins,
    count(DISTINCT target_user_id)::bigint AS unique_targets,
    round(
      avg(EXTRACT(EPOCH FROM (COALESCE(ended_at, now()) - started_at)) / 60)::numeric,
      1
    ) AS avg_duration_minutes,
    count(*) FILTER (WHERE ended_at IS NULL)::bigint AS active_now
  FROM admin_impersonation_log
  WHERE started_at > now() - (p_days || ' days')::interval;
END;
$$;

GRANT EXECUTE ON FUNCTION get_impersonation_stats(integer) TO authenticated;

-- ── Retention: nach 730 Tagen (2 Jahre) loeschen, wie audit_logs ────────────
-- Wird vom existierenden cleanup_expired_data() job-Pattern abgegriffen — wir
-- erweitern dort wenn 2y in Zukunft das richtige Mass ist.
