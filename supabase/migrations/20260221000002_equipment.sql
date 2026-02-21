-- ============================================================
-- Equipment Catalog, Gym Profiles & User Equipment
-- ============================================================

-- Equipment-Katalog (Stammdaten)
CREATE TABLE equipment_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL CHECK (category IN ('machine','cable','free_weight','bodyweight','cardio','other')),
  muscle_groups TEXT[] DEFAULT '{}',
  description TEXT,
  icon TEXT,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gym-Profile (Templates wie "McFit Standard", "Home Gym")
CREATE TABLE gym_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  equipment_ids UUID[] DEFAULT '{}',
  is_template BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User-Equipment (welche Geraete hat der User?)
CREATE TABLE user_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  gym_profile_id UUID REFERENCES gym_profiles(id),
  equipment_ids UUID[] DEFAULT '{}',
  custom_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_equipment_user ON user_equipment(user_id);

-- RLS
ALTER TABLE equipment_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_all_equipment" ON equipment_catalog FOR SELECT USING (true);
CREATE POLICY "admin_manage_equipment" ON equipment_catalog FOR ALL USING (
  public.is_admin(auth.uid())
);

ALTER TABLE gym_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_all_gym_profiles" ON gym_profiles FOR SELECT USING (true);
CREATE POLICY "admin_manage_gym_profiles" ON gym_profiles FOR ALL USING (
  public.is_admin(auth.uid())
);

ALTER TABLE user_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_own_equipment" ON user_equipment FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SEED: ~50 gaengige Geraete
-- ============================================================

-- Freigewichte
INSERT INTO equipment_catalog (name, name_en, category, muscle_groups, icon) VALUES
('Langhantel', 'Barbell', 'free_weight', '{"chest","back","shoulders","legs","arms"}', '🏋️'),
('Kurzhanteln', 'Dumbbells', 'free_weight', '{"chest","back","shoulders","arms"}', '💪'),
('SZ-Stange', 'EZ Curl Bar', 'free_weight', '{"arms"}', '🏋️'),
('Kettlebell', 'Kettlebell', 'free_weight', '{"full_body","shoulders","legs"}', '🔔'),
('Gewichtsscheiben', 'Weight Plates', 'free_weight', '{"full_body"}', '⚖️'),
('Trap-Bar (Hex-Bar)', 'Trap Bar (Hex Bar)', 'free_weight', '{"legs","back"}', '🏋️'),
('Hantelbank (flach)', 'Flat Bench', 'free_weight', '{"chest","arms"}', '🪑'),
('Hantelbank (verstellbar)', 'Adjustable Bench', 'free_weight', '{"chest","shoulders","arms"}', '🪑'),
('Kurzhantel-Rack', 'Dumbbell Rack', 'free_weight', '{}', '🗄️');

-- Maschinen
INSERT INTO equipment_catalog (name, name_en, category, muscle_groups, icon) VALUES
('Beinpresse', 'Leg Press', 'machine', '{"legs"}', '🦵'),
('Beinstrecker', 'Leg Extension', 'machine', '{"legs"}', '🦵'),
('Beinbeuger', 'Leg Curl', 'machine', '{"legs"}', '🦵'),
('Brustpresse', 'Chest Press Machine', 'machine', '{"chest"}', '💪'),
('Schulterpresse', 'Shoulder Press Machine', 'machine', '{"shoulders"}', '💪'),
('Latzug-Maschine', 'Lat Pulldown Machine', 'machine', '{"back"}', '💪'),
('Rudermaschine', 'Seated Row Machine', 'machine', '{"back"}', '💪'),
('Butterfly-Maschine', 'Pec Deck / Fly Machine', 'machine', '{"chest"}', '🦋'),
('Reverse Butterfly', 'Reverse Pec Deck', 'machine', '{"shoulders","back"}', '🦋'),
('Adduktoren-Maschine', 'Adductor Machine', 'machine', '{"legs"}', '🦵'),
('Abduktoren-Maschine', 'Abductor Machine', 'machine', '{"legs"}', '🦵'),
('Wadenmaschine', 'Calf Raise Machine', 'machine', '{"legs"}', '🦵'),
('Beinpresse (vertikal)', 'Vertical Leg Press', 'machine', '{"legs"}', '🦵'),
('Hack Squat Maschine', 'Hack Squat Machine', 'machine', '{"legs"}', '🦵'),
('Smith Machine', 'Smith Machine', 'machine', '{"full_body"}', '🏋️'),
('Hip Thrust Maschine', 'Hip Thrust Machine', 'machine', '{"legs","glutes"}', '🍑'),
('Bauchmaschine (Crunch)', 'Ab Crunch Machine', 'machine', '{"core"}', '🔥'),
('Rueckenstrecker', 'Back Extension Machine', 'machine', '{"back","core"}', '💪');

-- Kabelzug
INSERT INTO equipment_catalog (name, name_en, category, muscle_groups, icon) VALUES
('Kabelzug (einfach)', 'Single Cable Pulley', 'cable', '{"full_body"}', '🔗'),
('Kabelzug (doppelt/Turm)', 'Dual Cable Tower', 'cable', '{"full_body"}', '🔗'),
('Kabelzug mit Seilgriff', 'Cable with Rope Attachment', 'cable', '{"arms","shoulders"}', '🔗'),
('Latzug (Kabel)', 'Lat Pulldown (Cable)', 'cable', '{"back"}', '🔗'),
('Kabel-Rudern (sitzend)', 'Seated Cable Row', 'cable', '{"back"}', '🔗');

-- Koerpergewicht / Calisthenics
INSERT INTO equipment_catalog (name, name_en, category, muscle_groups, icon) VALUES
('Klimmzugstange', 'Pull-Up Bar', 'bodyweight', '{"back","arms"}', '🏗️'),
('Dipstation / Dip-Barren', 'Dip Station', 'bodyweight', '{"chest","arms"}', '🏗️'),
('TRX / Schlingentrainer', 'TRX / Suspension Trainer', 'bodyweight', '{"full_body"}', '🪢'),
('Gymnastikringe', 'Gymnastic Rings', 'bodyweight', '{"full_body"}', '⭕'),
('Parallettes', 'Parallettes', 'bodyweight', '{"chest","arms","core"}', '🏗️'),
('Widerstandsbaender', 'Resistance Bands', 'bodyweight', '{"full_body"}', '🔴'),
('Ab Roller', 'Ab Wheel', 'bodyweight', '{"core"}', '🎡'),
('Gymnastikmatte', 'Exercise Mat', 'bodyweight', '{"full_body"}', '🧘');

-- Cardio
INSERT INTO equipment_catalog (name, name_en, category, muscle_groups, icon) VALUES
('Laufband', 'Treadmill', 'cardio', '{"legs","cardio"}', '🏃'),
('Crosstrainer / Ellipsentrainer', 'Elliptical Trainer', 'cardio', '{"full_body","cardio"}', '🏃'),
('Rudergeraet (Concept2)', 'Rowing Machine', 'cardio', '{"full_body","cardio"}', '🚣'),
('Spinning-Rad / Indoor Bike', 'Indoor Cycle / Spin Bike', 'cardio', '{"legs","cardio"}', '🚲'),
('Assault Bike / Air Bike', 'Assault Bike / Air Bike', 'cardio', '{"full_body","cardio"}', '🚲'),
('Stairmaster / Treppensteiger', 'Stairmaster', 'cardio', '{"legs","cardio"}', '🪜'),
('Skierg', 'SkiErg', 'cardio', '{"full_body","cardio"}', '⛷️');

-- Sonstiges
INSERT INTO equipment_catalog (name, name_en, category, muscle_groups, icon) VALUES
('Power Rack / Squat Rack', 'Power Rack / Squat Rack', 'other', '{"full_body"}', '🏗️'),
('Landmine-Attachment', 'Landmine Attachment', 'other', '{"full_body"}', '💣'),
('Foam Roller / Faszienrolle', 'Foam Roller', 'other', '{"recovery"}', '🧴'),
('Dip-Guertel (Gewichtsguertel)', 'Dip Belt (Weight Belt)', 'other', '{"chest","back","arms"}', '⛓️'),
('Griffpolster / Lifting Straps', 'Lifting Straps / Grips', 'other', '{}', '🧤');

-- ============================================================
-- SEED: 3 Gym-Profile Templates
-- ============================================================

-- Fitnessstudio Standard (McFit-Level)
INSERT INTO gym_profiles (name, description, is_template, equipment_ids)
SELECT
  'Fitnessstudio Standard',
  'Typisches Fitnessstudio mit Freigewichten, Maschinen, Kabelzug und Cardio',
  true,
  ARRAY(
    SELECT id FROM equipment_catalog WHERE name IN (
      'Langhantel', 'Kurzhanteln', 'SZ-Stange', 'Hantelbank (flach)', 'Hantelbank (verstellbar)',
      'Gewichtsscheiben', 'Kurzhantel-Rack',
      'Beinpresse', 'Beinstrecker', 'Beinbeuger', 'Brustpresse', 'Schulterpresse',
      'Latzug-Maschine', 'Rudermaschine', 'Butterfly-Maschine', 'Reverse Butterfly',
      'Adduktoren-Maschine', 'Abduktoren-Maschine', 'Wadenmaschine', 'Smith Machine',
      'Hack Squat Maschine', 'Bauchmaschine (Crunch)', 'Rueckenstrecker',
      'Kabelzug (einfach)', 'Kabelzug (doppelt/Turm)', 'Kabelzug mit Seilgriff',
      'Latzug (Kabel)', 'Kabel-Rudern (sitzend)',
      'Klimmzugstange', 'Dipstation / Dip-Barren',
      'Laufband', 'Crosstrainer / Ellipsentrainer', 'Spinning-Rad / Indoor Bike',
      'Stairmaster / Treppensteiger',
      'Power Rack / Squat Rack'
    )
  );

-- Home Gym Basis
INSERT INTO gym_profiles (name, description, is_template, equipment_ids)
SELECT
  'Home Gym Basis',
  'Grundausstattung fuer Zuhause: Kurzhanteln, Bank, Klimmzugstange, Baender',
  true,
  ARRAY(
    SELECT id FROM equipment_catalog WHERE name IN (
      'Kurzhanteln', 'Hantelbank (verstellbar)', 'Gewichtsscheiben',
      'Klimmzugstange', 'Widerstandsbaender', 'Ab Roller', 'Gymnastikmatte',
      'Kettlebell'
    )
  );

-- Calisthenics Park
INSERT INTO gym_profiles (name, description, is_template, equipment_ids)
SELECT
  'Calisthenics Park',
  'Outdoor-Training mit Eigenkoerpergewicht: Stangen, Ringe, Parallettes',
  true,
  ARRAY(
    SELECT id FROM equipment_catalog WHERE name IN (
      'Klimmzugstange', 'Dipstation / Dip-Barren', 'Gymnastikringe',
      'Parallettes', 'Widerstandsbaender', 'Ab Roller', 'Gymnastikmatte'
    )
  );
