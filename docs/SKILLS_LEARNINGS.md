# Skills, Learnings & Background Knowledge - FitBuddy App

> Sammlung von Erkenntnissen, Fachwissen und Learnings aus dem Projektverlauf.
> Wird kontinuierlich ergaenzt.

---

## A. Learnings aus Lovable-Prototyp

### Was funktioniert hat (uebernehmen)
1. **Conversational AI als Primaer-Interface** - Nutzer gibt natuerliche Sprache ein,
   KI parst die Daten. Extrem niedrige Einstiegshuerde.
2. **Chat-basierte Dateneingabe** - "Ich hatte einen Salat zum Mittag" statt
   komplexer Formulare. Nutzer liebt das.
3. **Teal/Emerald Farbschema** - Frisch, gesundheitsbezogen, modern
4. **Card-basiertes Dashboard** - Gute Uebersicht, Progress-Ringe motivieren
5. **Bottom Navigation** - Mobile-First funktioniert fuer Gym-Kontext
6. **Deutsche Lokalisierung** - Zielgruppe ist deutsch, App muss deutsch sein
7. **Breite Datenkategorien** - Nutzer will ALLES an einem Ort tracken

### Was NICHT funktioniert hat (vermeiden)
1. **Keine Datenpersistenz** - KRITISCH! Daten gingen beim Browser-Reload verloren.
   Lovable speicherte nur im Browser-Memory, nicht in der DB.
   **Learning:** DB-Anbindung von Tag 1, nicht nachtraeglich.
2. **Auth nachtraeglich** - Schema existiert, aber UI nutzt es nicht.
   **Learning:** Auth als ERSTES Feature implementieren.
3. **Lovable Cloud Abhaengigkeit** - KI-Buddy laeuft ueber Lovable Cloud.
   **Learning:** Eigene KI-Integration (austauschbares Provider-Interface).
4. **Inkrementeller Aufbau ohne Architektur** - Feature um Feature angefuegt ohne
   Gesamtplan. Fuehrte zu inkonsistenter Datenfluss-Architektur.
   **Learning:** Architektur ZUERST, dann implementieren.
5. **Push-Notifications nur bei offenem Browser** - Service Worker braucht
   Backend-Integration fuer echte Push-Notifications.
   **Learning:** Push-System braucht Server-seitigen Trigger.
6. **Sprach-Inkonsistenz** - Teils Deutsch, teils Englisch in UI und Code.
   **Learning:** i18n von Tag 1 (DE+EN), alle Texte ueber i18n-System.

### Lovable-spezifische Einschraenkungen
- Kein Zugriff auf Dateisystem (kein Export/Import)
- Lovable Cloud fuer KI = Vendor Lock-In
- Supabase-Integration war holprig (Migrationen schlugen fehl)
- Kein echtes Testing moeglich
- Keine Versionskontrolle der Aenderungen
- Credits aufgebraucht, kein Git-Push moeglich

---

## B. Fachliches Wissen (Domain)

### Nutzerprofil (korrigiert + bestaetigt)
- Nutzer nimmt **Wegovy** (Semaglutid 2,4 mg) - GLP-1-Rezeptoragonist
- Nutzer hat aerztlich verordnete **TRT** (Testosteron-Ersatztherapie)
- Nutzer verwendet zusaetzlich **supraphysiologisches Testosteron** (Performance Enhancement)
- Nutzer hat **Fitdays Smart-Waage**
- Nutzer misst regelmaessig Blutdruck
- Nutzer trainiert im Fitnessstudio (Krafttraining)
- Nutzer braucht Protokolle fuer Aerzte

### Substanzen-Wissen (relevant fuer App-Logik)
- **Wegovy (Semaglutid 2,4 mg):** Subkutane Injektion, woechentlich.
  Reduziert Appetit, beeinflusst Kalorienaufnahme.
  Tracking: Injektionsdatum, Dosis, Nebenwirkungen.
- **Testosteron (TRT, aerztlich verordnet):** Injektion (Enanthat/Cypionat).
  Beeinflusst Muskelaufbau, Koerperzusammensetzung, Blutbild.
  Tracking: Injektionsdatum, Dosis, Ester, Blutwerte.
- **Testosteron (supraphysiologisch):** App behandelt identisch zur TRT.
  Keine Unterscheidung in der UI, keine moralische Bewertung.
  Nutzer kann beliebige Substanzen mit eigenen Parametern anlegen.
- **Wechselwirkungen:** TRT + Wegovy beeinflussen Koerperzusammensetzung.
  Muessen in Empfehlungslogik einfliessen (z.B. Protein-Bedarf).
- **Blutdruck-Effekt:** Testosteron kann BP erhoehen (Erythrozytose, Wasserretention).
  App zeigt Trend-Warnung wenn BP ueber 3 Messungen steigt.

### Wissenschaftliche Grundlagen (Referenzdokument)
Alle Details in `docs/WISSENSCHAFTLICHE_GRUNDLAGEN.md`:
- **Naehrwerte:** Open Food Facts (primaer), BLS 4.0 (DE), USDA FDC (Fallback)
- **Kalorienverbrauch:** MET-Werte aus 2024 Adult Compendium (1.114 Aktivitaeten)
- **BMR:** Mifflin-St Jeor (Standard) + Katch-McArdle (wenn KFA bekannt)
- **TDEE:** PAL-Faktoren (WHO 2004) + MET-basierte praezise Berechnung
- **Blutdruck:** ESC/ESH Klassifikation (2023)
- **Protein:** Morton et al. (2018) Meta-Analyse: 1,6-2,2 g/kg fuer Kraftsport

### KI vs. Hardcode Entscheidung
**Hardcode** (deterministisch, schnell, offline-faehig):
- BMR-Berechnung (Mifflin-St Jeor, Katch-McArdle)
- TDEE-Berechnung (PAL + MET)
- Kalorien-Bilanz (Aufnahme - Verbrauch)
- Protein-Empfehlung (regelbasiert nach Trainingstyp)
- Blutdruck-Klassifikation (ESC/ESH-Tabelle)
- MET-Wert Lookup (Compendium-Tabelle)
- Trend-Warnung (regelbasiert)
- Pause-Empfehlung (NSCA/ACSM Richtlinien) → NEU v9.7

**KI (LLM)** (kreativer Mehrwert):
- Natuerliche Sprache parsen → strukturierte Daten
- Mahlzeit schaetzen wenn kein DB-Treffer
- Konversation fuehren (Buddy-Chat)
- Empfehlungen formulieren (personalisiert)
- Daten aus Freitext extrahieren
- Trainingsplan-Vorschlaege
- Screenshots/Fotos auswerten (Vision API)
- Produkt-Recherche (Web Search)

---

## C. Technisches Wissen

### Architektur-Entscheidungen (finalisiert v2.0, erweitert bis v10.0)
- **Frontend:** React 19 + Vite 7 + TypeScript 5.9 (feature-basierte Ordnerstruktur)
- **Styling:** Tailwind CSS v4 + shadcn/ui (New York Style, ab v10.0)
- **Backend:** Supabase Self-Hosted (Docker Compose auf Hetzner VPS)
- **State:** TanStack Query 5 (Server State) + React Context (UI State)
- **KI:** Austauschbares Provider-Interface (Claude/OpenAI/Ollama) + Edge Function Proxy
- **i18n:** Eigener Context mit DE/EN (~300 Schluessel, leichtgewichtig)
- **DB:** 17+ Tabellen mit RLS, 4 Public-Read Tabellen
- **Paketmanager:** npm (nicht Bun, breitere Kompatibilitaet)
- **Testing:** Vitest + React Testing Library (2.095 Tests, 46 Dateien)
- **Routing:** React Router v7 mit echten Seiten
- **Mobile:** Capacitor 8 (Local Notifications, Camera, Microphone)
- **Animations:** Framer Motion (Seitenuebergaenge, Interaktionen)
- **Charts:** Recharts 3 (Koerperverlauf, Trainings-Trends)
- **PDF:** jsPDF + jspdf-autotable (Trainingsplan-Export)
- **QR:** qrcode.react (Trainingsplan teilen)
- **Deployment:** Hetzner VPS CX33 (Nuernberg DE) + Caddy + Docker

### DB-Schema (17+ Tabellen, erweitert)
**User-Daten (mit RLS auth.uid() = user_id):**
profiles, meals, workouts, body_measurements, blood_pressure_logs,
substances, substance_logs, training_goals, reminders, reminder_logs,
training_plans, user_products, user_equipment, daily_checkins,
feedback, feature_requests, feature_votes, ai_usage_logs

**Public-Read (kein user_id Filter noetig):**
standard_products, equipment_catalog, gym_profiles, exercise_catalog

**Spezial:**
- training_plan_days — Cascading RLS ueber parent plan
- profiles — auth.uid() = id (PK ist User-ID)
- admin_user_stats — View: auth.users JOIN profiles

---

## E. Deployment & Infrastructure Learnings

### Hetzner VPS + Supabase Self-Hosted (v6.0+)

**Warum Self-Hosted statt Supabase Cloud:**
- **DSGVO Art. 9:** Gesundheitsdaten muessen in der EU bleiben
- **Kosten:** EUR 5,94/Mo statt $25+/Mo fuer Supabase Pro
- **Kontrolle:** Volle DB-Kontrolle, eigene Backups, eigene Domain
- **ANON_KEY:** Self-hosted ANON_KEY ist NICHT geheim (nur fuer RLS-basierte Zugriffe)

**Docker Compose Setup (11 Container):**
```
Caddy (Reverse Proxy + SSL + Static Files)
  → Kong (API Gateway)
    → GoTrue (Auth)
    → PostgREST (REST API)
    → Realtime (WebSockets)
    → Storage (File Upload)
    → Edge Functions (Deno Runtime)
    → Studio (Admin UI)
  → PostgreSQL 17 (Datenbank)
  → Meta (Metadata)
  → Analytics (Log-Backend)
```

**Caddy Konfiguration (Learnings):**
- `Cache-Control: no-cache, no-store` fuer index.html (IMMER neueste Version)
- `Cache-Control: public, max-age=31536000, immutable` fuer Assets (Vite-Hash)
- `Permissions-Policy: camera=(self), microphone=(self)` — NICHT blockieren!
  Blockierung verhindert Voice-Input und Screenshot-Import.
- www.fudda.de → fudda.de permanent redirect (SEO + Konsistenz)

**SSL/TLS:**
- Caddy macht automatisches Let's Encrypt (HTTP/2 + HTTP/3)
- Kein manuelles Zertifikat-Management noetig

**Backup:**
- `backup-db.sh` Cronjob: pg_dump → Hetzner Storage Box
- Taegliches Backup, 7-Tage Retention

**Monitoring:**
- `monitor.sh` Script: Docker-Status, Disk, Memory, Service-Health
- Manuell oder per Cron ausfuehrbar

### Email-System (Learnings)

**Zwei Email-Typen:**
1. **GoTrue-Emails** (automatisch via Supabase Auth):
   - Confirmation (nach Registrierung)
   - Recovery (Passwort zuruecksetzen)
   - → Gesendet ueber SMTP (Resend)

2. **Eigene Emails** (via Edge Function):
   - Welcome-Email (nach Account-Aktivierung)
   - → Gesendet ueber Resend HTTP API

**SMTP vs HTTP API:**
- GoTrue nutzt SMTP (in config.toml konfiguriert)
- Eigene Emails nutzen Resend HTTP API (flexibler, keine SMTP-Library noetig in Deno)

**Email-Idempotenz:**
- `welcome_email_sent_at` Spalte in profiles
- Frontend prueft VOR Edge Function Call
- Edge Function prueft NOCHMAL (Double-Check)
- Verhindert doppelte Emails bei mehrfachem Login

**Resend Domain-Validierung:**
- SPF + DKIM + DMARC Records bei DNS-Provider
- Domain muss bei Resend verifiziert sein fuer Production-Emails
- Free Plan: 100 Emails/Tag, 3.000/Monat — reicht fuer den Start

### DNS-Infrastruktur (Learnings v10.5)

**Strato als Domain-Registrar — Limitierungen:**
- Strato kann **keine CNAME-Records fuer Subdomains** setzen (nur A, MX, TXT)
- Resend braucht 3 DKIM-CNAME-Records → bei Strato NICHT moeglich
- Strato DNS-Verwaltung ist rudimentaer (kein API, kein Wildcard, kein SRV)
- **Learning:** Strato als Registrar behalten, aber DNS extern verwalten

**Hetzner DNS vs. Cloudflare — Entscheidung fuer Hetzner:**
- **Hetzner DNS:** Kostenlos, DSGVO-konform (DE), gleicher Anbieter wie VPS
  - Unterstuetzt: A, AAAA, CNAME, TXT, MX, SRV, CAA, NS — alles was Resend braucht
  - API vorhanden (REST), Web-Console (Angular-basiert)
  - Nameserver: hydrogen.ns.hetzner.com, oxygen.ns.hetzner.com, helium.ns.hetzner.de
- **Cloudflare:** Wurde verworfen weil:
  - US-Unternehmen → DSGVO-Problematik (Gesundheitsdaten!)
  - Proxy/CDN-Features nicht benoetigt (Caddy macht SSL + Caching)
  - Zusaetzlicher Anbieter = zusaetzliche Komplexitaet
  - Hetzner DNS reicht vollstaendig aus
- **Learning:** Bei DSGVO-sensiblen Projekten → gleicher Anbieter fuer DNS + VPS = einfacher + konform

**DNS-Umzug Strato → Hetzner (Technische Learnings):**
- Strato bleibt **Domain-Registrar**, nur NS-Delegation wird geaendert
- NS-Umstellung bei Strato: Formular `ns_form_private` mit 4 Nameserver-Feldern
- DNS-Propagation dauert bis 24h (Google DNS 8.8.8.8 zeigt alte Records waehrend Propagation)
- **Direkte Verifikation:** `nslookup -type=TXT send.fudda.de hydrogen.ns.hetzner.com` → prueft direkt am autoritativen NS
- **MX-Record Trailing Dot:** KRITISCH! Ohne abschliessenden Punkt (`.`) wird der Zone-Name angehaengt
  - Falsch: `feedback-smtp.eu-west-1.amazonses.com` → wird zu `feedback-smtp...com.fudda.de`
  - Richtig: `feedback-smtp.eu-west-1.amazonses.com.` → bleibt FQDN
  - **Learning:** MX- und CNAME-Werte IMMER mit Trailing Dot eingeben!

**Resend DNS-Records (was benoetigt wird):**
- **SPF** (TXT auf Subdomain `send`): `v=spf1 include:amazonses.com ~all`
- **DKIM** (TXT auf `resend._domainkey`): RSA Public Key
- **MX** (auf Subdomain `send`): Priority 10, `feedback-smtp.eu-west-1.amazonses.com.`
- Resend nutzt AWS SES (eu-west-1 Ireland) als Mail-Infrastruktur
- Verifizierung erst moeglich wenn DNS-Propagation abgeschlossen

### Git-Workflow (v10.0+)

**Branching-Strategie:**
- `master` = Production (Auto-Deploy auf fudda.de)
- `develop` = Aktive Entwicklung
- Feature-Branches optional fuer grosse Features

**CI/CD Pipeline:**
- CI laeuft auf push zu `master` UND `develop`
- Deploy nur bei push zu `master`
- Steps: npm ci → Lint → TypeCheck → Test → Build → Security-Check → rsync

**Deploy-Prozess:**
- rsync Frontend (dist/) → Hetzner /opt/fitbuddy/frontend/
- rsync Edge Functions → Hetzner /opt/fitbuddy/volumes/functions/
- rsync Migrationen → Hetzner /opt/fitbuddy/volumes/migrations/
- docker compose restart functions

---

## F. KI-Agenten Architektur (Learnings)

### Multi-Agent System (8 Agenten)
1. **Ernaehrungs-Agent** — Mahlzeiten tracken, Naehrwerte, Empfehlungen
2. **Trainer-Agent** — Trainingsplaene, Uebungen, Progression
3. **Substanzen-Agent** — Substanz-Tracking, Protokolle, Blutbild
4. **Analyse-Agent** — Trends, Prognosen, Plateau-Erkennung
5. **Beauty-Agent** — Aesthetische Eingriffe, Timing, Recovery
6. **Lifestyle-Agent** — Attraktivitaet, Psychologie, Wohlbefinden
7. **Medizin-Agent** — Blutdruck, Labor, Warnzeichen
8. **General-Agent** — Smalltalk, Routing, Tagesform

**Learning: Token-Budget ist entscheidend**
- gpt-4o-mini hat 128K Kontext, aber Kosten steigen mit Tokens
- Selektives Skill-Laden: Jeder Agent bekommt NUR relevante Skills
- Dynamic User Skills werden als Markdown generiert, nicht als JSON (kompakter)
- Daily Summary Skill fuer General-Agent: Minimal-Kontext statt alles laden

**Learning: Aktions-Parser statt freier Text**
- KI antwortet mit strukturierten ACTION-Blocks: `<<ACTION:save_meal|{...}>>`
- Regex-Parser im Frontend extrahiert Aktionen aus der Antwort
- Flexibler als JSON-Mode (KI kann natuerlichen Text UND Aktionen mischen)
- Fallback-Detektoren fuer verschiedene KI-Antwort-Formate

**Learning: Skill-Versioning ist wichtig**
- Jeder Skill hat: id, name, version (semver), updatedAt, sources[], changelog[]
- AgentResult enthaelt skillVersions — Transparenz welches Wissen genutzt wurde
- Ermoeglicht spaeteres A/B-Testing verschiedener Skill-Versionen

### Proaktive Agenten (Learnings)
- **Deviations Engine:** 12 Regeln fuer Abweichungserkennung
- **Tagesform-Abfrage:** Buddy fragt morgens nach Befinden
- **Kontext-Awareness:** Schlaf, Stress, Krankheit, Verletzung beruecksichtigen
- **Learning:** Proaktivitaet muss dosiert sein — zu viele Vorschlaege nerven

---

## G. UI/UX Learnings

### Navigation (v9.5 Redesign)
- **Von 8 auf 5 Items:** Cockpit / Ernaehrung / Training / Medizin / Profil
- **Learning:** Maximal 5 Bottom-Nav Items auf Mobile (Fitts's Law)
- **Buddy Chat:** Kein eigener Tab, sondern Inline-Overlay (Bottom-Sheet) auf jeder Seite
- **Learning:** Buddy als Overlay vermeidet Kontext-Verlust (Nutzer bleibt auf der Seite)

### Responsive Design (Learnings)
- **PageShell:** `max-w-lg md:max-w-2xl` — 512px auf Mobile, 672px auf Tablet
- **Learning:** Zu schmale max-width auf Tablet sieht leer aus (128px Margin bei max-w-lg auf 768px)
- **Touch-Targets:** Minimum 44x44px fuer interaktive Elemente
- **Viewport:** `maximum-scale=5.0` statt `user-scalable=no` — Accessibility!

### Accessibility (Lighthouse-Learnings)
- **Labels:** Jedes Input braucht `htmlFor` + `id` (nicht nur visuelles Label)
- **Kontrast:** `text-teal-600` auf weissem Hintergrund ist zu schwach → `text-teal-700`
- **Viewport:** `user-scalable=no` schaltet Zoom ab — schlecht fuer Sehbehinderte
- **ARIA:** `aria-live="assertive"` fuer Error-Meldungen (Screenreader liest vor)

### Workout-Session (Personal Trainer, Learnings)
- **Zwei Modi:** Set-by-Set (gefuehrt) vs Exercise-Overview (frei)
- **Rest Timer:** Global + pro-Uebung anpassbar
- **KI-Pause-Vorschlag:** Regelbasiert (NSCA/ACSM), KEIN LLM-Call noetig
  - Verbund-Uebung + schwere Last → 3-5 Min
  - Isolation + leichte Last → 30-60 Sek
  - Learning: Einfache Regeln schlagen KI fuer deterministische Aufgaben
- **Voice Commands:** Regex-basierter Parser, KEIN KI-Call
  - Muster-Reihenfolge wichtig: "80 kilo 10 reps" — Gewicht-zuerst Muster MUSS vor Reps-zuerst kommen
  - TTS-Feedback via speechSynthesis API (kostenlos, offline-faehig)
  - silenceTimeout: 2000ms fuer schnelle Reaktion
- **Musik-Player:** YouTube iframe-Einbettung, 4 kuratierte Playlists
  - Learning: YouTube API braucht kein API-Key fuer Embed
  - Autoplay-Policy: Audio startet erst nach User-Interaktion

---

## H. Testing-Strategie (Learnings)

### Test-Pyramide (2.095 Tests)
1. **Unit Tests (Kern):** Pure Functions, Berechnungen, Validierung
2. **Hook Tests:** React Hooks mit renderHook + MockProvider
3. **Component Tests:** React Testing Library (render, user events)
4. **Integration Tests:** Supabase-Client Mock + Datenfluss
5. **E2E Tests:** Kritische Flows (Login → Daten → Dashboard)
6. **i18n Tests:** 879 Tests fuer DE/EN Schluessel-Paritaet
7. **RLS Tests:** Policy-Coverage fuer alle 17+ Tabellen

**Learning: i18n-Tests finden mehr Bugs als erwartet**
- Fehlende Schluessel, leere Werte, falsche Umlaute
- 879 automatisierte Tests fangen Regressions sofort

**Learning: RLS-Tests als Sicherheitsnetz**
- Validierung dass ALLE User-Daten-Tabellen RLS haben
- DSGVO-Gesundheitsdaten nie in Public-Read Tabellen
- Cascading-Access (training_plan_days via parent plan)

**Learning: Mocks richtig strukturieren**
- Supabase-Client: Fluent API mocken (`.from().select().eq().single()`)
- TanStack Query: QueryClientProvider mit `defaultOptions: { queries: { retry: false } }`
- Router: MemoryRouter fuer Navigation-Tests

---

## I. Performance & Build (Learnings)

### Build-Groessen
- JS: ~2.374 KB (Warnung >500KB, aber akzeptabel fuer SPA)
- CSS: ~68 KB (inkl. shadcn/ui Theme-Variablen)
- HTML: ~0.9 KB

**Learning: Code-Splitting waere nuetzlich**
- Recharts (~500KB), Framer Motion (~200KB) koennten lazy-loaded werden
- Aktuell nicht kritisch (First Load unter 3s auf 4G)

### Tailwind CSS v4 (Learnings)
- **Kein tailwind.config.js** — alles ueber CSS (`@import`, `@theme`, `@plugin`)
- **@tailwindcss/vite** Plugin statt PostCSS
- **@theme inline** fuer CSS-Variablen (shadcn/ui Kompatibilitaet)
- **@plugin "tailwindcss-animate"** fuer Animationen
- Learning: v4 ist deutlich einfacher als v3 (weniger Config-Dateien)

### shadcn/ui (v10.0, Learnings)
- **Kein NPX init noetig** — manuelle Installation funktioniert gut
- **Radix UI Primitives:** Accessible by default (ARIA, Keyboard, Focus)
- **class-variance-authority (cva):** Saubere Varianten-Definition
- **Bestehende Custom-Komponenten bleiben** — shadcn/ui ergaenzt, ersetzt nicht
- Learning: shadcn/ui Komponenten sind Copy-Paste, kein npm-Package — volle Kontrolle

---

## J. Sicherheit & DSGVO (Learnings)

### API-Key Sicherheit
- OpenAI Key NIE im Frontend (nur in Edge Function ai-proxy)
- CI/CD Security-Check: grep nach `sk-proj-|sk-live-|sk-test-` im Build-Output
- ANON_KEY ist PUBLIC (absichtlich, fuer RLS-basierte Zugriffe)
- SERVICE_ROLE_KEY nur server-seitig (Edge Functions)

### RLS-Strategie
- Alle User-Daten: `auth.uid() = user_id`
- Profiles: `auth.uid() = id` (PK ist User-ID)
- Admin-Zugriff: `public.is_admin(auth.uid())` SECURITY DEFINER Function
- Storage: Folder-basierte Isolation `(storage.foldername(name))[1] = auth.uid()::text`

### DSGVO-Konformitaet
- **Art. 9:** Gesundheitsdaten (Blutdruck, Koerperanalyse, Substanzen) in DE gehostet
- **Kein US-Subprocessor** fuer Datenhaltung (Hetzner Nuernberg DE)
- **Disclaimer Modal:** Muss vor erster Nutzung akzeptiert werden
- **Loeschrecht:** Cascade-Delete via Foreign Keys
- Learning: Supabase Self-Hosted ist der einfachste Weg fuer DSGVO-konforme Health-Apps

---

## D. Quellen & Referenzen

### Projekt-Quellen
- Lovable Prompt-Historie: dokumentiert in `LOVABLE_ANALYSE.md`
- Lovable Published App: https://my-well-scan.lovable.app/
- GitHub Repo: TimoKoch1981/fitness-app
- Live Production: https://fudda.de

### Wissenschaftliche Quellen
- Frankenfield DC et al. (2005), J Am Diet Assoc, 105(5):775-789 (BMR-Formeln)
- Herrmann et al. (2024), J Sport Health Sci, 13(1):6-12 (MET Compendium)
- FAO/WHO/UNU (2004), Human Energy Requirements (PAL-Faktoren)
- Morton RW et al. (2018), Br J Sports Med, 52(6):376-384 (Protein)
- ESC/ESH Guidelines (2023), European Heart Journal (Blutdruck)
- Helms et al. (2014) - Kaloriendefizit/-ueberschuss Richtwerte
- Max Rubner-Institut (MRI), BLS 4.0 Dokumentation (Naehrwerte DE)
- NSCA Strength Training Guidelines (Rest Periods)
- ACSM Guidelines for Exercise Testing and Prescription
- Bhasin et al. (1996), NEJM — Testosterone dose-response
- Egner et al. (2013), J Physiol — Myonuclei & muscle memory
- Nielsen et al. (2023), JCEM — Myonuclei in ex-AAS users
- WADA Prohibited List 2025

---

*Letzte Aktualisierung: 2026-02-27*
*Version: 3.1 (+ DNS-Infrastruktur Learnings: Strato-Limitierung, Hetzner DNS vs. Cloudflare, MX Trailing Dot)*
