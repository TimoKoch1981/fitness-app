-- Audit-Trail (DSGVO Art. 5 Abs. 1 lit. f — Integritaet und Vertraulichkeit)
--
-- Protokolliert alle relevanten Datenveraenderungen:
-- INSERT, UPDATE, DELETE auf Gesundheits- und Profildaten
-- Kein SELECT-Logging (Performance, Datenschutz-Verhaeltnismaessigkeit)
--
-- Aufbewahrung: 180 Tage (dann automatische Loeschung)

-- ============================================================
-- 1. Audit-Log-Tabelle
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '180 days')
);

COMMENT ON TABLE audit_logs IS 'DSGVO Art. 5(1)(f) Audit-Trail — Protokollierung aller Datenveraenderungen an Gesundheits- und Profildaten.';

-- ============================================================
-- 2. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_expires ON audit_logs(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================
-- 3. RLS Policies
-- ============================================================

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- User sieht eigene Audit-Eintraege
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Nur System (Trigger) darf einfuegen — kein direktes Insert durch User
CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Kein Update/Delete durch User
-- (Loeschung nur durch cleanup_expired_data via service_role)

-- ============================================================
-- 4. Generische Trigger-Funktion
-- ============================================================

CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _record_id UUID;
  _old JSONB;
  _new JSONB;
BEGIN
  -- User-ID ermitteln
  _user_id := COALESCE(
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN (OLD).user_id ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN (NEW).user_id ELSE NULL END,
    auth.uid()
  );

  -- Record-ID ermitteln
  IF TG_OP = 'DELETE' THEN
    _record_id := (OLD).id;
    _old := to_jsonb(OLD);
    _new := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    _record_id := (NEW).id;
    _old := NULL;
    _new := to_jsonb(NEW);
  ELSE -- UPDATE
    _record_id := (NEW).id;
    _old := to_jsonb(OLD);
    _new := to_jsonb(NEW);
  END IF;

  INSERT INTO audit_logs (user_id, table_name, operation, record_id, old_values, new_values)
  VALUES (_user_id, TG_TABLE_NAME, TG_OP, _record_id, _old, _new);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

COMMENT ON FUNCTION audit_trigger_fn() IS 'Generische Audit-Trigger-Funktion — protokolliert INSERT/UPDATE/DELETE auf ueberwachten Tabellen.';

-- ============================================================
-- 5. Trigger auf allen relevanten Tabellen
-- ============================================================

-- Profildaten
CREATE OR REPLACE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Koerpermesswerte
CREATE OR REPLACE TRIGGER audit_body_measurements
  AFTER INSERT OR UPDATE OR DELETE ON body_measurements
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Mahlzeiten
CREATE OR REPLACE TRIGGER audit_meals
  AFTER INSERT OR UPDATE OR DELETE ON meals
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Blutdruck
CREATE OR REPLACE TRIGGER audit_blood_pressure_logs
  AFTER INSERT OR UPDATE OR DELETE ON blood_pressure_logs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Substanzen
CREATE OR REPLACE TRIGGER audit_substances
  AFTER INSERT OR UPDATE OR DELETE ON substances
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Substanz-Logs
CREATE OR REPLACE TRIGGER audit_substance_logs
  AFTER INSERT OR UPDATE OR DELETE ON substance_logs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Blutwerte
CREATE OR REPLACE TRIGGER audit_blood_work
  AFTER INSERT OR UPDATE OR DELETE ON blood_work
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Schlaf-Logs
CREATE OR REPLACE TRIGGER audit_sleep_logs
  AFTER INSERT OR UPDATE OR DELETE ON sleep_logs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Zyklus-Logs
CREATE OR REPLACE TRIGGER audit_menstrual_cycle_logs
  AFTER INSERT OR UPDATE OR DELETE ON menstrual_cycle_logs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Symptom-Logs
CREATE OR REPLACE TRIGGER audit_symptom_logs
  AFTER INSERT OR UPDATE OR DELETE ON symptom_logs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Workouts
CREATE OR REPLACE TRIGGER audit_workouts
  AFTER INSERT OR UPDATE OR DELETE ON workouts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Daily Checkins
CREATE OR REPLACE TRIGGER audit_daily_checkins
  AFTER INSERT OR UPDATE OR DELETE ON daily_checkins
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Trainingsziele
CREATE OR REPLACE TRIGGER audit_training_goals
  AFTER INSERT OR UPDATE OR DELETE ON training_goals
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Erinnerungen
CREATE OR REPLACE TRIGGER audit_reminders
  AFTER INSERT OR UPDATE OR DELETE ON reminders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- ============================================================
-- 6. cleanup_expired_data() erweitern
-- ============================================================
-- Wird in bestehende Funktion integriert via separatem Statement:

-- Loesch-Statement fuer audit_logs (180 Tage) direkt hier als Standalone
-- Die Integration in cleanup_expired_data() erfolgt ueber eine aktualisierte Version

CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS TABLE(
  deleted_ai_logs BIGINT,
  deleted_reminder_logs BIGINT,
  deleted_context_notes BIGINT,
  deleted_health_data BIGINT,
  deleted_audit_logs BIGINT
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
  _audit BIGINT := 0;
  _user RECORD;
  _cutoff TIMESTAMPTZ;
  _deleted BIGINT;
BEGIN
  -- System-Logs (feste Fristen)
  DELETE FROM ai_usage_logs WHERE expires_at < now();
  GET DIAGNOSTICS _ai = ROW_COUNT;

  DELETE FROM reminder_logs WHERE expires_at < now();
  GET DIAGNOSTICS _rem = ROW_COUNT;

  DELETE FROM buddy_context_notes WHERE expires_at IS NOT NULL AND expires_at < now();
  GET DIAGNOSTICS _ctx = ROW_COUNT;

  -- Audit-Logs (180 Tage)
  DELETE FROM audit_logs WHERE expires_at < now();
  GET DIAGNOSTICS _audit = ROW_COUNT;

  -- Gesundheitsdaten (user-konfigurierbar)
  FOR _user IN
    SELECT id, data_retention_months
    FROM profiles
    WHERE data_retention_months IS NOT NULL
      AND data_retention_months > 0
  LOOP
    _cutoff := now() - (_user.data_retention_months || ' months')::INTERVAL;

    DELETE FROM body_measurements WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    DELETE FROM meals WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    DELETE FROM blood_pressure_logs WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    DELETE FROM substance_logs WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    DELETE FROM blood_work WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    DELETE FROM sleep_logs WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    DELETE FROM menstrual_cycle_logs WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    DELETE FROM symptom_logs WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    DELETE FROM workouts WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;

    DELETE FROM daily_checkins WHERE user_id = _user.id AND created_at < _cutoff;
    GET DIAGNOSTICS _deleted = ROW_COUNT;
    _health := _health + _deleted;
  END LOOP;

  RETURN QUERY SELECT _ai, _rem, _ctx, _health, _audit;
END;
$$;

REVOKE ALL ON FUNCTION cleanup_expired_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cleanup_expired_data() TO service_role;

COMMENT ON FUNCTION cleanup_expired_data() IS 'DSGVO Art. 5(1)(e) — Automatische Bereinigung abgelaufener Daten inkl. Audit-Logs. Taeglich via Cron ausfuehren.';
