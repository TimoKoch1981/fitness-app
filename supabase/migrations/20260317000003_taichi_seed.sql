-- ════════════════════════════════════════════════════════════════════════
-- Tai Chi Exercise Catalog Seed — Yang 24 Form (24 Movements)
-- All stored as category='flexibility', subcategory='tai_chi_yang24'
-- ════════════════════════════════════════════════════════════════════════

INSERT INTO exercise_catalog (
  name, name_en, category, subcategory, pose_category, body_region, movement_pattern,
  difficulty, sanskrit_name, hold_duration_seconds,
  primary_muscles, secondary_muscles, equipment_needed, is_compound, is_unilateral, force_type,
  breathing_cue, tips, sort_order
) VALUES

-- Yang 24 Form — Die 24 Bewegungen in traditioneller Reihenfolge

('Eröffnung', 'Opening Form', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'beginner', 'Qǐ Shì', 0,
 ARRAY['shoulders','core'], ARRAY['quads','calves'], ARRAY[]::TEXT[], false, false, 'dynamic',
 '{"de":"Einatmen Arme heben, Ausatmen Arme senken","en":"Inhale raise arms, exhale lower arms"}'::jsonb,
 '{"de":["Schulterbreiter Stand","Knie leicht gebeugt","Arme bis Schulterhöhe heben"],"en":["Shoulder-width stance","Slight knee bend","Raise arms to shoulder height"]}'::jsonb,
 300),

('Dem Wildpferd die Mähne teilen', 'Part Wild Horses Mane', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'beginner', 'Yě Mǎ Fēn Zōng', 0,
 ARRAY['quads','core','shoulders'], ARRAY['hip_flexors','obliques'], ARRAY[]::TEXT[], true, true, 'dynamic',
 '{"de":"Einatmen sammeln, Ausatmen teilen","en":"Inhale gather, exhale part"}'::jsonb,
 '{"de":["Gewichtsverlagerung links-rechts","Arme gegengleich bewegen","3 Wiederholungen (L-R-L)"],"en":["Weight shift left-right","Arms move opposite","3 repetitions (L-R-L)"]}'::jsonb,
 301),

('Weißer Kranich breitet Flügel aus', 'White Crane Spreads Wings', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'beginner', 'Bái Hè Liàng Chì', 0,
 ARRAY['shoulders','core'], ARRAY['quads','calves','hip_flexors'], ARRAY[]::TEXT[], false, false, 'dynamic',
 '{"de":"Einatmen Arme öffnen, Ausatmen senken","en":"Inhale open arms, exhale lower"}'::jsonb,
 '{"de":["Rechte Hand oben, linke Hand unten","Gewicht auf rechtes Bein","Linker Fuß nur Zehen am Boden"],"en":["Right hand up, left hand down","Weight on right leg","Left foot toe-touch only"]}'::jsonb,
 302),

('Knie bürsten', 'Brush Knee and Push', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'beginner', 'Lōu Xī Ào Bù', 0,
 ARRAY['quads','shoulders','core'], ARRAY['glutes','obliques'], ARRAY[]::TEXT[], true, true, 'dynamic',
 '{"de":"Ausatmen drücken, Einatmen zurückführen","en":"Exhale push, inhale withdraw"}'::jsonb,
 '{"de":["Hand wischt über Knie","Gegenseite drückt nach vorn","3 Wiederholungen"],"en":["Hand brushes past knee","Opposite hand pushes forward","3 repetitions"]}'::jsonb,
 303),

('Fidel spielen', 'Play the Fiddle', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'beginner', 'Shǒu Huī Pípá', 0,
 ARRAY['shoulders','core'], ARRAY['quads','forearms'], ARRAY[]::TEXT[], false, false, 'dynamic',
 '{"de":"Ruhig und gleichmäßig atmen","en":"Breathe calmly and evenly"}'::jsonb,
 '{"de":["Arme als ob man eine Laute hält","Gewicht auf hinterem Bein","Vorderer Fuß nur Ferse am Boden"],"en":["Arms as if holding a lute","Weight on back leg","Front foot heel only"]}'::jsonb,
 304),

('Den Affen abwehren', 'Repulse the Monkey', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'beginner', 'Dào Juǎn Gōng', 0,
 ARRAY['shoulders','core','quads'], ARRAY['hip_flexors','obliques'], ARRAY[]::TEXT[], true, true, 'dynamic',
 '{"de":"Einatmen zurücknehmen, Ausatmen drücken","en":"Inhale withdraw, exhale push"}'::jsonb,
 '{"de":["Rückwärts gehen","Abwechselnd links-rechts","4 Wiederholungen"],"en":["Step backward","Alternate left-right","4 repetitions"]}'::jsonb,
 305),

('Vogelschwanz greifen links', 'Grasp Birds Tail Left', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'intermediate', 'Zuǒ Lǎn Què Wěi', 0,
 ARRAY['core','shoulders','quads'], ARRAY['glutes','forearms','obliques'], ARRAY[]::TEXT[], true, true, 'dynamic',
 '{"de":"4 Energien: Ward Off, Roll Back, Press, Push","en":"4 energies: Ward Off, Roll Back, Press, Push"}'::jsonb,
 '{"de":["Wichtigste Sequenz im Tai Chi","Ward Off → Roll Back → Press → Push","Gewichtsverlagerung vor-zurück"],"en":["Most important Tai Chi sequence","Ward Off → Roll Back → Press → Push","Weight shift forward-back"]}'::jsonb,
 306),

('Vogelschwanz greifen rechts', 'Grasp Birds Tail Right', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'intermediate', 'Yòu Lǎn Què Wěi', 0,
 ARRAY['core','shoulders','quads'], ARRAY['glutes','forearms','obliques'], ARRAY[]::TEXT[], true, true, 'dynamic',
 '{"de":"Spiegelbild der linken Seite","en":"Mirror of left side"}'::jsonb,
 '{"de":["Gleiche 4 Energien, andere Seite","Übergang: Gewicht zurück, Füße umsetzen"],"en":["Same 4 energies, other side","Transition: shift weight back, reposition feet"]}'::jsonb,
 307),

('Einfache Peitsche', 'Single Whip', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'intermediate', 'Dān Biān', 0,
 ARRAY['shoulders','core','quads'], ARRAY['forearms','obliques'], ARRAY[]::TEXT[], true, true, 'dynamic',
 '{"de":"Ausatmen zur Seite öffnen","en":"Exhale open to the side"}'::jsonb,
 '{"de":["Rechte Hand: Hakenhaltung (5 Finger zusammen)","Linke Hand: offene Handfläche nach vorn","Breiter Stand"],"en":["Right hand: hook shape (5 fingers together)","Left hand: open palm forward","Wide stance"]}'::jsonb,
 308),

('Hände wie Wolken bewegen', 'Wave Hands Like Clouds', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'beginner', 'Yún Shǒu', 0,
 ARRAY['core','shoulders','obliques'], ARRAY['quads','hip_flexors'], ARRAY[]::TEXT[], false, false, 'dynamic',
 '{"de":"Fließend atmen, Arme kreisen wie Wolken","en":"Flow breath, arms circle like clouds"}'::jsonb,
 '{"de":["Seitliche Schritte","Hände abwechselnd auf/ab","Blick folgt oberer Hand","3 Wiederholungen"],"en":["Lateral steps","Hands alternate up/down","Gaze follows upper hand","3 repetitions"]}'::jsonb,
 309),

('Einfache Peitsche (Wdh.)', 'Single Whip (Repeat)', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'intermediate', 'Dān Biān', 0,
 ARRAY['shoulders','core','quads'], ARRAY['forearms','obliques'], ARRAY[]::TEXT[], true, true, 'dynamic',
 '{"de":"Wie vorherige Einfache Peitsche","en":"Same as previous Single Whip"}'::jsonb,
 '{"de":["Wiederholung der Bewegung 9"],"en":["Repetition of movement 9"]}'::jsonb,
 310),

('Hohes Streicheln des Pferdes', 'High Pat on Horse', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'intermediate', 'Gāo Tàn Mǎ', 0,
 ARRAY['shoulders','core'], ARRAY['quads','hip_flexors'], ARRAY[]::TEXT[], false, false, 'dynamic',
 '{"de":"Einatmen sammeln, Ausatmen drücken","en":"Inhale gather, exhale push"}'::jsonb,
 '{"de":["Rechte Hand drückt nach vorn","Gewicht auf hinterem Bein","Vorderer Fuß nur Zehen"],"en":["Right hand pushes forward","Weight on back leg","Front foot toe-touch"]}'::jsonb,
 311),

('Rechter Fersenkick', 'Right Heel Kick', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'intermediate', 'Yòu Dēng Jiǎo', 0,
 ARRAY['quads','hip_flexors','core'], ARRAY['glutes','calves'], ARRAY[]::TEXT[], false, true, 'dynamic',
 '{"de":"Ausatmen Ferse nach vorn stoßen","en":"Exhale push heel forward"}'::jsonb,
 '{"de":["Hände kreuzen vor Brust","Dann öffnen während Kick","Nicht höher als Hüfte treten"],"en":["Cross hands before chest","Open during kick","Dont kick higher than hip"]}'::jsonb,
 312),

('Doppelfaust zu den Ohren', 'Strike Ears with Fists', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'intermediate', 'Shuāng Fēng Guàn Ěr', 0,
 ARRAY['shoulders','core','quads'], ARRAY['forearms','biceps'], ARRAY[]::TEXT[], true, false, 'dynamic',
 '{"de":"Ausatmen beide Fäuste gleichzeitig schlagen","en":"Exhale strike both fists simultaneously"}'::jsonb,
 '{"de":["Ausfallschritt nach vorn","Beide Fäuste bogenförmig zu den Schläfen","Kontrollierte Bewegung"],"en":["Step forward into lunge","Both fists arc toward temples","Controlled movement"]}'::jsonb,
 313),

('Linker Zehenkick', 'Left Toe Kick', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'intermediate', 'Zuǒ Dēng Jiǎo', 0,
 ARRAY['quads','hip_flexors','core'], ARRAY['glutes','calves'], ARRAY[]::TEXT[], false, true, 'dynamic',
 '{"de":"Ausatmen Zehen nach vorn schnappen","en":"Exhale snap toes forward"}'::jsonb,
 '{"de":["Schneller als Fersenkick","Fußspitze zeigt Richtung","Balance auf Standbein"],"en":["Faster than heel kick","Toes point direction","Balance on standing leg"]}'::jsonb,
 314),

('Schlange kriecht / Goldener Hahn links', 'Snake Creeps / Golden Rooster Left', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'intermediate', 'Xià Shì / Jīn Jī Dú Lì', 0,
 ARRAY['quads','glutes','core'], ARRAY['hip_flexors','hamstrings','calves'], ARRAY[]::TEXT[], true, true, 'dynamic',
 '{"de":"Ausatmen tief sinken, Einatmen aufsteigen","en":"Exhale sink low, inhale rise up"}'::jsonb,
 '{"de":["Tiefe Hocke auf einem Bein","Dann auf einem Bein stehen","Balance-Herausforderung"],"en":["Deep squat on one leg","Then stand on one leg","Balance challenge"]}'::jsonb,
 315),

('Schlange kriecht / Goldener Hahn rechts', 'Snake Creeps / Golden Rooster Right', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'intermediate', 'Xià Shì / Jīn Jī Dú Lì', 0,
 ARRAY['quads','glutes','core'], ARRAY['hip_flexors','hamstrings','calves'], ARRAY[]::TEXT[], true, true, 'dynamic',
 '{"de":"Spiegelbild der linken Seite","en":"Mirror of left side"}'::jsonb,
 '{"de":["Gleiche Bewegung, andere Seite"],"en":["Same movement, other side"]}'::jsonb,
 316),

('Die Dame am Webstuhl', 'Fair Lady Works Shuttles', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'intermediate', 'Yù Nǚ Chuān Suō', 0,
 ARRAY['shoulders','core','quads'], ARRAY['obliques','hip_flexors'], ARRAY[]::TEXT[], true, true, 'dynamic',
 '{"de":"Einatmen drehen, Ausatmen drücken","en":"Inhale turn, exhale push"}'::jsonb,
 '{"de":["4 Diagonalrichtungen","Obere Hand blockt, untere Hand drückt","4 Wiederholungen in verschiedene Richtungen"],"en":["4 diagonal directions","Upper hand blocks, lower hand pushes","4 repetitions in different directions"]}'::jsonb,
 317),

('Nadel am Meeresgrund', 'Needle at Sea Bottom', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'intermediate', 'Hǎi Dǐ Zhēn', 0,
 ARRAY['core','hamstrings','erector_spinae'], ARRAY['shoulders','quads'], ARRAY[]::TEXT[], false, false, 'dynamic',
 '{"de":"Ausatmen nach unten greifen","en":"Exhale reach downward"}'::jsonb,
 '{"de":["Hand taucht wie Nadel nach unten","Gewicht auf hinterem Bein","Oberkörper leicht vorgebeugt"],"en":["Hand plunges down like a needle","Weight on back leg","Torso slightly forward"]}'::jsonb,
 318),

('Fächer durch den Rücken', 'Fan Through Back', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'intermediate', 'Shǎn Tōng Bì', 0,
 ARRAY['shoulders','core'], ARRAY['quads','chest'], ARRAY[]::TEXT[], true, false, 'dynamic',
 '{"de":"Einatmen aufsteigen und öffnen","en":"Inhale rise and open"}'::jsonb,
 '{"de":["Arme öffnen wie ein Fächer","Schritt nach vorn","Kraftvolle Öffnung"],"en":["Arms open like a fan","Step forward","Powerful opening"]}'::jsonb,
 319),

('Abwehr und Fauststoß', 'Deflect Parry and Punch', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'intermediate', 'Bān Lán Chuí', 0,
 ARRAY['core','shoulders','forearms'], ARRAY['quads','obliques','biceps'], ARRAY[]::TEXT[], true, false, 'dynamic',
 '{"de":"Ausatmen Fauststoß, Einatmen zurücknehmen","en":"Exhale punch, inhale withdraw"}'::jsonb,
 '{"de":["Drehen, blocken, dann gerader Fauststoß","Einzige Faust-Technik in der Form","Kraft aus der Hüftdrehung"],"en":["Turn, block, then straight punch","Only fist technique in the form","Power from hip rotation"]}'::jsonb,
 320),

('Scheinbarer Abschluss', 'Apparent Close-Up', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'beginner', 'Rú Fēng Sì Bì', 0,
 ARRAY['shoulders','core'], ARRAY['quads','forearms'], ARRAY[]::TEXT[], false, false, 'dynamic',
 '{"de":"Einatmen zurücknehmen, Ausatmen nach vorn drücken","en":"Inhale withdraw, exhale push forward"}'::jsonb,
 '{"de":["Hände zurückziehen zur Brust","Dann nach vorn schieben","Gewichtsverlagerung vor und zurück"],"en":["Pull hands back to chest","Then push forward","Weight shift forward and back"]}'::jsonb,
 321),

('Kreuzende Hände', 'Cross Hands', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'beginner', 'Shí Zì Shǒu', 0,
 ARRAY['shoulders','core'], ARRAY['quads'], ARRAY[]::TEXT[], false, false, 'dynamic',
 '{"de":"Einatmen Arme öffnen, Ausatmen kreuzen","en":"Inhale open arms, exhale cross"}'::jsonb,
 '{"de":["Arme öffnen, dann vor Brust kreuzen","Schulterbreiter Stand","Fast wie Eröffnung"],"en":["Open arms, then cross before chest","Shoulder-width stance","Similar to opening"]}'::jsonb,
 322),

('Abschluss', 'Closing Form', 'flexibility', 'tai_chi_yang24', 'tai_chi_form', 'mind_body', 'tai_chi_form',
 'beginner', 'Shōu Shì', 0,
 ARRAY['shoulders','core'], ARRAY['quads','calves'], ARRAY[]::TEXT[], false, false, 'dynamic',
 '{"de":"Ausatmen Arme senken, zur Ruhe kommen","en":"Exhale lower arms, come to rest"}'::jsonb,
 '{"de":["Arme langsam senken","Füße zusammen","Einen Moment still stehen"],"en":["Slowly lower arms","Feet together","Stand still for a moment"]}'::jsonb,
 323)

ON CONFLICT (name) DO NOTHING;
