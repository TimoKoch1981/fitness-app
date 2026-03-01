-- buddy_context_notes — Persistent AI context across chat sessions.
-- Stores key topics, health issues, goals, and preferences extracted
-- from conversations so the AI can remember context between sessions.
--
-- Lightweight approach: simple keyword-based extraction, no LLM required.
-- Notes auto-expire after 30 days (configurable per note).

CREATE TABLE IF NOT EXISTS buddy_context_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL DEFAULT 'general',
  note_type TEXT NOT NULL CHECK (note_type IN (
    'health_issue',    -- "Schulterschmerzen", "Krank seit Montag"
    'goal',            -- "5kg abnehmen", "Bankdruecken 100kg"
    'preference',      -- "Kein Brokkoli", "Trainiert morgens"
    'recommendation',  -- Agent empfahl: "Deload-Woche"
    'topic',           -- Allgemeines Gespraechsthema
    'substance_change' -- Substanz-Aenderung: "TRT auf 200mg erhoeht"
  )),
  content TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fast lookup: user's recent context per agent
CREATE INDEX IF NOT EXISTS idx_buddy_context_user_agent
  ON buddy_context_notes(user_id, agent_type, created_at DESC);

-- Cleanup: index for expiration queries
CREATE INDEX IF NOT EXISTS idx_buddy_context_expires
  ON buddy_context_notes(expires_at)
  WHERE expires_at IS NOT NULL;

-- RLS: users can only manage their own notes
ALTER TABLE buddy_context_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own context notes"
  ON buddy_context_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own context notes"
  ON buddy_context_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own context notes"
  ON buddy_context_notes FOR DELETE
  USING (auth.uid() = user_id);
