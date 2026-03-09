-- ════════════════════════════════════════════════════════════════════════
-- Exercise Catalog — 52 neue Uebungen (70 bestehend → 122 gesamt)
-- Prioritaet HOCH: Im defaultPlan referenziert (FUNKTIONS-BUG)
-- Prioritaet HOCH: Coverage-Luecken schliessen
-- Prioritaet MITTEL: Gaengige Varianten & Maschinen
-- Prioritaet NORMAL: Cardio & Functional Ergaenzungen
-- ════════════════════════════════════════════════════════════════════════

INSERT INTO exercise_catalog (name, name_en, aliases, category, muscle_groups, description, description_en, video_url_de, video_url_en, difficulty, equipment_needed, is_compound, primary_muscles, secondary_muscles, body_region, movement_pattern, force_type, is_unilateral, sort_order) VALUES

-- ════════════════════════════════════════
-- PRIORITAET HOCH — Im defaultPlan referenziert
-- ════════════════════════════════════════

('Reverse Hyperextension', 'Reverse Hyperextension', ARRAY['Reverse Hyper','Rueckwaerts-Hyperextension'], 'strength',
 ARRAY['Gluteus','Hamstrings','Erector Spinae'],
 'Bauchlage auf Bank/Geraet, Beine nach hinten-oben heben. Exzellent fuer Gluteus und untere Rueckenmuskulatur.',
 'Prone on bench/machine, raise legs backwards and up. Excellent for glutes and lower back.',
 'https://www.youtube.com/watch?v=ZeRsNzFcQLQ', 'https://www.youtube.com/watch?v=ZeRsNzFcQLQ',
 'intermediate', ARRAY['Hyperextension-Bank'], true,
 ARRAY['glutes','hamstrings'], ARRAY['erector_spinae'], 'legs', 'hip_hinge', 'pull', false, 70),

('Brustgestuetztes Rudern', 'Chest-Supported Row', ARRAY['Incline Row','Seal Row'], 'strength',
 ARRAY['Latissimus','Rhomboiden','Bizeps'],
 'Bauchlage auf Schraegbank, Kurzhanteln zur Brust ziehen. Eliminiert Schwung, isoliert Rueckenmuskulatur.',
 'Prone on incline bench, row dumbbells to chest. Eliminates momentum, isolates back muscles.',
 'https://www.youtube.com/watch?v=H75im9fAUMc', 'https://www.youtube.com/watch?v=H75im9fAUMc',
 'beginner', ARRAY['Kurzhanteln','Schraegbank'], true,
 ARRAY['lats','rhomboids'], ARRAY['biceps','traps'], 'back', 'horizontal_pull', 'pull', false, 18),

('Landmine Press', 'Landmine Press', ARRAY['Landmine Schulterdruecken'], 'strength',
 ARRAY['vordere Schulter','obere Brust','Trizeps'],
 'Langhantel in Landmine, einhaendig nach schraeg-oben druecken. Schulterfreundlicher als klassisches OHP.',
 'Barbell in landmine, press single-arm up at angle. More shoulder-friendly than classic OHP.',
 'https://www.youtube.com/watch?v=Oy2bEbL0B30', 'https://www.youtube.com/watch?v=Oy2bEbL0B30',
 'intermediate', ARRAY['Langhantel','Landmine'], true,
 ARRAY['front_delts','upper_chest'], ARRAY['triceps','deep_core'], 'shoulders', 'vertical_push', 'push', true, 24),

('Dead Hang', 'Dead Hang', ARRAY['Toter Hang','Passive Hang'], 'functional',
 ARRAY['Unterarme','Latissimus','Schulter'],
 'An der Stange haengen mit gestreckten Armen. Staerkt Griffkraft und dekomprimiert die Wirbelsaeule.',
 'Hang from bar with straight arms. Builds grip strength and decompresses the spine.',
 'https://www.youtube.com/watch?v=mFnEMMy_7FU', 'https://www.youtube.com/watch?v=mFnEMMy_7FU',
 'beginner', ARRAY['Klimmzugstange'], false,
 ARRAY['forearms','lats'], ARRAY['front_delts'], 'back', 'other', 'static', false, 62),

('Negative Klimmzuege', 'Negative Pull-Ups', ARRAY['Eccentric Pull-Ups','Negativ-Klimmzuege'], 'strength',
 ARRAY['Latissimus','Bizeps','Rhomboiden'],
 'Oben einsteigen (Kiste/Sprung), dann langsam 3-5 Sek. ablassen. Aufbau-Uebung fuer volle Klimmzuege.',
 'Start at top position (step/jump up), slowly lower 3-5 sec. Progressive exercise toward full pull-ups.',
 'https://www.youtube.com/watch?v=S3gKGg2ESKU', 'https://www.youtube.com/watch?v=S3gKGg2ESKU',
 'beginner', ARRAY['Klimmzugstange'], true,
 ARRAY['lats'], ARRAY['biceps','rhomboids'], 'back', 'vertical_pull', 'pull', false, 19),

-- ════════════════════════════════════════
-- PRIORITAET HOCH — Coverage-Luecken
-- ════════════════════════════════════════

('Shrugs', 'Shrugs', ARRAY['Schulterheben','Nackenziehen','Trap-Shrugs'], 'strength',
 ARRAY['Trapezius'],
 'Kurzhanteln oder Langhantel seitlich halten, Schultern zu den Ohren ziehen. Einzige direkte Trapezius-Isolation.',
 'Hold dumbbells or barbell at sides, shrug shoulders to ears. Only direct trapezius isolation.',
 'https://www.youtube.com/watch?v=cJRVVxmytaM', 'https://www.youtube.com/watch?v=cJRVVxmytaM',
 'beginner', ARRAY['Kurzhanteln'], false,
 ARRAY['traps'], ARRAY[]::TEXT[], 'shoulders', 'isolation', 'pull', false, 25),

('Side Plank', 'Side Plank', ARRAY['Seitlicher Unterarmstuetz','Seiststuetz'], 'strength',
 ARRAY['schraeger Bauch','Core'],
 'Seitlage auf Unterarm, Koerper gerade halten. Anti-Lateral-Flexion. 30-60 Sek pro Seite.',
 'Side-lying on forearm, keep body straight. Anti-lateral flexion. 30-60 sec per side.',
 'https://www.youtube.com/watch?v=K2VljzCC16g', 'https://www.youtube.com/watch?v=K2VljzCC16g',
 'beginner', ARRAY[]::TEXT[], false,
 ARRAY['obliques','deep_core'], ARRAY['glutes'], 'core', 'anti_rotation', 'static', true, 54),

('Cable Woodchop', 'Cable Woodchop', ARRAY['Holzhacker','Wood Chop','Kabelzug Rotation'], 'functional',
 ARRAY['schraeger Bauch','Core'],
 'Am Kabelzug von oben nach unten (oder umgekehrt) diagonal ziehen. Rotationskraft fuer Sport und Alltag.',
 'At cable machine, pull diagonally from high to low (or reverse). Rotational power for sports and daily life.',
 'https://www.youtube.com/watch?v=pAplQXk3dkU', 'https://www.youtube.com/watch?v=pAplQXk3dkU',
 'intermediate', ARRAY['Kabelzug'], true,
 ARRAY['obliques','deep_core'], ARRAY['front_delts'], 'core', 'rotation', 'pull', false, 55),

('Hueft-Abduktion', 'Hip Abduction Machine', ARRAY['Abduktoren-Maschine','Hip Abduction'], 'strength',
 ARRAY['Abduktoren','Gluteus'],
 'An der Maschine Beine nach aussen druecken. Kraeftigt Gluteus medius und Abduktoren. Wichtig fuer Kniestabilitaet.',
 'Push legs outward at machine. Strengthens gluteus medius and abductors. Important for knee stability.',
 'https://www.youtube.com/watch?v=FhSgXfLbNUk', 'https://www.youtube.com/watch?v=FhSgXfLbNUk',
 'beginner', ARRAY['Abduktoren-Maschine'], false,
 ARRAY['abductors','glutes'], ARRAY[]::TEXT[], 'legs', 'isolation', 'push', false, 71),

('Adduktoren-Maschine', 'Hip Adduction Machine', ARRAY['Adduktoren','Hip Adduction'], 'strength',
 ARRAY['Adduktoren'],
 'An der Maschine Beine zusammendruecken. Kraeftigt die Innenseite der Oberschenkel.',
 'Squeeze legs together at machine. Strengthens inner thigh muscles.',
 'https://www.youtube.com/watch?v=1e5H1yB0K4U', 'https://www.youtube.com/watch?v=1e5H1yB0K4U',
 'beginner', ARRAY['Adduktoren-Maschine'], false,
 ARRAY['adductors'], ARRAY[]::TEXT[], 'legs', 'isolation', 'push', false, 72),

('Hyperextension', 'Back Extension', ARRAY['Rueckenstrecken','Rueckenstrecker','Roman Chair'], 'strength',
 ARRAY['Erector Spinae','Gluteus'],
 'Bauchlage auf Hyperextension-Bank, Oberkoerper senken und wieder heben. Staerkt die untere Rueckenmuskulatur.',
 'Prone on hyperextension bench, lower and raise torso. Strengthens lower back muscles.',
 'https://www.youtube.com/watch?v=ph3pddpKzzw', 'https://www.youtube.com/watch?v=ph3pddpKzzw',
 'beginner', ARRAY['Hyperextension-Bank'], false,
 ARRAY['erector_spinae','glutes'], ARRAY['hamstrings'], 'back', 'hip_hinge', 'pull', false, 73),

-- ════════════════════════════════════════
-- PRIORITAET MITTEL — Gaengige Varianten
-- ════════════════════════════════════════

('Kurzhantel-Schraegbankdruecken', 'Incline Dumbbell Press', ARRAY['Incline DB Press','KH Schraegbank'], 'strength',
 ARRAY['obere Brust','Trizeps','vordere Schulter'],
 'Kurzhanteln auf Schraegbank (30-45 Grad) druecken. Mehr ROM als Langhantel-Variante.',
 'Press dumbbells on incline bench (30-45 deg). More ROM than barbell variant.',
 'https://www.youtube.com/watch?v=8iPEnn-ltC8', 'https://www.youtube.com/watch?v=8iPEnn-ltC8',
 'intermediate', ARRAY['Kurzhanteln','Schraegbank'], true,
 ARRAY['upper_chest'], ARRAY['triceps','front_delts'], 'chest', 'horizontal_push', 'push', false, 7),

('Preacher Curl', 'Preacher Curl', ARRAY['Scott Curl','Larry-Scott-Curl'], 'strength',
 ARRAY['Bizeps'],
 'Arme auf Preacher-Bank aufgelegt, Curls ohne Schwungmoeglichkeit. Strenge Isolation.',
 'Arms resting on preacher bench, curls without momentum. Strict isolation.',
 'https://www.youtube.com/watch?v=fIWP-FRFNU0', 'https://www.youtube.com/watch?v=fIWP-FRFNU0',
 'beginner', ARRAY['SZ-Stange','Preacher-Bank'], false,
 ARRAY['biceps'], ARRAY[]::TEXT[], 'arms', 'isolation', 'pull', false, 44),

('Front Raise', 'Front Raise', ARRAY['Frontheben','Vorderes Heben'], 'strength',
 ARRAY['vordere Schulter'],
 'Kurzhanteln oder Stange vor dem Koerper nach vorne-oben heben. Isolation fuer vordere Schulter.',
 'Raise dumbbells or bar in front of body upward. Isolation for front deltoid.',
 'https://www.youtube.com/watch?v=gzDsRGWylb4', 'https://www.youtube.com/watch?v=gzDsRGWylb4',
 'beginner', ARRAY['Kurzhanteln'], false,
 ARRAY['front_delts'], ARRAY[]::TEXT[], 'shoulders', 'isolation', 'push', false, 26),

('Good Mornings', 'Good Mornings', ARRAY['Guten-Morgen-Uebung'], 'strength',
 ARRAY['Hamstrings','Erector Spinae'],
 'Langhantel auf dem oberen Ruecken, Oberkoerper nach vorne neigen. Leichte Kniebeugung. Hip-Hinge Variante.',
 'Barbell on upper back, bend torso forward. Slight knee bend. Hip-hinge variation.',
 'https://www.youtube.com/watch?v=YA-h3n9L4YU', 'https://www.youtube.com/watch?v=YA-h3n9L4YU',
 'advanced', ARRAY['Langhantel'], true,
 ARRAY['hamstrings','erector_spinae'], ARRAY['glutes'], 'legs', 'hip_hinge', 'pull', false, 74),

('Sumo Kreuzheben', 'Sumo Deadlift', ARRAY['Sumo Deadlift','Sumo DL'], 'strength',
 ARRAY['Quadrizeps','Gluteus','Adduktoren'],
 'Breiter Stand, Haende zwischen den Beinen. Mehr Quad- und Adduktoren-Beteiligung als konventionell.',
 'Wide stance, hands between legs. More quad and adductor involvement than conventional.',
 'https://www.youtube.com/watch?v=pfiz7GzSdPc', 'https://www.youtube.com/watch?v=pfiz7GzSdPc',
 'advanced', ARRAY['Langhantel'], true,
 ARRAY['quads','glutes','adductors'], ARRAY['hamstrings','erector_spinae'], 'legs', 'hip_hinge', 'pull', false, 75),

('Close-Grip Bankdruecken', 'Close-Grip Bench Press', ARRAY['CGBP','Enges Bankdruecken'], 'strength',
 ARRAY['Trizeps','Brust'],
 'Bankdruecken mit engem Griff (schulterbreit). Verlagerung auf Trizeps statt Brust.',
 'Bench press with narrow grip (shoulder-width). Shifts emphasis to triceps over chest.',
 'https://www.youtube.com/watch?v=nEF0bv2FW94', 'https://www.youtube.com/watch?v=nEF0bv2FW94',
 'intermediate', ARRAY['Langhantel','Flachbank'], true,
 ARRAY['triceps','chest'], ARRAY['front_delts'], 'arms', 'horizontal_push', 'push', false, 45),

('Overhead Trizeps-Extension', 'Overhead Tricep Extension', ARRAY['French Press','Ueberkopf-Trizeps'], 'strength',
 ARRAY['Trizeps'],
 'Kurzhantel oder SZ-Stange ueber dem Kopf, Ellbogen fixiert, senken und strecken.',
 'Dumbbell or EZ-bar overhead, elbows fixed, lower and extend.',
 'https://www.youtube.com/watch?v=YbX7Wd8jQ-Q', 'https://www.youtube.com/watch?v=YbX7Wd8jQ-Q',
 'intermediate', ARRAY['Kurzhanteln'], false,
 ARRAY['triceps'], ARRAY[]::TEXT[], 'arms', 'isolation', 'push', false, 46),

('Kabel-Seitheben', 'Cable Lateral Raise', ARRAY['Cable Lateral','Kabelzug Seitheben'], 'strength',
 ARRAY['seitliche Schulter'],
 'Einarmig am Kabelzug, Arm seitlich anheben. Konstante Spannung ueber den gesamten ROM.',
 'Single-arm at cable, raise arm laterally. Constant tension throughout full ROM.',
 'https://www.youtube.com/watch?v=PPrzBWZDOhA', 'https://www.youtube.com/watch?v=PPrzBWZDOhA',
 'beginner', ARRAY['Kabelzug'], false,
 ARRAY['lateral_delts'], ARRAY[]::TEXT[], 'shoulders', 'isolation', 'push', true, 27),

('Concentration Curl', 'Concentration Curl', ARRAY['Konzentrations-Curl','Konzentrationscurl'], 'strength',
 ARRAY['Bizeps'],
 'Sitzend, Ellbogen am inneren Oberschenkel abgestuetzt. Strenge einarmige Bizeps-Isolation.',
 'Seated, elbow braced against inner thigh. Strict single-arm bicep isolation.',
 'https://www.youtube.com/watch?v=Jvj2wV0vOYs', 'https://www.youtube.com/watch?v=Jvj2wV0vOYs',
 'beginner', ARRAY['Kurzhanteln'], false,
 ARRAY['biceps'], ARRAY[]::TEXT[], 'arms', 'isolation', 'pull', true, 47),

('Suitcase Carry', 'Suitcase Carry', ARRAY['Koffertragen','Einarmiger Farmers Walk'], 'functional',
 ARRAY['schraeger Bauch','Unterarme','Core'],
 'Schwere Kurzhantel in einer Hand tragen. Anti-Lateral-Flexion und Griffkraft.',
 'Carry heavy dumbbell in one hand. Anti-lateral flexion and grip strength.',
 'https://www.youtube.com/watch?v=13ZT8HWU0lY', 'https://www.youtube.com/watch?v=13ZT8HWU0lY',
 'beginner', ARRAY['Kurzhanteln'], true,
 ARRAY['obliques','forearms'], ARRAY['deep_core','traps'], 'core', 'carry', 'static', true, 63),

('Pull-Through', 'Cable Pull-Through', ARRAY['Kabelzug Pull-Through','Hip Pull-Through'], 'strength',
 ARRAY['Gluteus','Hamstrings'],
 'Ruecken zum Kabelzug, Seil zwischen den Beinen durchziehen. Exzellente Hip-Hinge Uebung fuer Anfaenger.',
 'Back to cable, pull rope through legs. Excellent hip-hinge exercise for beginners.',
 'https://www.youtube.com/watch?v=ArPyMgeeV8M', 'https://www.youtube.com/watch?v=ArPyMgeeV8M',
 'beginner', ARRAY['Kabelzug'], true,
 ARRAY['glutes','hamstrings'], ARRAY['erector_spinae'], 'legs', 'hip_hinge', 'pull', false, 76),

('Glute Kickback', 'Glute Kickback', ARRAY['Donkey Kick','Kabel-Kickback','Gluteus-Kickback'], 'strength',
 ARRAY['Gluteus'],
 'Am Kabelzug oder Bodyweight: Bein nach hinten strecken. Gezielte Gluteus-Isolation.',
 'At cable machine or bodyweight: extend leg backward. Targeted glute isolation.',
 'https://www.youtube.com/watch?v=BkPnSU-qYuE', 'https://www.youtube.com/watch?v=BkPnSU-qYuE',
 'beginner', ARRAY['Kabelzug'], false,
 ARRAY['glutes'], ARRAY['hamstrings'], 'legs', 'isolation', 'push', true, 77),

('Copenhagen Plank', 'Copenhagen Plank', ARRAY['Kopenhagener Plank','Adduktoren-Plank'], 'strength',
 ARRAY['Adduktoren','schraeger Bauch'],
 'Seitlicher Unterarmstuetz mit oberem Bein auf Bank. Adduktoren des unteren Beins muessen halten.',
 'Side plank with upper leg on bench. Adductors of lower leg must hold position.',
 'https://www.youtube.com/watch?v=K-h6dIjZQhY', 'https://www.youtube.com/watch?v=K-h6dIjZQhY',
 'advanced', ARRAY['Flachbank'], false,
 ARRAY['adductors','obliques'], ARRAY['deep_core'], 'legs', 'anti_rotation', 'static', true, 78),

-- ════════════════════════════════════════
-- NEU — Brust-Ergaenzungen
-- ════════════════════════════════════════

('Negativ-Bankdruecken', 'Decline Bench Press', ARRAY['Decline Press','Decline Bench'], 'strength',
 ARRAY['untere Brust','Trizeps','vordere Schulter'],
 'Bankdruecken auf negativer Bank (-15 bis -30 Grad). Betont die untere Brustpartie und den Trizeps.',
 'Bench press on decline bench (-15 to -30 deg). Targets lower chest and triceps.',
 'https://www.youtube.com/watch?v=LfyQBUKR8SE', 'https://www.youtube.com/watch?v=LfyQBUKR8SE',
 'intermediate', ARRAY['Langhantel','Negativbank'], true,
 ARRAY['chest'], ARRAY['triceps','front_delts'], 'chest', 'horizontal_push', 'push', false, 8),

('Brustpresse', 'Chest Press Machine', ARRAY['Chest Press','Brustpresse Maschine','Machine Press'], 'strength',
 ARRAY['Brust','Trizeps','vordere Schulter'],
 'Gefuehrte Maschine fuer Brustdruecken. Ideal fuer Anfaenger und Drop-Sets. Stabile Bewegungsbahn.',
 'Guided machine for chest pressing. Ideal for beginners and drop sets. Stable movement path.',
 'https://www.youtube.com/watch?v=xUm0BiZCWlQ', 'https://www.youtube.com/watch?v=xUm0BiZCWlQ',
 'beginner', ARRAY['Brustpresse'], true,
 ARRAY['chest'], ARRAY['triceps','front_delts'], 'chest', 'horizontal_push', 'push', false, 9),

('Butterfly', 'Pec Deck', ARRAY['Pec Deck','Pec Fly Machine','Butterfly-Maschine'], 'strength',
 ARRAY['Brust'],
 'An der Butterfly-Maschine: Arme vor der Brust zusammenfuehren. Konstante Spannung ueber gesamten ROM.',
 'At pec deck machine: bring arms together in front of chest. Constant tension throughout full ROM.',
 'https://www.youtube.com/watch?v=Z57CtFmRMxA', 'https://www.youtube.com/watch?v=Z57CtFmRMxA',
 'beginner', ARRAY['Butterfly-Maschine'], false,
 ARRAY['chest'], ARRAY[]::TEXT[], 'chest', 'isolation', 'push', false, 10),

-- ════════════════════════════════════════
-- NEU — Ruecken-Ergaenzungen
-- ════════════════════════════════════════

('Chin-Ups', 'Chin-Ups', ARRAY['Untergriff-Klimmzuege','Supinated Pull-Ups'], 'strength',
 ARRAY['Latissimus','Bizeps','Rhomboiden'],
 'Klimmzuege im Untergriff (Handflaechen zu dir). Mehr Bizeps-Beteiligung als Obergriff.',
 'Pull-ups with supinated grip (palms facing you). More bicep involvement than overhand.',
 'https://www.youtube.com/watch?v=brhRXlOhsAM', 'https://www.youtube.com/watch?v=brhRXlOhsAM',
 'intermediate', ARRAY['Klimmzugstange'], true,
 ARRAY['lats','biceps'], ARRAY['rhomboids','abs'], 'back', 'vertical_pull', 'pull', false, 16),

('Ueberzuege', 'Pullover', ARRAY['Lat Pullover','Dumbbell Pullover','Pull-Over'], 'strength',
 ARRAY['Latissimus','Brust'],
 'Liegend auf Bank, Kurzhantel mit gestreckten Armen ueber den Kopf und zurueck. Lat-Stretch und Brust.',
 'Lying on bench, lower dumbbell with straight arms over head and back. Lat stretch and chest.',
 'https://www.youtube.com/watch?v=FK4rHfWKEac', 'https://www.youtube.com/watch?v=FK4rHfWKEac',
 'intermediate', ARRAY['Kurzhanteln','Flachbank'], true,
 ARRAY['lats','chest'], ARRAY['triceps'], 'back', 'other', 'pull', false, 20),

('Rudermaschine', 'Seated Row Machine', ARRAY['Row Machine','Rudermaschine gefuehrt'], 'strength',
 ARRAY['Latissimus','Rhomboiden','Bizeps'],
 'Gefuehrte Rudermaschine. Stabile Bewegungsbahn, ideal fuer kontrolliertes Rueckentraining.',
 'Guided rowing machine. Stable movement path, ideal for controlled back training.',
 'https://www.youtube.com/watch?v=GZbfZ033f74', 'https://www.youtube.com/watch?v=GZbfZ033f74',
 'beginner', ARRAY['Rudermaschine'], true,
 ARRAY['lats','rhomboids'], ARRAY['biceps','traps'], 'back', 'horizontal_pull', 'pull', false, 21),

-- ════════════════════════════════════════
-- NEU — Schulter-Ergaenzungen
-- ════════════════════════════════════════

('Aufrechtes Rudern', 'Upright Row', ARRAY['Upright Row','Nackenziehen aufrecht'], 'strength',
 ARRAY['Trapezius','seitliche Schulter'],
 'Langhantel oder Kurzhanteln eng greifen, zur Kinnhoehe ziehen. Schultern und Trapezius.',
 'Grip barbell or dumbbells narrowly, pull to chin height. Shoulders and trapezius.',
 'https://www.youtube.com/watch?v=amCU-ziHITM', 'https://www.youtube.com/watch?v=amCU-ziHITM',
 'intermediate', ARRAY['Langhantel'], true,
 ARRAY['traps','lateral_delts'], ARRAY['biceps','front_delts'], 'shoulders', 'isolation', 'pull', false, 28),

('Schulterpresse Maschine', 'Shoulder Press Machine', ARRAY['Machine Shoulder Press','Schulterdruckmaschine'], 'strength',
 ARRAY['vordere Schulter','seitliche Schulter','Trizeps'],
 'Gefuehrte Maschine fuer Schulterdruecken. Sichere Bewegungsbahn, ideal fuer hohe Gewichte und Drop-Sets.',
 'Guided machine for shoulder pressing. Safe movement path, ideal for heavy weights and drop sets.',
 'https://www.youtube.com/watch?v=Wqq43dKoVHs', 'https://www.youtube.com/watch?v=Wqq43dKoVHs',
 'beginner', ARRAY['Schulterpresse'], true,
 ARRAY['front_delts','lateral_delts'], ARRAY['triceps'], 'shoulders', 'vertical_push', 'push', false, 29),

-- ════════════════════════════════════════
-- NEU — Bein-Ergaenzungen
-- ════════════════════════════════════════

('Frontkniebeuge', 'Front Squat', ARRAY['Front Squat','Frontsquat'], 'strength',
 ARRAY['Quadrizeps','Gluteus','Core'],
 'Langhantel vorne auf den Schultern. Aufrechter Oberkoerper, mehr Quad-Fokus als Back Squat.',
 'Barbell on front of shoulders. Upright torso, more quad focus than back squat.',
 'https://www.youtube.com/watch?v=m4ytaCJZpl0', 'https://www.youtube.com/watch?v=m4ytaCJZpl0',
 'advanced', ARRAY['Langhantel','Power Rack'], true,
 ARRAY['quads','glutes'], ARRAY['deep_core','erector_spinae'], 'legs', 'squat', 'push', false, 31),

('Hack-Kniebeuge', 'Hack Squat', ARRAY['Hack Squat','Hackenschmidt'], 'strength',
 ARRAY['Quadrizeps','Gluteus'],
 'An der Hack-Squat-Maschine. Mehr Quadrizeps-Fokus durch die gefuehrte Bewegungsbahn.',
 'At hack squat machine. More quadriceps focus through guided movement path.',
 'https://www.youtube.com/watch?v=0tn5K9NlCfo', 'https://www.youtube.com/watch?v=0tn5K9NlCfo',
 'intermediate', ARRAY['Hack-Squat-Maschine'], true,
 ARRAY['quads'], ARRAY['glutes','hamstrings'], 'legs', 'squat', 'push', false, 32),

('Goblet Squat', 'Goblet Squat', ARRAY['Goblet Kniebeuge','Kelch-Kniebeuge'], 'strength',
 ARRAY['Quadrizeps','Gluteus','Core'],
 'Kurzhantel oder Kettlebell vor der Brust halten, Kniebeuge. Perfekte Einstiegsuebung fuer korrektes Squat-Pattern.',
 'Hold dumbbell or kettlebell at chest, squat. Perfect beginner exercise for correct squat pattern.',
 'https://www.youtube.com/watch?v=MeIiIdhvXT4', 'https://www.youtube.com/watch?v=MeIiIdhvXT4',
 'beginner', ARRAY['Kurzhanteln'], true,
 ARRAY['quads','glutes'], ARRAY['deep_core'], 'legs', 'squat', 'push', false, 33),

('Step-Ups', 'Step-Ups', ARRAY['Aufsteiger','Box Step-Ups','Kastenaufstieg'], 'strength',
 ARRAY['Quadrizeps','Gluteus'],
 'Mit einer Kurzhantel auf eine Bank oder Box steigen. Unilaterale Beinuebung fuer Balance und Kraft.',
 'Step onto bench or box with dumbbells. Unilateral leg exercise for balance and strength.',
 'https://www.youtube.com/watch?v=dQqApCGd5Ag', 'https://www.youtube.com/watch?v=dQqApCGd5Ag',
 'beginner', ARRAY['Kurzhanteln','Plyo-Box'], true,
 ARRAY['quads','glutes'], ARRAY['hamstrings','deep_core'], 'legs', 'lunge', 'push', true, 34),

('Glute Ham Raise', 'Glute Ham Raise', ARRAY['GHR','GHD','Glute-Ham Developer'], 'strength',
 ARRAY['Hamstrings','Gluteus'],
 'Am GHD-Geraet: Knie fixiert, Koerper durch Hamstring-Kraft senken und heben. Exzellent fuer posteriore Kette.',
 'At GHD machine: knees fixed, lower and raise body through hamstring strength. Excellent for posterior chain.',
 'https://www.youtube.com/watch?v=Bear4FTIdQM', 'https://www.youtube.com/watch?v=Bear4FTIdQM',
 'advanced', ARRAY['GHD-Geraet'], true,
 ARRAY['hamstrings','glutes'], ARRAY['erector_spinae','calves'], 'legs', 'hip_hinge', 'pull', false, 35),

('Einbeiniges Kreuzheben', 'Single Leg Deadlift', ARRAY['Single Leg RDL','Einbeinig RDL','SL Deadlift'], 'strength',
 ARRAY['Hamstrings','Gluteus','Core'],
 'Auf einem Bein stehen, Kurzhantel senken, freies Bein nach hinten strecken. Balance + posteriore Kette.',
 'Stand on one leg, lower dumbbell, extend free leg back. Balance + posterior chain.',
 'https://www.youtube.com/watch?v=iDKmW_5tAYI', 'https://www.youtube.com/watch?v=iDKmW_5tAYI',
 'intermediate', ARRAY['Kurzhanteln'], true,
 ARRAY['hamstrings','glutes'], ARRAY['deep_core','erector_spinae'], 'legs', 'hip_hinge', 'pull', true, 36),

('Beinpresse einbeinig', 'Single Leg Press', ARRAY['Einbeinige Beinpresse','SL Leg Press'], 'strength',
 ARRAY['Quadrizeps','Gluteus'],
 'Beinpresse mit nur einem Bein. Deckt muskulaere Dysbalancen auf und trainiert unilaterale Kraft.',
 'Leg press with one leg only. Reveals muscle imbalances and trains unilateral strength.',
 'https://www.youtube.com/watch?v=GFZQQMRO0Hs', 'https://www.youtube.com/watch?v=GFZQQMRO0Hs',
 'intermediate', ARRAY['Beinpresse'], true,
 ARRAY['quads','glutes'], ARRAY['hamstrings'], 'legs', 'squat', 'push', true, 37),

-- ════════════════════════════════════════
-- NEU — Arm-Ergaenzungen
-- ════════════════════════════════════════

('SZ-Curls', 'EZ-Bar Curl', ARRAY['EZ Curl','SZ-Stangen-Curl','EZ-Bar Bicep Curl'], 'strength',
 ARRAY['Bizeps'],
 'Curls mit SZ-Stange (gewinkelter Griff). Handgelenkschonender als Langhantel-Curls.',
 'Curls with EZ-bar (angled grip). More wrist-friendly than straight barbell curls.',
 'https://www.youtube.com/watch?v=kwG2ipFRgFo', 'https://www.youtube.com/watch?v=kwG2ipFRgFo',
 'beginner', ARRAY['SZ-Stange'], false,
 ARRAY['biceps'], ARRAY['forearms'], 'arms', 'isolation', 'pull', false, 48),

('Kabelzug-Bizeps-Curl', 'Cable Curl', ARRAY['Cable Bicep Curl','Kabel-Curl'], 'strength',
 ARRAY['Bizeps'],
 'Am unteren Kabelzug stehend, Curls mit konstantem Widerstand. Gleichmaessige Spannung ueber gesamten ROM.',
 'Standing at low cable, curls with constant resistance. Even tension throughout full ROM.',
 'https://www.youtube.com/watch?v=NFzTWp2qpiE', 'https://www.youtube.com/watch?v=NFzTWp2qpiE',
 'beginner', ARRAY['Kabelzug'], false,
 ARRAY['biceps'], ARRAY['forearms'], 'arms', 'isolation', 'pull', false, 49),

('Trizeps-Kickbacks', 'Tricep Kickback', ARRAY['KH Kickbacks','Dumbbell Kickback'], 'strength',
 ARRAY['Trizeps'],
 'Oberarm parallel zum Boden, Unterarm nach hinten strecken. Trizeps-Isolation mit Peak-Kontraktion.',
 'Upper arm parallel to floor, extend forearm backward. Tricep isolation with peak contraction.',
 'https://www.youtube.com/watch?v=6SS6K3lAwZ8', 'https://www.youtube.com/watch?v=6SS6K3lAwZ8',
 'beginner', ARRAY['Kurzhanteln'], false,
 ARRAY['triceps'], ARRAY[]::TEXT[], 'arms', 'isolation', 'push', true, 50),

('Handgelenkbeugen', 'Wrist Curl', ARRAY['Wrist Curls','Unterarm-Curls','Handgelenk-Curls'], 'strength',
 ARRAY['Unterarme'],
 'Unterarme auf Bank oder Oberschenkel, Handgelenke mit Kurzhantel beugen. Direktes Unterarm-Training.',
 'Forearms on bench or thigh, curl wrists with dumbbell. Direct forearm training.',
 'https://www.youtube.com/watch?v=7jGi0FTpGb0', 'https://www.youtube.com/watch?v=7jGi0FTpGb0',
 'beginner', ARRAY['Kurzhanteln'], false,
 ARRAY['forearms'], ARRAY[]::TEXT[], 'arms', 'isolation', 'pull', false, 51),

-- ════════════════════════════════════════
-- NEU — Core-Ergaenzungen
-- ════════════════════════════════════════

('Ab Rollout', 'Ab Rollout', ARRAY['Bauchrad','Ab Wheel','Rollout'], 'strength',
 ARRAY['Rectus Abdominis','Core'],
 'Kniend mit Ab-Wheel nach vorne rollen und zurueck. Extrem effektive Anti-Extension-Uebung.',
 'Kneeling with ab wheel, roll forward and back. Extremely effective anti-extension exercise.',
 'https://www.youtube.com/watch?v=rqiTPHjYFqE', 'https://www.youtube.com/watch?v=rqiTPHjYFqE',
 'intermediate', ARRAY['Ab-Wheel'], false,
 ARRAY['abs','deep_core'], ARRAY['front_delts','lats'], 'core', 'anti_rotation', 'static', false, 56),

('Russian Twist', 'Russian Twist', ARRAY['Russische Drehung','Seated Twist'], 'strength',
 ARRAY['schraeger Bauch','Core'],
 'Sitzend mit angehobenen Fuessen, Oberkoerper mit Gewicht von Seite zu Seite drehen.',
 'Seated with feet raised, rotate torso side to side with weight.',
 'https://www.youtube.com/watch?v=wkD8rjkodUI', 'https://www.youtube.com/watch?v=wkD8rjkodUI',
 'intermediate', ARRAY['Kurzhanteln'], false,
 ARRAY['obliques','abs'], ARRAY['deep_core','hip_flexors'], 'core', 'rotation', 'dynamic', false, 57),

('Toe Touches', 'Toe Touches', ARRAY['Zehentipper','V-Ups','Beinheben liegend'], 'strength',
 ARRAY['Rectus Abdominis'],
 'Rueckenlage, Beine gestreckt oben, mit den Haenden die Zehenspitzen beruehren.',
 'Lying on back, legs straight up, reach hands to touch toes.',
 'https://www.youtube.com/watch?v=9UGA7n_mfhU', 'https://www.youtube.com/watch?v=9UGA7n_mfhU',
 'beginner', ARRAY[]::TEXT[], false,
 ARRAY['abs'], ARRAY['hip_flexors'], 'core', 'isolation', 'dynamic', false, 58),

-- ════════════════════════════════════════
-- NEU — Cardio-Ergaenzungen
-- ════════════════════════════════════════

('Crosstrainer', 'Elliptical', ARRAY['Elliptical','Ellipsentrainer','Cross-Trainer'], 'cardio',
 ARRAY['Herz-Kreislauf','Quadrizeps','Gluteus'],
 'Gelenkschonendes Ganzkkoerper-Cardio. Arme und Beine gleichzeitig. Ideal fuer Aufwaermung oder Zone-2-Training.',
 'Low-impact full-body cardio. Arms and legs simultaneously. Ideal for warm-up or zone 2 training.',
 'https://www.youtube.com/watch?v=eoJHTmAPGnk', 'https://www.youtube.com/watch?v=eoJHTmAPGnk',
 'beginner', ARRAY['Crosstrainer'], true,
 ARRAY['cardiovascular','quads'], ARRAY['glutes','hamstrings'], 'cardio', 'cardio_steady', 'dynamic', false, 80),

('Treppensteiger', 'Stairmaster', ARRAY['Stairmaster','Stairmill','Stepper'], 'cardio',
 ARRAY['Herz-Kreislauf','Quadrizeps','Gluteus','Waden'],
 'Treppensteigen auf dem Geraet. Hoher Kalorienverbrauch, staerkt Beine und Herz-Kreislauf-System.',
 'Stair climbing on machine. High calorie burn, strengthens legs and cardiovascular system.',
 'https://www.youtube.com/watch?v=VCPp7RUyWKE', 'https://www.youtube.com/watch?v=VCPp7RUyWKE',
 'beginner', ARRAY['Treppensteiger'], true,
 ARRAY['cardiovascular','quads','glutes'], ARRAY['calves','hamstrings'], 'cardio', 'cardio_steady', 'dynamic', false, 81),

('Spaziergang', 'Walking', ARRAY['Gehen','Power Walking','Walken'], 'cardio',
 ARRAY['Herz-Kreislauf'],
 'Zügiges Gehen — die unterschaetzteste Cardio-Form. Zone 1-2, erholungsfoerdernd, alltagstauglich.',
 'Brisk walking — the most underestimated form of cardio. Zone 1-2, recovery-promoting, daily life compatible.',
 'https://www.youtube.com/watch?v=bDYKFCHA3xo', 'https://www.youtube.com/watch?v=bDYKFCHA3xo',
 'beginner', ARRAY[]::TEXT[], false,
 ARRAY['cardiovascular'], ARRAY['quads','glutes','calves'], 'cardio', 'cardio_steady', 'dynamic', false, 82),

('HIIT Sprint', 'HIIT Sprints', ARRAY['Sprint-Intervalle','Sprint Intervals','Sprinttraining'], 'cardio',
 ARRAY['Herz-Kreislauf','Quadrizeps','Hamstrings','Gluteus'],
 '20-30 Sek Vollgas, 60-90 Sek Pause. Maximale Fettverbrennung in minimaler Zeit. EPOC-Effekt.',
 '20-30 sec all-out, 60-90 sec rest. Maximum fat burning in minimal time. EPOC effect.',
 'https://www.youtube.com/watch?v=YOuF7M_4dqo', 'https://www.youtube.com/watch?v=YOuF7M_4dqo',
 'advanced', ARRAY[]::TEXT[], true,
 ARRAY['cardiovascular','quads','glutes'], ARRAY['hamstrings','calves'], 'cardio', 'cardio_interval', 'dynamic', false, 83),

-- ════════════════════════════════════════
-- NEU — Functional-Ergaenzungen
-- ════════════════════════════════════════

('Bear Crawl', 'Bear Crawl', ARRAY['Baerenkrabbeln','Bear Walk'], 'functional',
 ARRAY['Core','Schultern','Quadrizeps'],
 'Auf allen Vieren, Knie knapp ueber dem Boden. Vorwaerts/Rueckwaerts bewegen. Ganzkkoerper-Stabilitaet.',
 'On all fours, knees hovering above ground. Move forward/backward. Full-body stability.',
 'https://www.youtube.com/watch?v=LfyMidvnirQ', 'https://www.youtube.com/watch?v=LfyMidvnirQ',
 'intermediate', ARRAY[]::TEXT[], true,
 ARRAY['deep_core','front_delts','quads'], ARRAY['triceps','hamstrings'], 'full_body', 'carry', 'dynamic', false, 64),

('Wall Ball', 'Wall Ball', ARRAY['Wandball','Wall Ball Shots'], 'functional',
 ARRAY['Quadrizeps','Schultern','Gluteus'],
 'Medizinball in Squat-Position fangen, explosiv aufstehen und gegen die Wand werfen. CrossFit-Klassiker.',
 'Catch medicine ball in squat position, stand explosively and throw against wall. CrossFit classic.',
 'https://www.youtube.com/watch?v=fpUD0mcFp_0', 'https://www.youtube.com/watch?v=fpUD0mcFp_0',
 'intermediate', ARRAY['Medizinball'], true,
 ARRAY['quads','glutes','front_delts'], ARRAY['triceps','deep_core'], 'full_body', 'plyometric', 'push', false, 65);

-- ════════════════════════════════════════════════════════════════════════
-- Migrate videos for new exercises into JSONB field
-- ════════════════════════════════════════════════════════════════════════
UPDATE exercise_catalog
SET videos = jsonb_build_object(
  'de_male', video_url_de,
  'en_male', video_url_en
)
WHERE (video_url_de IS NOT NULL OR video_url_en IS NOT NULL)
  AND (videos IS NULL OR videos = '{}'::jsonb);
