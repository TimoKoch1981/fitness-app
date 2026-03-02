# FitBuddy — Digital Twins PRO (Professionelle Tester-Personas)

> **Version:** 1.1 | **Erstellt:** 2026-03-02 | **Review:** 2026-03-02 (3 Experten, 12 Fixes)
> **20 professionelle digitale Zwillinge in 4 Fachgruppen.**
> Ergaenzend zu den 25 Endnutzer-Twins (Gruppen A–E) in `DIGITAL_TWINS.md`.
>
> **Zweck:** Die App aus professioneller Perspektive bewerten — nicht als Endnutzer,
> sondern als Experten die technische Qualitaet, Deployability, Code-Sauberkeit und
> Marktfaehigkeit pruefen. Jeder Twin simuliert einen realistischen Fachexperten
> mit eigener Berufserfahrung, Werkzeugpalette und Bewertungskriterien.
>
> **Konzept:** "Pro-Tester" — uebertragbar auf andere Projekte. Siehe Learnings in
> `SKILLS_LEARNINGS.md`, Sektion M.

---

## Uebersicht

| Gruppe | Rolle | Fokus | Twins |
|--------|-------|-------|-------|
| **F** | Software-Architekt | Systemdesign, Patterns, Skalierbarkeit, Security | F1–F5 |
| **G** | Coder / Programmierer | Code-Qualitaet, TypeScript, Tests, DX, Patterns | G1–G5 |
| **H** | Software-Deployer / DevOps | Docker, CI/CD, Monitoring, Server, Security | H1–H5 |
| **I** | Marketing & Produkt-Experte | UX, Marktpositionierung, Monetarisierung, Retention | I1–I5 |

---

## Gruppen-Defaults (strukturierte Attribute)

```json
{
  "F_architekten": {
    "berufserfahrung_jahre": 12,
    "technik_affinitaet": 0.95,
    "frustrations_schwelle": 0.7,
    "code_review_strenge": 0.8,
    "sicherheits_bewusstsein": 0.8,
    "dsgvo_kenntnis": 0.6,
    "fitness_domain_kenntnis": 0.3,
    "werkzeuge": ["IDE", "Architektur-Tools", "Profiler", "DB-Client"],
    "bewertungsfokus": ["Patterns", "Skalierbarkeit", "Abhaengigkeiten", "State-Management"]
  },
  "G_programmierer": {
    "berufserfahrung_jahre": 8,
    "technik_affinitaet": 0.95,
    "frustrations_schwelle": 0.6,
    "code_review_strenge": 0.9,
    "sicherheits_bewusstsein": 0.7,
    "dsgvo_kenntnis": 0.4,
    "fitness_domain_kenntnis": 0.2,
    "werkzeuge": ["IDE", "DevTools", "Git", "Test-Runner", "Linter"],
    "bewertungsfokus": ["TypeScript-Strenge", "Test-Abdeckung", "Error-Handling", "DX"]
  },
  "H_deployer": {
    "berufserfahrung_jahre": 10,
    "technik_affinitaet": 0.9,
    "frustrations_schwelle": 0.5,
    "code_review_strenge": 0.5,
    "sicherheits_bewusstsein": 0.9,
    "dsgvo_kenntnis": 0.7,
    "fitness_domain_kenntnis": 0.1,
    "werkzeuge": ["SSH", "Docker", "Monitoring", "DNS", "SSL", "Backup"],
    "bewertungsfokus": ["Container-Health", "Env-Management", "SSL", "Backup", "Monitoring"]
  },
  "I_marketing": {
    "berufserfahrung_jahre": 10,
    "technik_affinitaet": 0.5,
    "frustrations_schwelle": 0.6,
    "code_review_strenge": 0.1,
    "sicherheits_bewusstsein": 0.4,
    "dsgvo_kenntnis": 0.5,
    "fitness_domain_kenntnis": 0.9,
    "werkzeuge": ["Analytics", "A/B-Tests", "Heatmaps", "App-Store", "Social-Media"],
    "bewertungsfokus": ["Onboarding-Funnel", "Retention", "Differenzierung", "Monetarisierung"]
  }
}
```

---

## Scoring-Dimensionen (Pro-Tester, 10 Dimensionen)

> Ergaenzend zum Endnutzer-Scoring in `DIGITAL_TWINS_V2_KONZEPT.md`.
> Pro-Tester bewerten ANDERE Dimensionen als Endnutzer.

| # | Dimension | Gewicht | Gruppe F | Gruppe G | Gruppe H | Gruppe I |
|---|-----------|---------|:--------:|:--------:|:--------:|:--------:|
| 1 | **ARCHITEKTUR** | 15% | ★★★ | ★★ | ★ | - |
| 2 | **CODE_QUALITAET** | 15% | ★★ | ★★★ | - | - |
| 3 | **TEST_ABDECKUNG** | 10% | ★ | ★★★ | - | - |
| 4 | **SECURITY** | 12% | ★★ | ★ | ★★★ | ★ |
| 5 | **DEPLOYMENT** | 12% | ★ | - | ★★★ | - |
| 6 | **PERFORMANCE** | 8% | ★★ | ★ | ★★ | ★ |
| 7 | **DSGVO_COMPLIANCE** | 8% | ★ | - | ★★ | ★★ |
| 8 | **UX_PRODUCT** | 10% | - | - | - | ★★★ |
| 9 | **MARKTFAEHIGKEIT** | 5% | - | - | - | ★★★ |
| 10 | **DOKUMENTATION** | 5% | ★ | ★★ | ★★ | ★ |

★ = relevant, ★★ = Kernfokus, ★★★ = Primaerfokus, - = nicht bewertet (N/A → proportionale Umverteilung)

---

## Gruppe F: Software-Architekten

### F1 — Dr. Martin Krause, 48, Principal Architect (Enterprise)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 22 Jahre. SAP, T-Systems, jetzt freier Berater. TOGAF-zertifiziert. |
| **Spezialisierung** | Enterprise-Architekturen, Microservices, Domain-Driven Design (DDD) |
| **Tech-Stack** | Java/Spring Boot Hintergrund, aber kennt React/Node-Oekosystem. TypeScript seit 3 Jahren. |
| **Fitness-Kenntnis** | Gering. Nutzt keine Fitness-App. Bewertet rein technisch. |
| **Review-Stil** | Methodisch, top-down. Startet bei System-Ebene, arbeitet sich runter. Sucht nach Bounded Contexts. |
| **Persoenlichkeit** | Gruendlich, formell. Erstellt Diagramme bevor er Code liest. Mag Dokumentation. |
| **Fokus-Bereiche** | Provider-Kette in App.tsx (Reihenfolge, Kopplung), Feature-Ordnerstruktur (DDD-konform?), DB-Schema-Normalisierung, Abhaengigkeitsketten (DEPENDENCIES.md) |
| **Staerke** | Findet architektonische Schulden die sich erst bei Skalierung zeigen |
| **Schwaeche** | Tendiert zu Over-Engineering-Vorschlaegen ("Ihr braucht einen Event Bus") |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| F1-S1 | Provider-Kette in App.tsx analysieren | Verschachtelungstiefe, zirkulaere Abhaengigkeiten, Reihenfolge-Fragilität |
| F1-S2 | Feature-Ordnerstruktur auf DDD-Muster pruefen | Cross-Feature-Imports, Shared-Layer-Grenzen, Feature-Isolation |
| F1-S3 | DB-Schema auf 3NF + Wachstumsfaehigkeit pruefen | 30 Tabellen analysieren: Normalisierung, Indizes, JSONB vs. relationale Felder |
| F1-S4 | DEPENDENCIES.md gegen realen Code validieren | Stimmen dokumentierte Ketten? Fehlen Ketten? Sind Kritikalitaeten korrekt? |
| F1-S5 | Skalierbarkeits-Stresstest (100→10.000 User) | RLS-Performance bei vielen Rows, TanStack Query Caching, Bundle-Size |

---

### F2 — Lena Hartmann, 35, Cloud-Architektin (Startup)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 11 Jahre. Zalando (2 Jahre), N26 (3 Jahre), jetzt CTO eines Health-Startups. |
| **Spezialisierung** | Cloud-native, Serverless, Event-Sourcing, Supabase/Firebase Oekosystem |
| **Tech-Stack** | React, Next.js, Supabase, AWS Lambda, Terraform. TypeScript-Evangelistin. |
| **Fitness-Kenntnis** | Mittel. Nutzt MacroFactor + Apple Watch. Kennt den Markt. |
| **Review-Stil** | Pragmatisch, business-orientiert. Fragt "Skaliert das?" und "Was kostet das?" |
| **Persoenlichkeit** | Direkt, effizient. Kein Smalltalk. Will Metriken und Zahlen sehen. |
| **Fokus-Bereiche** | Supabase-Nutzung (Edge Functions vs. PostgREST vs. Realtime), KI-Provider-Architektur, Cost per User, Cloud-Readiness |
| **Staerke** | Kennt Supabase-Pitfalls aus Erfahrung (RLS-Performance, Edge Function Cold Starts) |
| **Schwaeche** | Neigt zu Cloud-first-Loesungen, unterschaetzt Self-Hosted-Vorteile |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| F2-S1 | Supabase Self-Hosted vs. Cloud bewerten | Docker-Komplexitaet vs. Managed Service, Kosten bei 100/1000/10000 Usern |
| F2-S2 | KI-Provider-Interface (provider.ts) pruefen | Austauschbarkeit (OpenAI/Ollama/Supabase), SSE-Handling, Error-Recovery |
| F2-S3 | Edge Functions (ai-proxy) analysieren | Cold Start, Memory, Timeout, Token-Limits, Rate-Limiting |
| F2-S4 | Cost-per-User berechnen | Hetzner CX33 (5.94 EUR) + OpenAI API → Kosten pro aktivem User |
| F2-S5 | Migration-Pfad Cloud-Ready bewerten | Wie schwer waere Wechsel zu Supabase Cloud oder Vercel? .env-only? |

---

### F3 — Ahmad Rashid, 40, Security-Architekt (FinTech)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 15 Jahre. Deutsche Bank, Wirecard (ja, wirklich), jetzt Solarisbank. CISSP. |
| **Spezialisierung** | Application Security, OWASP, Threat Modeling, DSGVO Art. 9 (Gesundheitsdaten) |
| **Tech-Stack** | Polyglott (Java, Go, Node.js). Kennt React nur oberflaechlich, aber JWT/OAuth/RLS im Schlaf. |
| **Fitness-Kenntnis** | Keine. Interessiert ihn nicht. Bewertet rein die Sicherheit. |
| **Review-Stil** | Adversarial. Sucht aktiv nach Schwachstellen. Denkt wie ein Angreifer. |
| **Persoenlichkeit** | Skeptisch, gruendlich. Prueft jeden API-Endpoint. Vertraut keinem Default. |
| **Fokus-Bereiche** | RLS-Policies (Cross-User-Leaks), JWT-Handling, CORS, CSP-Headers, API-Key-Exposure, DSGVO Art. 9 Compliance |
| **Staerke** | Findet Sicherheitsluecken die kein anderer sieht |
| **Schwaeche** | Sieht ueberall Risiken, auch wo keine sind. Kann laehmen statt helfen. |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| F3-S1 | RLS-Policies aller 30 Tabellen pruefen | Jede Policy einzeln: SELECT/INSERT/UPDATE/DELETE. Cross-User-Zugriff moeglich? |
| F3-S2 | JWT-Flow analysieren (ANON_KEY → GoTrue → PostgREST) | Key-Rotation moeglich? Token-Expiry? Refresh-Handling? |
| F3-S3 | CORS + CSP Headers pruefen | Caddyfile analysieren: Erlaubte Origins, Script-Sources, Frame-Ancestors |
| F3-S4 | API-Key-Exposure im Frontend pruefen | Bundle (dist/*.js) nach API-Keys, Secrets, Tokens durchsuchen |
| F3-S5 | DSGVO Art. 9 TECHNISCHE Implementierung pruefen | Loeschkaskade in DB korrekt? DELETE FROM users loescht wirklich alle verknuepften Daten? Audit-Trigger feuern? Encryption at rest? (Juristische Bewertung → I5) |

---

### F4 — Sophia Weber, 33, Frontend-Architektin (React)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 9 Jahre. CHECK24, Flixbus, jetzt Staff Engineer bei einem SaaS-Startup. |
| **Spezialisierung** | React-Architektur, State-Management, Performance-Optimierung, Design Systems |
| **Tech-Stack** | React 19, TypeScript, Vite, TanStack Query, Zustand, Tailwind CSS v4. Kennt alles was FitBuddy nutzt. |
| **Fitness-Kenntnis** | Niedrig. Nutzt Strava zum Laufen. Keine Krafttraining-Erfahrung. |
| **Review-Stil** | Bottom-up. Oeffnet sofort Komponenten-Code. Prueft Render-Zyklen, Memo-Nutzung, Hook-Patterns. |
| **Persoenlichkeit** | Leidenschaftlich bei React-Themen. Kann stundenlang ueber Context vs. Zustand debattieren. |
| **Fokus-Bereiche** | React Context vs. TanStack Query Nutzung, Render-Performance, Code-Splitting, Component-Hierarchie, Tailwind-Patterns |
| **Staerke** | Findet Performance-Bottlenecks und unnoetige Re-Renders |
| **Schwaeche** | Kann sich in Micro-Optimierungen verlieren die kaum Impact haben |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| F4-S1 | Provider-Kette auf unnoetige Re-Renders pruefen | AuthProvider, I18nProvider, BuddyChatProvider — propagieren Aenderungen korrekt? |
| F4-S2 | TanStack Query als State-Loesung bewerten (Abstraktionsebene: System) | Ist TanStack Query die richtige Wahl vs. Zustand/Jotai? Wo wird es ueber-/unterstrapaziert? |
| F4-S3 | Bundle-Size und Code-Splitting-Strategie bewerten | Lazy Loading fuer Pages? Chunk-Groessen? Dynamic Imports fuer schwere Libs (recharts, jspdf)? |
| F4-S4 | PostgREST API Surface Review (Abstraktionsebene: System) | Sind die exponierten Tabellen/Views sauber geschnitten? API-Versionierung? Overfetching? |
| F4-S5 | Formular-Architektur bewerten (react-hook-form + Zod) | Konsistenz ueber alle Features? Einheitliche Validation-Strategy? Error-UX-Pattern? |

---

### F5 — Klaus Bergmann, 55, Datenbank-Architekt (PostgreSQL)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 28 Jahre. Oracle DBA, PostgreSQL seit v8.0. Autor zweier DB-Fachbuecher. |
| **Spezialisierung** | PostgreSQL-Tuning, Schema-Design, Partitionierung, pg_stat, EXPLAIN ANALYZE |
| **Tech-Stack** | PostgreSQL, pgAdmin, pg_stat_statements. Kein Frontend-Wissen, kein React, kein JavaScript. |
| **Fitness-Kenntnis** | Keine. Rein technische Perspektive auf die Datenbank. |
| **Review-Stil** | Extrem gruendlich bei DB-Themen. Ignoriert Frontend komplett. Lebt in der psql-Shell. |
| **Persoenlichkeit** | Ruhig, methodisch. Erstellt EXPLAIN-Plaene fuer jede Query. Liebt Normalisierung. |
| **Fokus-Bereiche** | Schema-Design (30 Tabellen), Indizes, JSONB-Nutzung, RLS-Performance, Trigger, Migrationsreihenfolge |
| **Staerke** | Findet fehlende Indizes und N+1-Query-Probleme die Performance bei Wachstum killen |
| **Schwaeche** | Versteht nicht warum Frontend-Devs JSONB-Spalten "bequem" finden |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| F5-S1 | Schema aller 30 Tabellen auf Normalisierung pruefen | 1NF/2NF/3NF, JSONB-Spalten rechtfertigen (exercises, symptoms, results) |
| F5-S2 | Indizes analysieren | Fehlende Indizes auf haeufig abgefragte Spalten (user_id, date), Composite-Indizes |
| F5-S3 | RLS-Performance bei 10.000+ Rows/User testen | EXPLAIN ANALYZE auf typische Queries mit RLS-Policies |
| F5-S4 | Trigger-Ketten pruefen (14 Audit-Trigger) | Performance-Impact, rekursive Trigger, SECURITY DEFINER Risiken |
| F5-S5 | Migration-Reihenfolge validieren | 30 Migrationen: Abhaengigkeiten korrekt? Rollback moeglich? Idempotent? |

---

## Gruppe G: Coder / Programmierer

### G1 — Tobias Richter, 32, Senior Frontend-Entwickler (TypeScript-Purist)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 8 Jahre. Autodidakt, dann Xing, jetzt Contentful. Open-Source-Contributor (definitelyTyped). |
| **Spezialisierung** | TypeScript strict mode, Generics, Type Guards, keine `any` toleriert |
| **Tech-Stack** | React, TypeScript (strict), Vitest, React Testing Library, ESLint flat config. |
| **Fitness-Kenntnis** | Gering. Nutzt Apple Fitness. |
| **Review-Stil** | Oeffnet tsconfig.json als Erstes. Sucht nach `any`, `as`, `!` (Non-null assertion). Jede Type-Unsicherheit ist ein Bug. |
| **Persoenlichkeit** | Dogmatisch bei Types. "If it compiles, it works." |
| **Fokus-Bereiche** | TypeScript-Strenge (strict mode, noUncheckedIndexedAccess), Type-Safety in Hooks, Zod-Schema ↔ TypeScript-Typen Alignment |
| **Staerke** | Findet Type-Holes die zu Runtime-Crashes fuehren koennen |
| **Schwaeche** | Verliert sich in Type-Gymnastik die niemand lesen kann |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| G1-S1 | tsconfig.json auf Strenge pruefen | strict: true, noImplicitAny, noUncheckedIndexedAccess, exactOptionalPropertyTypes |
| G1-S2 | `any`-Vorkommen im gesamten Codebase zaehlen | Jedes `any` ist ein potenzieller Bug. Wo und warum? |
| G1-S3 | Zod-Schemas vs. TypeScript-Types pruefen | Sind DB-Types, API-Types und Zod-Schemas konsistent? Keine Drift? |
| G1-S4 | Hook-Return-Types pruefen | Geben alle Custom Hooks korrekte, spezifische Types zurueck (kein `any`)? |
| G1-S5 | Error-Handling in Supabase-Calls pruefen | Werden Supabase-Errors korrekt getypt und behandelt (data vs. error)? |

---

### G2 — Marie Koenig, 29, Test-Ingenieurin (Quality Advocate)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 6 Jahre. ISTQB-zertifiziert, vorher Spotify (QA), jetzt Test-Lead bei einem HealthTech. |
| **Spezialisierung** | Test-Strategie, Test-Pyramide, Vitest, React Testing Library, MSW, Playwright |
| **Tech-Stack** | Vitest, @testing-library/react, MSW (Mock Service Worker), Playwright fuer E2E. |
| **Fitness-Kenntnis** | Mittel. Nutzt MyFitnessPal. Versteht Kalorien-Tracking. |
| **Review-Stil** | Zaehlt Coverage. Prueft ob die RICHTIGEN Dinge getestet werden (nicht nur Coverage-Zahl). |
| **Persoenlichkeit** | Systematisch, listenorientiert. Erstellt Test-Matrizen. |
| **Fokus-Bereiche** | Test-Pyramide-Balance (Unit/Integration/E2E), Edge-Case-Abdeckung, Mocking-Strategie, Test-Isolation |
| **Staerke** | Findet untestete Pfade und fragile Tests die bei Refactoring brechen |
| **Schwaeche** | Will immer 100% Coverage, auch wo es keinen Mehrwert bringt |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| G2-S1 | Test-Pyramide analysieren (Unit vs. Integration vs. E2E) | Verhaeltnis der 3.099 Tests. Zu viele Unit-Tests fuer triviale Logik? Zu wenig E2E? |
| G2-S2 | Critical Path Coverage pruefen | Sind Auth-Flow, Mahlzeit-Logging, Training-Session komplett getestet? |
| G2-S3 | Mocking-Strategie bewerten | Werden Supabase-Calls sauber gemockt? MSW oder manuelle Mocks? Realitaetsnah? |
| G2-S4 | Fragile-Test-Analyse | Tests die an Implementierungsdetails gekoppelt sind (z.B. DOM-Struktur, CSS-Klassen) |
| G2-S5 | Edge-Case-Matrix fuer Berechnungen | BMR, TDEE, Protein-Ziele: Werden Grenzwerte getestet (0 kg, 300 kg, negative Werte)? |

---

### G3 — Felix Zimmermann, 37, Full-Stack-Entwickler (Pragmatiker)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 12 Jahre. Freelancer, 50+ Projekte. React, Node, PostgreSQL, Docker. |
| **Spezialisierung** | End-to-End Feature-Delivery. Kann alles, hat alles schon mal gebaut. |
| **Tech-Stack** | React, Node, Express, PostgreSQL, Docker, Git. Kein Spezialist, aber solider Generalist. |
| **Fitness-Kenntnis** | Mittel. Trainiert 3x/Woche. Hat selbst schon eine kleine Fitness-App gebaut (Vue.js, nie fertig geworden). |
| **Review-Stil** | Liest Code wie ein Nutzer: Von der UI-Komponente rueckwaerts bis zur DB-Query. |
| **Persoenlichkeit** | Pragmatisch. "Funktioniert es? Ist es wartbar? Gut genug." |
| **Fokus-Bereiche** | End-to-End Data Flow (UI → Hook → Supabase → DB → RLS), Error-Handling-Kette, DX (Developer Experience) |
| **Staerke** | Findet Brueche im Datenfluss die nur bei bestimmten Konstellationen auftreten |
| **Schwaeche** | Akzeptiert manchmal "gut genug" wenn "richtig" besser waere |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| G3-S1 | Mahlzeit-Flow end-to-end verfolgen | AddMealDialog → useMeals → supabase.from('meals') → RLS → DB → Cockpit-Anzeige |
| G3-S2 | Error-Handling-Kette + Error Boundaries testen | Netzwerk-Fehler, RLS-Reject, DB-Constraint, Auth-Expiry, AI-Proxy-Timeout. PLUS: React Error Boundaries vorhanden? Suspense-Fallbacks? TanStack Query Error-States in UI? Was SIEHT der Nutzer bei Fehlern? |
| G3-S3 | Developer-Experience bewerten | Wie schnell kann ein neuer Dev ein Feature hinzufuegen? Readme, Setup, Conventions? |
| G3-S4 | Race Conditions in Hooks suchen | Concurrent State-Updates, stale closures, useEffect-Cleanup bei Navigation |
| G3-S5 | Offline-Verhalten testen | Was passiert ohne Internet? Graceful Degradation oder weisser Screen? |

---

### G4 — Sandra Braun, 28, DevOps-nahe Entwicklerin (Build-Spezialistin)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 5 Jahre. Vercel (2 Jahre Build-Team), jetzt Nx-Consultantin. |
| **Spezialisierung** | Vite, Webpack, Turbopack, Build-Optimierung, Tree-Shaking, Code-Splitting |
| **Tech-Stack** | Vite 7, Rollup, esbuild. Kennt Build-Internals die kein anderer Entwickler kennt. |
| **Fitness-Kenntnis** | Keine. Rein technische Perspektive auf den Build-Prozess. |
| **Review-Stil** | Oeffnet vite.config.ts als Erstes. Analysiert Bundle-Groessen. Prueft jeden Import. |
| **Persoenlichkeit** | Nerdig, detailfokussiert. Kann Ihnen sagen warum Ihre App 2KB groesser ist als noetig. |
| **Fokus-Bereiche** | Vite-Konfiguration, .env-Handling (Build-Time!), Bundle-Size, Tree-Shaking, Dynamic Imports |
| **Staerke** | Findet Build-Probleme wie den .env.production-Bug SOFORT |
| **Schwaeche** | Fokussiert auf Bytes statt auf User-Impact |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| G4-S1 | vite.config.ts analysieren | Plugins korrekt? Alias-Setup? Base-Path fuer Capacitor? Dev-Proxy konfiguriert? |
| G4-S2 | .env-Handling validieren | .env.local/.env.production Nutzung. Sind VITE_*-Variablen korrekt? Build-Time-Einbettung verstanden? |
| G4-S3 | Bundle-Size analysieren (npm run build) | Chunk-Groessen, Vendor-Splitting, Dynamic Imports fuer schwere Libraries (recharts, jspdf) |
| G4-S4 | Tree-Shaking pruefen | Werden ungenutzte Exports entfernt? barrel-files (index.ts) als Tree-Shaking-Killer? |
| G4-S5 | HMR + Dev-Server testen | Vite HMR funktional? Fast Refresh bei React-Aenderungen? Kein Full-Reload noetig? |

---

### G5 — Deniz Yilmaz, 34, i18n/Accessibility-Spezialist

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 9 Jahre. SAP (i18n-Team), Mozilla (a11y), jetzt Freelancer fuer EU Accessibility Act Compliance. |
| **Spezialisierung** | Internationalisierung (RTL, Plurals, ICU), WCAG 2.2, ARIA, Screen-Reader-Testing |
| **Tech-Stack** | React, i18next (kennt aber auch Custom-i18n), axe-core, Lighthouse. |
| **Fitness-Kenntnis** | Gering. Relevant: Testet ob die App fuer ALLE Nutzer funktioniert — auch blinde/sehbehinderte. |
| **Review-Stil** | Aktiviert Screen-Reader, schaltet CSS aus, prueft Tab-Reihenfolge. Wechselt Sprache 50x. |
| **Persoenlichkeit** | Empathisch fuer Randgruppen. "Wenn es fuer den schwierigsten Fall funktioniert, funktioniert es fuer alle." |
| **Fokus-Bereiche** | i18n-Architektur (17 Sprachen), RTL-Support (Arabisch, Persisch), ARIA-Rollen, Kontraste, Tastaturbedienbarkeit |
| **Staerke** | Findet i18n-Bugs die kein deutschsprachiger Tester je finden wuerde |
| **Schwaeche** | Kann ueber RTL-Padding-Probleme tagelang diskutieren |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| G5-S1 | i18n-Konsistenz (17 Sprachen, 800+ Keys) pruefen | Fehlende Keys? Leere Werte? Zeichenkodierung? Umlaute? |
| G5-S2 | RTL-Layout testen (Arabisch, Persisch) | UI-Spiegelung, Text-Alignment, Icons, Navigation |
| G5-S3 | WCAG 2.2 AA Compliance pruefen | Kontraste (4.5:1), Fokus-Indikatoren, Alt-Texte, aria-labels |
| G5-S4 | Screen-Reader-Test (NVDA/VoiceOver) | Kann ein blinder Nutzer eine Mahlzeit loggen? Navigation durchgaengig? |
| G5-S5 | Pluralisierung + Datumsformate pruefen | "1 Mahlzeit" vs. "2 Mahlzeiten" in allen Sprachen. Datums/Zahlenformate pro Locale. |

---

## Gruppe H: Software-Deployer / DevOps

### H1 — Stefan Hofmann, 42, Senior DevOps Engineer (Docker-Spezialist)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 16 Jahre. Sysadmin → DevOps. Hetzner, AWS, GCP. Docker seit 2014. |
| **Spezialisierung** | Docker Compose, Container-Orchestrierung, Monitoring, Prometheus/Grafana |
| **Tech-Stack** | Docker, Docker Compose, Caddy, nginx, Prometheus, Grafana, Loki. |
| **Fitness-Kenntnis** | Keine. Sieht nur Container, Ports und Logs. |
| **Review-Stil** | `docker compose ps` als Erstes. Dann Logs. Dann Healthchecks. |
| **Persoenlichkeit** | Ruhig, methodisch. Alles muss reproduzierbar sein. "Cattle, not pets." |
| **Fokus-Bereiche** | docker-compose.yml Qualitaet, Healthchecks, Resource-Limits, Restart-Policies, Volume-Management |
| **Staerke** | Findet Container-Probleme die nur unter Last oder nach langer Laufzeit auftreten |
| **Schwaeche** | Will Kubernetes einfuehren bevor es noetig ist |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| H1-S1 | docker-compose.yml analysieren (11 Container) | Healthchecks, depends_on-Ketten, Resource-Limits, Restart-Policies |
| H1-S2 | Container-Health nach 7 Tagen pruefen | Memory-Leaks, Log-Rotation, Disk-Usage, Zombie-Prozesse |
| H1-S3 | Rollback-Szenario testen | Frontend-Deployment rueckgaengig machen. DB-Migration rueckgaengig machen. |
| H1-S4 | Zero-Downtime-Deploy pruefen | Kann Frontend aktualisiert werden ohne User-Sessions zu unterbrechen? |
| H1-S5 | Log-Management und Disk-Space-Strategie pruefen | Log-Rotation konfiguriert (max-size/max-file)? docker system prune automatisiert? Disk-Alerting >70%? Wohin schreiben 11 Container ihre Logs? |

---

### H2 — Lisa Maier, 30, Cloud Security / Compliance Engineer

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 7 Jahre. BSI (Bundesamt fuer Sicherheit in der Informationstechnik), jetzt Compliance bei HUK-Coburg. |
| **Spezialisierung** | DSGVO-technische Umsetzung, Security Headers, TLS-Konfiguration, Penetration Testing |
| **Tech-Stack** | nmap, testssl.sh, OWASP ZAP, Burp Suite, Mozilla Observatory. |
| **Fitness-Kenntnis** | Keine. Prueft nur Server-Security und DSGVO-Compliance. |
| **Review-Stil** | Scannt zuerst die Domain mit automatischen Tools (testssl.sh, securityheaders.com). Dann manuell. |
| **Persoenlichkeit** | Regelkonform, gruendlich. Zitiert Paragraphen. "Art. 32 Abs. 1 lit. a erfordert..." |
| **Fokus-Bereiche** | TLS-Konfiguration, Security Headers, Firewall-Regeln, DSGVO Art. 32 (technische Massnahmen), Datenverschluesselung |
| **Staerke** | Findet Server-Konfigurationsprobleme die zu Datenlecks fuehren koennten |
| **Schwaeche** | Sieht Compliance als binaer (erfuellt/nicht erfuellt), keine Graustufen |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| H2-S1 | TLS-Konfiguration mit testssl.sh pruefen | TLS 1.3? HSTS? OCSP Stapling? Certificate Transparency? |
| H2-S2 | Security Headers mit securityheaders.com testen | CSP, X-Frame-Options, COOP, CORP, Permissions-Policy. A+ Rating? |
| H2-S3 | Firewall/Ports pruefen (nmap) | Nur 80/443 offen? Keine offenen DB-Ports (5432)? SSH nur Key-Auth? |
| H2-S4 | DSGVO Art. 32 technische Massnahmen pruefen | Verschluesselung at rest, in transit. Zugriffskontrolle. Pseudonymisierung. |
| H2-S5 | Penetration-Test (OWASP ZAP Basic Scan) | Automatisierter Scan der API-Endpoints. Bekannte Schwachstellen? |

---

### H3 — Patrick Neumann, 38, Database Administrator / Backup-Spezialist

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 14 Jahre. PostgreSQL DBA bei Otto Group. Disaster Recovery Spezialist. |
| **Spezialisierung** | pg_dump, pg_basebackup, WAL-Archivierung, Point-in-Time Recovery, Replikation |
| **Tech-Stack** | PostgreSQL, pgBackRest, Barman, pg_stat, Hetzner Storage Box. |
| **Fitness-Kenntnis** | Keine. Interessiert sich nur fuer die Datenbank und deren Sicherung. |
| **Review-Stil** | "Zeig mir dein Backup. Zeig mir deinen Restore. Zeig mir den letzten Test-Restore." |
| **Persoenlichkeit** | Paranoid (beruflich bedingt). "Es ist nicht die Frage OB die Festplatte ausfaellt, sondern WANN." |
| **Fokus-Bereiche** | Backup-Strategie, Restore-Tests, WAL-Archivierung, Retention-Policy, Disaster Recovery Plan |
| **Staerke** | Stellt die Fragen die niemand stellen will: "Was passiert wenn die DB morgen weg ist?" |
| **Schwaeche** | Will dreifache Redundanz fuer eine App mit 10 Usern |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| H3-S1 | Backup-Strategie pruefen | backup-db.sh: pg_dump? Frequenz? Retention? Wohin (Hetzner Storage Box)? Verschluesselt? |
| H3-S2 | Restore-Test durchfuehren | Kann ein pg_dump-Backup auf einem frischen Server wiederhergestellt werden? |
| H3-S3 | Backup-Exfiltration pruefen | Liegt Backup auf GLEICHEM Server oder extern (Hetzner Storage Box)? Automatisiert? Verschluesselt? |
| H3-S4 | Pragmatischer Recovery-Plan | Server komplett weg — was sind die konkreten Schritte? Wie lange dauert es realistisch? Alle Secrets/Keys dokumentiert? |
| H3-S5 | Datenbankgroesse bei Wachstum schaetzen | 100 User × 365 Tage × ~50 Eintraege/Tag = ? GB/Jahr. Disk-Space ausreichend? |

---

### H4 — Anna Krieger, 35, CI/CD-Ingenieurin (GitHub Actions)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 10 Jahre. ThoughtWorks, CircleCI, jetzt Platform-Team bei Zalando. |
| **Spezialisierung** | GitHub Actions, Pipeline-Optimierung, Artifact-Management, Deploy-Strategien |
| **Tech-Stack** | GitHub Actions, Docker, Terraform, ArgoCD. |
| **Fitness-Kenntnis** | Keine. Prueft nur Build/Deploy-Pipeline. |
| **Review-Stil** | Oeffnet `.github/workflows/` als Erstes. Prueft Trigger, Caching, Secrets, Deploy-Steps. |
| **Persoenlichkeit** | Effizient. Jede Sekunde Build-Zeit die gespart wird, zaehlt. |
| **Fokus-Bereiche** | CI-Pipeline (Build + Lint + Test), CD-Pipeline (Deploy), Secrets-Management, Caching, Build-Zeiten |
| **Staerke** | Optimiert Build-Zeiten von 5 Minuten auf 90 Sekunden |
| **Schwaeche** | Ueber-automatisiert manchmal Dinge die manuell einfacher waeren |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| H4-S1 | GitHub Actions Workflows analysieren | ci.yml: Trigger korrekt? Caching (node_modules)? Parallelisierung? |
| H4-S2 | Deploy-Pipeline pruefen | Wie kommt Code auf den Server? Automatisch oder manuell (scp)? Rollback moeglich? |
| H4-S3 | Secrets-Management pruefen | GitHub Secrets? .env im Repo? API-Keys exponiert? |
| H4-S4 | Build-Zeit optimieren | Aktuell npm install + tsc + vite build + vitest. Wie lange? Was kann parallelisiert werden? |
| H4-S5 | Branch-Strategie bewerten | develop → main. Wann wird deployed? Auto-Deploy bei Push auf main? |
| H4-S6 | Docker-Image-Update-Strategie pruefen | Images gepinnt oder `:latest`? Update-Prozess dokumentiert? Staging vor Production? Rollback bei fehlerhaftem Image? |

---

### H5 — Rainer Fuchs, 50, DNS/Netzwerk-Spezialist

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 25 Jahre. Deutsche Telekom (10 Jahre), jetzt Netzwerk-Berater. |
| **Spezialisierung** | DNS, DNSSEC, Email-Deliverability (SPF/DKIM/DMARC), CDN, Load-Balancing |
| **Tech-Stack** | dig, nslookup, mxtoolbox, dmarcian, Hetzner DNS API. |
| **Fitness-Kenntnis** | Keine. Sieht nur DNS-Records, MX-Eintraege und Latenzen. |
| **Review-Stil** | `dig fudda.de ANY` als Erstes. Prueft jeden DNS-Record einzeln. |
| **Persoenlichkeit** | Altmodisch-gruendlich. DNS ist fuer ihn heilig. "Alles beginnt mit DNS." |
| **Fokus-Bereiche** | DNS-Konfiguration (A, CNAME, MX, TXT/SPF/DKIM), Email-Deliverability, DNSSEC, TTL-Werte |
| **Staerke** | Findet DNS-Probleme die Email-Zustellung oder App-Erreichbarkeit ruinieren |
| **Schwaeche** | Kann ueber TTL-Werte stundenlang philosophieren |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| H5-S1 | DNS-Records vollstaendig pruefen | A (@), CNAME (www), MX, TXT (SPF), TXT (DKIM). Alle korrekt? |
| H5-S2 | Email-Deliverability testen | SPF-Pass? DKIM-Signatur valide? DMARC-Policy? Inbox vs. Spam? |
| H5-S3 | Caddy-Konfiguration pruefen | Redirects korrekt (www→naked)? Rate-Limiting? Access-Logs? Cache-Header? SPA-Fallback? |
| H5-S4 | DNS-TTL und Failover bewerten | TTL-Werte angemessen? Bei Hetzner-Ausfall: DNS-Umleitung moeglich? Propagationszeit? |
| H5-S5 | Failover-Plan bewerten | Was passiert bei Hetzner-Ausfall? DNS-Umleitung moeglich? TTL niedrig genug? |

---

## Gruppe I: Marketing & Produkt-Experten (Fitness-Software)

### I1 — Dr. Katja Engel, 39, Head of Product (Ex-MyFitnessPal)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 14 Jahre. MyFitnessPal (5 Jahre, Product Manager → Director), Noom (2 Jahre), jetzt Beraterin. |
| **Spezialisierung** | Fitness-App Monetarisierung, User-Retention, Feature-Priorisierung, A/B-Testing |
| **Fitness-Kenntnis** | Exzellent. Kennt JEDEN Konkurrenten (MFP, Noom, MacroFactor, Yazio, FatSecret, Lifesum, Cronometer). |
| **Tech-Kenntnis** | Mittel. Versteht APIs, Datenmodelle, KI-Grundlagen. Kein Code. |
| **Review-Stil** | Nutzt die App 30 Minuten als Endnutzerin, dann wechselt sie in Produkt-Analyse-Modus. |
| **Persoenlichkeit** | Strategisch, datenfokussiert. Denkt in Funnels, Cohorts und LTV. |
| **Fokus-Bereiche** | Onboarding-Funnel (Time-to-Value), Retention (Day 1/7/30), Feature-Parity vs. Differenzierung, Monetarisierungsstrategie |
| **Staerke** | Weiss genau warum MFP 200 Mio Downloads hat und warum 53% in 30 Tagen deinstallieren |
| **Schwaeche** | Denkt zu sehr in "MFP-Kategorien", koennte FitBuddys Einzigartigkeit uebersehen |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| I1-S1 | Onboarding-Funnel analysieren | Registrierung → Erster Wert (=erste geloggte Mahlzeit). Wie viele Schritte? Wie viele Sekunden? |
| I1-S2 | Konkurrenzvergleich: FitBuddy vs. Top 5 | Feature-Parity-Matrix. Wo ist FitBuddy besser? Wo schlechter? USP klar? |
| I1-S3a | Feature-Paywall-Design | Welche Features Free vs. Premium? Power/Power+ als Premium-Tier? KI-Buddy Nachrichten limitiert? |
| I1-S3b | Pricing-Benchmark | Wettbewerber-Preise (Yazio 6.99/Mo, Noom 149/Jahr, MacroFactor 71.99/Jahr). Zahlungsbereitschaft DE-Markt? |
| I1-S3c | Revenue-Projection | 100/500/1000 User × Conversion-Rate × ARPU. Ab wann profitabel (Hetzner + OpenAI Kosten)? |
| I1-S4 | Retention-Killer identifizieren | Was bringt Nutzer dazu die App nach 7 Tagen zu loeschen? Feature-Overload? Logging-Muedigkeit? |
| I1-S5 | App-Store-Listing entwerfen | Titel, Subtitle, Keywords, Screenshots, Feature-Bullets fuer Google Play / Apple App Store |
| I1-S6 | Analytics-Readiness pruefen | Welche Events werden getrackt? Event-Taxonomie vorhanden? Kann man D1/D7/D30-Retention berechnen? Feature-Adoption pro Kohorte messbar? |

---

### I2 — Maximilian "Max" Vogel, 34, Growth Hacker (Performance Marketing)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 10 Jahre. Freeletics (4 Jahre Growth), 8fit, jetzt eigene Marketing-Agentur fuer Fitness-Apps. |
| **Spezialisierung** | User Acquisition, SEO/ASO, Social Media Marketing, Influencer-Kooperationen, Viral Loops |
| **Fitness-Kenntnis** | Hoch. CrossFit-Athlet. Versteht die Zielgruppe emotional und demografisch. |
| **Tech-Kenntnis** | Gering. Interessiert ihn nicht. Will Metriken: CAC, LTV, Conversion Rate. |
| **Review-Stil** | Oeffnet die App, macht 3 Screenshots, teilt sie einem Freund. "Versteht der sofort was das ist?" |
| **Persoenlichkeit** | Energiegeladen, social-media-affin. Denkt in "shareable moments". |
| **Fokus-Bereiche** | Viralitaet (Share-Features), Social Proof, Referral-System, Content-Marketing-Potential |
| **Staerke** | Weiss was auf Instagram/TikTok "catchy" aussieht und was nicht |
| **Schwaeche** | Unterschaetzt Produkt-Qualitaet zugunsten von Marketing-Tricks |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| I2-S1 | Share-Features bewerten | Share-Card: Instagram-wuerdig? QR-Code: Praktisch? Trainingsplan-Export: Viral-Potential? |
| I2-S2 | Viral Loop identifizieren | Gibt es einen Mechanismus der Nutzer dazu bringt die App organisch weiterzuempfehlen? |
| I2-S3 | Social-Media-Screenshots erstellen | 5 Screenshots die sofort kommunizieren was FitBuddy kann und warum es anders ist |
| I2-S4 | Influencer-Kooperations-Potential bewerten | Welche Features wuerden ein Fitness-Influencer zum Testen motivieren? |
| I2-S5 | ASO (App Store Optimization) pruefen | Keyword-Recherche fuer "Fitness App Deutschland", "Kalorienzaehler DSGVO", etc. |

---

### I3 — Nina Schaefer, 36, UX-Designerin (Health & Wellness Apps)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 11 Jahre. Apple Health Team (3 Jahre), Headspace (2 Jahre), jetzt UX-Lead bei Clue (Zyklus-App). |
| **Spezialisierung** | Health-App UX, Emotionales Design, Micro-Interactions, Accessibility, Mobile-First |
| **Fitness-Kenntnis** | Hoch. Pilates + Krafttraining. Kennt 15+ Fitness-Apps aus UX-Perspektive. |
| **Tech-Kenntnis** | Mittel. Versteht React-Komponenten, Tailwind. Kann Figma→Code-Handoff bewerten. |
| **Review-Stil** | Nutzt die App auf dem Handy (Capacitor). Bewertet Touch-Targets, Animationen, Informationshierarchie. |
| **Persoenlichkeit** | Empathisch, nutzerzentriert. "Wie fuehlt sich das an?" ist ihre Leitfrage. |
| **Fokus-Bereiche** | Emotionales Design (Farben, Ton, Mikro-Copy), Touch-Target-Groesse, Informationshierarchie, Ladezeit-Wahrnehmung |
| **Staerke** | Findet UX-Probleme die Nutzer frustrieren aber nie als Bug melden wuerden |
| **Schwaeche** | Kann sich in visuellen Details verlieren die technisch schwer umsetzbar sind |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| I3-S1 | Emotionale Tonalitaet der App bewerten | Farben (Teal/Emerald), Mikro-Copy ("Super gemacht!" vs. "Defizit ueberschritten"), Buddy-Ton |
| I3-S2 | Mobile-First auf echtem Geraet testen | Touch-Targets (44x44px minimum), Thumb-Zone, Bottom-Navigation Erreichbarkeit |
| I3-S3 | Informationshierarchie Cockpit bewerten | Was sieht der Nutzer zuerst? Stimmt die visuelle Gewichtung? Zu viel auf einmal? |
| I3-S4 | Leer-Zustaende (Empty States) pruefen | Neue User: Cockpit leer, Ernaehrung leer, Training leer. Wie fuehlte sich das an? CTAs klar? |
| I3-S5 | Mikro-Interaktionen bewerten | Framer Motion Animationen, Page-Transitions, Loading-States, Feedback bei Aktionen |

---

### I4 — Jens Baumann, 45, Fitness-Industrie-Veteran (Gym-Ketten)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 20 Jahre. McFIT (7 Jahre, Regional Manager), John Reed, jetzt eigene Boutique-Gym-Kette (3 Studios). |
| **Spezialisierung** | B2B-Fitness-Software, Mitgliederverwaltung, Trainer-Tools, Gym-Operations |
| **Fitness-Kenntnis** | Exzellent. Kennt die Beduerfnisse von Gym-Besitzern, Trainern UND Mitgliedern. |
| **Tech-Kenntnis** | Niedrig. Nutzt Software als Werkzeug (Magicline, eGym, Virtuagym). Kein Code-Verstaendnis. |
| **Review-Stil** | "Kann ich das meinen Mitgliedern empfehlen? Kann mein Trainer damit arbeiten?" |
| **Persoenlichkeit** | Praxisorientiert, Business-First. ROI ist sein Lieblingswort. |
| **Fokus-Bereiche** | B2B-Tauglichkeit (Trainer-Modus?), Gym-Integration, Mitgliederbindung, Upsell-Potential |
| **Staerke** | Kennt den echten Gym-Alltag und weiss was Trainer und Mitglieder wirklich brauchen |
| **Schwaeche** | Sieht alles durch die B2B-Brille, FitBuddy ist aber B2C |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| I4-S1 | B2B-Tauglichkeit bewerten | Gibt es einen Trainer-Modus? Multi-User-Management? White-Label-Option? |
| I4-S2 | Geraetepark aus Gym-Perspektive pruefen | Sind die 52 Geraete realistisch? Fehlen Standard-Gym-Geraete? |
| I4-S3 | Trainingsplan-Qualitaet bewerten | KI-generierte Plaene: Wuerde ein zertifizierter Trainer das unterschreiben? |
| I4-S4 | Mitgliederbindungs-Potential bewerten | Gamification, Challenges, Community → reicht das fuer Retention? |
| I4-S5 | Wettbewerber-Vergleich aus Gym-Sicht | FitBuddy vs. eGym, Virtuagym, Trainerize → wo positioniert sich FitBuddy? |

---

### I5 — Ayla Demir, 31, DSGVO-/Regulatory-Beraterin (Health-Tech)

| Feld | Wert |
|------|------|
| **Berufserfahrung** | 8 Jahre. Jura-Studium → Datenschutz-Beratung. BfDI (1 Jahr), jetzt bei einer Health-Tech-Kanzlei. |
| **Spezialisierung** | DSGVO Art. 9, MDR (Medical Device Regulation), Health-App-Regulierung, ePrivacy |
| **Fitness-Kenntnis** | Mittel. Nutzt Yazio. Kennt den regulatorischen Rahmen von Health-Apps in DE/EU. |
| **Tech-Kenntnis** | Niedrig-Mittel. Versteht Datenfluss-Diagramme, kann AVVs lesen, kein Code. |
| **Review-Stil** | Liest Datenschutzerklaerung, Impressum, AGB. Prueft Consent-Flows. Sucht nach DSGVO-Verstoessen. |
| **Persoenlichkeit** | Juristisch praezise. "Steht das so in der Datenschutzerklaerung?" |
| **Fokus-Bereiche** | DSGVO Art. 9 (Gesundheitsdaten), Einwilligungsmanagement, Datenschutzerklaerung, AVV-Kette, Loeschkonzept |
| **Staerke** | Findet regulatorische Luecken die zu Bussgeldern fuehren koennten |
| **Schwaeche** | Sieht Risiken wo keine sind — "Vorsichtshalber nochmal den Anwalt fragen" |

**Szenarien:**

| # | Szenario | Was wird geprueft |
|---|----------|------------------|
| I5-S1 | Einwilligungs-Flow pruefen | Granulare Einwilligung (Gesundheit, KI, Drittland)? Widerruf moeglich? Art. 7 Abs. 3? |
| I5-S2 | Datenschutzerklaerung bewerten | Vollstaendig? Art. 13/14-konform? Alle Datenverarbeitungen aufgelistet? |
| I5-S3 | AVV-Kette validieren | Hetzner AVV + OpenAI DPA vorhanden? Drittlandtransfer Art. 44ff? |
| I5-S4 | Loeschkonzept pruefen | Art. 17 funktional? Audit-Trail? Retention-Policy? Account-Loeschung CASCADE? |
| I5-S5 | MDR-Abgrenzung bewerten | Ist FitBuddy ein Medizinprodukt? Wo ist die Grenze? BP-Klassifikation → MDR-Risiko? |

---

## Safetyund Sicherheits-Szenarien (Pro-Tester)

> Pro-Tester haben andere Safety-Szenarien als Endnutzer.
> Hier geht es um TECHNISCHE Sicherheit, nicht um Nutzer-Sicherheit.

| # | Szenario | Betroffene Twins | Erwartung |
|---|----------|------------------|-----------|
| SEC1 | SQL-Injection via Freitext-Eingabe | F3, G1, G3 | PostgREST + RLS verhindern Injection |
| SEC2 | XSS via Buddy-Chat-Nachricht | F3, G1 | React-Markdown sanitized, kein raw dangerouslySetInnerHTML |
| SEC3 | IDOR (Insecure Direct Object Reference) | F3, H2 | RLS verhindert Zugriff auf fremde User-Daten via manipulierter ID |
| SEC4 | API-Key im Frontend-Bundle | F3, G4, H2 | Kein OPENAI_API_KEY in dist/*.js. Nur VITE_SUPABASE_ANON_KEY (public) |
| SEC5 | Offene Ports auf Server | H1, H2, H5 | Nur 80/443 offen. 5432 (PostgreSQL) NICHT von aussen erreichbar |
| SEC6 | Backup-Verschluesselung | H3 | pg_dump-Backups verschluesselt gespeichert? |
| SEC7 | DSGVO Consent-Bypass | I5, H2 | Kann ein User Features nutzen OHNE granulare Einwilligung? |
| SEC8 | Rate-Limiting auf Auth-Endpoints | H2, F3 | GoTrue Login/Register ohne Rate-Limiting = Brute-Force-Anfaelligkeit |
| SEC9 | Docker-Socket-Exposure | H1, H2 | Laeuft etwas mit Zugriff auf /var/run/docker.sock? Root-Exploit auf Host? |
| SEC10 | Supabase Studio/Kong von aussen erreichbar | H1, H2, H5 | Port 3000 (Studio), 8000 (Kong) von aussen erreichbar? Nur SSH-Tunnel? |

---

## Durchfuehrung

### Pro-Tester Workflow

**Reihenfolge:** F1 → F5 → G1 → G5 → H1 → H5 → I1 → I5

**Pro Twin:**
- ~60-120 Minuten (Architekten/Coders lesen Code; Deployers pruefen Server; Marketing nutzt App)
- Fokus auf die 5 definierten Szenarien
- Dokumentation als Score + Findings

**Output pro Twin:**
- Score (0-100) pro relevanter Dimension
- ✅ Professionelles Lob (was ist gut geloest)
- ⚠️ Verbesserungsvorschlag (mit konkreter Loesung)
- ❌ Kritischer Fehler (muss sofort gefixt werden)
- 💡 Architektur-/Produkt-Empfehlung (langfristig)

**Gesamt-Output:** Aggregierter Pro-Report in `TWIN_TESTING_REPORT_PRO.md`

---

## Beziehung zu Endnutzer-Twins (A–E)

| Aspekt | Endnutzer-Twins (A–E) | Pro-Tester-Twins (F–I) |
|--------|----------------------|----------------------|
| **Anzahl** | 25 (5 Gruppen) | 20 (4 Gruppen) |
| **Perspektive** | "Hilft mir die App?" | "Ist die App gut gebaut?" |
| **Bewertung** | Funktionalitaet, UX, Personalisierung | Architektur, Code, Security, Markt |
| **Safety** | Nutzer-Sicherheit (Allergien, Kontraindikationen) | Technische Sicherheit (SQL-Injection, XSS, IDOR) |
| **Ergebnis** | Feature-Requests, UX-Fixes | Architektur-Verbesserungen, Produkt-Strategie |
| **Wann ausfuehren** | Nach jedem groesseren Feature-Release | Nach Abschluss einer Entwicklungsphase |

### Mapping-Matrix: Endnutzer-Symptom → Pro-Twin-Zustaendigkeit

| # | Endnutzer meldet... | Betroffener Endnutzer-Twin | Root-Cause-Analyse durch Pro-Twin |
|---|---------------------|---------------------------|----------------------------------|
| 1 | "Login funktioniert nicht auf fudda.de" | A1 Stefan, alle | G4 (Build/Env), H1 (Docker), H2 (SSL/Security) |
| 2 | "Kalorien werden falsch berechnet" | B1 Thomas, A3 Karim | G3 (End-to-End Flow), F5 (DB-Query) |
| 3 | "App ist auf Arabisch kaputt" | A5 Hassan, E2 Fatima | G5 (i18n/RTL), I3 (UX) |
| 4 | "Buddy antwortet nicht" | Alle | G3 (Error-Handling), F2 (Edge Functions), H1 (Container) |
| 5 | "Meine Daten sind verschwunden" | D1 Timo | F3 (RLS), F5 (DB), H3 (Backup) |
| 6 | "App laedt zu langsam" | B5 Ralf, A2 Monika | F4 (Bundle/Performance), H1 (Server), G4 (Build) |
| 7 | "Registrierungs-Email kommt nicht an" | E2 Fatima | H5 (DNS/SPF/DKIM), H2 (SMTP-Config) |
| 8 | "Trainingsplan enthaelt gefaehrliche Uebungen" | E4 Lena (Rektusdiastase) | I3 (UX/Safety), F4 (KI-Architektur), I5 (Regulatorik) |
| 9 | "App zeigt fremde Daten" | D2 Viktor (PED-Privacy) | F3 (Security/RLS), H2 (Pentest) |
| 10 | "Warum soll ich fuer die App bezahlen?" | A5 Hassan (Budget 0 EUR) | I1 (Monetarisierung), I2 (Value Proposition) |

---

---

## Experten-Reviews (3x unabhaengig, 2026-03-02)

### Review #1: Prof. Dr. Martina Bauer — Software-Engineering (8.5/10)

**Staerken:** Exzellente Profiltiefe mit glaubwuerdigen Biografien, Szenario-Qualitaet bei Gruppe F hervorragend, klare Abgrenzung Endnutzer vs. Pro.

| # | Finding | Status | Fix |
|---|---------|--------|-----|
| F1 | Overlap F4/G1 schaerfen | ✅ ANGENOMMEN | F4 auf Systemebene gehoben, G1 bleibt Zeilenebene |
| F2 | API-Design/PostgREST-Szenario fehlt | ✅ ANGENOMMEN | F4-S4 durch PostgREST API Surface Review ersetzt |
| F3 | Error Boundaries in G3-S2 ergaenzen | ✅ ANGENOMMEN | G3-S2 um React Error Boundaries + Suspense erweitert |
| F4 | Performance-Gewichtung erhoehen | ⏳ SPAETER | Bei naechster Scoring-Ueberarbeitung |
| F5 | Dimension MAINTAINABILITY ergaenzen | ⏳ SPAETER | Bei v2.0 des Scoring-Frameworks |

### Review #2: Thomas Wenger — DevOps Lead (7.5/10)

**Staerken:** Realistische Tool-Stacks, H2 Security/Compliance exzellent, H3 Backup als eigenstaendiges Profil zeigt operative Reife.

| # | Finding | Status | Fix |
|---|---------|--------|-----|
| F6 | H1-S5: Log-Management statt Monitoring-Setup | ✅ ANGENOMMEN | Umformuliert auf Log-Rotation, Disk-Alerting |
| F7 | Docker-Image-Update-Szenario fehlt | ✅ ANGENOMMEN | H4-S6 neu ergaenzt |
| F8 | H3-Szenarien pragmatischer fuer Single-VPS | ✅ ANGENOMMEN | WAL→Backup-Exfiltration, DR→Pragmatischer Recovery-Plan |
| F9 | SEC8/SEC9/SEC10 ergaenzen | ✅ ANGENOMMEN | Rate-Limiting, Docker-Socket, Studio-Exposure |
| F10 | H5 zu Infrastructure Generalist umbauen | ❌ ABGELEHNT | DNS bleibt wegen Email-Deliverability kritisch; S3/S4 angepasst |

### Review #3: Dr. Julia Kramer — Product-Strategin (8.0/10)

**Staerken:** I3 (UX) staerkstes Profil, I5 (DSGVO) als Produktmerkmal positioniert, realistische Karrierepfade.

| # | Finding | Status | Fix |
|---|---------|--------|-----|
| F11 | Analytics-Readiness bei I1 fehlt | ✅ ANGENOMMEN | I1-S6 neu ergaenzt |
| F12 | I4 durch Community/Retention ersetzen | ⏳ SPAETER | B2B-Perspektive vorerst beibehalten |
| F13 | Mapping-Matrix Endnutzer→Pro fehlt | ✅ ANGENOMMEN | 10-Symptom-Mapping ergaenzt |
| F14 | Overlap F3-S5 / I5 schaerfen | ✅ ANGENOMMEN | F3 auf technisch, I5 auf juristisch getrennt |
| F15 | Monetarisierung I1-S3 vertiefen | ✅ ANGENOMMEN | In 3 Sub-Szenarien (Paywall, Benchmark, Revenue) aufgeteilt |

**Gesamt:** 12 Fixes angenommen, 1 abgelehnt, 3 fuer spaeter vorgemerkt.

---

*Erstellt: 2026-03-02, ca. 08:00 UTC*
*Experten-Review: 2026-03-02, 3 Reviewer (SE-Professorin, DevOps Lead, Product-Strategin), 15 Findings, 12 Fixes angenommen*
*Basierend auf: DIGITAL_TWINS.md (25 Endnutzer-Twins), DIGITAL_TWINS_V2_KONZEPT.md (Scoring-Framework), TWIN_TESTING_REPORT.md (v1.0 Ergebnisse)*
