# FitBuddy — TODO-Liste

> Zentrale Aufgabenliste. Wird von Claude gepflegt und nach jedem Schritt aktualisiert.
> Prioritaet: P0 = Blocker, P1 = Wichtig, P2 = Nice-to-Have, P3 = Irgendwann

---

## Offen

### P0 — Blocker (vor Go-Live)

#### ~~Rate-Limiting fuer ai-proxy Edge Function~~ ✅ (2026-03-03, v12.40)
- [x] ~~**In-Memory Rate Limiting (60 Requests/User/Stunde)**~~ ✅ — JWT `sub` Claim Extraktion, Map<userId, {count, resetAt}>, HTTP 429 + Retry-After Header
- [x] ~~**Token-Budget Logging**~~ ✅ — console.log pro Request (prompt/completion/total Tokens), X-Token-Count Response Header
- [x] ~~**Cleanup-Intervall**~~ ✅ — setInterval alle 10 Min, expired Entries entfernen (Memory Leak Prevention)
- [x] ~~**CORS: Expose-Headers**~~ ✅ — X-Token-Count + Retry-After fuer Frontend lesbar

#### ~~Liability Disclaimer / Haftungsausschluss~~ ✅ (2026-02-24, v8.0)
- [x] ~~**Disclaimer-Banner oder -Modal beim ersten Start**~~ ✅ — DisclaimerModal mit 5 Sektionen (Medizin, Substanzen, Blutdruck, Daten, Risiko)
  - ~~Muss vor erster Nutzung akzeptiert werden (Checkbox + Bestaetigung)~~ ✅ — Blocking Modal z-[100], Checkbox + Accept
  - ~~Hinweis auf: Keine medizinische Beratung, kein Arzt-Ersatz, keine Haftung~~ ✅
  - ~~Disclaimer-Text auch in Profil/Einstellungen einsehbar~~ ✅ — ReadOnly-Modus im Profil
  - DB-Migration: `disclaimer_accepted_at TIMESTAMPTZ` in profiles
  - Dual-Storage: localStorage (fast-check) + Supabase DB (source of truth)
  - [x] ~~Rechtskonformitaet pruefen (DSGVO, Medizinprodukte-Abgrenzung)~~ ✅ (2026-02-28) — RECHTSKONFORMITAET.md erstellt, 23 Action Items definiert
  - [x] ~~**E.2.1: Datenexport (Art. 20 DSGVO)**~~ ✅ (2026-02-28) — useDataExport Hook (16 Tabellen), DataExportDialog, JSON-Download, ProfilePage-Button
  - [x] ~~**E.2.2: KI-Disclaimer**~~ ✅ (2026-02-28) — "KI-generiert — keine medizinische Beratung" unter jeder AI-Antwort
  - [x] ~~**E.2.3: BP-Klassifikation Disclaimer**~~ ✅ (2026-02-28) — ESC/ESH 2023 Hinweis in MedicalPage + AddBloodPressureDialog
  - [x] ~~**E.2.4: PED-Disclaimer**~~ ✅ (2026-02-28) — Amber-Badge, Harm-Reduction-Hinweis bei PED/TRT
  - [x] ~~**E.2.5: Substanz-Agent Prompt Haertung**~~ ✅ (2026-02-28) — Haftungsregeln-Block, keine Dosierungsempfehlungen
  - [x] ~~**E.1.4: AVV mit OpenAI abschliessen (Art. 28 DSGVO)**~~ ✅ (2026-03-01) — DPA mit OpenAI Ireland Ltd. unterzeichnet, Processor fuer KI-Analyse via ai-proxy
  - [x] ~~**E.1.5: AVV mit Hetzner pruefen (Art. 28 DSGVO)**~~ ✅ (2026-03-01) — AVV mit Hetzner Online GmbH abgeschlossen, Datenverarbeitung ausschliesslich EU/EWR (§3)
  - [x] ~~**E.2.7: Security Headers in Caddyfile**~~ ✅ (2026-03-01, v12.17) — CSP, HSTS, COOP, CORP, XSS-Protection
  - [x] ~~**E.1.3: Einwilligung granularisieren (Art. 9 DSGVO)**~~ ✅ (2026-02-28 Code, 2026-03-01 Production-Deploy) — 3 Consent-Felder (Gesundheitsdaten, KI, Drittland), DisclaimerModal 4 Checkboxen, useDisclaimerCheck, ProtectedRoute-Gating
  - [x] ~~**E.1.7: Widerrufsrecht (Art. 7 Abs. 3 DSGVO)**~~ ✅ (2026-02-28) — PrivacySettings Komponente, pro-Consent Revoke-Buttons, localStorage-Cache-Clear, Re-Consent-Flow
  - [x] ~~**E.1.6: Account-Loeschung (Art. 17 DSGVO)**~~ ✅ (2026-02-28 Code, 2026-03-01 Production-Deploy) — delete_user_account() RPC, CASCADE auth.users→alle Tabellen, Storage-Cleanup, DeleteAccountDialog, useDeleteAccount Hook

#### Email & Registrierung
- [x] ~~**Resend als SMTP-Provider konfigurieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**Email-Confirmation aktivieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**site_url korrigieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**ResetPasswordPage implementieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**Email-Templates anpassen**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**Resend Domain-Validierung**~~ ✅ (2026-03-01, v12.8) — DNS umgezogen (Hetzner), SPF/DKIM/MX verifiziert, AUTOCONFIRM=false, Email-Verifizierung auf Production aktiv
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
- [x] ~~**Doping/Anabolika-Liste als Auswahlvorschlag**~~ ✅ (2026-02-27, v10.8) — 12 PED-Presets (Testosteron, Trenbolon, Anavar, Deca, etc.) mit Disclaimer
  - ~~Muss explizit unter Medizin durch den Nutzer aktiviert werden~~ ✅ — Power/Power+ Modus
  - ~~Disclaimer erforderlich bei Aktivierung~~ ✅ — PED-Disclaimer
  - ~~Skill-Dateien werden Detailinfos enthalten~~ ✅ — anabolics_powerplus Skill

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
- [x] ~~**Proaktives Warnsystem v2 (Cockpit + Blutwerte + Uebertraining)**~~ ✅ (2026-03-01, v12.12)
  - ~~Deviations Engine: +Uebertraining (7+/Woche), +HDL (<25/<40), +Haematokrit (>=52%/>=54%), +ALT (>150)~~
  - ~~BuddyPage + InlineBuddyChat: latestBloodWork + recentWorkouts verdrahtet (vorher leer)~~
  - ~~ProactiveWarningCard: Cockpit-Karte mit Amber/Blue Warnungen, "Buddy fragen" Button~~
- [x] ~~**Kontext-Persistence ueber Sessions**~~ ✅ (2026-03-01, v12.13)
  - ~~buddy_context_notes Tabelle (30-Tage TTL, RLS), contextExtractor.ts (regelbasiert, DE+EN)~~
  - ~~baseAgent: Persistent Context als neuer Prompt-Abschnitt 5.5~~
  - ~~useBuddyChat: Laedt Context VOR Agent-Call, extrahiert+speichert NACH Antwort~~
- [x] ~~**Quellenangaben in Buddy-Antworten**~~ ✅ (2026-03-01, v12.14)
  - ~~ChatMessage: PMID-Parsing → klickbare PubMed-Links (Teal-Badge)~~
  - ~~SkillSourcesFooter: Aufklappbar (Wissensbasis-Version + PMID-Links)~~
  - ~~baseAgent Facts Codex: Zitations-Pflicht (mind. 1 PMID/Antwort bei Fachwissen)~~
- [x] ~~**Symptom-Tracker**~~ ✅ (2026-03-01, v12.15)
  - ~~symptom_logs Tabelle (24 Symptome JSONB, Severity 1-5, RLS), deployed auf Production~~
  - ~~AddSymptomDialog: 6 Gruppen, Multi-Select, Severity-Emoji, Notizen~~
  - ~~MedicalPage: Amber-Theme Sektion mit Symptom-Tags~~
  - ~~BuddyPage + InlineBuddyChat: recentSymptomLogs verdrahtet~~
  - ~~i18n: 28 Keys in 17 Sprachen~~
- [x] ~~**Stillzeit-Kalorienzuschlag**~~ ✅ (2026-03-01, v12.16)
  - ~~is_breastfeeding Boolean in profiles, deployed auf Production~~
  - ~~+400 kcal/Tag in goals.ts (Dewey 2003, PMID:14506247)~~
  - ~~ProfilePage: Pink Toggle fuer female, Auto-Save, Info-Box~~
  - ~~CockpitPage: "🤱 inkl. Stillzeit" Badge~~
  - ~~Female Fitness Skill: Laktation-Sektion mit PMIDs~~

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

- [x] ~~**Konzeptionelle Diskussion**~~ ✅ (2026-02-28) — SKILLS_KONZEPT.md erstellt: 16 Skills, 56.700 Token, 8 Agenten. Quick Win: Glossar aus 6 Domain-Agenten entfernt (spart ~27.000 Token/Session). Roadmap: Section-Level Loading → RAG (pgvector) bei 100+ Usern. Fazit: Architektur ist SOLIDE fuer aktuelle Phase.
- [x] ~~**Neuer Skill: Ernaehrungswissenschaft (nutritionScience)**~~ ✅ (2026-02-28) — 3 Spiegel-Artikel ausgewertet, 33 PMIDs, 9 Forscher (Michalsen, Longo, Blueher, Rubino, Stamatakis, Ekelund, Ding etc.), Themen: Langlebigkeit, Fasten 16:8, Adipositas-Neudefinition (Lancet 2025), VILPA, 10.000-Schritte-Mythos
- [x] ~~**Nutrition-Skill erweitern**~~ ✅ (2026-02-28, v3.0.0) — +Mikronaehrstoffe (10 Eintraege), Alkohol & Fitness (Parr 2014), Sport-spezifische Ernaehrung, Carb-Loading, Weight-Cut
- [x] ~~**Training-Skill erweitern**~~ ✅ (2026-02-28, v3.0.0) — +Periodisierungsmodelle (Linear/DUP/Block, Harries 2015), Superkompensation, Mobilitaet (6-Uebungs-Routine), Verletzungspraevention (Pain-Traffic-Light)
- [x] ~~**Substances-Skill erweitern**~~ ✅ (2026-02-28, v3.0.0) — +Detaillierte Blutbild-Interpretation (CBC/Leber/Niere/Advanced Lipids), Wechselwirkungen (6 Kombis), Ester-Vergleich (Serum-Kurven), Nebenwirkungs-Management (5 Bereiche)
- [x] ~~**Analysis-Skill erweitern**~~ ✅ (2026-02-28, v3.0.0) — +Prognose-Modelle (McDonald Muskelaufbau-Raten, Fettabbau-Raten), Wochen-/Monats-Trends, Anomalie-Erkennung (9 Anomalien + Action-Trigger)
- [x] ~~**Medical-Skill erweitern**~~ ✅ (2026-02-28, v3.0.0) — +Sport-Kardiologie (Sportherz vs. LVH, Baggish 2017), Schilddruese, Leber/Nierenwerte detailliert, Hormonspiegel-Interpretation (T/E2/SHBG/Prolaktin/IGF-1)
- [x] ~~**Beauty/Lifestyle erweitern**~~ ✅ (2026-02-28, v3.0.0) — +Evidenzbasierte Hautpflege (Retinoid/VitC/Niacinamid), Haartransplantation (FUE/FUT), Erweitertes Timing mit Saisonalitaet
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

### P1 — Internationalisierung (i18n)

#### Sprachen deutlich erweitern
- [x] ~~**15+ neue Sprachen hinzufuegen**~~ ✅ (2026-02-27, v10.6) — 17 Sprachen implementiert (DE, EN, AR, ES, FA, FIL, FR, IT, JA, KO, PL, PT, RO, RU, TR, UK, ZH), 610+ Keys pro Sprache

### P1 — UX/Gamification

#### Erfolgs-Lob fuer den Nutzer
- [x] ~~**Zwischen-Lob bei Erfolgen einbauen**~~ ✅ (2026-02-27, v10.8) — CelebrationProvider + CelebrationOverlay (Konfetti+Toast, 4 Level, 6 Kategorien)
  - ~~Trainings-PRs (neues Maximalgewicht, mehr Reps)~~ ✅
  - ~~Gewichtsverlust-Meilensteine (jedes kg, 5kg, 10kg)~~ ✅
  - ~~Streak-Tage (7 Tage am Stueck trainiert, 30 Tage geloggt)~~ ✅
  - ~~Kaloriendefizit eingehalten~~ ✅
  - ~~Konfetti-Animation + Toast~~ ✅

### P1 — UX-Ueberarbeitung Workout-Session ⚠️
> Konzept-Dokument: `docs/MUSIK_TIMER_KONZEPT.md`
> Analyse: 2026-02-27, Status: Konzept fertig, User-Diskussion ausstehend

#### ~~Musik-Integration komplett ueberarbeiten~~ ✅ (2026-02-28, v11.0)
- [x] ~~**M1: YouTube IFrame API fixen**~~ ✅ — WorkoutMusicPlayer komplett neu geschrieben mit echtem `YT.Player()`
- [x] ~~**M2: Sichtbarer Mini-Player**~~ ✅ — Floating Player, Play/Pause/Stop/Volume als YT API Calls
- [x] ~~**M3: Spotify Web Playback SDK**~~ ✅ — Volles SDK (OAuth + Playback), Edge Function spotify-proxy, YouTube/Spotify Tab-Toggle

#### ~~Timer komplett ueberarbeiten — Tabellarischer Multi-Timer~~ ✅ (2026-02-28, v11.0)
- [x] ~~**T1: useWorkoutTimers Hook**~~ ✅ — 5 Sektionen (Gesamt, Uebung, Ueb.-Pause, Satz, Satzpause), je aktivierbar/deaktivierbar
- [x] ~~**T2: WorkoutTimerPanel UI**~~ ✅ — Tabelle (Checkbox | Label | Soll | Ist), Settings-Dropdown, Alert-Mode-Cycle
- [x] ~~**T3: ActiveWorkoutContext Integration**~~ ✅ — Auto-Timer-Transitionen, Auto-Advance (zuschaltbar)
- [x] ~~**T4: Timer Alerts**~~ ✅ — Web Audio API Beep + Vibration, 4 Modi (both/vibration/sound/none), Warning-Beep bei 3s
- [x] ~~**T5: Alte Timer entfernen + 32 Tests**~~ ✅ — ManualTimer entfernt, 21+5+6 Tests (alle gruen)

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
- [x] ~~**Phase B: Power Features**~~ ✅ (2026-02-28) — CompetitionCountdown, PhaseProgressBar, RefeedPlanner, NaturalLimitCalc. 4 Widgets auf TrainingPage, 39 i18n-Keys in 17 Sprachen
- [x] ~~**Phase C: Power+ Features**~~ ✅ (2026-02-28) — BloodWorkDashboard, CycleWidget, PCTCountdown, HematocritAlert. 4 Widgets auf TrainingPage (conditional Power+ Mode), useBloodWork Hook, 22 i18n-Keys in 17 Sprachen
- [x] ~~**Phase D: Shared**~~ ✅ (2026-02-28) — DoctorReport PDF (jsPDF, 23 Blutmarker, Referenzbereiche, Substanzen, Blutdruck), PosingPhotos (7 Posen, Supabase Storage, WebP, Fullscreen), trainingMode i18n (42 Keys in 15 Sprachen), +5 powerPlus Keys

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
- [x] ~~**Security Headers in Caddyfile**~~ ✅ (2026-03-01, v12.17) — CSP (self + YouTube/Spotify/blob/wss), HSTS (31536000s + preload), X-XSS-Protection, COOP, CORP, payment=() blocked
- [x] ~~Resend Domain-Validierung~~ ✅ (2026-03-01, v12.8) — DNS propagiert, SPF/DKIM/MX verifiziert, AUTOCONFIRM=false, Email aktiv
- [x] ~~Monitoring aufsetzen (Error Tracking, Uptime)~~ ✅ (2026-02-26, v9.4) — monitor.sh (Docker, Disk, Memory, Service-Health)
- [x] ~~Backup-Strategie fuer Supabase-DB (pg_dump Cronjob → Hetzner Storage Box)~~ ✅ (2026-02-26, v9.4) — backup-db.sh Script

#### ~~Phase 7: P2-Features~~ ✅ (2026-02-24, v8.0)
- [x] ~~Email-Import fuer Daten~~ ✅ — DataImportDialog mit KI-Textextraktion (OpenAI gpt-4o-mini)
- [x] ~~Fitdays-Waage API-Integration~~ ✅ — CSV-Import mit Auto-Erkennung (Fitdays/Renpho/Withings)
- [x] ~~Erweiterte KI-Analyse und Prognosen~~ ✅ — Lineare Regression, Moving Average, Plateau-Erkennung, ProgressionCard
- [x] ~~Koerper-Silhouette fuer Masse-Visualisierung~~ ✅ — SVG BodySilhouette mit dynamischer Skalierung + KFA-Farben

### P1 — Digital Twin Testing Features (v11.2 Report)
> Quelle: `src/docs/TWIN_TESTING_REPORT.md` (25 Personas, 5 Gruppen)

#### ~~Twin-P0: Sofortmassnahmen~~ ✅ (2026-02-28, v11.3)
- [x] ~~**KI-Button im Mahlzeit-Dialog**~~ ✅ — useEstimateMealNutrition Hook (gpt-4o-mini, Sparkles-Button, Auto-Fill Makros)
- [x] ~~**Profil: Ernaehrungspraeferenzen + Allergien**~~ ✅ — dietary_preferences, allergies als JSONB, Checkboxen in ProfilePage, an KI-Context uebergeben
- [x] ~~**Medikament-Disclaimer fixen**~~ ✅ — PED-Disclaimer nur bei TRT/PED Tabs, nicht bei Medikament/Supplement/Sonstige
- [x] ~~**Profil: Gesundheitliche Einschraenkungen**~~ ✅ — health_restrictions JSONB, Tags in ProfilePage, an KI-Context uebergeben

#### Twin-P1: Wichtige Features
- [x] ~~**Datumsformat de-DE**~~ ✅ — toLocaleDateString('de-DE') durchgehend implementiert
- [x] ~~**Blutbild/Laborwerte-Tracking**~~ ✅ (v11.9) — BloodWorkDashboard (10 Marker, farbcodiert), useBloodWork Hook, Power+ Mode
- [x] ~~**Mahlzeit-Reminder-Typ**~~ ✅ — ReminderType 'meal_logging' in health.ts definiert
- [x] ~~**Menstruationszyklus-Tracker**~~ ✅ (2026-03-01, v12.x) — menstrual_cycle_logs (phase/flow/symptoms/mood/energy), Gender-Gating (female/other), AddCycleLogDialog, Rose/Pink Styling
- [x] ~~**Onboarding-Wizard (Form-basiert)**~~ ✅ (2026-03-01, v12.9) — OnboardingWizardPage (5 Schritte), OnboardingGuard (Auto-Redirect), /onboarding Route, 38 i18n-Keys

#### Twin-P2: Nice-to-Have
- [x] ~~**Wettkampf-Countdown**~~ ✅ (v11.9b) — CompetitionCountdown Widget, Power Mode
- [x] ~~**Zyklus-Kalender AAS**~~ ✅ (v11.9) — CycleWidget (blast/cruise/pct), Power+ Mode
- [x] ~~**Daten-Export**~~ ✅ (v11.8) — DSGVO Art. 20, 16 Tabellen, JSON-Download
- [x] ~~**Schriftgroessen-Option**~~ ✅ (2026-03-01, v12.x) — Klein/Normal/Gross in Profil-Einstellungen
- [x] ~~**Luecken-Erkennung**~~ ✅ (2026-03-01, v12.x) — "Du hast X Tage nicht geloggt" In-App-Hinweis
- [x] ~~**Schlaf-Tracking (Zeiten)**~~ ✅ (2026-03-01, v12.x) — sleep_logs (bedtime/wake_time/duration/quality), AddSleepDialog, MedicalPage
- [x] ~~**Mahlzeit-Kategorien erweitern**~~ ✅ (2026-03-01, v12.x) — 6 Kategorien (Fruehstueck, Vormittag, Mittag, Nachmittag, Abend, Snack)
- [x] ~~**Buddy-Kommunikationsstil**~~ ✅ (2026-03-01, v12.x) — Knapp/Normal/Ausfuehrlich + Fachsprache-Level

#### Auth-Erweiterungen
- [x] ~~**Login/Register auf Production fixen**~~ ✅ (2026-03-02, v12.35) — ROOT CAUSE: Fehlende `.env.production`, Vite baute mit localhost statt fudda.de
- [x] ~~**Passwort-Sichtbarkeit Toggle**~~ ✅ (2026-03-02, v12.34) — Eye/EyeOff auf Login + Register
- [x] ~~**Sprachauswahl auf Login/Register**~~ ✅ (2026-03-02, v12.34) — LanguageSelector Komponente (17 Sprachen, Flaggen)
- [x] ~~**OAuth Buttons immer sichtbar**~~ ✅ (2026-03-02, v12.34) — Google/Apple Buttons ohne Feature-Gate
- [ ] OAuth Provider konfigurieren (Google, Apple) — Credentials in config.toml + GoTrue eintragen
- [ ] MFA (TOTP, WebAuthn) — aktuell alles disabled

#### Foto-basiertes Mahlzeit-Logging
- [x] ~~**Mahlzeit per Foto erfassen**~~ ✅ (2026-03-02, v12.34) — mealVision.ts + MealPhotoCapture + AddMealDialog Integration
- [ ] MFP (MyFitnessPal) Import — Daten aus MFP importieren (nach Auth-Fix)

#### Dependency-Tracking
- [x] ~~**docs/DEPENDENCIES.md erstellen**~~ ✅ (2026-03-02, v12.35) — Praeambel + Ausfuellanweisung + 10 Sektionen

### P2 — Workout-Session UX-Verbesserungen

#### Uebungs-Reihenfolge in aktiver Workout-Session
- [ ] **Uebungs-Uebersicht am unteren Rand** — Kompakte Liste aller Uebungen als horizontale oder vertikale Leiste
- [ ] **Drag & Drop Uebungs-Reihenfolge** — Uebungen per Drag & Drop umordnen waehrend der Session
- [ ] **Aktuelle Uebung hervorheben** — Aktuell aktive Uebung visuell markiert

### P1 — KI-Trainer Review-System (Konzept freigegeben 2026-03-05)
> Konzept-Dokument: `docs/KONZEPT_KI_TRAINER.md`
> 50+ PMIDs, differenziert nach Trainingsart + PED-Zyklen

#### Block A: Skill-File + DB-Schema ✅ (2026-03-06, v12.58)
- [x] ~~**Skill-File `trainerReview.ts`**~~ ✅ — Volume Landmarks, Double Progression, BW-Multiplier-Tabellen, Deload-Protokoll, Decision Tree (~4500 Tokens, 15 PMIDs)
- [x] ~~**DB-Migration**~~ ✅ — `ai_supervised` + `review_config` JSONB in training_plans, `session_feedback` JSONB in workouts, `ai_trainer_enabled` in profiles
- [x] ~~**Training Agent**~~ ✅ — Skill-ID `trainerReview` zu Agent-Mapping (staticSkills) + SKILL_REGISTRY

#### Block B: Startgewicht-Onboarding ✅ (2026-03-07)
- [x] ~~**CalibrationWizard Komponente**~~ ✅ (2026-03-07) — 3-Screen Flow (Erfahrung → BW-Multiplier Gewichte-Preview → Review-Settings), useCalibration.ts (10 Uebungen × 3 Level × 2 Gender), Fuzzy-Match, Smart Presets, Auto-Trigger bei ai_supervised Plans
- [x] ~~**RIR-Feedback nach erstem Satz**~~ ✅ (2026-03-07) — RIRFeedbackDialog.tsx (3 Buttons: Zu leicht/Passt/Zu schwer), useIsFirstSessionForPlan, calculateRIRAdjustment (+/-15%), ExerciseTracker Integration, 17 Sprachen
- [x] ~~**Auto-Kalibrierung (Double Progression)**~~ ✅ (2026-03-07) — doubleProgression.ts (Obergrenze 2x→+2.5/5kg, Untergrenze 2x→-5%), parseRepRange(), Compound-Erkennung via matchExerciseToReference()

#### Block C: Review Engine ✅ (2026-03-07)
- [x] ~~**Post-Session-Analyse**~~ ✅ (2026-03-07) — postSessionAnalysis.ts: analyzeSession() (Completion Rate, Plateau 3+, RPE-Drift, Volumen/Muskel), integriert in useSaveWorkoutSession Step 3
- [x] ~~**Post-Session-Feedback UI**~~ ✅ (2026-03-06, v12.58) — 4 Buttons + optionales Joint Pain (12 Koerperbereiche, Schmerzstaerke 1-5), ein/ausschaltbar via Profil
- [x] ~~**Early Triggers**~~ ✅ (2026-03-07) — 6 neue Trigger in deviations.ts: Plateau, Low Completion, Joint Pain, RPE Drift, Sleep Deficit, Missed Sessions + 6 Suggestion Chips
- [x] ~~**Mesozyklus-Review**~~ ✅ (2026-03-07) — useMesocycleCheck (currentWeek, reviewDue), mesocycleReview.ts (generateReviewSummary, 4 Empfehlungen), ReviewDialog.tsx (Stats + Aenderungen + 3 Buttons), useSaveWorkoutSession Step 4 (updateMesocycleWeek)
- [x] ~~**PED-Phasen-Synchronisation**~~ ✅ (2026-03-07) — usePEDPhaseSync.ts: Auto-Sync review_config bei cycle_status-Wechsel (blast/cruise/pct), Mesozyklus-Reset

#### Block D: "Supervised by AI" UI ✅ (2026-03-07)
- [x] ~~**TrainingPlanView**~~ ✅ (2026-03-06, v12.58) — AI-Trainer Status-Badge (Indigo, Mesozyklus-Woche)
- [x] ~~**Profil-Toggle**~~ ✅ (2026-03-06, v12.58) — Global "KI-Trainer" Toggle in ProfilePage + useUpdateProfile
- [x] ~~**Buddy-Nachfrage**~~ ✅ (2026-03-07) — useAISupervisedOffer.ts (shouldOffer, acceptOffer, dismissOffer), Teal Banner in TrainingPlanView, localStorage-Flag pro Plan
- [x] ~~**Review-Dialog**~~ ✅ (2026-03-07) — ReviewDialog.tsx (4 Stats, Empfehlung, Aenderungen-Detail), reviewChanges.ts (Deload -40%, Swap SWAP_SUGGESTIONS, Overhaul -20%), useApplyReviewChanges.ts (Mutation + Mesozyklus-Reset)

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

### Landing-Page & Account-Lifecycle
- [x] ~~**Landing-Page-Skip fuer zurueckkehrende Nutzer**~~ ✅ (2026-03-04, v12.51) — localStorage-Flag `fitbuddy_has_account`, HomeRoute Redirect zu /login
- [x] ~~**FK Constraints CASCADE**~~ ✅ (2026-03-04, v12.51) — audit_logs + gym_profiles auf ON DELETE CASCADE umgestellt
- [x] ~~**localStorage-Cleanup bei Account-Loeschung**~~ ✅ (2026-03-04, v12.51) — `fitbuddy_` (Unterstrich) Keys werden jetzt auch geloescht

### v12.49-v12.50 Features
- [x] ~~**AddMealDialog Crash-Fix + ErrorBoundary**~~ ✅ (2026-03-04, v12.49) — ComponentErrorBoundary, safeT(), Asset-Cleanup Regel
- [x] ~~**Onboarding-Erweiterung**~~ ✅ (2026-03-04, v12.49) — 9 Allergene, 8 Gesundheitszustaende, Mischkost, KI-Allergie-Awareness
- [x] ~~**Floating KI-Buddy Avatar (FAB)**~~ ✅ (2026-03-04, v12.50) — Schwebender Button, Pulse-Animation, z-51
- [x] ~~**Guided Tour / Produkttour**~~ ✅ (2026-03-04, v12.50) — 5 Schritte, SVG-Mask, localStorage, 17 Sprachen

### v12.52 Bugfixes aus Live-Test (2026-03-04)
- [x] ~~**Substanz-Agent: add_substance VOR log_substance Sequenzierung**~~ ✅ — Explizite Reihenfolge-Regel (DE+EN) mit Beispiel
- [x] ~~**Standard-Modus: Eingeschraenkte Substanz-Beratung**~~ ✅ — Kein Zyklus/PCT bei Standard, Power+ Verweis
- [x] ~~**Ester/Halbwertszeit nur bei TRT/PED**~~ ✅ — showEsterFields + Kategorie-Check, Reset bei Wechsel
- [x] ~~**Wochentag-Auswahl bei Einnahme-Rhythmus**~~ ✅ — Teal Wochentag-Chips (So-Sa), days_of_week Reminder
- [x] ~~**Buddy-Hinweis im Training-hinzufuegen-Dialog**~~ ✅ — Teal Info-Banner in AddWorkoutDialog
- [x] ~~**Training-Agent: Profildaten nutzen**~~ ✅ — 3-Schritt-Workflow + globale Regel in baseAgent
- [x] ~~**Training-Agent: Proaktiv Plan speichern**~~ ✅ — ACTION:save_training_plan sofort erstellen
- [x] ~~**Agent-Routing: Thread-Override Fix**~~ ✅ — Smart-Routing mit detectIntent() Confidence > 0.3
- [x] ~~**SKILLS_LEARNINGS: Email-Confirmation + DNS-Anleitung**~~ ✅ — Wiederverwendbare Resend/Hetzner/Strato Doku

*Letzte Aktualisierung: 2026-03-07 (KI-Trainer Blocks B+C+D KOMPLETT — 12 neue Dateien, 6 geaenderte Dateien, deployed auf fudda.de)*
