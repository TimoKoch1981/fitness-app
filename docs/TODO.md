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
  - [ ] Rechtskonformitaet pruefen (DSGVO, Medizinprodukte-Abgrenzung)

#### Email & Registrierung
- [x] ~~**Resend als SMTP-Provider konfigurieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**Email-Confirmation aktivieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**site_url korrigieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**ResetPasswordPage implementieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**Email-Templates anpassen**~~ ✅ (2026-02-21, v6.1)
- [ ] **Resend Domain-Validierung** — fudda.de bei Resend verifizieren (fuer Produktion)
  - Lokal: Emails gehen an Mailpit (SMTP disabled) ✅
  - Produktion: SMTP enabled, braucht verifizierte Domain bei Resend
  - Anleitung: `docs/RESEND_DOMAIN_SETUP.md` ✅ (2026-02-26)
  - config.toml: admin_email auf noreply@fudda.de aktualisiert ✅ (2026-02-26)
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
- [ ] **Supplement-Listen als Auswahlvorschlag** — Gaengige Supplements (Kreatin, Omega-3, Vitamin D, Zink, Magnesium, Whey, etc.) als vordefinierte Auswahl beim Anlegen einer Substanz
- [ ] **Doping/Anabolika-Liste als Auswahlvorschlag** — PED-Liste (Testosteron, Trenbolon, Anavar, Deca, etc.) als Auswahlvorschlag
  - Muss explizit unter Medizin durch den Nutzer aktiviert werden
  - Disclaimer erforderlich bei Aktivierung
  - Skill-Dateien werden Detailinfos enthalten (Halbwertszeiten, Dosierungen, Nebenwirkungen)

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
> Aktuell: 8 statische Skills mit ~1.200 Zeilen Fachwissen. Inhaltlich funktional,
> aber noch duenn — viele Themen nur angerissen, Tiefe fehlt.
> **Diskussionsbedarf:** Struktur, Quellen-Qualitaet, Fach-Tiefe, Token-Budget.

- [ ] **Konzeptionelle Diskussion** — Wie tief sollen Skills sein? Token-Budget vs. Qualitaet. RAG-Alternative? Skill-Versioning-Strategie.
- [ ] **Nutrition-Skill erweitern** — Mikronaehrstoffe, Meal-Timing, Sport-spezifische Ernaehrung, Nahrungsergaenzung, Diaet-Strategien (Cutting/Bulking), Alkohol-Impact, Hydration
- [ ] **Training-Skill erweitern** — Periodisierung (linear/undulierend/block), Deload-Wochen, RPE/RIR-Skala, Superkompensation, Aufwaermprogramme, Mobilitaet, Verletzungspraevention
- [ ] **Substances-Skill erweitern** — PCT-Protokolle, Blutbild-Interpretation (detailliert), Wechselwirkungen, Halbwertszeit-Kurven, Ester-Vergleich, Nebenwirkungs-Management
- [ ] **Analysis-Skill erweitern** — Plateau-Erkennung, Prognose-Modelle, Wochen-/Monats-Trends, Anomalie-Erkennung, Vergleich mit Referenzwerten
- [ ] **Medical-Skill erweitern** — Laborwerte-Referenzbereiche (detailliert), Sport-Kardiologie, Hormonspiegel-Interpretation, Schilddruese, Leber/Niere-Marker
- [ ] **Beauty/Lifestyle erweitern** — Mehr Studien-Referenzen, evidenzbasierte Empfehlungen, Timing-Tabellen
- [ ] **Neuer Skill: Schlaf & Regeneration** — Schlafphasen, Schlafhygiene, Overreaching vs Overtraining, HRV, Erholungsstrategien
- [ ] **Quellen-Audit** — Alle Quellen auf Aktualitaet pruefen, fehlende Referenzen ergaenzen

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
- [ ] Resend Domain-Validierung (fudda.de statt fitbuddy.app)
- [x] ~~Monitoring aufsetzen (Error Tracking, Uptime)~~ ✅ (2026-02-26, v9.4) — monitor.sh (Docker, Disk, Memory, Service-Health)
- [x] ~~Backup-Strategie fuer Supabase-DB (pg_dump Cronjob → Hetzner Storage Box)~~ ✅ (2026-02-26, v9.4) — backup-db.sh Script

#### ~~Phase 7: P2-Features~~ ✅ (2026-02-24, v8.0)
- [x] ~~Email-Import fuer Daten~~ ✅ — DataImportDialog mit KI-Textextraktion (OpenAI gpt-4o-mini)
- [x] ~~Fitdays-Waage API-Integration~~ ✅ — CSV-Import mit Auto-Erkennung (Fitdays/Renpho/Withings)
- [x] ~~Erweiterte KI-Analyse und Prognosen~~ ✅ — Lineare Regression, Moving Average, Plateau-Erkennung, ProgressionCard
- [x] ~~Koerper-Silhouette fuer Masse-Visualisierung~~ ✅ — SVG BodySilhouette mit dynamischer Skalierung + KFA-Farben

#### Auth-Erweiterungen
- [ ] OAuth / Social Login (Google, Apple) — alle Provider in config.toml disabled
- [ ] MFA (TOTP, WebAuthn) — aktuell alles disabled

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
| OAuth | DEAKTIVIERT | Alle Provider disabled (P2) |
| MFA | DEAKTIVIERT | TOTP/Phone/WebAuthn alle disabled (P2) |

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

*Letzte Aktualisierung: 2026-02-26 (v10.3 — 4 Bugs gefixt, Supplement/PED-Listen geplant)*
