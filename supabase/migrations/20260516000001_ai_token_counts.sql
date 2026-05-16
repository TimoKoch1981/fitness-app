-- Phase 2 / KI3: Token-Counts + Cost-Tracking in ai_action_logs
--
-- Bisheriges Schema trackt action_type, phase, status, latency.
-- Fehlt: prompt_tokens, completion_tokens, cost_cents_x100 (1/100 Cent fuer Praezision).
-- Foundation fuer Phase 3 PL2 (Per-User-AI-Budget) und Cost-Dashboard.
--
-- Speichert ueber alle Action-Types hinweg den exakten LLM-Verbrauch.

ALTER TABLE ai_action_logs
  ADD COLUMN IF NOT EXISTS prompt_tokens integer,
  ADD COLUMN IF NOT EXISTS completion_tokens integer,
  ADD COLUMN IF NOT EXISTS cost_cents_x100 integer,  -- 1/100 Cent. e.g. 25 = 0,25 Cent
  ADD COLUMN IF NOT EXISTS llm_model text;            -- 'gpt-4o-mini' | 'claude-sonnet-4-6' etc.

COMMENT ON COLUMN ai_action_logs.cost_cents_x100 IS
  'LLM-Cost in 1/100 Cent (integer for precision). e.g. 250 = 2,50 Cent.';
COMMENT ON COLUMN ai_action_logs.llm_model IS
  'LLM-Modell das die Action verarbeitet hat. Wichtig fuer Cost-Berechnung.';

-- Aggregations-View: AI-Cost pro User pro Tag
CREATE OR REPLACE VIEW ai_cost_per_user_daily AS
SELECT
  user_id,
  date_trunc('day', created_at) AS day,
  count(*) AS request_count,
  sum(prompt_tokens) AS total_prompt_tokens,
  sum(completion_tokens) AS total_completion_tokens,
  sum(cost_cents_x100) AS total_cost_cents_x100,
  round(sum(cost_cents_x100)::numeric / 10000.0, 4) AS total_cost_eur
FROM ai_action_logs
WHERE user_id IS NOT NULL
  AND cost_cents_x100 IS NOT NULL
GROUP BY user_id, date_trunc('day', created_at);

COMMENT ON VIEW ai_cost_per_user_daily IS
  'AI-Cost pro User pro Tag fuer Budget-Tracking und Admin-Dashboard.';

GRANT SELECT ON ai_cost_per_user_daily TO authenticated;
