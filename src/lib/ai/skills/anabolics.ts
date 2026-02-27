/**
 * Static anabolics/PED knowledge skill for the Substance Agent.
 * Contains detailed pharmacological knowledge about performance-enhancing
 * substances used in bodybuilding: AAS, HGH, Insulin, SARMs, stimulants, diuretics.
 *
 * This extends the base substances skill with deep PED-specific knowledge
 * from evidence-based sources (PubMed, clinical guidelines).
 *
 * URTEILSFREI — sachlich, evidenzbasiert, schadensminimierend
 *
 * @version 1.0.0
 * @see Bhasin et al. 1996 (NEJM), Egner et al. 2013 (J Physiol),
 *      Nielsen et al. 2023 (JCEM), Pope et al. 2014 (Am J Addict)
 */

import type { SkillMeta } from './types';

export const ANABOLICS_SKILL_META: SkillMeta = {
  id: 'anabolics',
  name: 'Anabolika & PED-Pharmakologie',
  version: '3.0.0',
  updatedAt: '2026-02-27',
  sources: [
    'Bhasin et al. 1996, NEJM, PMID:8637535 — Testosterone dose-response',
    'Egner et al. 2013, J Physiol, PMID:24167222 — Myonuclei & muscle memory',
    'Nielsen et al. 2023, JCEM, PMID:37466198 — Myonuclei in ex-AAS users',
    'Pope et al. 2014, Am J Addict, PMID:24112239 — AAS dependence',
    'WADA Prohibited List 2025',
    'Kanayama et al. 2015, Addiction, PMID:25598171 — Prolonged hypogonadism after AAS',
    'Endocrine Society (Bhasin et al.) 2018, JCEM, PMID:29562364 — Testosterone Therapy Guidelines',
    'Nieschlag & Vorona 2015, Eur J Endocrinol, PMID:25805894 — TRT dosing',
    'Kicman 2008, Br J Pharmacol, PMID:18500378 — AAS pharmacology',
    'Baggish et al. 2017, Circulation, PMID:28533317 — Cardiovascular effects of AAS',
    'Ip et al. 2012, J Forensic Sci, PMID:22150293 — UGL product analysis',
    'Rahnema et al. 2014, JCEM, PMID:24823457 — AAS-induced hypogonadism recovery times',
    'Achar et al. 2010, J Am Board Fam Med, PMID:20207930 — AAS side effects review',
    'Hartgens & Kuipers 2004, Sports Med, PMID:15209136 — AAS effects body composition',
    'Nieschlag & Vorona 2015, Lancet Diabetes Endocrinol, PMID:25459211 — Mechanisms of AAS',
  ],
  tokenEstimate: 4200,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-02-20',
      changes: 'Initial: AAS-Substanzgruppen, HGH, Insulin, SARMs, Stimulanzien, Diuretika, Muscle Memory, PCT-Evidenz, Risikomatrix',
    },
    {
      version: '2.0.0',
      date: '2026-02-22',
      changes: 'Doping-Schwellen: TRT vs. Doping Grenzwerte, Substanz-Klassifikation (immer Doping / dosisabh. / medizinisch), Doping-Warnprotokoll, Nebenwirkungen bei supraphysiol. Dosen',
    },
    {
      version: '3.0.0',
      date: '2026-02-27',
      changes: 'Power+ Erweiterung: Zielbasierte Zyklen (Aufbau 3 Stufen, Kraft, Cutting, Definition), Wechselwirkungen-Tabelle (11 Kombis), Ester-Halbwertszeiten + PCT-Timing, Blutbild-Monitoring pro Substanz, Phasen-spezifische Ernährung/Training (Blast/Cruise/PCT/Off)',
    },
  ],
};

export const ANABOLICS_SKILL = `
## ERWEITERTES PED-WISSEN (Performance Enhancing Drugs)

### Substanzgruppen im Bodybuilding

| Gruppe | Mechanismus | Einsatz | Risiko-Level |
|--------|-------------|---------|-------------|
| AAS (Anabole Steroide) | Androgenrezeptor-Agonisten | Masseaufbau, Kraft | HOCH (Herz, Leber, HPT-Achse) |
| HGH (Wachstumshormon) | IGF-1-Stimulation, Lipolyse | Fettabbau, Muskelfülle | HOCH (Diabetes, Organwachstum) |
| Insulin | Nährstoff-Shuttle, Glykogen | Off-Season Masse | SEHR HOCH (Hypoglykämie = Tod) |
| SARMs | Selektive AR-Modulatoren | "Legale" Alternative | MITTEL-HOCH (wenig Langzeitdaten) |
| Stimulanzien (Ephedrin, Clen) | Sympathomimetika, Thermogenese | Fettabbau, Diät | MITTEL-HOCH (Herz) |
| Diuretika (Furosemid) | Wasserausscheidung | Wettkampf-Entwässerung | SEHR HOCH (Elektrolyte, Herztod) |

### AAS — Wichtige Wirkstoffe
- **Testosteron (Basis)**: Enanthat/Cypionat (langwirkend), Propionat (kurzwirkend)
- **Nandrolon (Deca)**: Gelenkentlastend, aber: Deca-Dick (ED), starke HPT-Suppression
- **Trenbolon**: Sehr potent, schlafstörend, kardiotoxisch, kein Aromatisieren aber Progesteron-NW
- **Boldenon (EQ)**: Milder, langer Ester, erhöht Hämatokrit stark
- **Oxandrolon (Var)**: Mild, oral, beliebt bei Frauen/Einstieg, aber Lipidprofil-Killer
- **Stanozolol (Winstrol)**: Trocken, definierend, stark hepatotoxisch (oral 17α-alkyliert)
- **Oxymetholon (Anadrol)**: Extrem potent für Masse, stark hepatotoxisch

### Dosis-Wirkungs-Realität (Testosteron)
Bhasin et al. 1996 (NEJM, 600mg/Woche, 10 Wochen):
- MIT Training: +6.1 kg fettfreie Masse
- OHNE Training: +3.2 kg fettfreie Masse (nur Testosteron!)
- Placebo + Training: +1.9 kg
- Effekt ist dosisabhängig, aber Nebenwirkungen steigen überproportional

### Muscle Memory — Wissenschaftliche Basis
- AAS-Nutzung erhöht MYONUKLEI-DICHTE in Muskelfasern dauerhaft
- Nielsen et al. 2023: Noch 4 Jahre nach Absetzen erhöhte Myonuklei-Dichte
- Egner et al. 2013: Tiermodell bestätigt — Myonuklei bleiben erhalten
- Praxis: Ex-User können schneller wieder aufbauen ("retraining advantage")
- ABER: Strukturelle Herzschäden sind NICHT reversibel

### Nach dem Absetzen — Evidenz
- Hormonsystem: HPT-Achse unterdrückt, Erholung extrem individuell (Wochen bis Jahre)
- KEIN Beleg dass "Ausschleichen" die Achse schont (verlängert nur Suppression)
- PCT (Post Cycle Therapy): Weit verbreitet, aber wissenschaftlich NICHT validiert
- Ca. 30% der Langzeitanwender entwickeln AAS-Abhängigkeit (Pope et al. 2014)
- Manche erholen sich nie → lebenslange TRT nötig

### Risiko-Hierarchie (Langzeitschäden, evidenzbasiert)
1. **HÖCHSTES RISIKO:** Insulin (akuter Tod durch Hypoglykämie), Diuretika (Herztod)
2. **SEHR HOCH:** Trenbolon (Herz+Psyche), 17α-alkylierte Orals (Leber)
3. **HOCH:** Alle AAS in hohen Dosen (kardiovaskulär, HPT-Achse, Psyche)
4. **MODERAT-HOCH:** HGH (Diabetes, Organwachstum), SARMs (unbekannte Langzeit)
5. **MODERAT:** Stimulanzien chronisch (Herz), Testosteron TRT-Dosen (gemanagt)

### Schwarzmarkt-Realität
- ~75% der UGL-Produkte entsprechen NICHT der Deklaration
- Risiken: Unterdosierung, Verunreinigungen, falsche Wirkstoffe, Infektionen
- Pharmagrade Produkte (Apotheke) sind die einzig sichere Option

## TRT vs. DOPING — GRENZWERTE & KLASSIFIKATION ⚠️

### Testosteron: Therapeutisch vs. Supraphysiologisch
| Bereich | Dosis/Woche | Blutlevel (Talspiegel) | Einstufung |
|---------|-------------|----------------------|------------|
| Therapeutisch (TRT) | 100-200mg/Woche | 400-900 ng/dL (14-31 nmol/L) | ✅ Ärztliche Therapie |
| Oberer TRT-Bereich | 200-250mg/Woche | 800-1200 ng/dL | ⚠️ Grenzbereich — engmaschig kontrollieren |
| Supraphysiologisch | >250mg/Woche | >1200 ng/dL (>42 nmol/L) | 🔴 DOPING — kein medizinischer Einsatz |
| Typisches Bodybuilding | 300-500mg/Woche | 1500-4000+ ng/dL | 🔴 DOPING — erhebliche Gesundheitsrisiken |
| Hochdosis | 500-1000mg+/Woche | 4000-10000+ ng/dL | 🔴 EXTREMES DOPING — schwere Organschäden |

**Wichtig:** 250mg 2x/Woche = 500mg/Woche = DEFINITIV Doping, NICHT TRT!
Ärztlich verordnete TRT liegt IMMER unter 200mg/Woche (meist 100-150mg).
Ab 250mg/Woche ist es Performance Enhancement, unabhängig was der Nutzer es nennt.

### Substanz-Klassifikation: IMMER Doping vs. Dosisabhängig vs. Medizinisch

**🔴 IMMER DOPING (kein legaler medizinischer Einsatz bei Gesunden):**
- Trenbolon (veterinärmedizinisch, KEIN Humanpräparat)
- Boldenon (veterinärmedizinisch)
- SARMs (keine Zulassung, alle experimentell)
- Stanozolol (in den meisten Ländern keine Zulassung mehr)
- Oxymetholon (extrem selten verschrieben, de facto Doping)
- Masteron (Drostanolon)
- Clenbuterol (nur Asthma-Zulassung, nicht für Fettabbau)
- Diuretika zur Wettkampf-Entwässerung

**⚠️ DOSISABHÄNGIG (medizinisch ODER Doping):**
- Testosteron: ≤200mg/Wo = TRT möglich | >200mg/Wo = Doping
- Nandrolon (Deca): Selten med. bei Anämie/Osteoporose (50mg alle 3 Wo) | >100mg/Wo = Doping
- HGH: 0.5-2 IU/Tag = medizinisch | >3 IU/Tag = Performance Enhancement
- Oxandrolon (Anavar): 5-20mg/Tag med. bei Verbrennungen | bodybuilding Dosen = Doping

**✅ MEDIZINISCH / SUPPLEMENT (KEIN Doping):**
- Semaglutid (Wegovy/Ozempic): GLP-1-Agonist, ärztlich verordnet, NICHT auf WADA-Liste
- Kreatin: Nahrungsergänzung, NICHT verboten, evidenzbasiert sicher
- Vitamin D, Zink, Magnesium: Supplemente
- Metformin: Diabetes-Medikament, NICHT auf WADA-Liste

### WADA 2025 — Relevante verbotene Substanzen im Bodybuilding
- **S1: Anabole Substanzen** — Alle AAS (Testosteron, Nandrolon, Trenbolon, etc.), SARMs
- **S2: Peptidhormone** — HGH, IGF-1, Insulin, EPO
- **S5: Diuretika und Maskierungsmittel** — Furosemid, Hydrochlorothiazid
- **Nicht verboten:** Semaglutid/GLP-1, Kreatin, Koffein, Metformin

## DOPING-WARNPROTOKOLL ⚠️⚠️⚠️

Wenn der Nutzer eine Substanz/Dosis loggt die DOPING ist, MUSST du:

1. **Substanz TROTZDEM loggen** — das ist deine Hauptaufgabe! Niemals das Loggen verweigern.
2. **Klar kennzeichnen** dass die Dosis/Substanz ÜBER dem medizinischen Bereich liegt.
3. **Konkrete Nebenwirkungen nennen** die bei DIESER Dosis relevant sind (nicht allgemein).
4. **Hinweisen** dass das keine Empfehlung ist und zu schweren Gesundheitsschäden führen kann und wird.
5. **Fragen ob das wirklich gewollt ist** — nicht moralisieren, aber sicherstellen dass es bewusst ist.
6. **Blutbild-Monitoring DRINGEND empfehlen** — bei Doping-Dosen mindestens alle 6-8 Wochen.

### Beispiel-Antwort bei Doping-Dosis:
User: "500mg Testo E diese Woche gespritzt"
→ "Geloggt! ⚠️ 500mg/Woche Testosteron ist deutlich über dem TRT-Bereich (100-200mg) — das ist eine supraphysiologische Dosis im Doping-Bereich. Bei dieser Dosierung: erhöhtes Risiko für Polyzythämie (Hämatokrit >54%), Bluthochdruck, LDL-Anstieg, Aromatisierung zu Östradiol (Gynäkomastie-Risiko), HPT-Achsen-Suppression. Blutbild alle 6-8 Wochen ist PFLICHT. Das ist keine Empfehlung — supraphysiologische Dosen WERDEN langfristig Schäden verursachen, v.a. kardiovaskulär. Ist dir das bewusst?"

### Nebenwirkungen nach Dosisbereich (Testosteron):
**200-300mg/Wo (leicht supraphysiologisch):**
- Hämatokrit-Anstieg, leichte BP-Erhöhung, E2-Anstieg, Akne, HPT-Suppression

**300-500mg/Wo (moderate Doping-Dosis):**
- Alles oben + Polyzythämie-Risiko, signifikante Lipidverschiebung (HDL↓↓, LDL↑), Wasserretention, Stimmungsschwankungen, Libido-Schwankungen, Gynäkomastie-Risiko ohne AI

**500mg+/Wo (hohe Doping-Dosis):**
- Alles oben + kardiale Hypertrophie (linksventrikulär), erhebliches Thrombose-Risiko, Leberstress (bei oralen Steroiden), psychische NW (Aggression, Depression), Infertilität (oft irreversibel bei Langzeit), Haarausfall (bei Veranlagung)

## ANTWORTREGELN FÜR PED-FRAGEN
1. URTEILSFREI beraten — Harm Reduction > Moralpredigten
2. Risiken SACHLICH darstellen, nicht dramatisieren aber nicht beschönigen
3. Bei Doping-Dosen: IMMER Nebenwirkungen + "kein Normalfall" + "wirklich gewollt?" kommunizieren
4. Bei konkreten Dosierungsfragen: Evidenz zitieren, aber "Besprich das mit deinem Arzt"
5. Schwarzmarkt-Risiken immer erwähnen wenn relevantes Thema
6. Blutbild-Monitoring als PFLICHT betonen, nicht als Option
7. Kardiovaskuläres Monitoring (BP, Lipide, Hämatokrit) hervorheben
8. Dein Doping-Wissen teilen wenn gefragt — sachlich, mit Quellen, ohne zu beschönigen
`;

// ── Power+ Extension (only loaded for power_plus mode) ──────────────

export const ANABOLICS_POWERPLUS_SKILL_META: SkillMeta = {
  id: 'anabolics_powerplus',
  name: 'Power+ Zyklus-Empfehlungen',
  version: '1.0.0',
  updatedAt: '2026-02-27',
  sources: [
    'Bhasin et al. 1996, NEJM, PMID:8637535 — Testosterone dose-response',
    'Hartgens & Kuipers 2004, Sports Med, PMID:15209136 — AAS effects body composition',
    'Achar et al. 2010, J Am Board Fam Med, PMID:20207930 — AAS side effects review',
    'Rahnema et al. 2014, JCEM, PMID:24823457 — AAS-induced hypogonadism recovery',
    'Ip et al. 2012, J Forensic Sci, PMID:22150293 — UGL product analysis',
  ],
  tokenEstimate: 2400,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-02-27',
      changes: 'Initial: Zielbasierte Zyklen (Aufbau 3 Stufen, Kraft, Cutting, Definition), Wechselwirkungen, Ester-Halbwertszeiten, Blutbild-Monitoring, Phasen-Ernährung',
    },
  ],
};

export const ANABOLICS_POWERPLUS_SKILL = `
## POWER+ ERWEITERUNG — ZIELBASIERTE ZYKLEN & EMPFEHLUNGEN

⚠️ **DISCLAIMER:** Alle folgenden Informationen dienen ausschließlich der Schadensminimierung (Harm Reduction).
FitBuddy ist KEINE medizinische Beratung. Substanz-Entscheidungen liegen in der Verantwortung des Nutzers.
Vor jeder Anwendung: Ärztliche Beratung + Blutbild PFLICHT.

### ZIEL: AUFBAU (Masse/Hypertrophie)

**Einsteiger-Zyklus (1. Kur, 12 Wochen):**
| Substanz | Dosis | Dauer | Zweck |
|----------|-------|-------|-------|
| Testosteron Enanthat | 300-500mg/Wo | 12 Wochen | Basis, anabole Grundlage |
| Anastrozol (AI) | 0.25-0.5mg bei Bedarf | Bei E2-Symptomen | Östrogenkontrolle |
→ PCT ab Woche 14: Nolvadex 20mg/Tag × 4 Wochen

**Fortgeschrittener Aufbau (16 Wochen):**
| Substanz | Dosis | Dauer | Zweck |
|----------|-------|-------|-------|
| Testosteron Enanthat | 500mg/Wo | 16 Wochen | Basis |
| Nandrolon Decanoat | 300-400mg/Wo | 14 Wochen | Masse, Gelenke |
| Anastrozol | 0.5mg 2×/Wo | Durchgehend | E2-Kontrolle |
→ Hinweis: Nandrolon supprimiert HPT-Achse EXTREM, Erholung kann Monate dauern
→ PCT ab Woche 18 (langer Deca-Ester!): HCG + Nolvadex

**Profi-Aufbau (20 Wochen, hohe Erfahrung):**
| Substanz | Dosis | Dauer | Zweck |
|----------|-------|-------|-------|
| Testosteron Enanthat | 750mg/Wo | 20 Wochen | Basis |
| Trenbolon Enanthat | 400mg/Wo | 16 Wochen | Masse + Recomp |
| Oxymetholon (Anadrol) | 50-100mg/Tag | Woche 1-4 (Kickstart) | Schneller Masseaufbau |
| Anastrozol | 0.5mg EOD | Durchgehend | E2-Kontrolle |
| Cabergolin | 0.25mg 2×/Wo | Bei Prolaktin-Symptomen | Anti-Prolaktin (Tren) |
→ ⚠️ EXTREM hohe Gesundheitsrisiken! Nur mit regelmäßigem Blutbild alle 4-6 Wochen

### ZIEL: KRAFT (Powerlifting / Stärke)

| Substanz | Dosis | Dauer | Zweck |
|----------|-------|-------|-------|
| Testosteron Enanthat | 400-600mg/Wo | 12-16 Wochen | Basis, Kraft |
| Oxymetholon (Anadrol) | 50mg/Tag | 4-6 Wochen | Kraftexplosion, Stärke |
| Halotestin (optional) | 10-20mg/Tag | Max 4 Wochen | Wettkampf-Kraft, ZNS |
→ ⚠️ Halotestin = EXTREM hepatotoxisch, nur für Wettkampf-Tag ± 2 Wochen
→ Blutdruck-Monitoring TÄGLICH bei Anadrol + Halo Kombination

### ZIEL: FETTVERBRENNUNG (Cutting)

| Substanz | Dosis | Dauer | Zweck |
|----------|-------|-------|-------|
| Testosteron Propionat | 150-200mg/Wo | 8-12 Wochen | Muskelerhalt im Defizit |
| Trenbolon Acetat | 200-300mg/Wo | 8-10 Wochen | Recomp, Fettabbau, Härte |
| Stanozolol (Winstrol) | 25-50mg/Tag | Max 6 Wochen | Trockenheit, Vaskularität |
| T3 (Cytomel) | 25-50mcg/Tag | 6-8 Wochen | Schilddrüsen-Boost |
| Clenbuterol | 20-120mcg/Tag (Rampe) | 2 Wo on/2 Wo off | Thermogenese |
→ ⚠️ Stanozolol = Lipidprofil-Killer (HDL↓↓↓), Leberwerte kontrollieren!
→ T3 baut auch Muskeln ab wenn Protein/AAS nicht ausreichen

### ZIEL: TROCKEN WERDEN (Definition / Wettkampf)

| Substanz | Dosis | Dauer | Zweck |
|----------|-------|-------|-------|
| Testosteron Propionat | 100-150mg/Wo | 8 Wochen | Basis, schneller Ester |
| Masteron (Drostanolon) | 300-400mg/Wo | 8 Wochen | Härte, Anti-Östrogenisch |
| Oxandrolon (Anavar) | 40-60mg/Tag | 6-8 Wochen | Trocken, Krafterhalt |
| Halotestin | 10-20mg/Tag | Letzte 2 Wochen | Wettkampf-Härte |
| Diuretika (Furosemid) | NUR unter ärztlicher Aufsicht! | 24-48h Pre-Stage | Entwässerung |
→ ⚠️ Diuretika = LEBENSGEFAHR ohne Elektrolyt-Monitoring. NIEMALS alleine anwenden!
→ Aldosteron-Rebound beachten bei zu frühem Absetzen

### WECHSELWIRKUNGEN — KRITISCHE KOMBINATIONEN

| Kombination | Wechselwirkung | Risiko |
|-------------|---------------|--------|
| Testosteron + Nandrolon | Beide aromatisieren → erhöhte Östrogen-Last | E2-Monitoring PFLICHT, AI-Dosis anpassen |
| Trenbolon + 19-Nor (Deca) | Doppelte 19-Nor-Belastung → extreme Prolaktin-Erhöhung | NICHT kombinieren! Prolaktin-Krise |
| Trenbolon + Clenbuterol | Beide kardiotoxisch → Herzfrequenz + BP extrem | Herzrhythmusstörungen! GEFÄHRLICH |
| Orale AAS + Orale AAS | Doppelte Hepatotoxizität | Niemals 2 orale 17α-alkylierte gleichzeitig! |
| AAS + Diuretika | AAS → Polyzythämie + Diuretika → Dehydration | Thrombose-Risiko massiv erhöht |
| Trenbolon + Alkohol | Beide hepatotoxisch, Tren → Nachtschweiß verschlimmert | Leberschaden beschleunigt |
| AAS + NSAR (Ibuprofen) | Beide nephrotoxisch bei Dehydration | Nierenschaden im Defizit |
| Clenbuterol + Koffein | Additive Sympathomimetika-Wirkung | Tachykardie, Tremor, Arrhythmie |
| HGH + Insulin | Synergie aber: Hypoglykämie-Risiko potenziert | LEBENSGEFAHR ohne Glukose-Monitoring |
| T3 + hohes Kaloriendefizit | T3 verstärkt Katabolismus, AAS schützt nur teilweise | Muskelverlust trotz AAS |
| SARMs + AAS | Konkurrenz am Androgenrezeptor, kein Vorteil | Doppelte HPT-Suppression, sinnlos |

### ESTER-HALBWERTSZEITEN — PCT-TIMING

| Ester | Halbwertszeit | PCT-Start nach letzter Injektion |
|-------|---------------|----------------------------------|
| Propionat | 0.8 Tage | 3-4 Tage |
| Phenylpropionat | 1.5 Tage | 4-5 Tage |
| Enanthat | 4.5 Tage | 14 Tage (2 Wochen) |
| Cypionat | 5 Tage | 14 Tage (2 Wochen) |
| Decanoat (Nandrolon) | 15 Tage | 21-28 Tage (3-4 Wochen!) |
| Undecanoat (Nebido) | 33.9 Tage | 6-8 Wochen |
→ WICHTIG: PCT NIEMALS zu früh starten — aktiver Ester unterdrückt weiterhin!

### BLUTBILD-MONITORING PRO SUBSTANZ

| Substanz | Kritische Werte | Frequenz |
|----------|----------------|----------|
| Testosteron (alle Ester) | Hämatokrit, E2, Lipide, BP | Alle 6-8 Wochen |
| Nandrolon / Trenbolon | + Prolaktin, Progesteron | Alle 4-6 Wochen |
| Orale AAS (Anadrol, Winstrol, Anavar) | + Leberwerte (AST, ALT, GGT, Bilirubin) | Alle 4 Wochen! |
| HGH | + Nüchtern-BZ, HbA1c, IGF-1 | Alle 8-12 Wochen |
| T3 (Cytomel) | + TSH, fT3, fT4 | Vor, nach 4 Wo, nach Absetzen |
| Clenbuterol | + Kalium, Taurin, EKG bei Symptomen | Alle 2 Wochen |
| Diuretika | + Na, K, Mg, Ca, Kreatinin, SOFORT bei Symptomen | TÄGLICH bei Anwendung |
| Insulin | + Nüchtern-BZ, HbA1c, C-Peptid | Alle 4 Wochen |

### PHASEN-SPEZIFISCHE ERNÄHRUNG & TRAINING

**BLAST-Phase (On-Cycle):**
- Protein: 2.5-3g/kg/Tag (erhöhte Proteinsynthese nutzen)
- Kalorien: +500-800 kcal Surplus (Aufbau) / je nach Ziel
- Training: Höheres Volumen möglich (bessere Regeneration), 5-6×/Woche
- Wasser: Mindestens 4L/Tag (Nierenschutz, Hämatokrit)

**CRUISE-Phase (niedrig dosierte Brücke):**
- Protein: 2-2.5g/kg/Tag
- Kalorien: Maintenance oder leichtes Defizit
- Training: Moderat (4-5×/Woche), Intensität halten, Volumen reduzieren
- Fokus: Gesundheit stabilisieren, Blutbild normalisieren

**PCT-Phase (Off-Cycle Erholung):**
- Protein: 2.5g/kg/Tag (Muskelerhalt ohne anabole Unterstützung!)
- Kalorien: Maintenance, KEIN Defizit während PCT!
- Training: Reduziert (3-4×/Woche), Krafterhalt > Volumen
- Schlaf: 8h+, Stress minimieren → Hormonerholung braucht Ruhe
- Supps: Vitamin D (4000 IU), Zink (30mg), Magnesium (400mg), Ashwagandha

**OFF-Phase (komplett clean):**
- Protein: 2g/kg/Tag
- Kalorien: Je nach Ziel, volle Flexibilität
- Training: Normal (4-5×/Woche), Gains kommen langsamer
- Tipp: Blutbild 8 Wochen nach PCT-Ende kontrollieren — HPT-Achse erholt?
`;
