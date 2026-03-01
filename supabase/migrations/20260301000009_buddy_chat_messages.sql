-- ============================================================
-- buddy_chat_messages — Persistent chat history for KI-Buddy
-- ============================================================
-- Enables cross-session conversation memory.
-- Messages are loaded on session init and saved after each send.
-- Combined with buddy_context_notes (metadata) for full context.
-- DSGVO: 90-day auto-expiry, RLS per user.
-- ============================================================

-- 1. Create table
CREATE TABLE IF NOT EXISTS buddy_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL DEFAULT 'general',
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  raw_content TEXT,
  agent_name TEXT,
  agent_icon TEXT,
  skill_versions JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days')
);

COMMENT ON TABLE buddy_chat_messages IS 'Persistent chat history for KI-Buddy. Enables cross-session conversation memory. Auto-expires after 90 days.';

-- 2. Indexes
CREATE INDEX idx_buddy_chat_messages_user_agent ON buddy_chat_messages(user_id, agent_type, created_at DESC);
CREATE INDEX idx_buddy_chat_messages_expires ON buddy_chat_messages(expires_at) WHERE expires_at IS NOT NULL;

-- 3. RLS
ALTER TABLE buddy_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own chat messages"
  ON buddy_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
  ON buddy_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages"
  ON buddy_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Update cleanup function to also clean expired chat messages
-- (cleanup_expired_data already exists from retention_policy migration)
-- We add a separate cleanup for chat messages
CREATE OR REPLACE FUNCTION cleanup_expired_chat_messages()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  deleted_count BIGINT;
BEGIN
  DELETE FROM buddy_chat_messages WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$func$;

COMMENT ON FUNCTION cleanup_expired_chat_messages IS 'Removes expired chat messages. Should run daily via cron.';
