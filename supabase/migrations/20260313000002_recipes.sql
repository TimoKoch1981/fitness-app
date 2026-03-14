-- ============================================================================
-- Migration: Recipes System v2.0
-- Moves recipes from localStorage to Supabase with full schema
-- ============================================================================

-- ── recipes table ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  meal_type TEXT CHECK (meal_type IS NULL OR meal_type IN (
    'breakfast','lunch','dinner','snack','pre_workout','post_workout'
  )),
  prep_time_min INT DEFAULT 0,
  cook_time_min INT DEFAULT 0,
  servings INT NOT NULL DEFAULT 1,
  difficulty TEXT CHECK (difficulty IN ('easy','medium','hard')) DEFAULT 'easy',
  -- Macros per serving
  calories_per_serving NUMERIC DEFAULT 0,
  protein_per_serving NUMERIC DEFAULT 0,
  carbs_per_serving NUMERIC DEFAULT 0,
  fat_per_serving NUMERIC DEFAULT 0,
  fiber_per_serving NUMERIC,
  sugar_per_serving NUMERIC,
  -- Structured data
  ingredients JSONB NOT NULL DEFAULT '[]',
  steps JSONB NOT NULL DEFAULT '[]',
  -- Meta
  tags TEXT[] DEFAULT '{}',
  allergens TEXT[] DEFAULT '{}',
  image_url TEXT,
  source_url TEXT,
  is_favorite BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  -- Fitness context
  fitness_goal TEXT[] DEFAULT '{}',
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes(meal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_is_favorite ON recipes(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(user_id, created_at DESC);

-- ── Grants ────────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE recipes TO authenticated;
GRANT SELECT ON TABLE recipes TO anon;
GRANT ALL ON TABLE recipes TO service_role;

-- ── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Users can read their own recipes + public recipes
CREATE POLICY "recipes_select" ON recipes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_public = true);

-- Users can insert their own recipes
CREATE POLICY "recipes_insert" ON recipes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own recipes
CREATE POLICY "recipes_update" ON recipes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own recipes
CREATE POLICY "recipes_delete" ON recipes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ── updated_at trigger ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_recipes_updated_at();

-- ── Supabase Storage bucket for recipe images ───────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read (bucket is public), authenticated upload to own folder
CREATE POLICY "recipe_images_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');

CREATE POLICY "recipe_images_insert" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'recipe-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "recipe_images_update" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'recipe-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "recipe_images_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'recipe-images' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Seed: 5 sample recipes (global, public, system user) ───────────────────
-- These become public sample recipes visible to all users.
-- We use a fixed UUID for the "system" user so they don't belong to any real user
-- but are visible via is_public = true.

-- NOTE: Sample recipes are now loaded client-side on-demand. No seed needed.

-- ── Notify PostgREST to reload schema ───────────────────────────────────────
NOTIFY pgrst, 'reload schema';
