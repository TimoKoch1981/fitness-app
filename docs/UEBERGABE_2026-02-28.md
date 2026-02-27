# Uebergabe-Detail fuer 28.02.2026

> Zuletzt bearbeitet: 27.02.2026, Abend-Session
> Git-Stand: develop Branch, v10.9a

---

## Was wurde heute gemacht?

### Session 1 (Vormittag): Power/Power+ Trainingsmodus — Phase A komplett (v10.9)

**14 Dateien geaendert, 1.550 Zeilen hinzugefuegt.**

1. **DB-Migration** (`20260227160000_training_mode_blood_work.sql`)
   - profiles-Tabelle: +8 Spalten (training_mode, show_date, show_federation, current_phase, cycle_status, cycle_start_date, cycle_planned_weeks, power_plus_accepted_at)
   - Neue `blood_work` Tabelle (25+ Laborwert-Spalten)
   - RLS-Policies + Indexes
   - **ACHTUNG: Migration muss noch auf Production (fudda.de) ausgefuehrt werden!**

2. **Types** (`types/health.ts`)
   - Neue Types: TrainingMode, TrainingPhase, CycleStatus, BloodWork
   - UserProfile um 8 Felder erweitert

3. **Feature-Flags Hook** (`shared/hooks/useTrainingMode.ts`)
   - ~20 boolesche Flags (showPEDContent, showBloodWorkDashboard, showCycleTracker, etc.)

4. **TrainingModeSelector** (`shared/components/TrainingModeSelector.tsx`)
   - 3-Karten UI (Standard/Power/Power+)
   - Power+ Disclaimer-Modal mit Checkbox

5. **Anabolics Skill v3.0** (`lib/ai/skills/anabolics.ts`)
   - Aufgespalten in Base (Harm Reduction, immer geladen) + Power+ Extension (Zyklen/Dosierungen)
   - 4 Ziel-basierte Zyklen (Aufbau 3 Tiers, Kraft, Cutting, Definition)
   - 11 Wechselwirkungen, Ester-Tabelle, Monitoring

6. **Modus-bewusstes Skill-Loading** (`lib/ai/skills/index.ts`)
   - `MODE_SKILL_EXTENSIONS` Config
   - `getSkillIdsForMode(agentType, trainingMode)` Funktion

7. **Agent Training-Mode-Kontext** (`lib/ai/agents/baseAgent.ts`)
   - Alle Agents erhalten Modus-Info im System-Prompt
   - `getTrainingModeContext()` Methode

8. **Substance Agent Power+** (`lib/ai/agents/substanceAgent.ts`)
   - Power+: Volle Zyklus-Beratung, BloodWork-Logging
   - Power: Natural Focus, Supplement-Empfehlungen
   - Standard: Basis-Regeln

9. **ProfilePage** (`pages/ProfilePage.tsx`)
   - TrainingModeSelector eingebunden
   - `useUpdateProfile` um 8 neue Felder erweitert

10. **i18n** (`i18n/de.ts` + `i18n/en.ts`)
    - ~50 neue `trainingMode` Keys

**Commit:** `e5a473f` — "feat: Power/Power+ Trainingsmodus — Phase A komplett (v10.9)"

---

### Session 2 (Abend): Musik & Timer Analyse + Konzept (v10.9a)

**Keine Code-Aenderungen, nur Analyse + Dokumentation.**

1. **Code-Analyse** aller Workout-Timer/Musik-Dateien:
   - `WorkoutMusicPlayer.tsx` — YouTube komplett kaputt (kein Sound)
   - `RestTimer.tsx` — Funktioniert, aber Skip im Menu versteckt
   - `ExerciseTimer.tsx` — Funktioniert, UX-Probleme
   - `ManualTimer.tsx` — Zu simpel (nur 1 Timer)
   - `ActiveWorkoutContext.tsx` + `ActiveWorkoutPage.tsx` — Starrer Phase-Flow

2. **Root-Cause YouTube-Problem:**
   - IFrame API Library wird NICHT geladen
   - iframe unsichtbar → Browser blockt Autoplay
   - postMessage() ohne API = wirkungslos

3. **Root-Cause Timer-Probleme:**
   - Skip existiert, ist aber im ⋮ Menu versteckt → User findet es nicht
   - Timer-Toggle existiert, ist aber winziger Icon-Button → User erkennt es nicht
   - **Features existieren, UX versagt**

4. **Konzept-Dokument erstellt:** `docs/MUSIK_TIMER_KONZEPT.md`
   - Musik: YouTube fixen (IFrame API) + sichtbarer Mini-Player + Spotify Deep-Links
   - Timer: Tabellarischer Multi-Timer mit 5 Sektionen, alle separat aktivierbar
   - Geschaetzter Aufwand: ~16h (8 Teilschritte: M1-M3 + T1-T5)

5. **TODO.md** aktualisiert mit detaillierten Anforderungen (M1-M3, T1-T5)

6. **FORTSCHRITT.md** aktualisiert mit v10.9a Eintrag

---

## Was steht morgen an?

### Sofort: User-Diskussion Musik/Timer

**VOR der Implementierung muss der User folgende Punkte klaeren:**

1. **Timer-Layout:** Tabelle oder separate Karten pro Sektion?
2. **Auto-Advance:** Sollen Timer automatisch Phasen wechseln oder ist alles manuell?
3. **Spotify:** Nur Deep-Links oder volles SDK (braucht Premium)?
4. **Sound bei Timer-Ablauf:** System-Beep, Custom-Sound, oder nur Vibration?
5. **Timer-Presets speicherbar?** ("Kraft", "Hypertrophie", "Cardio")

### Danach: Implementierung (empfohlene Reihenfolge)

| Schritt | Was | Aufwand |
|---------|-----|---------|
| **M1** | YouTube IFrame API fixen (Sound reparieren) | ~2h |
| **M2** | Sichtbarer Mini-Player mit Controls | ~2h |
| **M3** | Spotify Deep-Links + kuratierte Playlists | ~1h |
| **T1** | useWorkoutTimers Hook (5 Timer-States) | ~3h |
| **T2** | WorkoutTimerPanel + TimerSectionRow UI | ~3h |
| **T3** | ActiveWorkoutContext umbauen | ~2h |
| **T4** | Skip prominent + Timer ON/OFF Switch | ~1h |
| **T5** | Alte Timer entfernen + Tests | ~2h |

### Spaeter (nicht morgen): Power/Power+ Phase B-D

| Phase | Features | Prioritaet |
|-------|----------|------------|
| B | CompetitionCountdown, PhaseProgressBar, RefeedPlanner, NaturalLimitCalc | P2 |
| C | BloodWorkDashboard, CycleWidget, PCTCountdown, HematocritAlert | P2 |
| D | DoctorReport PDF, PosingPhotos, i18n 15 Sprachen, Tests | P2 |

### Production-Migration (offen!)

```bash
# MUSS noch auf Production ausgefuehrt werden:
ssh root@46.225.228.12
cd /opt/fitbuddy
# Migration-SQL aus supabase/migrations/20260227160000_training_mode_blood_work.sql
# gegen die Production-DB ausfuehren
```

---

## Wichtige Dateien fuer morgen

| Datei | Zweck |
|-------|-------|
| `docs/MUSIK_TIMER_KONZEPT.md` | Konzept — mit User durchgehen |
| `docs/TODO.md` | Aktuelle Aufgabenliste (Abschnitt P1 Workout-Session) |
| `src/features/workouts/components/WorkoutMusicPlayer.tsx` | Aktueller (kaputter) Musik-Player |
| `src/features/workouts/components/RestTimer.tsx` | Aktueller Rest-Timer (wird ersetzt) |
| `src/features/workouts/components/ExerciseTimer.tsx` | Aktueller Exercise-Timer (wird ersetzt) |
| `src/features/workouts/components/ManualTimer.tsx` | Aktueller Manual-Timer (wird ersetzt) |
| `src/features/workouts/context/ActiveWorkoutContext.tsx` | Workout-Flow State (muss erweitert werden) |
| `src/features/workouts/components/ActiveWorkoutPage.tsx` | Haupt-Workout-Seite (Timer-Integration) |

---

## Git-Status

- **Branch:** develop
- **Letzter Commit:** v10.9a (Musik/Timer Konzept + Doku)
- **Offene Aenderungen:** Keine (alles committed + gepusht)
- **Production (fudda.de):** v10.8 — Migration 20260227160000 noch NICHT ausgefuehrt

---

*Guten Morgen! Zuerst `docs/MUSIK_TIMER_KONZEPT.md` durchgehen, offene Fragen klaeren, dann implementieren.*
