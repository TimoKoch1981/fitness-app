-- Exercise Catalog — curated exercises with descriptions + video links
-- Part of v6.7: Übungskatalog mit Videos + Erklärungen

CREATE TABLE IF NOT EXISTS exercise_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  aliases TEXT[] DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'strength'
    CHECK (category IN ('strength', 'cardio', 'flexibility', 'functional', 'other')),
  muscle_groups TEXT[] DEFAULT '{}',
  description TEXT, -- German
  description_en TEXT,
  video_url_de TEXT,
  video_url_en TEXT,
  difficulty TEXT DEFAULT 'intermediate'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  equipment_needed TEXT[] DEFAULT '{}',
  is_compound BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast name lookups
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_name ON exercise_catalog (lower(name));
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_name_en ON exercise_catalog (lower(name_en));

-- RLS: all authenticated users can read
ALTER TABLE exercise_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_catalog_read" ON exercise_catalog
  FOR SELECT TO authenticated
  USING (true);
