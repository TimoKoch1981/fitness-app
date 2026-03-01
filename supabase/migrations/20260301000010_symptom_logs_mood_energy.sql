-- Add mood and energy columns to symptom_logs for comprehensive well-being tracking.
-- Supports the extended Symptom-Tracker UI with mood/energy emoji ratings (1-5).

ALTER TABLE symptom_logs
  ADD COLUMN IF NOT EXISTS mood INTEGER CHECK (mood BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS energy INTEGER CHECK (energy BETWEEN 1 AND 5);

COMMENT ON COLUMN symptom_logs.mood IS '1=very sad, 2=sad, 3=neutral, 4=happy, 5=very happy';
COMMENT ON COLUMN symptom_logs.energy IS '1=very low, 2=low, 3=neutral, 4=high, 5=very high';
