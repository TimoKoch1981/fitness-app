-- ============================================================================
-- FitBuddy - Initial Database Schema
-- 10 Tabellen + Row Level Security (RLS)
--
-- Referenzen:
--   docs/ARCHITEKTUR.md (Section 5)
--   docs/WISSENSCHAFTLICHE_GRUNDLAGEN.md
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  height_cm DECIMAL,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  activity_level DECIMAL DEFAULT 1.55,
  daily_calories_goal INT DEFAULT 2000,
  daily_protein_goal INT DEFAULT 150,
  daily_water_goal INT DEFAULT 8,
  preferred_language TEXT DEFAULT 'de' CHECK (preferred_language IN ('de', 'en')),
  preferred_bmr_formula TEXT DEFAULT 'auto' CHECK (preferred_bmr_formula IN ('mifflin', 'katch', 'auto')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 2. MEALS
-- ============================================================================
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  calories INT,
  protein DECIMAL,
  carbs DECIMAL,
  fat DECIMAL,
  fiber DECIMAL,
  source TEXT DEFAULT 'manual',
  source_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_meals_user_date ON meals(user_id, date);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals"
  ON meals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meals"
  ON meals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meals"
  ON meals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meals"
  ON meals FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. WORKOUTS
-- ============================================================================
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  duration_minutes INT,
  calories_burned INT,
  met_value DECIMAL,
  exercises JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_workouts_user_date ON workouts(user_id, date);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 4. BODY_MEASUREMENTS
-- ============================================================================
CREATE TABLE body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg DECIMAL,
  body_fat_pct DECIMAL,
  muscle_mass_kg DECIMAL,
  water_pct DECIMAL,
  waist_cm DECIMAL,
  chest_cm DECIMAL,
  arm_cm DECIMAL,
  leg_cm DECIMAL,
  bmi DECIMAL,
  lean_mass_kg DECIMAL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_body_user_date ON body_measurements(user_id, date);

ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own body measurements"
  ON body_measurements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own body measurements"
  ON body_measurements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own body measurements"
  ON body_measurements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own body measurements"
  ON body_measurements FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 5. BLOOD_PRESSURE_LOGS
-- ============================================================================
CREATE TABLE blood_pressure_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  systolic INT NOT NULL,
  diastolic INT NOT NULL,
  pulse INT,
  classification TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_bp_user_date ON blood_pressure_logs(user_id, date);

ALTER TABLE blood_pressure_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bp logs"
  ON blood_pressure_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bp logs"
  ON blood_pressure_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bp logs"
  ON blood_pressure_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bp logs"
  ON blood_pressure_logs FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 6. SUBSTANCES (formerly: medications)
-- Neutral, urteilsfrei. Fuer TRT, PEDs, Supplements, Medikamente.
-- ============================================================================
CREATE TABLE substances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  type TEXT,
  dosage TEXT,
  unit TEXT,
  frequency TEXT,
  ester TEXT,
  half_life_days DECIMAL,
  is_active BOOLEAN DEFAULT true,
  start_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_substances_user ON substances(user_id);

ALTER TABLE substances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own substances"
  ON substances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own substances"
  ON substances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own substances"
  ON substances FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own substances"
  ON substances FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 7. SUBSTANCE_LOGS (formerly: medication_logs)
-- ============================================================================
CREATE TABLE substance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  substance_id UUID REFERENCES substances(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  time TIME,
  dosage_taken TEXT,
  taken BOOLEAN DEFAULT true,
  site TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_substance_logs_user_date ON substance_logs(user_id, date);

ALTER TABLE substance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own substance logs"
  ON substance_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own substance logs"
  ON substance_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own substance logs"
  ON substance_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own substance logs"
  ON substance_logs FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 8. TRAINING_GOALS
-- ============================================================================
CREATE TABLE training_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  target_value DECIMAL,
  current_value DECIMAL,
  unit TEXT,
  target_date DATE,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_goals_user ON training_goals(user_id);

ALTER TABLE training_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
  ON training_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals"
  ON training_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals"
  ON training_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals"
  ON training_goals FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 9. REMINDERS
-- ============================================================================
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('substance', 'blood_pressure', 'body_measurement', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  time TIME,
  days_of_week INT[],
  is_active BOOLEAN DEFAULT true,
  substance_id UUID REFERENCES substances(id) ON DELETE SET NULL,
  repeat_mode TEXT DEFAULT 'weekly',
  interval_days INT,
  time_period TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reminders_user ON reminders(user_id);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders"
  ON reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 10. REMINDER_LOGS
-- ============================================================================
CREATE TABLE reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id UUID REFERENCES reminders(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reminder_logs_user ON reminder_logs(user_id);

ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminder logs"
  ON reminder_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminder logs"
  ON reminder_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
