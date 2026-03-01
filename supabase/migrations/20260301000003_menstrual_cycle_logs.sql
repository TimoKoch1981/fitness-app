-- Menstrual Cycle Tracking: menstrual_cycle_logs table
-- Stores daily cycle logs: phase, flow intensity, symptoms, energy, mood.

CREATE TABLE menstrual_cycle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('menstruation', 'follicular', 'ovulation', 'luteal')),
  flow_intensity TEXT CHECK (flow_intensity IN ('light', 'normal', 'heavy')),
  symptoms JSONB DEFAULT '[]'::jsonb,  -- array of symptom keys
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- One entry per user per day
ALTER TABLE menstrual_cycle_logs ADD CONSTRAINT menstrual_cycle_logs_user_date_unique UNIQUE (user_id, date);

-- Fast queries by user + date ordering
CREATE INDEX idx_menstrual_cycle_logs_user_date_desc ON menstrual_cycle_logs(user_id, date DESC);

-- Row Level Security
ALTER TABLE menstrual_cycle_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cycle logs"
  ON menstrual_cycle_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycle logs"
  ON menstrual_cycle_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycle logs"
  ON menstrual_cycle_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cycle logs"
  ON menstrual_cycle_logs FOR DELETE
  USING (auth.uid() = user_id);
