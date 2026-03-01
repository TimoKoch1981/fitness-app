-- symptom_logs — Daily symptom tracking for comprehensive health monitoring.
-- Enables pattern recognition (recurring symptoms, training correlations).
-- Follows same pattern as sleep_logs and menstrual_cycle_logs.

CREATE TABLE IF NOT EXISTS symptom_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  symptoms JSONB NOT NULL DEFAULT '[]',  -- Array of symptom keys: ["headache", "fatigue", "nausea"]
  severity INTEGER CHECK (severity BETWEEN 1 AND 5),  -- 1=mild, 5=severe
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_symptom_logs_user_date
  ON symptom_logs(user_id, date DESC);

ALTER TABLE symptom_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own symptom logs"
  ON symptom_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own symptom logs"
  ON symptom_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own symptom logs"
  ON symptom_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own symptom logs"
  ON symptom_logs FOR DELETE
  USING (auth.uid() = user_id);
