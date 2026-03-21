-- Migration: Make phase column nullable for Period-First UX (v3.0)
-- Reason: Users should only log period yes/no + flow. Phase is auto-calculated.
-- Existing data remains unchanged (all rows already have valid phase values).

ALTER TABLE menstrual_cycle_logs
  ALTER COLUMN phase DROP NOT NULL;

-- Update amenorrhea warning threshold from 60 to 45 days
-- (No schema change needed — this is handled in frontend logic)

COMMENT ON COLUMN menstrual_cycle_logs.phase IS 'Cycle phase. NULL = auto-calculated by frontend. menstruation/spotting = user-reported.';
