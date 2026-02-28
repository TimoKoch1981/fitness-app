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
- [ ] **E.1.4: AVV mit OpenAI abschliessen** (~2h) — OpenAI DPA unterschreiben, SCCs pruefen. MANUELL, kein Code.
- [ ] **E.1.5: AVV mit Hetzner pruefen** (~1h) — Hetzner Standard-AVV pruefen. MANUELL.
- [x] ~~**E.1.6: Account-Loeschung implementieren**~~ ✅ (2026-02-28, v11.4) — DB-Funktion delete_user_account() (SECURITY DEFINER, CASCADE), useDeleteAccount Hook, DeleteAccountDialog mit Bestaetigungswort, ProfilePage Button. 17 Sprachen. Commit: 025a5f7
- [x] ~~**E.1.7: Widerrufsrecht implementieren**~~ ✅ (2026-02-28, v11.4) — PrivacySettings Komponente, 3 Consent-Karten einzeln widerrufbar, ProfilePage integriert. 17 Sprachen. Commit: 284aade
- [ ] **E.1.8: DSFA dokumentieren** (~4-8h Doku) — Datenschutz-Folgenabschaetzung. MANUELL/Doku, kein Code.

**Phase 2 — Zeitnah (nach Launch):**
- [ ] **E.2.1: Datenexport-Funktion** (~4-6h Code) — DSGVO Art. 20 Portabilitaet. Export aller Nutzerdaten als JSON/CSV
- [ ] **E.2.2: KI-Disclaimer erweitern** (~1h) — "KI kann Fehler machen" bei jeder KI-Antwort
- [ ] **E.2.3: BP-Klassifikation kennzeichnen** (~1h) — "Informativ, keine Diagnose" bei Blutdruck-Anzeige
- [ ] **E.2.4: PED-Disclaimer verstaerken** (~1-2h) — Zusaetzlicher Warnhinweis bei jeder PED-Interaktion
- [ ] **E.2.5: Substanz-Agent System-Prompt haerten** (~1-2h) — Keine Dosierungsempfehlungen, keine Wirksamkeitsaussagen
- [ ] **E.2.7: Security Headers in Caddyfile** (~1h) — CSP, HSTS, X-Frame-Options, Referrer-Policy

#### Email & Registrierung
- [x] ~~**Resend als SMTP-Provider konfigurieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**Email-Confirmation aktivieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**site_url korrigieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**ResetPasswordPage implementieren**~~ ✅ (2026-02-21, v6.1)
- [x] ~~**Email-Templates anpassen**~~ ✅ (2026-02-21, v6.1)
- [ ] **Resend Domain-Validierung** — fudda.de bei Resend verifizieren (fuer Produktion)
  - Lokal: Emails gehen an Mailpit (SMTP disabled) ✅
  - Produktion: AUTOCONFIRM=true als Workaround ✅ (2026-02-27)
  - Registrierung funktioniert ohne Email-Bestaetigung ✅ (verifiziert 2026-02-27)
  - ~~**DNS von Strato zu Hetzner DNS umziehen**~~ ✅ (2026-02-27)
    - Hetzner DNS Zone erstellt (ID: 919094, Projekt: 13589003)
    - Strato Nameserver umgestellt auf: hydrogen.ns.hetzner.com, oxygen.ns.hetzner.com, helium.ns.hetzner.de
  - ~~**SPF, DKIM, MX Records eintragen**~~ ✅ (2026-02-27)
    - TXT: resend._domainkey → DKIM Public Key
    - TXT: send → v=spf1 include:amazonses.com ~all
    - MX: send → 10 feedback-smtp.eu-west-1.amazonses.com. (Trailing Dot Fix)
    - A: @ → 46.225.228.12, CNAME: www → fudda.de
  - **Naechster Schritt:** DNS-Propagation abwarten (bis 24h nach NS-Umstellung)
  - Dann: Resend Domain verifizieren (Restart klicken) + AUTOCONFIRM wieder auf false
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
> ~~Aktuell: 8 statische Skills mit ~1.200 Zeilen Fachwissen.~~
> **Stand v10.4:** 13 statische Skills mit ~1.900 Zeilen Fachwissen. 5 neue Skills hinzugefuegt.
> **Diskussionsbedarf:** Struktur, Quellen-Qualitaet, Fach-Tiefe, Token-Budget.

- [ ] **Konzeptionelle Diskussion** — Wie tief sollen Skills sein? Token-Budget vs. Qualitaet. RAG-Alternative? Skill-Versioning-Strategie.
- [x] ~~**Neuer Skill: Ernaehrungswissenschaft (nutritionScience)**~~ ✅ (2026-02-28) — 3 Spiegel-Artikel ausgewertet, 33 PMIDs, 9 Forscher (Michalsen, Longo, Blueher, Rubino, Stamatakis, Ekelund, Ding etc.), Themen: Langlebigkeit, Fasten 16:8, Adipositas-Neudefinition (Lancet 2025), VILPA, 10.000-Schritte-Mythos
- [ ] **Nutrition-Skill erweitern** — Mikronaehrstoffe, Meal-Timing, Sport-spezifische Ernaehrung, Diaet-Strategien (Cutting/Bulking), Alkohol-Impact, Hydration
- [ ] **Training-Skill erweitern** — Periodisierung (linear/undulierend/block), Deload-Wochen, RPE/RIR-Skala, Superkompensation, Aufwaermprogramme, Mobilitaet, Verletzungspraevention
- [ ] **Substances-Skill erweitern** — Blutbild-Interpretation (detailliert), Wechselwirkungen, Halbwertszeit-Kurven, Ester-Vergleich, Nebenwirkungs-Management
- [ ] **Analysis-Skill erweitern** — Plateau-Erkennung, Prognose-Modelle, Wochen-/Monats-Trends, Anomalie-Erkennung, Vergleich mit Referenzwerten
- [ ] **Medical-Skill erweitern** — Laborwerte-Referenzbereiche (detailliert), Sport-Kardiologie, Hormonspiegel-Interpretation, Schilddruese, Leber/Niere-Marker
- [ ] **Beauty/Lifestyle erweitern** — Mehr Studien-Referenzen, evidenzbasierte Empfehlungen, Timing-Tabellen
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
- [ ] **Onboarding-Wizard nach Registrierung** (~8h) — Gefuehrter 5-Schritt-Setup: Name → Alter/Groesse/Geschlecht/Gewicht → Ziel → Erfahrung/Modus → Equipment → Fertig. Aktuell: Leere Seiten, nur gelber Banner "Profil ausfuellen". Betroffene Twins: A1-A5, E2
  - WICHTIG: Geschlecht + Trainingsmodus muessen im Wizard abgefragt werden → steuert Feature-Sichtbarkeit (Zyklus-Tracker, Power+ Features etc.)
  - Modus-Erklaerung: Standard ("Allgemein"), Power ("Wettkampf, Natural"), Power+ ("Enhanced, Substanzen") mit kurzem Disclaimer
- [x] ~~**Cockpit: Keine Standard-Ziele ohne Profil**~~ ✅ (2026-02-28, v11.6) — profileComplete-Check (height+birth_date+weight), CTA-Card "Tagesziele einrichten" mit Profil-Link, Makro-Werte ohne Fortschrittsbalken/Verbleibend bei leerem Profil, Celebrations nur mit Profil, CalorieChart ohne Ziellinie. 17 Sprachen.

#### Geschlechts- und Modus-basierte Feature-Sichtbarkeit
- [x] ~~**Gender-basiertes Feature-Gating**~~ ✅ (2026-02-28, v11.4) — `useGenderFeatures()` Hook mit 12 Feature-Flags (CycleTracker, SymptomTracker, REDSWarning, Breastfeeding, DiastasisRecti, ProstateMarkers, MaleTestosteroneRef). Pattern: Analog useTrainingMode(). Commit: 6703b90
- [ ] **Modus-Erklaerung im Onboarding verbessern** (~1h) — TrainingModeSelector existiert (3 Karten mit Icons), aber wird erst im Profil gezeigt. Muss frueher kommen (Onboarding Schritt 4). Erklaerungstext erweitern: Was bedeutet Power+? Wer braucht das? Was wird freigeschaltet?

#### KI-Buddy Verbesserungen
- [x] ~~**Profil-Daten an KI-Context uebergeben**~~ ✅ (2026-02-28, v11.4) — Allergien (WARNING-Direktive), Ernaehrungsform, Gesundheitseinschraenkungen in generateProfileSkill() ergaenzt. Commit: 86c75b7
- [ ] **Proaktives Warnsystem** (~6h) — Buddy warnt nur wenn gefragt, nicht automatisch bei gefaehrlichen Mustern (Unterkalorisch, Uebertraining 7x/Woche, HDL<25, Hkt>52%). Braucht: Schwellenwert-Regeln + automatische Buddy-Nachrichten. Betroffene: A5, E1, D2, D4
- [ ] **Kontext-Persistence ueber Sessions** (~4h) — Buddy "vergisst" Praeferenzen zwischen Sessions (sessionStorage). Elena (A4, Vegetarierin) muss es jedes Mal neu sagen. Loesung: Profil-Daten + Chat-History aus DB laden. Betroffene: A4, E2, B4
- [ ] **Quellenangaben in Buddy-Antworten** (~3h) — Skills haben 73+ PMIDs, aber Buddy zitiert sie nie in Antworten. Petra (C5, Aerztin) erwartet Quellen. Loesung: Agent-Prompt erweitern → "Zitiere relevante PMIDs". Betroffene: C5, B2
- [ ] **Buddy-Kommunikationsstil** (~3h) — Einstellung: Knapp/Normal/Ausfuehrlich + Fachsprache-Level (Anfaenger/Fortgeschritten). Stefan (A1) braucht einfache Sprache, Dominik (C1) will Fachtiefe. Betroffene: A1, A3, C5

#### Sicherheitsrelevante Findings (aus Sektion 4 des Reports)
- [ ] **🔴 RED-S/Untergewicht-Warnsystem** (~4h) — Keine automatische Warnung bei BMI <18.5 ODER Kaloriendefizit >1000 kcal ODER <1200 kcal bei Frauen + hohes Volumen. Sarah (E1) koennte in gefaehrlich tiefes Defizit rutschen. Betroffene: E1, E4, B4
- [ ] **🟡 Rektusdiastase-Kontraindikations-Check** (~3h) — KI-Trainingsplaene enthalten keine Kontraindikations-Warnungen. Lena (E4) koennte Crunches im Plan bekommen. Loesung: Gesundheits-Tags → Trainingsplan-Filter (keine Crunches bei Rektusdiastase, keine Deadlifts bei Bandscheibe). Betroffene: E4, A2

#### Frauen-spezifische Features
> VORAUSSETZUNG: Gender-basiertes Feature-Gating (siehe oben). Features nur sichtbar wenn `gender === 'female'` oder `gender === 'other'`.

- [ ] **Menstruationszyklus-Tracker** (~10h) — Kein Zyklus-Tracking. Keine Korrelation Zyklus↔Leistung. Kein RED-S/FAT/Amenorrhoe-Warnsystem. Braucht: Phaseneingabe (Follikel/Luteal/Menstruation), Symptome, Leistungskorrelation-Graph. Nur sichtbar bei gender=female/other. Betroffene: E1-E5, B2, C3, C5
- [ ] **Symptom-Tracker (Hitzewallungen, Stimmung)** (~4h) — Nur Tagesform-Emoji. Katharina (E3) und Nina (E5) koennen Perimenopause-Symptome nicht loggen. Kein Korrelations-Dashboard. Nur sichtbar bei gender=female/other. Betroffene: E3, E5, C5
- [ ] **Stillzeit-Kalorienzuschlag** (~2h) — TDEE-Berechnung beruecksichtigt Stillen nicht (+300-500 kcal/Tag). Lena (E4) stillt noch. Braucht: Profil-Toggle "Stillend" → TDEE-Aufschlag. Nur bei gender=female. Betroffene: E4

#### Medizin-Erweiterungen
- [ ] **Blutbild/Laborwerte-Tracking** (~12h) — Nur Blutdruck wird getrackt. Keine Laborwerte (Testosteron, LH, FSH, Haematokrit, HDL, LDL, Leberwerte, PSA, IGF-1). Braucht: Vordefinierte Felder + Trends + Warnschwellen (Hkt>54%, HDL<25). Fuer Enhanced-User essentiell. Betroffene: D1-D5, C2, C5
- [ ] **Arztbericht-PDF-Export** (~6h) — Kein PDF-Arztbericht. Timo (D1) will strukturierten Report fuer seinen Arzt mit Substanzen, Blutdruck, Gewichtsverlauf, Blutwerten. Betroffene: D1, D3, C5

### P1 — UX/Gamification

#### Erfolgs-Lob fuer den Nutzer
- [ ] **Zwischen-Lob bei Erfolgen einbauen** — Nutzer soll bei Fortschritten aktiv gelobt werden. CelebrationProvider + CelebrationOverlay existieren bereits (Konfetti+Toast, 4 Level, 6 Kategorien) — nur Trigger fehlen!
  - Trainings-PRs (neues Maximalgewicht, mehr Reps)
  - Gewichtsverlust-Meilensteine (jedes kg, 5kg, 10kg)
  - Streak-Tage (7 Tage am Stueck trainiert, 30 Tage geloggt)
  - Kaloriendefizit eingehalten
  - Luecken-Erkennung: "Du hast 3 Tage nicht geloggt — alles OK?" (Re-Engagement)
  - Betroffene Twins: A5 (Gamification), A1 (Motivation), B3 (Re-Engagement)

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
- [ ] **Phase B: Power Features** — CompetitionCountdown, PhaseProgressBar, RefeedPlanner, NaturalLimitCalc
- [ ] **Phase C: Power+ Features** — BloodWorkDashboard, CycleWidget, PCTCountdown, HematocritAlert
- [ ] **Phase D: Shared** — DoctorReport PDF, PosingPhotos, i18n trainingMode Keys fuer 15 Sprachen, Tests

### P2 — Digital-Twin-Testing Findings (Nice-to-Have)
> Aus Sektion 3 des TWIN_TESTING_REPORT.md — Priorisierte Feature-Requests P2

- [ ] **Wettkampf-Countdown Widget** (~6h) — Zieldatum → Dashboard-Widget mit Tagen bis Wettkampf, Phase-Tracker. Dominik (C1), Sarah (E1), Viktor (D2). Competition-Skill hat Wissen, aber kein UI.
- [ ] **Blast/Cruise/PCT-Zyklus-Kalender** (~8h) — Visuelle Timeline fuer AAS-Phasen, Clearance-Timer, Blutbild-Faelligkeiten. Betroffene: D2, D4, D5
- [ ] **CSV-Export eigener Daten** (~4h) — Mahlzeiten, Training, Koerper, Substanzen als CSV/JSON Download. Thomas (B1) will Daten exportieren. Kein DSGVO-Datenportabilitaet ohne Export.
- [ ] **Schriftgroessen-Option** (~2h) — Klein/Normal/Gross in Profil-Einstellungen. Ralf (B5, technik-scheu) braucht grosse Schrift.
- [ ] **Schlaf-Tracking (Zeiten)** (~6h) — Einschlaf-/Aufwachzeit, Qualitaet (nicht nur Emoji). Korrelation mit Training. Betroffene: A4, E5, D4
- [ ] **Mahlzeit-Kategorien erweitern** (~2h) — 6 statt 4: Fruehstueck, Vormittag, Mittag, Nachmittag, Abend, Spaet. Dominik (C1) loggt 6 Mahlzeiten/Tag. Marco (B3) hat bei Schichtarbeit keine festen Zeiten.
- [ ] **Foto-basiertes Mahlzeit-Logging** (~8h) — Essen fotografieren → KI erkennt Mahlzeit → Auto-Fill Makros. Aylin (B4) fotografiert lieber statt zu wiegen. Braucht Vision-API Integration.
- [ ] **MFP-Import (MyFitnessPal)** (~6h) — CSV/API-Import von MyFitnessPal-Daten. Lisa (C3) trackt Ernaehrung dort. Kein einfacher Wechsel moeglich.
- [ ] **Prognose-Funktion** (~4h) — "In X Wochen erreichst du Y kg bei aktuellem Trend". Karim (A3) will sehen wann er 80kg erreicht. Lineare Regression existiert schon (ProgressionCard) — UI-Erweiterung.

### P2 — Technische Schulden

- [ ] **`tsc -b` Build-Fix** (~2h) — 52 pre-existing Language-Type-Errors seit 17-Sprachen-Expansion. `tsc --noEmit` = 0 Fehler, aber `tsc -b` (project references) hat 52 Fehler wegen `Language` Type (17 Werte) vs `{de: string; en: string}` Pattern.
- [ ] **Production-Deployment v11.3** — Neue Features (KI-Mahlzeit, Profil-Dietary, Timer, Musik, Spotify) auf fudda.de deployen
- [ ] **Production DB-Migration** — `20260228000001_profile_dietary_health.sql` auf Production anwenden
- [ ] **Code-TODO: baseAgent.ts:269** — `bodyHistory` Array hardcoded als `[]`, sollte aus BodyMeasurements Hook befuellt werden

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
- [ ] Resend Domain-Validierung (fudda.de — DNS umgezogen, wartet auf Propagation)
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

*Letzte Aktualisierung: 2026-02-28 (v11.3 — Twin-Testing-Findings komplett aufgenommen, Sofortmassnahmen erledigt, i18n 17 Sprachen ✅)*
