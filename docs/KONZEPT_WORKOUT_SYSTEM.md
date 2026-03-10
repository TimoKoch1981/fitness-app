# Konzept: Workout-System Konsolidierung

> **Datum:** 2026-03-10
> **Version:** 1.0
> **Status:** Entwurf — wartet auf Freigabe
> **Basis:** 5-Phasen-Analyse (Code, Live-Test, Experten, Webrecherche, Konzept)

---

## 1. Ist-Analyse: Kritische Befunde

### 1.1 Architektur-Uebersicht

**Eine einzige `workouts`-Tabelle** mit status-basiertem Lifecycle — KEINE separate `workout_sessions`-Tabelle.

**4 Erstellungswege:**

| Weg | Komponente | Datenfelder | Problem |
|-----|-----------|-------------|---------|
| **Manual (+)** | AddWorkoutDialog → useAddWorkout() | `exercises[]` (legacy) | session_exercises = NULL |
| **Plan-Session** | ActiveWorkoutPage → useSaveWorkoutSession() | `session_exercises` (detail) | Funktioniert korrekt |
| **Buddy/KI** | BuddyChat → useActionExecutor('log_workout') | `exercises[]` (legacy) | session_exercises = NULL |
| **Resume** | ActiveWorkoutPage (resume=1) | `session_exercises` (detail) | Funktioniert korrekt |

### 1.2 Kritischer Bug: Daten-Verlust in Historie + Fortschritt

```
useAllWorkoutHistory() Filter:
  .not('session_exercises', 'is', null)  // ← BLOCKIERT Quick-Logs!
```

**Auswirkung:**

| View | Quick-Logs sichtbar? | Plan-Sessions sichtbar? |
|------|---------------------|------------------------|
| Cockpit (Heute) | JA | JA |
| Heute-Tab | JA | JA |
| **Historie-Tab** | **NEIN** ✗ | JA |
| **Fortschritt-Tab** | **NEIN** ✗ | JA |
| **1RM-Charts** | **NEIN** ✗ | JA |
| Periodisierung | JA | JA |

**→ Manuelle Workouts und Buddy-erstellte Workouts sind in Historie + Fortschritt UNSICHTBAR.**

### 1.3 Zwei inkompatible Datenformate

```typescript
// Legacy (Quick-Log): exercises[]
{ name: "Bench Press", sets: 3, reps: 10, weight_kg: 80 }

// Detail (Plan-Session): session_exercises[]
{
  exercise_id: "uuid",
  exercise_name: "Bankdruecken",
  target_sets: 3,
  sets: [
    { set_number: 1, actual_reps: 10, actual_weight_kg: 80, completed: true },
    { set_number: 2, actual_reps: 9, actual_weight_kg: 80, completed: true },
    { set_number: 3, actual_reps: 8, actual_weight_kg: 80, completed: true }
  ]
}
```

### 1.4 Fehlende Features (Vergleich mit Wettbewerb)

| Feature | Strong | Hevy | FitNotes | FitBuddy |
|---------|--------|------|----------|----------|
| "Freies Training" (leere Session) | JA | JA | JA | NEIN |
| PREVIOUS-Spalte (letzte Werte inline) | JA | JA | JA | Nur in ActiveWorkout |
| Auto-Fill letztes Gewicht | JA | JA | JA | Nur in Plan-Session |
| Set-Tags (Normal/Warmup/Failure/Drop) | JA | JA | NEIN | NEIN |
| Adaptive Felder (Kraft vs Cardio) | JA | JA | JA | NEIN |
| Multi-Select in Exercise Picker | JA | JA | NEIN | NEIN |
| Post-Workout Summary mit PRs | JA | JA | JA | Nur Plan-Sessions |
| Uebungs-Historie pro Uebung | JA | JA | JA | Nur Plan-Sessions |
| Rest-Timer nach Set-Completion | JA | JA | JA | Nur Plan-Sessions |

---

## 2. Zielarchitektur

### 2.1 Kern-Entscheidung: Zwei Modi, Ein Interface

```
┌─────────────────────────────────────────────┐
│            "Workout starten"                │
│                                             │
│   ┌──────────────┐   ┌──────────────────┐  │
│   │ Freies       │   │ Plan starten     │  │
│   │ Training     │   │ (Tag waehlen)    │  │
│   │              │   │                  │  │
│   │ Leere Session│   │ Pre-filled       │  │
│   │ + Uebungen   │   │ Uebungen/Sets    │  │
│   └──────┬───────┘   └────────┬─────────┘  │
│          │                    │              │
│          └────────┬───────────┘              │
│                   ▼                          │
│     ┌──────────────────────────┐            │
│     │   ActiveWorkoutPage      │            │
│     │   (einheitliches UI)     │            │
│     │                          │            │
│     │   • Set-by-Set Tracking  │            │
│     │   • PREVIOUS-Spalte      │            │
│     │   • Timer                │            │
│     │   • + Uebung hinzufuegen │            │
│     │   • Auto-Save (Draft)    │            │
│     └──────────────────────────┘            │
│                   │                          │
│                   ▼                          │
│     ┌──────────────────────────┐            │
│     │   Post-Workout Summary   │            │
│     │   • Dauer, Volumen       │            │
│     │   • PRs markiert         │            │
│     │   • KI-Buddy Kommentar   │            │
│     │   • "Als Plan speichern?"│            │
│     └──────────────────────────┘            │
│                   │                          │
│                   ▼                          │
│         workouts-Tabelle                    │
│         session_exercises IMMER gefuellt    │
└─────────────────────────────────────────────┘
```

### 2.2 Quick-Log bleibt als Lightweight-Option

Fuer Nutzer die NUR "30 min Joggen" loggen wollen (ohne Set-Tracking):
- Quick-Log Dialog bleibt erhalten
- ABER: Konvertiert `exercises[]` in `session_exercises[]`-Format beim Speichern
- → Daten erscheinen ueberall (Historie, Fortschritt, Charts)

### 2.3 Datenformat-Normalisierung

**Regel:** `session_exercises` wird IMMER befuellt — auch bei Quick-Logs und Buddy-Workouts.

```typescript
// Bei Quick-Log: Konvertierung exercises[] → session_exercises[]
function convertToSessionExercises(exercises: ExerciseSet[]): WorkoutExerciseResult[] {
  return exercises.map((ex, idx) => ({
    exercise_id: null, // kein Katalog-Link bei manuellem Eintrag
    exercise_name: ex.name,
    target_sets: ex.sets ?? 1,
    sets: Array.from({ length: ex.sets ?? 1 }, (_, i) => ({
      set_number: i + 1,
      target_reps: ex.reps ? String(ex.reps) : undefined,
      target_weight_kg: ex.weight_kg,
      actual_reps: ex.reps,
      actual_weight_kg: ex.weight_kg,
      completed: true,
    })),
  }));
}
```

---

## 3. Implementierungsplan

### Phase A: Daten-Fixes (KRITISCH — sofort)

**A.1 History-Query fixen** (useWorkoutHistory.ts)
- `.not('session_exercises', 'is', null)` Filter entfernen
- Fallback: Wenn `session_exercises` null, `exercises[]` anzeigen
- Beide Formate in WorkoutHistoryPage rendern

**A.2 Quick-Log Normalisierung** (useWorkouts.ts → useAddWorkout)
- Bei Insert: `exercises[]` automatisch in `session_exercises[]` konvertieren
- Backwards-kompatibel: `exercises[]` bleibt als Legacy erhalten

**A.3 Buddy-Action Normalisierung** (useActionExecutor.ts)
- `log_workout` Action: Selbe Konvertierung wie A.2

**Aufwand:** ~2-3 Stunden
**Risiko:** Niedrig (additive Aenderungen, kein Datenbank-Schema-Change)

### Phase B: "Freies Training" (HOCH — naechster Schritt)

**B.1 Workout-Start-Dialog** (neu)
- Zwei Buttons: "Freies Training" + "Plan starten"
- Ersetzt den aktuellen "+" Button auf TrainingPage
- "Freies Training" → ActiveWorkoutPage OHNE planId

**B.2 ActiveWorkoutPage ohne Plan erweitern**
- Wenn kein Plan: Leere Session, nur "+" Button zum Uebungen hinzufuegen
- ExercisePicker oeffnet sich zum Auswaehlen
- User konfiguriert Sets/Reps/Gewicht inline
- Auto-Save (Draft) funktioniert wie bei Plan-Sessions

**B.3 Post-Workout: "Als Plan speichern?"**
- Nach freiem Training: Dialog "Dieses Workout als Plan speichern?"
- Erstellt training_plan + training_plan_days aus Session-Daten

**Aufwand:** ~4-6 Stunden
**Abhaengigkeit:** Phase A muss abgeschlossen sein

### Phase C: PREVIOUS-Spalte + Auto-Fill (HOCH)

**C.1 useLastExerciseData Hook** (neu)
- Findet letzte Ausfuehrung einer Uebung (nach exercise_id oder name)
- Gibt letztes Gewicht + Reps zurueck
- Funktioniert ueber Plan-Grenzen hinweg

**C.2 SetBySetTracker erweitern**
- "PREVIOUS"-Spalte zeigt letzte Werte neben Input-Feldern
- Auto-Fill: Gewicht wird vorausgefuellt, Reps bleiben leer
- Farbige Markierung: Gruen wenn > letztes Mal, Rot wenn <

**C.3 Fuer freies Training**
- Auch ohne Plan: Katalog-Match → letzte Daten anzeigen

**Aufwand:** ~3-4 Stunden

### Phase D: UX-Verbesserungen (MITTEL)

**D.1 Set-Tags**
- Set-Typ: Normal / Aufwaermen / Failure / Drop-Set
- Toggle durch Tap auf Set-Nummer
- Farb-Kodierung: Grau=Aufwaermen, Rot=Failure, Orange=Drop

**D.2 Adaptive Felder**
- Kraft: Gewicht + Wdh
- Cardio: Distanz + Zeit
- Koerpergewicht: Nur Wdh (optional +Gewicht)
- Dauer: Nur Zeit (Plank, Wall Sit)
- exercise_catalog steuert Feld-Typ

**D.3 Multi-Select im ExercisePicker**
- Mehrere Uebungen gleichzeitig waehlen
- "X Uebungen hinzufuegen" Button am unteren Rand
- Reihenfolge beim Hinzufuegen = Auswahl-Reihenfolge

**D.4 Post-Workout Summary verbessern**
- PRs hervorheben (Animation)
- Volumen-Vergleich zum letzten Mal
- KI-Buddy Kommentar ("Starke Leistung!")
- Share-Button (als Bild)

**Aufwand:** ~4-6 Stunden

### Phase E: AddWorkoutDialog modernisieren (MITTEL)

**E.1 ExercisePicker-Integration** (teilweise schon gemacht)
- Uebungen aus Katalog waehlen statt Freitext
- Muskelgruppen-Badges, Compound-Badge
- Favoriten

**E.2 Katalog-verlinkte Felder**
- exercise_id aus Katalog speichern
- Adaptive Felder je nach Uebungstyp

**E.3 Quick-Log → session_exercises Konvertierung**
- Automatisch beim Speichern (Phase A.2)

**Aufwand:** ~2 Stunden (aufbauend auf bereits deployter Version)

---

## 4. Priorisierung

```
SOFORT (Phase A):
├─ A.1 History-Query Fix → Quick-Logs werden sichtbar
├─ A.2 Quick-Log session_exercises Normalisierung
└─ A.3 Buddy-Action Normalisierung

NAECHSTER SPRINT (Phase B+C):
├─ B.1 Workout-Start-Dialog (Freies Training / Plan)
├─ B.2 ActiveWorkoutPage ohne Plan
├─ C.1 useLastExerciseData Hook
└─ C.2 PREVIOUS-Spalte in SetBySetTracker

DANACH (Phase D+E):
├─ D.1 Set-Tags
├─ D.2 Adaptive Felder
├─ D.3 Multi-Select ExercisePicker
├─ D.4 Post-Workout Summary
└─ E.1-E.3 AddWorkoutDialog modernisieren
```

---

## 5. Betroffene Dateien

### Phase A (Daten-Fixes)

| Datei | Aenderung |
|-------|-----------|
| `hooks/useWorkoutHistory.ts` | Filter entfernen, Fallback-Logik |
| `hooks/useWorkouts.ts` | useAddWorkout: session_exercises befuellen |
| `components/WorkoutHistoryPage.tsx` | Beide Formate rendern |
| `lib/ai/actions/executors/*.ts` | log_workout: session_exercises befuellen |
| (optional) `utils/convertExercises.ts` | Konvertierungs-Utility (neu) |

### Phase B (Freies Training)

| Datei | Aenderung |
|-------|-----------|
| `components/WorkoutStartDialog.tsx` | NEU: Dual-Entry-Dialog |
| `pages/TrainingPage.tsx` | "+" Button → WorkoutStartDialog |
| `context/ActiveWorkoutContext.tsx` | planId optional machen |
| `components/ActiveWorkoutPage.tsx` | Ohne Plan: leere Session |
| `components/WorkoutSummary.tsx` | "Als Plan speichern?" Option |
| `hooks/useTrainingPlans.ts` | createPlanFromSession() |

### Phase C (PREVIOUS-Spalte)

| Datei | Aenderung |
|-------|-----------|
| `hooks/useLastExerciseData.ts` | NEU: Letztes Gewicht/Reps finden |
| `components/SetBySetTracker.tsx` | PREVIOUS-Spalte anzeigen |
| `components/ExerciseTracker.tsx` | lastExerciseData laden |

---

## 6. Nicht-Ziele (bewusst ausgeschlossen)

- **DB-Schema-Migration:** Kein neues Tabellendesign noetig
- **Apple Watch Integration:** Erst spaeter (Phase 9+)
- **Social Feed:** KI-Buddy ist der "soziale" Layer
- **Spotify-Aenderungen:** Bestehendes System bleibt
- **Offline-First:** Bereits via Supabase-Cache abgedeckt

---

## 7. Experten-Bewertung

### UX-Trainer (Sarah)
> "Der groesste Fehler ist, dass manuelle Workouts unsichtbar werden. Nutzer verlieren
> Vertrauen wenn ihre Daten verschwinden. Phase A ist absolut kritisch und muss sofort
> passieren. Die PREVIOUS-Spalte ist das Feature das Nutzer am meisten schaetzen werden."

### Systemarchitekt (Dr. Mueller)
> "Die Architektur mit einer einzigen workouts-Tabelle ist grundsaetzlich richtig.
> Das Problem ist rein in der Datennormalisierung — session_exercises MUSS immer
> befuellt werden. Keine Schema-Migration noetig, nur Code-Level Fix."

### Kraftsport-Trainer (Marco)
> "Jeder ernsthafte Trainierende braucht 'Freies Training'. Manchmal geht man ins
> Gym ohne Plan. Das Gym-Feeling ist: Hinsetzen, Uebung waehlen, Saetze tracken.
> Die Plan-Pflicht ist ein Dealbreaker fuer fortgeschrittene Nutzer."

---

## 8. Zusammenfassung

| Problem | Loesung | Prioritaet |
|---------|---------|------------|
| Quick-Logs unsichtbar in Historie | History-Query fixen + Fallback | KRITISCH |
| Quick-Logs ohne session_exercises | Konvertierung bei Insert | KRITISCH |
| Kein "Freies Training" | ActiveWorkoutPage ohne Plan | HOCH |
| Keine PREVIOUS-Spalte | useLastExerciseData + UI | HOCH |
| Keine Set-Tags | Set-Typ-Toggle | MITTEL |
| Keine adaptiven Felder | Katalog-gesteuerte Inputs | MITTEL |
| Kein Multi-Select im Picker | ExercisePicker erweitern | MITTEL |

**Geschaetzter Gesamtaufwand:** ~15-21 Stunden
**Empfohlene Reihenfolge:** A → B → C → D → E
