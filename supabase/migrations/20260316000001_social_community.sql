-- Social Community — Stufe 2+3
-- Friendships, Groups, Challenges, Activity Feed
-- 2026-03-16

-- ═══════════════════════════════════════════════════════════════════════
-- 1. FRIENDSHIPS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  CONSTRAINT friendships_no_self CHECK (requester_id != addressee_id),
  CONSTRAINT friendships_unique_pair UNIQUE (requester_id, addressee_id)
);

CREATE INDEX idx_friendships_requester ON friendships(requester_id, status);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id, status);

-- RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

CREATE POLICY "Users can update own friendships"
  ON friendships FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

GRANT ALL ON friendships TO authenticated;
GRANT SELECT ON friendships TO anon;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. GROUPS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
  max_members INT NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_groups_owner ON groups(owner_id);
CREATE INDEX idx_groups_visibility ON groups(visibility);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Public groups visible to all, private only to members
CREATE POLICY "Public groups visible to all authenticated"
  ON groups FOR SELECT
  USING (
    visibility = 'public'
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update groups"
  ON groups FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete groups"
  ON groups FOR DELETE
  USING (auth.uid() = owner_id);

GRANT ALL ON groups TO authenticated;
GRANT SELECT ON groups TO anon;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. GROUP MEMBERS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT group_members_unique UNIQUE (group_id, user_id)
);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group members"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id AND g.visibility = 'public'
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update members"
  ON group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
    )
  );

CREATE POLICY "Users can leave, admins can remove"
  ON group_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
    )
  );

GRANT ALL ON group_members TO authenticated;
GRANT SELECT ON group_members TO anon;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. CHALLENGES
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN (
    'workout_count', 'total_volume', 'calories_logged',
    'streak_days', 'body_measurements', 'custom'
  )),
  target_value NUMERIC NOT NULL DEFAULT 0,
  target_unit TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'group' CHECK (visibility IN ('private', 'friends', 'group', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT challenges_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_challenges_group ON challenges(group_id);
CREATE INDEX idx_challenges_creator ON challenges(creator_id);
CREATE INDEX idx_challenges_dates ON challenges(start_date, end_date);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant challenges"
  ON challenges FOR SELECT
  USING (
    creator_id = auth.uid()
    OR visibility = 'public'
    OR (visibility = 'group' AND group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = challenges.group_id AND gm.user_id = auth.uid()
    ))
    OR (visibility = 'friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.requester_id = challenges.creator_id AND f.addressee_id = auth.uid())
          OR (f.addressee_id = challenges.creator_id AND f.requester_id = auth.uid())
        )
    ))
  );

CREATE POLICY "Users can create challenges"
  ON challenges FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update challenges"
  ON challenges FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete challenges"
  ON challenges FOR DELETE
  USING (auth.uid() = creator_id);

GRANT ALL ON challenges TO authenticated;
GRANT SELECT ON challenges TO anon;

-- ═══════════════════════════════════════════════════════════════════════
-- 5. CHALLENGE PARTICIPANTS
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_value NUMERIC NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  CONSTRAINT challenge_participants_unique UNIQUE (challenge_id, user_id)
);

CREATE INDEX idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user ON challenge_participants(user_id);

ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view challenge progress"
  ON challenge_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.challenge_id = challenge_participants.challenge_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join challenges"
  ON challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON challenge_participants FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can leave challenges"
  ON challenge_participants FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON challenge_participants TO authenticated;
GRANT SELECT ON challenge_participants TO anon;

-- ═══════════════════════════════════════════════════════════════════════
-- 6. ACTIVITY FEED
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'workout_completed', 'goal_achieved', 'badge_earned',
    'challenge_joined', 'challenge_completed', 'streak_milestone',
    'body_goal_reached', 'recipe_shared'
  )),
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}',
  visibility TEXT NOT NULL DEFAULT 'friends' CHECK (visibility IN ('private', 'friends', 'public')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_visibility ON activity_feed(visibility);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own + friends' activities"
  ON activity_feed FOR SELECT
  USING (
    user_id = auth.uid()
    OR visibility = 'public'
    OR (visibility = 'friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
        AND (
          (f.requester_id = activity_feed.user_id AND f.addressee_id = auth.uid())
          OR (f.addressee_id = activity_feed.user_id AND f.requester_id = auth.uid())
        )
    ))
  );

CREATE POLICY "Users can create own activities"
  ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
  ON activity_feed FOR DELETE
  USING (auth.uid() = user_id);

GRANT ALL ON activity_feed TO authenticated;
GRANT SELECT ON activity_feed TO anon;

-- ═══════════════════════════════════════════════════════════════════════
-- 7. PROFILE: visibility + public display_name
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'friends'
  CHECK (profile_visibility IN ('private', 'friends', 'public'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS share_workouts BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS share_progress BOOLEAN DEFAULT false;

-- Notification: pgrst reload
NOTIFY pgrst, 'reload schema';
