# Uebergabe 2026-03-10 — Workout-System Konsolidierung

> **Session-Stand:** Phase A abgeschlossen, deployed auf fudda.de
> **Git:** Commit `cbdd8bb` auf develop, gepusht
> **Version:** v12.65

---

## Was wurde in dieser Session gemacht

### 1. Exercise Catalog v2 Deployment (v12.64 → fudda.de)
- Aus vorheriger Session: 3 DB-Migrationen auf Production angewandt
- 122 Uebungen verifiziert, PostgREST Schema-Cache neu geladen
- Frontend-Build deployed, HTTP 200 verifiziert

### 2. Grundlagen-Analyse Workout-System (5 Phasen)
- **Phase 1:** Code-Analyse — 33 Komponenten, 20 Hooks, 8 DB-Tabellen kartiert
- **Phase 2:** Datenfluss — 4 Erstellungswege identifiziert, KRITISCHEN Bug gefunden
- **Phase 3:** Experten-Review (UX, Architektur, Kraftsport)
- **Phase 4:** Wettbewerbs-Analyse (Strong, Hevy, FitNotes, JEFIT, Gymaholic)
- **Phase 5:** Konzept geschrieben → `docs/KONZEPT_WORKOUT_SYSTEM.md`

### 3. Phase A: Kritische Daten-Fixes (v12.65)

**KRITISCHER BUG GEFIXT:**
Quick-Log Workouts (+ Button, Buddy) waren in Historie, Fortschritt und 1RM-Charts **unsichtbar**, weil `useAllWorkoutHistory()` nach `session_exercises IS NOT NULL` filterte. Quick-Logs befuellten aber nur `exercises[]` (Legacy).

**Geaenderte Dateien:**

| Datei | Aenderung |
|-------|-----------|
| `hooks/useWorkoutHistory.ts` | Filter `.not('session_exercises','is',null)` ENTFERNT. Neue Funktionen: `convertLegacyExercises()` (exported), `normalizeWorkouts()` — konvertiert Legacy-Daten automatisch |
| `hooks/useWorkouts.ts` | `useAddWorkout()` befuellt jetzt IMMER `session_exercises` beim Insert (via `convertLegacyExercises`). Setzt `status: 'completed'` explizit |
| `components/WorkoutHistoryPage.tsx` | Rendert auch Workouts ohne Uebungs-Detail (Fallback-Text). Edit-Button nur wenn Exercises vorhanden |
| `components/AddWorkoutDialog.tsx` | ExercisePicker-Integration (Katalog statt Freitext-Inputs). Muskel-Badges, Sets/Reps/Weight pro Uebung, Katalog-Suche |
| `docs/KONZEPT_WORKOUT_SYSTEM.md` | NEU: Vollstaendiges Konzept-Dokument (5-Phasen-Analyse) |
| `docs/FORTSCHRITT.md` | v12.64 Deployment-Vermerk ergaenzt |

**Buddy-Action `log_workout`:** Automatisch mit gefixt — nutzt `useAddWorkout()` intern.

---

## Was NICHT gemacht wurde (naechste Schritte)

### Aus dem Konzept (`docs/KONZEPT_WORKOUT_SYSTEM.md`):

| Phase | Beschreibung | Status |
|-------|-------------|--------|
| **A** | Daten-Fixes (History-Query, session_exercises) | ✅ ERLEDIGT |
| **B** | "Freies Training" (ActiveWorkoutPage ohne Plan) | OFFEN |
| **B.3** | **Plan aus einzelnem Training erstellen** (User-Wunsch!) | OFFEN |
| **C** | PREVIOUS-Spalte + Auto-Fill (letzte Werte inline) | OFFEN |
| **D** | Set-Tags, Adaptive Felder, Multi-Select, Summary | OFFEN |
| **E** | AddWorkoutDialog weitere Verbesserungen | OFFEN |

### User-Wunsch (waehrend Session erhalten):
> "man aus einzelnen Trainings auch einen Plan erstellen koennen soll"
→ Phase B.3: Nach freiem Training Dialog "Dieses Workout als Plan speichern?"
→ Erstellt `training_plan` + `training_plan_days` aus Session-Daten

---

## Technische Details fuer Weiterarbeit

### Architektur-Kernfakten
- **EINE einzige `workouts`-Tabelle** — kein separates `workout_sessions`
- **Status-Lifecycle:** `null` → `completed` (Quick-Log), `in_progress` → `completed` (Plan-Session)
- **Zwei Datenformate:** `exercises[]` (Legacy) + `session_exercises[]` (Detail) — BEIDE werden jetzt normalisiert
- **4 Erstellungswege:** Manual (+), Plan-Session, Buddy/KI, Resume

### Wichtige Funktionen (neu)
```typescript
// In useWorkoutHistory.ts — konvertiert Legacy → Detail-Format
export function convertLegacyExercises(exercises: ExerciseSet[]): WorkoutExerciseResult[]

// In useWorkoutHistory.ts — normalisiert alle Workouts beim Laden
function normalizeWorkouts(workouts: Workout[]): Workout[]
```

### Build-Stand
- 0 TS-Fehler
- 113 PWA Precache Entries
- fudda.de deployed + HTTP 200

### Dateien auf Disk (nicht committed)
```
?? docs/UX_KONZEPT_UEBUNGSDATENBANK.md   # Aelteres Konzept-Doc
?? nul                                     # Kann geloescht werden
?? public/icons/icon-1024.png              # App-Icon
```

---

## Offene Fragen

1. **Phase B Reihenfolge:** Zuerst "Freies Training" oder zuerst "Plan aus Training erstellen"?
2. **Alte Quick-Logs in DB:** Sollen bestehende Workouts (die nur `exercises[]` haben) per Migration nachtraeglich `session_exercises` befuellt bekommen? (Aktuell: Runtime-Konvertierung beim Laden)
3. **AddWorkoutDialog vs. Freies Training:** Soll der Quick-Log Dialog langfristig durch "Freies Training" (ActiveWorkoutPage ohne Plan) ersetzt werden, oder beides parallel existieren?
