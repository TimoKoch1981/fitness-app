-- Training Phase Cycles — Automated phase sequencing (Bulk→Cut→Maint→Repeat)
-- Stores user-defined cycle templates with ordered phases and durations.

CREATE TABLE IF NOT EXISTS training_phase_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Mein Zyklus',
  -- Ordered array of phases with durations (JSONB)
  -- Format: [{"phase":"bulk","weeks":16},{"phase":"cut","weeks":12},{"phase":"maintenance","weeks":8}]
  phases JSONB NOT NULL DEFAULT '[]'::JSONB,
  -- Whether this cycle auto-repeats after the last phase
  auto_repeat BOOLEAN NOT NULL DEFAULT true,
  -- Whether this cycle is currently active (only 1 per user)
  is_active BOOLEAN NOT NULL DEFAULT false,
  -- Current position in the cycle (0-indexed)
  current_phase_index INTEGER NOT NULL DEFAULT 0,
  -- Source template name (null if custom)
  template_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_training_phase_cycles_user ON training_phase_cycles(user_id);
CREATE UNIQUE INDEX idx_training_phase_cycles_active ON training_phase_cycles(user_id) WHERE is_active = true;

-- RLS
ALTER TABLE training_phase_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own phase cycles"
  ON training_phase_cycles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own phase cycles"
  ON training_phase_cycles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phase cycles"
  ON training_phase_cycles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own phase cycles"
  ON training_phase_cycles FOR DELETE
  USING (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON training_phase_cycles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON training_phase_cycles TO service_role;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_training_phase_cycles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_training_phase_cycles_updated_at
  BEFORE UPDATE ON training_phase_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_training_phase_cycles_updated_at();
