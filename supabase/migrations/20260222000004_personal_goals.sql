-- Add personal_goals JSONB column to profiles
-- Stores: primary_goal, target_weight_kg, target_body_fat_pct, target_date, notes
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personal_goals JSONB;

-- Comment for documentation
COMMENT ON COLUMN profiles.personal_goals IS 'User personal goals: {primary_goal, target_weight_kg, target_body_fat_pct, target_date, notes}';
