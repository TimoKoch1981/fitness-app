-- v14.21 / Punkt 3 Teil 2: Exercise-Catalog-Sweep
--
-- Vorher waren nur 4 Uebungen mit is_unilateral=true geflaggt
-- (Kurzhantelrudern, Bulgarische Kniebeuge, Ausfallschritte, Pistol Squats).
-- Viele weitere Uebungen sind aber strikt links/rechts und sollten
-- automatisch L+R-Saetze bekommen, statt dass der Nutzer pro Workout
-- den manuellen L/R-Toggle drueckt.
--
-- Kriterium fuer Flag-Setzung: Uebung kann physisch NICHT bilateral
-- ausgefuehrt werden (Side Plank, Pistol Squat) ODER ist konventionell
-- immer einseitig (Trizeps-Kickback, Concentration Curl).
--
-- Bewusst NICHT geflaggt:
--   - Trizepsdrueckenmit Rope/Bar (bilateral Default, einseitig via Toggle)
--   - Hammer/Bizeps Curls (alternierend, aber Volumen pro Hand zaehlt)
--   - Yoga-Posen (Hold-basiert, nicht Rep-basiert; Tracker-Logik passt nicht)
--   - Schwimmen (auch wenn z.B. Kraulschwimmen pro Arm waere — Cardio-Modell)

UPDATE exercise_catalog SET is_unilateral = true WHERE name IN (
  'Beinpresse einbeinig',
  'Einbeiniges Kreuzheben',
  'Side Plank',
  'Pallof Press',
  'Step-Ups',
  'Suitcase Carry',
  'Trizeps-Kickbacks',
  'Concentration Curl',
  'Glute Kickback',
  'Copenhagen Plank',
  'Turkish Get-Up',
  'Cable Woodchop',
  'Landmine Press'
);

-- PostgREST Schema-Reload nicht noetig — wir aendern nur Daten, keine Spalten.
