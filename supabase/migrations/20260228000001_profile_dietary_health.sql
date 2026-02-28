-- Add dietary preferences, allergies, and health restrictions to profiles.
-- Stored as JSONB arrays of strings for maximum flexibility.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dietary_preferences JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS allergies JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS health_restrictions JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN profiles.dietary_preferences IS 'Array of dietary preferences: vegetarian, vegan, pescatarian, halal, kosher, lactose_free, gluten_free';
COMMENT ON COLUMN profiles.allergies IS 'Array of food allergies: nuts, gluten, lactose, shellfish, eggs, soy, wheat';
COMMENT ON COLUMN profiles.health_restrictions IS 'Array of health/injury restrictions: back, shoulder, knee, hip, wrist, neck, diastasis_recti';
