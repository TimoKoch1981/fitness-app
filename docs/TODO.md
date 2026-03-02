# FitBuddy — TODO-Liste

> Zentrale Aufgabenliste. Wird von Claude gepflegt und nach jedem Schritt aktualisiert.
> Prioritaet: P0 = Blocker, P1 = Wichtig, P2 = Nice-to-Have, P3 = Irgendwann

---

## Offen

### P0 — Blocker (vor Go-Live)

#### ~~Liability Disclaimer / Haftungsausschluss~~ ✅ (2026-02-24, v8.0)
- [x] ~~**Disclaimer-Banner oder -Modal beim ersten Start**~~ ✅ — DisclaimerModal mit 5 Sektionen (Medizin, Substanzen, Blutdruck, Daten, Risiko)
  - ~~Muss vor erster Nutzung akzeptiert werden (Checkbox + Bestaetigung)~~ ✅ — Blocking Modal z-[100], Checkbox + Accept
  - ~~Hinweis auf: Keine medizinische Beratung, kein Arzt-Ersatz, keine Haftung~~ ✅
  - ~~Disclaimer-Text auch in Profil/Einstellungen einsehbar~~ ✅ — ReadOnly-Modus im Profil
  - DB-Migration: `disclaimer_accepted_at TIMESTAMPTZ` in profiles
  - Dual-Storage: localStorage (fast-check) + Supabase DB (source of truth)
  - [x] ~~Rechtskonformitaet pruefen (DSGVO, Medizinprodukte-Abgrenzung)~~ ✅ (2026-02-27) — Umfassende Analyse in `docs/RECHTSKONFORMITAET.md` (498 Zeilen, 23 Action Items, 4 Rechtsbereiche: DSGVO, MDR, HWG, ePrivacy)

#### Rechtskonformitaet — Umsetzung (aus RECHTSKONFORMITAET.md Aktionsplan E.1-E.3)
> Analyse FERTIG. Umsetzung der identifizierten Massnahmen:

**Phase 1 — Kritisch (vor kommerziellem Launch):**
- [x] ~~**E.1.2: Impressum erstellen**~~ ✅ (2026-02-28, v11.4) — /impressum Route, §5 DDG Pflichtangaben, Haftung, Urheberrecht, Medizin-Disclaimer. 17 Sprachen. Commit: a1d1d2f
- [x] ~~**E.1.1: Datenschutzerklaerung erstellen**~~ ✅ (2026-02-28, v11.4) — /datenschutz Route, 10 Abschnitte (Verantwortlicher, Art.9 Gesundheitsdaten, KI, Hosting DE, Cookies, Drittdienste, Betroffenenrechte). 17 Sprachen. HINWEIS: Anwalts-Pruefung empfohlen! Commit: a1d1d2f
- [x] ~~**E.1.3: Einwilligung granularisieren**~~ ✅ (2026-02-28, v11.4) — 3 granulare Consents (Gesundheitsdaten Art.9, KI-Verarbeitung, Drittlandtransfer Art.49). DB-Migration, DisclaimerModal mit 4 Checkboxen, useDisclaimerCheck v2. Commit: b92e5c0
- [x] ~~**E.1.4: AVV mit OpenAI abschliessen**~~ ✅ (2026-03-01, v12.18) — OpenAI Ireland Ltd. DPA unterzeichnet, SCCs inkl. EU-Standardvertragsklauseln. Dokumentiert in RECHTSKONFORMITAET.md.
- [x] ~~**E.1.5: AVV mit Hetzner pruefen**~~ ✅ (2026-03-01, v12.18) — Hetzner Online GmbH AVV unterzeichnet (DSGVO Art. 28). Dokumentiert in RECHTSKONFORMITAET.md.
- [x] ~~**E.1.6: Account-Loeschung implementieren**~~ ✅ (2026-02-28, v11.4) — DB-Funktion delete_user_account() (SECURITY DEFINER, CASCADE), useDeleteAccount Hook, DeleteAccountDialog mit Bestaetigungswort, ProfilePage Button. 17 Sprachen. Commit: 025a5f7
- [x] ~~**E.1.7: Widerrufsrecht implementieren**~~ ✅ (2026-02-28, v11.4) — PrivacySettings Komponente, 3 Consent-Karten einzeln widerrufbar, ProfilePage integriert. 17 Sprachen. Commit: 284aade
- [x] ~~**E.1.8: DSFA dokumentieren**~~ ✅ (2026-03-01, v12.8) — `docs/DSFA.md`: 12 Risiken, Risikomatrix, 12 techn. + 10 org. Massnahmen, Restrisiko-Bewertung. HINWEIS: Anwaltliche Pruefung empfohlen.

**Phase 2 — Zeitnah (nach Launch):**
- [x] ~~**E.2.1: Datenexport-Funktion**~~ ✅ (2026-02-28, v11.8) — useDataExport Hook (16 Tabellen), DataExportDialog, JSON-Download, ProfilePage Button
- [x] ~~**E.2.2: KI-Disclaimer erweitern**~~ ✅ (2026-02-28, v11.7) — "KI-generiert — kann Fehler enthalten. Keine medizinische Beratung." unter jeder ChatMessageBubble. 17 Sprachen.
- [x] ~~**E.2.3: BP-Klassifikation kennzeichnen**~~ ✅ (2026-02-28, v11.7) — "Klassifikation nach ESC/ESH 2023. Informativ, keine Diagnose." bei MedicalPage + AddBloodPressureDialog. 17 Sprachen.
- [x] ~~**E.2.4: PED-Disclaimer verstaerken**~~ ✅ (2026-02-28, v11.7) — Amber PED-Badge, PED-Disclaimer-Footer bei MedicalPage + LogSubstanceDialog. 17 Sprachen.
- [x] ~~**E.2.5: Substanz-Agent System-Prompt haerten**~~ ✅ (2026-02-28, v11.7) — HAFTUNGS-REGELN Block: Keine Dosierungsempfehlungen, keine Wirksamkeitsaussagen, Pflicht-Disclaimer. DE+EN.
- [x] ~~**E.2.7: Security Headers in Caddyfile**~~ ✅ (2026-03-01, v12.17) — CSP, HSTS, X-Frame-Options, Referrer-Policy, COOP, CORP in Caddy deployed

**Phase 3 — Mittelfristig:**
- [x] ~~**E.3.2: Loeschkonzept (automatische Fristen)**~~ ✅ (2026-03-01, v12.21) — DSGVO Art. 5(1)(e) Speicherbegrenzung. TTL-Spalten (ai_usage_logs 90d, reminder_logs 180d, buddy_context_notes 30d), User-konfigurierbare Gesundheitsdaten-Aufbewahrung (1/3/5 Jahre oder unbegrenzt), cleanup_expired_data() Funktion, ProfilePage Data-Retention-Selektor, 17 Sprachen. Migration 20260301000007.
- [x] ~~**E.3.3: Audit-Trail erweitern**~~ ✅ (2026-03-01, v12.22) — DSGVO Art. 5(1)(f) Integritaet/Vertraulichkeit. audit_logs Tabelle, audit_trigger_fn() generische Trigger-Funktion, 14 Trigger auf Profil-/Gesundheitstabellen (INSERT/UPDATE/DELETE → JSONB old_values/new_values). TTL 180 Tage, cleanup_expired_data() erweitert. Auch: blood_work, sleep_logs, menstrual_cycle_logs auf Production deployed. Migration 20260301000008.

**P2 — Auth-Erweiterungen:**
- [x] ~~**P2: OAuth / Social Login (Google, Apple)**~~ ✅ (2026-03-01, v12.23) — AuthProvider: signInWithOAuth Methode, LoginPage: Google + Apple Buttons mit SVG Icons, Divider "oder mit E-Mail", AuthCallbackPage fuer OAuth Redirect, App.tsx /auth/callback Route, config.toml Google + Apple Provider (disabled, braucht Credentials). 17 Sprachen (signInWithGoogle, signInWithApple, orWithEmail). Tests angepasst (12/12). HINWEIS: Google Cloud Console + Apple Developer Account Setup manuell erforderlich!
- [x] ~~**P2: MFA (TOTP)**~~ ✅ (2026-03-01, v12.24) — useMFA Hook (enroll, verify, unenroll, challenge), MFASetupDialog (QR-Code + Secret + Verify), MFAVerificationDialog (Login-Challenge), MFASettings Karte in ProfilePage (aktivieren/deaktivieren), config.toml TOTP enabled. 17 Sprachen (19 mfa-Keys). 3.099 Tests gruen. HINWEIS: Auf Production GOTRUE MFA-Konfiguration noetig!

#### Email & Registrierung
- [x] ~~**Resend als SMTP-Provider konfigurieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**Email-Confirmation aktivieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**site_url korrigieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**ResetPasswordPage implementieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**Email-Templates anpassen**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**Resend Domain-Validierung + Email-Verifizierung**~~ ✅ (2026-03-01, v12.8)
  - Lokal: Emails gehen an Mailpit (SMTP disabled) ✅
  - ~~DNS von Strato zu Hetzner DNS umziehen~~ ✅ (2026-02-27)
  - ~~SPF, DKIM, MX Records eintragen~~ ✅ (2026-02-27)
  - ~~DNS-Propagation~~ ✅ (2026-03-01)
  - ~~**AUTOCONFIRM=false auf Hetzner + Email-Flow testen**~~ ✅ (2026-03-01, v12.8)
    - SMTP Port 465→587 (STARTTLS, GoTrue v2.172 Kompatibilitaet)
    - GOTRUE_MAILER_EXTERNAL_HOSTS=fudda.de
    - Auth-Container recreated, Confirmation-Email verifiziert
    - LoginPage: email_not_confirmed UX + Resend-Button, 17 Sprachen
- [x] ~~**Welcome-Email nach Account-Aktivierung**~~ ✅ (2026-02-26, v10.0)
  - Edge Function: send-welcome-email (Resend HTTP API)
  - Template: welcome.html (gleiches Design wie confirmation.html)
  - AuthProvider: triggerWelcomeEmail() auf SIGNED_IN (idempotent)
  - DB: welcome_email_sent_at Spalte in profiles

### ~~P0 — Bugs aus Deep-Test (2026-02-26)~~ ✅ (2026-02-26, v10.3)

#### ~~Blutdruck: Puls wird nicht gespeichert~~ ✅
- [x] ~~**Puls-Wert wird im Dialog angezeigt, aber nicht in die DB geschrieben**~~ ✅
  - Fix: Default-Werte (120/80/72) statt leere Placeholders in AddBloodPressureDialog

#### ~~Substanzen: Doppelte Erinnerungen~~ ✅
- [x] ~~**Beim Anlegen einer Substanz werden 2 identische Erinnerungen erstellt**~~ ✅
  - Fix: Auto-Creation useEffect aus MedicalPage entfernt, AddSubstanceDialog ist alleiniger Reminder-Ersteller

#### ~~Welcome-Email: 401 Unauthorized~~ ✅
- [x] ~~**Edge Function send-welcome-email gibt 401 zurueck**~~ ✅
  - Fix: localStorage-Cache verhindert wiederholte Aufrufe, 401 bei Token-Refresh wird nicht mehr geloggt

#### ~~SSE Streaming: Duplicate Processing~~ ✅
- [x] ~~**KI-Antwort wird ~12x doppelt verarbeitet**~~ ✅
  - Fix: Verbose console.log aus ActionParser entfernt, BuddyChat loggt nur bei gefundenen Actions

### P1 — Neue Features

#### Supplement- & Substanz-Auswahlvorschlaege
- [x] ~~**Supplement-Listen als Auswahlvorschlag**~~ ✅ (2026-02-27, v10.8) — 12 Supplement-Presets (Kreatin, Omega-3, Vitamin D, Zink, Magnesium, Whey, etc.)
- [x] ~~**Doping/Anabolika-Liste als Auswahlvorschlag**~~ ✅ (2026-02-27, v10.8) — 12 PED-Presets (Testosteron, Trenbolon, Anavar, Deca, etc.) mit Disclaimer, Power/Power+ Modus

### P1 — Wichtig

- [x] ~~**Navigation-Redesign: Training & Ernaehrung auf erste Ebene**~~ ✅ (2026-02-26, v9.5) — Cockpit/Ernaehrung/Training/Medizin/Profil, NutritionPage + TrainingPage, /tracking→/nutrition Redirect, Buddy via InlineBuddyChat
- [x] ~~**Screenshot-Import**~~ ✅ (2026-02-21, v6.4) — Fitdays-App Bilder per Vision-KI auswerten
- [x] ~~**Deployment-Planung**~~ ✅ (2026-02-22) — `docs/DEPLOYMENT.md`: Vercel + Supabase Cloud, Kosten ~$5-11/Mo, Checkliste, Migration-Steps

#### Proaktive Agenten-Reaktion auf Tagesabweichungen
- [x] ~~**Agenten reagieren flexibel auf Tagesinfos und Soll-Abweichungen**~~ ✅ (2026-02-21, v6.5)
  - ~~Trainer-Agent: Bei Muedigkeit/Schmerz/Krankheit → Intensitaet reduzieren, Pause empfehlen~~
  - ~~Ernaehrungs-Agent: Bei Unterversorgung → nachfragen, Mahlzeit vorschlagen~~
  - ~~Medical-Agent: Bei auffaelligen Werten (Blutdruck, Puls) → Warnung, Nachfrage~~
  - ~~Alle Agenten: "Ist alles in Ordnung?" bei ungewoehnlichem Verhalten~~
  - ~~Temporaeres Pausieren/Anpassen von Trainingsplaenen bei Bedarf~~
  - ~~Kontext-Awareness: Schlaf, Stress, Krankheit, Verletzung beruecksichtigen~~
  - ~~Tagesform-Abfrage: Buddy fragt morgens optional nach Befinden~~

### ~~P1 — UX-Feedback aus Live-Test~~ ✅ (2026-02-22, v7.0)
> Alle 7 UX-Punkte umgesetzt:
> - [x] ~~Avatar-Upload Bug Fix~~ ✅ — Preview bleibt bis Server-URL da
> - [x] ~~BMR-Formel Tooltips~~ ✅ — HelpCircle mit Erklaerung
> - [x] ~~Startgewicht im Onboarding~~ ✅ — useOnboarding prueft Gewicht
> - [x] ~~Auto-Save Profil~~ ✅ — Debounced 800ms, kein Save-Button, Status-Toast
> - [x] ~~Tagesziele berechnen~~ ✅ — BMR→TDEE→Kalorien/Protein/Wasser Kette
> - [x] ~~BMI/FFMI Kennzahlen~~ ✅ — Farbcodiert (WHO), Cockpit + Body-Tab
> - [x] ~~Buddy Feature-Discovery~~ ✅ — 5-Step Tour + Lightbulb-Button + Capabilities-Sheet

### P1 — Neue Features (konzeptionell geplant)

#### Trainingsarten erweitern (Jogger, Yoga, Schwimmer etc.)
- [x] ~~**Trainingsplan-Schema erweitern**~~ ✅ (2026-02-22, v6.7a) — PlanExercise: sets/reps optional, +duration_minutes, distance_km, pace, intensity, exercise_type, exercise_id. Zod-Schema mit .refine(), neue SplitTypes
- [x] ~~**Training-Skill erweitern**~~ ✅ (2026-02-22, v6.7a) — v1.1.0: Laufen, Schwimmen, Radfahren, Yoga, Kampfsport mit MET-Werten
- [x] ~~**Agent-Prompt anpassen**~~ ✅ (2026-02-22, v6.7a) — Beispiel-ACTION-Blocks fuer Laufplan + Yoga-Plan, Format-Regeln pro Trainingsart
- [x] ~~**TrainingPlanView Rendering**~~ ✅ (2026-02-22, v6.7a) — formatExerciseDetails() mit adaptivem Format (Kraft vs Ausdauer vs Flexi)
- [x] ~~**PDF-Export + UserSkills**~~ ✅ (2026-02-22, v6.7a) — Adaptive Spalten/Zeilen im PDF, Ausdauer-Format in Active-Plan-Skill
- [x] ~~**16 neue Tests**~~ ✅ — trainingTypeSchemas.test.ts (Rueckwaertskompatibilitaet, Ausdauer, Rejection, Mixed)

#### Uebungskatalog mit Videos + Erklaerungen
- [x] ~~**exercise_catalog Tabelle + RLS**~~ ✅ (2026-02-22, v6.7b) — Migration + Seed mit ~85 Uebungen
- [x] ~~**Seed-Daten: ~85 Standard-Uebungen**~~ ✅ — Kraft (~40), Ausdauer (~11), Yoga/Flexi (~13), Funktional (~10), kuratierte YouTube-Links (DE+EN)
- [x] ~~**UI: Klickbare Uebungen im Trainingsplan**~~ ✅ (2026-02-22, v6.7b) — ExerciseDetailModal (Bottom-Sheet) + dotted underline
- [x] ~~**Fuzzy-Matching**~~ ✅ — findExerciseInCatalog (exakt → alias → partial → null), 14 Tests

#### Wissensdateien (Skills) konzeptionell ueberarbeiten + fachlich erweitern
> ~~Aktuell: 8 statische Skills mit ~1.200 Zeilen Fachwissen.~~
> **Stand v10.4:** 13 statische Skills mit ~1.900 Zeilen Fachwissen. 5 neue Skills hinzugefuegt.
> **Diskussionsbedarf:** Struktur, Quellen-Qualitaet, Fach-Tiefe, Token-Budget.

- [x] ~~**Konzeptionelle Diskussion**~~ ✅ (2026-02-28, v12.1) — SKILLS_KONZEPT.md erstellt: 16 Skills, 56.700 Token, 8 Agenten. Quick Win: Glossar-Optimierung (~27k Token/Session gespart). Roadmap: Section-Level Loading → RAG.
- [x] ~~**Neuer Skill: Ernaehrungswissenschaft (nutritionScience)**~~ ✅ (2026-02-28) — 3 Spiegel-Artikel ausgewertet, 33 PMIDs, 9 Forscher (Michalsen, Longo, Blueher, Rubino, Stamatakis, Ekelund, Ding etc.), Themen: Langlebigkeit, Fasten 16:8, Adipositas-Neudefinition (Lancet 2025), VILPA, 10.000-Schritte-Mythos
- [x] ~~**Nutrition-Skill erweitern**~~ ✅ (2026-02-28, v11.9a) — +Mikronaehrstoffe (10), Alkohol & Fitness (Parr 2014), Sport-Ernaehrung, Carb-Loading
- [x] ~~**Training-Skill erweitern**~~ ✅ (2026-02-28, v11.9a) — +Periodisierung (Linear/DUP/Block, Harries 2015), Superkompensation, Mobilitaet, Verletzungspraevention
- [x] ~~**Substances-Skill erweitern**~~ ✅ (2026-02-28, v11.9a) — +Blutbild-Interpretation, Wechselwirkungen (6 Kombis), Ester-Vergleich, Nebenwirkungs-Management
- [x] ~~**Analysis-Skill erweitern**~~ ✅ (2026-02-28, v11.9a) — +Prognose-Modelle (McDonald), Trends, Anomalie-Erkennung (9 Anomalien)
- [x] ~~**Medical-Skill erweitern**~~ ✅ (2026-02-28, v11.9a) — +Sport-Kardiologie, Schilddruese, Leber/Niere, Hormonspiegel-Interpretation
- [x] ~~**Beauty/Lifestyle erweitern**~~ ✅ (2026-02-28, v11.9a) — +Evidenzbasierte Hautpflege, Haartransplantation, Saisonalitaet
- [x] ~~**Neuer Skill: Schlaf & Regeneration**~~ ✅ (2026-02-27, v10.4) — sleep.ts: Schlafphasen, Schlafhygiene, Overreaching vs Overtraining, HRV, Erholungsstrategien
- [x] ~~**Neuer Skill: Supplements**~~ ✅ (2026-02-27, v10.4) — supplements.ts: 30+ Supplements, A/B/C/D Evidence-Grading, Interaktionen
- [x] ~~**Neuer Skill: PCT**~~ ✅ (2026-02-27, v10.4) — pct.ts: HPG-Achse, ASIH, Recovery-Timelines, Laborkontrolle
- [x] ~~**Neuer Skill: Wettkampfvorbereitung**~~ ✅ (2026-02-27, v10.4) — competition.ts: Natural vs Enhanced, Peak Week, Reverse Diet
- [x] ~~**Neuer Skill: Female Fitness**~~ ✅ (2026-02-27, v10.4) — femaleFitness.ts: Zyklus-Training, Schwangerschaft, Menopause, RED-S
- [x] ~~**Quellen-Audit**~~ ✅ (2026-02-27, v10.6) — 12 fehlerhafte Zitate korrigiert, 40+ PMIDs ergaenzt, 15+ neue Quellen

### ~~P1 — User-Feedback-Modul (Testphase)~~ ✅ (2026-02-25, v9.0)

#### ~~User-Feedback & Feature-Voting System~~ ✅
- [x] ~~**Einfaches Feedback-Modul**~~ ✅ — FeedbackDialog: Daumen hoch/runter, Kategorie (Bug/Anmerkung/Lob), Freitextfeld, 3 Modi (Quick/Bug/Feature)
- [x] ~~**Bug-Reporting**~~ ✅ — Automatischer Kontext (Seite, Browser, App-Version), dedizierter Bug-Modus im Dialog
- [x] ~~**Feature-Wishlist**~~ ✅ — FeatureVotingPage (/features), FeatureRequestList mit Submit-Dialog
- [x] ~~**Feature-Voting**~~ ✅ — Upvote/Downvote mit Toggle-Logik, Sortierung nach Votes/Neueste, Filter (Alle/Geplant/Umgesetzt), DB-Trigger fuer vote_count Sync
- [x] ~~**Feedback-Dashboard**~~ ✅ — AdminFeedbackPage (/admin/feedback), Stat-Cards, Status-Management, Filter, 2 Admin-Views

#### Live Workout Session / Personal Trainer
- [x] ~~**DB-Migration + Types**~~ ✅ (2026-02-25) — workouts Tabelle erweitert (plan_id, session_exercises, warmup, started_at, finished_at), SetResult/WorkoutExerciseResult/WarmupResult Types
- [x] ~~**Session-Hooks + Utils**~~ ✅ (2026-02-25) — ActiveWorkoutContext (useReducer + localStorage), useSaveWorkoutSession (Auto-Progression), useWorkoutHistory, calorieCalculation (MET)
- [x] ~~**Core UI**~~ ✅ (2026-02-25) — ActiveWorkoutPage, WarmupCard, RestTimer, ExerciseTracker, SetBySetTracker, ExerciseOverviewTracker, ExerciseVideoModal, WorkoutSummary, ExerciseModifyDialog, AddExerciseDialog
- [x] ~~**Trainingshistorie**~~ ✅ (2026-02-25) — WorkoutHistoryPage (Sessions + Exercise Trends), ExerciseHistoryChart (Recharts)
- [x] ~~**Integration**~~ ✅ (2026-02-25) — Route /workout/active, "Start" Button in TrainingPlanView, Historie-Tab in WorkoutsTabContent, ~60 i18n Keys (DE+EN)
- [x] ~~**Tests**~~ ✅ (2026-02-26, v9.4) — calorieCalculation, ActiveWorkoutContext, Auto-Progression, RestTimer, useExerciseCatalog, useSaveWorkoutSession (209 neue Tests)

#### Erweiterte Timer- & Musikfunktionen (Personal Trainer Phase 2)
- [x] ~~**Musik-Streaming beim Training**~~ ✅ (2026-02-26, v9.6) — WorkoutMusicPlayer (YouTube-Einbettung), 4 kuratierte Playlists, Custom-URL, Floating-Player, Play/Pause/Mute
- [x] ~~**Dezidierte Timerfunktion**~~ ✅ (2026-02-26, v9.4) — ExerciseTimer fuer Plank/Isometrie/Dehnungen, automatische Erkennung zeitgesteuerter Uebungen
- [x] ~~**Manuelle Zeitenanpassung**~~ ✅ (2026-02-26, v9.4) — rest_seconds pro Uebung anpassbar, Timer-Sekunden global einstellbar
- [x] ~~**Manuelle Timer pro Einheit**~~ ✅ (2026-02-26, v9.4) — ManualTimer (Stoppuhr + Countdown), pro Uebung startbar
- [x] ~~**KI-Vorschlag fuer Zeiten**~~ ✅ (2026-02-26, v9.7) — suggestRestTimes Utility: Automatische Erkennung von Uebungstyp (Verbund/Isolation/Cardio/Flex/Isometrisch), Ziel aus Reps (Kraft/Hypertrophie/Ausdauer), Empfohlene-Pause-Badge in ExerciseTracker, KI-Preset fuer ManualTimer, 21 Tests
- [x] ~~**Audio-Steuerung ueber Agent**~~ ✅ (2026-02-26, v9.8) — useWorkoutVoiceCommands Hook mit Regex-basiertem Command-Parser (DE+EN), WorkoutVoiceControl Floating-Mic-Button, TTS-Feedback via speechSynthesis, 35 Tests. Befehle: Naechste/Vorherige Uebung, Skip, Reps+Gewicht loggen, Timer starten/stoppen, Training beenden, Pause

### ~~P1 — Internationalisierung (i18n)~~ ✅ (2026-02-27, v10.7)

#### ~~Sprachen deutlich erweitern~~ ✅
- [x] ~~**17 Sprachen implementiert**~~ ✅ — DE, EN, AR, ES, FA, FIL, FR, IT, JA, KO, PL, PT, RO, RU, TR, UK, ZH (610+ Keys pro Sprache)

### P1 — Digital-Twin-Testing Findings (TWIN_TESTING_REPORT.md)
> Quelle: 25-Persona-Testing (2026-02-28, v11.1). Sofortmassnahmen ✅ erledigt, restliche Findings hier.

#### Onboarding & Erstnutzer-Erlebnis
- [x] ~~**Onboarding-Wizard nach Registrierung**~~ ✅ (2026-03-01, v12.9) — OnboardingWizardPage (530 Zeilen, 5 Schritte), OnboardingGuard (Redirect), /onboarding Route. Schritte: Willkommen → Koerperdaten (Name, Groesse, Geburt, Geschlecht, Gewicht) → Ziel & Modus (5 Goals, 5 Activity Levels, TrainingModeSelector) → Ernaehrung & Gesundheit (7+7+7 Chip-Selects) → Fertig. 38 i18n-Keys in 17 Sprachen. 2.956 Tests.
- [x] ~~**Cockpit: Keine Standard-Ziele ohne Profil**~~ ✅ (2026-02-28, v11.6) — profileComplete-Check (height+birth_date+weight), CTA-Card "Tagesziele einrichten" mit Profil-Link, Makro-Werte ohne Fortschrittsbalken/Verbleibend bei leerem Profil, Celebrations nur mit Profil, CalorieChart ohne Ziellinie. 17 Sprachen.

#### Geschlechts- und Modus-basierte Feature-Sichtbarkeit
- [x] ~~**Gender-basiertes Feature-Gating**~~ ✅ (2026-02-28, v11.4) — `useGenderFeatures()` Hook mit 12 Feature-Flags (CycleTracker, SymptomTracker, REDSWarning, Breastfeeding, DiastasisRecti, ProstateMarkers, MaleTestosteroneRef). Pattern: Analog useTrainingMode(). Commit: 6703b90
- [x] ~~**Modus-Erklaerung im Onboarding verbessern**~~ ✅ (2026-03-01, v12.9) — TrainingModeSelector jetzt in Onboarding-Wizard Schritt 3 integriert (Standard/Power/Power+ mit Disclaimer).

#### KI-Buddy Verbesserungen
- [x] ~~**Profil-Daten an KI-Context uebergeben**~~ ✅ (2026-02-28, v11.4) — Allergien (WARNING-Direktive), Ernaehrungsform, Gesundheitseinschraenkungen in generateProfileSkill() ergaenzt. Commit: 86c75b7
- [x] ~~**Proaktives Warnsystem**~~ ✅ (2026-03-01, v12.28) — useProactiveWarnings Hook injiziert kritische Gesundheitswarnungen automatisch in Buddy-Chat (priority 1-2 Deviations). 2 neue Schwellenwerte: Unterkalorien <1200 kcal (P1), Kaloriendefizit >1000 kcal (P2). Bestehend: HDL<25, Hkt>=52%, Uebertraining 7x/Woche, BP-Krise, ALT>150. Pro Session einmalig, reset taeglich. Integration: BuddyPage + InlineBuddyChat + ProactiveWarningCard. 9 neue Tests (35 gesamt).
- [x] ~~**Kontext-Persistence ueber Sessions**~~ ✅ (2026-03-01, v12.26) — buddy_chat_messages Tabelle (90d TTL, RLS), useChatHistory Hook (save/load), BuddyChatProvider DB-Hydration bei Session-Start, useBuddyChat speichert User+Assistant Messages async in DB. Dual-Storage: sessionStorage (schnell) + DB (persistent). Migration 20260301000009.
- [x] ~~**Quellenangaben in Buddy-Antworten**~~ ✅ (2026-03-01, v12.25) — getSkillContentWithSources() injiziert PMID-Referenzen aus Skill-Metadaten in Prompt-Text. Facts Codex Quellenangaben-Sektion verstaerkt (Pflicht 1-2 PMIDs pro Antwort, Beispiel-Format, DE+EN). 124 PMIDs in 14 Skills jetzt fuer LLM sichtbar. ChatMessage.tsx rendert PMIDs als klickbare PubMed-Links.
- [x] ~~**Buddy-Kommunikationsstil**~~ ✅ (2026-03-01, v12.5) — Kurz/Normal/Ausführlich + Einfach/Fachlich. BaseAgent-Prompt-Injection, I18nProvider, ProfilePage UI. 17 Sprachen, 26 Dateien.

#### Sicherheitsrelevante Findings (aus Sektion 4 des Reports)
- [x] ~~**🔴 RED-S/Untergewicht-Warnsystem**~~ ✅ (2026-03-01, v12.10) — useREDSWarning Hook (5 Schwellen: BMI<18.5, BMI<17.0, Defizit>1000kcal, EA<30kcal/kg FFM, <1200kcal aktive Frauen). REDSWarningBanner (Amber/Rot, dismissable). CockpitPage + MedicalPage Integration. Gender-Gating via useGenderFeatures. 17 Sprachen (8 Keys). 2.972 Tests bestanden.
- [x] ~~**🟡 Rektusdiastase-Kontraindikations-Check**~~ ✅ (2026-03-01, v12.11) — Kontraindikations-Matrix in training.ts (6 Regionen: diastasis_recti, back, shoulder, knee, neck, heart). femaleFitness.ts: Diastasis-Sektion 25 Zeilen (3 Schweregrade, 3-Phasen-Rehab, PMID:24996567). TrainingAgent: Explizite Kontraindikations-Regeln DE+EN. OnboardingWizard: +2 Restriction-Optionen (neck, diastasis_recti). 9 neue i18n-Keys in 17 Sprachen. 2.990 Tests bestanden.

#### Frauen-spezifische Features
> VORAUSSETZUNG: Gender-basiertes Feature-Gating (siehe oben). Features nur sichtbar wenn `gender === 'female'` oder `gender === 'other'`.

- [x] ~~**Menstruationszyklus-Tracker**~~ ✅ (2026-03-01, v12.7) — menstrual_cycle_logs Tabelle (phase, flow_intensity, symptoms JSONB, energy, mood), useMenstrualCycle Hook (CRUD + Phasen-Helpers), AddCycleLogDialog (4 Phasen, 3 Flow, 8 Symptome, Mood+Energy Emoji), Gender-Gating (female/other), MedicalPage Integration, AI-Kontext, 17 Sprachen (24 Keys), 22 Unit-Tests. RED-S/Kalender = separater Task.
- [x] ~~**Symptom-Tracker (Hitzewallungen, Stimmung)**~~ ✅ (2026-03-01, v12.27) — 10 neue Symptome (Hormonal/Perimenopause: Hitzewallungen, Nachtschweiss, Stimmungsschwankungen, Angst, niedrige Libido, vaginale Trockenheit; Mood: depressive Stimmung, Reizbarkeit, Weinanfaelle, Konzentrationsprobleme). Mood+Energy Emoji-Rating (1-5). Gender-Gating (Perimenopause nur female/other). DB-Migration mood/energy Spalten. 17 Sprachen (10 neue Symptom-Keys). MedicalPage Mood/Energy Anzeige.
- [x] ~~**Stillzeit-Kalorienzuschlag**~~ ✅ (bereits implementiert) — is_breastfeeding Boolean in Profil, BREASTFEEDING_CALORIE_BOOST=400 kcal/Tag (Dewey 2003, PMID:14506247), Gender-Gating (nur female), Pink-Toggle in ProfilePage, Cockpit-Badge, Goal-Calculator Integration.

#### Medizin-Erweiterungen
- [x] ~~**Blutbild/Laborwerte-Tracking**~~ ✅ (2026-02-28, v11.9) — BloodWorkDashboard (10 Marker, farbcodiert), useBloodWork Hook, Warnschwellen, Power+ Mode
- [x] ~~**Arztbericht-PDF-Export**~~ ✅ (2026-02-28, v12.0) — DoctorReport PDF (jsPDF, Profil, 23 Blutmarker + Referenzbereiche, Substanzen, Blutdruck, Koerpermasse)

### P1 — UX/Gamification

#### Erfolgs-Lob fuer den Nutzer
- [x] ~~**Zwischen-Lob bei Erfolgen einbauen**~~ ✅ (2026-02-27, v10.8) — CelebrationProvider + CelebrationOverlay (Konfetti+Toast, 4 Level, 6 Kategorien)
  - ~~Trainings-PRs (neues Maximalgewicht, mehr Reps)~~ ✅
  - ~~Gewichtsverlust-Meilensteine (jedes kg, 5kg, 10kg)~~ ✅
  - ~~Streak-Tage (7 Tage am Stueck trainiert, 30 Tage geloggt)~~ ✅
  - ~~Kaloriendefizit eingehalten~~ ✅
  - [x] ~~**Luecken-Erkennung**~~ ✅ (2026-03-01, v12.4) — GapAlertBanner auf CockpitPage, useGapDetection Hook (2+ Tage), 17 Sprachen, 10 Tests.

### ~~P1 — UX-Ueberarbeitung Workout-Session~~ ✅ (2026-02-28, v11.0)
> Konzept-Dokument: `docs/MUSIK_TIMER_KONZEPT.md`

#### ~~Musik-Integration komplett ueberarbeiten~~ ✅
- [x] ~~**M1: YouTube IFrame API fixen**~~ ✅ — YT.Player, sichtbarer Mini-Player
- [x] ~~**M2: Sichtbarer Mini-Player**~~ ✅ — Play/Pause/Stop/Volume als YT API Calls
- [x] ~~**M3: Spotify Web Playback SDK**~~ ✅ — OAuth + Edge Function + Tab-Toggle

#### ~~Timer komplett ueberarbeiten~~ ✅
- [x] ~~**T1: useWorkoutTimers Hook**~~ ✅ — 5 Sektionen, je aktivierbar
- [x] ~~**T2: WorkoutTimerPanel UI**~~ ✅ — Tabelle, Settings, Alert-Mode
- [x] ~~**T3: Context Integration**~~ ✅ — Auto-Timer-Transitionen, Auto-Advance
- [x] ~~**T4: Timer Alerts**~~ ✅ — Web Audio + Vibration, 4 Modi
- [x] ~~**T5: Alte Timer entfernt + 32 Tests**~~ ✅

### P2 — Power/Power+ Modus
> **Phase A (Basis) — KOMPLETT** ✅ (2026-02-27, v10.9)
> DB-Migration, Types, useTrainingMode Hook, TrainingModeSelector, ProfilePage Integration,
> Anabolics Skill v3.0 (4 Ziel-Zyklen, 11 Wechselwirkungen, Ester-Tabelle, Monitoring),
> Modus-bewusstes Skill-Loading (getSkillIdsForMode), Agent Training-Mode-Kontext,
> Substance Agent Power+ (volle Zyklus-Beratung, BloodWork-Logging)

- [x] ~~**Phase A: Basis**~~ ✅ — DB-Migration, Types, Hooks, Selector, ProfilePage
- [x] ~~**Phase A2: Anabolika-Skill erweitern**~~ ✅ — Zyklen, Dosierungen, Wechselwirkungen nach Ziel
- [x] ~~**Phase A3: Skill-Anpassung**~~ ✅ — Agent-Instructions nach Modus, modus-bewusstes Loading
- [x] ~~**Phase A4: ProfilePage Integration**~~ ✅ — TrainingModeSelector eingebunden, useUpdateProfile erweitert
- [x] ~~**Phase B: Power Features**~~ ✅ (2026-02-28, v11.9b) — CompetitionCountdown, PhaseProgressBar, RefeedPlanner, NaturalLimitCalc. 4 Widgets, 39 i18n-Keys
- [x] ~~**Phase C: Power+ Features**~~ ✅ (2026-02-28, v11.9) — BloodWorkDashboard, CycleWidget, PCTCountdown, HematocritAlert. 4 Widgets, useBloodWork Hook
- [x] ~~**Phase D: Shared**~~ ✅ (2026-02-28, v12.0) — DoctorReport PDF (jsPDF, 23 Blutmarker), PosingPhotos (7 Posen, WebP), trainingMode i18n (42+5 Keys in 15 Sprachen)

### P2 — Digital-Twin-Testing Findings (Nice-to-Have)
> Aus Sektion 3 des TWIN_TESTING_REPORT.md — Priorisierte Feature-Requests P2

- [x] ~~**Wettkampf-Countdown Widget**~~ ✅ (2026-02-28, v11.9b) — CompetitionCountdown (Power Mode), Zieldatum → Wochen/Tage, Phase-Hinweise (Peak Week, Cut, Prep, Off-Season)
- [x] ~~**Blast/Cruise/PCT-Zyklus-Kalender**~~ ✅ (2026-02-28, v11.9) — CycleWidget (Power+ Mode), Blast/Cruise/PCT Status, Progress-Bar, PCTCountdown
- [x] ~~**Daten-Export**~~ ✅ (2026-02-28, v11.8) — DSGVO Art. 20, useDataExport Hook (16 Tabellen), DataExportDialog, JSON-Download
- [x] ~~**Schriftgroessen-Option**~~ ✅ (2026-03-01, v12.3) — Klein/Normal/Gross/Sehr Gross in Profil-Einstellungen. Root-Font-Size via CSS, localStorage, 17 Sprachen, 3 Tests.
- [x] ~~**Schlaf-Tracking (Zeiten)**~~ ✅ (2026-03-01, v12.6) — sleep_logs Tabelle (bedtime/wake_time/duration/quality 1-5), useSleep Hook (CRUD + Upsert), AddSleepDialog (Zeit-Inputs, Dauer-Preview, Emoji-Rating), MedicalPage Integration, AI-Kontext (BuddyPage + InlineBuddyChat), 17 Sprachen (19 Keys), 15 Unit-Tests. DB-Migration + RLS.
- [x] ~~**Mahlzeit-Kategorien erweitern**~~ ✅ (2026-03-01, v12.2) — 6 Kategorien: Fruehstueck, Vormittag, Mittag, Nachmittag, Abend, Snack. 27 Dateien, 17 Sprachen, DB-Migration, 2.705 Tests.
- [ ] **Foto-basiertes Mahlzeit-Logging** (~8h) — Essen fotografieren → KI erkennt Mahlzeit → Auto-Fill Makros. Aylin (B4) fotografiert lieber statt zu wiegen. Braucht Vision-API Integration.
- [ ] **MFP-Import (MyFitnessPal)** (~6h) — CSV/API-Import von MyFitnessPal-Daten. Lisa (C3) trackt Ernaehrung dort. Kein einfacher Wechsel moeglich.
- [x] ~~**Prognose-Funktion**~~ ✅ (2026-03-01, v12.29) — calculateGoalDate() + formatDaysAsDuration() in progression.ts. ProgressionCard zeigt jetzt Ziel-Datum (z.B. "30. Apr. 2026") statt nur Tage, plus Dauer (~8 Wochen) und Trend-Info. useProgression erweitert um weightGoalDate/bodyFatGoalDate. 9 neue Tests (32 gesamt).

### P2 — Digital-Twin-Konzept verbessern

- [ ] **Digital-Twin-Konzept mit Learnings aus anderem Projekt verbessern** — Erkenntnisse aus externem Projekt einfliessen lassen: Persona-Design, Test-Methodik, Auswertung, Coverage-Analyse. DIGITAL_TWINS.md + TWIN_TESTING_REPORT.md aktualisieren.

### P2 — Technische Schulden

- [x] ~~**`tsc -b` Build-Fix**~~ ✅ (2026-03-02, v12.31) — Alle 52 pre-existing Type-Errors behoben. Language-Type von `'de'|'en'` auf `string` in 40+ Dateien gewidened, fehlende i18n-Keys (power.doctorReport etc.) in 15 Sprachen ergaenzt, WorkoutMusicPlayer t()-Calls auf t.section.key migriert, MFA-Casts korrigiert, NotificationType um meal_logging erweitert, unused Imports entfernt. `tsc -b` = 0 Fehler.
- [x] ~~**Production-Deployment v12.32**~~ ✅ (2026-03-02) — v10.1→v12.31 auf fudda.de deployed. 7 DB-Migrationen, Frontend v12.31 Build. 31 Tabellen, 11 Docker-Container, 0 Fehler.
- [x] ~~**Production DB-Migrationen**~~ ✅ (2026-03-02) — Im Rahmen von v12.32 komplett angewendet.
- [x] ~~**Code-TODO: baseAgent.ts:269**~~ ✅ (2026-03-01, v12.30) — `bodyHistory` jetzt aus `useBodyMeasurements(30)` befuellt statt `[]`. HealthContext um `bodyHistory` erweitert. BuddyPage + InlineBuddyChat: Hook-Integration. baseAgent: `hc.bodyHistory` statt hardcoded `[]`. KI-Buddy hat jetzt Zugriff auf Gewichts-/KFA-Trends der letzten 30 Messungen.

### P2 — Nice-to-Have

#### ~~Lint: `react-refresh/only-export-components` (49x)~~ ✅ (2026-02-21, v6.8)
> ~~ESLint 49 Errors → 0 Errors.~~ Geloest mit Option B+C:
> - `allowConstantExport: true` in ESLint-Config
> - react-hooks v7 Compiler-Rules (purity, refs, set-state-in-effect) auf `warn` gesetzt
> - 3 Code-Fixes (prefer-const, no-constant-binary-expression, no-case-declarations)
> - Ergebnis: 0 Errors, 43 Warnungen

#### Phase 4: Qualitaetssicherung
- [x] ~~Unit Tests fuer Deviations Engine, Agent Router, Insights, Utils~~ ✅ (2026-02-21, v6.6) — 91 neue Tests (gesamt: 209)
- [x] ~~Unit Tests fuer Pure Functions + Hooks~~ ✅ (2026-02-21, v6.9) — 971 neue Tests (gesamt: 1210): Protein/Kalorien, Trainingsplan-Export, Report-Helpers, Buddy-Suggestions
- [x] ~~i18n-Konsistenztests (DE/EN)~~ ✅ (2026-02-21, v6.9) — 879 Tests: Schluessel-Paritaet, keine leeren Werte, Umlaute, Strukturvalidierung
- [x] ~~Integrationstests fuer Supabase-Anbindung~~ ✅ (2026-02-25, v9.1) — 4 Integration-Tests (useMeals, useProfile, useBloodPressure, useBodyMeasurements)
- [x] ~~Komponenten-Tests (React Testing Library)~~ ✅ (2026-02-25, v9.1) — 6 Component-Tests (PageShell, Navigation, AdminRoute, LoginPage, AddMealDialog, FeedbackDialog)
- [x] ~~E2E-Tests fuer kritische Flows (Login → Daten → Dashboard)~~ ✅ (2026-02-26, v9.4) — criticalFlows.test.ts (23 Tests)
- [x] ~~Alle Texte auf Deutsch pruefen (Sprach-Inkonsistenz)~~ ✅ (2026-02-21, v6.9) — Automatisiert via i18n.test.ts (879 Keys validiert)
- [x] ~~Datumsformate auf de-DE pruefen~~ ✅ (2026-02-25, v9.0) — 15 Tests (dateFormats.test.ts)
- [x] ~~Accessibility pruefen (Screenreader, Kontrast)~~ ✅ (2026-02-26, v9.4) — Navigation ARIA, LoginPage aria-live, Kontrast-Fixes (9 Dateien)
- [x] ~~Mobile Responsiveness testen~~ ✅ (2026-02-26, v9.9) — Getestet auf Mobile (375x812), Tablet (768x1024), Desktop. PageShell responsive max-width (max-w-lg md:max-w-2xl)
- [x] ~~Performance-Profiling (Lighthouse)~~ ✅ (2026-02-26, v9.9) — Best Practices 100/100, Accessibility Fixes (Label htmlFor, Kontrast teal-700, viewport max-scale=5)
- [x] ~~RLS-Policies testen (Cross-User-Zugriff)~~ ✅ (2026-02-26, v9.9) — 44 RLS-Tests: 17 User-Data-Tabellen, 4 Public-Read, Admin-Access, DSGVO-Gesundheitsdaten-Isolation, Cascading-Access, Storage-Policies
- [x] ~~API-Key Exposure pruefen~~ ✅ (2026-02-24) — Edge Function Proxy, CI/CD Bundle-Check
- [x] ~~Auth-Flows testen (Session-Expiry, Token-Refresh)~~ ✅ (2026-02-25, v9.0) — 14 Tests (authFlows.test.ts)
- [x] ~~Input-Validierung pruefen (SQL-Injection, XSS)~~ ✅ (2026-02-25, v9.0) — 42 Tests + validation.ts Utility (inputValidation.test.ts)

#### ~~Phase 3a: Grundgeruest~~ ✅ (2026-02-26, v10.0)
- [x] ~~shadcn/ui installieren und konfigurieren~~ ✅ (2026-02-26, v10.0) — Tailwind v4 kompatibel, 6 Kern-Komponenten (Button, Card, Input, Badge, Dialog, Separator), Radix UI Primitives, CSS Theme-Variablen
- [x] ~~CI/CD: GitHub Actions fuer Build + Lint + Test~~ ✅ (2026-02-21, v6.6)
- [x] ~~Git-Workflow einrichten (main + develop Branch)~~ ✅ (2026-02-26, v10.0) — master=Production (Auto-Deploy), develop=Entwicklung, CI auf beiden Branches

#### Phase 5: Deployment
- [x] ~~Hosting-Entscheidung~~ ✅ (2026-02-24) — **Hetzner VPS (DE) + Supabase Self-Hosted** (DSGVO, 100+ User, EU)
- [x] ~~Edge Function ai-proxy~~ ✅ (2026-02-24) — OpenAI API Key server-seitig, SSE Streaming
- [x] ~~SupabaseAIProvider~~ ✅ (2026-02-24) — Auto-Detection Cloud/Local, Shared SSE Parser
- [x] ~~vercel.json SPA-Rewrites~~ ✅ (2026-02-24)
- [x] ~~CI/CD Deploy-Job~~ ✅ (2026-02-24) — GitHub Actions: ci + deploy, API-Key-Leak-Check
- [x] ~~.env.example aktualisiert~~ ✅ (2026-02-24) — Cloud + Local Varianten dokumentiert
- [x] ~~DataImport: Blood Pressure Save~~ ✅ (2026-02-24) — handleSave() + useAddBloodPressure
- [x] ~~DataImport: Column Mapping Step~~ ✅ (2026-02-24) — ColumnMappingStep UI + Datentyp-Wechsel
- [x] ~~Hetzner VPS bestellen~~ ✅ (2026-02-24) — CX33, 4 vCPU, 8GB RAM, 80GB, Nuernberg DE, €5.94/Mo
- [x] ~~Supabase Self-Hosted aufsetzen (Docker Compose auf Hetzner)~~ ✅ (2026-02-24) — 11 Container (Caddy, Kong, GoTrue, PostgREST, Realtime, Storage, Edge Functions, Studio, PostgreSQL, Meta, Analytics)
- [x] ~~DB-Migrationen auf Self-Hosted ausfuehren~~ ✅ (2026-02-24) — 10 Tabellen + RLS + Trigger
- [x] ~~Frontend-Deployment (Caddy als Reverse Proxy + Static Files)~~ ✅ (2026-02-25) — Production-Build mit VITE_SUPABASE_URL=https://fudda.de, scp deploy
- [x] ~~Edge Functions auf Self-Hosted deployen~~ ✅ (2026-02-24) — ai-proxy + main Function
- [x] ~~Environment Variables konfigurieren~~ ✅ (2026-02-24) — OPENAI_API_KEY, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY, POSTGRES_PASSWORD
- [x] ~~SSL/TLS via Let's Encrypt (Caddy auto)~~ ✅ (2026-02-24) — HTTPS automatisch, HTTP/2+HTTP/3
- [x] ~~Custom Domain konfigurieren (fudda.de → Hetzner IP)~~ ✅ (2026-02-24) — DNS A-Record + www CNAME → 46.225.228.12
- [x] ~~Production-Deployment~~ ✅ (2026-02-25) — fudda.de LIVE, alle Features funktional
- [x] ~~www.fudda.de → fudda.de Redirect~~ ✅ (2026-02-25) — Caddy permanent redirect
- [x] ~~deploy-frontend.sh auf fudda.de aktualisiert~~ ✅ (2026-02-25) — Default-Domain, Server-IP
- [x] ~~Caddyfile: Cache-Header fuer index.html~~ ✅ (2026-02-25) — no-cache/no-store fuer HTML, immutable fuer Assets
- [x] ~~Caddyfile: Permissions-Policy camera/microphone~~ ✅ (2026-02-25) — camera=(self), microphone=(self) statt Blockierung
- [x] ~~Resend Domain-Validierung (fudda.de)~~ ✅ (2026-03-01, v12.8) — SMTP Port 587, AUTOCONFIRM=false, Emails verifiziert
- [x] ~~Monitoring aufsetzen (Error Tracking, Uptime)~~ ✅ (2026-02-26, v9.4) — monitor.sh (Docker, Disk, Memory, Service-Health)
- [x] ~~Backup-Strategie fuer Supabase-DB (pg_dump Cronjob → Hetzner Storage Box)~~ ✅ (2026-02-26, v9.4) — backup-db.sh Script

#### ~~Phase 7: P2-Features~~ ✅ (2026-02-24, v8.0)
- [x] ~~Email-Import fuer Daten~~ ✅ — DataImportDialog mit KI-Textextraktion (OpenAI gpt-4o-mini)
- [x] ~~Fitdays-Waage API-Integration~~ ✅ — CSV-Import mit Auto-Erkennung (Fitdays/Renpho/Withings)
- [x] ~~Erweiterte KI-Analyse und Prognosen~~ ✅ — Lineare Regression, Moving Average, Plateau-Erkennung, ProgressionCard
- [x] ~~Koerper-Silhouette fuer Masse-Visualisierung~~ ✅ — SVG BodySilhouette mit dynamischer Skalierung + KFA-Farben

#### ~~Glossar-Skill~~ ✅ (2026-02-28, v11.1)
- [x] ~~400+ Fachbegriffe in 12 Kategorien~~ ✅ — Training, Ernaehrung, Koerperzusammensetzung, Supplements, PEDs, PCT, Medizin/Labor, Schlaf, Wettkampf, Female Fitness, Beauty, Abkuerzungen
- [x] ~~Allen 8 Agents zugewiesen~~ ✅ — Universelle Referenz (~4.500 Tokens)
- [x] ~~Aus 15 bestehenden Skills extrahiert~~ ✅ — Konsistente Terminologie

#### ~~Twin-Testing Sofortmassnahmen~~ ✅ (2026-02-28, v11.3)
- [x] ~~Fix #3: PED-Disclaimer bei Tab-Wechsel zuruecksetzen~~ ✅ — Nur bei TRT/PED sichtbar
- [x] ~~Fix #9: Datumsformat de-DE im Mahlzeit-Tab~~ ✅ — 28.02.2026 statt ISO
- [x] ~~Fix #8: Mahlzeit-Reminder-Typ~~ ✅ — `meal_logging` mit i18n (17 Sprachen) + 5er-Grid
- [x] ~~Fix #1: KI-Schaetzung im Mahlzeit-Dialog~~ ✅ — Sparkles-Button, ai-proxy, Auto-Fill Makros
- [x] ~~Fix #2+#4: Profil Ernaehrung & Gesundheit~~ ✅ — Ernaehrungsform (7), Allergien (7), Einschraenkungen (7) als Chip-Auswahl + DB-Migration

#### ~~Auth-Erweiterungen~~ ✅ (2026-03-01)
- [x] ~~OAuth / Social Login (Google, Apple)~~ ✅ (v12.23) — AuthProvider signInWithOAuth, LoginPage Google+Apple Buttons, AuthCallbackPage, config.toml Provider (disabled, braucht Credentials)
- [x] ~~MFA (TOTP)~~ ✅ (v12.24) — useMFA Hook, MFASetupDialog, MFAVerificationDialog, MFASettings in ProfilePage, config.toml TOTP enabled

### P3 — Irgendwann (braucht Cloud-Deployment)

#### Phase 8.2+: Cloud-Push
- [ ] Firebase Cloud Messaging (Server-Push)
- [ ] WhatsApp Business API Integration
- [ ] Telegram Bot Integration

#### Phase 9: Social Media & Community (Konzept v6.6)
> 3-Stufen-Ansatz: Stufe 1 (ohne Cloud), Stufe 2 (braucht Cloud), Stufe 3 (externe APIs)

**Stufe 1 — Basis (ohne Cloud-Backend)**
- [x] ~~**Profilbild**~~ ✅ (2026-02-22, v6.7c) — Avatar-Upload via Supabase Storage, Client-Side Kompression (WebP, 500x500, 200KB), AvatarUpload + UserAvatar Komponenten, Profil + Chat Integration
- [x] ~~**Share-Card Generator**~~ ✅ (2026-02-21, v6.8) — Fortschritts-Card (Dark-Theme), html2canvas → PNG, Web Share API + Download-Fallback, Cockpit-Integration
- [x] ~~**Trainingsplan teilen**~~ ✅ (2026-02-21, v6.8) — Text-Export (WhatsApp/Email), QR-Code (qrcode.react), Share-Link (base64-encoded), Graceful Degradation bei zu grossen Plaenen

**Stufe 2 — Community (braucht Cloud-Deployment)**
- [ ] **Buddy-System** — Trainingspartner einladen, gegenseitige Fortschritte (opt-in)
- [ ] **Gruppen** — Erstellen/Beitreten, Gruppen-Feed, Wochen-Rangliste
  - DB: `friendships`, `groups`, `group_members` Tabellen
- [ ] **Challenges** — 30-Tage-Challenges, Gruppen-Ziele, Fortschrittsbalken
  - DB: `challenges` Tabelle (group_id, name, type, target_value, start/end_date)

**Stufe 3 — Externe Integration**
- [ ] **Instagram/TikTok** — Progress-Fotos mit FitBuddy-Branding teilen
- [ ] **Strava/Garmin/Apple Health** — Lauf/Rad-Daten importieren

---

## Ist-Stand: Registrierung & Auth (aktualisiert 2026-02-21)

| Komponente | Status | Details |
|------------|--------|---------|
| AuthProvider + useAuth | ✅ Fertig | inkl. updatePassword() |
| LoginPage | ✅ Fertig | — |
| RegisterPage | ✅ Fertig | Zeigt Erfolg + "Pruefe Email" |
| ForgotPasswordPage | ✅ Fertig | Sendet Recovery-Email via Supabase |
| ResetPasswordPage | ✅ Fertig (v6.1) | Callback-Route /reset-password |
| ProtectedRoute | ✅ Fertig | — |
| Profile Auto-Creation Trigger | ✅ Fertig | DB-Trigger erstellt Profil nach Signup |
| Email-Confirmation | ✅ AKTIVIERT | config.toml: `enable_confirmations = true` |
| SMTP-Provider (Lokal) | ✅ Mailpit | Port 54324, SMTP disabled in config.toml |
| SMTP-Provider (Prod) | ✅ Aktiv | Resend SMTP, API Key konfiguriert, Domain-Validierung noetig |
| Email-Templates | ✅ Deutsch | confirmation.html + recovery.html |
| site_url | ✅ Korrekt | Port 5173 |
| OAuth | ✅ UI Fertig (v12.23) | Google + Apple Buttons, AuthCallbackPage. Provider in config.toml disabled — braucht Google Cloud Console + Apple Dev Credentials |
| MFA (TOTP) | ✅ UI Fertig (v12.24) | useMFA Hook, Setup/Verify/Settings Dialoge, config.toml TOTP enabled. Production: GoTrue MFA-Config noetig |

---

## Erledigt (letzte 10)

- [x] **v8.0: Disclaimer + 4 P2-Features** — Liability Disclaimer Modal (P0), KI-Prognosen (Regression + Plateau + ProgressionCard), Koerper-Silhouette (SVG, KFA-Farben), Data Import (CSV + Email-Text, Fitdays/Renpho/Withings Auto-Erkennung). 16 neue Dateien, 87 neue Tests (1.410 gesamt) (2026-02-24)
- [x] **v7.2: Produkt-Recherche Pipeline + Ehrlichkeits-Codex** — Product Lookup (Open Food Facts + OpenAI Web Search), Query-Cleaning (Noise-Words, Umlaut-Normalisierung), Zwei-Phasen-Flow (search_product → lookupProduct → save_product + log_meal), Vite Proxy (CORS-Bypass), Ehrlichkeits-Codex fuer alle Agenten, Zielberechnung korrigiert (Protein 1.6-2.2 g/kg), ProfilePage lokaler Form-State, ACTION-Regex flexibilisiert, Fallback-Detektoren, Erinnerungen bearbeiten. 24 Dateien, 1.753+ / 227- Zeilen (2026-02-22)
- [x] **v7.1: Bug-Fixes Substanzen/Erinnerungen/Mobile** — Auto-Erinnerung bei Substanz-Anlage (Frequenz→Reminder), Substanz-Erinnerung-Verknuepfung (Bell-Icon, Cascade-Delete), Toggle/Delete-Buttons auf Mobile sichtbar (sm:opacity statt opacity), Substanz-Toggle (Aktivieren/Deaktivieren), Test-User neu angelegt nach DB-Reset (2026-02-22)
- [x] **v7.0: 7 UX-Verbesserungen aus Live-Test** — Avatar-Fix, BMR-Tooltips, Startgewicht-Onboarding, Auto-Save Profil (Debounced), Tagesziele-Berechnung, BMI/FFMI farbcodiert, Buddy Feature-Discovery (Tour + Info). 7 neue Dateien, 35 neue Tests (1323 gesamt) (2026-02-22)
- [x] **v6.9: Test-Ausbau 239→1210** — 5 neue Test-Dateien: Protein/Kalorien (25), Trainingsplan-Export (31), Report-Helpers (6), Buddy-Suggestions (30), i18n-Konsistenz (879). Alle DE/EN-Schluessel validiert (2026-02-21)
- [x] **v6.8: Social Stufe 1 + Lint-Fix + Deployment-Doku** — Share-Card Generator (html2canvas, Web Share API), Trainingsplan teilen (Text/QR/Link), ESLint 49→0 Errors, DEPLOYMENT.md, Disclaimer-TODO (2026-02-21)
- [x] **v6.7: Trainingsarten + Uebungskatalog + Profilbild** — 3 Features: Multi-Sport-Training (Laufen/Schwimmen/Yoga/Kampfsport), Exercise Catalog (~85 Uebungen + Videos + Fuzzy-Match), Avatar-Upload (Supabase Storage + Kompression). 30 neue Tests (239 gesamt) (2026-02-22)
- [x] **v6.6: Tests + CI/CD + Konzepte** — 91 neue Tests (209 gesamt), GitHub Actions, Bug-Fix Deviations, Konzepte: Trainingsarten, Uebungskatalog, Social (2026-02-21)
- [x] **v6.5: Proaktive Agenten** — Tagesform-Check, Abweichungs-Erkennung (12 Regeln), Agent-Prompt-Injection (2026-02-21)
- [x] **v6.4: Screenshot-Import** — Fitdays-Bilder per Vision-KI auswerten, editierbare Vorschau (2026-02-21)
- [x] **v6.3: Geraetepark** — Equipment-Katalog (52 Geraete), Gym-Profile (3 Templates), Trainer-Integration (2026-02-21)
- [x] **v6.2: Admin-Dashboard** — Nutzerstatistiken, Token-Logging, Food-DB Verwaltung (2026-02-21)
- [x] **v6.1: Email & Auth komplett** — Resend SMTP, Confirmation, ResetPasswordPage, Templates (2026-02-21)
- [x] Doku nachfuehren — 7 fehlende Commits in FORTSCHRITT.md + PROJEKTPLAN.md + MEMORY.md (2026-02-21)
- [x] TODO.md als zentrale Aufgabenliste erstellt + referenziert (2026-02-21)
- [x] Block C: Inline Buddy Chat + Voice Auto-Send (2026-02-20)
- [x] Block B: Cockpit-Redesign + Navigation 8→5 (2026-02-20)
- [x] BuddyQuickAccess — "Frag den Buddy" auf jeder Seite (2026-02-20)
- [x] Proaktive Suggestion Chips im Buddy-Chat (2026-02-20)
- [x] Persoenliche Ziele im Profil (2026-02-20)
- [x] Conversational Onboarding + update_profile Action (2026-02-20)
- [x] Medical-Agent — 8. Agent (2026-02-20)

---

*Letzte Aktualisierung: 2026-03-02 (v12.32 — Production-Deployment + DB-Migrationen, alle v10.1→v12.31 Features auf fudda.de live ✅)*
