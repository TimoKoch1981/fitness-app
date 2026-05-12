-- v14.2: P0-1 Action-Telemetrie
--
-- Captures the full lifecycle of every LLM-driven action (parse → validate → execute)
-- so we can measure reliability per ActionType, identify which fallback paths
-- in useBuddyChat actually still fire, and detect regressions empirically
-- instead of from user reports.
--
-- DSGVO: NO content (no meal names, no body values). Only structural metadata.
-- Retention: 30 days (cleaned by audit-retention job — separate concern).

-- ── Table ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_action_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),

  action_type   text NOT NULL,           -- e.g. 'log_meal', 'save_training_plan'
  phase         text NOT NULL,           -- 'parse' | 'validate' | 'execute'
  status        text NOT NULL,           -- 'attempted' | 'success' | 'failed'

  parsing_path  text,                    -- 'fc' | 'direct_json' | 'regex' | 'text_heuristic_search' | 'text_heuristic_body' | 'text_heuristic_tour'
  error_code    text,                    -- 'no_tool_call' | 'validation_failed' | 'auth_error' | 'rls_error' | 'mutation_error' | 'duplicate_idempotency' | 'agent_no_action_block' | 'date_clamped'
  error_detail  text,                    -- max 500 chars (truncated client-side)
  latency_ms    integer,
  agent_type    text,                    -- 'nutrition' | 'training' | 'substance' | ...
  metadata      jsonb                    -- e.g. { expected_days: 4, actual_days: 2 } for save_training_plan
);

COMMENT ON TABLE ai_action_logs IS
  'Action-Pipeline-Telemetrie (P0-1). Lifecycle per Action: parse->validate->execute. Keine User-Inhalte.';

-- ── Indexes ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ai_action_logs_type_created
  ON ai_action_logs (action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_action_logs_user_created
  ON ai_action_logs (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_action_logs_failed_created
  ON ai_action_logs (status, created_at DESC)
  WHERE status = 'failed';

CREATE INDEX IF NOT EXISTS idx_ai_action_logs_created
  ON ai_action_logs (created_at DESC);

-- ── RLS ─────────────────────────────────────────────────────────────────

ALTER TABLE ai_action_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own logs
CREATE POLICY ai_action_logs_select_own
  ON ai_action_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Any authenticated user can insert their own logs
CREATE POLICY ai_action_logs_insert_own
  ON ai_action_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- No UPDATE policy — logs are immutable
-- No DELETE policy — only service_role can clean up via retention job

-- Grant minimum required permissions
GRANT SELECT, INSERT ON ai_action_logs TO authenticated;
GRANT SELECT, INSERT, DELETE ON ai_action_logs TO service_role;

-- ── Aggregation Views ───────────────────────────────────────────────────

-- Success-rate + latency per ActionType (24h rolling window)
CREATE OR REPLACE VIEW ai_action_stats_24h AS
SELECT
  action_type,
  COUNT(*) FILTER (WHERE phase = 'execute' AND status = 'attempted') AS attempted,
  COUNT(*) FILTER (WHERE phase = 'execute' AND status = 'success')   AS succeeded,
  COUNT(*) FILTER (WHERE phase = 'execute' AND status = 'failed')    AS failed,
  COUNT(*) FILTER (WHERE phase = 'validate' AND status = 'failed')   AS validation_failed,
  COUNT(*) FILTER (WHERE phase = 'parse' AND status = 'failed')      AS parse_failed,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE phase = 'execute' AND status = 'success')::numeric
    / NULLIF(
        COUNT(*) FILTER (WHERE phase = 'execute' AND status IN ('success', 'failed')),
        0
      ),
    1
  ) AS success_rate_pct,
  ROUND(AVG(latency_ms) FILTER (WHERE phase = 'execute' AND status = 'success'))::int AS avg_latency_ms
FROM ai_action_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY action_type
ORDER BY attempted DESC NULLS LAST;

COMMENT ON VIEW ai_action_stats_24h IS
  'Erfolgsrate + Latenz pro ActionType im 24h-Fenster. Read-only Aggregat.';

-- Which parsing paths in useBuddyChat actually fire (lets us delete dead fallbacks)
CREATE OR REPLACE VIEW ai_parsing_path_stats_24h AS
SELECT
  parsing_path,
  COUNT(*) AS uses,
  COUNT(DISTINCT action_type) AS distinct_action_types
FROM ai_action_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND phase = 'parse'
  AND parsing_path IS NOT NULL
GROUP BY parsing_path
ORDER BY uses DESC;

COMMENT ON VIEW ai_parsing_path_stats_24h IS
  'Welche Fallback-Pfade in useBuddyChat tatsaechlich noch greifen (Refactor-Entscheidungshilfe).';

-- Recent failures for triage
CREATE OR REPLACE VIEW ai_action_recent_failures AS
SELECT
  created_at,
  action_type,
  phase,
  error_code,
  error_detail,
  agent_type,
  latency_ms,
  metadata
FROM ai_action_logs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 200;

COMMENT ON VIEW ai_action_recent_failures IS
  'Letzte 200 Fehler der letzten 7 Tage. Fuer Triage und Bug-Hunt.';

GRANT SELECT ON ai_action_stats_24h TO authenticated, service_role;
GRANT SELECT ON ai_parsing_path_stats_24h TO authenticated, service_role;
GRANT SELECT ON ai_action_recent_failures TO authenticated, service_role;

-- Schema reload so PostgREST sees new tables/views immediately
NOTIFY pgrst, 'reload schema';
