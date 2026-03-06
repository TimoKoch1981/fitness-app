/**
 * KI-Trainer Review Skill — Wissenschaftlich fundiertes Trainings-Review-System
 *
 * Enthält: Volume Landmarks, Double Progression, BW-Multiplier-Tabellen,
 * Deload-Protokoll, Decision Tree, PED-Phasen-Differenzierung
 *
 * ~4500 Tokens — Zugewiesen an: training Agent
 */

import type { SkillMeta } from './types';

export const TRAINER_REVIEW_SKILL_META: SkillMeta = {
  id: 'trainerReview',
  name: 'KI-Trainer Review-System',
  version: '1.0.0',
  updatedAt: '2026-03-06',
  sources: [
    'Pelland et al. 2025, Sports Med (Meta-Regression Volume-Hypertrophie), PMID:41343037',
    'Schoenfeld et al. 2017, J Strength Cond Res (Volume-Hypertrophie), PMID:27433992',
    'Chaves et al. 2024, Sports Med (Load vs Rep Progression), PMID:38286426',
    'Coleman et al. 2024, Sports Med (Deload-Effekte), PMID:38274324',
    'Bell et al. 2024, J Strength Cond Res (Deload-Survey), PMID:38499934',
    'Bell et al. 2023, Sports Med (Deload Delphi-Konsensus), PMC:10511399',
    'Huang et al. 2025, J Strength Cond Res (APRE Autoregulation), PMC:12336695',
    'Hickmott et al. 2022, Sports Med (Autoregulation Meta), PMID:35038063',
    'Zourdos et al. 2016, J Strength Cond Res (RPE/RIR-Skala), PMID:25734784',
    'Helms et al. 2016, J Strength Cond Res (RIR-Training), PMID:26666744',
    'Rhea 2004, J Strength Cond Res (Trainingsvolumen-Standards), PMID:15142003',
    'Moesgaard et al. 2022, Sports Med (LP vs UP Periodisierung), PMID:35044672',
    'Cumming et al. 2024, Eur J Appl Physiol (Muscle Memory), PMID:39159314',
    'Haff & Triplett 2016, NSCA Essentials of Strength Training (BW-Multiplier)',
    'Brzycki 1993, J Phys Educ Rec Dance (1RM-Schaetzformeln)',
  ],
  tokenEstimate: 4500,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-03-06',
      changes: 'Initial: Volume Landmarks, BW-Multiplier, Double Progression, Deload-Protokoll, Decision Tree, PED-Differenzierung, Review-Cadence-Matrix',
    },
  ],
};

export const TRAINER_REVIEW_SKILL = `
## KI-TRAINER REVIEW-SYSTEM — Wissensbasis

### 1. STARTGEWICHT-KALIBRIERUNG (Bodyweight-Multiplier)

Wenn ein Nutzer einen neuen Trainingsplan bekommt und keine Trainingshistorie fuer eine Uebung hat,
verwende diese BW-Multiplier-Tabelle als Startgewicht-Schaetzung:

| Uebung | Anfaenger m | Fortgeschr. m | Erfahren m | Anfaenger w | Fortgeschr. w | Erfahren w |
|--------|:-----------:|:-------------:|:----------:|:-----------:|:-------------:|:----------:|
| Bankdruecken | 0.30x BW | 0.65x BW | 1.0x BW | 0.15x BW | 0.40x BW | 0.65x BW |
| Kniebeuge | 0.40x BW | 0.80x BW | 1.25x BW | 0.25x BW | 0.55x BW | 0.85x BW |
| Kreuzheben | 0.50x BW | 1.0x BW | 1.5x BW | 0.30x BW | 0.65x BW | 1.0x BW |
| Schulterdruecken | 0.20x BW | 0.45x BW | 0.65x BW | 0.10x BW | 0.25x BW | 0.40x BW |
| Rudern | 0.25x BW | 0.55x BW | 0.85x BW | 0.15x BW | 0.35x BW | 0.55x BW |
| Bizepscurls | 0.10x BW | 0.20x BW | 0.30x BW | 0.05x BW | 0.12x BW | 0.20x BW |
| Trizepsdruecken | 0.10x BW | 0.18x BW | 0.28x BW | 0.05x BW | 0.10x BW | 0.18x BW |
| Lat Pulldown | 0.35x BW | 0.65x BW | 0.90x BW | 0.20x BW | 0.40x BW | 0.60x BW |
| Beinpresse | 0.80x BW | 1.5x BW | 2.2x BW | 0.50x BW | 1.0x BW | 1.5x BW |
| Wadenheben | 0.40x BW | 0.80x BW | 1.2x BW | 0.25x BW | 0.50x BW | 0.80x BW |

Quelle: NSCA (Haff & Triplett 2016), ExRx.net, Rhea 2004 (PMID:15142003)

Erfahrungslevel-Definition:
- Anfaenger: < 6 Monate konsequentes Training
- Fortgeschritten: 6 Monate – 2 Jahre
- Erfahren: 2+ Jahre

### 2. DOUBLE PROGRESSION — Progressions-Logik

Das primaere Progressionsmodell fuer Hypertrophie und Kraft:

**Regel:** Rep-Range festlegen (z.B. 8-12). Wenn der Nutzer in ALLEN Saetzen die Obergrenze
erreicht (z.B. 12 Reps) fuer 2+ aufeinanderfolgende Sessions → Gewicht erhoehen.

| Muskelgruppe | Schritt aufwaerts | Schritt abwaerts |
|-------------|:-----------------:|:----------------:|
| Verbunduebung (Squat, Bench, Deadlift) | +2.5 kg | -5% |
| Isolationsuebung (Curls, Flies) | +1.25 kg oder naechste Hantel | -10% |
| Maschine | +1 Stufe / +2.5 kg | -1 Stufe |

Abwaerts-Kriterium: Nutzer schafft Untergrenze (z.B. 8 Reps) NICHT in >50% der Saetze.

Quelle: Chaves et al. 2024 (PMID:38286426)

### 3. VOLUME LANDMARKS (Sets/Muskelgruppe/Woche)

| Muskelgruppe | MV (Erhalt) | MEV (Minimum) | MAV (Optimal) | MRV (Maximum) |
|-------------|:-----------:|:-------------:|:-------------:|:-------------:|
| Brust | 4 | 8 | 12-18 | 22 |
| Ruecken | 4 | 8 | 14-20 | 24 |
| Schultern | 4 | 6 | 10-16 | 20 |
| Bizeps | 2 | 4 | 8-14 | 18 |
| Trizeps | 2 | 4 | 8-12 | 16 |
| Quads | 4 | 6 | 10-16 | 20 |
| Hamstrings | 2 | 4 | 8-14 | 18 |
| Waden | 2 | 4 | 8-14 | 16 |

- MEV = Minimum Effective Volume (weniger bringt keinen Reiz)
- MAV = Maximum Adaptive Volume (optimaler Bereich)
- MRV = Maximum Recoverable Volume (mehr = Uebertraining)
- Progression: Pro Mesozyklus +1-2 Sets/Muskelgruppe Richtung MAV

Quelle: Israetel (RP, 2019-2024), Pelland et al. 2025 (PMID:41343037), Schoenfeld 2017 (PMID:27433992)

WICHTIG bei PED-Nutzern (Power+ Mode):
- Blast-Phase: MRV ist 25-40% hoeher als bei Naturals
- Cruise-Phase: MRV ~gleich wie Natural
- PCT-Phase: MRV sinkt auf MEV-Niveau → Volume drastisch reduzieren!

### 4. DELOAD-PROTOKOLL

Ein Deload reduziert die Trainingsbelastung systematisch:

| Parameter | Deload-Wert | Normal |
|-----------|:----------:|:------:|
| Volume (Sets) | -40 bis -60% | 100% |
| Intensitaet (Gewicht) | -10 bis -20% | 100% |
| RIR | +3-5 (weiter vom Failure) | RIR 1-3 |
| Dauer | 5-7 Tage | — |
| Frequenz | Beibehalten | — |
| Uebungsauswahl | Beibehalten | — |

Typischer Rhythmus: Alle 4-6 Wochen (Durchschnitt 5.6 +/- 2.3 Wochen, Bell 2024 PMID:38499934)

REGEL: Deload = weniger SAETZE, NICHT weniger Uebungen. Uebungsauswahl und Frequenz bleiben gleich.

### 5. REVIEW-CADENCE-MATRIX (nach Population)

| Population | Mesozyklus | Deload-Rhythmus | KI-Review | Haupt-Trigger |
|-----------|:---------:|:---------------:|:---------:|:--------------|
| Anfaenger (<6 Mon.) | 2-4 Wo. | Alle 3-6 Wo. | Woechentl. Last-Check | Stagnation 2+ Sessions |
| Fortgeschr. Hypertrophie | 4-6 Wo. | Alle 4-6 Wo. | Woechentl. RIR-Trend | RIR-Drift >2 vom Ziel |
| Powerlifting | 2-6 Wo./Block | Nach Intensivierung | Zwischen Bloecken | Bar-Speed sinkt |
| PED Blast | 5-8 Wo. | Alle 6-8 Wo. | Woechentl. Volume | Volume Landmarks hoeher |
| PED Cruise | 4-5 Wo. | Alle 4-6 Wo. | Meso-Grenze | Volume -30-40% vs Blast |
| PED PCT | 3-4 Wo. | Alle 2-3 Wo. | WOECHENTLICH | Kraftverlust >10%, Stimmung |
| Ausdauer | 3-4 Wo. (3:1) | Jede 3.-4. Woche | Woechentl. TSS/Load | Akut:Chronisch >1.5 |
| Senioren/Reha | 4-8 Wo. | Jede 4. Woche | Jede Session RPE | Funktioneller Rueckgang |

### 6. DECISION TREE — Wann welche Anpassung?

Pruefe nach JEDER Session (automatisch, kein User-Input noetig):

1. **Gewichts-Stagnation** (3 Sessions gleiches Gewicht bei gleichen Reps)
   → Gelbe Warnung + Buddy-Hinweis: "Dein [Uebung] stagniert, sollen wir anpassen?"

2. **Max-Reps-Pattern** (2+ Sessions Obergrenze in allen Saetzen erreicht)
   → Auto-Progression: Gewicht +2.5/5 kg (oder Buddy-Vorschlag bei Isolation)

3. **Completion Rate < 70%** (weniger als 70% der geplanten Uebungen geschafft)
   → Orange Warnung + Buddy fragt: "Sollen wir den Plan vereinfachen?"

4. **Schlaf < 6h fuer 5+ Tage** (aus sleep_logs)
   → Deload-Empfehlung oder Volume-Reduktion

5. **Joint Pain >= 3/5** (aus session_feedback.joint_pain_rating)
   → Uebung tauschen vorschlagen (biomechanisch aehnliche Alternative)

6. **Missed Sessions > 30%** (Sessions verpasst in einer Woche)
   → Buddy fragt proaktiv nach Gruenden

MESOZYKLUS-REVIEW (alle 4-6 Wochen):
- Volume-Progression analysieren: Sind wir von MEV Richtung MAV?
- Gewichts-Progression pro Uebung: +kg ueber den Zyklus?
- Completion-Trend: Wird der Plan schwieriger? (abnehmende Rate)
- Fatigue-Akkumulation: Deload noetig?

Ergebnis-Optionen (als Vorschlag an den Nutzer):
- "Weiter so" → Naechster Meso mit +1 Satz/Muskelgruppe
- "Deload" → 1 Woche Volume/Last reduzieren (siehe Protokoll oben)
- "Uebung tauschen" → Stagnierte Uebung ersetzen
- "Ziele anpassen" → Nutzer hat sich veraendert
- "Plan komplett ueberarbeiten" → Am Ende eines Makrozyklus (12-16 Wochen)

### 7. PED-PHASEN-SYNCHRONISATION

Wenn der Nutzer im Power+ Mode ist und einen aktiven Substanzzyklus hat:
- Blast-Phase: Laengere Mesozyklen (6-8 Wochen), hoehere MRV-Toleranz
- Cruise-Phase: Standard-Mesozyklen (4-5 Wochen), Volume senken
- PCT-Phase: VERKUERZTE Mesozyklen (3-4 Wochen), haeufigere Deloads
  - Gewicht HALTEN (schwere Lasten signalisieren Muskelerhalt)
  - Volume -30-50%, Isolation zuerst streichen
  - 5-15% Kraftverlust ist NORMAL und TEMPORAER (Muscle Memory, Cumming 2024 PMID:39159314)
  - Stimmung als Proxy fuer hormonelle Erholung ueberwachen

Die KI liest den Zyklus-Status aus den Substanzdaten und passt die review_config automatisch an.
Bei Phasenwechsel (Blast → Cruise, Blast → PCT) wird sofort die Volume-Berechnung angepasst.

### 8. AUTONOMIE-MODELL

Der KI-Trainer arbeitet im Modus: VORSCHLAGEN → ABSEGNEN → DURCHFUEHREN

1. KI analysiert Trainingsdaten (automatisch)
2. KI formuliert konkreten Vorschlag (z.B. "Bankdruecken: 75kg → 80kg, Grund: 3x Obergrenze erreicht")
3. Nutzer bekommt Vorschlag-Dialog:
   - "Annehmen" → KI fuehrt sofort durch (Planaktualisierung)
   - "Anpassen" → Nutzer kann Zielwert aendern
   - "Ablehnen" → Nichts passiert, KI merkt sich das
4. KI darf NIEMALS den Plan ohne Nutzer-Zustimmung aendern

### 9. POST-SESSION-FEEDBACK INTERPRETATION

Wenn der Nutzer nach einer Session Feedback gibt:
- "Zu leicht" → Gewicht +10-20% fuer naechste Session vorschlagen
- "Gut" → Plan beibehalten (idealer Bereich, RIR ~2-3)
- "Hart" → Plan beibehalten, aber beobachten (1-2 weitere Sessions)
- "Kaputt" → Volume pruefen, ggf. Deload vorschlagen

Joint-Pain-Feedback: Wenn Nutzer Gelenkschmerz meldet (Koerperteil + Rating 1-5):
- Rating 1-2: Beobachten, Warmup-Fokus empfehlen
- Rating 3-4: Alternative Uebung vorschlagen
- Rating 5: Uebung sofort streichen, Arztbesuch empfehlen
`;
