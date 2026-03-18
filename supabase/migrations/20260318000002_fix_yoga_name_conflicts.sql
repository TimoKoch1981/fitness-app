-- Fix 8 existing yoga exercises that were inserted before the Mind-Body migration.
-- They have category='flexibility' but missing subcategory + pose_category.
-- Also update names to include Sanskrit names for consistency with the new yoga catalog.

-- Krieger I → Standing pose, Hatha style
UPDATE exercise_catalog SET
  subcategory = 'yoga_hatha',
  pose_category = 'standing',
  name = 'Krieger I (Virabhadrasana I)'
WHERE name = 'Krieger I' AND category = 'flexibility';

-- Krieger II → Standing pose, Hatha style
UPDATE exercise_catalog SET
  subcategory = 'yoga_hatha',
  pose_category = 'standing',
  name = 'Krieger II (Virabhadrasana II)'
WHERE name = 'Krieger II' AND category = 'flexibility';

-- Krieger III → Balance pose, Vinyasa style
UPDATE exercise_catalog SET
  subcategory = 'yoga_vinyasa',
  pose_category = 'balance',
  name = 'Krieger III (Virabhadrasana III)'
WHERE name = 'Krieger III' AND category = 'flexibility';

-- Baum → Balance pose, Hatha style
UPDATE exercise_catalog SET
  subcategory = 'yoga_hatha',
  pose_category = 'balance',
  name = 'Baum (Vrksasana)'
WHERE name = 'Baum' AND category = 'flexibility';

-- Dreieck → Standing pose, Hatha style
UPDATE exercise_catalog SET
  subcategory = 'yoga_hatha',
  pose_category = 'standing',
  name = 'Dreieck (Trikonasana)'
WHERE name = 'Dreieck' AND category = 'flexibility';

-- Taube → Seated/floor hip opener, Yin style
UPDATE exercise_catalog SET
  subcategory = 'yoga_yin',
  pose_category = 'seated',
  name = 'Taube (Eka Pada Rajakapotasana)'
WHERE name = 'Taube' AND category = 'flexibility';

-- Kobra → Backbend, Hatha style
UPDATE exercise_catalog SET
  subcategory = 'yoga_hatha',
  pose_category = 'backbend',
  name = 'Kobra (Bhujangasana)'
WHERE name = 'Kobra' AND category = 'flexibility';

-- Herabschauender Hund → Inversion, Vinyasa style
UPDATE exercise_catalog SET
  subcategory = 'yoga_vinyasa',
  pose_category = 'inversion',
  name = 'Herabschauender Hund (Adho Mukha Svanasana)'
WHERE name = 'Herabschauender Hund' AND category = 'flexibility';
