-- ============================================================================
-- Migration: Workout Status
-- Adds lifecycle tracking to workouts: in_progress, completed, aborted.
-- Enables resume of interrupted workouts.
-- ============================================================================

-- Add status column (default 'completed' for backwards compatibility)
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed'
  CHECK (status IN ('in_progress', 'completed', 'aborted'));

-- Index for quickly finding in-progress workouts
CREATE INDEX IF NOT EXISTS idx_workouts_status
  ON workouts(user_id, status) WHERE status = 'in_progress';

-- Backfill: ensure all existing workouts are marked completed
UPDATE workouts SET status = 'completed' WHERE status IS NULL;

NOTIFY pgrst, 'reload schema';
