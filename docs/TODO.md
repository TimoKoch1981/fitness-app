# FitBuddy — TODO-Liste (Konsolidiert)

> **Stand:** 2026-03-10, v12.65
> **Letzte Konsolidierung:** Vollstaendiges Code-Audit aller Docs + Code-Verifikation
> Prioritaet: P0 = Blocker, P1 = Wichtig, P2 = Nice-to-Have, P3 = Irgendwann

---

## ❌ Offene Bugs (Code-verifiziert)

| # | Bug | Schwere | Quelle | Betroffene Datei(en) |
|---|-----|---------|--------|---------------------|
| B1 | **ExerciseListBar Default = horizontal (collapsed)** — Uebungen werden als horizontale Chips ohne Drag-Handle angezeigt. Vertikale Liste mit GripVertical existiert, ist aber hinter `expanded=false` versteckt. Expand-Hint (`text-[10px] text-gray-300`) ist quasi unsichtbar. User entdecken die vertikale Ansicht nie. | HOCH | User-Report, Code-Audit | `ExerciseListBar.tsx` Zeile 151 (`useState(false)`), Zeile 197-202 (Hint-Styling) |
| B2 | **MFA Login-Challenge fehlt** — User koennen 2FA in Profil-Settings AKTIVIEREN (MFASettings + MFASetupDialog funktionieren), aber beim Login wird der TOTP-Code NICHT abgefragt. `MFAVerificationDialog.tsx` existiert, wird aber NIRGENDS importiert. → 2FA ist Fake-Sicherheit. | HOCH | Code-Audit | `LoginPage.tsx` (kein MFA-Import), `MFAVerificationDialog.tsx` (unused) |
| B3 | **PED-Disclaimer bei normalen Medikamenten** — Disclaimer wird global angezeigt wenn IRGENDEINE Substanz `category=ped/trt` hat. Wenn User Ramipril (medication) + Testosteron (trt) hat, zeigt sich der PED-Disclaimer auch beim Ramipril-Logging. Sollte nur bei PED/TRT-Substanzen erscheinen. | MITTEL | Twin-Report (Ramipril) | `LogSubstanceDialog.tsx` Zeile 118-123 |
| B4 | **Apple OAuth Button sichtbar aber nicht funktional** — Login-Button ist NICHT hinter Feature-Flag, aber GoTrue-Config fehlt (kein Apple Developer Account, $99/Jahr). User sieht den Button, klickt, und bekommt einen Fehler. | MITTEL | Code-Audit | `LoginPage.tsx` Zeile 209-219, GoTrue `.env` |

---

## ⚠️ UX-Probleme (kein Crash, aber schlecht)

| # | Problem | Prioritaet | Beschreibung | Datei(en) |
|---|---------|-----------|--------------|-----------|
| U1 | **ExerciseListBar Expand-Hint unsichtbar** | HOCH | `text-[10px] text-gray-300` ("tippen zum Wechseln, ziehen zum Sortieren") ist auf weissem Hintergrund nahezu unsichtbar. ChevronRight-Icon (3x3 Pixel) ebenso. User wissen nicht, dass sie expandieren koennen. **Vorschlag:** Default auf `expanded=true`, oder groessere/deutlichere Hinweise, oder automatisch expandieren bei >3 Uebungen | `ExerciseListBar.tsx` Z.151, Z.197-202 |
| U2 | **Plus-Button: Kein "Plan erstellen"** | MITTEL | Plus-Button oeffnet WorkoutStartDialog mit "Freies Training" + "Schnell loggen". Plan-Erstellung nur ueber: (a) Plan-Tab Default-Import, (b) Freies Training → "Als Plan speichern", (c) Buddy Chat. Kein Bug, aber User erwarten eine "Plan erstellen" Option direkt am Plus-Button. Hint-Text vorhanden: "Plan-basierte Trainings starten ueber den Plan-Tab" | `WorkoutStartDialog.tsx` Z.65-100, `TrainingPage.tsx` Z.143-148 |
| U3 | **z-index Schichtung suboptimal** | NIEDRIG | ExerciseListBar (`z-10`) und Finish-Button (`z-10`) haben gleichen z-index. Voice/Music Controls (`z-20`) ueberlagern korrekt, aber ExerciseListBar und Finish-Button koennen bei Expansion kollidieren. | `ActiveWorkoutPage.tsx` Z.563, Z.570 |

---

## 📋 Offene Features

### P1 — Wichtig

| # | Feature | Status | Details |
|---|---------|--------|---------|
| F1 | **Apple OAuth** | OFFEN — extern blockiert | Button + Code ready. Braucht: Apple Developer Account ($99/Jahr), Service ID, Key-Erstellung (macOS noetig), GoTrue-Config auf Server |
| F2 | **MFA Login-Integration** | 80% fertig | MFAVerificationDialog existiert, muss in LoginPage integriert werden. Nach `signInWithPassword()` pruefen ob TOTP-Faktor enrolled ist, dann Challenge-Dialog zeigen |
| F3 | **Alte Quick-Logs DB-Migration** | ENTSCHEIDUNG NOETIG | ~100 alte Workouts haben nur `exercises[]` (kein `session_exercises`). Aktuell: Runtime-Konvertierung via `convertLegacyExercises()`. Option: DB-Migration die alle alten Rows nachtraeglich befuellt (einmalig, dann saubere Daten) |

### P2 — Nice-to-Have

| # | Feature | Status | Details |
|---|---------|--------|---------|
| F4 | **Phase D.2: Adaptive Felder im Live-Tracker** | TEILWEISE | AddWorkoutDialog hat adaptive Felder (Strength/Cardio/Flex). Live-Tracker (SetBySetTracker) zeigt immer Reps+Weight. Sollte bei Cardio-Uebungen Duration+Distance anzeigen. Catalog-Feld `category` steuern. |
| F5 | **Volumen-Vergleich im Summary** | OFFEN | WorkoutSummary zeigt PRs, aber keinen Vergleich zum letzten Workout (z.B. "Total Volume: 12.000 kg, +800 kg vs last time") |
| F6 | **Workout-Musik: eigene YouTube-Links** | UNKLAR | Deep-Test sagt "YouTube-Links einfuegbar" — muss verifiziert werden ob das noch funktioniert |
| F7 | **MFP-Import** | OFFEN | MyFitnessPal CSV-Import fuer Ernaehrungsdaten. Konzept existiert, nicht implementiert |
| F8 | **API Versioning** | OFFEN | Versionierte API-Endpunkte fuer zukuenftige Kompatibilitaet |

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

### Workout-System Konsolidierung (v12.65-v12.66)
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

### Auth ✅ (teilweise)
- [x] Google OAuth LIVE (Testmodus)
- [x] Facebook OAuth LIVE (Testmodus, App-ID: 936201995462102)
- [x] MFA/TOTP Profil-Settings (Setup + Enroll + Unenroll)
- [ ] Apple OAuth (extern blockiert, s.o.)
- [ ] MFA Login-Challenge (Component gebaut, nicht integriert)

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
| ❌ Offene Bugs | 4 (2 HOCH, 2 MITTEL) |
| ⚠️ UX-Probleme | 3 (1 HOCH, 1 MITTEL, 1 NIEDRIG) |
| 📋 P1 Features | 3 |
| 📋 P2 Features | 5 |
| 📋 P3 Features | 5 |
| ✅ Erledigt | ~60+ Items |

### Empfohlene Reihenfolge fuer naechste Session:
1. **B1 + U1: ExerciseListBar** — Default auf expanded, besserer Hint, oder immer vertikal (30 min)
2. **B3: PED-Disclaimer** — Condition aendern: nur anzeigen bei aktuell geloggter PED/TRT (15 min)
3. **B4: Apple OAuth** — Button hinter Feature-Flag verstecken bis Account vorhanden (5 min)
4. **B2 + F2: MFA Login** — MFAVerificationDialog in LoginPage integrieren (1-2h)
