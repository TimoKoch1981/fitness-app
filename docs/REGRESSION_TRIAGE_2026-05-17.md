# Regression-Triage 2026-05-17 (Portion A)

**Branch:** `investigate/regression-2026-05-17` (off `feat/telemetry-cleanup` @ 883fb02)
**Scope:** Triage der 4 P0-Regressionen B22-B25 aus Timos Test 2026-05-17.
**Status:** Read-only Triage. Kein Code-Change. Hand-off an Portion B (Test-Harness).

Methodik pro Bug: betroffene Files, juenste Commits (`git log -p --since=2026-05-01`),
Verdacht. Wenn `--follow` keine relevanten Mai-Commits zeigt, weiten wir den
Korridor und schauen auf Logik-Aenderungen jenseits der jeweiligen Datei.

---

## B22 — Multi-Day-Plan: nur Tag 1 startbar

**Symptom (Timo-O-Ton):**
> Bei mehrtaegigen Trainings gibt es immer nur fuer den ersten Tag den Start Button, die anderen kann man nicht starten

### Files

- [src/features/workouts/components/DayCard.tsx](src/features/workouts/components/DayCard.tsx) — rendert pro Tag den Start-Button (Zeile 153-172)
- [src/features/workouts/components/TrainingPlanList.tsx:343-355](src/features/workouts/components/TrainingPlanList.tsx) — mapped `expandedPlanData.days` zu `<DayCard>`
- [src/features/workouts/hooks/useTrainingPlans.ts:49-74](src/features/workouts/hooks/useTrainingPlans.ts) — `usePlanById` JOINt `training_plan_days(*)`, sortiert nach `day_number`. Sortierung OK.
- [src/features/workouts/hooks/useDraftWorkout.ts:22-44](src/features/workouts/hooks/useDraftWorkout.ts) — `useInProgressWorkout(planDayId)` per Tag, Query-Key korrekt
- [src/features/workouts/components/ActiveWorkoutPage.tsx:213-224](src/features/workouts/components/ActiveWorkoutPage.tsx) — `activePlan.days.find(d => d.id === dayId)`; `useActivePlan` filtert `is_active=true`

### Verdaechtige Commits

| SHA | Subject | Touch DayCard? | Logik-Aenderung? |
|---|---|---|---|
| ac783e9 | v14.28 Stufe 4: Komplett-Cleanup — Teal/Emerald → Studio | ja | nein, nur Farben (`bg-teal-500` → `bg-theme-primary`) |
| 771df1b | v14.29 Telemetrie-Sprint | nein | Wrapper auf Mutations, keine Read-Query-Aenderung |

DayCard wurde im Mai nur farblich geaendert. Keine Strukturaenderung am Start-Button.
`usePlanById` ist seit Maerz unveraendert. Damit ist B22 **vermutlich kein
recent-regression-Bug**, sondern eine lang-bestehende Schwaeche, die jetzt
zum ersten Mal mit mehrtaegigen Plaenen aufgefallen ist.

### Hypothesen (absteigend wahrscheinlich)

1. **H1 — Daten:** Bei Plaenen, die ueber den Wizard erstellt wurden, ist
   `day.exercises = []` fuer Tag 2..n (weil der User die Uebungen nur fuer Tag 1
   eingegeben hat). Dann greift in [DayCard.tsx:153](src/features/workouts/components/DayCard.tsx)
   das Conditional `{day.exercises.length > 0 && (...)}` und der Start-Button
   wird gar nicht gerendert. Das passt 1:1 zum Symptom "nur fuer den ersten Tag
   den Start Button". Verifikation: SELECT auf `training_plan_days` mit
   `jsonb_array_length(exercises)` pro Tag fuer einen betroffenen Plan.
2. **H2 — DOM:** Outer `<button onClick={onToggle}>` ([DayCard.tsx:104](src/features/workouts/components/DayCard.tsx))
   wrapped das Inner `<span role="button" onClick={handleStartWorkout}>`
   ([DayCard.tsx:154](src/features/workouts/components/DayCard.tsx)). Auf einigen Touch-
   Devices wird der Klick auf das Span vom Outer-Button "geschluckt", weil
   `stopPropagation()` im React-Synthetic-Event greift, aber der native
   Touch-Event vorher schon den Outer ausloest. Erklaert "kann man nicht
   starten", aber nicht "nur fuer den ersten Tag" (alle Tage haben dieselbe
   Struktur). Schwach.
3. **H3 — Non-active-Plan:** Wenn der User einen nicht-aktiven Plan oeffnet,
   ist `activePlan` (in ActiveWorkoutPage) ein anderer Plan; `activePlan.days.find(d => d.id === dayId)`
   liefert `undefined` → kein `startSession`. Erklaert nicht "nur fuer den
   ersten Tag", sondern "fuer keinen Tag". Schwach.

**Empfohlene Verifikation in Portion B:** Component-Test mit Mock-Plan
`{ days: [{ exercises: [...] }, { exercises: [] }, { exercises: [...] }] }`
und Erwartung, dass alle drei Days einen Start-Button rendern (Tag 2 sollte
einen Empty-State-Hinweis bekommen oder den Button trotzdem zeigen).

---

## B23 — Gewichte: Anzeige fehlt, Eingabe defekt, Last-Weight-Memory weg

**Symptom (Timo-O-Ton):**
> In den Trainings werden keine gewichte angezeigt, bzw. man kann sie auch nicht eingeben oder aendern und in den Voreinstellung scheint er sich auch nicht jeweils de letzten Gewichte der Uebungen zu merken

Aufteilung in 3 Sub-Bugs:
- **B23a** — Spalte/Input nicht sichtbar
- **B23b** — Spalte sichtbar, aber Input nicht editierbar
- **B23c** — Last-Weight-Memory greift nicht (keine Vorbefuellung)

### Files

- [src/features/workouts/components/ExerciseOverviewTracker.tsx:60](src/features/workouts/components/ExerciseOverviewTracker.tsx) — `noWeight` Berechnung
- [src/features/workouts/components/SetBySetTracker.tsx:74](src/features/workouts/components/SetBySetTracker.tsx) — gleiche `noWeight` Berechnung
- [src/features/workouts/context/ActiveWorkoutContext.tsx:152-159](src/features/workouts/context/ActiveWorkoutContext.tsx) — `buildExercisesFromPlan` Priority-Chain fuer `targetWeightKg`
- [src/features/workouts/utils/suggestExerciseDefaults.ts](src/features/workouts/utils/suggestExerciseDefaults.ts) — Smart-Defaults pro Uebungsname (Plank/Side-Plank etc. liefern `weight_kg: undefined`)
- [src/features/workouts/hooks/useLastExerciseData.ts](src/features/workouts/hooks/useLastExerciseData.ts) — Recent-Workouts fuer Cross-Plan-Memory
- [src/features/workouts/components/ActiveWorkoutPage.tsx:69-83](src/features/workouts/components/ActiveWorkoutPage.tsx) — `crossPlanLookup` Map-Build

### Verdaechtige Commits

| SHA | Subject | Was wurde geaendert? |
|---|---|---|
| 993d554 | UX-Polish Tranche 1 (UX2 RPE-Picker + UX10 PlateCalc) | additiv: RpePicker nach Strength-Saetzen + PlateCalculator unter Target-Card. Keine Aenderung an Weight-Rendering. |
| 771df1b | v14.29 Telemetrie | withTelemetry-Wrapper, keine Read-Query-Aenderung. `useRecentCompletedWorkouts` unveraendert. |
| ac783e9 | v14.28 Stufe 4 | Color-Sweep. |

Diff Tranche 1 / ActiveWorkoutContext: Action `EDIT_LOGGED_SET` bekam optionales
`rpe?: number` Feld. Spread im Reducer ist konditional (`...(action.rpe != null && { rpe })`).
Keine Logik-Aenderung am Weight-Pfad. Diff Tranche 1 / Trackers: additiv,
`{isDone && !isCardio && !isSkipped && (...RpePicker)}` Block hinten angehangen.

### Hypothesen

**B23a/b — Spalte fehlt (gemeinsame Ursache):**
[ExerciseOverviewTracker.tsx:60](src/features/workouts/components/ExerciseOverviewTracker.tsx) und
[SetBySetTracker.tsx:74](src/features/workouts/components/SetBySetTracker.tsx):
```ts
const noWeight = !isCardio && exercise.sets.every(s => s.target_weight_kg == null);
```
Wenn `every()` true ist, wird die Weight-Spalte **komplett ausgeblendet** (SetBySetTracker
Layout-Switch in [Zeile 412](src/features/workouts/components/SetBySetTracker.tsx) auf
`grid-cols-1 max-w-xs mx-auto` ohne Gewicht-Input).

`target_weight_kg` kommt aus [ActiveWorkoutContext.tsx:156](src/features/workouts/context/ActiveWorkoutContext.tsx):
```ts
targetWeightKg = pe.weight_kg ?? prevSet?.actual_weight_kg ?? defaults.weight_kg;
```
Drei-stufige Fallback-Kette:
1. `pe.weight_kg` — kommt aus der Plan-DB. Bei manuell erstellten Plaenen
   ueber den Wizard oft `null` (User uebersprungen).
2. `prevSet?.actual_weight_kg` — aus `crossPlanLookup`. Bei Test-Usern ohne
   vorherige Workouts: `undefined`.
3. `defaults.weight_kg` — aus [suggestExerciseDefaults.ts](src/features/workouts/utils/suggestExerciseDefaults.ts).
   Fuer viele Patterns (Plank, Side-Plank, generischer Fallback Zeile 167+180):
   `weight_kg: undefined`.

**Wenn alle drei undefined sind → `target_weight_kg = undefined` fuer ALLE Saetze
→ `noWeight = true` → Spalte/Input verschwindet komplett.**

Das ist der Block-Bug. Tritt zuverlaessig auf bei:
- Neuen Test-Usern, die einen Plan via Wizard erstellen ohne Gewichte einzutragen
- Bei Eigenuebungen oder Uebungen ausserhalb des Catalogs

Das ist **vermutlich keine recent regression**, sondern long-standing — aber
jetzt sichtbar, weil Timo mit echten Test-Usern getestet hat.

**B23c — Last-Weight-Memory:**
[crossPlanLookup](src/features/workouts/components/ActiveWorkoutPage.tsx) wird
aus `useRecentCompletedWorkouts()` gebaut, die `.neq('status', 'in_progress')`
filtert. Bei Test-Usern ohne completed Workouts → Map ist leer → kein prevSet
→ keine Vorbefuellung. Konsistent mit "merkt sich auch nicht die letzten Gewichte".

Falls der User schon Workouts hat: `useRecentCompletedWorkouts` ist unveraendert
seit Maerz. Daher entweder Daten-Issue oder ein 4. Faktor (z. B. catalog-Lookup
faengt das Exercise nicht ein → name-key matcht nicht).

### Empfohlene Verifikation in Portion B

Reducer-Test:
```ts
// given: planDay mit ['Bench Press'] ohne weight_kg, leeres crossPlanData
// when: START_SESSION dispatched
// then: state.exercises[0].sets.every(s => s.target_weight_kg != null)
//       (target sollte einen sinnvollen Default haben, NICHT undefined)
```

Component-Test:
```ts
// given: exercise mit target_weight_kg=80 fuer alle Saetze
// when: ExerciseOverviewTracker rendert
// then: weight-input ist sichtbar mit placeholder/value 80
// then: noWeight === false
```

---

## B24 — Videos: Button fehlt oder Wiedergabe defekt

**Symptom (Timo-O-Ton):**
> Video funktionieren entweder nicht oder der Videobutton wird gar nicht erst mehr angezeigt

### Files

- [src/features/workouts/components/ExerciseTracker.tsx:87](src/features/workouts/components/ExerciseTracker.tsx) — `hasVideo = catalogEntry && (catalogEntry.video_url_de || catalogEntry.video_url_en)`
- [src/features/workouts/components/ExerciseTracker.tsx:173-181](src/features/workouts/components/ExerciseTracker.tsx) — Conditional-Render `<Video />` lucide-Icon (red-400)
- [src/features/workouts/components/ExerciseVideoModal.tsx:16-31](src/features/workouts/components/ExerciseVideoModal.tsx) — `toEmbedUrl` YouTube-Parser, baut youtube-nocookie/embed/...
- [src/features/workouts/hooks/useExerciseCatalog.ts:130-165](src/features/workouts/hooks/useExerciseCatalog.ts) — `findExerciseInCatalog` (exact/alias/partial)
- DB: [supabase/migrations/20260222000002_exercise_catalog_seed.sql](supabase/migrations/20260222000002_exercise_catalog_seed.sql) — 70 https-URLs gesetzt

### Verdaechtige Commits

`git log --follow ExerciseTracker.tsx` und `ExerciseVideoModal.tsx` zeigt im Mai
nur ac783e9 (Farb-Cleanup). Keine Logik-Aenderung an `hasVideo` oder Modal.

### Hypothesen

1. **H1 (am wahrscheinlichsten) — Catalog-Lookup faellt:** `findExerciseInCatalog`
   versucht exact → alias → partial. Wenn der User-Plan eine Uebung mit Namen
   "Bankdruecken" hat aber der Catalog "Bench Press" mit Alias "Bankdrücken"
   (Umlaut!), schlaegt der case-insensitive Match wegen Encoding fehl. `catalogEntry = null`
   → `hasVideo = false` → **kein Button gerendert**. Konsistent mit "Videobutton
   wird gar nicht angezeigt".
2. **H2 — `video_url` fehlt im Catalog-Row:** Nur 70 von ~150+ Catalog-Eintraegen
   haben URLs (siehe Migrations-Grep). Fuer alles ohne URL → kein Button.
3. **H3 — YouTube-Embed blockiert:** Modal oeffnet sich, iframe laedt nicht
   (CSP / Network). Erklaert "Video funktioniert nicht", aber Button waere
   sichtbar. Wenn beide Symptome auftreten, ist das Hybrid.

### Empfohlene Verifikation

- Browser-Console im Workout: `document.querySelectorAll('[title*="Video"]').length`
  + `[...document.querySelectorAll('.text-red-400')].map(e => e.parentElement?.outerHTML)`
- DB-Query: `SELECT name, video_url_de IS NULL AS de_null, video_url_en IS NULL AS en_null FROM exercise_catalog ORDER BY name;`
- Catalog-Lookup-Test fuer Plan-Exercise-Names der betroffenen Test-User

---

## B25 — Workout-Theme: blaue Schrift auf schwarzem Grund

**Symptom (Timo-O-Ton):**
> das Farbschema im Traningsmodus (Blaue Schrift auf schwarzen Grund ist schwer lesbar

### Files (KONKRET — Root-Cause gefunden)

- [src/features/workouts/components/ActiveWorkoutPage.tsx:482](src/features/workouts/components/ActiveWorkoutPage.tsx) — Inline Set-Timer Panel: `bg-gray-800 rounded-2xl ...`
- [src/features/workouts/components/ActiveWorkoutPage.tsx:528](src/features/workouts/components/ActiveWorkoutPage.tsx) — Rest-Timer Panel: `bg-gray-800 rounded-2xl ...`
- Innerhalb beider Panels: `text-theme-primary` (Studio-Indigo `#3D4FB8`) und
  `bg-theme-primary` Progress-Bar
- 16 weitere `text-indigo-*` / `text-blue-*` / `bg-indigo-*` / `bg-blue-*` Hardcodes
  in [SetBySetTracker.tsx](src/features/workouts/components/SetBySetTracker.tsx)
  (Zeile 282, 317, 376-378, 525-527) und
  [ExerciseOverviewTracker.tsx](src/features/workouts/components/ExerciseOverviewTracker.tsx)
  (Zeile 172-180, 206, 233, 237)

### Verdaechtige Commits

| SHA | Subject | Effekt |
|---|---|---|
| ac783e9 | v14.28 Stufe 4: Teal/Emerald → Studio | Sweep nur fuer **teal/emerald**. `text-blue-*` und `text-indigo-*` blieben unangetastet. Damit hatte der Sweep blinde Flecken. |
| (v14.28 Stufe 3) | Theme-Toggle + Power Console | Aktivierte das `data-surface-mode="console"` System mit Charcoal-BG (`#0B0D0F`). Doku in MEMORY.md. Aber Active-Workout-Komponenten wurden nicht auf Tokens umgestellt. |
| (UX-Polish Tranche 1) | RPE-Picker + L/R-Tracking | Indigo+Purple Klassen fuer L/R-Seiten-Indikatoren neu eingebaut. |

### Hypothese (sehr stark)

**Zwei Pfade, beide produzieren das Symptom:**

**Pfad 1 (Studio Mode, default):** Die Timer-Panels haben `bg-gray-800` fest
verdrahtet. `text-theme-primary` resolved im Studio-Mode zu `#3D4FB8` (Indigo).
Indigo auf Tailwind Gray-800 (`#1F2937`) liefert ein Kontrast-Verhaeltnis von
~1.8:1 — weit unter WCAG-AA (4.5:1). Genau das "blaue Schrift auf schwarzen
Grund" was Timo sieht — auch ohne Auto-Switch.

**Pfad 2 (Console Mode, wenn der Test-User `auto_switch_workout_theme` aktiviert
hat):** Das ganze Page-BG ist Charcoal `#0B0D0F`. Aber die hardcoded
`text-blue-500`/`text-indigo-700`/`bg-blue-50` etc. in den Trackern bleiben
Studio-Indigo bzw. liefern hellblaue Pastell-BGs mit dunkler Indigo-Schrift —
fuer Console-User unlesbar.

**Diagnose:** v14.28 Stufe 4 hat nur Teal/Emerald migriert, NICHT Blue/Indigo.
Active-Workout-spezifische Komponenten haben dadurch einen unvollstaendigen
Token-Sweep. Der Prompt-Verfasser hat das exakt richtig vermutet.

### Empfohlene Verifikation

Component-Test:
```ts
// given: ActiveWorkoutPage mit state.phase='rest' und setReady=false
// when: rendered (Studio-Default-Mode)
// then: das Rest-Timer-Panel hat KEINE `bg-gray-800`-Klasse OR
//        die Zahl darin hat eine Klasse mit gepruefter Kontrast >= 4.5:1 zu gray-800
// assert: kein `text-blue-*` und kein `text-indigo-*` in den vier Active-Workout-Files
```

Visueller Test (Stufe 5+):
- preview_start + Console-Mode aktivieren → preview_inspect auf jedes Element
  im Tracker, compute color + bg, ratio.

---

## Priorisierungs-Empfehlung

Bewertung nach `User-Impact × Fix-Aufwand`:

| Bug | Impact | Fix-Aufwand | Empfehlung |
|---|---|---|---|
| **B23** Gewichte | **Block-Bug** — verhindert Kern-Feature (Saetze tracken) fuer Test-User komplett | Mittel — Default-Logik in `buildExercisesFromPlan` oder `noWeight`-Check ueberarbeiten | **Portion C (1.)** |
| **B25** Theme | Sichtbar in JEDER Session, Timer komplett unleserlich | Niedrig — `bg-gray-800`-Panels auf Token, ein paar `text-blue-*` Sweeps | **Portion D (2.)** |
| **B22** Multi-Day | Power-User-Feature blockiert, Workaround via Tag 1 + Switch existiert | Mittel — Empty-State fuer Days mit `exercises=[]` + Day-Lookup ueber Plans hinweg | **Portion E (3.)** |
| **B24** Videos | Komfort-Feature, kein Blocker fuer Workout | Mittel-Hoch — Catalog-Encoding, evtl. Daten-Migration | **Portion F (4.)** |

Diese Reihenfolge deckt sich mit der Default-Empfehlung im
[REGRESSION_FIX_PROMPT](docs/REGRESSION_FIX_PROMPT_2026-05-17.md) Portion C.

### Querverbindungen

- **B22** und **B23a** koennten denselben Daten-Pattern haben: Wizard-erstellte
  Plaene mit nicht-befuellten Feldern (`exercises=[]` bzw. `weight_kg=null`).
  Wenn Portion B beim Test-Harness-Aufbau einen Plan-Wizard-E2E-Test schreibt,
  kann derselbe Test beide Bugs abbilden.
- **B25** Token-Sweep hat in v14.28 Stufe 4 nur Teal/Emerald erwischt.
  Empfehlung fuer Folgesprint nach diesem (NICHT im Scope hier): kompletter
  Blue/Indigo-Sweep ueber die ganze App.

### Risiko-Notiz

Alle 4 Bugs sind **vermutlich keine "recent regressions"** im engen Sinne
(spezifischer May-2026-Commit hat sie gebrochen) — es sind eher Schwaechen,
die durch v14.28-Token-Migration + neue Test-User-Profile + Mehrtag-Plan-
Erstellung sichtbar wurden. Das aendert nichts an der Dringlichkeit, aber
es heisst: die Tests aus Portion B sollten weniger "verifiziere dass dieser
Commit's Diff korrekt ist" und mehr "fixiere die richtige Erwartung als
Spezifikation" sein.
