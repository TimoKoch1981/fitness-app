# Rechtliche Anforderungen fuer FitBuddy (fudda.de)

> Umfassende Analyse der regulatorischen Anforderungen fuer eine Gesundheits- und Fitness-App
> mit KI-Komponenten, Gesundheitsdatenverarbeitung und Substanz-Tracking.
>
> Stand: 2026-03-01 | Jurisdiktion: Deutschland / EU

---

## Inhaltsverzeichnis

- [A. DSGVO / GDPR - Datenschutz](#a-dsgvo--gdpr---datenschutz)
- [B. MDR - Medizinprodukteverordnung](#b-mdr---medizinprodukteverordnung)
- [C. HWG - Heilmittelwerbegesetz](#c-hwg---heilmittelwerbegesetz)
- [D. ePrivacy / TTDSG / Cookie-Recht](#d-eprivacy--ttdsg--cookie-recht)
- [E. Aktionsplan und Priorisierung](#e-aktionsplan-und-priorisierung)

---

## A. DSGVO / GDPR - Datenschutz

### A.1 Rechtsgrundlagen fuer FitBuddy

FitBuddy verarbeitet **Gesundheitsdaten** im Sinne von Art. 9 Abs. 1 DSGVO (besondere Kategorien personenbezogener Daten). Dazu gehoeren:

| Datenkategorie | Beispiele | Art. 9 relevant? |
|---|---|---|
| Koerpermesswerte | Gewicht, KFA, BMI, Umfaenge | Ja |
| Blutdruckdaten | Systolisch, Diastolisch, Puls, Klassifikation | Ja |
| Substanzen/Medikation | TRT, Wegovy, PEDs, Supplements, Dosierungen | Ja |
| Ernaehrungsdaten | Mahlzeiten, Kalorien, Makros | Grenzwertig* |
| Trainingsdaten | Uebungen, Dauer, Kalorien verbrannt | Grenzwertig* |
| Profildaten | Name, Geburtsdatum, Geschlecht, Groesse | Nein (Art. 6) |
| KI-Chatverlaeufe | Gespraeche mit Buddy ueber Gesundheit | Ja (wenn Gesundheitsbezug) |

> *Ernaehrungs- und Trainingsdaten werden zu Gesundheitsdaten, sobald sie mit medizinischen Daten
> verknuepft oder zur Gesundheitsanalyse verwendet werden (EuGH-Rechtsprechung).

### A.2 Rechtsgrundlage fuer Verarbeitung

| Verarbeitung | Rechtsgrundlage | Artikel |
|---|---|---|
| Registrierung + Login | Vertragserfuellung | Art. 6 Abs. 1 lit. b |
| Gesundheitsdaten-Tracking | **Ausdrueckliche Einwilligung** | Art. 9 Abs. 2 lit. a |
| KI-Analyse der Daten | Ausdrueckliche Einwilligung | Art. 9 Abs. 2 lit. a |
| KI-Proxy (OpenAI API) | Ausdrueckliche Einwilligung + AVV | Art. 9 Abs. 2 lit. a + Art. 28 |
| Benachrichtigungen | Berechtigtes Interesse / Einwilligung | Art. 6 Abs. 1 lit. f / a |
| Anonymisierte Statistiken | Berechtigtes Interesse | Art. 6 Abs. 1 lit. f |

### A.3 Anforderungen an die Einwilligung (Art. 7 + Art. 9 DSGVO)

Die Einwilligung fuer Gesundheitsdaten muss **ausdruecklich** erfolgen (einfaches Opt-in reicht nicht):

| Anforderung | Beschreibung | Status FitBuddy |
|---|---|---|
| Freiwillig | Kein Zwang, kein Kopplungsverbot | OK (App nutzbar ohne Tracking) |
| Bestimmt | Konkret auf Zweck bezogen | OFFEN - Disclaimer muss spezifischer werden |
| Informiert | Nutzer muss wissen, was passiert | OFFEN - Datenschutzerklaerung fehlt |
| Unmissverstaendlich | Aktive Handlung (Checkbox, nicht vorangekreuzt) | OK (Checkbox in DisclaimerModal) |
| Ausdruecklich (Art. 9) | Separates, erkennbares Statement | OFFEN - Gesundheitsdaten muessen separat bestaetigt werden |
| Widerrufbar | Jederzeit, so einfach wie Erteilung | OFFEN - Widerrufsmechanismus fehlt |
| Nachweisbar | Wann, was, wer | OK (disclaimer_accepted_at in DB) |
| Granular | Pro Zweck getrennt | OFFEN - eine einzige Einwilligung fuer alles |

### A.4 Betroffenenrechte (Art. 15-22 DSGVO)

| Recht | Artikel | Implementierung noetig |
|---|---|---|
| Auskunft | Art. 15 | Datenexport-Funktion (JSON/PDF) |
| Berichtigung | Art. 16 | Alle Daten editierbar (bereits moeglich) |
| Loeschung ("Recht auf Vergessenwerden") | Art. 17 | **Account-Loeschung mit Kaskade** |
| Einschraenkung | Art. 18 | Deaktivierung einzelner Trackings |
| Datenuebertragbarkeit | Art. 20 | Export in maschinenlesbarem Format |
| Widerspruch | Art. 21 | Opt-out fuer KI-Analyse |
| Automatisierte Entscheidungen | Art. 22 | KI-Empfehlungen als Vorschlaege kennzeichnen |

### A.5 Technische und organisatorische Massnahmen (TOMs, Art. 32)

| Massnahme | Beschreibung | Status |
|---|---|---|
| Verschluesselung in Transit | HTTPS/TLS via Caddy | OK |
| Verschluesselung at Rest | PostgreSQL auf Hetzner (Disk Encryption) | PRUEFEN |
| Zugangskontrolle | Supabase Auth + RLS auf allen Tabellen | OK |
| Row Level Security | `auth.uid() = user_id` auf 16+ Tabellen | OK |
| Pseudonymisierung | UUIDs statt Klarnamen als PKs | OK |
| Datensparsamkeit | Nur noetige Daten erfasst | OK |
| Logging / Audit Trail | ai_usage_logs, substance_logs | TEILWEISE |
| Backup & Recovery | PostgreSQL Backup auf Hetzner | PRUEFEN |
| Zugriffsbeschraenkung (Admin) | Admin-Rolle mit erweitertem Zugriff | OK |
| Regelmässige Tests | 2.095 Tests inkl. RLS-Tests | OK |

### A.6 Auftragsverarbeitung (Art. 28 DSGVO)

Fuer jeden externen Dienstleister, an den personenbezogene Daten uebermittelt werden, ist ein **Auftragsverarbeitungsvertrag (AVV)** erforderlich:

| Dienstleister | Zweck | Datenfluss | AVV noetig? | Status |
|---|---|---|---|---|
| Hetzner Cloud | Hosting (VPS CX33, Nuernberg) | Alle Daten auf Server | Ja | ✅ AVV abgeschlossen (2026-03-01) |
| OpenAI (gpt-4o-mini) | KI-Analyse via ai-proxy | Chat-Nachrichten + Kontext | **Ja (kritisch!)** | ✅ DPA abgeschlossen (OpenAI Ireland Ltd.) |
| Resend | Email-Versand | Email-Adressen | Ja | OFFEN |
| Open Food Facts | Naehrwert-Lookup | Suchanfragen (keine PII) | Nein* | - |
| Strato | Domain-Registrar | WHOIS-Daten | Ja (Bestandskunde) | PRUEFEN |

> *Open Food Facts erhaelt keine personenbezogenen Daten (nur Produktsuchen).

**Kritisch: OpenAI als Auftragsverarbeiter**

Der KI-Proxy (`ai-proxy` Edge Function) sendet Nutzerdaten an OpenAI:
- Chat-Nachrichten koennen Gesundheitsinformationen enthalten
- System-Prompts enthalten Nutzerprofildaten (Alter, Gewicht, Medikation)
- OpenAI sitzt in den **USA** → Drittlandtransfer (Art. 44-49 DSGVO)

Erforderliche Massnahmen:
1. AVV mit OpenAI abschliessen (OpenAI bietet DPA an)
2. Standardvertragsklauseln (SCCs) pruefen
3. Transfer Impact Assessment (TIA) durchfuehren
4. Nutzer ueber Drittlandtransfer informieren
5. Alternative: EU-basierter KI-Provider oder lokales LLM (Ollama)

### A.7 Datenschutzerklaerung (Art. 13/14 DSGVO)

Eine vollstaendige Datenschutzerklaerung muss folgende Punkte enthalten:

```
1. Verantwortlicher (Name, Adresse, Kontakt)
2. Datenschutzbeauftragter (falls erforderlich*)
3. Kategorien verarbeiteter Daten
4. Zwecke und Rechtsgrundlagen
5. Empfaenger / Auftragsverarbeiter
6. Drittlandtransfer (OpenAI/USA)
7. Speicherdauer / Loeschfristen
8. Betroffenenrechte (Art. 15-22)
9. Beschwerderecht bei Aufsichtsbehoerde
10. Pflicht/Freiwilligkeit der Bereitstellung
11. Automatisierte Entscheidungsfindung (KI)
12. Aenderungen der Datenschutzerklaerung
```

> *Datenschutzbeauftragter: Pflicht ab 20 Personen, die regelmaessig automatisiert
> personenbezogene Daten verarbeiten (§ 38 BDSG). Bei < 20 Nutzern nicht zwingend,
> aber empfohlen bei Gesundheitsdaten.

### A.8 Datenschutz-Folgenabschaetzung (DSFA, Art. 35 DSGVO)

Eine DSFA ist **zwingend erforderlich** wenn:
- Gesundheitsdaten umfangreich verarbeitet werden (**trifft zu**)
- Systematische Bewertung persoenlicher Aspekte (Profiling) (**trifft zu** - KI-Analyse)
- Innovative Technologien eingesetzt werden (**trifft zu** - LLM/KI)

| DSFA-Element | Inhalt |
|---|---|
| Beschreibung der Verarbeitung | Gesundheitstracking + KI-Analyse |
| Bewertung der Notwendigkeit | Zweckgebunden, datensparsam |
| Risikobewertung | Hoch (Gesundheitsdaten + KI + Drittlandtransfer) |
| Abhilfemassnahmen | Verschluesselung, RLS, Einwilligung, AVV, Pseudonymisierung |

---

## B. MDR - Medizinprodukteverordnung (EU) 2017/745

### B.1 Ist FitBuddy ein Medizinprodukt?

Die Einordnung haengt von der **Zweckbestimmung** ab:

| Kriterium | FitBuddy | Medizinprodukt? |
|---|---|---|
| Diagnose von Krankheiten | Nein - keine Diagnosen | Nein |
| Therapieempfehlungen | Nein - nur allgemeine Fitness-Tipps | Nein |
| Blutdruck-Klassifikation | ESC/ESH-Einstufung (informativ) | **Grenzfall** |
| KI-Gesundheitsempfehlungen | Allgemeine Empfehlungen, kein Therapiebezug | Nein |
| Substanz-Tracking | Dokumentation, keine Dosierungsempfehlung | Nein |
| Kalorien-/BMR-Berechnung | Allgemeine Wellness-Berechnung | Nein |

### B.2 Abgrenzung: Wellness-App vs. Medizinprodukt

```
                    ┌──────────────────────────────────┐
                    │         FITBUDDY IST HIER:        │
                    │                                    │
     Wellness-App   │   ┌────────────────────┐          │  Medizinprodukt
    ◄────────────── │   │ Fitness-Tracking    │          │ ──────────────►
                    │   │ + Gesundheits-      │          │
     Kein MDR       │   │   dokumentation     │          │  MDR Klasse I/IIa
                    │   │ + KI-Lifestyle-     │          │
                    │   │   Empfehlungen      │          │
                    │   └────────────────────┘          │
                    │                                    │
                    │  GRENZE: Keine Diagnose,           │
                    │  keine Therapie, keine              │
                    │  klinische Entscheidung             │
                    └──────────────────────────────────┘
```

### B.3 Schutz vor MDR-Einstufung

Um **nicht** als Medizinprodukt eingestuft zu werden, muessen folgende Regeln eingehalten werden:

| Regel | Massnahme | Status |
|---|---|---|
| Kein Diagnose-Anspruch | KI gibt keine Diagnosen, nur Informationen | OK (Disclaimer) |
| Kein Therapievorschlag | Keine Dosierungsempfehlungen fuer Substanzen | PRUEFEN |
| Deutliche Abgrenzung | Disclaimer: "Kein Ersatz fuer aerztliche Beratung" | OK (DisclaimerModal) |
| BP-Klassifikation nur informativ | "Informativ, nicht diagnostisch" kennzeichnen | OFFEN |
| KI-Empfehlungen als Vorschlaege | "Basierend auf allgemeinen Richtlinien" markieren | TEILWEISE |
| Keine klinischen Claims | Weder in App noch in Marketing | PRUEFEN |

### B.4 Disclaimer-Anforderungen (aktueller vs. benoetigter Stand)

Aktuell im DisclaimerModal implementierte Sektionen:
- Medizinischer Hinweis (Heart Icon)
- Substanzen-Hinweis (Pill Icon)
- Blutdruck-Hinweis (Activity Icon)
- Daten-Hinweis (Database Icon)
- Risiko-Hinweis (AlertTriangle Icon)

Zusaetzlich benoetigt:
- Expliziter Hinweis auf **KI-Limitierungen** ("KI kann Fehler machen")
- Hinweis auf **Drittlandtransfer** bei KI-Nutzung (OpenAI/USA)
- **Granulare Einwilligung** (separate Checkboxen fuer verschiedene Datenarten)
- Link zur **vollstaendigen Datenschutzerklaerung**
- Hinweis auf **Widerrufsrecht**

---

## C. HWG - Heilmittelwerbegesetz

### C.1 Relevanz fuer FitBuddy

Das HWG gilt fuer Werbung fuer:
- Arzneimittel (inkl. verschreibungspflichtige Medikamente)
- Medizinprodukte
- Verfahren und Behandlungen

| Aspekt | FitBuddy-Relevanz | HWG-Risiko |
|---|---|---|
| Substanz-Presets (24 vordefiniert) | 12 Supplements + 12 PEDs | **Hoch** |
| KI-Empfehlungen zu Substanzen | Substanz-Agent mit Fachwissen | **Hoch** |
| Blutdruck-Auswertung | ESC/ESH-Klassifikation | Mittel |
| Ernaehrungsempfehlungen | Kalorien, Protein, Makros | Niedrig |
| Trainingsempfehlungen | Uebungen, Plaene | Niedrig |

### C.2 Kritische Bereiche

**Substanz-Presets und PED-Information:**

Die App enthaelt 12 vordefinierte PED-Substanzen (Performance Enhancing Drugs) mit detaillierten Informationen:

| Risiko | Beschreibung | Massnahme |
|---|---|---|
| Werbung fuer Arzneimittel | PED-Presets koennten als Werbung interpretiert werden | Rein dokumentarisch, keine Empfehlung |
| Dosierungsangaben | Default-Dosierungen in Presets | Als "typische Dokumentationswerte" kennzeichnen |
| Laienwerbung § 10 HWG | Werbung fuer verschreibungspflichtige Arzneimittel bei Laien verboten | Disclaimer: "Nur zur Dokumentation, nicht als Empfehlung" |
| § 3a HWG | Verbot der Werbung fuer nicht zugelassene Arzneimittel | PEDs sind z.T. nicht als Arzneimittel zugelassen |

### C.3 Empfohlene Schutzmassnahmen

```
┌──────────────────────────────────────────────────────────┐
│              HWG-Compliance-Strategie                     │
│                                                           │
│  1. FRAMING                                               │
│     - "Dokumentation" statt "Empfehlung"                  │
│     - "Protokoll fuer Ihren Arzt" statt "Anleitung"       │
│     - "Substanzen" statt "Medikamente/Arzneimittel"       │
│                                                           │
│  2. DISCLAIMER (pro Substanz-Interaktion)                 │
│     - "Keine medizinische Beratung"                       │
│     - "Konsultieren Sie Ihren Arzt"                       │
│     - "Nur zur persoenlichen Dokumentation"               │
│                                                           │
│  3. KI-AGENT REGELN                                       │
│     - Substanz-Agent gibt KEINE Dosierungsempfehlungen    │
│     - Keine Wirksamkeitsaussagen                          │
│     - Verweis an Arzt bei medizinischen Fragen            │
│                                                           │
│  4. MARKETING                                             │
│     - Keine Heilversprechen                               │
│     - Keine Vorher/Nachher mit Substanzbezug              │
│     - Keine Testimonials mit Medikamentenbezug            │
└──────────────────────────────────────────────────────────┘
```

### C.4 Substanz-Agent Compliance-Regeln

Der bestehende `substanceAgent.ts` muss folgende Regeln einhalten:

| Regel | Beschreibung | Implementierung |
|---|---|---|
| Keine Dosierungsempfehlung | Agent schlaegt keine Dosierungen vor | System-Prompt-Regel |
| Keine Wirksamkeitsaussagen | "Testosteron hilft beim Muskelaufbau" vermeiden | System-Prompt-Regel |
| Arzt-Verweis | Bei medizinischen Fragen immer an Arzt verweisen | System-Prompt-Regel |
| Urteilsfreiheit | Keine moralische Bewertung von Substanzgebrauch | OK (Architektur-Prinzip) |
| Dokumentationsfokus | Nur Erfassung und Protokollierung | System-Prompt-Regel |
| PED-Disclaimer | Zusaetzlicher Warnhinweis bei PED-Interaktionen | OFFEN |

---

## D. ePrivacy / TTDSG / Cookie-Recht

### D.1 TTDSG (Telekommunikation-Telemedien-Datenschutz-Gesetz)

Das TTDSG (seit 01.12.2021) regelt den Zugriff auf Endgeraeteinformationen:

| Zugriff | Zweck | Einwilligung noetig? | Status |
|---|---|---|---|
| localStorage (Disclaimer-Flag) | Funktionsnotwendig | Nein (§ 25 Abs. 2 Nr. 2 TTDSG) | OK |
| localStorage (Session-Daten) | Funktionsnotwendig | Nein | OK |
| Supabase Auth Cookies | Authentifizierung | Nein (technisch notwendig) | OK |
| KI-Chat sessionStorage | Chat-Threads | Nein (funktionsnotwendig) | OK |
| Capacitor Local Notifications | Erinnerungen (vom Nutzer konfiguriert) | Nein (vom Nutzer initiiert) | OK |
| Analytics / Tracking | Marketing | **Ja** (wenn implementiert) | N/A (nicht implementiert) |
| Kamera-Zugriff | Screenshot-Import | **Ja** (Permission API) | PRUEFEN |
| Mikrofon-Zugriff | Voice Input | **Ja** (Permission API) | PRUEFEN |

### D.2 Cookie-Banner und Consent-Management

**Aktueller Stand:** FitBuddy verwendet **keine Tracking-Cookies** und kein Analytics.

| Szenario | Cookie-Banner noetig? |
|---|---|
| Aktuell (nur funktionale Speicherung) | **Nein** |
| Falls Analytics hinzugefuegt wird | **Ja** (z.B. Matomo, Plausible, GA) |
| Falls Drittanbieter-Skripte eingebunden werden | **Ja** |
| Falls Werbe-Tracking eingesetzt wird | **Ja** |

**Empfehlung:** Wenn Analytics eingefuehrt wird, **Matomo** (self-hosted auf Hetzner) verwenden — dann bleiben alle Daten in Deutschland und Consent-Anforderungen sind vereinfacht.

### D.3 Caddyfile Headers (aktueller Stand) ✅ KOMPLETT (v12.17, 2026-03-01)

Alle Security Headers sind konfiguriert und verifiziert auf fudda.de:

```
# Konfiguriert in /opt/fitbuddy/Caddyfile + deploy/Caddyfile (Repo)
header {
    X-Content-Type-Options nosniff
    X-Frame-Options DENY
    Referrer-Policy strict-origin-when-cross-origin
    Permissions-Policy "camera=(self), microphone=(self), geolocation=(), payment=()"
    -Server
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-XSS-Protection "1; mode=block"
    Cross-Origin-Opener-Policy same-origin-allow-popups
    Cross-Origin-Resource-Policy same-origin
    Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https://world.openfoodfacts.org; font-src 'self';
      connect-src 'self' wss://{$DOMAIN}; frame-src https://www.youtube.com
      https://www.youtube-nocookie.com https://open.spotify.com https://accounts.spotify.com;
      media-src 'self' blob:; worker-src 'self' blob:; object-src 'none';
      base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
}
```

### D.4 Impressumspflicht (TMG / DDG)

Als kommerziell geplante App (100+ Nutzer, EU/Deutschland) besteht **Impressumspflicht**:

| Pflichtangabe | Beschreibung |
|---|---|
| Name und Anschrift | Vollstaendiger Name des Betreibers, Postadresse |
| Kontaktdaten | Email, ggf. Telefon |
| Vertretungsberechtigter | Bei juristischer Person |
| Handelsregister | Falls eingetragen (Nr. + Registergericht) |
| USt-IdNr. | Falls vorhanden |
| Zustaendige Aufsichtsbehoerde | Falls reguliert |
| Berufskammer | Falls kammerpflichtig (hier nicht) |
| Verantwortlicher i.S.d. § 18 MStV | Fuer journalistisch-redaktionelle Inhalte |

---

## E. Aktionsplan und Priorisierung

### E.1 Kritisch (vor kommerziellem Launch)

| # | Massnahme | Bereich | Aufwand | Beschreibung |
|---|---|---|---|---|
| E.1.1 | **Datenschutzerklaerung erstellen** | DSGVO Art. 13/14 | Hoch | Vollstaendige Datenschutzerklaerung mit allen Pflichtangaben, Drittlandtransfer-Info, KI-Hinweis |
| E.1.2 | **Impressum erstellen** | TMG/DDG | Niedrig | Pflichtangaben auf fudda.de |
| E.1.3 | ~~**Einwilligung granularisieren**~~ ✅ | DSGVO Art. 9 | Mittel | ✅ 3 Consent-Felder, DisclaimerModal 4 Checkboxen, useDisclaimerCheck, Production deployed (2026-03-01) |
| E.1.4 | ~~**AVV mit OpenAI abschliessen**~~ ✅ | DSGVO Art. 28 | Mittel | ✅ DPA mit OpenAI Ireland Ltd. abgeschlossen (2026-03-01) |
| E.1.5 | ~~**AVV mit Hetzner pruefen**~~ ✅ | DSGVO Art. 28 | Niedrig | ✅ AVV mit Hetzner Online GmbH abgeschlossen (2026-03-01) |
| E.1.6 | **Account-Loeschung implementieren** | DSGVO Art. 17 | Mittel | Vollstaendige Kaskaden-Loeschung aller Nutzerdaten |
| E.1.7 | ~~**Widerrufsrecht implementieren**~~ ✅ | DSGVO Art. 7 Abs. 3 | Mittel | ✅ PrivacySettings Komponente, pro-Consent Revoke, Re-Consent-Flow (2026-02-28) |
| E.1.8 | **DSFA durchfuehren** | DSGVO Art. 35 | Hoch | Datenschutz-Folgenabschaetzung dokumentieren |

### E.2 Wichtig (zeitnah nach Launch)

| # | Massnahme | Bereich | Aufwand | Beschreibung |
|---|---|---|---|---|
| E.2.1 | ~~**Datenexport-Funktion**~~ ✅ | DSGVO Art. 20 | Mittel | ✅ useDataExport Hook, 16 Tabellen, JSON-Download (2026-02-28) |
| E.2.2 | ~~**KI-Disclaimer erweitern**~~ ✅ | MDR/DSGVO | Niedrig | ✅ "KI-generiert — keine medizinische Beratung" unter jeder AI-Antwort (2026-02-28) |
| E.2.3 | ~~**BP-Klassifikation kennzeichnen**~~ ✅ | MDR | Niedrig | ✅ ESC/ESH 2023 Hinweis in MedicalPage + AddBloodPressureDialog (2026-02-28) |
| E.2.4 | ~~**PED-Disclaimer verstaerken**~~ ✅ | HWG | Niedrig | ✅ Amber-Badge, Harm-Reduction-Hinweis bei PED/TRT (2026-02-28) |
| E.2.5 | ~~**Substanz-Agent System-Prompt haerten**~~ ✅ | HWG | Niedrig | ✅ Haftungsregeln-Block, keine Dosierungsempfehlungen (2026-02-28) |
| E.2.6 | **AVV mit Resend pruefen** | DSGVO Art. 28 | Niedrig | Resend DPA pruefen (EU-Region: eu-west-1) |
| E.2.7 | ~~**Security Headers ergaenzen**~~ ✅ | ePrivacy/Sicherheit | Niedrig | ✅ CSP, HSTS, COOP, CORP, XSS-Protection in Caddyfile (v12.17, 2026-03-01) |

### E.3 Empfohlen (mittelfristig)

| # | Massnahme | Bereich | Aufwand | Beschreibung |
|---|---|---|---|---|
| E.3.1 | **Verarbeitungsverzeichnis** | DSGVO Art. 30 | Mittel | Dokumentation aller Verarbeitungstaetigkeiten |
| E.3.2 | **Loeschkonzept** | DSGVO Art. 17 | Mittel | Automatische Loeschfristen definieren und implementieren |
| E.3.3 | **Audit-Trail erweitern** | DSGVO Art. 5 | Mittel | Vollstaendige Protokollierung aller Datenzugriffe |
| E.3.4 | **Penetration Test** | DSGVO Art. 32 | Hoch | Sicherheitstest durch externen Dienstleister |
| E.3.5 | **Backup-Verschluesselung pruefen** | DSGVO Art. 32 | Niedrig | PostgreSQL-Backup-Verschluesselung auf Hetzner verifizieren |
| E.3.6 | **Incident-Response-Plan** | DSGVO Art. 33/34 | Mittel | Meldeverfahren bei Datenschutzverletzungen (72h an Aufsichtsbehoerde) |
| E.3.7 | **EU-KI-Provider evaluieren** | DSGVO Art. 44 | Mittel | Alternative zu OpenAI ohne Drittlandtransfer (z.B. Mistral, Aleph Alpha, Ollama) |
| E.3.8 | **AGB erstellen** | BGB | Mittel | Allgemeine Geschaeftsbedingungen fuer kommerzielle Nutzung |
| E.3.9 | **Nutzungsbedingungen** | BGB/TMG | Mittel | Nutzungsregeln, Haftungsbeschraenkung, Kuendigungsrecht |

### E.4 Compliance-Uebersicht

```
┌──────────────────────────────────────────────────────────────┐
│              RECHTSKONFORMITAET STATUS-MATRIX                 │
│                                                               │
│  Bereich           Status      Kritisch  Fertig  Offen       │
│  ─────────────────────────────────────────────────            │
│  DSGVO Basis       TEILWEISE   8         3       5           │
│  DSGVO TOMs        GUT         -         6       2           │
│  MDR Abgrenzung    GUT         -         3       2           │
│  HWG Compliance    TEILWEISE   -         2       3           │
│  ePrivacy/TTDSG    GUT         -         5       1           │
│  TMG Impressum     OFFEN       1         0       1           │
│  ─────────────────────────────────────────────────            │
│  GESAMT                        9         19      14          │
│                                                               │
│  Legende:                                                     │
│  [KRITISCH] = Vor Launch zwingend noetig                     │
│  [OFFEN]    = Noch nicht implementiert                        │
│  [FERTIG]   = Bereits implementiert/konfiguriert             │
└──────────────────────────────────────────────────────────────┘
```

### E.5 Rechtliche Risikobewertung

| Risiko | Wahrscheinlichkeit | Auswirkung | Prioritaet | Mitigation |
|---|---|---|---|---|
| DSGVO-Verstoss (fehlende Datenschutzerklaerung) | Hoch | Bussgeld bis 4% Jahresumsatz | **P0** | E.1.1 umsetzen |
| Fehlende Einwilligung fuer Gesundheitsdaten | Hoch | Bussgeld + Verarbeitungsverbot | **P0** | E.1.3 umsetzen |
| Drittlandtransfer ohne Grundlage (OpenAI) | Mittel | Bussgeld + Unterlassung | **P0** | E.1.4 umsetzen |
| MDR-Einstufung durch Fehlkommunikation | Niedrig | CE-Zertifizierungspflicht | P1 | Disclaimer klar halten |
| HWG-Verstoss durch PED-Informationen | Mittel | Abmahnung + Unterlassung | P1 | E.2.4 + E.2.5 |
| Fehlende Account-Loeschung | Mittel | Beschwerde bei Aufsichtsbehoerde | **P0** | E.1.6 umsetzen |
| Fehlendes Impressum | Hoch | Abmahnung (einfach zu pruefem) | **P0** | E.1.2 umsetzen |
| Datenleck / Sicherheitsvorfall | Niedrig | Meldepflicht + Reputationsschaden | P2 | E.3.4 + E.3.6 |

### E.6 Empfohlene Reihenfolge der Umsetzung

```
Phase 1 - SOFORT (vor kommerziellem Launch):
  ├── E.1.2  Impressum erstellen (1h)
  ├── E.1.1  Datenschutzerklaerung erstellen (4-8h)
  ├── E.1.5  Hetzner AVV pruefen und unterzeichnen (1h)
  ├── E.1.4  OpenAI DPA abschliessen (2h)
  ├── E.1.3  Einwilligung granularisieren (4-6h Code)
  ├── E.1.6  Account-Loeschung implementieren (4-6h Code)
  ├── E.1.7  Widerrufsrecht implementieren (2-4h Code)
  └── E.1.8  DSFA erstellen (4-8h Dokumentation)

Phase 2 - ZEITNAH (erste 4 Wochen nach Launch):
  ├── E.2.1  Datenexport-Funktion (4-6h Code)
  ├── E.2.2  KI-Disclaimer erweitern (1h)
  ├── E.2.3  BP-Klassifikation kennzeichnen (1h)
  ├── E.2.4  PED-Disclaimer verstaerken (1-2h)
  ├── E.2.5  Substanz-Agent haerten (1-2h)
  ├── E.2.6  Resend AVV pruefen (1h)
  └── E.2.7  Security Headers (1h)

Phase 3 - MITTELFRISTIG (erste 3 Monate):
  ├── E.3.1  Verarbeitungsverzeichnis (4h)
  ├── E.3.2  Loeschkonzept (4h Code + Doku)
  ├── E.3.3  Audit-Trail erweitern (4-6h Code)
  ├── E.3.6  Incident-Response-Plan (2-4h Doku)
  ├── E.3.7  EU-KI-Provider evaluieren (4-8h)
  ├── E.3.8  AGB erstellen (extern, Anwalt empfohlen)
  └── E.3.9  Nutzungsbedingungen (extern, Anwalt empfohlen)
```

---

## Quellen und Referenzen

| Quelle | Relevanz |
|---|---|
| DSGVO (Verordnung (EU) 2016/679) | Datenschutz-Grundverordnung |
| BDSG (Bundesdatenschutzgesetz) | Nationale Ergaenzung zur DSGVO |
| MDR (Verordnung (EU) 2017/745) | Medizinprodukteverordnung |
| MPDG (Medizinprodukterecht-Durchfuehrungsgesetz) | Nationale MDR-Umsetzung |
| HWG (Heilmittelwerbegesetz) | Werbung fuer Arzneimittel/Medizinprodukte |
| AMG (Arzneimittelgesetz) | Definition Arzneimittel |
| TTDSG (seit 01.12.2021) | Cookie/Endgeraete-Zugriff |
| DDG (Digitale-Dienste-Gesetz, seit 14.05.2024) | Nachfolger TMG, Impressumspflicht |
| EU AI Act (Verordnung (EU) 2024/1689) | KI-Regulierung (Uebergangsfristen beachten) |

---

> **Hinweis:** Diese Analyse ersetzt keine Rechtsberatung. Fuer die finale Umsetzung,
> insbesondere fuer Datenschutzerklaerung, AGB und DSFA, wird die Konsultation eines
> spezialisierten Anwalts fuer IT-Recht / Datenschutzrecht empfohlen.
