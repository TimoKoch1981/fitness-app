-- Training Plan tables for the Trainingsplaner feature
-- Stores user-created or AI-generated training plans with exercises per day

-- training_plans: Top-level plan container
CREATE TABLE training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  split_type TEXT NOT NULL DEFAULT 'custom', -- 'ppl', 'upper_lower', 'full_body', 'custom'
  days_per_week INT NOT NULL DEFAULT 4,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- training_plan_days: Individual training days with exercises stored as JSONB
CREATE TABLE training_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES training_plans(id) ON DELETE CASCADE NOT NULL,
  day_number INT NOT NULL, -- 1-7
  name TEXT NOT NULL,       -- e.g. "Unterkörper A"
  focus TEXT,               -- e.g. "Beine, Gluteus"
  exercises JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_training_plans_user_active ON training_plans(user_id, is_active);
CREATE INDEX idx_training_plan_days_plan ON training_plan_days(plan_id);

-- Row Level Security
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plan_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_plans" ON training_plans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_plan_days" ON training_plan_days
  FOR ALL USING (
    plan_id IN (SELECT id FROM training_plans WHERE user_id = auth.uid())
  );
