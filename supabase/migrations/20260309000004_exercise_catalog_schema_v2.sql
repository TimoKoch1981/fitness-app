-- ════════════════════════════════════════════════════════════════════════
-- Exercise Catalog Schema v2 — 12 neue Spalten + Indexes + Favoriten
-- Basiert auf: docs/KONZEPT_EXERCISE_CATALOG.md (5 Experten-Reviews)
-- ════════════════════════════════════════════════════════════════════════

-- Muskeln: primaer/sekundaer getrennt (EN-Identifier, Frontend uebersetzt per i18n)
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS primary_muscles TEXT[] DEFAULT '{}';
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[] DEFAULT '{}';

-- Koerperregion (fuer Filter-Chips im UI)
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS body_region TEXT
  CHECK (body_region IN (
    'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full_body', 'cardio'
  ));

-- Bewegungsmuster (NSCA-basiert, fuer Push/Pull-Balance im Trainingsplaner)
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS movement_pattern TEXT
  CHECK (movement_pattern IN (
    'horizontal_push', 'horizontal_pull',
    'vertical_push', 'vertical_pull',
    'hip_hinge', 'squat', 'lunge',
    'carry', 'rotation', 'anti_rotation',
    'isolation', 'cardio_steady', 'cardio_interval',
    'flexibility', 'plyometric', 'other'
  ));

-- Kraftrichtung
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS force_type TEXT
  CHECK (force_type IN ('push', 'pull', 'static', 'dynamic'));

-- Unilateral-Flag (fuer L/R-Input im ExerciseTracker)
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS is_unilateral BOOLEAN DEFAULT false;

-- Videos als JSONB (erweiterbar: de_male, de_female, en_male, en_female, thumbnail)
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '{}';

-- Medizinische Sicherheitsfelder
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS joint_stress JSONB DEFAULT '{}';
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS contraindications TEXT[] DEFAULT '{}';
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS contraindications_de TEXT;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS contraindications_en TEXT;

-- Tipps & Alternativen
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS tips JSONB DEFAULT NULL;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS alternatives UUID[] DEFAULT '{}';

-- Sortierung & Verwaltung
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE exercise_catalog ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ════════════════════════════════════════════════════════════════════════
-- Indexes fuer neue Spalten
-- ════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_exercise_catalog_primary_muscles
  ON exercise_catalog USING GIN (primary_muscles);
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_secondary_muscles
  ON exercise_catalog USING GIN (secondary_muscles);
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_contraindications
  ON exercise_catalog USING GIN (contraindications);
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_body_region
  ON exercise_catalog (body_region);
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_movement_pattern
  ON exercise_catalog (movement_pattern);
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_category
  ON exercise_catalog (category);

-- ════════════════════════════════════════════════════════════════════════
-- User-Favoriten-Tabelle
-- ════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_exercise_favorites (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercise_catalog(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, exercise_id)
);

ALTER TABLE user_exercise_favorites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'users_own_favorites'
  ) THEN
    CREATE POLICY "users_own_favorites" ON user_exercise_favorites
      FOR ALL TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════
-- Migrate existing video URLs into JSONB videos field
-- ════════════════════════════════════════════════════════════════════════

UPDATE exercise_catalog
SET videos = jsonb_build_object(
  'de_male', video_url_de,
  'en_male', video_url_en
)
WHERE (video_url_de IS NOT NULL OR video_url_en IS NOT NULL)
  AND (videos IS NULL OR videos = '{}'::jsonb);
