-- Migration: Add import_method column to recipes table
-- For tracking how a recipe was imported (json_ld, microdata, ai, manual)

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS import_method TEXT
  CHECK (import_method IN ('json_ld', 'microdata', 'ai', 'manual'));

-- Add comment
COMMENT ON COLUMN recipes.import_method IS 'How the recipe was imported: json_ld, microdata, ai, or manual';

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
