-- Seed data for exercise_catalog — ~90 curated exercises with YouTube links
-- Video criteria: 2-5 min, clear form demonstration, 1 DE + 1 EN per exercise

INSERT INTO exercise_catalog (name, name_en, aliases, category, muscle_groups, description, description_en, video_url_de, video_url_en, difficulty, equipment_needed, is_compound) VALUES

-- ═══════════════════════════════════════════════════════════════
-- KRAFT — BRUST (Chest)
-- ═══════════════════════════════════════════════════════════════
('Bankdrücken', 'Bench Press', ARRAY['Flachbankdrücken','Flat Bench'], 'strength',
 ARRAY['Brust','Trizeps','vordere Schulter'],
 'Grundübung für die Brustmuskulatur. Langhantel kontrolliert zur Brust senken, explosiv nach oben drücken. Schulterblätter zusammenziehen, Brust raus.',
 'Fundamental chest exercise. Lower barbell controlled to chest, press explosively upward. Retract shoulder blades, chest up.',
 'https://www.youtube.com/watch?v=rT7DgCr-3pg', 'https://www.youtube.com/watch?v=4Y2ZdHCOXok',
 'intermediate', ARRAY['Langhantel','Flachbank'], true),

('Schrägbankdrücken', 'Incline Bench Press', ARRAY['Incline Press','Schrägbank'], 'strength',
 ARRAY['obere Brust','Trizeps','vordere Schulter'],
 'Betont die obere Brustpartie. Bank auf 30-45° einstellen. Stange zur oberen Brust senken.',
 'Targets upper chest. Set bench to 30-45°. Lower bar to upper chest.',
 'https://www.youtube.com/watch?v=SrqOu55lrYU', 'https://www.youtube.com/watch?v=jPLdzalesIE',
 'intermediate', ARRAY['Langhantel','Schrägbank'], true),

('Kurzhantel-Flyes', 'Dumbbell Flyes', ARRAY['Flyes','Butterfly','KH Flyes'], 'strength',
 ARRAY['Brust'],
 'Isolationsübung für die Brust. Arme leicht gebeugt, weite Bogenbewegung. Dehnung in der unteren Position.',
 'Isolation exercise for chest. Arms slightly bent, wide arc movement. Stretch at bottom.',
 'https://www.youtube.com/watch?v=QENKPHhQVi4', 'https://www.youtube.com/watch?v=eozdVDA78K0',
 'beginner', ARRAY['Kurzhanteln','Flachbank'], false),

('Cable Crossover', 'Cable Crossover', ARRAY['Kabelzug Brust','Cable Flyes'], 'strength',
 ARRAY['Brust'],
 'Kabelzug-Isolation für die Brust. Oberer oder unterer Zug möglich. Hände vor dem Körper zusammenführen.',
 'Cable isolation for chest. Upper or lower pulley options. Bring hands together in front.',
 'https://www.youtube.com/watch?v=taI4XduLpTk', 'https://www.youtube.com/watch?v=taI4XduLpTk',
 'intermediate', ARRAY['Kabelzug'], false),

('Dips', 'Dips', ARRAY['Brust-Dips','Chest Dips'], 'strength',
 ARRAY['Brust','Trizeps','vordere Schulter'],
 'Körpergewichtsübung. Oberkörper leicht nach vorne lehnen für Brust-Fokus. Ellbogen 90° beugen.',
 'Bodyweight exercise. Lean forward slightly for chest focus. Bend elbows to 90°.',
 'https://www.youtube.com/watch?v=dX_nSOOJIs0', 'https://www.youtube.com/watch?v=2z8JmcrW-As',
 'intermediate', ARRAY['Dipstation'], true),

-- ═══════════════════════════════════════════════════════════════
-- KRAFT — RÜCKEN (Back)
-- ═══════════════════════════════════════════════════════════════
('Klimmzüge', 'Pull-Ups', ARRAY['Chin-Ups','Pullups','Klimmi'], 'strength',
 ARRAY['Latissimus','Bizeps','Rhomboiden'],
 'König der Rückenübungen. Schulterbreiter Obergriff. Aus dem toten Hang bis Kinn über die Stange.',
 'King of back exercises. Shoulder-width overhand grip. From dead hang until chin over bar.',
 'https://www.youtube.com/watch?v=eGo4IYlbE5g', 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
 'intermediate', ARRAY['Klimmzugstange'], true),

('Langhantelrudern', 'Barbell Row', ARRAY['Bent Over Row','Rudern','LH Rudern'], 'strength',
 ARRAY['Latissimus','Rhomboiden','Trapezius','Bizeps'],
 'Grundübung für den Rücken. Oberkörper 45° vorgebeugt, Stange zum Bauchnabel ziehen. Rücken gerade.',
 'Fundamental back exercise. Upper body bent 45°, pull bar to navel. Keep back straight.',
 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ', 'https://www.youtube.com/watch?v=kBWAon7ItDw',
 'intermediate', ARRAY['Langhantel'], true),

('Kurzhantelrudern', 'Dumbbell Row', ARRAY['Einarmiges Rudern','One-Arm Row','KH Rudern'], 'strength',
 ARRAY['Latissimus','Rhomboiden','Bizeps'],
 'Einarmig auf Bank abstützen. Kurzhantel zum Hüftknochen ziehen. Gute Rückenstrecker-Stabilisation.',
 'Support on bench with one arm. Pull dumbbell to hip. Good back stabilization.',
 'https://www.youtube.com/watch?v=pYcpY20QaE8', 'https://www.youtube.com/watch?v=roCP6wCXPqo',
 'beginner', ARRAY['Kurzhanteln','Flachbank'], false),

('Latzug', 'Lat Pulldown', ARRAY['Latpulldown','Latziehen'], 'strength',
 ARRAY['Latissimus','Bizeps'],
 'Kabelzug-Alternative zu Klimmzügen. Stange zur oberen Brust ziehen, Ellbogen nach hinten-unten.',
 'Cable alternative to pull-ups. Pull bar to upper chest, elbows back and down.',
 'https://www.youtube.com/watch?v=CAwf7n6Luuc', 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
 'beginner', ARRAY['Latzug'], false),

('Face Pulls', 'Face Pulls', ARRAY['Facepulls','Kabelzug Face Pull'], 'strength',
 ARRAY['hintere Schulter','Rhomboiden','Trapezius'],
 'Wichtig für Schulterstabilität. Seil zum Gesicht ziehen, Hände auseinanderdrehen. Ellbogen hoch.',
 'Important for shoulder health. Pull rope to face, externally rotate hands. Elbows high.',
 'https://www.youtube.com/watch?v=rep-qVOkqgk', 'https://www.youtube.com/watch?v=rep-qVOkqgk',
 'beginner', ARRAY['Kabelzug'], false),

('Kreuzheben', 'Deadlift', ARRAY['Deadlift','DL','Heben'], 'strength',
 ARRAY['unterer Rücken','Gluteus','Oberschenkel','Trapezius'],
 'Grundübung Nr. 1. Stange nah am Körper, Hüfte und Knie gleichzeitig strecken. Rücken neutral halten.',
 'Fundamental exercise #1. Keep bar close, extend hips and knees simultaneously. Maintain neutral spine.',
 'https://www.youtube.com/watch?v=op9kVnSso6Q', 'https://www.youtube.com/watch?v=op9kVnSso6Q',
 'advanced', ARRAY['Langhantel'], true),

('Kabelrudern', 'Seated Cable Row', ARRAY['Seated Row','Cable Row'], 'strength',
 ARRAY['Latissimus','Rhomboiden','Bizeps'],
 'Sitzend am Kabelzug. V-Griff oder breiter Griff. Zur Bauchmitte ziehen, Schulterblätter zusammen.',
 'Seated at cable machine. V-grip or wide grip. Pull to mid-abdomen, squeeze shoulder blades.',
 'https://www.youtube.com/watch?v=GZbfZ033f74', 'https://www.youtube.com/watch?v=GZbfZ033f74',
 'beginner', ARRAY['Kabelzug'], false),

-- ═══════════════════════════════════════════════════════════════
-- KRAFT — SCHULTERN (Shoulders)
-- ═══════════════════════════════════════════════════════════════
('Schulterdrücken', 'Overhead Press', ARRAY['OHP','Military Press','Schulterpress'], 'strength',
 ARRAY['Schulter','Trizeps'],
 'Grundübung für die Schultern. Stehend oder sitzend, Langhantel/Kurzhanteln über Kopf drücken.',
 'Fundamental shoulder exercise. Standing or seated, press barbell/dumbbells overhead.',
 'https://www.youtube.com/watch?v=2yjwXTZQDDI', 'https://www.youtube.com/watch?v=2yjwXTZQDDI',
 'intermediate', ARRAY['Langhantel'], true),

('Seitheben', 'Lateral Raise', ARRAY['Seitliches Heben','Side Raise','Lateral Raises'], 'strength',
 ARRAY['seitliche Schulter'],
 'Isolation für die seitliche Schulter. Arme leicht gebeugt, bis Schulterhöhe heben. Kontrolliert senken.',
 'Isolation for lateral deltoid. Arms slightly bent, raise to shoulder height. Lower controlled.',
 'https://www.youtube.com/watch?v=3VcKaXpzqRo', 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
 'beginner', ARRAY['Kurzhanteln'], false),

('Rear Delt Flyes', 'Rear Delt Flyes', ARRAY['Reverse Flyes','hintere Schulter'], 'strength',
 ARRAY['hintere Schulter'],
 'Vorgebeugt oder liegend auf Schrägbank. Arme seitlich anheben. Wichtig für Schulterbalance.',
 'Bent over or lying on incline bench. Raise arms laterally. Important for shoulder balance.',
 'https://www.youtube.com/watch?v=EA7u4Q_8HQ0', 'https://www.youtube.com/watch?v=EA7u4Q_8HQ0',
 'beginner', ARRAY['Kurzhanteln'], false),

-- ═══════════════════════════════════════════════════════════════
-- KRAFT — BEINE (Legs)
-- ═══════════════════════════════════════════════════════════════
('Kniebeugen', 'Squats', ARRAY['Squats','Backsquats','Back Squat'], 'strength',
 ARRAY['Quadrizeps','Gluteus','Oberschenkel'],
 'König der Beinübungen. Stange auf dem oberen Rücken, tief in die Hocke. Knie über die Zehen.',
 'King of leg exercises. Bar on upper back, deep squat position. Knees track over toes.',
 'https://www.youtube.com/watch?v=bEv6CCg2BC8', 'https://www.youtube.com/watch?v=bEv6CCg2BC8',
 'intermediate', ARRAY['Langhantel','Squat Rack'], true),

('Beinpresse', 'Leg Press', ARRAY['Leg Press'], 'strength',
 ARRAY['Quadrizeps','Gluteus'],
 'Maschinenübung für die Beine. Füße schulterbreit, Knie bis 90° beugen. Nicht die Knie durchdrücken.',
 'Machine exercise for legs. Feet shoulder-width, bend knees to 90°. Do not lock knees.',
 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
 'beginner', ARRAY['Beinpresse'], true),

('Rumänisches Kreuzheben', 'Romanian Deadlift', ARRAY['RDL','Rumänisch','Romanian DL'], 'strength',
 ARRAY['Oberschenkel Rückseite','Gluteus','unterer Rücken'],
 'Hüftdominante Übung. Stange nah am Körper, Hüfte nach hinten schieben. Leichte Kniebeugung.',
 'Hip-dominant exercise. Bar close to body, push hips back. Slight knee bend.',
 'https://www.youtube.com/watch?v=jEy_czb3RKA', 'https://www.youtube.com/watch?v=jEy_czb3RKA',
 'intermediate', ARRAY['Langhantel'], true),

('Beinbeuger', 'Leg Curl', ARRAY['Lying Leg Curl','Hamstring Curl'], 'strength',
 ARRAY['Oberschenkel Rückseite'],
 'Isolationsübung für die hintere Oberschenkelmuskulatur. Kontrollierte Bewegung, voller ROM.',
 'Isolation for hamstrings. Controlled movement, full range of motion.',
 'https://www.youtube.com/watch?v=1Tq3QdYUuHs', 'https://www.youtube.com/watch?v=1Tq3QdYUuHs',
 'beginner', ARRAY['Beinbeuger-Maschine'], false),

('Beinstrecker', 'Leg Extension', ARRAY['Leg Extensions','Beinstreckermaschine'], 'strength',
 ARRAY['Quadrizeps'],
 'Isolationsübung für die Oberschenkelvorderseite. Bein vollständig strecken, oben kurz halten.',
 'Isolation for quadriceps. Fully extend leg, brief hold at top.',
 'https://www.youtube.com/watch?v=YyvSfVjQeL0', 'https://www.youtube.com/watch?v=YyvSfVjQeL0',
 'beginner', ARRAY['Beinstrecker-Maschine'], false),

('Wadenheben', 'Calf Raise', ARRAY['Calf Raises','Wadenpresse'], 'strength',
 ARRAY['Waden'],
 'Stehend oder sitzend. Voller Bewegungsumfang: ganz runter dehnen, ganz hoch drücken.',
 'Standing or seated. Full ROM: stretch all the way down, press all the way up.',
 'https://www.youtube.com/watch?v=gwLzBJYoWlI', 'https://www.youtube.com/watch?v=gwLzBJYoWlI',
 'beginner', ARRAY['Langhantel'], false),

('Hip Thrust', 'Hip Thrust', ARRAY['Glute Bridge','Hüftstoß'], 'strength',
 ARRAY['Gluteus','Oberschenkel Rückseite'],
 'Beste Übung für den Gluteus. Oberer Rücken auf Bank, Stange über Hüfte, Hüfte nach oben stoßen.',
 'Best glute exercise. Upper back on bench, bar over hips, thrust hips upward.',
 'https://www.youtube.com/watch?v=SEdqd1n0cvg', 'https://www.youtube.com/watch?v=SEdqd1n0cvg',
 'intermediate', ARRAY['Langhantel','Flachbank'], true),

('Ausfallschritte', 'Lunges', ARRAY['Lunges','Walking Lunges'], 'strength',
 ARRAY['Quadrizeps','Gluteus'],
 'Einbeinige Übung. Großer Schritt nach vorne, hinteres Knie fast zum Boden. Oberkörper aufrecht.',
 'Single-leg exercise. Large step forward, back knee almost to floor. Torso upright.',
 'https://www.youtube.com/watch?v=QOVaHwm-Q6U', 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
 'beginner', ARRAY['Kurzhanteln'], true),

('Bulgarische Kniebeuge', 'Bulgarian Split Squat', ARRAY['Bulgarian Split','BSS'], 'strength',
 ARRAY['Quadrizeps','Gluteus'],
 'Hinterer Fuß auf Bank erhöht. Einbeinige Kniebeuge. Exzellent für Bein- und Hüftkraft.',
 'Rear foot elevated on bench. Single-leg squat. Excellent for leg and hip strength.',
 'https://www.youtube.com/watch?v=2C-uNgKwPLE', 'https://www.youtube.com/watch?v=2C-uNgKwPLE',
 'intermediate', ARRAY['Kurzhanteln','Flachbank'], true),

-- ═══════════════════════════════════════════════════════════════
-- KRAFT — ARME (Arms)
-- ═══════════════════════════════════════════════════════════════
('Bizeps-Curls', 'Bicep Curls', ARRAY['Curls','Langhantel-Curls','EZ-Curls','Bizepscurls'], 'strength',
 ARRAY['Bizeps'],
 'Grundübung für den Bizeps. EZ- oder Langhantel, kontrolliert curlen. Kein Schwung!',
 'Fundamental bicep exercise. EZ or barbell, controlled curl. No swinging!',
 'https://www.youtube.com/watch?v=kwG2ipFRgFo', 'https://www.youtube.com/watch?v=kwG2ipFRgFo',
 'beginner', ARRAY['Langhantel'], false),

('Hammer Curls', 'Hammer Curls', ARRAY['Hammercurls','Neutral Curls'], 'strength',
 ARRAY['Bizeps','Brachioradialis'],
 'Neutraler Griff (Daumen oben). Trainiert Bizeps und Unterarm. Arme am Körper halten.',
 'Neutral grip (thumbs up). Trains biceps and forearms. Keep arms close to body.',
 'https://www.youtube.com/watch?v=zC3nLlEvin4', 'https://www.youtube.com/watch?v=zC3nLlEvin4',
 'beginner', ARRAY['Kurzhanteln'], false),

('Trizepsdrücken', 'Tricep Pushdown', ARRAY['Pushdown','Kabelzug Trizeps','Cable Pushdown'], 'strength',
 ARRAY['Trizeps'],
 'Kabelzug-Isolation für den Trizeps. Seil oder Stange, Ellbogen am Körper fixiert.',
 'Cable isolation for triceps. Rope or bar, elbows fixed at sides.',
 'https://www.youtube.com/watch?v=2-LAMcpzODU', 'https://www.youtube.com/watch?v=2-LAMcpzODU',
 'beginner', ARRAY['Kabelzug'], false),

('Skull Crushers', 'Skull Crushers', ARRAY['Stirndrücken','Lying Tricep Extension'], 'strength',
 ARRAY['Trizeps'],
 'Langhantel/EZ-Stange zur Stirn senken, dann strecken. Ellbogen stabil halten.',
 'Lower barbell/EZ-bar to forehead, then extend. Keep elbows stable.',
 'https://www.youtube.com/watch?v=d_KZxkY_0cM', 'https://www.youtube.com/watch?v=d_KZxkY_0cM',
 'intermediate', ARRAY['Langhantel','Flachbank'], false),

-- ═══════════════════════════════════════════════════════════════
-- KRAFT — CORE
-- ═══════════════════════════════════════════════════════════════
('Plank', 'Plank', ARRAY['Unterarmstütz','Planke'], 'strength',
 ARRAY['Core','Bauch'],
 'Isometrische Coreübung. Unterarme und Zehenspitzen, Körper gerade wie ein Brett. 30-60 Sek halten.',
 'Isometric core exercise. Forearms and toes, body straight like a plank. Hold 30-60 sec.',
 'https://www.youtube.com/watch?v=ASdvN_XEl_c', 'https://www.youtube.com/watch?v=ASdvN_XEl_c',
 'beginner', ARRAY[]::TEXT[], false),

('Cable Crunches', 'Cable Crunches', ARRAY['Kabel-Crunches','Kabelzug Bauch'], 'strength',
 ARRAY['Bauch'],
 'Kniend am Kabelzug. Seil hinter dem Kopf, Oberkörper einrollen. Widerstand progressiv steigern.',
 'Kneeling at cable machine. Rope behind head, crunch forward. Progressive overload.',
 'https://www.youtube.com/watch?v=AV5PmrIVoLk', 'https://www.youtube.com/watch?v=AV5PmrIVoLk',
 'beginner', ARRAY['Kabelzug'], false),

('Leg Raises', 'Leg Raises', ARRAY['Beinheben','Hanging Leg Raises'], 'strength',
 ARRAY['unterer Bauch','Hüftbeuger'],
 'Hängend an der Stange oder liegend. Beine gestreckt heben. Fortgeschritten: an der Stange hängend.',
 'Hanging from bar or lying down. Raise straight legs. Advanced: hanging from bar.',
 'https://www.youtube.com/watch?v=hdng3Nm1x_E', 'https://www.youtube.com/watch?v=hdng3Nm1x_E',
 'intermediate', ARRAY['Klimmzugstange'], false),

('Pallof Press', 'Pallof Press', ARRAY['Anti-Rotation Press','Pallof'], 'strength',
 ARRAY['Core','schräger Bauch'],
 'Anti-Rotationsübung am Kabelzug. Seitlich stehen, Kabel vor der Brust wegdrücken und halten.',
 'Anti-rotation exercise at cable. Stand sideways, press cable away from chest and hold.',
 'https://www.youtube.com/watch?v=AH_QZLm_0-s', 'https://www.youtube.com/watch?v=AH_QZLm_0-s',
 'beginner', ARRAY['Kabelzug'], false),

-- ═══════════════════════════════════════════════════════════════
-- KRAFT — WEITERE COMPOUND
-- ═══════════════════════════════════════════════════════════════
('Trap-Bar Deadlift', 'Trap Bar Deadlift', ARRAY['Hex-Bar Deadlift','Trap Bar'], 'strength',
 ARRAY['Quadrizeps','Gluteus','unterer Rücken','Trapezius'],
 'Gelenkschonende Kreuzheben-Variante. Neutraler Griff, aufrechter Oberkörper. Ideal für Anfänger.',
 'Joint-friendly deadlift variation. Neutral grip, upright torso. Ideal for beginners.',
 'https://www.youtube.com/watch?v=QorWsxaL7T0', 'https://www.youtube.com/watch?v=QorWsxaL7T0',
 'beginner', ARRAY['Trap-Bar'], true),

('Arnold Press', 'Arnold Press', ARRAY['Arnold Schulterdrücken'], 'strength',
 ARRAY['Schulter','Trizeps'],
 'Kurzhanteln vor der Brust starten, rotierend nach oben drücken. Trainiert alle Schulterköpfe.',
 'Start dumbbells in front of chest, rotate while pressing up. Trains all deltoid heads.',
 'https://www.youtube.com/watch?v=6Z15_WdXmVw', 'https://www.youtube.com/watch?v=6Z15_WdXmVw',
 'intermediate', ARRAY['Kurzhanteln'], true),

('T-Bar Rudern', 'T-Bar Row', ARRAY['T-Bar Row','Landmine Row'], 'strength',
 ARRAY['Latissimus','Rhomboiden','Trapezius'],
 'Langhantel in Landmine eingeklemmt, V-Griff. Zum Bauch ziehen. Gute Rückendicke-Übung.',
 'Barbell in landmine, V-grip. Pull to stomach. Great back thickness exercise.',
 'https://www.youtube.com/watch?v=j3Igk5nyZE4', 'https://www.youtube.com/watch?v=j3Igk5nyZE4',
 'intermediate', ARRAY['Langhantel','Landmine'], true),

('Farmers Walk', 'Farmer''s Walk', ARRAY['Farmers Carry','Bauerngang'], 'functional',
 ARRAY['Unterarme','Trapezius','Core','Waden'],
 'Schwere Kurzhanteln oder Trap-Bar greifen und gehen. Ganzkörperübung für Griffkraft und Stabilität.',
 'Grab heavy dumbbells or trap bar and walk. Full-body exercise for grip and stability.',
 'https://www.youtube.com/watch?v=Fkzk_RqlYig', 'https://www.youtube.com/watch?v=Fkzk_RqlYig',
 'beginner', ARRAY['Kurzhanteln'], true),

-- ═══════════════════════════════════════════════════════════════
-- AUSDAUER (Endurance) — ~15 Übungen
-- ═══════════════════════════════════════════════════════════════
('Laufen (Grundlagenlauf)', 'Easy Run', ARRAY['Jogging','Joggen','Dauerlauf','Zone 2 Lauf'], 'cardio',
 ARRAY['Beine','Herz-Kreislauf'],
 'Lockerer Dauerlauf in Zone 1-2. Du solltest dich noch unterhalten können. Basis jedes Laufplans.',
 'Easy steady-state run in Zone 1-2. You should be able to hold a conversation. Foundation of any running plan.',
 'https://www.youtube.com/watch?v=brFHyOtTwH4', 'https://www.youtube.com/watch?v=brFHyOtTwH4',
 'beginner', ARRAY[]::TEXT[], false),

('Intervallläufe', 'Interval Running', ARRAY['Intervalle','HIIT Laufen','Speed Work'], 'cardio',
 ARRAY['Beine','Herz-Kreislauf'],
 'Wechsel zwischen schnellen und langsamen Phasen. Z.B. 6x400m schnell mit 200m Gehpause. Verbessert VO2max.',
 'Alternating fast and slow phases. E.g. 6x400m fast with 200m walk rest. Improves VO2max.',
 'https://www.youtube.com/watch?v=L5lFzGW7qIc', 'https://www.youtube.com/watch?v=L5lFzGW7qIc',
 'intermediate', ARRAY[]::TEXT[], false),

('Tempodauerlauf', 'Tempo Run', ARRAY['Threshold Run','Schwellentraining'], 'cardio',
 ARRAY['Beine','Herz-Kreislauf'],
 'Lauf an der Laktatschwelle (Zone 3-4). 20-40 Min in einem fordernden aber haltbaren Tempo.',
 'Run at lactate threshold (Zone 3-4). 20-40 min at a challenging but sustainable pace.',
 'https://www.youtube.com/watch?v=_JTB94U8Lqk', 'https://www.youtube.com/watch?v=_JTB94U8Lqk',
 'intermediate', ARRAY[]::TEXT[], false),

('Langer Lauf', 'Long Run', ARRAY['Long Run','Langstrecke'], 'cardio',
 ARRAY['Beine','Herz-Kreislauf'],
 'Längste Einheit der Woche. Langsames Tempo (Zone 1-2), Distanz schrittweise steigern. Baut Ausdauerbasis.',
 'Longest session of the week. Slow pace (Zone 1-2), gradually increase distance. Builds endurance base.',
 'https://www.youtube.com/watch?v=EvaPKg50as4', 'https://www.youtube.com/watch?v=EvaPKg50as4',
 'beginner', ARRAY[]::TEXT[], false),

('Kraulschwimmen', 'Freestyle Swimming', ARRAY['Kraulen','Freistil','Front Crawl'], 'cardio',
 ARRAY['Latissimus','Schulter','Core','Herz-Kreislauf'],
 'Effizientester Schwimmstil. Wechselzug, Seitatmung, Streamline-Position. Technik > Kraft.',
 'Most efficient swim stroke. Alternating pull, side breathing, streamline position. Technique > power.',
 'https://www.youtube.com/watch?v=T1OxEL2cKMg', 'https://www.youtube.com/watch?v=T1OxEL2cKMg',
 'intermediate', ARRAY['Schwimmbad'], false),

('Brustschwimmen', 'Breaststroke', ARRAY['Brust schwimmen'], 'cardio',
 ARRAY['Brust','Beine','Herz-Kreislauf'],
 'Gleichzeitiger Armzug und Beinschlag. Langsamer als Kraul, schonender. Guter Einstieg.',
 'Simultaneous arm pull and frog kick. Slower than freestyle, gentler. Good starting point.',
 'https://www.youtube.com/watch?v=JFElqTYGZsA', 'https://www.youtube.com/watch?v=JFElqTYGZsA',
 'beginner', ARRAY['Schwimmbad'], false),

('Rückenschwimmen', 'Backstroke', ARRAY['Rücken schwimmen'], 'cardio',
 ARRAY['Latissimus','Schulter','Herz-Kreislauf'],
 'Rückenlage, Wechselzug. Gute Haltungskorrektur-Übung. Einfache Atmung.',
 'On back, alternating arms. Good posture correction exercise. Easy breathing.',
 'https://www.youtube.com/watch?v=cKQkVJv0grc', 'https://www.youtube.com/watch?v=cKQkVJv0grc',
 'beginner', ARRAY['Schwimmbad'], false),

('Radfahren (Indoor)', 'Indoor Cycling', ARRAY['Spinning','Ergometer','Indoor Bike'], 'cardio',
 ARRAY['Quadrizeps','Gluteus','Herz-Kreislauf'],
 'Stationäres Radfahren. Widerstand variieren für Intervalle. Zone 2 für Grundlage.',
 'Stationary cycling. Vary resistance for intervals. Zone 2 for base building.',
 'https://www.youtube.com/watch?v=EiVf_2JH_N8', 'https://www.youtube.com/watch?v=EiVf_2JH_N8',
 'beginner', ARRAY['Ergometer'], false),

('Radfahren (Outdoor)', 'Outdoor Cycling', ARRAY['Rennrad','Mountainbike','Fahrrad'], 'cardio',
 ARRAY['Quadrizeps','Gluteus','Herz-Kreislauf'],
 'Outdoor-Radfahren auf Straße oder Trail. Terrain für natürliche Intervalle nutzen.',
 'Outdoor cycling on road or trail. Use terrain for natural intervals.',
 'https://www.youtube.com/watch?v=1VYhyppWTDc', 'https://www.youtube.com/watch?v=1VYhyppWTDc',
 'beginner', ARRAY['Fahrrad'], false),

('Seilspringen', 'Jump Rope', ARRAY['Rope Skipping','Springseil'], 'cardio',
 ARRAY['Waden','Schulter','Herz-Kreislauf'],
 'Hervorragendes Cardio. 3-5 Runden je 3 Min. Handgelenk drehen, leicht auf den Ballen landen.',
 'Excellent cardio. 3-5 rounds of 3 min each. Wrist turns, land lightly on balls of feet.',
 'https://www.youtube.com/watch?v=FJmRQ5iTXKE', 'https://www.youtube.com/watch?v=FJmRQ5iTXKE',
 'beginner', ARRAY['Springseil'], false),

('Rudergerät', 'Rowing Machine', ARRAY['Rudern','Concept2','Erg','Ruderergometer'], 'cardio',
 ARRAY['Rücken','Beine','Core','Herz-Kreislauf'],
 'Ganzkörper-Cardio. Beine-Rücken-Arme Reihenfolge. 2000m Test für Benchmark.',
 'Full-body cardio. Legs-back-arms sequence. 2000m test for benchmark.',
 'https://www.youtube.com/watch?v=zt2mVCnbr0E', 'https://www.youtube.com/watch?v=zt2mVCnbr0E',
 'beginner', ARRAY['Rudergerät'], false),

-- ═══════════════════════════════════════════════════════════════
-- YOGA / FLEXIBILITÄT — ~15 Übungen
-- ═══════════════════════════════════════════════════════════════
('Sonnengruß A', 'Sun Salutation A', ARRAY['Surya Namaskar A','Sonnengruss'], 'flexibility',
 ARRAY['Ganzkörper'],
 'Fließende Sequenz aus 12 Posen. Aufwärmung und Grundlage jeder Yoga-Praxis. Atem-synchron.',
 'Flowing sequence of 12 poses. Warm-up and foundation of any yoga practice. Breath-synchronized.',
 'https://www.youtube.com/watch?v=73sjOu0g58M', 'https://www.youtube.com/watch?v=73sjOu0g58M',
 'beginner', ARRAY[]::TEXT[], false),

('Herabschauender Hund', 'Downward Dog', ARRAY['Down Dog','Adho Mukha Svanasana'], 'flexibility',
 ARRAY['Schulter','Oberschenkel Rückseite','Waden'],
 'Umgekehrtes V. Hände und Füße am Boden, Hüfte nach oben. Dehnt gesamte Rückseite.',
 'Inverted V shape. Hands and feet on floor, hips up. Stretches entire posterior chain.',
 'https://www.youtube.com/watch?v=j97SSGsnCAQ', 'https://www.youtube.com/watch?v=j97SSGsnCAQ',
 'beginner', ARRAY[]::TEXT[], false),

('Krieger I', 'Warrior I', ARRAY['Virabhadrasana I','Warrior 1'], 'flexibility',
 ARRAY['Beine','Hüfte','Schulter'],
 'Ausfallschritt-Position, Arme nach oben. Kräftigt Beine, öffnet Hüfte. Hinterer Fuß 45° nach außen.',
 'Lunge position, arms overhead. Strengthens legs, opens hips. Back foot 45° outward.',
 'https://www.youtube.com/watch?v=k4qaVoAbeHM', 'https://www.youtube.com/watch?v=k4qaVoAbeHM',
 'beginner', ARRAY[]::TEXT[], false),

('Krieger II', 'Warrior II', ARRAY['Virabhadrasana II','Warrior 2'], 'flexibility',
 ARRAY['Beine','Hüfte','Schulter'],
 'Weiter Stand, vorderes Knie 90°, Arme parallel zum Boden. Blick über die vordere Hand.',
 'Wide stance, front knee 90°, arms parallel to floor. Gaze over front hand.',
 'https://www.youtube.com/watch?v=QdJ68plyWQ0', 'https://www.youtube.com/watch?v=QdJ68plyWQ0',
 'beginner', ARRAY[]::TEXT[], false),

('Krieger III', 'Warrior III', ARRAY['Virabhadrasana III','Warrior 3'], 'flexibility',
 ARRAY['Beine','Core','Gluteus'],
 'Einbeinige Balance. Oberkörper und hinteres Bein parallel zum Boden. Arme nach vorne.',
 'Single-leg balance. Torso and back leg parallel to floor. Arms forward.',
 'https://www.youtube.com/watch?v=TccLjMLFBCg', 'https://www.youtube.com/watch?v=TccLjMLFBCg',
 'intermediate', ARRAY[]::TEXT[], false),

('Dreieck', 'Triangle Pose', ARRAY['Trikonasana','Dreieckspose'], 'flexibility',
 ARRAY['Beine','seitlicher Rumpf','Hüfte'],
 'Weiter Stand, Oberkörper seitlich neigen. Untere Hand am Schienbein, obere Hand zur Decke.',
 'Wide stance, lean torso sideways. Lower hand on shin, upper hand to ceiling.',
 'https://www.youtube.com/watch?v=S6gB0QHbWFE', 'https://www.youtube.com/watch?v=S6gB0QHbWFE',
 'beginner', ARRAY[]::TEXT[], false),

('Taube', 'Pigeon Pose', ARRAY['Eka Pada Rajakapotasana','Taubenpose'], 'flexibility',
 ARRAY['Hüftbeuger','Gluteus','Piriformis'],
 'Tiefe Hüftöffnung. Vorderes Bein angewinkelt, hinteres Bein gestreckt. Sanft in die Dehnung sinken.',
 'Deep hip opener. Front leg bent, back leg extended. Gently sink into the stretch.',
 'https://www.youtube.com/watch?v=FH6XwEbxjDQ', 'https://www.youtube.com/watch?v=FH6XwEbxjDQ',
 'intermediate', ARRAY[]::TEXT[], false),

('Kobra', 'Cobra Pose', ARRAY['Bhujangasana'], 'flexibility',
 ARRAY['unterer Rücken','Bauch'],
 'Bauchlage, Hände neben der Brust, Oberkörper sanft heben. Rückbeuge für die Wirbelsäule.',
 'Prone position, hands beside chest, gently lift torso. Backbend for the spine.',
 'https://www.youtube.com/watch?v=JDcdhTuycOI', 'https://www.youtube.com/watch?v=JDcdhTuycOI',
 'beginner', ARRAY[]::TEXT[], false),

('Baum', 'Tree Pose', ARRAY['Vrikshasana','Baumpose'], 'flexibility',
 ARRAY['Beine','Core'],
 'Einbeinige Balancepose. Fußsohle am inneren Oberschenkel, Hände vor der Brust oder über Kopf.',
 'Single-leg balance pose. Foot sole on inner thigh, hands at chest or overhead.',
 'https://www.youtube.com/watch?v=wdln9qWYloU', 'https://www.youtube.com/watch?v=wdln9qWYloU',
 'beginner', ARRAY[]::TEXT[], false),

('Vorbeuge (sitzend)', 'Seated Forward Fold', ARRAY['Paschimottanasana','Vorbeuge'], 'flexibility',
 ARRAY['Oberschenkel Rückseite','unterer Rücken'],
 'Sitzend, Beine gestreckt. Oberkörper nach vorne über die Beine falten. Nicht am Rücken zerren.',
 'Seated, legs extended. Fold torso forward over legs. Do not yank on back.',
 'https://www.youtube.com/watch?v=9HI0JH00Nso', 'https://www.youtube.com/watch?v=9HI0JH00Nso',
 'beginner', ARRAY[]::TEXT[], false),

('Kind-Pose', 'Child''s Pose', ARRAY['Balasana','Kindhaltung'], 'flexibility',
 ARRAY['unterer Rücken','Schulter','Hüfte'],
 'Ruhepose. Knie weit, Stirn zum Boden, Arme nach vorne. Regeneration zwischen Posen.',
 'Resting pose. Knees wide, forehead to floor, arms forward. Recovery between poses.',
 'https://www.youtube.com/watch?v=eqVMAPM00DM', 'https://www.youtube.com/watch?v=eqVMAPM00DM',
 'beginner', ARRAY[]::TEXT[], false),

('Drehsitz', 'Seated Twist', ARRAY['Ardha Matsyendrasana','Wirbelsäulendrehung'], 'flexibility',
 ARRAY['Wirbelsäule','schräger Bauch'],
 'Sitzend, ein Bein über das andere. Oberkörper zur Seite drehen. Wirbelsäulen-Mobilität.',
 'Seated, one leg over the other. Rotate torso to side. Spinal mobility.',
 'https://www.youtube.com/watch?v=VXg4piSTfng', 'https://www.youtube.com/watch?v=VXg4piSTfng',
 'beginner', ARRAY[]::TEXT[], false),

('Savasana', 'Savasana', ARRAY['Totenstellung','Corpse Pose'], 'flexibility',
 ARRAY['Ganzkörper'],
 'Abschluss-Entspannungspose. Flach auf dem Rücken, Augen geschlossen. 5-10 Min bewusst entspannen.',
 'Final relaxation pose. Flat on back, eyes closed. 5-10 min conscious relaxation.',
 'https://www.youtube.com/watch?v=1VYhyppWTDc', 'https://www.youtube.com/watch?v=1VYhyppWTDc',
 'beginner', ARRAY[]::TEXT[], false),

-- ═══════════════════════════════════════════════════════════════
-- FUNKTIONAL — ~10 Übungen
-- ═══════════════════════════════════════════════════════════════
('Burpees', 'Burpees', ARRAY['Burpee'], 'functional',
 ARRAY['Ganzkörper','Herz-Kreislauf'],
 'Ganzkörper-Cardio: Hocke → Liegestütz → Sprung. Hochintensiv. Jede Rep zählt.',
 'Full-body cardio: squat → push-up → jump. High intensity. Every rep counts.',
 'https://www.youtube.com/watch?v=dZgVxmf6jkA', 'https://www.youtube.com/watch?v=dZgVxmf6jkA',
 'intermediate', ARRAY[]::TEXT[], true),

('Kettlebell Swing', 'Kettlebell Swing', ARRAY['KB Swing','Kettlebell'], 'functional',
 ARRAY['Gluteus','Oberschenkel Rückseite','Core','Schulter'],
 'Hüftdominante Schwungbewegung. Kettlebell zwischen den Beinen durch nach vorne schwingen. Explosive Hüftstreckung.',
 'Hip-dominant swinging motion. Swing kettlebell through legs forward. Explosive hip extension.',
 'https://www.youtube.com/watch?v=YSxHifyI6s8', 'https://www.youtube.com/watch?v=YSxHifyI6s8',
 'intermediate', ARRAY['Kettlebell'], true),

('Box Jumps', 'Box Jumps', ARRAY['Kastensprünge','Box Jump'], 'functional',
 ARRAY['Quadrizeps','Gluteus','Waden'],
 'Beidbeiniger Sprung auf eine Box. Explosivkraft und Plyometrie. Weich landen!',
 'Two-footed jump onto a box. Explosive power and plyometrics. Land softly!',
 'https://www.youtube.com/watch?v=hxldG9FX4j8', 'https://www.youtube.com/watch?v=hxldG9FX4j8',
 'intermediate', ARRAY['Plyo-Box'], true),

('Turkish Get-Up', 'Turkish Get-Up', ARRAY['TGU','Türkisches Aufstehen'], 'functional',
 ARRAY['Schulter','Core','Beine'],
 'Komplexe Ganzkörperübung. Von liegend mit Gewicht über Kopf bis zum Stehen. Stabilität und Mobilität.',
 'Complex full-body exercise. From lying with weight overhead to standing. Stability and mobility.',
 'https://www.youtube.com/watch?v=0bWRPC49-KI', 'https://www.youtube.com/watch?v=0bWRPC49-KI',
 'advanced', ARRAY['Kettlebell'], true),

('Mountain Climbers', 'Mountain Climbers', ARRAY['Bergsteiger'], 'functional',
 ARRAY['Core','Schulter','Herz-Kreislauf'],
 'Liegestütz-Position, abwechselnd Knie zur Brust ziehen. Schnelles Tempo für Cardio-Effekt.',
 'Push-up position, alternate pulling knees to chest. Fast pace for cardio effect.',
 'https://www.youtube.com/watch?v=nmwgirgXLYM', 'https://www.youtube.com/watch?v=nmwgirgXLYM',
 'beginner', ARRAY[]::TEXT[], false),

('Battle Ropes', 'Battle Ropes', ARRAY['Battling Ropes','Seile'], 'functional',
 ARRAY['Schulter','Core','Herz-Kreislauf'],
 'Dicke Seile abwechselnd oder gleichzeitig schwingen. Hochintensives Ganzkörper-Cardio.',
 'Alternate or simultaneous rope waves. High-intensity full-body cardio.',
 'https://www.youtube.com/watch?v=MU24kPBvBBg', 'https://www.youtube.com/watch?v=MU24kPBvBBg',
 'intermediate', ARRAY['Battle Ropes'], false),

('Thrusters', 'Thrusters', ARRAY['Squat Press','Frontsquat-Press'], 'functional',
 ARRAY['Quadrizeps','Schulter','Trizeps'],
 'Front Squat direkt in Schulterdrücken. Explosive Ganzkörperübung. Beliebt im CrossFit.',
 'Front squat directly into overhead press. Explosive full-body exercise. Popular in CrossFit.',
 'https://www.youtube.com/watch?v=oPkkmIC2JMs', 'https://www.youtube.com/watch?v=oPkkmIC2JMs',
 'intermediate', ARRAY['Langhantel'], true),

('Medizinball-Slam', 'Medicine Ball Slam', ARRAY['Ball Slam','Med Ball Slam'], 'functional',
 ARRAY['Schulter','Core','Latissimus'],
 'Medizinball über Kopf nehmen und mit voller Kraft auf den Boden schlagen. Powerentladung.',
 'Lift medicine ball overhead and slam to ground with full force. Power release.',
 'https://www.youtube.com/watch?v=j4kvI-lnOjk', 'https://www.youtube.com/watch?v=j4kvI-lnOjk',
 'beginner', ARRAY['Medizinball'], true),

('Liegestütze', 'Push-Ups', ARRAY['Push-Ups','Pushups','Liegestuetze'], 'functional',
 ARRAY['Brust','Trizeps','vordere Schulter','Core'],
 'Klassische Körpergewichtsübung. Hände schulterbreit, Körper gerade, Brust fast zum Boden.',
 'Classic bodyweight exercise. Hands shoulder-width, body straight, chest nearly touches floor.',
 'https://www.youtube.com/watch?v=IODxDxX7oi4', 'https://www.youtube.com/watch?v=IODxDxX7oi4',
 'beginner', ARRAY[]::TEXT[], true),

('Pistol Squats', 'Pistol Squats', ARRAY['Einbeinige Kniebeuge','Single Leg Squat'], 'functional',
 ARRAY['Quadrizeps','Gluteus','Core'],
 'Einbeinige Kniebeuge bis ganz unten. Erfordert Kraft, Balance und Mobilität. Vorderes Bein gestreckt.',
 'Single-leg squat all the way down. Requires strength, balance and mobility. Front leg extended.',
 'https://www.youtube.com/watch?v=vq5-vdgJc0I', 'https://www.youtube.com/watch?v=vq5-vdgJc0I',
 'advanced', ARRAY[]::TEXT[], true);
