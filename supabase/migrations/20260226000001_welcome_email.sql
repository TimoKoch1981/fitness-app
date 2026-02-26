-- ============================================================
-- Migration: Welcome Email Tracking
-- Adds welcome_email_sent_at column to profiles table
-- Used to track whether activation welcome email was sent
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN profiles.welcome_email_sent_at IS
  'Timestamp when welcome email was sent after account activation. NULL = not yet sent.';
