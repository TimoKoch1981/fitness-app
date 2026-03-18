-- ════════════════════════════════════════════════════════════════════════
-- Mind-Body Columns: Yoga, Tai Chi, Five Tibetans Support
-- Adds subcategory, pose_category, hold_duration, sanskrit_name, breathing_cue
-- to exercise_catalog for Mind-Body exercise types.
-- ════════════════════════════════════════════════════════════════════════

-- 1. Subcategory: differentiates Yoga styles, Tai Chi forms, Five Tibetans
ALTER TABLE exercise_catalog
ADD COLUMN IF NOT EXISTS subcategory TEXT;

COMMENT ON COLUMN exercise_catalog.subcategory IS
  'Mind-body subcategory: yoga_hatha, yoga_vinyasa, yoga_power, yoga_ashtanga, yoga_yin, yoga_restorative, yoga_kundalini, yoga_bikram, tai_chi_yang24, tai_chi_yang48, tai_chi_qigong, five_tibetans';

-- 2. Pose category: for Yoga pose classification and UI filter chips
ALTER TABLE exercise_catalog
ADD COLUMN IF NOT EXISTS pose_category TEXT
  CHECK (pose_category IN (
    'standing', 'seated', 'forward_fold', 'backbend', 'twist',
    'inversion', 'balance', 'core', 'flow', 'restorative',
    'tai_chi_form', 'tai_chi_qigong', 'tibetan_rite'
  ));

COMMENT ON COLUMN exercise_catalog.pose_category IS
  'Pose/movement classification for Mind-Body exercises (Yoga pose type, Tai Chi form type, Tibetan rite)';

-- 3. Hold duration: typical hold time in seconds (Yoga poses)
ALTER TABLE exercise_catalog
ADD COLUMN IF NOT EXISTS hold_duration_seconds INTEGER;

COMMENT ON COLUMN exercise_catalog.hold_duration_seconds IS
  'Default hold duration in seconds for static poses (e.g., 30s for Warrior, 180s for Yin poses)';

-- 4. Sanskrit name: traditional name for Yoga poses
ALTER TABLE exercise_catalog
ADD COLUMN IF NOT EXISTS sanskrit_name TEXT;

COMMENT ON COLUMN exercise_catalog.sanskrit_name IS
  'Sanskrit/traditional name (e.g., Virabhadrasana I, Yi Ma Fen Zong)';

-- 5. Breathing cue: bilingual breathing instructions
ALTER TABLE exercise_catalog
ADD COLUMN IF NOT EXISTS breathing_cue JSONB;

COMMENT ON COLUMN exercise_catalog.breathing_cue IS
  'Bilingual breathing instructions: {"de": "Einatmen...", "en": "Inhale..."}';

-- ════════════════════════════════════════════════════════════════════════
-- Indexes for new columns
-- ════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_exercise_catalog_subcategory
  ON exercise_catalog (subcategory);

CREATE INDEX IF NOT EXISTS idx_exercise_catalog_pose_category
  ON exercise_catalog (pose_category);

-- ════════════════════════════════════════════════════════════════════════
-- Extend body_region CHECK to include 'mind_body'
-- ════════════════════════════════════════════════════════════════════════

-- Drop old constraint and re-add with mind_body
ALTER TABLE exercise_catalog DROP CONSTRAINT IF EXISTS exercise_catalog_body_region_check;
ALTER TABLE exercise_catalog ADD CONSTRAINT exercise_catalog_body_region_check
  CHECK (body_region IN (
    'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full_body', 'cardio', 'mind_body'
  ));

-- Extend movement_pattern CHECK to include mind-body patterns
ALTER TABLE exercise_catalog DROP CONSTRAINT IF EXISTS exercise_catalog_movement_pattern_check;
ALTER TABLE exercise_catalog ADD CONSTRAINT exercise_catalog_movement_pattern_check
  CHECK (movement_pattern IN (
    'horizontal_push', 'horizontal_pull',
    'vertical_push', 'vertical_pull',
    'hip_hinge', 'squat', 'lunge',
    'carry', 'rotation', 'anti_rotation',
    'isolation', 'cardio_steady', 'cardio_interval',
    'flexibility', 'plyometric', 'other',
    'yoga_static', 'yoga_flow', 'tai_chi_form', 'mind_body_dynamic'
  ));

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
