-- Fix: audit_trigger_fn() crashed on profiles table
-- because it accessed (NEW).user_id / (OLD).user_id directly,
-- but the profiles table uses 'id' (not 'user_id') as its PK.
--
-- Solution: Use to_jsonb()->>'user_id' which returns NULL for tables
-- without a user_id column instead of crashing.
--
-- Affected: ALL profile updates were blocked on production (HTTP 400).
-- This is a CRITICAL fix.

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
  -- User-ID ermitteln (to_jsonb fuer Tabellen ohne user_id Spalte, z.B. profiles)
  _user_id := COALESCE(
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN (to_jsonb(OLD)->>'user_id')::UUID ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN (to_jsonb(NEW)->>'user_id')::UUID ELSE NULL END,
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
