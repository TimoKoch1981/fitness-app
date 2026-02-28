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

### Chat-Trennung pro Agent (v10.7 Learnings)

**Learning: Agenten brauchen KEINE gemeinsame Chat-History**
- User-Kontext (Profil, Mahlzeiten, Koerperwerte, Substanzen, Trainingsplaene) kommt aus der DATENBANK, nicht aus der Chat-History
- 9 UserSkill-Generatoren (profile, nutrition_log, training_log, body_progress, substance_protocol, daily_summary, active_plan, known_products, available_equipment) liefern den Agenten personalisierten Kontext via System-Prompt
- Chat-History ist nur fuer den Konversationsfluss relevant — Trennung verliert kein Wissen

**Learning: setMessages-Kompatibilitaet bei Multi-Thread-Migration**
- Bestehender Code ruft ueberall `setMessages(prev => ...)` auf (sendMessage, clearAction, addSystemMessage)
- Loesung: `setMessages` als scoped Dispatch — operiert immer auf `threads[activeThread]`
- Dadurch bleiben ALLE bestehenden Hook-Internals ohne Aenderung funktional
- Backward-Compatibility > Clean-Architecture bei inkrementeller Migration

**Learning: Routing-Bypass muss fullContext bauen**
- `routeAndExecuteStream()` fuegt user-Message intern an conversationHistory an (Zeile 471-474 router.ts)
- `getAgent().executeStream()` erwartet die user-Message BEREITS in conversationHistory
- Loesung: `fullContext` mit appendierter User-Message fuer den Bypass-Pfad erstellen

**Learning: sessionStorage-Limit-Schutz (Max 50/Thread)**
- sessionStorage hat ~5MB Limit pro Origin
- 8 Threads × 50 Messages × ~2KB/Message = ~800KB — sicher unter dem Limit
- Truncation beim Laden: aelteste Messages werden entfernt

**Learning: Agent-Metadaten zentral halten**
- `agentDisplayConfig.ts` enthaelt ALLE UI-Metadaten (Name, Icon, Farbe, Greeting DE/EN)
- Entkoppelt von der Agent-Execution-Schicht (agents/index.ts → getAgent())
- Tabs, Header, Greeting, Avatar nutzen alle dieselbe Config-Quelle
- Spaeter erweiterbar: Agent-Beschreibungen, Beispiel-Prompts, Kategorien

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

---

## K. Digital Twins — Systematisches App-Testing mit Personas (v11.2/v11.3)

### Konzept: Was sind Digital Twins?

Digital Twins sind detaillierte, realistische Nutzer-Personas, die als systematische Test-Szenarios dienen. Jeder Twin simuliert einen konkreten Nutzertyp mit spezifischen Eigenschaften, Zielen, Einschraenkungen und Verhaltensmustern. Die Twins decken Edge Cases ab, die beim manuellen Testing uebersehen werden.

**Learning: Persona-basiertes Testing findet 3x mehr UX-Issues als Feature-basiertes Testing.**
Feature-basiertes Testing prueft: "Funktioniert der Mahlzeit-Dialog?" — beantwortet nur Funktionalitaet.
Persona-basiertes Testing fragt: "Kann Fatima (muslimisch, Ramadan-Fastende, Halal-Ernaehrung) die App sinnvoll nutzen?" — findet fehlende Features, UX-Luecken, Safety-Issues.

### Unsere Twin-Struktur (25 Personas, 5 Gruppen)

**Gruppe A: Einsteiger (5 Twins)**
| Twin | Alter | Fokus | Edge Cases |
|------|-------|-------|-----------|
| Stefan | 42, M | Abnehmen, Wegovy-Start | GLP-1 + Anfaenger, keine Sporterfahrung |
| Monika | 55, F | Wechseljahre, Osteoporose | HRT, Menopause, Knochengesundheit |
| Karim | 28, M | Ramadan, Halal | Zeitfenster-Ernaehrung, religioese Einschraenkungen |
| Elena | 35, F | Schwangerschaft, postpartum | Rektusdiastase, Stillen, Gewichtsschwankungen |
| Hassan | 60, M | Diabetes Typ 2, Bluthochdruck | Metformin, Multi-Medikation, Polypharmazie |

**Gruppe B: Fortgeschrittene (5 Twins)**
| Twin | Alter | Fokus | Edge Cases |
|------|-------|-------|-----------|
| Thomas | 38, M | Hypertrophie, Mealprep | 4.000 kcal, 6 Mahlzeiten/Tag, hohe Datenmenge |
| Julia | 29, F | Bikini-Fitness, Coaching | Wettkampfdiaet, extreme Defizite, Menstruationsverlust |
| Marco | 45, M | Marathon, Triathlon | Ausdauersport, MET-Werte, Periodisierung |
| Aylin | 32, F | Vegan, Crossfit | Pflanzliche Proteinquellen, B12, Eisen |
| Ralf | 50, M | Reha nach Hueft-OP | Bewegungseinschraenkung, stufenweise Steigerung |

**Gruppe C: Power-User (5 Twins)**
| Twin | Alter | Fokus | Edge Cases |
|------|-------|-------|-----------|
| Dominik | 30, M | Powerlifting, Wettkampf | Gewichtsklassen, Peaking, Taper |
| Nils | 27, M | Calisthenics, Minimalist | Koerpergewichtsuebungen, keine Geraete |
| Lisa | 34, F | Physiotherapeutin, Ruecken | Professionelles Verstaendnis, Fachbegriffe |
| Jan | 22, M | Student, Low Budget | Guenstige Ernaehrung, Hochschulsport |
| Petra | 48, F | Yoga, Achtsamkeit | Nicht-kompetitiv, Wohlbefinden statt Leistung |

**Gruppe D: Enhanced (5 Twins)**
| Twin | Alter | Fokus | Edge Cases |
|------|-------|-------|-----------|
| Timo | 43, M | TRT + PED, Bodybuilding | Substanz-Protokolle, Blutbild, Zyklen |
| Viktor | 35, M | Kraftdreikampf, Anabolika | Mehrere Substanzen, PCT, Leberbelastung |
| Alexander | 40, M | Anti-Aging, HGH | Peptide, Longevity, umfangreiches Blutbild |
| Kevin | 25, M | Erstcycler, unsicher | Disclaimer-relevanz, Safety-Warnungen, Haematokrit |
| Sergei | 38, M | Profisport, Compliance | WADA-Konformitaet, Nachweiszeiten |

**Gruppe E: Frauen mit Spezialanforderungen (5 Twins)**
| Twin | Alter | Fokus | Edge Cases |
|------|-------|-------|-----------|
| Sarah | 26, F | PCOS, Insulinresistenz | Hormonelle Ernaehrung, Zyklus-Tracking |
| Fatima | 30, F | Hijab-Fitness, Halal | Kulturelle Sensibilitaet, Ramadan |
| Katharina | 45, F | Brustkrebs-Ueberlebende | Tamoxifen, Lymphoedem, sanftes Training |
| Lena | 19, F | Esstoerung-Recovery | Trigger-Vermeidung, keine Kalorienzaehler-Obsession |
| Nina | 33, F | 3 Kinder, Zeitmangel | 15-Min-Workouts, Mahlzeit-Vereinfachung |

### Testing-Methodik (4-Phasen-Ansatz)

**Phase 1: Visuelle Inspektion (Screenshot + Accessibility Tree)**
- Dev-Server starten, Login mit Test-Account
- Jede Seite screenshotten (Cockpit, Ernaehrung, Training, Medizin, Profil, Buddy)
- Accessibility Tree lesen fuer unsichtbare Elemente
- **Pro Twin fragen:** "Kann dieser Nutzer mit DIESER Oberflaeche sein Ziel erreichen?"

**Phase 2: Source-Code-Analyse (Parallel)**
- Explore-Agent analysiert alle Feature-Bereiche (8 Kategorien)
- Pattern-Suche: Fehlende Felder, hardcodierte Werte, fehlende Validierungen
- Type-Definitions pruefen: Sind alle relevanten Datentypen abgedeckt?
- i18n-Abdeckung: Fehlen Keys fuer neue Features?

**Phase 3: Cross-Twin-Analyse (Findings-Matrix)**
- Jedes Finding wird nach Impact/Frequency/Twin-Betroffenheit bewertet
- **Kategorien:** UX-Issue, Safety-Issue, Feature-Request
- **Priorisierung:** P0 (blockierend), P1 (wichtig), P2 (nice-to-have)
- **Cross-References:** Welche Twins sind von welchem Issue betroffen?

**Phase 4: Sofort-Massnahmen + Langfristplan**
- Top-5 sofort implementierbare Fixes identifizieren
- Mittelfristige Features in TODO.md einplanen
- Langfristige Architektur-Entscheidungen dokumentieren

### Findings-Taxonomie (aus unserer ersten Runde)

**10 Kritische UX-Findings:**
1. Mahlzeit-Dialog nur manuell (keine KI-Schaetzung) → **Fix #1 erledigt**
2. Keine Allergie/Ernaehrungsform im Profil → **Fix #2+#4 erledigt**
3. PED-Disclaimer persisitert falsch → **Fix #3 erledigt**
4. Kein Onboarding-Wizard
5. Kein Zyklus-Tracking
6. Kein Laborwerte-Tracking
7. Datumsformat ISO statt de-DE → **Fix #9 erledigt**
8. Kein Mahlzeit-Reminder-Typ → **Fix #8 erledigt**
9. Buddy kennt Profil-Daten nicht (Allergien, Einschraenkungen)
10. Keine Barcode/Scan-Funktion fuer Lebensmittel

**5 Safety-Findings:**
1. Nutzer mit Allergien bekommen keine Warnungen bei Mahlzeiten
2. RED-S-Risiko (Relative Energy Deficiency in Sport) wird nicht erkannt
3. Rektusdiastase-Warnungen fehlen bei Bauchübungen
4. Haematokrit-Warnung fehlt bei PED-Nutzern
5. Esstoerung-sensibles UI fehlt (Kalorien-Obsession-Trigger)

**17 Feature-Requests (priorisiert P0-P2)**

### Key Learnings aus dem Twin-Testing

**Learning: Diversitaet der Twins ist entscheidend**
- 5 Gruppen × 5 Twins = 25 Perspektiven → deckt 80%+ der Nutzerbasis ab
- KRITISCH: Mindestens 1 Twin pro Hochrisiko-Kategorie (Schwangerschaft, Esstoerung, Polypharmazie)
- Kulturelle Diversitaet (Halal, Ramadan, Hijab) findet Features die westlich-zentriertes Testing uebersieht

**Learning: Safety-Findings kommen NUR durch Persona-Testing**
- "Kalorienzaehler triggert Esstoerung" → wird bei Feature-Testing nie gefunden
- "Haematokrit-Warnung fehlt" → nur relevant wenn man durch die Augen eines PED-Users schaut
- **Empfehlung:** Safety-Review SEPARAT von UX-Review durchfuehren

**Learning: Edge Cases definieren den Produktwert**
- Stefan (Anfaenger) testet Einstiegshuerde → Onboarding
- Elena (Schwangerschaft) testet Sicherheitsgrenzen → Disclaimers
- Lena (Esstoerung-Recovery) testet ethische Grenzen → Trigger-Vermeidung
- Kevin (Erstcycler) testet Rechtsgrenzen → Disclaimer + Warnungen

**Learning: Sofort-Massnahmen vs. Architektur-Entscheidungen trennen**
- Fix #3 (Disclaimer-Bug): 2 Zeilen Code → sofort
- Fix #1 (KI-Schaetzung): Neuer Hook + UI → 30 Min
- Zyklus-Tracking: Neue DB-Tabelle + UI + Agent-Integration → eigene Phase
- **Regel:** Alles unter 1 Stunde sofort fixen, Rest in Phasen planen

**Learning: Testing-Report als lebendes Dokument**
- TWIN_TESTING_REPORT.md wird nach jeder Runde aktualisiert
- Erledigte Fixes werden markiert, neue Findings ergaenzt
- Twins koennen spaeter fuer A/B-Testing oder User-Stories wiederverwendet werden

### Twin-Erstellung: Best Practices

**Jeder Twin braucht mindestens:**
1. **Demographie:** Alter, Geschlecht, Beruf, Lebenssituation
2. **Ziele:** Primaer + Sekundaer (z.B. "Abnehmen" + "Blutdruck senken")
3. **Erfahrung:** Fitness-Level, App-Erfahrung, Tech-Affnitaet
4. **Substanzen/Medikamente:** Alles was Tracking betrifft
5. **Medizinische Besonderheiten:** Allergien, Einschraenkungen, Vorerkrankungen
6. **Ernaehrung:** Praeferenzen, Restriktionen, Mahlzeiten-Muster
7. **Training:** Sportart, Frequenz, Equipment-Zugang
8. **Verhalten:** Nutzungshaeufigkeit, Eingabe-Stil (Chat vs Manual)
9. **Persoenlichkeit:** Motivation, Frustrationstoleranz, Datenschutz-Sensibilitaet
10. **Edge Cases:** Das Ungewoehnliche, das diese Person einzigartig macht

**Anti-Pattern: Homogene Twins**
- NICHT: 25 maennliche Kraftsportler zwischen 25-35
- SONDERN: Maximale Spreizung bei Alter, Geschlecht, Kultur, Fitness-Level, Gesundheit
- **Faustregel:** Wenn sich 2 Twins zu aehnlich fuehlen, einen ersetzen

---

## L. Musik & Timer (v11.0 Learnings)

### YouTube IFrame Player API
- **Script-Loading:** Dynamisch laden via `document.createElement('script')`, `window.onYouTubeIframeAPIReady` Callback
- **Autoplay-Policy:** Browser blockieren Audio ohne vorherige User-Interaktion
  - Playlist-Klick = Interaktion → erst danach `player.playVideo()`
  - **Learning:** NIE autoplay bei Audio — immer explizite User-Aktion abwarten
- **Player-Sichtbarkeit:** `w-0 h-0 opacity-0` verhindert Playback in manchen Browsern
  - **Fix:** Minimaler sichtbarer Player (Kompakt-Leiste), expandierbar
- **Error-Handling:** `onError` Event fuer eingebettete Videos die "embedding disabled" haben
  - Fallback-Nachricht anzeigen, nicht silent failen

### Multi-Timer-Architektur
- **5 unabhaengige Sektionen:** Total, Uebung, Uebungspause, Set, Setpause
- **useReducer statt useState:** Bei 5+ zusammenhaengenden States ist Reducer cleaner
- **Auto-Advance:** Optional (Toggle) — Default AN, aber abschaltbar
  - **Learning:** User wollen Kontrolle behalten, nicht von Automatismen ueberrascht werden
- **Timer-Alerts:** Web Audio API Beep-Generator (kein externer Sound noetig)
  - `new AudioContext()` + `OscillatorNode` = synthetischer Beep
  - Vibration API: `navigator.vibrate([200, 100, 200])` fuer haptisches Feedback
  - **Konfigurierbar:** Vibration/Sound/beides/nichts pro User-Praeferenz

### Spotify Web Playback SDK
- **Requires Premium:** Nicht-Premium-User bekommen Fehlermeldung — IMMER pruefen
- **OAuth Token Flow:** Client-seitig nur Authorization Code, Token-Exchange server-seitig (Edge Function)
- **TypeScript Declarations:** `declare namespace Spotify` mit `class Player` (nicht interface, sonst ESLint-Fehler)

---

## M. KI-Mahlzeit-Schaetzung (v11.3 Learnings)

### AI-Estimation-Pattern
- **System-Prompt mit Portionsgroessen-Richtwerten:** Fleisch 150g, Reis 200g, etc.
- **JSON-Output-Mode:** `response_format: { type: 'json_object' }` fuer strukturierte Antworten
- **Niedrige Temperature (0.1):** Konsistente, reproduzierbare Schaetzungen
- **Sanity-Check:** Ergebnis ablehnen wenn Kalorien <= 0 oder > 5000
- **Learning:** User muss WISSEN dass es eine Schaetzung ist → visuelles Feedback (lila Hintergrund, Hinweistext)
- **Learning:** "KI" als Button-Label reicht — Nutzer verstehen sofort was passiert
- **Proxy-only:** Funktioniert nur mit Cloud-Verbindung (ai-proxy Edge Function), kein Offline-Fallback

### Profil-Erweiterung (JSONB-Pattern)
- **JSONB statt TEXT[]:** Flexibler fuer spaetere Erweiterungen (z.B. Allergieschweregrad)
- **Chip-Auswahl statt Freitext:** Vordefinierte Optionen verhindern Tippfehler + ermoeglichen strukturierte Abfragen
- **Farbcodierung:** Teal (Ernaehrungsform), Orange (Allergien), Rot (Einschraenkungen) — visuell sofort unterscheidbar
- **Auto-Save:** Gleicher Debounce-Mechanismus wie bestehende Profil-Felder (800ms)

---

## N. i18n Multi-Language (v10.8+ Learnings)

### 17 Sprachen handhaben
- **Language-Type-Erweiterung:** `type Language = 'de' | 'en' | 'ar' | ... | 'zh'`
  - BRICHT alle Stellen die `language: 'de' | 'en'` erwarten
  - **Fix-Pattern:** `language === 'de' ? 'de' : 'en'` als Fallback fuer 2-Sprachen-Objekte
- **Wartungsaufwand:** Jeder neue i18n-Key muss in 17 Dateien eingefuegt werden
  - **Learning:** i18n-Keys frueh definieren, nicht nachtraeglich — Aufwand skaliert mit Sprachanzahl
- **tsc -b vs tsc --noEmit:** Unterschiedliches Verhalten bei Project References
  - `tsc --noEmit` kann erfolgreich sein wo `tsc -b` fehlschlaegt (strengere Checks im Build-Modus)

*Letzte Aktualisierung: 2026-02-28*
*Version: 4.0 (+ Digital Twins Testing, Musik & Timer, KI-Schaetzung, i18n Multi-Language)*
