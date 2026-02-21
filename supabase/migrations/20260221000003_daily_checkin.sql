-- ============================================================================
-- Migration: Daily Check-in
-- Version: v6.5
-- Date: 2026-02-21
--
-- Adds daily_checkins table for morning wellbeing tracking.
-- Agents use this data to adapt recommendations (lower intensity, rest days, etc.)
-- ============================================================================

-- Daily Check-in: Tagesform-Erfassung
CREATE TABLE daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
  pain_areas TEXT[] DEFAULT '{}',
  illness BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_checkin_user_date ON daily_checkins(user_id, date);

-- RLS
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_checkins" ON daily_checkins FOR ALL USING (auth.uid() = user_id);

-- Admin can read all check-ins
CREATE POLICY "admin_read_checkins" ON daily_checkins FOR SELECT USING (
  public.is_admin(auth.uid())
);

-- ============================================================================
-- Done
-- ============================================================================
