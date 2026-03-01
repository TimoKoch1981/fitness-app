-- Sleep Tracking: sleep_logs table
-- Stores bedtime, wake time, duration, quality per day per user.

CREATE TABLE sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  bedtime TIME,              -- e.g. 22:30
  wake_time TIME,            -- e.g. 06:30
  duration_minutes INTEGER,  -- total sleep duration in minutes
  quality INTEGER CHECK (quality BETWEEN 1 AND 5),  -- 1=very poor, 5=very good
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- One sleep entry per user per day (constraint required for upsert)
ALTER TABLE sleep_logs ADD CONSTRAINT sleep_logs_user_date_unique UNIQUE (user_id, date);

-- Fast queries by user + date ordering
CREATE INDEX idx_sleep_logs_user_date_desc ON sleep_logs(user_id, date DESC);

-- Row Level Security
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sleep logs"
  ON sleep_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sleep logs"
  ON sleep_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sleep logs"
  ON sleep_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sleep logs"
  ON sleep_logs FOR DELETE
  USING (auth.uid() = user_id);
