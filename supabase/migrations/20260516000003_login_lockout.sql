-- Phase 4 / PH1: Login-Lockout nach 5 Fehlversuchen (15 min Sperre)
--
-- Strategie: Tracking pro Email-Adresse (nicht IP), weil VPN/Mobile-IPs
-- wechseln. Lockout-Window 15 min. Reset bei erfolgreichem Login.
--
-- Frontend nutzt RPC check_login_attempts(email) vor jedem SignIn-Versuch.
-- Bei is_locked=true zeigt UI "Konto gesperrt — versuche es in X Minuten".

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  email                 text PRIMARY KEY,
  attempt_count         integer NOT NULL DEFAULT 0,
  first_attempt_at      timestamptz NOT NULL DEFAULT now(),
  last_attempt_at       timestamptz NOT NULL DEFAULT now(),
  locked_until          timestamptz
);

COMMENT ON TABLE failed_login_attempts IS
  'Lockout-State pro Email. 5 Fehlversuche -> 15 min Sperre. Reset by RPC.';

CREATE INDEX idx_failed_login_locked ON failed_login_attempts(locked_until)
  WHERE locked_until IS NOT NULL;

-- RLS: Niemand darf direkt lesen/schreiben. Nur via RPC (SECURITY DEFINER).
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- ── RPC: Login-Attempt registrieren (called after failed login) ────────

CREATE OR REPLACE FUNCTION register_failed_login(p_email text)
RETURNS TABLE(attempts integer, is_locked boolean, locked_until timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_now timestamptz := now();
  v_record record;
  v_max_attempts constant integer := 5;
  v_lockout_minutes constant integer := 15;
  v_window_minutes constant integer := 30;  -- attempts within this reset on success or expire
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RETURN QUERY SELECT 0, false, NULL::timestamptz;
    RETURN;
  END IF;

  INSERT INTO failed_login_attempts (email, attempt_count, first_attempt_at, last_attempt_at)
  VALUES (v_email, 1, v_now, v_now)
  ON CONFLICT (email) DO UPDATE
  SET
    -- Reset window if last attempt was >30 min ago
    attempt_count = CASE
      WHEN failed_login_attempts.last_attempt_at < v_now - (v_window_minutes || ' minutes')::interval
        THEN 1
      ELSE failed_login_attempts.attempt_count + 1
    END,
    first_attempt_at = CASE
      WHEN failed_login_attempts.last_attempt_at < v_now - (v_window_minutes || ' minutes')::interval
        THEN v_now
      ELSE failed_login_attempts.first_attempt_at
    END,
    last_attempt_at = v_now,
    locked_until = CASE
      WHEN failed_login_attempts.attempt_count + 1 >= v_max_attempts
        THEN v_now + (v_lockout_minutes || ' minutes')::interval
      ELSE failed_login_attempts.locked_until
    END;

  SELECT * INTO v_record FROM failed_login_attempts WHERE email = v_email;

  RETURN QUERY SELECT
    v_record.attempt_count,
    (v_record.locked_until IS NOT NULL AND v_record.locked_until > v_now),
    v_record.locked_until;
END;
$$;

COMMENT ON FUNCTION register_failed_login(text) IS
  'Increment failed-login counter. Locks for 15 min after 5 attempts within 30-min window.';

GRANT EXECUTE ON FUNCTION register_failed_login(text) TO anon, authenticated;

-- ── RPC: Lockout-Status pruefen (called BEFORE attempting login) ──────

CREATE OR REPLACE FUNCTION check_login_locked(p_email text)
RETURNS TABLE(is_locked boolean, locked_until timestamptz, remaining_attempts integer)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_now timestamptz := now();
  v_record record;
  v_max_attempts constant integer := 5;
BEGIN
  SELECT * INTO v_record FROM failed_login_attempts WHERE email = v_email;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::timestamptz, v_max_attempts;
    RETURN;
  END IF;
  RETURN QUERY SELECT
    (v_record.locked_until IS NOT NULL AND v_record.locked_until > v_now),
    v_record.locked_until,
    GREATEST(0, v_max_attempts - v_record.attempt_count);
END;
$$;

GRANT EXECUTE ON FUNCTION check_login_locked(text) TO anon, authenticated;

-- ── RPC: Reset Lockout (called after successful login) ───────────────

CREATE OR REPLACE FUNCTION reset_failed_login(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM failed_login_attempts WHERE email = lower(trim(p_email));
END;
$$;

GRANT EXECUTE ON FUNCTION reset_failed_login(text) TO anon, authenticated;
