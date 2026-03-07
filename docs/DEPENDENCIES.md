# DEPENDENCIES.md — FitBuddy Abhaengigkeitskarte

> **Version:** 1.0 | **Erstellt:** 2026-03-02 | **Letzte Aktualisierung:** 2026-03-02
>
> **Konzept:** Entworfen aus der Perspektive eines Software-Architekten, Programmierers
> und KI-Experten. Zweifach iteriert — erst Struktur, dann Detailtiefe.

---

## Praeambel

Dieses Dokument bildet die **zentrale Abhaengigkeitskarte** des FitBuddy-Projekts.
Es dokumentiert, welche Programmteile von welchen anderen Programmteilen abhaengen,
welche Konfigurationen zur Laufzeit benoetigt werden, und welche Ketten von
Abhaengigkeiten existieren, deren Bruch das System zum Stillstand bringt.

**Warum existiert dieses Dokument?**

Am 2026-02-28 wurde ein kritischer Production-Bug entdeckt: Der Vite-Build auf dem
Hetzner-Server wurde **ohne** `.env.production` ausgefuehrt. Dadurch hat Vite die
Fallback-Werte aus `src/lib/supabase.ts` eingebettet — konkret `http://localhost:54321`
statt `https://fudda.de`. Das Ergebnis: **Saemtliche Auth- und Datenoperationen auf
Production waren defekt**, obwohl der Server lief und alle Docker-Container gesund waren.

Dieser Bug war schwer zu diagnostizieren, weil:
- Kein Build-Fehler auftrat (Vite baut erfolgreich ohne .env)
- Kein Runtime-Fehler im Server-Log erschien (Anfragen gingen an localhost)
- Der Fehler erst im Browser sichtbar wurde (CORS, Connection Refused)
- Die Ursache (fehlende Datei) vom Symptom (Auth-Fehler) weit entfernt lag

**Dieses Dokument soll solche unsichtbaren Abhaengigkeitsketten sichtbar machen.**

---

## Ausfuellanweisung

> **PFLICHT:** Vor jeder Aenderung an diesem Dokument muessen alle Regeln
> in diesem Abschnitt gelesen und befolgt werden.

### Regel 1: Wann aktualisieren?

Dieses Dokument MUSS aktualisiert werden, wenn:

- [ ] Eine neue `.env`-Variable eingefuehrt wird
- [ ] Eine neue Datenbanktabelle oder Migration erstellt wird
- [ ] Eine neue Feature-Ordnerstruktur unter `src/features/` angelegt wird
- [ ] Ein neuer Provider/Context in `src/app/providers/` hinzukommt
- [ ] Eine neue Supabase Edge Function erstellt wird
- [ ] Ein neuer externer Service (API, SaaS) angebunden wird
- [ ] Eine bestehende Abhaengigkeit entfernt oder ersetzt wird
- [ ] Der Build- oder Deploy-Prozess geaendert wird
- [ ] Ein Docker-Service in `deploy/docker-compose.yml` hinzukommt/entfaellt

### Regel 2: Wie einen neuen Eintrag hinzufuegen?

1. **Abhaengigkeitskette identifizieren:** Was haengt von was ab? In welcher Richtung?
2. **Kritikalitaet bewerten:**
   - `KRITISCH` — Bruch fuehrt zu totalem Systemausfall (Auth, DB-Verbindung)
   - `HOCH` — Bruch deaktiviert ein ganzes Feature (KI-Chat, Mahlzeiten-Tracking)
   - `MITTEL` — Bruch verursacht Funktionseinschraenkung (Diagramme, PDF-Export)
   - `NIEDRIG` — Bruch ist kosmetisch oder hat Workaround (Animationen, Sprache)
3. **Symptom bei Bruch dokumentieren:** Was passiert sichtbar, wenn die Abhaengigkeit bricht?
4. **Diagnose-Hinweis geben:** Wie erkennt man die Ursache?
5. **ASCII-Diagramme verwenden:** Keine Bilder, keine Mermaid — nur reiner ASCII-Text.

### Regel 3: Format-Konventionen

- Dateinamen und Pfade: Backticks verwenden (`src/lib/supabase.ts`)
- Umgebungsvariablen: GROSSBUCHSTABEN in Backticks (`VITE_SUPABASE_URL`)
- Abhaengigkeitsrichtung: Pfeil von Abhaengigem zum Abhaengigkeitsziel
  `A --> B` bedeutet "A haengt von B ab" / "A braucht B"
- Kritikalitaetslabel immer in eckigen Klammern: `[KRITISCH]`

### Regel 4: Pruefung nach Aktualisierung

Nach jeder Aenderung an diesem Dokument:

1. Pruefen: Sind alle Pfade noch korrekt? (Dateien umbenannt? Verschoben?)
2. Pruefen: Stimmen die Env-Variablen-Namen noch mit `.env.local` / `.env.production` ueberein?
3. Pruefen: Sind neue DB-Tabellen aus Migrationen eingetragen?
4. Pruefen: Stimmt die Provider-Reihenfolge in `App.tsx` noch?
5. FORTSCHRITT.md und TODO.md ebenfalls aktualisieren.

---

## 1. Architektur-Uebersicht

```
    ┌─────────────────────────────────────────────────────────────────────┐
    │                         BROWSER / CAPACITOR                         │
    │                                                                     │
    │  index.html                                                         │
    │    └── main.tsx                                                     │
    │          └── App.tsx                                                │
    │                │                                                    │
    │                ▼                                                    │
    │  ┌─── Provider-Kette (verschachtelt, Reihenfolge kritisch!) ────┐  │
    │  │  QueryProvider                                                │  │
    │  │    └── I18nProvider                                           │  │
    │  │          └── AuthProvider ←──── supabase.ts ←── .env          │  │
    │  │                └── BuddyChatProvider                          │  │
    │  │                      └── BrowserRouter                        │  │
    │  │                            └── NotificationSchedulerProvider  │  │
    │  │                                  └── CelebrationProvider      │  │
    │  │                                        └── InlineBuddyChat   │  │
    │  │                                              └── AppRoutes   │  │
    │  └───────────────────────────────────────────────────────────────┘  │
    │                │                                                    │
    │                ▼                                                    │
    │  ┌─── Pages ────────────────────────────────────────────────────┐  │
    │  │  Cockpit | Nutrition | Training | Medical | Profile | Buddy  │  │
    │  │  Onboarding | Admin | Auth (Login/Register/Reset/Callback)   │  │
    │  └──────────────────────────┬───────────────────────────────────┘  │
    │                             │                                      │
    │                             ▼                                      │
    │  ┌─── Features ─────────────────────────────────────────────────┐  │
    │  │  auth | buddy | meals | medical | workouts | nutrition       │  │
    │  │  sleep | body | equipment | notifications | celebrations     │  │
    │  │  admin | feedback | import | reminders | reports | share     │  │
    │  └──────────────────────────┬───────────────────────────────────┘  │
    │                             │                                      │
    │                             ▼                                      │
    │  ┌─── Shared Layer ─────────────────────────────────────────────┐  │
    │  │  shared/components | shared/hooks | shared/ui                 │  │
    │  │  lib/calculations | lib/validation | lib/utils | lib/data     │  │
    │  │  lib/ai (Provider Interface) | i18n (17 Sprachen)            │  │
    │  └──────────────────────────┬───────────────────────────────────┘  │
    │                             │                                      │
    │                             ▼                                      │
    │  ┌─── Supabase Client SDK ──────────────────────────────────────┐  │
    │  │  lib/supabase.ts ←── VITE_SUPABASE_URL + VITE_SUPABASE_     │  │
    │  │                      ANON_KEY aus .env.local/.env.production  │  │
    │  └──────────────────────────┬───────────────────────────────────┘  │
    └─────────────────────────────┼───────────────────────────────────────┘
                                  │ HTTPS / WSS
                                  ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                    HETZNER VPS (fudda.de)                           │
    │                                                                     │
    │  Caddy (SSL/Reverse Proxy) ──→ Kong (API Gateway)                  │
    │         │                          │                                │
    │         ▼                          ├──→ GoTrue (Auth)               │
    │    /srv/frontend (SPA)             ├──→ PostgREST (REST API)        │
    │                                    ├──→ Edge Functions (ai-proxy)   │
    │                                    ├──→ Realtime (WebSocket)        │
    │                                    └──→ Storage (Dateien)           │
    │                                                                     │
    │  PostgreSQL (30 Tabellen + RLS) ←── alle Services                  │
    │  Meta (Kong Config) | Studio (nur SSH-Tunnel :3000)                │
    └──────────────────────────────────────────┬──────────────────────────┘
                                               │
                                               ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                     EXTERNE SERVICES                                │
    │                                                                     │
    │  OpenAI API (gpt-4o-mini) ←── ai-proxy Edge Function               │
    │  Open Food Facts API ←── Vite Dev Proxy / direkter Aufruf          │
    │  Resend (SMTP/Email) ←── GoTrue Mailer                             │
    │  Hetzner DNS ←── fudda.de A/CNAME/MX/TXT Records                  │
    │  Let's Encrypt ←── Caddy (automatisch)                             │
    └─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Kritische Abhaengigkeitsketten

### 2.1 Die .env-Kette [KRITISCH]

Dies ist die Kette, die den Production-Bug vom 2026-02-28 verursacht hat.

```
.env.production (oder .env.local fuer Entwicklung)
    │
    │  Vite liest VITE_*-Variablen zur BUILD-Zeit (nicht Runtime!)
    │  und ersetzt import.meta.env.VITE_* durch String-Literale
    │
    ▼
src/lib/supabase.ts
    │  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'
    │  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    │
    │  ACHTUNG: Ohne .env.production wird 'http://localhost:54321' eingebettet!
    │
    ▼
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
    │
    ├──→ AuthProvider.tsx (signIn, signUp, signOut, OAuth, MFA)
    ├──→ useProfile.ts (Profildaten laden/speichern)
    ├──→ useMeals hooks (Mahlzeiten CRUD)
    ├──→ useBodyLogs hooks (Koerperdaten)
    ├──→ useBloodPressure hooks (Blutdruck)
    ├──→ useSleepLogs hooks (Schlaf-Tracking)
    ├──→ useMenstrualCycle hooks (Zyklus-Tracker)
    ├──→ useSymptomLogs hooks (Symptom-Tracker)
    ├──→ useBloodWork hooks (Blutwerte)
    ├──→ useWorkouts hooks (Training)
    ├──→ useEquipment hooks (Geraete)
    ├──→ useFeedback hooks (Feedback-System)
    ├──→ useAvatar hooks (Profilbild)
    ├──→ useChatHistory hooks (Buddy Chat Persistenz)
    ├──→ useDataExport hooks (DSGVO Art. 20)
    ├──→ useDeleteAccount hooks (DSGVO Loeschung)
    └──→ JEDER Hook, der supabase.from() oder supabase.auth aufruft
```

**Symptom bei Bruch:** Auth-Fehler (CORS/Connection Refused), keine Daten ladbar,
Login/Register funktioniert nicht. Kein Build-Fehler!

**Diagnose:** Browser DevTools > Network: Anfragen gehen an `localhost:54321` statt
`https://fudda.de`. → `.env.production` fehlt oder ist leer.

### 2.2 Benoetigte Umgebungsvariablen

| Variable | Datei | Kritikalitaet | Fallback | Beschreibung |
|----------|-------|---------------|----------|-------------|
| `VITE_SUPABASE_URL` | `.env.production` / `.env.local` | KRITISCH | `http://localhost:54321` | Supabase-API-Endpunkt |
| `VITE_SUPABASE_ANON_KEY` | `.env.production` / `.env.local` | KRITISCH | `''` (leer) | Supabase Anonymous Key |
| `VITE_AI_PROVIDER` | `.env.local` | MITTEL | Auto-Detect (cloud→supabase, lokal→openai) | KI-Provider-Auswahl |
| `VITE_OPENAI_API_KEY` | `.env.local` | MITTEL | `''` → Fallback zu Ollama | OpenAI API Key (nur lokal) |
| `VITE_OPENAI_MODEL` | `.env.local` | NIEDRIG | `gpt-4o-mini` | OpenAI Modell |
| `VITE_OLLAMA_URL` | `.env.local` | NIEDRIG | `http://localhost:11434` | Ollama-URL (nur lokal) |
| `VITE_OLLAMA_MODEL` | `.env.local` | NIEDRIG | `llama3.1:8b` | Ollama Modell |

**WICHTIG:** Vite-Variablen (Praefix `VITE_`) werden zur **Build-Zeit** eingebettet,
nicht zur Laufzeit gelesen. Ein Neustart des Servers reicht nicht — es muss **neu gebaut**
werden (`npm run build`).

### 2.3 Die Auth-Kette [KRITISCH]

```
.env.production
    │  VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
    ▼
src/lib/supabase.ts
    │  createClient()
    ▼
src/app/providers/AuthProvider.tsx
    │  supabase.auth.onAuthStateChange()
    │  supabase.auth.signInWithPassword()
    │  supabase.auth.signUp()
    │  supabase.auth.signInWithOAuth()
    ▼
    ├──→ ProtectedRoute.tsx (prueft user !== null)
    │        └──→ OnboardingGuard.tsx (prueft Profil-Vollstaendigkeit)
    │                └──→ Alle geschuetzten Pages
    │
    ├──→ useProfile.ts (supabase.from('profiles'))
    │        └──→ ProfilePage, CockpitPage, OnboardingWizard
    │
    └──→ useMFA.ts (supabase.auth.mfa.*)
             └──→ MFASettings, MFASetupDialog, MFAVerificationDialog
```

**Server-Seite (Docker):**

```
docker-compose.yml
    │
    ▼
GoTrue Container (supabase/gotrue)
    │  GOTRUE_DB_DATABASE_URL ←── POSTGRES_PASSWORD aus .env
    │  GOTRUE_MAILER_AUTOCONFIRM=false
    │  GOTRUE_SMTP_HOST / GOTRUE_SMTP_PORT / GOTRUE_SMTP_USER / GOTRUE_SMTP_PASS
    │
    ├──→ Email-Verifizierung (Resend SMTP, Port 587)
    │        └──→ send-welcome-email Edge Function
    │
    ├──→ OAuth Providers (Google, Apple)
    │        └──→ GOTRUE_EXTERNAL_GOOGLE_* / GOTRUE_EXTERNAL_APPLE_*
    │
    └──→ JWT-Tokens (ANON_KEY / SERVICE_ROLE_KEY aus .env)
             └──→ Kong (API Gateway) validiert JWT
                    └──→ PostgREST / Storage / Realtime
```

**Symptom bei Bruch:** Login-Fehler, "Invalid credentials", Email kommt nicht an,
OAuth-Redirect scheitert, Passwort-Reset-Link ungueltig.

### 2.4 Die Build-zu-Production-Kette [KRITISCH]

```
Entwickler-Rechner (oder CI)
    │
    │  npm run build
    │  = tsc -b && vite build
    │
    ├── tsc -b: TypeScript-Kompilierung (tsconfig.json → tsconfig.app.json)
    │     └── Fehler hier → Build bricht ab (gut, sichtbar)
    │
    └── vite build: Bundling + .env-Einbettung
          │
          │  LIEST: .env.production (oder .env, .env.local je nach Mode)
          │  ERSETZT: import.meta.env.VITE_* durch String-Literale
          │
          ▼
        dist/
          │  index.html + assets/*.js + assets/*.css
          │
          │  scp / rsync / deploy-frontend.sh
          │
          ▼
        Hetzner VPS: /opt/fitbuddy/deploy/frontend/
          │
          │  Caddy liest aus /srv/frontend (Volume-Mount)
          │
          ▼
        https://fudda.de (Browser laedt SPA)
```

**GEFAHR:** Wenn `vite build` ohne `.env.production` laeuft, werden Fallback-Werte
(`localhost:54321`) in die JS-Bundles eingebrannt. Der Build **erscheint erfolgreich**.
Der Fehler zeigt sich erst zur Laufzeit im Browser.

---

## 3. Feature-Abhaengigkeiten

### 3.1 Feature-zu-Shared-Module-Matrix

| Feature | supabase.ts | AuthProvider | i18n | lib/calculations | lib/ai | lib/validation | TanStack Query |
|---------|:-----------:|:------------:|:----:|:----------------:|:------:|:--------------:|:--------------:|
| auth | X | X | X | - | - | X | X |
| buddy | X | X | X | - | X | - | X |
| meals | X | X | X | X (Kalorien) | - | X | X |
| medical | X | X | X | X (BP, BMR) | - | X | X |
| workouts | X | X | X | X (TDEE) | X (Deviations) | - | X |
| nutrition | X | X | X | X (Protein) | - | - | X |
| sleep | X | X | X | - | - | - | X |
| body | X | X | X | X (BMI) | - | X | X |
| equipment | X | X | X | - | - | - | X |
| notifications | - | X | X | - | - | - | - |
| celebrations | - | X | X | - | - | - | - |
| admin | X | X (isAdmin) | X | - | - | - | X |
| feedback | X | X | X | - | - | - | X |
| reports | X | X | X | X (alle) | - | - | X |
| import | X | X | X | - | - | X | X |
| share | - | - | X | - | - | - | - |
| reminders | - | X | X | - | - | - | - |

### 3.2 Feature-interne Struktur (Muster)

Jedes Feature unter `src/features/{name}/` folgt diesem Muster:

```
src/features/{name}/
    ├── components/     ← React-Komponenten (UI)
    │     └── {Name}Dialog.tsx, {Name}Card.tsx, etc.
    │
    ├── hooks/          ← Business Logic + Supabase Queries
    │     └── use{Name}.ts
    │     Abhaengigkeit: supabase.ts, AuthProvider (user.id), TanStack Query
    │
    ├── lib/            ← (optional) Feature-spezifische Logik
    │     └── systemPrompt.ts (bei buddy), utils (bei medical)
    │
    └── utils/          ← (optional) Hilfsfunktionen
```

**Abhaengigkeitsregel:** Features duerfen von `shared/`, `lib/`, `i18n/` und
`app/providers/` importieren. Features duerfen **NICHT** direkt voneinander importieren
(Ausnahme: explizite Cross-Feature-Hooks ueber shared).

### 3.3 Provider-Reihenfolge [KRITISCH]

Die Provider in `App.tsx` sind verschachtelt. Die Reihenfolge ist **nicht beliebig** —
innere Provider koennen auf aeussere zugreifen, aber nicht umgekehrt.

```
1. QueryProvider (TanStack Query)        ← Grundlage fuer alle Queries
2.   └── I18nProvider                    ← Sprache, Schriftgroesse, Buddy-Einstellungen
3.         └── AuthProvider              ← User, Session, Auth-Methoden
4.               └── BuddyChatProvider   ← Chat-State, braucht Auth (user)
5.                     └── BrowserRouter ← Routing, braucht Auth fuer ProtectedRoute
6.                           └── NotificationSchedulerProvider
7.                                 └── CelebrationProvider
8.                                       └── InlineBuddyChatProvider
```

**Symptom bei falscher Reihenfolge:** `useAuth must be used within an AuthProvider`,
`useTranslation must be used within an I18nProvider`, oder aehnliche Context-Fehler.

---

## 4. Datenbank-Abhaengigkeiten

### 4.1 Tabellen-Uebersicht (30 Tabellen)

Die Tabellen sind ueber Migrationen in `supabase/migrations/` definiert.

```
auth.users (Supabase-intern, GoTrue)
    │
    │  ON DELETE CASCADE
    │
    ├──→ profiles (1:1, id = auth.users.id)
    │       Felder: display_name, height_cm, birth_date, gender,
    │               activity_level, daily_*_goal, preferred_*,
    │               ai_trainer_enabled (BOOL)
    │
    ├──→ meals (1:n, user_id)
    │       Felder: date, name, type, calories, protein, carbs, fat,
    │               fiber, sugar, sodium, meal_category, barcode, brand
    │
    ├──→ body_logs (1:n, user_id)
    │       Felder: date, weight_kg, body_fat_pct, muscle_mass_pct, ...
    │
    ├──→ blood_pressure_logs (1:n, user_id)
    │       Felder: date, systolic, diastolic, pulse, notes
    │
    ├──→ water_logs (1:n, user_id)
    │       Felder: date, glasses
    │
    ├──→ personal_goals (1:n, user_id)
    │       Felder: goal_type, target_value, deadline
    │
    ├──→ training_plans (1:n, user_id)
    │       Felder: name, description, exercises (JSONB),
    │               ai_supervised (BOOL), review_config (JSONB)
    │
    ├──→ workout_sessions (1:n, user_id)
    │       Felder: date, plan_id (FK→training_plans), exercises, duration,
    │               session_feedback (JSONB)
    │
    ├──→ user_products (1:n, user_id)
    │       Felder: barcode, name, brand, nutrition (JSONB)
    │
    ├──→ daily_checkin (1:n, user_id)
    │       Felder: date, mood, energy, stress, sleep_quality, notes
    │
    ├──→ user_equipment (1:n, user_id)
    │       Felder: equipment_id, owned_since
    │
    ├──→ feedback (1:n, user_id)
    │       Felder: type, title, description, status, votes
    │
    ├──→ blood_work (1:n, user_id)
    │       Felder: date, results (JSONB), notes
    │
    ├──→ sleep_logs (1:n, user_id)
    │       Felder: date, bedtime, wake_time, duration, quality
    │
    ├──→ menstrual_cycle_logs (1:n, user_id)
    │       Felder: date, phase, flow, symptoms, mood, energy
    │
    ├──→ symptom_logs (1:n, user_id)
    │       Felder: date, symptoms (JSONB), mood, energy
    │
    ├──→ buddy_context_notes (1:n, user_id)
    │       Felder: context_key, value, updated_at
    │
    ├──→ buddy_chat_messages (1:n, user_id)
    │       Felder: role, content, created_at
    │
    ├──→ audit_logs (1:n, user_id)
    │       Felder: action, table_name, record_id, old_data, new_data
    │
    └──→ user_consents (1:n, user_id)
            Felder: consent_type, granted, granted_at, revoked_at

Standalone-Tabellen (kein user_id FK):
    ├── brand_products (Produkt-Datenbank, Seed-Daten)
    ├── exercise_catalog (Uebungskatalog, Seed-Daten)
    ├── equipment_catalog (Geraetekatalog)
    └── admin_settings (Admin-Konfiguration)
```

### 4.2 RLS-Abhaengigkeiten [KRITISCH]

Jede Tabelle mit `user_id` hat Row Level Security (RLS) aktiviert.

```
RLS-Policies verwenden:  auth.uid()
                              │
                              ▼
                         GoTrue JWT-Token
                              │
                              ▼
                         ANON_KEY (signiert JWT)
                              │
                              ▼
                    .env auf Server (ANON_KEY, JWT_SECRET)
```

**Regel:** `auth.uid() = user_id` fuer SELECT, INSERT, UPDATE, DELETE.
Ohne gueltigen JWT-Token (= ohne Login) gibt PostgREST **leere Resultate** zurueck,
keinen Fehler! Das ist eine haeufige Fehlerquelle.

**Symptom bei RLS-Problem:** Daten werden gespeichert, aber nicht gelesen (oder umgekehrt).
Kein Fehler, nur leere Arrays. → Pruefen: Ist der User eingeloggt? Stimmt auth.uid()?

### 4.3 Trigger und Funktionen

| Trigger | Tabelle | Funktion | Beschreibung |
|---------|---------|----------|-------------|
| `on_auth_user_created` | `auth.users` | `handle_new_user()` | Erstellt automatisch `profiles`-Eintrag |
| `*_updated_at` | diverse | `update_updated_at()` | Setzt `updated_at` bei jeder Aenderung |
| `audit_*` (14 Trigger) | 14 Tabellen | `audit_log_trigger()` | Schreibt in `audit_logs` |
| `retention_cleanup` | diverse | `apply_retention_policy()` | DSGVO-Loeschkonzept |
| `delete_user_account` | `auth.users` | `delete_user_cascade()` | DSGVO-Loeschung (Art. 17) |

**Abhaengigkeit:** Alle Trigger laufen mit `SECURITY DEFINER` (= Superuser-Rechte).
Sie funktionieren unabhaengig von RLS-Policies, aber abhaengig von korrekter
DB-Verbindung (POSTGRES_PASSWORD in .env).

### 4.4 Migration-Reihenfolge

Migrationen werden in alphabetischer/chronologischer Reihenfolge ausgefuehrt.
Spaetere Migrationen koennen auf Tabellen aus frueheren zugreifen.

```
20260216000001_initial_schema.sql         ← Grundtabellen (profiles, meals, body_logs, ...)
20260217000001_training_plans.sql         ← training_plans
20260219000001_user_products.sql          ← user_products, brand_products
20260219000002_brand_products_seed.sql    ← Seed-Daten fuer brand_products
20260221000001_admin_dashboard.sql        ← admin_settings, admin-spezifische Views
20260221000002_equipment.sql              ← equipment_catalog, user_equipment
20260221000003_daily_checkin.sql          ← daily_checkin
20260222000001_exercise_catalog.sql       ← exercise_catalog
20260222000002_exercise_catalog_seed.sql  ← Seed: 200+ Uebungen
20260222000003_avatar.sql                 ← Avatar-Storage-Bucket + Policies
20260222000004_personal_goals.sql         ← personal_goals
20260224000001_disclaimer_accepted.sql    ← Disclaimer-Feld in profiles
20260225000001_feedback_system.sql        ← feedback + feature_votes
20260225000002_workout_sessions.sql       ← workout_sessions
20260226000001_welcome_email.sql          ← welcome_email_sent_at in profiles
20260227160000_training_mode_blood_work.sql ← training_mode, blood_work
20260228000001_profile_dietary_health.sql ← dietary/health Felder in profiles
20260228000002_granular_consent.sql       ← user_consents
20260228000003_delete_user_account.sql    ← delete_user_cascade Funktion
20260301000001_meal_categories_expand.sql ← meal_category CHECK erweitert
20260301000002_sleep_logs.sql             ← sleep_logs
20260301000003_menstrual_cycle_logs.sql   ← menstrual_cycle_logs
20260301000004_buddy_context_notes.sql    ← buddy_context_notes
20260301000005_symptom_logs.sql           ← symptom_logs
20260301000006_breastfeeding_support.sql  ← breastfeeding_active in profiles
20260301000007_retention_policy.sql       ← Loeschkonzept (DSGVO)
20260301000008_audit_trail.sql            ← audit_logs + 14 Trigger
20260301000009_buddy_chat_messages.sql    ← buddy_chat_messages
20260301000010_symptom_logs_mood_energy.sql ← mood/energy Spalten ergaenzt
20260306000001_ai_trainer_review.sql        ← ai_supervised, review_config (training_plans),
                                               session_feedback (workouts),
                                               ai_trainer_enabled (profiles)
```

---

## 5. Build & Deploy Abhaengigkeiten

### 5.1 Build-Kette

```
package.json (dependencies + devDependencies)
    │
    │  npm install → node_modules/
    │
    ▼
tsconfig.json → tsconfig.app.json → tsconfig.node.json
    │
    │  tsc -b (TypeScript-Kompilierung)
    │
    ▼
vite.config.ts
    │  Plugins: react(), tailwindcss()
    │  Alias: @ → ./src
    │  Base: './' (fuer Capacitor)
    │
    │  vite build (Bundling)
    │  LIEST: .env.production
    │
    ▼
dist/
    ├── index.html
    └── assets/
          ├── index-[hash].js      (Haupt-Bundle)
          ├── index-[hash].css     (Tailwind + Custom CSS)
          └── vendor-[hash].js     (Libraries, Code-Split)
```

### 5.2 Deploy-Kette (Production)

```
Lokaler Rechner
    │
    │  npm run build (ACHTUNG: .env.production muss vorhanden sein!)
    │
    ▼
dist/ (lokaler Build-Output)
    │
    │  deploy/deploy-frontend.sh (scp → Hetzner)
    │
    ▼
Hetzner VPS: /opt/fitbuddy/deploy/frontend/
    │
    │  docker-compose.yml: caddy Volume-Mount
    │    volumes:
    │      - ./frontend:/srv/frontend:ro
    │
    ▼
Caddy Container
    │  Caddyfile: root * /srv/frontend
    │  try_files {path} /index.html (SPA-Fallback)
    │  Security Headers (CSP, HSTS, COOP, CORP)
    │  Auto-SSL via Let's Encrypt
    │
    ▼
https://fudda.de (oeffentlich erreichbar)
```

### 5.3 Docker-Services und ihre Abhaengigkeiten [KRITISCH]

```
┌──────────────────────────────────────────────────────────────────┐
│  docker-compose.yml (11 Container)                               │
│                                                                  │
│  caddy ──depends_on──→ kong                                      │
│    │ :80/:443                                                    │
│    ▼                                                             │
│  kong ──depends_on──→ auth, rest, realtime, storage, functions   │
│    │ :8000 (intern)                                              │
│    │                                                             │
│    ├──→ auth (GoTrue) ──→ db (PostgreSQL)                        │
│    │      └──→ Resend SMTP (extern, smtp.resend.com:587)         │
│    │                                                             │
│    ├──→ rest (PostgREST) ──→ db                                  │
│    │                                                             │
│    ├──→ realtime ──→ db                                          │
│    │                                                             │
│    ├──→ storage ──→ db                                           │
│    │                                                             │
│    └──→ functions (Edge Runtime) ──→ db, OpenAI API (extern)     │
│                                                                  │
│  db (PostgreSQL 15) ← Zentraler Datenspeicher                   │
│    └── POSTGRES_PASSWORD aus .env                                │
│                                                                  │
│  meta (Supabase Meta) ──→ db                                    │
│  studio (Dashboard) ──→ db, meta (nur SSH-Tunnel :3000)          │
│  imgproxy (optional) ──→ storage                                 │
└──────────────────────────────────────────────────────────────────┘
```

### 5.4 Server-seitige Umgebungsvariablen (.env auf Hetzner)

| Variable | Service | Kritikalitaet | Beschreibung |
|----------|---------|---------------|-------------|
| `POSTGRES_PASSWORD` | db, auth, rest, meta | KRITISCH | DB-Passwort |
| `JWT_SECRET` | auth, rest, realtime | KRITISCH | JWT-Signaturschluessel |
| `ANON_KEY` | kong, rest, functions | KRITISCH | Anonymer API-Key (JWT) |
| `SERVICE_ROLE_KEY` | kong, functions | KRITISCH | Service-Role API-Key (JWT) |
| `API_EXTERNAL_URL` | auth | KRITISCH | `https://fudda.de` |
| `SITE_URL` | auth | HOCH | `https://fudda.de` (fuer Redirects) |
| `GOTRUE_SMTP_HOST` | auth | HOCH | `smtp.resend.com` |
| `GOTRUE_SMTP_PORT` | auth | HOCH | `587` |
| `GOTRUE_SMTP_USER` | auth | HOCH | Resend API Key |
| `GOTRUE_SMTP_PASS` | auth | HOCH | Resend API Key |
| `GOTRUE_MAILER_AUTOCONFIRM` | auth | HOCH | `false` (Email-Verifizierung aktiv) |
| `OPENAI_API_KEY` | functions | MITTEL | OpenAI Key fuer ai-proxy |
| `DOMAIN` | caddy | KRITISCH | `fudda.de` (Caddyfile {$DOMAIN}) |

---

## 6. KI-Abhaengigkeiten

### 6.1 KI-Provider-Kette

```
.env / .env.local / .env.production
    │  VITE_AI_PROVIDER (optional, Auto-Detect)
    │  VITE_OPENAI_API_KEY (nur lokal)
    │  VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
    │
    ▼
src/lib/ai/provider.ts
    │  getAIProvider() — Factory mit Auto-Detect:
    │    Cloud (VITE_SUPABASE_URL starts with https://) → 'supabase'
    │    Lokal → 'openai' (mit Key) oder 'ollama' (Fallback)
    │
    ├──→ SupabaseAIProvider (supabaseProxy.ts)
    │       │  Ruft Edge Function /functions/v1/ai-proxy auf
    │       │  Authentifiziert via supabase.auth Session-Token
    │       ▼
    │     Supabase Edge Function: ai-proxy
    │       │  OPENAI_API_KEY (Server-seitig, nie im Frontend!)
    │       ▼
    │     OpenAI API (api.openai.com)
    │
    ├──→ OpenAIProvider (openai.ts)
    │       │  Direkter Aufruf (nur Entwicklung!)
    │       │  VITE_OPENAI_API_KEY im Frontend (nicht fuer Production!)
    │       ▼
    │     OpenAI API (api.openai.com)
    │
    └──→ OllamaProvider (ollama.ts)
            │  Lokaler Aufruf
            ▼
          Ollama (localhost:11434)
            └── Modell: llama3.1:8b
```

### 6.2 KI-Konsumenten

```
src/lib/ai/provider.ts (getAIProvider)
    │
    ├──→ useBuddyChat.ts (Chat-Nachrichten senden/empfangen)
    │       └──→ BuddyChatProvider → InlineBuddyChat UI
    │
    ├──→ useActionExecutor.ts (KI-gesteuerte Aktionen ausfuehren)
    │
    ├──→ useSuggestions.ts (kontextbezogene Vorschlaege)
    │
    ├──→ useProactiveWarnings.ts (gesundheitliche Warnungen)
    │
    ├──→ usePageBuddySuggestions.ts (seitenspezifische Buddy-Tipps)
    │
    ├──→ lib/ai/mealVision.ts (Foto → Mahlzeit-Erkennung)
    │
    ├──→ lib/ai/vision.ts (allgemeine Bilderkennung)
    │
    ├──→ lib/ai/deviations.ts (Abweichungs-Erkennung)
    │
    ├──→ lib/ai/contextExtractor.ts (Kontext aus Nutzerdaten extrahieren)
    │
    ├──→ lib/ai/skills/ (17 statische + 9 dynamische Skills, inkl. trainerReview)
    │
    └──→ lib/ai/agents/ (KI-Agenten fuer komplexe Aufgaben)
```

### 6.3 KI-Sicherheitsarchitektur

```
[Frontend]                    [Server]                     [Extern]

KEIN API-Key           OPENAI_API_KEY (nur hier)      OpenAI API
im Frontend! ──→      ai-proxy Edge Function ──→     api.openai.com
                            │
                            │ Auth: JWT-Token (Supabase Session)
                            │ → Nur eingeloggte User koennen KI nutzen
                            │
                            │ Rate Limiting: Supabase Edge Functions
                            │ → Schutz vor Missbrauch
```

**Symptom bei KI-Fehler:** Buddy antwortet nicht, "Verbindungsfehler" im Chat.
**Diagnose:** Edge Function Logs pruefen (`docker logs supabase-functions`),
OpenAI API Status pruefen, OPENAI_API_KEY in Server-.env pruefen.

---

## 7. i18n-Abhaengigkeiten

### 7.1 Uebersetzungs-Kette

```
src/i18n/de.ts (Primaersprache, definiert TranslationKeys Typ)
    │
    │  type TranslationKeys = typeof de
    │
    ├──→ src/i18n/en.ts (muss alle Keys aus de.ts haben)
    ├──→ src/i18n/tr.ts
    ├──→ src/i18n/uk.ts
    ├──→ src/i18n/pl.ts
    ├──→ src/i18n/ru.ts
    ├──→ src/i18n/ro.ts
    ├──→ src/i18n/es.ts
    ├──→ src/i18n/fr.ts
    ├──→ src/i18n/it.ts
    ├──→ src/i18n/pt.ts
    ├──→ src/i18n/ar.ts
    ├──→ src/i18n/zh.ts
    ├──→ src/i18n/ja.ts
    ├──→ src/i18n/ko.ts
    ├──→ src/i18n/fa.ts
    └──→ src/i18n/fil.ts
          │
          │  Alle 17 Sprachen in:
          ▼
    src/i18n/index.ts (Re-Export + I18nContext + useTranslation Hook)
          │
          ▼
    src/app/providers/I18nProvider.tsx
          │  Liest Sprachpraeferenz aus: profiles.preferred_language (Supabase)
          │  Fallback: Browser-Sprache → 'de'
          │  Speichert: localStorage + Supabase profiles
          │
          ▼
    useTranslation() Hook — verfuegbar in ALLEN Komponenten
          │
          │  context.t.{key} → Uebersetzungstext
          │  context.language → aktuelle Sprache
          │  context.fontSize → Schriftgroesse (small/normal/large/xlarge)
          │  context.buddyVerbosity → Buddy-Ausfuehrlichkeit
          │  context.buddyExpertise → Buddy-Expertenlevel
```

### 7.2 i18n-Abhaengigkeitsregeln

1. **de.ts ist der Master:** Neue Keys IMMER zuerst in `de.ts` definieren.
2. **TypeScript erzwingt Vollstaendigkeit:** Fehlende Keys in anderen Sprachen
   fuehren zu TypeScript-Fehlern (Strukturtyp-Pruefung).
3. **Buddy-Einstellungen sind i18n-gekoppelt:** `buddyVerbosity` und `buddyExpertise`
   werden im I18nProvider verwaltet und beeinflussen die KI-Prompts.
4. **800+ Keys:** Bei Aenderungen am Key-Namensschema muessen alle 17 Dateien
   aktualisiert werden.

---

## 8. Externe Service-Abhaengigkeiten

| Service | Genutzt von | Kritikalitaet | Failover |
|---------|-------------|---------------|----------|
| **OpenAI API** | ai-proxy Edge Function | HOCH | Ollama (lokal) als Fallback |
| **Open Food Facts API** | Mahlzeit-Suche, Barcode-Scan | MITTEL | user_products (lokale DB), manuelle Eingabe |
| **Resend SMTP** | Email-Verifizierung, Welcome-Email | HOCH | AUTOCONFIRM=true (unsicher, nur Notfall) |
| **Let's Encrypt** | Caddy SSL-Zertifikate | HOCH | Kein Failover (ohne SSL kein HTTPS) |
| **Hetzner DNS** | fudda.de DNS-Aufloesung | KRITISCH | DNS-Provider wechseln (Strato als Fallback) |
| **Hetzner VPS** | Gesamte Infrastruktur | KRITISCH | Kein Failover (Single-Server) |

---

## 9. NPM-Paket-Abhaengigkeiten (Kern)

### 9.1 Runtime-Abhaengigkeiten (Production)

| Paket | Version | Genutzt von | Kritikalitaet |
|-------|---------|-------------|---------------|
| `react` + `react-dom` | ^19.2.0 | Gesamte App | KRITISCH |
| `@supabase/supabase-js` | ^2.95.3 | lib/supabase.ts, alle Hooks | KRITISCH |
| `react-router-dom` | ^7.13.0 | App.tsx (Routing) | KRITISCH |
| `@tanstack/react-query` | ^5.90.21 | Alle Data-Fetching Hooks | HOCH |
| `zod` | ^4.3.6 | lib/validation.ts, Formular-Validierung | HOCH |
| `react-hook-form` | ^7.71.1 | Alle Formulare | HOCH |
| `framer-motion` | ^12.34.0 | Animationen, Page-Transitions | MITTEL |
| `recharts` | ^3.7.0 | Cockpit-Diagramme, Reports | MITTEL |
| `date-fns` | ^4.1.0 | Datumsformatierung ueberall | MITTEL |
| `lucide-react` | ^0.564.0 | Icons ueberall | NIEDRIG |
| `jspdf` + `jspdf-autotable` | ^4.2.0 / ^5.0.7 | PDF-Export (DoctorReport) | MITTEL |
| `react-markdown` | ^10.1.0 | Buddy-Chat (Markdown-Rendering) | MITTEL |
| `@capacitor/core` | ^8.1.0 | Mobile (Local Notifications) | NIEDRIG |
| `browser-image-compression` | ^2.0.2 | Avatar-Upload, Meal Vision | NIEDRIG |

### 9.2 Build-Abhaengigkeiten (DevDependencies)

| Paket | Version | Funktion |
|-------|---------|----------|
| `vite` | ^7.3.1 | Build-Tool, Dev-Server |
| `typescript` | ~5.9.3 | Typ-Pruefung |
| `tailwindcss` + `@tailwindcss/vite` | ^4.1.18 | CSS-Framework |
| `vitest` | ^4.0.18 | Test-Framework (3.099 Tests) |
| `@testing-library/react` | ^16.3.2 | Component-Tests |
| `eslint` | ^9.39.1 | Code-Linting |
| `jsdom` | ^28.1.0 | DOM-Simulation fuer Tests |

---

## 10. Checkliste vor Aenderungen

### 10.1 Vor einem Production-Deploy

- [ ] `.env.production` existiert und enthaelt korrekte Werte
- [ ] `VITE_SUPABASE_URL` zeigt auf `https://fudda.de` (NICHT localhost!)
- [ ] `VITE_SUPABASE_ANON_KEY` ist gesetzt und korrekt
- [ ] `npm run build` wurde **mit** `.env.production` ausgefuehrt
- [ ] `dist/assets/*.js` pruefen: `grep localhost dist/assets/*.js` sollte leer sein!
- [ ] Neue DB-Migrationen auf Production ausgefuehrt (`deploy/migrate.sh`)
- [ ] Server-.env auf Hetzner enthaelt alle benoetigten Variablen
- [ ] Docker-Container sind aktuell (`docker compose pull && docker compose up -d`)

### 10.2 Vor einer neuen Feature-Entwicklung

- [ ] Welche bestehenden Features sind betroffen? (→ Matrix in Abschnitt 3.1)
- [ ] Werden neue DB-Tabellen benoetigt? (→ Migration + RLS-Policies!)
- [ ] Werden neue .env-Variablen benoetigt? (→ Abschnitt 2.2 aktualisieren!)
- [ ] Werden neue i18n-Keys benoetigt? (→ de.ts zuerst, dann alle 16 Sprachen)
- [ ] Wird ein neuer Provider/Context benoetigt? (→ Reihenfolge in App.tsx pruefen)
- [ ] Wird ein neuer externer Service angebunden? (→ Abschnitt 8 aktualisieren)

### 10.3 Vor einer Aenderung an der Auth-Kette

- [ ] `AuthProvider.tsx` aendern? → Alle ProtectedRoutes testen
- [ ] GoTrue-Config aendern? → Email-Verifizierung testen, OAuth testen
- [ ] JWT_SECRET aendern? → ANON_KEY und SERVICE_ROLE_KEY muessen neu generiert werden!
- [ ] MFA-Aenderung? → useMFA.ts + alle MFA-Dialoge testen
- [ ] OAuth-Provider aendern? → GOTRUE_EXTERNAL_*-Variablen auf Server pruefen

### 10.4 Vor einer Aenderung an der KI-Kette

- [ ] Neuen KI-Provider hinzufuegen? → `provider.ts` Factory erweitern
- [ ] ai-proxy Edge Function aendern? → `deploy/sync-functions.sh` ausfuehren
- [ ] OpenAI-Modell wechseln? → VITE_OPENAI_MODEL und Server-seitig pruefen
- [ ] Neue Skills hinzufuegen? → `lib/ai/skills/` + System-Prompt aktualisieren

### 10.5 Schnell-Diagnose bei Production-Problemen

| Symptom | Wahrscheinliche Ursache | Diagnose-Befehl |
|---------|------------------------|-----------------|
| Auth funktioniert nicht | .env.production fehlt/falsch | `grep localhost dist/assets/*.js` |
| Daten laden nicht (leere Listen) | RLS-Policy oder fehlender JWT | Browser DevTools → Network → Response |
| Buddy antwortet nicht | ai-proxy oder OpenAI Key | `docker logs supabase-functions` |
| Seite laedt nicht (weisser Bildschirm) | JS-Build-Fehler oder CSP | Browser Console → Fehlermeldungen |
| Email kommt nicht an | SMTP-Config oder Resend-Limit | `docker logs supabase-auth` |
| SSL-Zertifikat abgelaufen | Caddy-Problem oder DNS | `docker logs caddy` + DNS pruefen |
| 502 Bad Gateway | Kong/Service down | `docker compose ps` → Status aller Container |
| Langsame Ladezeiten | Fehlender Cache-Header oder Bundle zu gross | DevTools → Network → Timing |

---

## Aenderungshistorie

| Datum | Version | Autor | Aenderung |
|-------|---------|-------|-----------|
| 2026-03-02 | 1.0 | Claude / Entwickler | Initiale Erstellung nach .env-Production-Bug |
| 2026-03-06 | 1.1 | Claude / Entwickler | KI-Trainer Review-System: ai_supervised, review_config, session_feedback, ai_trainer_enabled, trainerReview Skill (17 Skills) |
| 2026-03-07 | 1.2 | Claude / Entwickler | Block B CalibrationWizard: useCalibration.ts (BW-Multiplier), CalibrationWizard.tsx (3-Screen), useUpdateTrainingPlanCalibration Mutation, TrainingPlanView Auto-Trigger, 31 calibration i18n-Keys (17 Sprachen) |
| 2026-03-07 | 1.3 | Claude / Entwickler | KI-Trainer Blocks B+C+D komplett: Post-Session-Analyse (postSessionAnalysis.ts), Double Progression (doubleProgression.ts), RIR-Feedback (RIRFeedbackDialog.tsx, useIsFirstSessionForPlan.ts, calculateRIRAdjustment), 6 Early Triggers + 6 Suggestion Chips (deviations.ts), PED-Phasen-Sync (usePEDPhaseSync.ts), Mesozyklus-Review (useMesocycleCheck.ts, mesocycleReview.ts), Buddy-Nachfrage (useAISupervisedOffer.ts), Review-Dialog (ReviewDialog.tsx, reviewChanges.ts, useApplyReviewChanges.ts, useRecentWorkoutsForPlan.ts), 8 rirFeedback i18n-Keys (17 Sprachen) |
