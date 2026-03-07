-- Add cycle_tracking_enabled column to profiles table.
-- Allows users to opt-in/out of menstrual cycle tracking independently of gender.
-- Default NULL = use gender-based fallback (female/other → true, else false).
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS cycle_tracking_enabled boolean DEFAULT NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
