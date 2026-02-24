-- Supabase Self-Hosted — Realtime Schema
-- Creates the _realtime schema used by the Realtime service

CREATE SCHEMA IF NOT EXISTS _realtime;
CREATE SCHEMA IF NOT EXISTS _analytics;

-- Grant access to realtime schema
GRANT USAGE ON SCHEMA _realtime TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA _realtime TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA _realtime TO postgres;

-- Grant access to analytics schema
GRANT USAGE ON SCHEMA _analytics TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA _analytics TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA _analytics TO postgres;
