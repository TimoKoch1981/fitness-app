-- Stufe 3: Automatisches Lernen von Ernaehrungs-Praeferenzen
-- Tabelle fuer gelernte Nutzer-Praeferenzen (aus Chat, Mahlzeiten, Rezepten)

CREATE TABLE IF NOT EXISTS user_nutrition_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL CHECK (preference_type IN (
    'liked_ingredient',
    'disliked_ingredient',
    'cooking_style',
    'cuisine_preference',
    'dietary_pattern',
    'portion_size'
  )),
  value TEXT NOT NULL,
  confidence FLOAT NOT NULL DEFAULT 0.5 CHECK (confidence >= 0.0 AND confidence <= 1.0),
  source TEXT NOT NULL DEFAULT 'inferred' CHECK (source IN ('explicit', 'inferred', 'buddy_chat')),
  occurrence_count INT NOT NULL DEFAULT 1,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Upsert key: one preference per user + type + value
  UNIQUE(user_id, preference_type, value)
);

-- Indexes
CREATE INDEX idx_nutr_prefs_user ON user_nutrition_preferences(user_id, preference_type);
CREATE INDEX idx_nutr_prefs_confidence ON user_nutrition_preferences(user_id, confidence DESC);

-- RLS
ALTER TABLE user_nutrition_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own prefs"
  ON user_nutrition_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own prefs"
  ON user_nutrition_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own prefs"
  ON user_nutrition_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own prefs"
  ON user_nutrition_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
