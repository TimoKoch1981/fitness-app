-- Migration: Training Mode (Power/Power+) + Blood Work Dashboard
-- Version: v10.9
-- Date: 2026-02-27

-- 1. Training Mode auf profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_mode TEXT DEFAULT 'standard'
  CHECK (training_mode IN ('standard', 'power', 'power_plus'));

-- 2. Wettkampf-Felder
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_federation TEXT;

-- 3. Phasen-Tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_phase TEXT DEFAULT 'maintenance'
  CHECK (current_phase IN ('bulk', 'cut', 'maintenance', 'peak_week', 'reverse_diet', 'off_season'));

-- 4. Zyklus-Status (Power+)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cycle_status TEXT DEFAULT 'natural'
  CHECK (cycle_status IN ('natural', 'blast', 'cruise', 'pct', 'off'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cycle_start_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cycle_planned_weeks INT;

-- 5. Power+ Disclaimer separat (einmalig bei Aktivierung)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS power_plus_accepted_at TIMESTAMPTZ;

-- 6. Blood Work Tabelle
CREATE TABLE IF NOT EXISTS blood_work (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Hormone
  testosterone_total NUMERIC,    -- ng/dL
  testosterone_free NUMERIC,     -- pg/mL
  estradiol NUMERIC,             -- pg/mL
  lh NUMERIC,                    -- mIU/mL
  fsh NUMERIC,                   -- mIU/mL
  shbg NUMERIC,                  -- nmol/L
  prolactin NUMERIC,             -- ng/mL

  -- Blutbild
  hematocrit NUMERIC,            -- %
  hemoglobin NUMERIC,            -- g/dL

  -- Lipide
  hdl NUMERIC,                   -- mg/dL
  ldl NUMERIC,                   -- mg/dL
  triglycerides NUMERIC,         -- mg/dL
  total_cholesterol NUMERIC,     -- mg/dL

  -- Leber
  ast NUMERIC,                   -- U/L (GOT)
  alt NUMERIC,                   -- U/L (GPT)
  ggt NUMERIC,                   -- U/L

  -- Niere
  creatinine NUMERIC,            -- mg/dL
  egfr NUMERIC,                  -- mL/min/1.73m2

  -- Schilddruese
  tsh NUMERIC,                   -- mIU/L

  -- Sonstige
  psa NUMERIC,                   -- ng/mL
  hba1c NUMERIC,                 -- %
  vitamin_d NUMERIC,             -- ng/mL
  ferritin NUMERIC,              -- ng/mL

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. RLS fuer blood_work
ALTER TABLE blood_work ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blood work"
  ON blood_work FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blood work"
  ON blood_work FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blood work"
  ON blood_work FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own blood work"
  ON blood_work FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Index fuer schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_blood_work_user_date ON blood_work(user_id, date DESC);

-- 9. Admin-Zugriff auf blood_work
CREATE POLICY "Admins can view all blood work"
  ON blood_work FOR SELECT
  USING (is_admin());
