# Uebergabe 2026-03-06

> Session-Zusammenfassung fuer die naechste Claude-Session

---

## Was wurde heute gemacht?

### v12.57 — Workout-Session UX Bugfixes (committed)
- 3 Bugfixes aus der abgestuerzten Session vom 05.03:
  - `setReady`-Sperre gegen Doppel-Initialisierung
  - Timer-Stop beim Seitenwechsel (ExerciseOverviewTracker)
  - Speichern-Button verhindert Doppelklick (`isSaving` State)
- 10 Dateien in `features/workouts/` betroffen
- Commit: `25aedae`

### v12.58 — KI-Trainer Review-System Block A-D (committed)
- **Block A: Skill + DB-Schema** (KOMPLETT)
  - `src/lib/ai/skills/trainerReview.ts` — Neuer Skill (~4500 Tokens, 15 PMIDs)
    - BW-Multiplier-Tabellen (10 Uebungen × 3 Level × 2 Geschlechter)
    - Double Progression Regeln
    - Volume Landmarks (8 Muskelgruppen, MEV/MAV/MRV)
    - Deload-Protokoll + Review-Cadence-Matrix (8 Populationen)
    - Decision Tree (6 Checks) + PED-Phasen-Sync
  - `src/lib/ai/skills/types.ts` — `'trainerReview'` zu SkillId Union
  - `src/lib/ai/skills/index.ts` — Import, SKILL_REGISTRY, Training-Agent staticSkills
  - `supabase/migrations/20260306000001_ai_trainer_review.sql` — DB-Migration
    - `training_plans.ai_supervised` BOOLEAN
    - `training_plans.review_config` JSONB
    - `workouts.session_feedback` JSONB
    - `profiles.ai_trainer_enabled` BOOLEAN
    - 2 Indexes + NOTIFY pgrst
  - `src/types/health.ts` — ReviewConfig + SessionFeedback Interfaces

- **Block C: Post-Session-Feedback UI** (TEIL-KOMPLETT)
  - `src/features/workouts/components/PostSessionFeedback.tsx` — NEUE Komponente
    - 4 Feeling-Buttons (easy/good/hard/exhausted)
    - Optionales Joint Pain (12 Koerperbereiche, Schmerzstaerke 1-5)
    - Speichert in `workouts.session_feedback` JSONB
  - `src/features/workouts/components/WorkoutSummary.tsx` — Integration
    - Zeigt PostSessionFeedback nach Save wenn `ai_trainer_enabled`

- **Block D: UI-Elemente** (TEIL-KOMPLETT)
  - `src/features/workouts/components/TrainingPlanView.tsx` — AI-Trainer Badge (Indigo)
  - `src/pages/ProfilePage.tsx` — KI-Trainer Toggle
  - `src/features/auth/hooks/useProfile.ts` — `ai_trainer_enabled` in UpdateProfileInput

- **Commit:** `04f5b9d`

### Doku-Updates (NOCH ZU COMMITTEN)
- `docs/TODO.md` — Block A als erledigt markiert, Post-Session-Feedback UI + Badge + Toggle
- `docs/DEPENDENCIES.md` — Neue DB-Spalten, 17 Skills, Migration-Eintrag, Version 1.1

---

## Git-Status

- **Branch:** develop
- **Ahead of origin:** 2 Commits (v12.57 + v12.58) — NOCH NICHT GEPUSHT!
- **Uncommitted:** TODO.md + DEPENDENCIES.md Updates (muessen noch committed werden)
- **nul-Datei:** Untracked `nul` Datei (Windows-Artefakt, ignorieren)

---

## Was steht als naechstes an?

### SOFORT (vor weiterem Feature-Development):
1. **Commit + Push** — TODO.md + DEPENDENCIES.md committen, dann `git push` (2 Commits + Doku)
2. **DB-Migration deployen** — `20260306000001_ai_trainer_review.sql` auf Production (fudda.de) ausfuehren
3. **Frontend deployen** — `npm run build` + `scp` nach Hetzner (v12.57 + v12.58)
4. **PostgREST Schema-Reload** — `docker restart fitbuddy-rest-1` nach Migration

### Block B: Startgewicht-Onboarding (NAECHSTER BLOCK)
- **CalibrationWizard Komponente** — 3-Screen Flow:
  - Screen 1: Erfahrungs-Level (Anfaenger/Fortgeschritten/Erfahren)
  - Screen 2: Gewichte-Vorschau (BW-Multiplier × Koerpergewicht) + manuelle Korrektur
  - Screen 3: Review-Settings (Mesozyklus-Laenge, Deload-Woche, KI-Trainer an/aus)
- **Trigger:** Nach Plan-Erstellung (KI oder manuell), als Modal/Dialog
- **Daten:** Schreibt `review_config` + `ai_supervised` in training_plans
- **BW-Multiplier-Tabellen** sind im Skill-File `trainerReview.ts` (Lines 47-65)
- **Smart-Presets** je nach Erfahrung + Ziel + Training-Mode (siehe KONZEPT Lines 319-335)
- **Konzept-Referenz:** `docs/KONZEPT_KI_TRAINER.md` Lines 164-184

### Block B (Rest):
- **RIR-Feedback** — Nach erstem Satz der allerersten Session: "Zu leicht / Passt / Zu schwer"
- **Auto-Kalibrierung** — Max-Reps-Pattern (Obergrenze 2+ Sessions → +2.5/5kg)

### Block C (Rest):
- **Post-Session-Analyse Hook** — Automatisch: Plateau-Erkennung, RPE-Drift, Volume/Muskelgruppe
- **Early Triggers** — In Deviations Engine: Plateau, Pain, Sleep, Missed Sessions
- **Mesozyklus-Review** — Buddy-initiierte Nachricht am Review-Tag
- **PED-Phasen-Sync** — CycleWidget-Status → review_config automatisch anpassen

### Block D (Rest):
- **Buddy-Nachfrage** — Bei manuellen Plaenen: "Soll ich mittracken?"
- **Review-Dialog** — Vorschlag-Ansicht mit Annehmen/Anpassen/Ablehnen

---

## Wichtige Dateien fuer naechste Session

| Datei | Relevanz |
|-------|----------|
| `docs/KONZEPT_KI_TRAINER.md` | Gesamtkonzept mit allen Details |
| `docs/TODO.md` | Zentrale Aufgabenliste (aktualisiert) |
| `docs/DEPENDENCIES.md` | Abhaengigkeitskarte (aktualisiert) |
| `src/lib/ai/skills/trainerReview.ts` | Skill mit BW-Multiplier + Decision Tree |
| `src/types/health.ts` | ReviewConfig + SessionFeedback Interfaces |
| `src/features/workouts/components/PostSessionFeedback.tsx` | Post-Session UI |
| `src/features/workouts/components/TrainingPlanView.tsx` | AI-Badge Integration |
| `src/features/workouts/components/WorkoutSummary.tsx` | Feedback-Integration |
| `src/pages/ProfilePage.tsx` | KI-Trainer Toggle |
| `supabase/migrations/20260306000001_ai_trainer_review.sql` | DB-Migration |

---

## Bekannte Issues / Hinweise

- **Migration NICHT auf Production deployed** — muss vor Frontend-Deploy passieren!
- **PostgREST Schema-Cache** — Nach Migration: `NOTIFY pgrst, 'reload schema'` UND `docker restart fitbuddy-rest-1`
- **2 Commits unpushed** — v12.57 + v12.58 sind nur lokal
- **Parent vs. src docs:** TODO.md und DEPENDENCIES.md existieren in BEIDEN Pfaden — die Git-Repo-Version (`src/docs/`) wurde synchronisiert, aber kuenftig nur die Git-Version pflegen!
- **Alte Assets** beim Deploy loeschen: `rm -rf /opt/fitbuddy/frontend/assets/*` VOR scp
