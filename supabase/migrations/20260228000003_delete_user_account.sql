-- Account-Loeschung gemaess DSGVO Art. 17 ("Recht auf Vergessenwerden")
--
-- Diese Funktion loescht ALLE Nutzerdaten kaskadierend:
-- auth.users → profiles → meals, body_measurements, blood_pressure,
--   substances, reminders, workouts, user_products, feedback, training_plans,
--   blood_work, spotify_connections, etc.
--
-- SECURITY DEFINER: Laeuft als DB-Owner (kann auth.users loeschen).
-- Sicherheit: Prueft auth.uid() — nur eigener Account loeschbar.

CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
BEGIN
  -- 1. Authentifizierten User ermitteln
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Nicht authentifiziert';
  END IF;

  -- 2. Storage-Objekte loeschen (Avatare, Uploads)
  DELETE FROM storage.objects WHERE owner = _user_id;

  -- 3. Auth-User loeschen (CASCADE loescht alle referenzierten Daten)
  DELETE FROM auth.users WHERE id = _user_id;

  -- Hinweis: Durch ON DELETE CASCADE werden automatisch geloescht:
  -- profiles, meals, body_measurements, blood_pressure, substances,
  -- reminders, workouts, user_products, feedback, feature_votes,
  -- daily_checkins, training_plans, blood_work, spotify_connections
END;
$$;

-- Berechtigung: Nur authentifizierte User koennen die Funktion aufrufen
REVOKE ALL ON FUNCTION delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION delete_user_account() TO authenticated;

COMMENT ON FUNCTION delete_user_account() IS 'DSGVO Art. 17 — Vollstaendige Kaskaden-Loeschung aller Nutzerdaten';
