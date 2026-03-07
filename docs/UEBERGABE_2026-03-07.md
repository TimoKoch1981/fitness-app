# Uebergabe 2026-03-07

> Session-Zusammenfassung — wird nach jedem Schritt aktualisiert.
> Bei Absturz: Hier weiterlesen!

---

## Ziel dieser Session

1. Deploy von v12.57 + v12.58 (KI-Trainer Review-System) auf Production (fudda.de) ✅
2. Block B CalibrationWizard implementieren ✅

## Checkliste Deploy (Phase 1)

| # | Aufgabe | Status | Details |
|---|---------|--------|---------|
| 1 | Commit + Push | ✅ ERLEDIGT | Bereits vor Session erledigt (d73392d) |
| 2 | DB-Migration deployen | ✅ ERLEDIGT | 4 ALTER TABLEs OK, Index-Fix (plan_id→user_id), alle Spalten verifiziert |
| 3 | Frontend bauen + deployen | ✅ ERLEDIGT | Build OK (94 PWA entries), fudda.de-Check OK, scp deployed |
| 4 | PostgREST Schema-Reload | ✅ ERLEDIGT | docker restart fitbuddy-rest-1, fudda.de HTTP 200 |

## Block B CalibrationWizard (Phase 2) ✅

| # | Aufgabe | Status | Details |
|---|---------|--------|---------|
| 1 | i18n-Keys | ✅ ERLEDIGT | 31 Keys in de.ts + en.ts + 15 weitere Sprachen (calibration namespace) |
| 2 | useCalibration.ts | ✅ ERLEDIGT | BW-Multiplier (10 Uebungen × 3 Level × 2 Gender), Fuzzy-Match, Smart Presets |
| 3 | useTrainingPlans.ts | ✅ ERLEDIGT | Neue Mutation useUpdateTrainingPlanCalibration (plan + day updates) |
| 4 | CalibrationWizard.tsx | ✅ ERLEDIGT | 3-Screen Dialog (Experience → Weights → Settings), Bottom-Sheet |
| 5 | TrainingPlanView.tsx | ✅ ERLEDIGT | Auto-Trigger (ai_supervised && !calibration_done) + Amber-Button |
| 6 | Build | ✅ ERLEDIGT | 0 TS-Fehler, 94 PWA entries |
| 7 | Deploy | ✅ ERLEDIGT | fudda.de HTTP 200 |

## Neue/Geaenderte Dateien

| Datei | Aktion | Inhalt |
|-------|--------|--------|
| `src/features/workouts/hooks/useCalibration.ts` | NEU | BW-Multiplier-Tabelle, matchExerciseToReference, calculateSuggestedWeight, calibrateAllExercises, getSmartPreset, getDefaultReviewTriggers |
| `src/features/workouts/components/CalibrationWizard.tsx` | NEU | 3-Screen Wizard (Experience/Weights/Settings), speichert review_config + ai_supervised + exercise weights |
| `src/features/workouts/hooks/useTrainingPlans.ts` | ERWEITERT | useUpdateTrainingPlanCalibration Mutation |
| `src/features/workouts/components/TrainingPlanView.tsx` | ERWEITERT | CalibrationWizard Import, Auto-Trigger, Amber-Badge Button |
| `src/i18n/de.ts` | ERWEITERT | calibration: { ... } (31 Keys) |
| `src/i18n/en.ts` | ERWEITERT | calibration: { ... } (31 Keys, EN) |
| `src/i18n/{ar,es,fa,...,zh}.ts` | ERWEITERT | calibration: { ... } (EN Fallback) |
| `supabase/migrations/20260306000001_ai_trainer_review.sql` | GEFIXT | Index plan_id → user_id |

## Was steht als naechstes an?

### Block B (Rest):
- **RIR-Feedback nach erstem Satz** — Nur in allererster Session, "Zu leicht / Passt / Zu schwer"
- **Auto-Kalibrierung** — Max-Reps-Pattern Erkennung (Obergrenze 2+ Sessions → Auto: +2.5/5kg)

### Block C (Rest):
- **Post-Session-Analyse Hook** — Plateau-Erkennung, RPE-Drift, Volume/Muskelgruppe
- **Early Triggers** — Plateau, Pain, Sleep, Missed Sessions
- **Mesozyklus-Review** — Buddy-Nachricht am Review-Tag
- **PED-Phasen-Sync** — CycleWidget → review_config

### Block D (Rest):
- **Buddy-Nachfrage** — "Soll ich mittracken?" bei manuellen Plaenen
- **Review-Dialog** — Vorschlag-Ansicht (Annehmen/Anpassen/Ablehnen)

## Git-Status

- Branch: develop
- Letzter Commit: noch zu committen (Block B CalibrationWizard)
- Uncommitted: useCalibration.ts, CalibrationWizard.tsx, useTrainingPlans.ts, TrainingPlanView.tsx, 17x i18n, Migration-Fix

---

*Aktualisiert: 2026-03-07, Block B CalibrationWizard implementiert + deployed*
