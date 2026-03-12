-- Add buddy_avatar_style column to profiles
-- Allows users to pick one of 3 KI-Buddy avatar variants
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS buddy_avatar_style TEXT DEFAULT 'coach'
  CHECK (buddy_avatar_style IN ('coach', 'trainer', 'sensei'));

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
