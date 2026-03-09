# Konzept: Exercise Catalog — Konsolidiertes Experten-Review

**Stand:** 2026-03-09 | **Version:** 1.0
**Scope:** Vollstaendiger Review der `exercise_catalog`-Tabelle durch 5 Experten-Perspektiven
**Basis:** 70 Uebungen (35 Strength, 11 Cardio, 13 Flexibility, 11 Functional)

---

## Inhaltsverzeichnis

1. [Executive Summary](#1-executive-summary)
2. [Neues Datenbankschema (konsolidiert)](#2-neues-datenbankschema)
3. [Datenkorrekturen (bestehende 70 Uebungen)](#3-datenkorrekturen)
4. [Fehlende Uebungen (Erweiterung auf ~95)](#4-fehlende-uebungen)
5. [Standardisierte Taxonomien](#5-standardisierte-taxonomien)
6. [Medizinische Sicherheitsfelder](#6-medizinische-sicherheitsfelder)
7. [Video-System (4-fach: DE/EN x M/F)](#7-video-system)
8. [UX-Konzept: Exercise Picker & Plan-Editor](#8-ux-konzept)
9. [Implementierungs-Roadmap](#9-implementierungs-roadmap)
10. [Quellen & Referenzen](#10-quellen)

---

## 1. Executive Summary

### 5 Experten-Perspektiven

| # | Experte | Kern-Findings |
|---|---------|---------------|
| 1 | **Kraftsportler/Trainer** | 11 Uebungen im Code referenziert aber nicht im Katalog, 6 falsche `is_compound`-Flags, primaere/sekundaere Muskeltrennung fehlt |
| 2 | **Sportmediziner** | Keine Gelenk-Belastungsdaten, keine Kontraindikationen (medikolegales Risiko), keine Bewegungsmuster-Klassifikation |
| 3 | **Systemarchitekt** | 12 neue Spalten noetig (JSONB Videos, Arrays fuer Muskeln, CHECK-Constraints statt ENUMs), Migration in 3 Phasen |
| 4 | **Data Analyst** | 27 Fehler in 70 Uebungen (39%), Datenqualitaet ~72%, 11 Naming-Inkonsistenzen, 5 Coverage-Luecken |
| 5 | **UX/Fitnesstrainer** | AddWorkoutDialog nutzt Katalog nicht, kein Plan-Editor, kein Favoriten-System, kein Exercise Filter |

### Gesamt-Datenqualitaet

| Dimension | Score | Details |
|-----------|-------|---------|
| is_compound Korrektheit | 86% | 5 von 35 Strength falsch |
| muscle_groups Korrektheit | ~65% | Fehlende Synergisten, inkonsistentes Naming |
| Equipment Korrektheit | ~90% | Wenige Probleme |
| DefaultPlan Coverage | 70% | 5 von 17 Uebungen fehlen |
| Naming-Konsistenz | ~55% | 11 verschiedene Inkonsistenzen |
| **Gesamt** | **~72%** | Solide Basis, signifikante Normalisierung noetig |

### Top-5 Handlungsempfehlungen

1. **SOFORT:** 5 kritische `is_compound`-Fehler korrigieren
2. **SOFORT:** 5 fehlende defaultPlan-Uebungen zum Katalog hinzufuegen
3. **KURZFRISTIG:** Schema um 12 neue Spalten erweitern (Migration)
4. **KURZFRISTIG:** Muskelgruppen-Naming normalisieren + primaer/sekundaer trennen
5. **MITTELFRISTIG:** Exercise Picker + Plan-Editor implementieren

---

## 2. Neues Datenbankschema

### 2.1 Aktuelles Schema (IST)

```sql
CREATE TABLE exercise_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  aliases TEXT[] DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'strength'
    CHECK (category IN ('strength', 'cardio', 'flexibility', 'functional', 'other')),
  muscle_groups TEXT[] DEFAULT '{}',
  description TEXT,
  description_en TEXT,
  video_url_de TEXT,
  video_url_en TEXT,
  difficulty TEXT DEFAULT 'intermediate'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  equipment_needed TEXT[] DEFAULT '{}',
  is_compound BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 Neues Schema (SOLL) — Migration

```sql
-- ════════════════════════════════════════════════════════
-- PHASE 1: Neue Spalten hinzufuegen (rueckwaertskompatibel)
-- ════════════════════════════════════════════════════════

-- Muskeln: primaer/sekundaer getrennt (EN-Identifier, Frontend uebersetzt)
ALTER TABLE exercise_catalog ADD COLUMN primary_muscles TEXT[] DEFAULT '{}';
ALTER TABLE exercise_catalog ADD COLUMN secondary_muscles TEXT[] DEFAULT '{}';

-- Koerperregion (fuer Filter-Chips im UI)
ALTER TABLE exercise_catalog ADD COLUMN body_region TEXT
  CHECK (body_region IN (
    'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full_body', 'cardio'
  ));

-- Bewegungsmuster (NSCA-basiert, fuer Push/Pull-Balance)
ALTER TABLE exercise_catalog ADD COLUMN movement_pattern TEXT
  CHECK (movement_pattern IN (
    'horizontal_push', 'horizontal_pull',
    'vertical_push', 'vertical_pull',
    'hip_hinge', 'squat', 'lunge',
    'carry', 'rotation', 'anti_rotation',
    'isolation', 'cardio_steady', 'cardio_interval',
    'flexibility', 'plyometric', 'other'
  ));

-- Kraftrichtung
ALTER TABLE exercise_catalog ADD COLUMN force_type TEXT
  CHECK (force_type IN ('push', 'pull', 'static', 'dynamic'));

-- Unilateral-Flag (fuer L/R-Input im Tracker)
ALTER TABLE exercise_catalog ADD COLUMN is_unilateral BOOLEAN DEFAULT false;

-- Videos als JSONB (erweiterbar auf beliebig viele Varianten)
ALTER TABLE exercise_catalog ADD COLUMN videos JSONB DEFAULT '{}';
-- Format: {"de_male": "url", "de_female": "url", "en_male": "url", "en_female": "url", "thumbnail": "url"}

-- Medizinische Sicherheitsfelder
ALTER TABLE exercise_catalog ADD COLUMN joint_stress JSONB DEFAULT '{}';
-- Format: {"knee": "high", "shoulder": "medium", "lumbar_spine": "low"}

ALTER TABLE exercise_catalog ADD COLUMN contraindications TEXT[] DEFAULT '{}';
-- Standardisierte EN-Tags: ["disc_herniation", "shoulder_impingement", "knee_osteoarthritis"]

ALTER TABLE exercise_catalog ADD COLUMN contraindications_de TEXT;
ALTER TABLE exercise_catalog ADD COLUMN contraindications_en TEXT;

-- Tipps & Alternativen
ALTER TABLE exercise_catalog ADD COLUMN tips JSONB DEFAULT NULL;
-- Format: {"de": ["Tipp 1", "Tipp 2"], "en": ["Tip 1", "Tip 2"]}

ALTER TABLE exercise_catalog ADD COLUMN alternatives UUID[] DEFAULT '{}';
-- Referenzen auf andere exercise_catalog IDs

-- Sortierung & Verwaltung
ALTER TABLE exercise_catalog ADD COLUMN sort_order INT DEFAULT 0;
ALTER TABLE exercise_catalog ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();

-- ════════════════════════════════════════════════════════
-- PHASE 2: Indexes fuer neue Spalten
-- ════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_exercise_catalog_primary_muscles
  ON exercise_catalog USING GIN (primary_muscles);
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_secondary_muscles
  ON exercise_catalog USING GIN (secondary_muscles);
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_contraindications
  ON exercise_catalog USING GIN (contraindications);
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_body_region
  ON exercise_catalog (body_region);
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_movement_pattern
  ON exercise_catalog (movement_pattern);
CREATE INDEX IF NOT EXISTS idx_exercise_catalog_category
  ON exercise_catalog (category);

-- ════════════════════════════════════════════════════════
-- PHASE 3: User-Favoriten-Tabelle
-- ════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_exercise_favorites (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercise_catalog(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, exercise_id)
);

ALTER TABLE user_exercise_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_favorites" ON user_exercise_favorites
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 2.3 Standardisierte Muskel-Identifier (EN)

Frontend uebersetzt per i18n-Map. DB speichert nur EN-Identifier:

```
chest, upper_chest, lats, rhomboids, traps,
erector_spinae, front_delts, lateral_delts, rear_delts,
biceps, triceps, forearms,
quads, hamstrings, glutes, adductors, abductors,
hip_flexors, calves,
abs, obliques, deep_core,
cardiovascular
```

**i18n-Mapping (Beispiel):**

```typescript
const muscleNames: Record<string, { de: string; en: string }> = {
  chest: { de: 'Brust', en: 'Chest' },
  upper_chest: { de: 'obere Brust', en: 'Upper Chest' },
  lats: { de: 'Latissimus', en: 'Lats' },
  rhomboids: { de: 'Rhomboiden', en: 'Rhomboids' },
  traps: { de: 'Trapezius', en: 'Traps' },
  erector_spinae: { de: 'Erector Spinae', en: 'Erector Spinae' },
  front_delts: { de: 'vordere Schulter', en: 'Front Delts' },
  lateral_delts: { de: 'seitliche Schulter', en: 'Lateral Delts' },
  rear_delts: { de: 'hintere Schulter', en: 'Rear Delts' },
  biceps: { de: 'Bizeps', en: 'Biceps' },
  triceps: { de: 'Trizeps', en: 'Triceps' },
  forearms: { de: 'Unterarme', en: 'Forearms' },
  quads: { de: 'Quadrizeps', en: 'Quads' },
  hamstrings: { de: 'Hamstrings', en: 'Hamstrings' },
  glutes: { de: 'Gluteus', en: 'Glutes' },
  adductors: { de: 'Adduktoren', en: 'Adductors' },
  abductors: { de: 'Abduktoren', en: 'Abductors' },
  hip_flexors: { de: 'Hueftbeuger', en: 'Hip Flexors' },
  calves: { de: 'Waden', en: 'Calves' },
  abs: { de: 'Rectus Abdominis', en: 'Abs' },
  obliques: { de: 'schraeger Bauch', en: 'Obliques' },
  deep_core: { de: 'Core (tief)', en: 'Deep Core' },
  cardiovascular: { de: 'Herz-Kreislauf', en: 'Cardiovascular' },
};
```

---

## 3. Datenkorrekturen (bestehende 70 Uebungen)

### 3.1 Kritische Fehler: is_compound (5 Korrekturen)

| Uebung | Aktuell | Korrekt | Begruendung |
|--------|---------|---------|-------------|
| Kabelrudern | `false` | **`true`** | Bewegt Schulter- UND Ellbogengelenk (ExRx: compound) |
| Kurzhantelrudern | `false` | **`true`** | Einarmiges Rudern: Schulter + Ellbogen (ExRx: compound) |
| Latzug | `false` | **`true`** | Lat Pulldown: Shoulder Adduction + Elbow Flexion (ExRx: compound) |
| Face Pulls | `false` | **`true`** | Horizontale Abduktion + Ellbogenflexion + externe Rotation |
| Mountain Climbers | `false` | **`true`** | Bewegt Hueft-, Knie- UND Schultergelenk |

### 3.2 Muskelgruppen-Korrekturen (primaer/sekundaer)

**Alle 35 Strength-Uebungen mit korrekten primary/secondary_muscles:**

| Uebung | primary_muscles | secondary_muscles |
|--------|-----------------|-------------------|
| Bankdruecken | `chest` | `triceps, front_delts` |
| Schraegbankdruecken | `upper_chest` | `triceps, front_delts` |
| Kurzhantel-Flyes | `chest` | — |
| Cable Crossover | `chest` | — |
| Dips | `chest, triceps` | `front_delts` |
| Klimmzuege | `lats` | `biceps, rhomboids` |
| Langhantelrudern | `lats, rhomboids` | `traps, biceps` |
| Kurzhantelrudern | `lats, rhomboids` | `biceps` |
| Latzug | `lats` | `biceps, rhomboids` |
| Face Pulls | `rear_delts, rhomboids` | `traps` |
| Kreuzheben | `glutes, hamstrings` | `quads, erector_spinae, traps, lats` |
| Kabelrudern | `lats, rhomboids` | `biceps, traps` |
| Schulterdruecken | `front_delts, lateral_delts` | `triceps, traps` |
| Seitheben | `lateral_delts` | — |
| Rear Delt Flyes | `rear_delts` | — |
| Kniebeugen | `quads, glutes` | `hamstrings, adductors, erector_spinae` |
| Beinpresse | `quads, glutes` | — |
| Rumaenisches Kreuzheben | `hamstrings, glutes` | `erector_spinae` |
| Beinbeuger | `hamstrings` | — |
| Beinstrecker | `quads` | — |
| Wadenheben | `calves` | — |
| Hip Thrust | `glutes` | `hamstrings, quads, adductors` |
| Ausfallschritte | `quads, glutes` | `hamstrings, adductors` |
| Bulgarische Kniebeuge | `quads, glutes` | `hamstrings, adductors` |
| Bizeps-Curls | `biceps` | — |
| Hammer Curls | `biceps, forearms` | — |
| Trizepsdruecken | `triceps` | — |
| Skull Crushers | `triceps` | — |
| Plank | `deep_core, abs` | `front_delts` |
| Cable Crunches | `abs` | `obliques` |
| Leg Raises | `abs, hip_flexors` | — |
| Pallof Press | `deep_core, obliques` | — |
| Trap-Bar Deadlift | `quads, glutes` | `erector_spinae, traps` |
| Arnold Press | `front_delts, lateral_delts` | `triceps` |
| T-Bar Rudern | `lats, rhomboids` | `traps, biceps` |

### 3.3 Naming-Normalisierung (ALT → NEU in muscle_groups)

| Alter Wert | Neuer Identifier | Betroffene Uebungen |
|-----------|------------------|---------------------|
| `Oberschenkel` | kontextabhaengig: `quads` oder `hamstrings` | Kniebeugen, Kreuzheben |
| `Oberschenkel Rueckseite` | `hamstrings` | RDL, Beinbeuger, Hip Thrust |
| `unterer Ruecken` | `erector_spinae` | Kreuzheben, RDL, Kobra |
| `Schulter` (unspezifisch) | `front_delts` + `lateral_delts` | Schulterdruecken, Arnold Press |
| `Bauch` | `abs` | Cable Crunches, Kobra |
| `unterer Bauch` | `abs` (kein separater Muskel) | Leg Raises |
| `seitlicher Rumpf` | `obliques` | Dreieck |
| `Brachioradialis` | `forearms` | Hammer Curls |
| `Piriformis` | `glutes` | Taube |
| `Wirbelsaeule` | `erector_spinae` + `deep_core` | Drehsitz |
| `Core` + `Bauch` | `deep_core` + `abs` | Plank |

### 3.4 Equipment-Korrekturen

| Uebung | Aktuell | Korrektur |
|--------|---------|-----------|
| Wadenheben | `['Langhantel']` | `['Wadenmaschine']` oder `['Smith-Maschine']` |
| Kniebeugen | `['Squat Rack']` | `['Power Rack']` |
| Latzug | `['Latzug']` | `['Latzug-Maschine']` |

### 3.5 Sonstige Korrekturen

| Uebung | Feld | Korrektur |
|--------|------|-----------|
| Savasana | `muscle_groups` | `[]` (keine aktiven Muskeln, Entspannungspose) |
| Liegestuetze | `category` | `strength` statt `functional` (inkonsistent mit Dips) |
| Battle Ropes | `is_compound` | `true` (Multi-Joint) |

---

## 4. Fehlende Uebungen (Erweiterung auf ~95)

### 4.1 Prioritaet HOCH — Im defaultPlan referenziert (FUNKTIONS-BUG)

| # | Name (DE) | Name (EN) | Kategorie | Primaer | body_region | movement |
|---|-----------|-----------|-----------|---------|-------------|----------|
| 1 | Reverse Hyperextension | Reverse Hyperextension | strength | `glutes, hamstrings` | legs | hip_hinge |
| 2 | Brustgestuetztes Rudern | Chest-Supported Row | strength | `lats, rhomboids` | back | horizontal_pull |
| 3 | Landmine Press | Landmine Press | strength | `front_delts, upper_chest` | shoulders | vertical_push |
| 4 | Dead Hang | Dead Hang | functional | `forearms, lats` | back | other |
| 5 | Negative Klimmzuege | Negative Pull-Ups | strength | `lats` | back | vertical_pull |

### 4.2 Prioritaet HOCH — Coverage-Luecken schliessen

| # | Name (DE) | Name (EN) | Kategorie | Primaer | body_region | Luecke |
|---|-----------|-----------|-----------|---------|-------------|--------|
| 6 | Shrugs | Shrugs | strength | `traps` | back | Einzige direkte Trapezius-Isolation |
| 7 | Side Plank | Side Plank | strength | `obliques, deep_core` | core | Anti-Lateral-Flexion fehlt |
| 8 | Cable Woodchop | Cable Woodchop | functional | `obliques, deep_core` | core | Rotation fehlt |
| 9 | Hueft-Abduktion | Hip Abduction Machine | strength | `abductors` | legs | Abduktion fehlt |
| 10 | Adduktoren-Maschine | Hip Adduction Machine | strength | `adductors` | legs | Adduktion fehlt |
| 11 | Hyperextension | Back Extension | strength | `erector_spinae, glutes` | back | Erector Spinae Isolation |

### 4.3 Prioritaet MITTEL — Gaengige Varianten

| # | Name (DE) | Name (EN) | Kategorie | Primaer | body_region |
|---|-----------|-----------|-----------|---------|-------------|
| 12 | Kurzhantel-Schraegbankdruecken | Incline Dumbbell Press | strength | `upper_chest` | chest |
| 13 | Preacher Curl | Preacher Curl | strength | `biceps` | arms |
| 14 | Front Raise | Front Raise | strength | `front_delts` | shoulders |
| 15 | Good Mornings | Good Mornings | strength | `hamstrings, erector_spinae` | legs |
| 16 | Sumo Kreuzheben | Sumo Deadlift | strength | `quads, glutes, adductors` | legs |
| 17 | Close-Grip Bankdruecken | Close-Grip Bench Press | strength | `triceps, chest` | chest |
| 18 | Schraege Kurzhantel-Curls | Incline Dumbbell Curls | strength | `biceps` | arms |
| 19 | Overhead Trizeps-Extension | Overhead Tricep Extension | strength | `triceps` | arms |
| 20 | Pull-Through | Cable Pull-Through | strength | `glutes, hamstrings` | legs |
| 21 | Lat Raise (Kabel) | Cable Lateral Raise | strength | `lateral_delts` | shoulders |
| 22 | Glute Kickback | Glute Kickback | strength | `glutes` | legs |
| 23 | Concentration Curl | Concentration Curl | strength | `biceps` | arms |
| 24 | Suitcase Carry | Suitcase Carry | functional | `obliques, forearms` | core |
| 25 | Copenhagen Plank | Copenhagen Plank | strength | `adductors, obliques` | legs |

### 4.4 Unilaterale Uebungen (is_unilateral = true)

Folgende bestehende + neue Uebungen brauchen `is_unilateral = true`:

| Uebung | Status |
|--------|--------|
| Kurzhantelrudern (Einarmiges Rudern) | BESTEHEND |
| Bulgarische Kniebeuge | BESTEHEND |
| Ausfallschritte | BESTEHEND |
| Pistol Squats | BESTEHEND |
| Landmine Press | NEU (#3) |
| Concentration Curl | NEU (#23) |
| Suitcase Carry | NEU (#24) |
| Copenhagen Plank | NEU (#25) |

---

## 5. Standardisierte Taxonomien

### 5.1 Body Regions (fuer Filter-UI)

| ID | EN | DE | Icon |
|----|----|----|------|
| chest | Chest | Brust | Brust-Icon |
| back | Back | Ruecken | Ruecken-Icon |
| shoulders | Shoulders | Schultern | Schulter-Icon |
| arms | Arms | Arme | Arm-Icon |
| legs | Legs | Beine | Bein-Icon |
| core | Core | Core | Core-Icon |
| full_body | Full Body | Ganzkoerper | Koerper-Icon |
| cardio | Cardio | Ausdauer | Herz-Icon |

### 5.2 Movement Patterns (NSCA-basiert)

| Pattern | DE | Beispiele |
|---------|----|-----------|
| horizontal_push | Horizontaler Druck | Bankdruecken, Liegestuetze, Dips |
| horizontal_pull | Horizontaler Zug | Rudern-Varianten, Face Pulls |
| vertical_push | Vertikaler Druck | Schulterdruecken, Arnold Press, Landmine Press |
| vertical_pull | Vertikaler Zug | Klimmzuege, Latzug |
| hip_hinge | Hueft-Scharnier | Kreuzheben, RDL, Hip Thrust |
| squat | Kniebeuge | Kniebeugen, Beinpresse, Goblet Squat |
| lunge | Ausfallschritt | Ausfallschritte, Bulgarische Kniebeuge |
| carry | Tragen | Farmers Walk, Suitcase Carry |
| rotation | Rotation | Cable Woodchop, Drehsitz |
| anti_rotation | Anti-Rotation | Pallof Press, Plank |
| isolation | Isolation | Curls, Seitheben, Beinstrecker |
| cardio_steady | Ausdauer (Steady) | Laufen, Radfahren, Schwimmen |
| cardio_interval | Ausdauer (Intervall) | HIIT, Intervalllaeufe |
| flexibility | Flexibilitaet | Yoga-Posen, Dehnungen |
| plyometric | Plyometrie | Box Jumps, Burpees |

### 5.3 Equipment-Taxonomie (standardisiert)

| DE | EN | Mapping von Alt |
|----|----|----------------|
| Langhantel | Barbell | unveraendert |
| SZ-Stange | EZ-Bar | NEU |
| Kurzhanteln | Dumbbells | unveraendert |
| Kabelzug | Cable Machine | unveraendert |
| Flachbank | Flat Bench | unveraendert |
| Schraegbank | Incline Bench | unveraendert |
| Power Rack | Power Rack | von "Squat Rack" |
| Smith-Maschine | Smith Machine | NEU |
| Klimmzugstange | Pull-up Bar | unveraendert |
| Dipstation | Dip Station | unveraendert |
| Latzug-Maschine | Lat Pulldown Machine | von "Latzug" |
| Beinpresse | Leg Press Machine | unveraendert |
| Beinstrecker-Maschine | Leg Extension Machine | unveraendert |
| Beinbeuger-Maschine | Leg Curl Machine | unveraendert |
| Wadenmaschine | Calf Raise Machine | NEU |
| Kettlebell | Kettlebell | unveraendert |
| Medizinball | Medicine Ball | unveraendert |
| Trap-Bar | Trap Bar | unveraendert |
| Landmine | Landmine | unveraendert |
| Battle Ropes | Battle Ropes | unveraendert |
| Plyo-Box | Plyo Box | unveraendert |
| Springseil | Jump Rope | unveraendert |
| Ergometer | Stationary Bike | unveraendert |
| Fahrrad | Bicycle | unveraendert |
| Rudergeraet | Rowing Machine | unveraendert |
| Schwimmbad | Swimming Pool | unveraendert |
| Widerstandsband | Resistance Band | NEU |
| Hyperextension-Bank | Hyperextension Bench | NEU |
| Koerpergewicht | Bodyweight | NEU (explizit statt `[]`) |

---

## 6. Medizinische Sicherheitsfelder

### 6.1 Gelenk-Belastungsmatrix (Top 20 kritischste Uebungen)

| Uebung | Knie | LWS | Schulter | Bemerkung |
|--------|------|-----|----------|-----------|
| Kniebeugen | **HOCH** | HOCH | niedrig | ~7.6x KG patellar (Escamilla 2001, PMID: 11194098) |
| Kreuzheben | mittel | **HOCH** | niedrig | Bis 14.5x KG LWS-Kompression (Cholewicki 1996, PMID: 8961506) |
| Beinpresse | **HOCH** | mittel | niedrig | ~6x KG patellar |
| Beinstrecker | **HOCH** | niedrig | niedrig | Hohe Scherkraefte bei voller Extension |
| Bankdruecken | niedrig | niedrig | **HOCH** | ~1.5x KG glenohumerale Kraft (Fees 1998, PMID: 9724684) |
| Schulterdruecken | niedrig | mittel | **HOCH** | Subacromiales Impingement-Risiko bei schlechter Form |
| Dips | niedrig | niedrig | **HOCH** | Sternal-claviculaere Ueberlastung moeglich |
| Schraegbankdruecken | niedrig | niedrig | **HOCH** | Wie Bankdruecken, etwas mehr Schulter |
| Ausfallschritte | HOCH | mittel | niedrig | Asymmetrische Belastung |
| Bulgarische Kniebeuge | HOCH | mittel | niedrig | Erhoehte einbeinige Kniebelastung |

### 6.2 Kontraindikationen-Tags (standardisierte Identifier)

```
disc_herniation        — Bandscheibenvorfall
shoulder_impingement   — Schulter-Impingement
knee_osteoarthritis    — Gonarthrose
acl_injury             — Kreuzband-Laesion
rotator_cuff_tear      — Rotatorenmanschetten-Riss
epicondylitis          — Epicondylitis (Tennisarm)
carpal_tunnel          — Karpaltunnelsyndrom
hip_labral_tear        — Hueftlabrum-Laesion
spondylolisthesis      — Spondylolisthese
spinal_stenosis        — Spinalkanalstenose
patellar_tendinopathy  — Patellasehnen-Tendinopathie
ankle_instability      — Sprunggelenk-Instabilitaet
pregnancy              — Schwangerschaft (3. Trimester)
hypertension_severe    — Schwere Hypertonie (>180/120)
```

### 6.3 Beispiel-Kontraindikationen fuer kritische Uebungen

| Uebung | contraindications | Sichere Alternative |
|--------|-------------------|---------------------|
| Kniebeugen | `knee_osteoarthritis, acl_injury, spondylolisthesis` | Beinpresse (reduzierter ROM), Goblet Squat |
| Kreuzheben | `disc_herniation, spondylolisthesis, spinal_stenosis` | Trap-Bar Deadlift, Hip Thrust |
| Bankdruecken | `shoulder_impingement, rotator_cuff_tear` | Floor Press, Kurzhantel-Flyes (limitierter ROM) |
| Schulterdruecken | `shoulder_impingement, rotator_cuff_tear` | Landmine Press, Lateral Raise |
| Dips | `shoulder_impingement` | Cable Crossover, Trizepsdruecken |
| Beinstrecker | `patellar_tendinopathy, acl_injury` | Leg Curl, Wall Sit |

### 6.4 Smart Exercise Filtering (Konzept)

```typescript
// Pseudocode: Automatisches Filtern basierend auf Nutzerprofil
function filterExercises(exercises: CatalogExercise[], profile: UserProfile) {
  const userConditions = profile.health_conditions ?? []; // z.B. ['knee_osteoarthritis']

  return exercises.map(ex => ({
    ...ex,
    warning: ex.contraindications?.some(c => userConditions.includes(c))
      ? getWarningText(ex, userConditions, profile.language)
      : null,
    safeAlternatives: ex.contraindications?.some(c => userConditions.includes(c))
      ? findAlternatives(ex, exercises)
      : [],
  }));
}
```

---

## 7. Video-System (4-fach: DE/EN x M/F)

### 7.1 Schema (JSONB statt separate Spalten)

```sql
-- videos-Feld Format:
{
  "de_male": "https://youtube.com/watch?v=abc123",
  "de_female": "https://youtube.com/watch?v=def456",
  "en_male": "https://youtube.com/watch?v=ghi789",
  "en_female": "https://youtube.com/watch?v=jkl012",
  "thumbnail": "https://img.youtube.com/vi/abc123/maxresdefault.jpg"
}
```

**Vorteile JSONB vs. separate Spalten:**
- Erweiterbar auf weitere Varianten (z.B. `de_senior`, `en_beginner_slow`)
- Keine Migration noetig bei neuen Video-Typen
- Nullbare Felder: Wenn kein weibliches Video vorhanden, Fallback auf maennliches

### 7.2 Video-Auswahl-Logik

```typescript
function getVideoUrl(exercise: CatalogExercise, profile: UserProfile): string | null {
  const lang = profile.language ?? 'de';
  const gender = profile.video_preference ?? profile.gender ?? 'male';

  const videos = exercise.videos ?? {};

  // Primaer: Sprache + Geschlecht
  const primary = videos[`${lang}_${gender}`];
  if (primary) return primary;

  // Fallback 1: Sprache + anderes Geschlecht
  const fallbackGender = gender === 'male' ? 'female' : 'male';
  const fallback1 = videos[`${lang}_${fallbackGender}`];
  if (fallback1) return fallback1;

  // Fallback 2: Andere Sprache + gewuenschtes Geschlecht
  const otherLang = lang === 'de' ? 'en' : 'de';
  const fallback2 = videos[`${otherLang}_${gender}`];
  if (fallback2) return fallback2;

  // Fallback 3: Irgendein Video
  return Object.values(videos).find(v => typeof v === 'string' && v.startsWith('http')) ?? null;

  // Legacy Fallback: video_url_de / video_url_en
  // (waehrend Migration, bestehende Spalten weiter nutzen)
}
```

### 7.3 Migration bestehender Videos

```sql
-- Bestehende video_url_de/video_url_en in JSONB migrieren
UPDATE exercise_catalog SET videos = jsonb_build_object(
  'de_male', video_url_de,
  'en_male', video_url_en
) WHERE video_url_de IS NOT NULL OR video_url_en IS NOT NULL;
```

### 7.4 Video-Settings im Profil

Neues Feld in `profiles`:
```sql
ALTER TABLE profiles ADD COLUMN video_preference TEXT DEFAULT 'from_profile'
  CHECK (video_preference IN ('male', 'female', 'from_profile'));
ALTER TABLE profiles ADD COLUMN video_autoplay TEXT DEFAULT 'wifi_only'
  CHECK (video_autoplay IN ('always', 'wifi_only', 'never'));
```

---

## 8. UX-Konzept

### 8.1 Exercise Picker (Unified Component)

**Problem:** `AddWorkoutDialog` hat Freitext-Input, `AddExerciseDialog` hat Autocomplete. Zwei verschiedene UX.

**Loesung: Gemeinsame `ExercisePicker`-Komponente:**

```
+------------------------------------------+
|  [Lupe] Uebung suchen...           [X]  |
|------------------------------------------|
|  FAV  FAVORITEN                          |
|  +-- Bankdruecken       Brust, Tri  [>] |
|  +-- Kniebeugen         Quad, Glut  [>] |
|------------------------------------------|
|  CLOCK  ZULETZT VERWENDET                |
|  +-- Seitheben           Schulter    [>] |
|  +-- Cable Crunches      Bauch       [>] |
|------------------------------------------|
|  FILTER                                  |
|  [Brust] [Ruecken] [Beine] [Schulter]   |
|  [Arme] [Core] [Cardio] [Flex]          |
|  Equipment: [Alle ...]                   |
|------------------------------------------|
|  ERGEBNISSE (70)                         |
|  +-- Bankdruecken FAV    Brust  [>]     |
|  |   Compound  Intermediate  LH          |
|  +-- Schraegbankdr.      ob. Brust  [>] |
|------------------------------------------|
|  [+] Eigene Uebung eingeben             |
|  [Bot] Buddy fragen                     |
+------------------------------------------+
```

**Kernprinzipien:**
1. Suchfeld immer sichtbar (sticky oben)
2. Fuzzy-Suche mit Alias-Match
3. Muskelgruppen-Chips als horizontale Scroll-Leiste
4. Equipment-Filter als Dropdown
5. Favoriten ganz oben (persistent)
6. Zuletzt verwendet (letzte 5 aus History)
7. Play-Button oeffnet Inline-Video-Preview
8. Buddy-Shortcut am Ende

### 8.2 Plan-Editor

**Aktuell fehlt:** Kein manueller Plan-Editor. "Neuen Plan" oeffnet nur Buddy-Chat.

**Soll:** Dedizierter `PlanEditorDialog.tsx`

**Features:**
- Plan-Name + Split-Typ eingeben
- Tage erstellen + benennen
- Pro Tag: Uebungen via Exercise Picker hinzufuegen
- Inline-Edit fuer Sets/Reps/Weight
- Drag & Drop Reihenfolge (@dnd-kit)
- Superset-Markierung
- Buddy-Hilfe parallel verfuegbar (nicht einziger Weg)

**Drei Eintrittspunkte:**
1. Plan-Tab, kein Plan: "Eigenen Plan erstellen" Button
2. Plan-Tab, Plan vorhanden: Pencil-Icon oeffnet Editor (nicht mehr Buddy)
3. Buddy-Chat erstellt Plan → erscheint im Editor zur Anpassung

### 8.3 Unilaterale Uebungen (L/R)

Wenn `is_unilateral = true`:
- L/R Toggle im Exercise Tracker
- Saetze werden separat pro Seite erfasst
- History zeigt: "L: 3x12@30kg | R: 3x12@30kg"
- WorkoutSet erhaelt `side?: 'left' | 'right'`

### 8.4 Wettbewerbs-Analyse (Zusammenfassung)

| Feature | Best Practice | Wer | FitBuddy Status |
|---------|--------------|-----|-----------------|
| Suche | Fuzzy + Alias + mehrsprachig | Hevy | Teilweise (nur in AddExerciseDialog) |
| Filter | Muskelgruppe + Equipment + Schwierigkeit | JEFIT | FEHLT |
| Favoriten | Stern-Toggle, oben gepinnt | Hevy, Strong | FEHLT |
| Zuletzt verwendet | Top-5 ueber Suchergebnissen | Strong | FEHLT |
| Video-Anzeige | Inline-Loop-GIF, kein extra Screen | Fitbod | Vorhanden (ExerciseVideoModal) |
| KI-Integration | "Replace Exercise" mit Alternativen | Fitbod | Teilweise (Buddy) |
| Plan-Editor | Tage benennen, D&D Reihenfolge | Hevy | FEHLT |

---

## 9. Implementierungs-Roadmap

### Phase 1: Datenbank-Migration (1 Tag)
1. SQL-Migration schreiben (12 neue Spalten + Indexes + Favoriten-Tabelle)
2. Bestehende 70 Uebungen mit korrekten Daten backfillen:
   - `is_compound` Fix (5 Korrekturen)
   - `primary_muscles` / `secondary_muscles` fuer alle 70
   - `body_region` + `movement_pattern` fuer alle 70
   - `is_unilateral` fuer 4 bestehende Uebungen
   - `videos` JSONB aus bestehenden `video_url_de/en` migrieren
3. ~25 neue Uebungen einfuegen (Prioritaet HOCH + MITTEL)
4. `NOTIFY pgrst, 'reload schema'` + PostgREST Restart

### Phase 2: TypeScript-Typen + Hook (0.5 Tage)
5. `CatalogExercise` Interface erweitern in `types/health.ts`
6. `useExerciseCatalog()` anpassen: `staleTime: Infinity` (statische Seed-Daten)
7. i18n-Map fuer Muskel-Identifier erstellen
8. `muscleNames` Translation-Map

### Phase 3: Exercise Picker + AddWorkoutDialog (2 Tage)
9. `ExercisePicker.tsx` als gemeinsame Komponente extrahieren
10. `AddWorkoutDialog` umbauen: Exercise Picker statt Freitext
11. Favoriten-System (DB-Tabelle + Hook)
12. "Zuletzt verwendet" Sektion (aus Workout-History)
13. Muskelgruppen-Filter-Chips
14. Equipment-Filter

### Phase 4: Plan-Editor (3-4 Tage)
15. `PlanEditorDialog.tsx` erstellen
16. Eintrittspunkte aendern (Pencil-Icon, "Eigenen Plan erstellen")
17. Inline-Edit fuer Sets/Reps/Weight
18. Drag & Drop Uebungs-Reihenfolge (@dnd-kit)
19. Superset-Markierung

### Phase 5: Medizin + Video + Polish (2-3 Tage)
20. `joint_stress` + `contraindications` Daten fuer Top 20 Uebungen einfuegen
21. Smart Exercise Filtering basierend auf Nutzerprofil
22. Video-Gender-Toggle
23. Video-Settings in Profil
24. Unilaterale Uebungen: L/R Toggle im Tracker
25. Touch-Target Audit (44px Minimum)

**Gesamt: ~9-11 Tage**

---

## 10. Quellen & Referenzen

### Fachliteratur
- ACSM Guidelines for Exercise Testing and Prescription (11th Ed., 2022)
- NSCA Essentials of Strength Training and Conditioning (4th Ed., 2016)
- Escamilla RF (2001). Knee biomechanics of the dynamic squat exercise. Med Sci Sports Exerc. PMID: 11194098
- Cholewicki J, McGill SM (1996). Mechanical stability of the in vivo lumbar spine. Clin Biomech. PMID: 8961506
- Fees M et al. (1998). Upper extremity weight-training modifications for the injured athlete. Am J Sports Med. PMID: 9724684

### Referenz-Datenbanken
- ExRx.net (~1.600 Uebungen, De-facto-Standard)
- ACE Exercise Library (~350 Uebungen)
- wger.de API (~400 Uebungen, Open Source)
- JEFIT (~1.300 Uebungen)

### Wettbewerbs-Apps
- Hevy (Exercise Picker UX-Benchmark)
- Strong (Minimalismus-Benchmark)
- Fitbod (KI-Integration-Benchmark)
- JEFIT (Datenbank-Groesse-Benchmark)

### Detail-Reviews (separate Dateien)
- `docs/SPORTMEDIZINISCHES_REVIEW_UEBUNGSDATENBANK.md` — Vollstaendige Gelenk-Belastungsmatrix (70 Uebungen), 20 Kontraindikationen, Bewegungsmuster
- `src/docs/UX_KONZEPT_UEBUNGSDATENBANK.md` — Wettbewerbs-Analyse (6 Apps), ASCII-Flowcharts, Mobile-First Prinzipien, Roadmap

---

*Erstellt: 2026-03-09 | 5 Experten-Reviews konsolidiert*
*Kraftsportler + Sportmediziner + Systemarchitekt + Data Analyst + UX/Fitnesstrainer*
