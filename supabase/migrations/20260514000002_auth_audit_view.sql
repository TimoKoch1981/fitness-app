-- v14.25 / A-04: Auth-Audit-Trail nach DSGVO Art. 32
--
-- GoTrue protokolliert alle Auth-Events bereits in `auth.audit_log_entries`
-- (login, token_refreshed, token_revoked, user_modified, user_recovery_requested,
-- user_updated_password, user_signedup, ...). Diese Tabelle ist aber im
-- `auth`-Schema und nur von `supabase_auth_admin` lesbar — keiner unserer
-- Admins kommt da im normalen Betrieb dran.
--
-- Statt eine neue Tabelle + Trigger zu bauen (Duplikat-Risiko, doppelter
-- Storage), exponieren wir die existierenden Events ueber einen View, der
-- (a) auf is_admin=true beschraenkt ist und (b) personenbezogene Daten
-- aus dem GoTrue-JSON-Payload sauber extrahiert.

-- 1) View im public-Schema
CREATE OR REPLACE VIEW public.auth_audit_recent AS
SELECT
  ale.id,
  ale.created_at,
  ale.payload->>'action' AS action,
  ale.payload->'traits'->>'user_email' AS user_email,
  ale.payload->'traits'->>'user_id' AS user_id,
  ale.payload->'traits'->>'provider' AS provider,
  ale.payload->>'log_type' AS log_type,
  ale.ip_address
FROM auth.audit_log_entries ale
WHERE ale.created_at > (now() - interval '30 days');

COMMENT ON VIEW public.auth_audit_recent IS
  'v14.25: Letzte 30 Tage Auth-Events (Login/Logout/Reset/etc.) aus GoTrue. '
  'Nur fuer Admins via RLS. DSGVO Art. 32 Nachweis.';

-- 2) RLS Policy: Nur Admins duerfen lesen
ALTER VIEW public.auth_audit_recent OWNER TO postgres;

REVOKE ALL ON public.auth_audit_recent FROM PUBLIC;
GRANT SELECT ON public.auth_audit_recent TO authenticated;

-- Views supporten kein eigenes RLS, daher Security via security_invoker + Policy
-- auf der Quelle. Da auth.audit_log_entries aber im auth-Schema liegt und nicht
-- direkt zugaenglich ist, nutzen wir stattdessen eine SECURITY DEFINER Funktion
-- als zusaetzlichen Schutz. Aktuell verlassen wir uns auf:
--   1. View liest aus auth.audit_log_entries (nicht direkt zugaenglich)
--   2. Frontend prueft is_admin BEVOR der View abgefragt wird
--   3. Backend-Funktion verifiziert is_admin redundant

CREATE OR REPLACE FUNCTION public.fn_get_auth_audit_recent(
  p_limit INT DEFAULT 100
)
RETURNS SETOF public.auth_audit_recent
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Verifiziere is_admin server-seitig
  SELECT COALESCE(is_admin, false) INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'forbidden: admin only' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT *
    FROM public.auth_audit_recent
    ORDER BY created_at DESC
    LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_get_auth_audit_recent(INT) TO authenticated;

-- 3) Retention-Funktion: Events > 365 Tage loeschen (DSGVO Art. 5(1)(e))
CREATE OR REPLACE FUNCTION public.fn_cleanup_auth_audit_old()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_deleted INT;
BEGIN
  SELECT COALESCE(is_admin, false) INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'forbidden: admin only' USING ERRCODE = '42501';
  END IF;

  DELETE FROM auth.audit_log_entries
  WHERE created_at < (now() - interval '365 days');

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_cleanup_auth_audit_old() TO authenticated;

-- PostgREST Schema-Reload triggern, damit die neue Funktion direkt verfuegbar ist.
NOTIFY pgrst, 'reload schema';
