# Uebergabe 2026-03-11 — v12.76: PlanWizard Fixes + L/R Tracking + Smart Defaults

> **Stand:** 2026-03-11, v12.76 deployed auf fudda.de
> **Kein Git-Commit** (OneDrive-Write-Workaround, muss noch committed werden)
> **Basis:** v12.75 (LLM-Optimierung Analyse + Konzept)

---

## 1. AKTUELLER STATUS — WAS HEUTE GEMACHT WURDE

### Session 1: PlanWizard Bug-Fixes (3 Fixes)

**Fix 1: Buddy Auto-Nachricht entfernt**
- `PlanWizardDialog.tsx`: `handleBuddyHelp()` sendet keine automatische Nachricht mehr
- Vorher: Buddy startete sofort mit "Hilf mir meinen Trainingsplan zu optimieren..."
- Nachher: Buddy oeffnet leer, User tippt eigene Anfrage

**Fix 2: [ACTION_REQUEST] im Chat ausgeblendet**
- `ChatMessage.tsx`: `stripActionBlockFromDisplay()` strippt jetzt auch `[ACTION_REQUEST]...[/ACTION_REQUEST]` Bloecke
- Vorher: Waehrend Streaming waren JSON/ACTION_REQUEST Bloecke sichtbar
- Nachher: Beide Formate (\x60\x60\x60ACTION + [ACTION_REQUEST]) werden immer ausgeblendet
- Streaming-Fallback fuer unvollstaendige Bloecke

**Fix 3: Day Count Header in PlanWizard Step 2**
- `PlanWizardExerciseStep.tsx`: Neuer Header ueber Day-Tabs
- Zeigt z.B. "3 Trainingstage" + "Unterkörper A · Oberkörper A · Unterkörper B"
- Teal-Badge + Grauer Untertitel

### Session 2: Unilaterale Uebungen — L/R Set-Tracking

**Problem:** Uebungen wie Bulgarian Split Squat, Landmine Press, Kabelzug Trizeps zeigten nur eine Spalte fuer Wiederholungen, obwohl `is_unilateral` im Katalog korrekt gesetzt war.

**Loesung:** Sets werden im Datenmodell verdoppelt (L + R pro logischem Satz).

| Datei | Aenderung |
|-------|-----------|
| `types/health.ts` | `SetSide` Typ + `side?: SetSide` auf SetResult |
| `ActiveWorkoutContext.tsx` | `buildExercisesFromPlan()` verdoppelt unilaterale Sets |
| `ActiveWorkoutPage.tsx` | Uebergibt `catalog` an `startSession()` |
| `SetBySetTracker.tsx` | "Satz 2 (L)" / "Satz 2 (R)" mit Farbkodierung (Indigo=L, Lila=R) |
| `ExerciseOverviewTracker.tsx` | Spalten "1L", "1R", "2L", "2R" + farbige Dots |
| `WorkoutSummary.tsx` | L/R Labels bei Sets mit `side`-Feld |

- Kein DB-Migration noetig (lebt im JSONB)
- Rueckwaertskompatibel (alte Workouts ohne `side` = bilateral)
- 3 logische Saetze → 6 physische Sets: L1, R1, L2, R2, L3, R3

### Session 3: Smarte Startgewichte + Cross-Plan Memory + Isometric Fix

**Problem:** Beim Starten eines Workouts kamen teils seltsame Startgewichte raus:
- Uebungen ohne Plan-Gewicht → leeres Feld
- Isometrische Uebungen (Plank, Dead Hang) → Gewicht/Wdh statt Sekunden
- `lastResults` wurde geholt aber nie genutzt
- Wechsel zwischen Plaenen verlor vorherige Gewichte

**Loesung:** 4-stufige Priority Chain + Smart Defaults + Isometric-Erkennung

| Prioritaet | Quelle | Beispiel |
|------------|--------|----------|
| 1 (hoechste) | Plan-Wert | PlanExercise.weight_kg = 50 |
| 2 | Cross-Plan Previous | Letztes echtes Gewicht des Users fuer diese Uebung |
| 3 | Smart Defaults | Basierend auf Equipment/Difficulty/Body Region |
| 4 (niedrigste) | Fallback | undefined / "10" (bisheriges Verhalten) |

**Neue Datei: `suggestExerciseDefaults.ts`** (~130 Zeilen)
- Erkennt Equipment: Langhantel (20kg), Kurzhantel (8kg), Kabelzug (10-15kg), Maschine (20-30kg)
- Skaliert nach Difficulty: beginner ×1, intermediate ×1.5, advanced ×2
- Bodyweight-Uebungen: weight=0 (Dips, Pull-Ups, Push-Ups)
- Isometrisch: duration-based, kein Gewicht (Plank 30s, Dead Hang 20s)

**Geaenderte Dateien:**

| Datei | Aenderung |
|-------|-----------|
| `suggestExerciseDefaults.ts` | **NEU** — Smart Defaults Pure Function |
| `suggestRestTimes.ts` | `export` auf COMPOUND_PATTERNS, ISOMETRIC_PATTERNS, detectCategory |
| `ActiveWorkoutContext.tsx` | `buildExercisesFromPlan()` mit crossPlanData + Priority Chain + Isometric |
| `ActiveWorkoutPage.tsx` | Cross-Plan Lookup Map (useRecentCompletedWorkouts + useMemo) |
| `ExerciseTracker.tsx` | Isometric-Erkennung fuer Timer-Display statt Gewicht |

---

## 2. OFFENE TASKS / ZU TESTEN

### Sofort testen auf fudda.de:
| # | Test | Erwartung |
|---|------|-----------|
| 1 | Neues Workout starten mit Bulgarian Split Squat | 6 Sets (3L + 3R), Farbkodierung |
| 2 | Neues Workout mit Plank/Dead Hang | Timer/Sekunden statt Gewicht |
| 3 | Uebung ohne Plan-Gewicht (z.B. Hip Thrust) | Smart Default statt leeres Feld |
| 4 | Uebung in neuem Plan, die vorher schon trainiert wurde | Letzte echte Werte uebernommen |
| 5 | PlanWizard: Buddy docken | Kein Auto-Message, leerer Chat |
| 6 | Buddy-Chat: ACTION_REQUEST nicht sichtbar | Waehrend Streaming ausgeblendet |

### Noch nicht committed:
- **WICHTIG:** Alle Aenderungen sind nur deployed, aber nicht git-committed!
- Naechster Schritt: `git add` + `git commit` + `git push` auf develop
- 11 geaenderte/neue Dateien seit letztem Commit

### Spaeter / Offen:
- LLM-Optimierung Phase 1-5 (Konzept in docs/KONZEPT_LLM_OPTIMIERUNG.md)
- Progressive Overload Charts koennen jetzt L/R separat tracken
- Default-Gewichte koennten User-spezifisch kalibriert werden (nach erstem Workout)

---

## 3. GEAENDERTE DATEIEN (komplett)

```
# PlanWizard Fixes
src/features/workouts/components/PlanWizardDialog.tsx         → handleBuddyHelp ohne Auto-Message
src/features/buddy/components/ChatMessage.tsx                  → [ACTION_REQUEST] Stripping
src/features/workouts/components/PlanWizardExerciseStep.tsx    → Day Count Header

# L/R Tracking
src/types/health.ts                                            → SetSide Typ + side auf SetResult
src/features/workouts/context/ActiveWorkoutContext.tsx          → buildExercisesFromPlan L/R + Priority Chain + Isometric
src/features/workouts/components/ActiveWorkoutPage.tsx          → catalog + crossPlanLookup
src/features/workouts/components/SetBySetTracker.tsx            → L/R Labels + Farbkodierung
src/features/workouts/components/ExerciseOverviewTracker.tsx    → L/R in Tabelle + Dots
src/features/workouts/components/WorkoutSummary.tsx             → L/R Set-Labels

# Smart Defaults + Isometric Fix
src/features/workouts/utils/suggestExerciseDefaults.ts         → NEU: Smart Defaults
src/features/workouts/utils/suggestRestTimes.ts                → export Patterns + detectCategory
src/features/workouts/components/ExerciseTracker.tsx            → Isometric → Timer
```

---

## 4. PRODUCTION (fudda.de)

- **Version:** v12.76 deployed
- **Docker:** 11 Container (alle running)
- **Build:** 111 PWA Precache Entries, 0 TS-Fehler
- **SSH:** `ssh -i "C:/Users/test/.ssh/id_ed25519" root@46.225.228.12`
- **Deploy:** `rm -rf assets/* && scp dist/* → /opt/fitbuddy/frontend/`

---

## 5. TECHNISCHE DETAILS

### Priority Chain (buildExercisesFromPlan)
```
Plan-Wert (PlanExercise.weight_kg)
    ↓ falls undefined
Cross-Plan Previous (Map<exercise_id|name, WorkoutExerciseResult>)
    ↓ falls undefined
Smart Defaults (suggestExerciseDefaults basierend auf Katalog)
    ↓ falls undefined
Fallback (undefined / "10")
```

### Smart Defaults Logik
```
Isometrisch (Plank, Dead Hang, Wall Sit)  → duration, kein Gewicht
Bodyweight (Dips, Pull-Ups, Push-Ups)      → weight=0, 8-12 Wdh
Langhantel compound                         → 20kg (leere Stange) × difficulty
Kurzhantel                                  → 6-10kg × difficulty
Kabelzug                                    → 10-15kg × difficulty
Maschine                                    → 20-30kg × difficulty
Kettlebell                                  → 12kg × difficulty
Band                                        → kein Gewicht, 12-15 Wdh
Unbekannt                                   → undefined / "10"
```

### Cross-Plan Lookup
- Nutzt `useRecentCompletedWorkouts()` (30 letzte Workouts, 5min Cache)
- Map nach exercise_id UND name.toLowerCase() (beides als Key)
- Erster Non-Warmup completed Set als Referenz
- Wird bei Session-Start einmal uebergeben, nicht bei jedem Set

### Isometric Detection
- Patterns: Plank, Hold/Halten, Wall Sit, L-Sit, Dead Hang, Isometr*
- ExerciseTracker routet zu Timer-Ansicht statt Gewicht/Wdh
- buildExercisesFromPlan setzt target_duration_minutes statt target_weight_kg
