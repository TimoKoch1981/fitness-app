# FitBuddy — TODO-Liste (Konsolidiert)

> **Stand:** 2026-03-14, v12.89
> **Letzte Konsolidierung:** Rezept-Bugfixes + Favoriten-Filter + Rezept-Import Konzept (v12.89)
> Prioritaet: P0 = Blocker, P1 = Wichtig, P2 = Nice-to-Have, P3 = Irgendwann

---

## ❌ Offene Bugs

### Multi-Plan v12.70-12.71 Bugs

*Keine offenen Multi-Plan-Bugs. B5+B7 gefixt in v12.71, B6 konnte nach Test nicht reproduziert werden (Save-Flow funktioniert korrekt).*

---

## ⚠️ UX-Probleme (kein Crash, aber schlecht)

*Keine offenen UX-Probleme. U3 (z-index Schichtung) gefixt — Finish-Button jetzt z-20, ExerciseListBar z-10.*

---

## 📋 Offene Features

### P1 — Wichtig

| # | Feature | Status | Details |
|---|---------|--------|---------|
| F1 | **Apple OAuth** | OFFEN — extern blockiert | Button hinter Feature-Flag (`apple_oauth=false`). Braucht: Apple Developer Account ($99/Jahr), Service ID, Key-Erstellung (macOS noetig), GoTrue-Config auf Server |
| F3 | **Alte Quick-Logs DB-Migration** | ENTSCHEIDUNG NOETIG | ~100 alte Workouts haben nur `exercises[]` (kein `session_exercises`). Aktuell: Runtime-Konvertierung via `convertLegacyExercises()`. Option: DB-Migration die alle alten Rows nachtraeglich befuellt (einmalig, dann saubere Daten) |

### P1.5 — Wichtig (Konzept noetig)

| # | Feature | Status | Details |
|---|---------|--------|---------|
| F15 | **Bodybuilder-Modus** | KONZEPT NOETIG | Spezieller Modus fuer Bodybuilder (zu-/abschaltbar, default ON in Power/Power+ Mode). Umfasst: Phasen-Management (Ladephase/Massephase/Diaet/Wettkampf/Reverse Diet), exakte Essenszeiten-Planung (6-8 Mahlzeiten/Tag), Mahlzeiten-Inhalt-Planung (pre/post-Workout, vor dem Schlafen etc.), Supplement-Scheduling (Kreatin, BCAA, Glutamin, Timing), Makro-Cycling (High/Low/Medium Carb Days), Wasserhaushalt-Management (Wettkampf), Peak-Week-Protokoll. Braucht: Detail-Recherche, Konzeptpapier, Experten-Review (Dr. Nutrition + Coach Pump) |
| F16 | **Vorrat Phase B: Kochen mit Vorrat** | OFFEN | Rezept-Filter-Chip "Aus meinem Vorrat", Zutaten-Matching, Buddy-Integration, fehlende Zutaten anzeigen |
| F17 | **Vorrat Phase C: Smarte Einkaufsliste** | OFFEN | Shopping-List UI, Rezept→Liste, Vorrat-Subtraktion, Bring!-Export |

### P2 — Nice-to-Have

| # | Feature | Status | Details |
|---|---------|--------|---------|
| F6 | **Workout-Musik: eigene YouTube-Links** | UNKLAR | Deep-Test sagt "YouTube-Links einfuegbar" — muss verifiziert werden ob das noch funktioniert |
| F7 | **MFP-Import** | OFFEN | MyFitnessPal CSV-Import fuer Ernaehrungsdaten. Konzept existiert, nicht implementiert |
| F8 | **API Versioning** | OFFEN | Versionierte API-Endpunkte fuer zukuenftige Kompatibilitaet |
| F14 | **Rezept-Import aus dem Internet** | KONZEPT FERTIG | URL einfuegen → JSON-LD/Microdata Extraktion → KI-Fallback → Vorschau → Speichern. Konzept: `docs/KONZEPT_REZEPT_IMPORT.md` |

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
| ❌ Offene Bugs | 0 (alle gefixt in v12.68) |
| ⚠️ UX-Probleme | 0 (U3 gefixt) |
| 📋 P1 Features | 2 |
| 📋 P2 Features | 4 |
| 📋 P3 Features | 5 |
| ✅ Erledigt | ~70+ Items |

### Empfohlene Reihenfolge fuer naechste Session:
1. **F14: Rezept-Import aus dem Internet** — Konzept fertig (KONZEPT_REZEPT_IMPORT.md), Implementierung (~4-6h)
2. **F3: Legacy-Migration Entscheidung** — DB-Migration vs. Runtime-Konvertierung (Entscheidung + ggf. 1h)
3. **F6: YouTube-Links** — Verifizieren ob Feature noch funktioniert (15 min)
4. **F7: MFP-Import** — MyFitnessPal CSV-Import implementieren (2-3h)
