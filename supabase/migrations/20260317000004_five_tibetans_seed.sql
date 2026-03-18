-- ════════════════════════════════════════════════════════════════════════
-- Five Tibetans Exercise Catalog Seed — 5 Rites
-- All stored as category='flexibility', subcategory='five_tibetans'
-- These use REPS (not duration) — tracked like strength but without weight.
-- ════════════════════════════════════════════════════════════════════════

INSERT INTO exercise_catalog (
  name, name_en, category, subcategory, pose_category, body_region, movement_pattern,
  difficulty, sanskrit_name, hold_duration_seconds,
  primary_muscles, secondary_muscles, equipment_needed, is_compound, is_unilateral, force_type,
  breathing_cue, tips, sort_order
) VALUES

('Tibeter 1: Drehung', 'Tibetan Rite 1: Spinning', 'flexibility', 'five_tibetans', 'tibetan_rite', 'mind_body', 'mind_body_dynamic',
 'beginner', NULL, 0,
 ARRAY['core','vestibular'], ARRAY['calves','quads'], ARRAY[]::TEXT[], false, false, 'dynamic',
 '{"de":"Normal atmen, nicht hyperventilieren","en":"Breathe normally, dont hyperventilate"}'::jsonb,
 '{"de":["Arme horizontal ausgestreckt","Im Uhrzeigersinn drehen","Bei Schwindel: sofort stoppen","Blick auf rechte Hand fixieren","Start: 5 Drehungen, Max: 21"],"en":["Arms horizontal","Spin clockwise","Stop immediately if dizzy","Fix gaze on right hand","Start: 5 spins, Max: 21"]}'::jsonb,
 400),

('Tibeter 2: Beinheben', 'Tibetan Rite 2: Leg Raises', 'flexibility', 'five_tibetans', 'tibetan_rite', 'mind_body', 'mind_body_dynamic',
 'beginner', NULL, 0,
 ARRAY['abs','hip_flexors'], ARRAY['quads','neck','core'], ARRAY[]::TEXT[], true, false, 'dynamic',
 '{"de":"Einatmen Beine+Kopf heben, Ausatmen senken","en":"Inhale raise legs+head, exhale lower"}'::jsonb,
 '{"de":["Rückenlage, Arme neben Körper","Beine und Kopf gleichzeitig heben","Beine gestreckt, Knie durchgedrückt","Langsam und kontrolliert senken","Start: 5 Wdh., Max: 21"],"en":["Lying on back, arms at sides","Raise legs and head simultaneously","Legs straight, knees locked","Lower slowly and controlled","Start: 5 reps, Max: 21"]}'::jsonb,
 401),

('Tibeter 3: Kamel-Rückbeuge', 'Tibetan Rite 3: Kneeling Backbend', 'flexibility', 'five_tibetans', 'tibetan_rite', 'mind_body', 'mind_body_dynamic',
 'beginner', NULL, 0,
 ARRAY['quads','hip_flexors','erector_spinae'], ARRAY['chest','shoulders','abs'], ARRAY[]::TEXT[], true, false, 'dynamic',
 '{"de":"Einatmen nach hinten beugen, Ausatmen aufrichten","en":"Inhale bend back, exhale straighten"}'::jsonb,
 '{"de":["Knien, Zehen aufgestellt","Hände an unterer Rücken/Gesäß","Kinn zur Brust, dann Rückbeuge","Hüfte bleibt über Knien","Start: 5 Wdh., Max: 21"],"en":["Kneeling, toes tucked","Hands on lower back/glutes","Chin to chest, then backbend","Hips stay over knees","Start: 5 reps, Max: 21"]}'::jsonb,
 402),

('Tibeter 4: Tischplatte', 'Tibetan Rite 4: Tabletop', 'flexibility', 'five_tibetans', 'tibetan_rite', 'mind_body', 'mind_body_dynamic',
 'beginner', NULL, 0,
 ARRAY['glutes','shoulders','hamstrings'], ARRAY['triceps','core','quads'], ARRAY[]::TEXT[], true, false, 'dynamic',
 '{"de":"Einatmen Hüfte heben (Tisch), Ausatmen senken","en":"Inhale lift hips (table), exhale lower"}'::jsonb,
 '{"de":["Sitzen, Beine gestreckt, Hände neben Hüften","Hüfte heben bis Körper waagerecht (Tischplatte)","Kopf sanft nach hinten","Füße flach am Boden","Start: 5 Wdh., Max: 21"],"en":["Sit, legs extended, hands beside hips","Lift hips until body is horizontal (tabletop)","Head gently back","Feet flat on floor","Start: 5 reps, Max: 21"]}'::jsonb,
 403),

('Tibeter 5: Zwei Hunde', 'Tibetan Rite 5: Two Dogs', 'flexibility', 'five_tibetans', 'tibetan_rite', 'mind_body', 'mind_body_dynamic',
 'beginner', NULL, 0,
 ARRAY['shoulders','hamstrings','core'], ARRAY['chest','quads','glutes','erector_spinae'], ARRAY[]::TEXT[], true, false, 'dynamic',
 '{"de":"Einatmen heraufschauender Hund, Ausatmen herabschauender Hund","en":"Inhale upward dog, exhale downward dog"}'::jsonb,
 '{"de":["Wechsel zwischen herauf- und herabschauendem Hund","Heraufschauender Hund: Hüfte zum Boden, Brust öffnen","Herabschauender Hund: Hüfte hoch, umgekehrtes V","Fließende Bewegung mit dem Atem","Start: 5 Wdh., Max: 21"],"en":["Alternate between upward and downward dog","Upward dog: hips toward floor, open chest","Downward dog: hips high, inverted V","Fluid movement with breath","Start: 5 reps, Max: 21"]}'::jsonb,
 404)

ON CONFLICT (name) DO NOTHING;
