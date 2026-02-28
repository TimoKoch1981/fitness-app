-- Granulare Einwilligungen gemaess DSGVO Art. 9
-- Ersetzt den bisherigen Single-Consent (disclaimer_accepted_at) durch
-- 3 separate, nachvollziehbare Einwilligungen:
--
-- 1. consent_health_data_at  — Verarbeitung besonderer Kategorien (Art. 9 Abs. 2 lit. a)
-- 2. consent_ai_processing_at — KI-gestuetzte Verarbeitung (Daten an LLM-Provider)
-- 3. consent_third_country_at — Drittlandtransfer (OpenAI = USA, Art. 49 DSGVO)
--
-- Alle 3 muessen gesetzt sein, damit die App nutzbar ist.
-- disclaimer_accepted_at bleibt fuer Rueckwaertskompatibilitaet.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS consent_health_data_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS consent_ai_processing_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS consent_third_country_at TIMESTAMPTZ DEFAULT NULL;

-- Kommentar zur Dokumentation
COMMENT ON COLUMN profiles.consent_health_data_at IS 'DSGVO Art. 9 Abs. 2 lit. a — Einwilligung Gesundheitsdaten';
COMMENT ON COLUMN profiles.consent_ai_processing_at IS 'Einwilligung KI-Verarbeitung (Daten an OpenAI/LLM)';
COMMENT ON COLUMN profiles.consent_third_country_at IS 'DSGVO Art. 49 — Einwilligung Drittlandtransfer (USA)';
