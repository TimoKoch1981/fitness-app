-- ============================================================================
-- Agent Routing Enrichments — Dynamic keyword extension for agent router
-- Phase 2 of ActionRegistry Concept (docs/KONZEPT_ACTION_REGISTRY.md)
--
-- Allows adding new routing keywords via DB INSERT instead of code changes.
-- Keywords are merged with hardcoded ones at runtime.
-- ============================================================================

-- Table: agent_routing_enrichments
CREATE TABLE IF NOT EXISTS agent_routing_enrichments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type VARCHAR(30) NOT NULL,           -- 'nutrition', 'training', 'substance', etc.
  extra_keywords JSONB NOT NULL DEFAULT '[]', -- ["fasten", "16:8", "autophagie"]
  description TEXT,                           -- human-readable note why these were added
  usage_count INT NOT NULL DEFAULT 0,
  success_rate FLOAT NOT NULL DEFAULT 0.0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookup by agent_type
CREATE INDEX IF NOT EXISTS idx_routing_enrichments_agent_type
  ON agent_routing_enrichments(agent_type);

-- RLS: Read for all authenticated users (global keywords)
ALTER TABLE agent_routing_enrichments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_enrichments" ON agent_routing_enrichments
  FOR SELECT TO authenticated USING (true);

-- Write is restricted to service_role only (admin / Edge Functions)
-- No INSERT/UPDATE/DELETE policy for authenticated = only service_role can write

-- RPC: Track routing usage (fire-and-forget from client)
CREATE OR REPLACE FUNCTION track_routing_usage(
  p_agent_type VARCHAR,
  p_success BOOLEAN
) RETURNS VOID AS $$
BEGIN
  UPDATE agent_routing_enrichments
  SET
    usage_count = usage_count + 1,
    success_rate = CASE
      WHEN usage_count = 0 THEN (CASE WHEN p_success THEN 1.0 ELSE 0.0 END)
      ELSE (success_rate * usage_count + (CASE WHEN p_success THEN 1.0 ELSE 0.0 END)) / (usage_count + 1)
    END,
    last_used_at = now(),
    updated_at = now()
  WHERE agent_type = p_agent_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION track_routing_usage TO authenticated;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
