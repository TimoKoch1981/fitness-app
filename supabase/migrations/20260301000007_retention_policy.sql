-- Loeschkonzept / Data Retention Policy (DSGVO Art. 5 Abs. 1 lit. e)
--
-- Datenkategorien und Aufbewahrungsfristen:
-- 1. System-Logs (ai_usage_logs):        90 Tage
-- 2. Reminder-Logs:                      180 Tage
-- 3. Buddy-Context-Notes:                30 Tage (bereits vorhanden)
-- 4. Gesundheitsdaten:                   User-konfigurierbar (Default: unbegrenzt)
-- 5. Nutzerdaten:                        Bis Account-Loeschung (Art. 17)
--
-- Cleanup-Funktion: cleanup_expired_data() — taeglich per Cron oder manuell

-- ============================================================
-- 1. TTL-Spalten fuer Log-Tabellen
-- ============================================================

-- ai_usage_logs: 90 Tage Aufbewahrung
ALTER TABLE ai_usage_logs
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days');

-- Bestehende Eintraege: 90 Tage ab Erstellung
UPDATE ai_usage_logs SET expires_at = created_at + INTERVAL '90 days'
  WHERE expires_at IS NULL;

-- reminder_logs: 180 Tage Aufbewahrung
ALTER TABLE reminder_logs
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '180 days');

-- Bestehende Eintraege: 180 Tage ab Erstellung
UPDATE reminder_logs SET expires_at = completed_at + INTERVAL '180 days'
  WHERE expires_at IS NULL;

-- ============================================================
-- 2. Indexes fuer schnelle Cleanup-Queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ai_usage_expires
  ON ai_usage_logs(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reminder_logs_expires
  ON reminder_logs(expires_at) WHERE expires_at IS NOT NULL;

-- buddy_context_notes Index existiert bereits:
-- idx_buddy_context_expires ON buddy_context_notes(expires_at)

-- ============================================================
-- 3. Retention-Einstellung pro User (optional)
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS data_retention_months INTEGER DEFAULT NULL;
  -- NULL = unbegrenzt (Default)
  -- 12 = 1 Jahr, 36 = 3 Jahre, 60 = 5 Jahre

COMMENT ON COLUMN profiles.data_retention_months IS 'User-konfigurierbare Aufbewahrungsfrist fuer Gesundheitsdaten (NULL = unbegrenzt)';

-- ============================================================
-- 4. Cleanup-Funktion
-- ============================================================

CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS TABLE(
  deleted_ai_logs BIGINT,
  deleted_reminder_logs BIGINT,
  deleted_context_notes BIGINT,
  deleted_health_data BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ai BIGINT := 0;
  _rem BIGINT := 0;
  _ctx BIGINT := 0;
  _health BIGINT := 0;
  _user RECORD;
  _cutoff TIMESTAMPTZ;
  _deleted BIGINT;
BEGIN
  -- 4a. System-Logs (feste Fristen)
  DELETE FROM ai_usage_logs WHERE expires_at < now();
  GET DIAGNOSTICS _ai = ROW_COUNT;

  DELETE FROM reminder_logs WHERE expires_at < now();
  GET DIAGNOSTICS _rem = ROW_COUNT;

  DELETE FROM buddy_context_notes WHERE expires_at IS NOT NULL AND expires_at < now();
  GET DIAGNOSTICS _ctx = ROW_COUNT;

  -- 4b. Gesundheitsdaten (user-konfigurierbar, nur wenn Frist gesetzt)
  FOR _user IN
    SELECT id, data_retention_months
    FROM profiles
    WHERE data_retention_months IS NOT NULL
      AND data_retention_months > 0
  LOOP
    _cutoff := now() - (_user.data_retention_months || ' months')::INTERVAL;

    -- Koerpermesswerte
    DELETE FROM body_measurements WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    -- Mahlzeiten
    DELETE FROM meals WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    -- Blutdruck
    DELETE FROM blood_pressure_logs WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    -- Substanz-Logs
    DELETE FROM substance_logs WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    -- Blutwerte
    DELETE FROM blood_work WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    -- Schlaf-Logs
    DELETE FROM sleep_logs WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    -- Zyklus-Logs
    DELETE FROM menstrual_cycle_logs WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    -- Symptom-Logs
    DELETE FROM symptom_logs WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    -- Workouts
    DELETE FROM workouts WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    -- Daily Checkins
    DELETE FROM daily_checkins WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;
  END LOOP;

  RETURN QUERY SELECT _ai, _rem, _ctx, _health;
END;
$$;

REVOKE ALL ON FUNCTION cleanup_expired_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cleanup_expired_data() TO service_role;

COMMENT ON FUNCTION cleanup_expired_data() IS 'DSGVO Art. 5(1)(e) — Automatische Bereinigung abgelaufener Daten. Taeglich via Cron ausfuehren.';

-- ============================================================
-- 5. Cron-Job (falls pg_cron verfuegbar)
-- ============================================================
-- Hinweis: pg_cron muss als Extension aktiviert sein.
-- Falls nicht verfuegbar, kann cleanup_expired_data() auch
-- als Edge Function oder externer Cronjob aufgerufen werden.
--
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
--     PERFORM cron.schedule('cleanup_expired_data', '0 3 * * *', 'SELECT * FROM cleanup_expired_data()');
--   END IF;
-- END $$;
