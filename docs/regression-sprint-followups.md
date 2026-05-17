# Regression-Sprint 2026-05-17 — Followups

Items, die im Verlauf des Sprints aufgefallen sind, aber **bewusst nicht in
diesem Sprint** addressiert wurden (Scope-Disziplin). Jeweils mit dem Bug,
in dessen Triage/Fix sie aufgetaucht sind.

---

## FU-1 (aus Portion D / B25): Tracker-Hardcodes blue/indigo

**Quelle:** B25-Triage (`docs/REGRESSION_TRIAGE_2026-05-17.md`).

Beim Token-Sweep v14.28 Stufe 4 wurden nur Teal/Emerald → theme-primary
migriert. Folgende Hardcodes blieben in den Trackern bestehen und sitzen
ueberwiegend auf weissen Card-Backgrounds (gut lesbar im Studio-Mode):

- `src/features/workouts/components/SetBySetTracker.tsx`:
  - Z. 143: L/R-Active-Set-Marker (`bg-indigo-500 ring-indigo-200` / `bg-purple-500 ring-purple-200`)
  - Z. 145: dimmer-Variant fuer non-current Saetze
  - Z. 282: `text-indigo-600` left / `text-purple-600` right — L/R-Side-Label
  - Z. 317: `bg-indigo-100 text-indigo-700 border-indigo-300` — Tag-Styling
  - Z. 376–378: `bg-indigo-50 border-indigo-100 text-indigo-500/600` — Unilateral-Hinweis-Banner
  - Z. 525–527: `bg-blue-50 border-blue-100 text-blue-400/500` — Info-Hinweis-Banner
- `src/features/workouts/components/ExerciseOverviewTracker.tsx`:
  - Z. 172–180: `bg-blue-50 border-blue-100 text-blue-400/600` — Status-Hinweis
  - Z. 206: `bg-indigo-100 text-indigo-700` — Switch-Button
  - Z. 233 / 237: `bg-indigo-500 / bg-purple-500 / bg-indigo-300 / bg-purple-300` — L/R-Dot-Indikatoren

**Warum hier nicht gefixt:** Diese sitzen alle auf hellen Card-Backgrounds.
Sie tragen NICHT zum aktuellen Bug-Symptom "blaue Schrift auf schwarzen
Grund" bei (das ist der Timer-Panel-Pfad in ActiveWorkoutPage). Sie wuerden
erst stoeren, wenn `auto_switch_workout_theme=true` und Console-Mode aktiv —
dann saessen die Pastell-Banner auf Charcoal-Page-BG, was visuell unruhig
wirkt, aber innerhalb des Banners weiterhin lesbar bleibt.

**Empfohlener Fix-Zeitpunkt:** Naechster Look-&-Feel-Sprint (z. B.
v14.28 Stufe 5 "Gray-Cleanup", erwaehnt in MEMORY). Dort entweder:
- Pastell-Banner auf `bg-theme-surface-2` + `text-theme-ink-2` umstellen
- L/R-Indikatoren als semantische Tokens `--color-side-left` / `--color-side-right`
  einfuehren (Studio: Indigo/Purple, Console: helle Komplementaerfarben)

---

## FU-2 (aus Portion A/B / B22): DOM-Nesting Outer-Button enthaelt Span-Buttons

**Quelle:** DayCard.tsx Triage.

`<button onClick={onToggle}>` umschliesst `<span role="button">` fuer Start,
Pencil und Trash. Das ist invalides HTML und kann auf manchen Mobile-Browsern
zu Click-Event-Kollisionen fuehren. Lang-bestehend, nicht der Fokus dieses
Sprints (B22-Fix adressiert das Conditional `day.exercises.length > 0`).

**Empfohlener Fix-Zeitpunkt:** Generischer A11y-Sprint oder separater
Refactor von DayCard auf flachere Klick-Targets.

---

## FU-3 (aus Portion C / B23): noWeight-Check ist symptom-basiert

**Quelle:** B23-Fix in `ActiveWorkoutContext.tsx`.

Der aktuelle Workaround `?? 0` als Final-Fallback fuer `targetWeightKg` ist
minimal-invasiv, aber das Konzept selbst ist schief: `noWeight` wird auf
Symptom-Ebene (`every(s => s.target_weight_kg == null)`) erkannt, nicht auf
Catalog-Ebene (`equipment_needed.includes('Bodyweight')`).

**Empfohlener Fix-Zeitpunkt:** Wenn der Catalog komplett mit
`equipment_needed`-Tags gepflegt ist. Dann `noWeight = isCardio ||
catalogEntry?.equipment_needed?.includes('Bodyweight')` und der `?? 0`
Workaround kann zurueck.

---
