-- =============================================================================
-- Admin Dashboard: Rolle, AI Usage Logging, Admin-Policies
-- =============================================================================

-- 1. Admin-Rolle in profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 1b. Helper function: prueft Admin-Status OHNE RLS-Rekursion
-- SECURITY DEFINER = laeuft als DB-Owner, umgeht RLS
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = check_user_id),
    false
  );
$$;

-- 2. AI Usage Logging (Token-Tracking pro API-Call)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,
  estimated_cost_usd NUMERIC(10,6) DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_agent ON ai_usage_logs(agent_type);

-- RLS fuer ai_usage_logs
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- User sieht eigene Logs
CREATE POLICY "users_read_own_usage" ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Admin sieht alle Logs (nutzt SECURITY DEFINER Funktion statt Subquery auf profiles)
CREATE POLICY "admin_read_all_usage" ON ai_usage_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Jeder kann eigene Logs erstellen
CREATE POLICY "users_insert_own_usage" ON ai_usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Admin-Policies fuer standard_products (Schreibrechte)
CREATE POLICY "admin_insert_products" ON standard_products
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "admin_update_products" ON standard_products
  FOR UPDATE USING (public.is_admin(auth.uid()));

CREATE POLICY "admin_delete_products" ON standard_products
  FOR DELETE USING (public.is_admin(auth.uid()));

-- 4. Admin kann alle Profiles lesen (fuer User-Statistiken)
-- Bestehende Policy: auth.uid() = id → erweitern
-- WICHTIG: Nutzt is_admin() Funktion statt Subquery, um Rekursion zu vermeiden!
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "users_and_admin_read_profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR public.is_admin(auth.uid())
  );

-- 5. Admin kann alle Meals/Workouts zaehlen (aggregierte Statistiken)
-- Wir erstellen eine View fuer Admin-Statistiken statt RLS zu lockern
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT
  p.id as user_id,
  p.display_name,
  u.email,
  u.created_at as registered_at,
  u.last_sign_in_at,
  u.email_confirmed_at,
  (SELECT COUNT(*) FROM meals m WHERE m.user_id = p.id) as meal_count,
  (SELECT COUNT(*) FROM workouts w WHERE w.user_id = p.id) as workout_count,
  (SELECT COUNT(*) FROM body_measurements bm WHERE bm.user_id = p.id) as body_count,
  (SELECT MAX(m.created_at) FROM meals m WHERE m.user_id = p.id) as last_meal_at,
  (SELECT MAX(w.created_at) FROM workouts w WHERE w.user_id = p.id) as last_workout_at
FROM profiles p
JOIN auth.users u ON u.id = p.id;

-- View ist nur fuer Admins (wird via RLS auf profiles gefiltert)

-- 6. Token-Usage Aggregation View
CREATE OR REPLACE VIEW admin_usage_stats AS
SELECT
  date_trunc('day', created_at) as day,
  agent_type,
  model,
  COUNT(*) as call_count,
  SUM(tokens_input) as total_input_tokens,
  SUM(tokens_output) as total_output_tokens,
  SUM(tokens_total) as total_tokens,
  SUM(estimated_cost_usd) as total_cost_usd,
  AVG(duration_ms)::INTEGER as avg_duration_ms,
  COUNT(DISTINCT user_id) as unique_users
FROM ai_usage_logs
GROUP BY date_trunc('day', created_at), agent_type, model;

-- 7. Test-User als Admin setzen (ueber auth.users Email-Lookup, stabil bei DB Reset)
UPDATE profiles SET is_admin = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'test@fitbuddy.local'
);
