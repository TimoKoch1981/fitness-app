# FitBuddy — TODO-Liste (Konsolidiert)

> **Stand:** 2026-03-21, v13.3.1
> **Letzte Konsolidierung:** Zyklustracker v3 + Kalender-Verbesserungen + Feature-Audit
> Prioritaet: P0 = Blocker, P1 = Wichtig, P2 = Nice-to-Have, P3 = Irgendwann

---

## ❌ Offene Bugs

| # | Bug | Prio | Analyse |
|---|-----|------|---------|
| ~~B19~~ | ~~Plan-Speichern / Multi-Day-Split unzuverlaessig~~ | ~~P0~~ | **GEFIXT v13.4 (2026-04-08)** — Trainings-Agent schreibt jetzt Klartext-Description statt JSON, SystemAgent-FC erhaelt Original-User-Message als Kontext + Vollstaendigkeits-Regel, Idempotenz-Cache, Save-Retry-Fallback. **Live-verifiziert auf fudda.de**: 4-Tage-Split mit allen 4 Tagen + 5 Uebungen pro Tag in einem einzigen Klick gespeichert. |
| ~~B20~~ | ~~Workout-Musik-Player unzuverlaessig~~ | ~~P1~~ | **GEFIXT v13.5 (2026-04-08)** — Persistent Single Iframe Architektur: `MusicPlayerContext` + `MusicPlayerProvider` global am App-Root, eine einzige Iframe-Instanz mit `key="persistent-music-iframe"` + `React.memo`, ueberlebt Route-Navigation, Collapse/Expand und Scroll. Spotify-Dead-Code (600 Zeilen) komplett entfernt. **Audio-Test braucht manuelle User-Verifikation.** |
| **B21** | **Supabase Studio Container unhealthy** | P3 | `fitbuddy-studio-1` zeigt `unhealthy` — Next.js startet aber Healthcheck scheitert mit `ECONNREFUSED 127.0.0.1:3000` (falsche Interface-Bindung / zu frueher Check). Funktional OK (Studio ist nur Admin-UI, blockiert keine User). **Fix:** Healthcheck in `deploy/docker-compose.yml` anpassen — `start_period: 60s` + `retries: 20` ODER `healthcheck: disable: true`. **Aufwand:** 15 min. |

---

## ⚠️ UX-Probleme (kein Crash, aber schlecht)

*Keine offenen UX-Probleme.*

---

## 📋 Offene Features

### P1 — Wichtig

| # | Feature | Status | Details |
|---|---------|--------|---------|
| F1 | **Apple OAuth** | OFFEN — extern blockiert | Button hinter Feature-Flag (`apple_oauth=false`). Braucht: Apple Developer Account ($99/Jahr), Service ID, Key-Erstellung (macOS noetig), GoTrue-Config auf Server |
| F3 | **Alte Quick-Logs DB-Migration** | ENTSCHEIDUNG NOETIG | ~100 alte Workouts haben nur `exercises[]` (kein `session_exercises`). Aktuell: Runtime-Konvertierung via `convertLegacyExercises()`. Option: DB-Migration die alle alten Rows nachtraeglich befuellt (einmalig, dann saubere Daten) |

### P3 — Irgendwann

| # | Feature | Status | Details |
|---|---------|--------|---------|
| F9 | **Cloud Push-Notifications** | OFFEN | Firebase Cloud Messaging / WhatsApp / Telegram. Capacitor Local Notifications funktionieren bereits |
| F10 | **Social Features** | OFFEN | Buddy-System (Training teilen), Gruppen/Challenges, Social Media Post-Templates |
| F11 | **Apple Watch / Wearable Integration** | OFFEN | Herzfrequenz, Steps, automatische Workout-Erkennung |
| F12 | **Offline-First Architektur** | OFFEN | Service Worker + IndexedDB fuer echte Offline-Nutzung (aktuell nur PWA-Cache) |
| F13 | **Supersets / Circuit Training** | OFFEN | Uebungen gruppieren als Supersatz oder Zirkel |

---

## ✅ Erledigte Punkte (Referenz — Code-verifiziert)

<details>
<summary>Alle abgeschlossenen Items aufklappen</summary>

### Zyklustracker v3 + Kalender (v13.1-v13.3.1) ✅
- [x] **Period-First UX** — AddCycleLogDialog komplett rewritten: 5 Phase-Buttons → 3-Button Toggle (Ja, Periode / Schmierblutung / Nein)
- [x] **Auto-Phase-Berechnung** — Backward-Counting (Zykluslaenge - 14 = Ovulation), kein manuelles Phase-Setzen
- [x] **Quick-Toggle** — Tage im Kalender antippen = Periode an/aus (Clue/Flo-Style)
- [x] **Gewichteter Durchschnitt** — Zykluslaenge aus historischen Daten (lineare Gewichtung, neuere staerker)
- [x] **Durchschnittliche Periodenlaenge** — Berechnet aus tatsaechlichen Menstruationstagen
- [x] **Phase nullable** — DB-Migration: `ALTER TABLE menstrual_cycle_logs ALTER COLUMN phase DROP NOT NULL`
- [x] **Historische Phasen im Kalender** — getPredictedPhase nutzt ALLE Periodenstarts (nicht nur letzten)
- [x] **Kraeftige Farben + Emojis** — Jeder Kalendertag zeigt Phase-Emoji (🩸🌱🥚🌙) + satte Hintergrundfarben
- [x] **Fruchtbare Tage** — Rosa Punkte rund um berechneten Eisprung (Ovulation -5 bis +1)
- [x] **Amenorrhoe-Warnung** — Schwellwert 60 → 45 Tage (per Gynaekologin-Review)
- [x] **Konzeptdokument** — `docs/KONZEPT_ZYKLUSTRACKER_V3.md` (Marktanalyse, med. Grundlagen, Expertenpanel)

### Bodybuilder-Modus / Power Mode (F15) ✅
- [x] **Power/Power+ Modi** — Standard/Power/Power+ Training Modes, DB-Migration, Feature-Flags
- [x] **Phasen-Management** — PhaseProgressBar, PhaseCyclePlanner (Bulk/Cut/Maintenance)
- [x] **Peak Week** — PeakWeekPlanner, PhaseSetupWizard, RefeedPlanner
- [x] **Makro-Berechnung** — phaseMacroCalculator.ts, phaseTransitionAdvisor.ts
- [x] **Konzeptdokument** — `docs/BODYBUILDER_MODUS_KONZEPT.md`

### Vorrat + Einkaufsliste (F16, F17) ✅
- [x] **F16: Kochen mit Vorrat** — Pantry-Modul (usePantry, PantryTabContent, PantrySetupWizard, pantryMatcher, AddCustomIngredientDialog)
- [x] **F17: Smarte Einkaufsliste** — ShoppingListView, ShoppingTabContent, useShoppingLists, shoppingListBuilder (Mengen-Aggregation, Einheiten-Normalisierung, Kategorie-Sortierung, Pantry-Subtraktion, Clipboard-Export)
- [x] **DB-Tabellen** — shopping_lists + shopping_list_items
- [x] **Konzeptdokument** — `docs/KONZEPT_VORRAT_EINKAUF.md`

### Workout-Musik / YouTube (F6) ✅
- [x] **YouTube-Embeds** — youtube-nocookie.com (Privacy, CSP-konform)
- [x] **Spotify-Integration** — SpotifyCallback, useSpotifyPlayer (Web Playback SDK, OAuth)
- [x] **WorkoutMusicPlayer** — Kuratierte Playlists (Workout/Cardio/Focus/Chill), Play/Pause/Skip

### MFP-Import (F7) ✅
- [x] **MyFitnessPal CSV-Import** — MFPImportDialog, mfpParser.ts, useDataImport Hook
- [x] **Vorschau + Fortschritt** — Preview-Tabelle, Progress-Indicator, Fehlerbehandlung

### API Versioning (F8) ✅
- [x] **Versionierung** — lib/api/version.ts (API_VERSION='v1', Headers, Deprecation-Tracking)
- [x] **API Client** — apiClient.ts mit versionierten Endpunkten

### Rezept-Import aus URL (F14) ✅ (v12.89)
- [x] **3-Tier-Extraktion** — JSON-LD (80%) → Microdata → KI-Fallback (gpt-4o-mini)
- [x] **Edge Function** — supabase/functions/recipe-import (SSRF-Schutz, Rate-Limiting 10/User/h)
- [x] **ImportRecipeDialog** — URL-Eingabe → Vorschau → Speichern
- [x] **Allergen-Erkennung** — 10 EU-Kategorien, Auto-Tags

### PlanEditor UX v12.72 ✅
- [x] **Tab-Switch-Fix** — PlanEditorDialog `onSaved` nutzt `queryClient.invalidateQueries()` statt `window.location.reload()`. Bleibt auf "Mein Plan" Tab statt auf "Heute" zu springen
- [x] **DnD ganzer Block** — `{...attributes}` + `{...listeners}` auf gesamte Zeile verschoben. stopPropagation auf allen Inputs/Buttons. Cursor-grab Styling
- [x] **Hoch/Runter-Pfeile** — ChevronUp/ChevronDown links neben jeder Uebung fuer Klick-Reorder. Erster/Letzter disabled. arrayMove + markChanged

### Multi-Plan Management v12.70 ✅
- [x] **TrainingPlanList** — Kompakte Card-Liste aller Plaene mit Aktiv-Badge (teal), Duplizieren/Loeschen-Buttons, Delete-Bestaetigung mit Active-Plan-Warnung
- [x] **CreatePlanDialog** — 2-Schritt-Dialog (Name/Split/Tage → Day-Konfiguration), Auto-generierte Default-Day-Names basierend auf Split-Type
- [x] **Hooks** — useActivatePlan (Deaktiviert alle → aktiviert gewaehlten), useDuplicatePlan ("Kopie von" Prefix, nicht aktiv), usePlanById (Days-JOIN fuer non-active Plans)
- [x] **Integration** — WorkoutsTabContent Plan-Tab zeigt Plan-Liste + Detail-View, WorkoutStartDialog oeffnet CreatePlanDialog direkt
- [x] **i18n** — 24 neue plans-Keys in allen 17 Sprachen

### Workout UX Phase 2 v12.69 ✅
- [x] **F4: Adaptive Felder im Live-Tracker (Phase D.2)** — SetResult erweitert (target/actual_duration_minutes, target/actual_distance_km), LOG_SET + logSet erweitert, Cardio via Set-Tracker (nicht Timer), SetBySetTracker + ExerciseOverviewTracker zeigen Duration+Distance fuer Cardio, PREVIOUS-Spalte adaptiv, WorkoutSummary adaptiv inkl. Inline-Editing
- [x] **F5: Volumen-Vergleich im WorkoutSummary** — Total Volume (Σ reps×weight, excl. warmup+cardio), Matching via >50% Exercise-Overlap, Delta mit Farbkodierung (gruen +, rot -), Prozent-Vergleich vs. letztes Mal
- [x] **U2: "Plan erstellen" im Plus-Button** — Dritte Option in WorkoutStartDialog (indigo, BookmarkPlus), forceTab-Prop auf WorkoutsTabContent, Switch zum Plan-Tab

### Bugfixes v12.68 ✅
- [x] **B1+U1:** ExerciseListBar Default `expanded=true`, Hint-Styling verbessert (text-xs, text-gray-600, teal Chevron)
- [x] **B2+F2:** MFA Login-Challenge in LoginPage integriert (AAL-Level-Check, MFAVerificationDialog, signOut bei Cancel)
- [x] **B3:** PED-Disclaimer nur bei ausgewaehlter PED/TRT-Substanz (nicht global)
- [x] **B4:** Apple OAuth Button hinter Feature-Flag `apple_oauth=false`

### Workout-System Konsolidierung (v12.65-v12.67)
- [x] **Phase A:** Quick-Log Daten-Fix — `useAllWorkoutHistory()` Filter entfernt, `convertLegacyExercises()`, Legacy-Workouts in Historie sichtbar
- [x] **Phase B:** Freies Training — WorkoutStartDialog, ActiveWorkoutPage ohne Plan, Floating "+" Button, "Als Plan speichern?" Dialog
- [x] **Phase C:** PREVIOUS-Spalte — `useLastExerciseData.ts` Hook (Cross-Plan, exercise_id > Name Matching, 5min Cache), Auto-Fill Weight-Kette, Strong/Hevy Format
- [x] **Phase D.1:** Set-Tags — SetTag Typ (Normal/Warmup/Drop/Failure), SET_TAG Action, cycleTag in SetBySetTracker + ExerciseOverviewTracker
- [x] **Phase D.3:** Multi-Select ExercisePicker — Checkboxen, Batch-Add, Confirm-Button (Hevy/JEFIT Pattern)
- [x] **Phase D.4:** WorkoutSummary — Set-Tag-Badges (W/D/F), Warmup aus Stats/PRs ausgeschlossen, "+XW" Anzeige
- [x] **Phase E.1:** exercise_id in ExerciseSet Typ + AddWorkoutDialog
- [x] **Phase E.2:** Adaptive Felder in AddWorkoutDialog (Strength: Sets/Reps/kg, Cardio: Duration/Distance, Flex: Duration)

### Alle P0 Blocker ✅
- [x] Rate-Limiting (60 Req/User/h, v12.40)
- [x] Liability Disclaimer (5 Sektionen, v8.0)
- [x] Email-Verifizierung (Resend SMTP, SPF/DKIM/DMARC, v12.8+v12.52)
- [x] Sentry Error-Tracking (v12.40)
- [x] DSGVO Compliance (Art. 9, AVV OpenAI+Hetzner, Loeschkonzept, Audit-Trail)

### Auth ✅
- [x] Google OAuth LIVE (Testmodus)
- [x] Facebook OAuth LIVE (Testmodus, App-ID: 936201995462102)
- [x] MFA/TOTP Profil-Settings (Setup + Enroll + Unenroll)
- [x] MFA Login-Challenge (MFAVerificationDialog in LoginPage, v12.68)
- [ ] Apple OAuth (extern blockiert — braucht Apple Developer Account)

### Exercise Catalog v2 ✅ (v12.64)
- [x] 122 Uebungen (12 neue DB-Spalten)
- [x] ExercisePicker (Body-Region-Chips, Favoriten, Kategorie-Tabs)
- [x] PlanEditorDialog (dnd-kit Drag & Drop)
- [x] ExerciseDetailModal v2 (Muscles, Kontraindikationen, Video-Toggle)
- [x] Unilateral L/R, muscleNames.ts i18n

### Twin-Report P0 Items ✅ (alle gefixt seit v12.49-v12.64)
- [x] KI-Button im Mahlzeit-Dialog (Foto-Upload, mealVision)
- [x] Ernaehrungspraeferenzen/Allergien (9 Allergene, 8 Gesundheitszustaende im Onboarding)
- [x] Gesundheitszustaende im Profil
- [x] Onboarding-Wizard (5 Schritte)
- [x] Blutanalyse (38 Biomarker, PDF-Upload)
- [x] Menstruationszyklus-Tracker
- [x] Schlaf-Tracking
- [x] Symptom-Tracker (24 Symptome)
- [x] 6 Mahlzeit-Kategorien
- [x] Schriftgroessen-Einstellung

### Deep-Test P0 ✅
- [x] Email-DNS (SPF/DKIM/DMARC auf fudda.de, v12.52)

### Sonstiges ✅
- [x] Workout Drag & Drop (dnd-kit, v12.63)
- [x] Barcode-Scanner, Body Scan, Progressive Overload
- [x] Gamification, Wasser-Widget, Wochen-Report
- [x] KI-Trainer Review System (Block A-D, trainerReview Skill)
- [x] Zyklus-Integration P1-P3
- [x] Landing Page, Invite-System
- [x] Capacitor + Local Notifications
- [x] 17 Sprachen, 800+ i18n Keys
- [x] 4.600+ Tests, 80+ Test-Dateien

</details>

---

## Zusammenfassung

| Kategorie | Anzahl |
|-----------|--------|
| ❌ Offene Bugs | 0 |
| ⚠️ UX-Probleme | 0 |
| 📋 P1 Features | 2 (Apple OAuth extern blockiert, Legacy-Migration) |
| 📋 P3 Features | 5 |
| ✅ Erledigt | ~85+ Items |

### Empfohlene Reihenfolge fuer naechste Session:
1. **F3: Legacy-Migration Entscheidung** — DB-Migration vs. Runtime-Konvertierung (Entscheidung + ggf. 1h)
2. **F13: Supersets / Circuit Training** — Uebungen gruppieren (2-4h)
3. **F9: Cloud Push-Notifications** — Firebase Cloud Messaging Setup (4-6h)
