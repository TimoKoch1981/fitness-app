-- =============================================================================
-- Feedback System: feedback, feature_requests, feature_votes
-- FitBuddy v9.0
-- =============================================================================

-- 1. FEEDBACK TABLE (general feedback: bug reports, notes, praise)
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('bug', 'note', 'praise')),
  rating TEXT CHECK (rating IN ('up', 'down')),
  message TEXT,
  page_url TEXT,
  user_agent TEXT,
  app_version TEXT,
  screenshot_url TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'wont_fix')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created ON feedback(created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_read_all_feedback" ON feedback
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "admin_update_feedback" ON feedback
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- 2. FEATURE REQUESTS TABLE
CREATE TABLE feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'planned', 'in_progress', 'completed', 'rejected')),
  admin_notes TEXT,
  planned_month TEXT,
  vote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feature_requests_votes ON feature_requests(vote_count DESC);
CREATE INDEX idx_feature_requests_status ON feature_requests(status);

ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_feature_requests" ON feature_requests
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "users_insert_feature_requests" ON feature_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_feature_requests" ON feature_requests
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "admin_update_feature_requests" ON feature_requests
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- 3. FEATURE VOTES TABLE
CREATE TABLE feature_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_request_id UUID NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, feature_request_id)
);

CREATE INDEX idx_feature_votes_feature ON feature_votes(feature_request_id);

ALTER TABLE feature_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_votes" ON feature_votes
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "users_insert_votes" ON feature_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_votes" ON feature_votes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_votes" ON feature_votes
  FOR DELETE USING (auth.uid() = user_id);

-- 4. TRIGGER: Auto-update vote_count on feature_requests
CREATE OR REPLACE FUNCTION update_feature_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE feature_requests
    SET vote_count = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 WHEN vote_type = 'down' THEN -1 ELSE 0 END), 0)
      FROM feature_votes WHERE feature_request_id = OLD.feature_request_id
    )
    WHERE id = OLD.feature_request_id;
    RETURN OLD;
  ELSE
    UPDATE feature_requests
    SET vote_count = (
      SELECT COALESCE(SUM(CASE WHEN vote_type = 'up' THEN 1 WHEN vote_type = 'down' THEN -1 ELSE 0 END), 0)
      FROM feature_votes WHERE feature_request_id = NEW.feature_request_id
    )
    WHERE id = NEW.feature_request_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_feature_vote_change
  AFTER INSERT OR UPDATE OR DELETE ON feature_votes
  FOR EACH ROW EXECUTE FUNCTION update_feature_vote_count();

-- 5. ADMIN VIEW: Feedback statistics
CREATE OR REPLACE VIEW admin_feedback_stats AS
SELECT
  category,
  status,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users,
  MAX(created_at) as newest
FROM feedback
GROUP BY category, status;

-- 6. ADMIN VIEW: Top feature requests with author
CREATE OR REPLACE VIEW admin_feature_request_stats AS
SELECT
  fr.id,
  fr.title,
  fr.description,
  fr.category,
  fr.status,
  fr.vote_count,
  fr.planned_month,
  fr.created_at,
  p.display_name as author_name,
  (SELECT COUNT(*) FROM feature_votes fv WHERE fv.feature_request_id = fr.id AND fv.vote_type = 'up') as upvotes,
  (SELECT COUNT(*) FROM feature_votes fv WHERE fv.feature_request_id = fr.id AND fv.vote_type = 'down') as downvotes
FROM feature_requests fr
LEFT JOIN profiles p ON p.id = fr.user_id
ORDER BY fr.vote_count DESC;
