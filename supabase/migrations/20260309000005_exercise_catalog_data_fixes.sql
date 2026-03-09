-- ════════════════════════════════════════════════════════════════════════
-- Exercise Catalog Data Fixes — is_compound + primary/secondary muscles + metadata
-- Basiert auf: docs/KONZEPT_EXERCISE_CATALOG.md (5 Experten-Reviews)
-- ════════════════════════════════════════════════════════════════════════

-- ══════════════════════════════════════════
-- FIX 1: 5 kritische is_compound Fehler
-- ══════════════════════════════════════════

UPDATE exercise_catalog SET is_compound = true WHERE name = 'Kabelrudern';
UPDATE exercise_catalog SET is_compound = true WHERE name = 'Kurzhantelrudern';
UPDATE exercise_catalog SET is_compound = true WHERE name = 'Latzug';
UPDATE exercise_catalog SET is_compound = true WHERE name = 'Face Pulls';
UPDATE exercise_catalog SET is_compound = true WHERE name = 'Mountain Climbers';
UPDATE exercise_catalog SET is_compound = true WHERE name = 'Battle Ropes';

-- ══════════════════════════════════════════
-- FIX 2: Liegestuetze category: functional → strength (konsistent mit Dips)
-- ══════════════════════════════════════════

UPDATE exercise_catalog SET category = 'strength' WHERE name = 'Liegestütze';

-- ══════════════════════════════════════════
-- FIX 3: Unilateral flags
-- ══════════════════════════════════════════

UPDATE exercise_catalog SET is_unilateral = true WHERE name = 'Kurzhantelrudern';
UPDATE exercise_catalog SET is_unilateral = true WHERE name = 'Bulgarische Kniebeuge';
UPDATE exercise_catalog SET is_unilateral = true WHERE name = 'Ausfallschritte';
UPDATE exercise_catalog SET is_unilateral = true WHERE name = 'Pistol Squats';

-- ══════════════════════════════════════════
-- FIX 4: Equipment corrections
-- ══════════════════════════════════════════

UPDATE exercise_catalog SET equipment_needed = ARRAY['Wadenmaschine'] WHERE name = 'Wadenheben';
UPDATE exercise_catalog SET equipment_needed = ARRAY['Langhantel','Power Rack'] WHERE name = 'Kniebeugen';

-- ══════════════════════════════════════════
-- BACKFILL: primary_muscles, secondary_muscles, body_region, movement_pattern, force_type
-- Alle 70 bestehenden Uebungen
-- ══════════════════════════════════════════

-- ─── BRUST (Chest) ───

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['chest'],
  secondary_muscles = ARRAY['triceps','front_delts'],
  body_region = 'chest',
  movement_pattern = 'horizontal_push',
  force_type = 'push',
  sort_order = 1
WHERE name = 'Bankdrücken';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['upper_chest'],
  secondary_muscles = ARRAY['triceps','front_delts'],
  body_region = 'chest',
  movement_pattern = 'horizontal_push',
  force_type = 'push',
  sort_order = 2
WHERE name = 'Schrägbankdrücken';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['chest'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'chest',
  movement_pattern = 'isolation',
  force_type = 'push',
  sort_order = 3
WHERE name = 'Kurzhantel-Flyes';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['chest'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'chest',
  movement_pattern = 'isolation',
  force_type = 'push',
  sort_order = 4
WHERE name = 'Cable Crossover';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['chest','triceps'],
  secondary_muscles = ARRAY['front_delts'],
  body_region = 'chest',
  movement_pattern = 'horizontal_push',
  force_type = 'push',
  sort_order = 5
WHERE name = 'Dips';

-- ─── RUECKEN (Back) ───

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['lats'],
  secondary_muscles = ARRAY['biceps','rhomboids'],
  body_region = 'back',
  movement_pattern = 'vertical_pull',
  force_type = 'pull',
  sort_order = 10
WHERE name = 'Klimmzüge';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['lats','rhomboids'],
  secondary_muscles = ARRAY['traps','biceps'],
  body_region = 'back',
  movement_pattern = 'horizontal_pull',
  force_type = 'pull',
  sort_order = 11
WHERE name = 'Langhantelrudern';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['lats','rhomboids'],
  secondary_muscles = ARRAY['biceps'],
  body_region = 'back',
  movement_pattern = 'horizontal_pull',
  force_type = 'pull',
  sort_order = 12
WHERE name = 'Kurzhantelrudern';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['lats'],
  secondary_muscles = ARRAY['biceps','rhomboids'],
  body_region = 'back',
  movement_pattern = 'vertical_pull',
  force_type = 'pull',
  sort_order = 13
WHERE name = 'Latzug';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['rear_delts','rhomboids'],
  secondary_muscles = ARRAY['traps'],
  body_region = 'back',
  movement_pattern = 'horizontal_pull',
  force_type = 'pull',
  sort_order = 14
WHERE name = 'Face Pulls';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['glutes','hamstrings'],
  secondary_muscles = ARRAY['quads','erector_spinae','traps','lats'],
  body_region = 'back',
  movement_pattern = 'hip_hinge',
  force_type = 'pull',
  sort_order = 15
WHERE name = 'Kreuzheben';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['lats','rhomboids'],
  secondary_muscles = ARRAY['biceps','traps'],
  body_region = 'back',
  movement_pattern = 'horizontal_pull',
  force_type = 'pull',
  sort_order = 16
WHERE name = 'Kabelrudern';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['lats','rhomboids'],
  secondary_muscles = ARRAY['traps','biceps'],
  body_region = 'back',
  movement_pattern = 'horizontal_pull',
  force_type = 'pull',
  sort_order = 17
WHERE name = 'T-Bar Rudern';

-- ─── SCHULTERN (Shoulders) ───

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['front_delts','lateral_delts'],
  secondary_muscles = ARRAY['triceps','traps'],
  body_region = 'shoulders',
  movement_pattern = 'vertical_push',
  force_type = 'push',
  sort_order = 20
WHERE name = 'Schulterdrücken';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['lateral_delts'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'shoulders',
  movement_pattern = 'isolation',
  force_type = 'push',
  sort_order = 21
WHERE name = 'Seitheben';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['rear_delts'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'shoulders',
  movement_pattern = 'isolation',
  force_type = 'pull',
  sort_order = 22
WHERE name = 'Rear Delt Flyes';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['front_delts','lateral_delts'],
  secondary_muscles = ARRAY['triceps'],
  body_region = 'shoulders',
  movement_pattern = 'vertical_push',
  force_type = 'push',
  sort_order = 23
WHERE name = 'Arnold Press';

-- ─── BEINE (Legs) ───

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads','glutes'],
  secondary_muscles = ARRAY['hamstrings','adductors','erector_spinae'],
  body_region = 'legs',
  movement_pattern = 'squat',
  force_type = 'push',
  sort_order = 30
WHERE name = 'Kniebeugen';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads','glutes'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'legs',
  movement_pattern = 'squat',
  force_type = 'push',
  sort_order = 31
WHERE name = 'Beinpresse';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['hamstrings','glutes'],
  secondary_muscles = ARRAY['erector_spinae'],
  body_region = 'legs',
  movement_pattern = 'hip_hinge',
  force_type = 'pull',
  sort_order = 32
WHERE name = 'Rumänisches Kreuzheben';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['hamstrings'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'legs',
  movement_pattern = 'isolation',
  force_type = 'pull',
  sort_order = 33
WHERE name = 'Beinbeuger';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'legs',
  movement_pattern = 'isolation',
  force_type = 'push',
  sort_order = 34
WHERE name = 'Beinstrecker';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['calves'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'legs',
  movement_pattern = 'isolation',
  force_type = 'push',
  sort_order = 35
WHERE name = 'Wadenheben';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['glutes'],
  secondary_muscles = ARRAY['hamstrings','quads','adductors'],
  body_region = 'legs',
  movement_pattern = 'hip_hinge',
  force_type = 'push',
  sort_order = 36
WHERE name = 'Hip Thrust';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads','glutes'],
  secondary_muscles = ARRAY['hamstrings','adductors'],
  body_region = 'legs',
  movement_pattern = 'lunge',
  force_type = 'push',
  sort_order = 37
WHERE name = 'Ausfallschritte';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads','glutes'],
  secondary_muscles = ARRAY['hamstrings','adductors'],
  body_region = 'legs',
  movement_pattern = 'lunge',
  force_type = 'push',
  sort_order = 38
WHERE name = 'Bulgarische Kniebeuge';

-- ─── ARME (Arms) ───

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['biceps'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'arms',
  movement_pattern = 'isolation',
  force_type = 'pull',
  sort_order = 40
WHERE name = 'Bizeps-Curls';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['biceps','forearms'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'arms',
  movement_pattern = 'isolation',
  force_type = 'pull',
  sort_order = 41
WHERE name = 'Hammer Curls';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['triceps'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'arms',
  movement_pattern = 'isolation',
  force_type = 'push',
  sort_order = 42
WHERE name = 'Trizepsdrücken';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['triceps'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'arms',
  movement_pattern = 'isolation',
  force_type = 'push',
  sort_order = 43
WHERE name = 'Skull Crushers';

-- ─── CORE ───

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['deep_core','abs'],
  secondary_muscles = ARRAY['front_delts'],
  body_region = 'core',
  movement_pattern = 'anti_rotation',
  force_type = 'static',
  sort_order = 50
WHERE name = 'Plank';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['abs'],
  secondary_muscles = ARRAY['obliques'],
  body_region = 'core',
  movement_pattern = 'isolation',
  force_type = 'pull',
  sort_order = 51
WHERE name = 'Cable Crunches';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['abs','hip_flexors'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'core',
  movement_pattern = 'isolation',
  force_type = 'pull',
  sort_order = 52
WHERE name = 'Leg Raises';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['deep_core','obliques'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'core',
  movement_pattern = 'anti_rotation',
  force_type = 'static',
  sort_order = 53
WHERE name = 'Pallof Press';

-- ─── WEITERE COMPOUND ───

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads','glutes'],
  secondary_muscles = ARRAY['erector_spinae','traps'],
  body_region = 'legs',
  movement_pattern = 'hip_hinge',
  force_type = 'pull',
  sort_order = 60
WHERE name = 'Trap-Bar Deadlift';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['forearms','traps'],
  secondary_muscles = ARRAY['deep_core','calves'],
  body_region = 'full_body',
  movement_pattern = 'carry',
  force_type = 'static',
  sort_order = 61
WHERE name = 'Farmers Walk';

-- ─── CARDIO ───

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads','hamstrings','calves'],
  secondary_muscles = ARRAY['cardiovascular'],
  body_region = 'cardio',
  movement_pattern = 'cardio_steady',
  force_type = 'dynamic',
  sort_order = 100
WHERE name = 'Laufen (Grundlagenlauf)';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads','hamstrings','calves'],
  secondary_muscles = ARRAY['cardiovascular'],
  body_region = 'cardio',
  movement_pattern = 'cardio_interval',
  force_type = 'dynamic',
  sort_order = 101
WHERE name = 'Intervallläufe';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads','hamstrings','calves'],
  secondary_muscles = ARRAY['cardiovascular'],
  body_region = 'cardio',
  movement_pattern = 'cardio_steady',
  force_type = 'dynamic',
  sort_order = 102
WHERE name = 'Tempodauerlauf';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads','hamstrings','calves'],
  secondary_muscles = ARRAY['cardiovascular'],
  body_region = 'cardio',
  movement_pattern = 'cardio_steady',
  force_type = 'dynamic',
  sort_order = 103
WHERE name = 'Langer Lauf';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['lats','front_delts'],
  secondary_muscles = ARRAY['deep_core','cardiovascular'],
  body_region = 'cardio',
  movement_pattern = 'cardio_steady',
  force_type = 'dynamic',
  sort_order = 104
WHERE name = 'Kraulschwimmen';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['chest','quads','adductors'],
  secondary_muscles = ARRAY['front_delts','cardiovascular'],
  body_region = 'cardio',
  movement_pattern = 'cardio_steady',
  force_type = 'dynamic',
  sort_order = 105
WHERE name = 'Brustschwimmen';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['lats','front_delts'],
  secondary_muscles = ARRAY['cardiovascular'],
  body_region = 'cardio',
  movement_pattern = 'cardio_steady',
  force_type = 'dynamic',
  sort_order = 106
WHERE name = 'Rückenschwimmen';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads','glutes'],
  secondary_muscles = ARRAY['cardiovascular'],
  body_region = 'cardio',
  movement_pattern = 'cardio_steady',
  force_type = 'dynamic',
  sort_order = 107
WHERE name = 'Radfahren (Indoor)';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads','glutes'],
  secondary_muscles = ARRAY['cardiovascular'],
  body_region = 'cardio',
  movement_pattern = 'cardio_steady',
  force_type = 'dynamic',
  sort_order = 108
WHERE name = 'Radfahren (Outdoor)';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['calves','front_delts'],
  secondary_muscles = ARRAY['cardiovascular'],
  body_region = 'cardio',
  movement_pattern = 'cardio_interval',
  force_type = 'dynamic',
  sort_order = 109
WHERE name = 'Seilspringen';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads','lats'],
  secondary_muscles = ARRAY['biceps','deep_core','cardiovascular'],
  body_region = 'cardio',
  movement_pattern = 'cardio_steady',
  force_type = 'dynamic',
  sort_order = 110
WHERE name = 'Rudergerät';

-- ─── FLEXIBILITY ───

UPDATE exercise_catalog SET primary_muscles = ARRAY[]::TEXT[], secondary_muscles = ARRAY[]::TEXT[], body_region = 'full_body', movement_pattern = 'flexibility', force_type = 'dynamic', sort_order = 200 WHERE name = 'Sonnengruß A';
UPDATE exercise_catalog SET primary_muscles = ARRAY['hamstrings','calves','lats'], secondary_muscles = ARRAY['front_delts'], body_region = 'full_body', movement_pattern = 'flexibility', force_type = 'static', sort_order = 201 WHERE name = 'Herabschauender Hund';
UPDATE exercise_catalog SET primary_muscles = ARRAY['quads','glutes','hip_flexors'], secondary_muscles = ARRAY['front_delts'], body_region = 'legs', movement_pattern = 'flexibility', force_type = 'static', sort_order = 202 WHERE name = 'Krieger I';
UPDATE exercise_catalog SET primary_muscles = ARRAY['quads','glutes','hip_flexors'], secondary_muscles = ARRAY['front_delts'], body_region = 'legs', movement_pattern = 'flexibility', force_type = 'static', sort_order = 203 WHERE name = 'Krieger II';
UPDATE exercise_catalog SET primary_muscles = ARRAY['quads','glutes','deep_core'], secondary_muscles = ARRAY[]::TEXT[], body_region = 'legs', movement_pattern = 'flexibility', force_type = 'static', sort_order = 204 WHERE name = 'Krieger III';
UPDATE exercise_catalog SET primary_muscles = ARRAY['quads','adductors','obliques'], secondary_muscles = ARRAY['hip_flexors'], body_region = 'legs', movement_pattern = 'flexibility', force_type = 'static', sort_order = 205 WHERE name = 'Dreieck';
UPDATE exercise_catalog SET primary_muscles = ARRAY['hip_flexors','glutes'], secondary_muscles = ARRAY[]::TEXT[], body_region = 'legs', movement_pattern = 'flexibility', force_type = 'static', sort_order = 206 WHERE name = 'Taube';
UPDATE exercise_catalog SET primary_muscles = ARRAY['erector_spinae','abs'], secondary_muscles = ARRAY[]::TEXT[], body_region = 'core', movement_pattern = 'flexibility', force_type = 'static', sort_order = 207 WHERE name = 'Kobra';
UPDATE exercise_catalog SET primary_muscles = ARRAY['quads','deep_core'], secondary_muscles = ARRAY[]::TEXT[], body_region = 'legs', movement_pattern = 'flexibility', force_type = 'static', sort_order = 208 WHERE name = 'Baum';
UPDATE exercise_catalog SET primary_muscles = ARRAY['hamstrings','erector_spinae'], secondary_muscles = ARRAY[]::TEXT[], body_region = 'legs', movement_pattern = 'flexibility', force_type = 'static', sort_order = 209 WHERE name = 'Vorbeuge (sitzend)';
UPDATE exercise_catalog SET primary_muscles = ARRAY['erector_spinae','front_delts','hip_flexors'], secondary_muscles = ARRAY[]::TEXT[], body_region = 'full_body', movement_pattern = 'flexibility', force_type = 'static', sort_order = 210 WHERE name = 'Kind-Pose';
UPDATE exercise_catalog SET primary_muscles = ARRAY['obliques','erector_spinae'], secondary_muscles = ARRAY[]::TEXT[], body_region = 'core', movement_pattern = 'rotation', force_type = 'static', sort_order = 211 WHERE name = 'Drehsitz';
UPDATE exercise_catalog SET primary_muscles = ARRAY[]::TEXT[], secondary_muscles = ARRAY[]::TEXT[], body_region = 'full_body', movement_pattern = 'flexibility', force_type = 'static', sort_order = 212 WHERE name = 'Savasana';

-- ─── FUNCTIONAL ───

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['chest','quads','glutes'],
  secondary_muscles = ARRAY['front_delts','triceps','cardiovascular'],
  body_region = 'full_body',
  movement_pattern = 'plyometric',
  force_type = 'dynamic',
  sort_order = 150
WHERE name = 'Burpees';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['glutes','hamstrings'],
  secondary_muscles = ARRAY['deep_core','front_delts','forearms'],
  body_region = 'full_body',
  movement_pattern = 'hip_hinge',
  force_type = 'dynamic',
  sort_order = 151
WHERE name = 'Kettlebell Swing';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads','glutes','calves'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'legs',
  movement_pattern = 'plyometric',
  force_type = 'push',
  sort_order = 152
WHERE name = 'Box Jumps';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['front_delts','deep_core','quads'],
  secondary_muscles = ARRAY['glutes','traps'],
  body_region = 'full_body',
  movement_pattern = 'other',
  force_type = 'dynamic',
  sort_order = 153
WHERE name = 'Turkish Get-Up';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['deep_core','hip_flexors'],
  secondary_muscles = ARRAY['front_delts','cardiovascular'],
  body_region = 'core',
  movement_pattern = 'cardio_interval',
  force_type = 'dynamic',
  sort_order = 154
WHERE name = 'Mountain Climbers';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['front_delts','deep_core'],
  secondary_muscles = ARRAY['cardiovascular','forearms'],
  body_region = 'full_body',
  movement_pattern = 'cardio_interval',
  force_type = 'dynamic',
  sort_order = 155
WHERE name = 'Battle Ropes';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads','front_delts'],
  secondary_muscles = ARRAY['glutes','triceps','deep_core'],
  body_region = 'full_body',
  movement_pattern = 'vertical_push',
  force_type = 'push',
  sort_order = 156
WHERE name = 'Thrusters';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['front_delts','lats','deep_core'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'full_body',
  movement_pattern = 'plyometric',
  force_type = 'push',
  sort_order = 157
WHERE name = 'Medizinball-Slam';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['chest','triceps'],
  secondary_muscles = ARRAY['front_delts','deep_core'],
  body_region = 'chest',
  movement_pattern = 'horizontal_push',
  force_type = 'push',
  sort_order = 6
WHERE name = 'Liegestütze';

UPDATE exercise_catalog SET
  primary_muscles = ARRAY['quads','glutes','deep_core'],
  secondary_muscles = ARRAY[]::TEXT[],
  body_region = 'legs',
  movement_pattern = 'squat',
  force_type = 'push',
  sort_order = 39,
  is_unilateral = true
WHERE name = 'Pistol Squats';

-- ══════════════════════════════════════════
-- Set updated_at for all modified records
-- ══════════════════════════════════════════

UPDATE exercise_catalog SET updated_at = now() WHERE primary_muscles != '{}' OR is_compound = true;
