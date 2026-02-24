-- Add disclaimer_accepted_at to profiles table
-- NULL = not accepted, timestamp = accepted at that time
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS disclaimer_accepted_at TIMESTAMPTZ DEFAULT NULL;
