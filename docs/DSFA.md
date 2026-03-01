# Datenschutz-Folgenabschaetzung (DSFA) — FitBuddy (fudda.de)

> Gemaess Art. 35 DSGVO (Verordnung (EU) 2016/679)
>
> **Verantwortlicher:** [Name des Betreibers]
> **App-Name:** FitBuddy (fudda.de)
> **Version:** v12.8
> **Datum der Erstbewertung:** 2026-03-01
> **Naechste Ueberpruefung:** 2026-09-01 (halbjährlich oder bei wesentlichen Aenderungen)
>
> **HINWEIS:** Diese DSFA wurde mit KI-Unterstuetzung erstellt und ersetzt keine anwaltliche Pruefung.
> Die Konsultation eines spezialisierten Anwalts fuer IT-Recht / Datenschutzrecht wird dringend empfohlen.

---

## Inhaltsverzeichnis

1. [Beschreibung der Verarbeitung](#1-beschreibung-der-verarbeitung)
2. [Bewertung der Notwendigkeit und Verhaeltnismaessigkeit](#2-bewertung-der-notwendigkeit-und-verhaeltnismaessigkeit)
3. [Systematische Beschreibung der Risiken](#3-systematische-beschreibung-der-risiken)
4. [Risikobewertung und Einstufung](#4-risikobewertung-und-einstufung)
5. [Abhilfemassnahmen und Restrisiko](#5-abhilfemassnahmen-und-restrisiko)
6. [Stellungnahme des Verantwortlichen](#6-stellungnahme-des-verantwortlichen)
7. [Dokumentation und Nachverfolgung](#7-dokumentation-und-nachverfolgung)

---

## 1. Beschreibung der Verarbeitung

### 1.1 Zweck der Verarbeitung

FitBuddy ist eine Gesundheits- und Fitness-App, die folgende Zwecke verfolgt:

| # | Zweck | Beschreibung |
|---|-------|-------------|
| Z1 | Gesundheitstracking | Erfassung von Koerpermesswerten, Blutdruck, Schlaf, Menstruationszyklus |
| Z2 | Ernaehrungsprotokollierung | Kalorientracking, Makronaehrstoffe, Mahlzeiten |
| Z3 | Trainingsplanung | KI-gestuetzte Trainingsplaene, Workout-Tracking |
| Z4 | Substanz-/Medikamenten-Tracking | Erfassung von Medikamenten, Supplements, PEDs (urteilsfrei) |
| Z5 | KI-Gesundheitsberatung | LLM-basierter Buddy-Chat mit medizinischem Kontext |
| Z6 | Arztberichte | PDF-Export mit Blutbild, Blutdruck, Substanzen fuer Arztbesuche |
| Z7 | Laborwerte-Tracking | Blutbild-Marker (Testosteron, Leber, Niere, Haematokrit etc.) |

### 1.2 Kategorien betroffener Personen

| Kategorie | Beschreibung | Geschaetzte Anzahl |
|-----------|-------------|-------------------|
| App-Nutzer | Registrierte Endnutzer | Initial <100, Ziel 100-1.000 |
| Testnutzer | Interne Testaccounts | <5 |

**Besonders schutzbeduerftige Gruppen:**
- Personen mit Essstoerungen (RED-S Risiko)
- Personen mit chronischen Erkrankungen
- Schwangere / Stillende
- Personen unter Medikation (Semaglutid, TRT, etc.)

### 1.3 Kategorien personenbezogener Daten

| Kategorie | Datenfelder | Art. 9 DSGVO? | Sensibilitaet |
|-----------|------------|---------------|---------------|
| **Stammdaten** | Name, Email, Geburtsdatum, Geschlecht, Groesse | Nein | Mittel |
| **Koerpermesswerte** | Gewicht, KFA, BMI, FFMI, Umfaenge | **Ja** | Hoch |
| **Blutdruck** | Systolisch, Diastolisch, Puls, Klassifikation | **Ja** | Hoch |
| **Laborwerte** | Testosteron, LH, FSH, Leber, Niere, Haematokrit (23 Marker) | **Ja** | Sehr hoch |
| **Substanzen** | Medikamente, Supplements, PEDs, Dosierungen, Frequenz | **Ja** | Sehr hoch |
| **Schlaf** | Einschlaf-/Aufwachzeit, Dauer, Qualitaet | **Ja** | Mittel |
| **Menstruationszyklus** | Phase, Fluss, Symptome, Stimmung, Energie | **Ja** | Hoch |
| **Ernaehrung** | Mahlzeiten, Kalorien, Protein, KH, Fett | Grenzwertig* | Mittel |
| **Training** | Uebungen, Saetze, Reps, Gewicht, Dauer | Grenzwertig* | Niedrig |
| **KI-Chat** | Gespraeche mit Health-Buddy ueber Gesundheitsthemen | **Ja** | Sehr hoch |
| **Profilfotos** | Avatar, Posing-Fotos | Nein | Mittel |
| **Technische Daten** | IP-Adresse (Logs), User-Agent, Timestamps | Nein | Niedrig |

> *Ernaehrungs- und Trainingsdaten werden zu Gesundheitsdaten (Art. 9), sobald sie mit medizinischen Daten verknuepft oder zur Gesundheitsanalyse verwendet werden (EuGH-Rechtsprechung).

### 1.4 Empfaenger und Auftragsverarbeiter

| Empfaenger | Zweck | Datenkategorien | Standort | AVV |
|-----------|-------|-----------------|----------|-----|
| **Hetzner Cloud GmbH** | VPS-Hosting (CX33) | Alle Daten (auf Server gespeichert) | Nuernberg, DE | Standard-AVV vorhanden |
| **OpenAI Inc.** | KI-Analyse (gpt-4o-mini via ai-proxy) | Chat-Nachrichten + Nutzerkontext | USA (EU Data Processing) | **DPA erforderlich** |
| **Resend Inc.** | Email-Versand (Confirmation, Recovery) | Email-Adressen | EU (eu-west-1) | DPA pruefen |

### 1.5 Technische Architektur

```
Nutzer (Browser/App)
    ↓ HTTPS/TLS
Caddy Reverse Proxy (fudda.de)
    ↓
Kong API Gateway
    ↓
┌──────────────────────────────┐
│  Supabase Self-Hosted        │
│  ├─ GoTrue (Auth)            │
│  ├─ PostgREST (API)          │
│  ├─ PostgreSQL (Daten)       │
│  ├─ Edge Functions           │
│  │  └─ ai-proxy → OpenAI    │
│  └─ Storage (Avatare)        │
└──────────────────────────────┘
Alle auf Hetzner CX33, Nuernberg DE
```

### 1.6 Speicherorte und Speicherdauer

| Daten | Speicherort | Speicherdauer | Loeschung |
|-------|-------------|---------------|-----------|
| Alle Nutzerdaten | PostgreSQL auf Hetzner CX33 (Nuernberg DE) | Bis Nutzer loescht oder Account loescht | CASCADE-Loeschung via DB-Funktion |
| KI-Chat-Kontext | sessionStorage (Browser) | Session-Dauer | Bei Tab-Schliessung |
| KI-Request-Logs | ai_usage_logs Tabelle | Bis Account-Loeschung | CASCADE |
| Email-Adressen | Resend (EU) | Bis Zustellung | Transient |
| Server-Logs | Hetzner VPS | 30 Tage (Logrotation) | Automatisch |
| Backups | Hetzner VPS (pg_dump) | 30 Tage (Rolling) | Automatisch |

---

## 2. Bewertung der Notwendigkeit und Verhaeltnismaessigkeit

### 2.1 Rechtsgrundlage

| Verarbeitungszweck | Rechtsgrundlage | Artikel |
|-------------------|-----------------|---------|
| Registrierung/Login | Vertragserfuellung | Art. 6(1)(b) |
| Gesundheitsdaten-Tracking | **Ausdrueckliche Einwilligung** | Art. 9(2)(a) |
| KI-Analyse | Ausdrueckliche Einwilligung | Art. 9(2)(a) |
| Drittlandtransfer (OpenAI) | Ausdrueckliche Einwilligung + SCCs | Art. 49(1)(a) + Art. 46(2)(c) |
| Email-Versand | Vertragserfuellung | Art. 6(1)(b) |

### 2.2 Verhaeltnismaessigkeit und Datensparsamkeit

| Prinzip | Bewertung | Begruendung |
|---------|-----------|-------------|
| **Zweckbindung** (Art. 5(1)(b)) | ✅ Erfuellt | Daten werden nur fuer definierten Gesundheits-/Fitness-Zweck verwendet |
| **Datensparsamkeit** (Art. 5(1)(c)) | ✅ Erfuellt | Nur noetige Felder, optionale Felder (Substanzen, Zyklus, Blutbild) |
| **Speicherbegrenzung** (Art. 5(1)(e)) | ✅ Erfuellt | Loeschung bei Account-Loesung, Backup-Rotation 30 Tage |
| **Richtigkeit** (Art. 5(1)(d)) | ✅ Erfuellt | Nutzer kann alle Daten selbst editieren und korrigieren |
| **Integritaet** (Art. 5(1)(f)) | ✅ Erfuellt | RLS, TLS, Password-Hashing, JWT |

### 2.3 Notwendigkeit der KI-Verarbeitung

| Frage | Antwort |
|-------|---------|
| Ist KI notwendig? | Ja — Personalisierte Gesundheitsberatung waere manuell nicht skalierbar |
| Gibt es Alternativen? | Statische Empfehlungen waeren moeglich, aber weniger nuetzlich |
| Werden nur noetige Daten an KI gesendet? | Ja — Skill-basierter Kontext, keine Rohdaten-Dumps |
| Ist der KI-Einsatz transparent? | Ja — "KI-generiert" Disclaimer unter jeder Buddy-Antwort |
| Koennen Nutzer die KI-Nutzung ablehnen? | Ja — Separate Einwilligung "KI-Verarbeitung", widerrufbar |

---

## 3. Systematische Beschreibung der Risiken

### 3.1 Risikokatalog

| # | Risiko | Betroffene | Schadenspotential |
|---|--------|-----------|-------------------|
| R1 | **Datenverlust/Datenleck** — Unbefugter Zugriff auf Gesundheitsdaten | Alle Nutzer | Sehr hoch (Diskriminierung, Versicherung, Arbeitgeber) |
| R2 | **KI-Fehlinformation** — Falsche Gesundheitsempfehlung durch LLM | Alle Nutzer | Hoch (Gesundheitsschaden bei Befolgung) |
| R3 | **Drittlandtransfer** — Gesundheitsdaten an OpenAI (USA) | Nutzer mit KI-Einwilligung | Hoch (US-Ueberwachung, CLOUD Act) |
| R4 | **Substanz-Daten Exposure** — PED-/Doping-Daten werden bekannt | Power+ Nutzer | Sehr hoch (Strafrechtlich, beruflich, sozial) |
| R5 | **Essstoerungs-Verstaerkung** — App foerdert ungesundes Verhalten | Vulnerable Nutzer | Hoch (Gesundheitsschaden, RED-S) |
| R6 | **Fehlende Arzt-Konsultation** — Nutzer verlaesst sich auf App statt Arzt | Alle Nutzer | Hoch (Verspaetete Diagnose) |
| R7 | **Account-Uebernahme** — Unbefugter Login | Einzelne Nutzer | Hoch (Zugang zu Gesundheitsdaten) |
| R8 | **Backup-Leck** — Unverschluesselte Backups werden kompromittiert | Alle Nutzer | Hoch (Massen-Datenleck) |
| R9 | **Server-Kompromittierung** — Hetzner VPS wird gehackt | Alle Nutzer | Sehr hoch (Vollzugriff auf alle Daten) |
| R10 | **KI-Provider-Missbrauch** — OpenAI nutzt Chat-Daten fuer Training | Nutzer mit KI-Einwilligung | Mittel (Datenschutzverletzung) |
| R11 | **Profiling-Risiko** — Automatisierte Bewertung von Gesundheitszustand | Alle Nutzer | Mittel (Art. 22 Betroffenenrecht) |
| R12 | **Zyklus-Daten Missbrauch** — Menstruationsdaten werden fuer Ueberwachung genutzt | Weibliche Nutzer | Hoch (Reproduktive Rechte) |

---

## 4. Risikobewertung und Einstufung

### 4.1 Risikomatrix

Bewertungsskala: **Eintrittswahrscheinlichkeit** (1=sehr gering, 2=gering, 3=mittel, 4=hoch) x **Schwere** (1=gering, 2=mittel, 3=hoch, 4=sehr hoch)

| # | Risiko | Eintritt | Schwere | Score | Stufe |
|---|--------|----------|---------|-------|-------|
| R1 | Datenleck | 2 | 4 | **8** | 🔴 Hoch |
| R2 | KI-Fehlinformation | 3 | 3 | **9** | 🔴 Hoch |
| R3 | Drittlandtransfer | 2 | 3 | **6** | 🟡 Mittel |
| R4 | Substanz-Exposure | 1 | 4 | **4** | 🟡 Mittel |
| R5 | Essstoerungsverstaerkung | 2 | 4 | **8** | 🔴 Hoch |
| R6 | Fehlende Arzt-Konsultation | 3 | 3 | **9** | 🔴 Hoch |
| R7 | Account-Uebernahme | 2 | 3 | **6** | 🟡 Mittel |
| R8 | Backup-Leck | 1 | 4 | **4** | 🟡 Mittel |
| R9 | Server-Kompromittierung | 1 | 4 | **4** | 🟡 Mittel |
| R10 | KI-Provider-Missbrauch | 1 | 3 | **3** | 🟢 Niedrig |
| R11 | Profiling | 2 | 2 | **4** | 🟡 Mittel |
| R12 | Zyklus-Daten Missbrauch | 1 | 4 | **4** | 🟡 Mittel |

### 4.2 Gesamtrisiko-Einstufung

**Gesamtrisiko: HOCH** — aufgrund der umfangreichen Verarbeitung besonderer Kategorien personenbezogener Daten (Art. 9 DSGVO) in Kombination mit KI-Verarbeitung und Drittlandtransfer.

---

## 5. Abhilfemassnahmen und Restrisiko

### 5.1 Technische Massnahmen (implementiert)

| # | Massnahme | Adressiert Risiko | Status |
|---|-----------|-------------------|--------|
| T1 | **HTTPS/TLS** via Caddy (inkl. HTTP/2, HTTP/3) | R1, R7 | ✅ Aktiv |
| T2 | **Row Level Security (RLS)** auf allen 26 DB-Tabellen | R1, R4, R12 | ✅ Aktiv |
| T3 | **JWT-Authentication** via Supabase GoTrue | R7 | ✅ Aktiv |
| T4 | **Email-Verifizierung** (AUTOCONFIRM=false) | R7 | ✅ Aktiv (v12.8) |
| T5 | **Passwort-Hashing** (bcrypt via GoTrue) | R7 | ✅ Aktiv |
| T6 | **KI-Proxy** (Edge Function, API-Key nie im Frontend) | R1, R3 | ✅ Aktiv |
| T7 | **Input-Validierung** (Zod Schemas + SQL-Injection-Schutz) | R1, R9 | ✅ Aktiv (42 Tests) |
| T8 | **Kaskaden-Loeschung** (DB-Funktion delete_user_account) | R1, R4 | ✅ Aktiv |
| T9 | **DB-Backup** (pg_dump Cronjob, 30-Tage Rolling) | R8 | ✅ Aktiv |
| T10 | **Server-Monitoring** (monitor.sh: Docker, Disk, Memory) | R9 | ✅ Aktiv |
| T11 | **UUIDs** statt Klarnamen als Primaerschluessel | R1, R4 | ✅ Aktiv |
| T12 | **Session-basierter KI-Kontext** (sessionStorage, nicht DB) | R3, R10 | ✅ Aktiv |

### 5.2 Technische Massnahmen (geplant/empfohlen)

| # | Massnahme | Adressiert Risiko | Prioritaet | Aufwand |
|---|-----------|-------------------|------------|---------|
| T13 | **Security Headers** (CSP, HSTS, X-Frame-Options) | R1, R9 | P1 | ~1h |
| T14 | **MFA/2FA** (TOTP oder WebAuthn) | R7 | P2 | ~8h |
| T15 | **Backup-Verschluesselung** (gpg vor Upload) | R8 | P1 | ~2h |
| T16 | **Rate Limiting** auf Auth-Endpoints | R7, R9 | P1 | ~2h |
| T17 | **Audit-Log** (Wer hat wann auf welche Daten zugegriffen) | R1, R4 | P2 | ~4h |
| T18 | **WAF** (Web Application Firewall) vor Caddy | R9 | P3 | ~4h |

### 5.3 Organisatorische Massnahmen (implementiert)

| # | Massnahme | Adressiert Risiko | Status |
|---|-----------|-------------------|--------|
| O1 | **Disclaimer-Modal** beim ersten Start (5 Sektionen: Medizin, Substanzen, Blutdruck, Daten, Risiko) | R2, R5, R6 | ✅ Aktiv |
| O2 | **KI-Disclaimer** unter jeder Buddy-Antwort ("KI-generiert — kann Fehler enthalten") | R2, R6 | ✅ Aktiv |
| O3 | **PED-Disclaimer** bei Substanz-Tracking | R4, R6 | ✅ Aktiv |
| O4 | **Granulare Einwilligungen** (3 separate: Gesundheitsdaten, KI, Drittland) | R3, R10 | ✅ Aktiv |
| O5 | **Widerrufsmechanismus** (einzelne Einwilligungen widerrufbar) | R3, R10 | ✅ Aktiv |
| O6 | **Datenexport** (Art. 20, JSON, 16 Tabellen) | Compliance | ✅ Aktiv |
| O7 | **Account-Loeschung** (Art. 17, SECURITY DEFINER CASCADE) | R1, R4 | ✅ Aktiv |
| O8 | **Datenschutzerklaerung** (/datenschutz, 10 Abschnitte, 17 Sprachen) | Compliance | ✅ Aktiv |
| O9 | **Impressum** (/impressum, §5 DDG) | Compliance | ✅ Aktiv |
| O10 | **BP-Klassifikation** als informativ gekennzeichnet (ESC/ESH 2023) | R2, R6 | ✅ Aktiv |

### 5.4 Organisatorische Massnahmen (geplant/empfohlen)

| # | Massnahme | Adressiert Risiko | Prioritaet | Aufwand |
|---|-----------|-------------------|------------|---------|
| O11 | **AVV mit OpenAI** (DPA + SCCs) | R3, R10 | P0 | ~2h |
| O12 | **AVV mit Hetzner** pruefen | R1 | P0 | ~1h |
| O13 | **RED-S Warnsystem** (automatische Warnung bei BMI<18.5 etc.) | R5 | P1 | ~4h |
| O14 | **Proaktives Warnsystem** (gefaehrliche Muster erkennen) | R2, R5, R6 | P1 | ~6h |
| O15 | **Anwaltliche Pruefung** dieser DSFA + Datenschutzerklaerung | Compliance | Empfohlen | Extern |
| O16 | **Datenschutzbeauftragter** bestellen (ab 20 Nutzer empfohlen) | Compliance | Ab Wachstum | Extern |

### 5.5 Restrisiko-Bewertung nach Massnahmen

| # | Risiko | Ohne Massnahmen | Mit Massnahmen | Restrisiko |
|---|--------|-----------------|----------------|------------|
| R1 | Datenleck | 🔴 Hoch (8) | 🟢 Niedrig (2) | T1-T12, O4-O8 wirksam |
| R2 | KI-Fehlinformation | 🔴 Hoch (9) | 🟡 Mittel (4) | O1-O2, O10 reduzieren, **R2 bleibt inhaerent** |
| R3 | Drittlandtransfer | 🟡 Mittel (6) | 🟡 Mittel (4) | O4, O11 (AVV) **ausstehend** |
| R4 | Substanz-Exposure | 🟡 Mittel (4) | 🟢 Niedrig (2) | T2, T11, O7 wirksam |
| R5 | Essstoerungsverstaerkung | 🔴 Hoch (8) | 🟡 Mittel (4) | O1, O13 (RED-S) **teilweise ausstehend** |
| R6 | Fehlende Arzt-Konsultation | 🔴 Hoch (9) | 🟡 Mittel (4) | O1, O2, O10 reduzieren, **R6 bleibt inhaerent** |
| R7 | Account-Uebernahme | 🟡 Mittel (6) | 🟢 Niedrig (2) | T3-T5, T14 (MFA) empfohlen |
| R8 | Backup-Leck | 🟡 Mittel (4) | 🟡 Mittel (3) | T9, T15 (Verschluesselung) **empfohlen** |
| R9 | Server-Kompromittierung | 🟡 Mittel (4) | 🟢 Niedrig (2) | T1, T7, T10, T13 (Headers) |
| R10 | KI-Provider-Missbrauch | 🟢 Niedrig (3) | 🟢 Niedrig (2) | T6, T12, O4, O11 (AVV) |
| R11 | Profiling | 🟡 Mittel (4) | 🟢 Niedrig (2) | O2 (KI als Vorschlag), O4 (Einwilligung) |
| R12 | Zyklus-Daten Missbrauch | 🟡 Mittel (4) | 🟢 Niedrig (2) | T2 (RLS), T11 (UUID), Daten nur auf DE-Server |

---

## 6. Stellungnahme des Verantwortlichen

### 6.1 Zusammenfassung

FitBuddy verarbeitet umfangreiche Gesundheitsdaten (Art. 9 DSGVO) in Kombination mit KI-Analyse. Eine DSFA ist gemaess Art. 35 DSGVO **zwingend erforderlich** und wurde hiermit durchgefuehrt.

### 6.2 Ergebnis

Die implementierten technischen und organisatorischen Massnahmen reduzieren die identifizierten Risiken auf ein **akzeptables Niveau**, mit folgenden Vorbehalten:

**Verbleibende offene Punkte (vor kommerziellem Launch zu klaeren):**

1. **AVV mit OpenAI** (O11) — DPA muss unterzeichnet werden
2. **AVV mit Hetzner** (O12) — Standard-AVV muss geprueft werden
3. **RED-S Warnsystem** (O13) — Automatische Warnung bei gefaehrlichen Mustern
4. **Anwaltliche Pruefung** (O15) — DSFA, Datenschutzerklaerung, AGB

**Inhärente Restrisiken (nicht vollstaendig eliminierbar):**

- R2 (KI-Fehlinformation): LLMs koennen fehlerhafte Informationen generieren. Mitigiert durch Disclaimer, aber nicht eliminierbar.
- R6 (Fehlende Arzt-Konsultation): Nutzer koennten App als Arzt-Ersatz verwenden. Mitigiert durch Disclaimer und "Keine medizinische Beratung"-Hinweise.

### 6.3 Konsultation der Aufsichtsbehoerde

Eine Konsultation der zustaendigen Aufsichtsbehoerde gemaess Art. 36 DSGVO ist **derzeit nicht erforderlich**, da die implementierten Massnahmen das Risiko ausreichend reduzieren. Bei wesentlichen Aenderungen (z.B. neue Datenkategorien, neue KI-Provider, Expansion in Nicht-EU-Laender) ist eine Neubewertung notwendig.

---

## 7. Dokumentation und Nachverfolgung

### 7.1 Aenderungshistorie

| Datum | Version | Aenderung | Autor |
|-------|---------|-----------|-------|
| 2026-03-01 | 1.0 | Erstbewertung | Verantwortlicher + KI-Unterstuetzung |

### 7.2 Trigger fuer Neubewertung

Eine Aktualisierung dieser DSFA ist erforderlich bei:

- Neuen Datenkategorien (z.B. GPS-Tracking, Fotos)
- Wechsel des KI-Providers
- Neuen Auftragsverarbeitern
- Erweiterung in Nicht-EU-Maerkte
- Wesentlichen Aenderungen an der Architektur
- Sicherheitsvorfaellen
- Regulatorischen Aenderungen (EU AI Act, ePrivacy-Verordnung)
- Signifikantem Nutzerwachstum (>1.000 Nutzer)

### 7.3 Verwandte Dokumente

| Dokument | Pfad | Beschreibung |
|----------|------|-------------|
| Rechtskonformitaet | `docs/RECHTSKONFORMITAET.md` | Detailanalyse DSGVO, MDR, HWG, ePrivacy |
| Datenschutzerklaerung | `/datenschutz` (App-Route) | Oeffentliche Datenschutzerklaerung |
| Impressum | `/impressum` (App-Route) | Anbieterkennzeichnung |
| Architektur | `docs/ARCHITEKTUR.md` | Technische Systemarchitektur |
| Deployment | `docs/DEPLOYMENT.md` | Server-Setup und Infrastruktur |

---

> **Datum:** 2026-03-01
> **Unterschrift Verantwortlicher:** ________________________
> **Naechste planmaessige Ueberpruefung:** 2026-09-01
