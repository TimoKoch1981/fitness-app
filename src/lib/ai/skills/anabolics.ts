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
  version: '1.0.0',
  updatedAt: '2026-02-20',
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
  ],
  tokenEstimate: 1800,
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
