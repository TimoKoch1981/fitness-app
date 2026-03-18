-- ════════════════════════════════════════════════════════════════════════
-- Yoga Exercise Catalog Seed — 40 Poses
-- All stored as category='flexibility', subcategory='yoga_*'
-- ════════════════════════════════════════════════════════════════════════

INSERT INTO exercise_catalog (
  name, name_en, category, subcategory, pose_category, body_region, movement_pattern,
  difficulty, sanskrit_name, hold_duration_seconds,
  primary_muscles, secondary_muscles, equipment_needed, is_compound, is_unilateral, force_type,
  breathing_cue, tips, sort_order
) VALUES

-- ══════════════ STANDING POSES (10) ══════════════

('Berghaltung', 'Mountain Pose', 'flexibility', 'yoga_hatha', 'standing', 'mind_body', 'yoga_static',
 'beginner', 'Tadasana', 30,
 ARRAY['quads','core'], ARRAY['calves','glutes'], ARRAY[]::TEXT[], false, false, 'static',
 '{"de":"Gleichmäßig ein- und ausatmen, Schultern senken","en":"Breathe steadily, relax shoulders down"}'::jsonb,
 '{"de":["Gewicht gleichmäßig auf beide Füße","Scheitel zur Decke strecken"],"en":["Distribute weight evenly","Reach crown toward ceiling"]}'::jsonb,
 200),

('Krieger I', 'Warrior I', 'flexibility', 'yoga_hatha', 'standing', 'mind_body', 'yoga_static',
 'beginner', 'Virabhadrasana I', 30,
 ARRAY['quads','hip_flexors','shoulders'], ARRAY['glutes','core','calves'], ARRAY[]::TEXT[], true, true, 'static',
 '{"de":"Einatmen Arme hoch, Ausatmen tiefer sinken","en":"Inhale arms up, exhale sink deeper"}'::jsonb,
 '{"de":["Hinterer Fuß 45° gedreht","Hüfte nach vorn ausrichten"],"en":["Back foot at 45°","Square hips forward"]}'::jsonb,
 201),

('Krieger II', 'Warrior II', 'flexibility', 'yoga_hatha', 'standing', 'mind_body', 'yoga_static',
 'beginner', 'Virabhadrasana II', 30,
 ARRAY['quads','hip_flexors'], ARRAY['glutes','core','shoulders'], ARRAY[]::TEXT[], true, true, 'static',
 '{"de":"Einatmen aufrichten, Ausatmen Knie beugen","en":"Inhale rise, exhale bend knee"}'::jsonb,
 '{"de":["Knie über Knöchel","Blick über vordere Hand"],"en":["Knee over ankle","Gaze over front hand"]}'::jsonb,
 202),

('Krieger III', 'Warrior III', 'flexibility', 'yoga_hatha', 'balance', 'mind_body', 'yoga_static',
 'intermediate', 'Virabhadrasana III', 20,
 ARRAY['glutes','hamstrings','core'], ARRAY['quads','shoulders','erector_spinae'], ARRAY[]::TEXT[], true, true, 'static',
 '{"de":"Gleichmäßig atmen, Körperspannung halten","en":"Breathe steadily, maintain body tension"}'::jsonb,
 '{"de":["Hüfte waagerecht halten","Von Fingerspitzen bis Ferse eine Linie"],"en":["Keep hips level","One line from fingers to heel"]}'::jsonb,
 203),

('Baum', 'Tree Pose', 'flexibility', 'yoga_hatha', 'balance', 'mind_body', 'yoga_static',
 'beginner', 'Vrksasana', 30,
 ARRAY['core','quads'], ARRAY['glutes','calves','hip_flexors'], ARRAY[]::TEXT[], false, true, 'static',
 '{"de":"Ruhig atmen, Blick fixieren","en":"Breathe calmly, fix your gaze"}'::jsonb,
 '{"de":["Fuß an Innenschenkel oder Wade, nie aufs Knie","Hände vor Brust oder über Kopf"],"en":["Foot on inner thigh or calf, never on knee","Hands at heart or overhead"]}'::jsonb,
 204),

('Dreieck', 'Triangle Pose', 'flexibility', 'yoga_hatha', 'standing', 'mind_body', 'yoga_static',
 'beginner', 'Trikonasana', 30,
 ARRAY['hamstrings','obliques'], ARRAY['quads','core','adductors'], ARRAY[]::TEXT[], true, true, 'static',
 '{"de":"Einatmen strecken, Ausatmen seitlich senken","en":"Inhale lengthen, exhale fold sideways"}'::jsonb,
 '{"de":["Beide Seiten des Rumpfes gleich lang","Hand am Schienbein oder Block"],"en":["Keep both sides of torso equal length","Hand on shin or block"]}'::jsonb,
 205),

('Seitwinkel', 'Extended Side Angle', 'flexibility', 'yoga_vinyasa', 'standing', 'mind_body', 'yoga_static',
 'intermediate', 'Utthita Parsvakonasana', 30,
 ARRAY['quads','obliques'], ARRAY['hamstrings','shoulders','core'], ARRAY[]::TEXT[], true, true, 'static',
 '{"de":"Einatmen oberen Arm strecken, Ausatmen vertiefen","en":"Inhale extend top arm, exhale deepen"}'::jsonb,
 '{"de":["Unterarm auf Oberschenkel oder Hand am Boden","Lange Linie von hinterem Fuß bis Fingerspitzen"],"en":["Forearm on thigh or hand to floor","Long line from back foot to fingertips"]}'::jsonb,
 206),

('Stuhl', 'Chair Pose', 'flexibility', 'yoga_power', 'standing', 'mind_body', 'yoga_static',
 'beginner', 'Utkatasana', 30,
 ARRAY['quads','glutes'], ARRAY['core','calves','erector_spinae'], ARRAY[]::TEXT[], true, false, 'static',
 '{"de":"Einatmen Arme hoch, Ausatmen tiefer sinken","en":"Inhale arms up, exhale sit deeper"}'::jsonb,
 '{"de":["Knie hinter Zehen","Gewicht auf Fersen"],"en":["Knees behind toes","Weight in heels"]}'::jsonb,
 207),

('Tiefe Hocke', 'Garland Pose', 'flexibility', 'yoga_hatha', 'standing', 'mind_body', 'yoga_static',
 'beginner', 'Malasana', 30,
 ARRAY['hip_flexors','adductors'], ARRAY['quads','glutes','core'], ARRAY[]::TEXT[], true, false, 'static',
 '{"de":"Tief atmen, Becken entspannen","en":"Breathe deeply, relax pelvis"}'::jsonb,
 '{"de":["Fersen am Boden oder auf Decke","Ellbogen drücken Knie auseinander"],"en":["Heels on ground or blanket","Elbows push knees apart"]}'::jsonb,
 208),

('Tiefer Ausfallschritt', 'Low Lunge', 'flexibility', 'yoga_vinyasa', 'standing', 'mind_body', 'yoga_static',
 'beginner', 'Anjaneyasana', 30,
 ARRAY['hip_flexors','quads'], ARRAY['glutes','core','psoas'], ARRAY[]::TEXT[], true, true, 'static',
 '{"de":"Einatmen Arme heben, Ausatmen Hüfte senken","en":"Inhale lift arms, exhale sink hips"}'::jsonb,
 '{"de":["Knie über Knöchel","Hinteres Knie auf Matte ablegen"],"en":["Knee over ankle","Back knee on mat"]}'::jsonb,
 209),

-- ══════════════ FORWARD FOLDS (4) ══════════════

('Stehende Vorbeuge', 'Standing Forward Fold', 'flexibility', 'yoga_hatha', 'forward_fold', 'mind_body', 'yoga_static',
 'beginner', 'Uttanasana', 30,
 ARRAY['hamstrings','erector_spinae'], ARRAY['calves','glutes'], ARRAY[]::TEXT[], true, false, 'static',
 '{"de":"Ausatmen nach vorn falten, Einatmen leicht heben","en":"Exhale fold forward, inhale lift slightly"}'::jsonb,
 '{"de":["Knie leicht gebeugt erlaubt","Aus der Hüfte falten, nicht aus dem Rücken"],"en":["Slight knee bend is fine","Fold from hips, not lower back"]}'::jsonb,
 210),

('Sitzende Vorbeuge', 'Seated Forward Fold', 'flexibility', 'yoga_hatha', 'forward_fold', 'mind_body', 'yoga_static',
 'beginner', 'Paschimottanasana', 45,
 ARRAY['hamstrings','erector_spinae'], ARRAY['calves','glutes'], ARRAY[]::TEXT[], true, false, 'static',
 '{"de":"Ausatmen tiefer falten, Einatmen Rücken strecken","en":"Exhale fold deeper, inhale lengthen spine"}'::jsonb,
 '{"de":["Gurt um Füße bei eingeschränkter Flexibilität","Bauchnabel Richtung Oberschenkel"],"en":["Use strap around feet if needed","Navel toward thighs"]}'::jsonb,
 211),

('Kindshaltung', 'Childs Pose', 'flexibility', 'yoga_hatha', 'forward_fold', 'mind_body', 'yoga_static',
 'beginner', 'Balasana', 60,
 ARRAY['erector_spinae','hip_flexors'], ARRAY['shoulders','quads'], ARRAY[]::TEXT[], false, false, 'static',
 '{"de":"Tief in den Bauch atmen, loslassen","en":"Breathe deeply into belly, let go"}'::jsonb,
 '{"de":["Knie zusammen oder weit, beides ok","Arme nach vorn gestreckt oder neben dem Körper"],"en":["Knees together or wide, both fine","Arms extended forward or alongside body"]}'::jsonb,
 212),

('Taube', 'Pigeon Pose', 'flexibility', 'yoga_hatha', 'forward_fold', 'mind_body', 'yoga_static',
 'intermediate', 'Eka Pada Rajakapotasana', 60,
 ARRAY['glutes','hip_flexors'], ARRAY['hamstrings','erector_spinae','piriformis'], ARRAY[]::TEXT[], false, true, 'static',
 '{"de":"Tief atmen, Hüfte sinken lassen","en":"Breathe deeply, let hips sink"}'::jsonb,
 '{"de":["Vorderes Schienbein möglichst parallel zur Mattenvorderkante","Bei Knieschmerzen: Rückenlage-Variante"],"en":["Front shin parallel to mat edge if possible","If knee pain: reclined variation"]}'::jsonb,
 213),

-- ══════════════ BACKBENDS (6) ══════════════

('Kobra', 'Cobra Pose', 'flexibility', 'yoga_hatha', 'backbend', 'mind_body', 'yoga_static',
 'beginner', 'Bhujangasana', 20,
 ARRAY['erector_spinae','chest'], ARRAY['shoulders','abs','glutes'], ARRAY[]::TEXT[], true, false, 'dynamic',
 '{"de":"Einatmen heben, Ausatmen senken","en":"Inhale lift, exhale lower"}'::jsonb,
 '{"de":["Ellbogen nah am Körper","Schultern weg von Ohren","Blick nach vorn"],"en":["Elbows close to body","Shoulders away from ears","Gaze forward"]}'::jsonb,
 214),

('Heraufschauender Hund', 'Upward Facing Dog', 'flexibility', 'yoga_vinyasa', 'backbend', 'mind_body', 'yoga_static',
 'intermediate', 'Urdhva Mukha Svanasana', 15,
 ARRAY['erector_spinae','chest','shoulders'], ARRAY['abs','quads','hip_flexors'], ARRAY[]::TEXT[], true, false, 'dynamic',
 '{"de":"Einatmen öffnen, Ausatmen Herabschauender Hund","en":"Inhale open, exhale to Down Dog"}'::jsonb,
 '{"de":["Oberschenkel vom Boden","Handgelenke unter Schultern"],"en":["Thighs off floor","Wrists under shoulders"]}'::jsonb,
 215),

('Brücke', 'Bridge Pose', 'flexibility', 'yoga_hatha', 'backbend', 'mind_body', 'yoga_static',
 'beginner', 'Setu Bandhasana', 30,
 ARRAY['glutes','erector_spinae'], ARRAY['hamstrings','quads','core'], ARRAY[]::TEXT[], true, false, 'static',
 '{"de":"Einatmen Hüfte heben, Ausatmen halten","en":"Inhale lift hips, exhale hold"}'::jsonb,
 '{"de":["Füße hüftbreit, Knie über Knöcheln","Schulterblätter zusammen"],"en":["Feet hip-width, knees over ankles","Shoulder blades together"]}'::jsonb,
 216),

('Kamel', 'Camel Pose', 'flexibility', 'yoga_hatha', 'backbend', 'mind_body', 'yoga_static',
 'intermediate', 'Ustrasana', 20,
 ARRAY['hip_flexors','chest','erector_spinae'], ARRAY['quads','abs','shoulders'], ARRAY[]::TEXT[], true, false, 'static',
 '{"de":"Einatmen Brust öffnen, Ausatmen nach hinten greifen","en":"Inhale open chest, exhale reach back"}'::jsonb,
 '{"de":["Hände an Fersen oder an unterer Rücken","Hüfte über Knie schieben"],"en":["Hands to heels or lower back","Push hips forward over knees"]}'::jsonb,
 217),

('Rad', 'Wheel Pose', 'flexibility', 'yoga_power', 'backbend', 'mind_body', 'yoga_static',
 'advanced', 'Urdhva Dhanurasana', 15,
 ARRAY['erector_spinae','shoulders','hip_flexors'], ARRAY['glutes','quads','chest','triceps'], ARRAY[]::TEXT[], true, false, 'dynamic',
 '{"de":"Gleichmäßig atmen, nicht den Atem anhalten","en":"Breathe steadily, dont hold breath"}'::jsonb,
 '{"de":["Füße und Hände parallel","Zuerst auf Kopf drücken, dann strecken"],"en":["Feet and hands parallel","Press to crown first, then straighten"]}'::jsonb,
 218),

('Katze-Kuh', 'Cat-Cow', 'flexibility', 'yoga_hatha', 'backbend', 'mind_body', 'yoga_flow',
 'beginner', 'Marjaryasana-Bitilasana', 0,
 ARRAY['erector_spinae','abs'], ARRAY['shoulders','hip_flexors'], ARRAY[]::TEXT[], false, false, 'dynamic',
 '{"de":"Einatmen Kuh (Bauch senken), Ausatmen Katze (Rücken runden)","en":"Inhale Cow (belly drops), Exhale Cat (round back)"}'::jsonb,
 '{"de":["Handgelenke unter Schultern, Knie unter Hüfte","Bewegung mit dem Atem synchronisieren"],"en":["Wrists under shoulders, knees under hips","Sync movement with breath"]}'::jsonb,
 219),

-- ══════════════ SEATED POSES (4) ══════════════

('Stab', 'Staff Pose', 'flexibility', 'yoga_hatha', 'seated', 'mind_body', 'yoga_static',
 'beginner', 'Dandasana', 30,
 ARRAY['core','quads'], ARRAY['erector_spinae','hip_flexors'], ARRAY[]::TEXT[], false, false, 'static',
 '{"de":"Aufrecht sitzen, Scheitel zur Decke","en":"Sit tall, crown toward ceiling"}'::jsonb,
 '{"de":["Beine aktiv, Zehen zum Körper ziehen","Hände neben Hüften am Boden"],"en":["Legs active, flex feet","Hands beside hips on floor"]}'::jsonb,
 220),

('Lotus', 'Lotus Pose', 'flexibility', 'yoga_hatha', 'seated', 'mind_body', 'yoga_static',
 'advanced', 'Padmasana', 120,
 ARRAY['hip_flexors','adductors'], ARRAY['core','glutes'], ARRAY[]::TEXT[], false, false, 'static',
 '{"de":"Meditationsatmung: lang und gleichmäßig","en":"Meditation breath: long and even"}'::jsonb,
 '{"de":["Nur bei offener Hüfte, nie erzwingen","Alternative: Schneidersitz"],"en":["Only with open hips, never force","Alternative: easy cross-legged"]}'::jsonb,
 221),

('Schmetterling', 'Butterfly Pose', 'flexibility', 'yoga_hatha', 'seated', 'mind_body', 'yoga_static',
 'beginner', 'Baddha Konasana', 45,
 ARRAY['adductors','hip_flexors'], ARRAY['glutes','core'], ARRAY[]::TEXT[], false, false, 'static',
 '{"de":"Ausatmen Knie zum Boden sinken lassen","en":"Exhale let knees drop toward floor"}'::jsonb,
 '{"de":["Fersen nah am Körper","Aufrechter Rücken oder Vorbeuge"],"en":["Heels close to body","Upright back or fold forward"]}'::jsonb,
 222),

('Sitzende Drehung', 'Seated Twist', 'flexibility', 'yoga_hatha', 'twist', 'mind_body', 'yoga_static',
 'beginner', 'Ardha Matsyendrasana', 30,
 ARRAY['obliques','erector_spinae'], ARRAY['core','hip_flexors'], ARRAY[]::TEXT[], false, true, 'static',
 '{"de":"Einatmen aufrichten, Ausatmen tiefer drehen","en":"Inhale lengthen, exhale twist deeper"}'::jsonb,
 '{"de":["Drehung aus der Brustwirbelsäule, nicht aus dem unteren Rücken","Blick über hintere Schulter"],"en":["Twist from thoracic spine, not lower back","Gaze over back shoulder"]}'::jsonb,
 223),

-- ══════════════ CORE (3) ══════════════

('Boot', 'Boat Pose', 'flexibility', 'yoga_power', 'core', 'mind_body', 'yoga_static',
 'intermediate', 'Navasana', 20,
 ARRAY['abs','hip_flexors'], ARRAY['quads','core','erector_spinae'], ARRAY[]::TEXT[], true, false, 'static',
 '{"de":"Gleichmäßig atmen, Brust offen halten","en":"Breathe steadily, keep chest open"}'::jsonb,
 '{"de":["V-Form: Beine 45° angehoben","Anfänger: Knie gebeugt"],"en":["V-shape: legs at 45°","Beginners: bent knees"]}'::jsonb,
 224),

('Brett', 'Plank Pose', 'flexibility', 'yoga_power', 'core', 'mind_body', 'yoga_static',
 'beginner', 'Phalakasana', 30,
 ARRAY['core','shoulders'], ARRAY['quads','glutes','chest'], ARRAY[]::TEXT[], true, false, 'static',
 '{"de":"Gleichmäßig atmen, Nabel zur Wirbelsäule","en":"Breathe steadily, navel to spine"}'::jsonb,
 '{"de":["Gerade Linie von Kopf bis Fersen","Hüfte nicht durchhängen lassen"],"en":["Straight line from head to heels","Dont let hips sag"]}'::jsonb,
 225),

('Yoga-Liegestütz', 'Four-Limbed Staff', 'flexibility', 'yoga_vinyasa', 'core', 'mind_body', 'yoga_flow',
 'intermediate', 'Chaturanga Dandasana', 5,
 ARRAY['triceps','chest','core'], ARRAY['shoulders','quads'], ARRAY[]::TEXT[], true, false, 'dynamic',
 '{"de":"Ausatmen senken, Einatmen heraufschauender Hund","en":"Exhale lower, inhale upward dog"}'::jsonb,
 '{"de":["Ellbogen eng am Körper, 90°","Ganzer Körper als Brett senken"],"en":["Elbows tight to body at 90°","Lower as one plank"]}'::jsonb,
 226),

-- ══════════════ INVERSIONS (4) ══════════════

('Herabschauender Hund', 'Downward Facing Dog', 'flexibility', 'yoga_hatha', 'inversion', 'mind_body', 'yoga_static',
 'beginner', 'Adho Mukha Svanasana', 30,
 ARRAY['shoulders','hamstrings','calves'], ARRAY['core','quads','erector_spinae'], ARRAY[]::TEXT[], true, false, 'static',
 '{"de":"Tief und gleichmäßig atmen, Fersen zum Boden drücken","en":"Breathe deeply, press heels toward floor"}'::jsonb,
 '{"de":["Umgekehrtes V: Hüfte höchster Punkt","Knie leicht gebeugt ok"],"en":["Inverted V: hips highest point","Slight knee bend ok"]}'::jsonb,
 227),

('Schulterstand', 'Shoulder Stand', 'flexibility', 'yoga_hatha', 'inversion', 'mind_body', 'yoga_static',
 'intermediate', 'Salamba Sarvangasana', 30,
 ARRAY['shoulders','core'], ARRAY['triceps','erector_spinae','quads'], ARRAY[]::TEXT[], true, false, 'static',
 '{"de":"Ruhig atmen, Kinn zur Brust","en":"Breathe calmly, chin to chest"}'::jsonb,
 '{"de":["Decke unter Schultern für Nackenentlastung","Niemals den Kopf drehen"],"en":["Blanket under shoulders to protect neck","Never turn your head"]}'::jsonb,
 228),

('Pflug', 'Plow Pose', 'flexibility', 'yoga_hatha', 'inversion', 'mind_body', 'yoga_static',
 'intermediate', 'Halasana', 30,
 ARRAY['hamstrings','erector_spinae'], ARRAY['shoulders','core'], ARRAY[]::TEXT[], true, false, 'static',
 '{"de":"Langsam atmen, nicht den Hals belasten","en":"Breathe slowly, dont strain neck"}'::jsonb,
 '{"de":["Zehen zum Boden hinter dem Kopf","Arme am Boden verschränkt oder gestreckt"],"en":["Toes to floor behind head","Arms interlaced or extended on floor"]}'::jsonb,
 229),

('Kopfstand', 'Headstand', 'flexibility', 'yoga_ashtanga', 'inversion', 'mind_body', 'yoga_static',
 'advanced', 'Sirsasana', 30,
 ARRAY['shoulders','core'], ARRAY['triceps','forearms','erector_spinae'], ARRAY[]::TEXT[], true, false, 'static',
 '{"de":"Gleichmäßig und ruhig atmen","en":"Breathe evenly and calmly"}'::jsonb,
 '{"de":["An der Wand üben","Unterarme als stabile Basis","Gewicht NICHT auf dem Kopf"],"en":["Practice at wall","Forearms as stable base","Weight NOT on head"]}'::jsonb,
 230),

-- ══════════════ BALANCE (3) ══════════════

('Krähe', 'Crow Pose', 'flexibility', 'yoga_power', 'balance', 'mind_body', 'yoga_static',
 'advanced', 'Bakasana', 15,
 ARRAY['core','shoulders','triceps'], ARRAY['hip_flexors','forearms'], ARRAY[]::TEXT[], true, false, 'static',
 '{"de":"Blick nach vorn, nicht nach unten","en":"Look forward, not down"}'::jsonb,
 '{"de":["Knie auf Oberarme","Kissen vor Kopf zum Üben"],"en":["Knees on upper arms","Pillow in front for practice"]}'::jsonb,
 231),

('Adler', 'Eagle Pose', 'flexibility', 'yoga_hatha', 'balance', 'mind_body', 'yoga_static',
 'intermediate', 'Garudasana', 20,
 ARRAY['quads','core'], ARRAY['glutes','shoulders','calves'], ARRAY[]::TEXT[], false, true, 'static',
 '{"de":"Ruhig atmen, Blick fixieren","en":"Breathe calmly, fix gaze"}'::jsonb,
 '{"de":["Arme und Beine umwickeln","Knie tief beugen für Balance"],"en":["Wrap arms and legs","Bend standing knee deeply for balance"]}'::jsonb,
 232),

('Tänzer', 'Dancer Pose', 'flexibility', 'yoga_hatha', 'balance', 'mind_body', 'yoga_static',
 'intermediate', 'Natarajasana', 20,
 ARRAY['quads','hip_flexors','shoulders'], ARRAY['glutes','core','hamstrings'], ARRAY[]::TEXT[], false, true, 'static',
 '{"de":"Einatmen heben, Ausatmen nach vorn und hinten strecken","en":"Inhale lift, exhale reach forward and back"}'::jsonb,
 '{"de":["Standbein leicht gebeugt","Fuß in die Hand drücken, nicht ziehen"],"en":["Slight bend in standing leg","Press foot into hand, dont pull"]}'::jsonb,
 233),

-- ══════════════ TWISTS (2) ══════════════

('Dreh-Dreieck', 'Revolved Triangle', 'flexibility', 'yoga_vinyasa', 'twist', 'mind_body', 'yoga_static',
 'intermediate', 'Parivrtta Trikonasana', 30,
 ARRAY['obliques','hamstrings'], ARRAY['core','erector_spinae','calves'], ARRAY[]::TEXT[], true, true, 'static',
 '{"de":"Einatmen strecken, Ausatmen drehen","en":"Inhale lengthen, exhale twist"}'::jsonb,
 '{"de":["Hand am Boden oder auf Block","Drehung aus dem Brustkorb"],"en":["Hand on floor or block","Twist from ribcage"]}'::jsonb,
 234),

('Halbmond', 'Half Moon Pose', 'flexibility', 'yoga_vinyasa', 'balance', 'mind_body', 'yoga_static',
 'intermediate', 'Ardha Chandrasana', 20,
 ARRAY['glutes','core','obliques'], ARRAY['quads','hamstrings','shoulders'], ARRAY[]::TEXT[], false, true, 'static',
 '{"de":"Gleichmäßig atmen, Blick nach oben oder geradeaus","en":"Breathe steadily, gaze up or straight"}'::jsonb,
 '{"de":["Untere Hand auf Block für mehr Stabilität","Oberes Bein aktiv, Fuß geflext"],"en":["Bottom hand on block for stability","Top leg active, foot flexed"]}'::jsonb,
 235),

-- ══════════════ RESTORATIVE (3) ══════════════

('Totenhaltung', 'Corpse Pose', 'flexibility', 'yoga_hatha', 'restorative', 'mind_body', 'yoga_static',
 'beginner', 'Savasana', 300,
 ARRAY[]::TEXT[], ARRAY[]::TEXT[], ARRAY[]::TEXT[], false, false, 'static',
 '{"de":"Natürlich atmen, Körper komplett entspannen","en":"Breathe naturally, relax body completely"}'::jsonb,
 '{"de":["Arme neben dem Körper, Handflächen nach oben","Decke bei Kälte"],"en":["Arms beside body, palms up","Blanket if cold"]}'::jsonb,
 236),

('Beine-an-Wand', 'Legs Up the Wall', 'flexibility', 'yoga_restorative', 'restorative', 'mind_body', 'yoga_static',
 'beginner', 'Viparita Karani', 300,
 ARRAY[]::TEXT[], ARRAY['hamstrings','calves'], ARRAY[]::TEXT[], false, false, 'static',
 '{"de":"Tief und langsam atmen, Augen schließen","en":"Breathe deeply and slowly, close eyes"}'::jsonb,
 '{"de":["Gesäß nah an der Wand","Kissen unter Hüfte optional"],"en":["Buttocks close to wall","Pillow under hips optional"]}'::jsonb,
 237),

('Liegender Schmetterling', 'Reclined Butterfly', 'flexibility', 'yoga_restorative', 'restorative', 'mind_body', 'yoga_static',
 'beginner', 'Supta Baddha Konasana', 300,
 ARRAY['adductors','hip_flexors'], ARRAY[]::TEXT[], ARRAY[]::TEXT[], false, false, 'static',
 '{"de":"Bauchatmung, Knie sinken lassen","en":"Belly breathing, let knees fall"}'::jsonb,
 '{"de":["Kissen unter Knie bei Spannung","Arme seitlich oder über Kopf"],"en":["Pillows under knees if tight","Arms at sides or overhead"]}'::jsonb,
 238),

-- ══════════════ FLOW/SEQUENCE (1) ══════════════

('Sonnengruß', 'Sun Salutation', 'flexibility', 'yoga_vinyasa', 'flow', 'mind_body', 'yoga_flow',
 'beginner', 'Surya Namaskar', 0,
 ARRAY['full_body'], ARRAY['shoulders','hamstrings','core','chest','quads'], ARRAY[]::TEXT[], true, false, 'dynamic',
 '{"de":"Ein Atemzug pro Bewegung: Einatmen heben, Ausatmen falten","en":"One breath per movement: inhale lift, exhale fold"}'::jsonb,
 '{"de":["12 Positionen pro Runde","Langsam beginnen, dann Tempo steigern","3-12 Runden empfohlen"],"en":["12 positions per round","Start slow, then increase pace","3-12 rounds recommended"]}'::jsonb,
 239)

ON CONFLICT (name) DO NOTHING;
