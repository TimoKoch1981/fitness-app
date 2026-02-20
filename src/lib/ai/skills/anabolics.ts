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
 *      Nielsen et al. 2023 (JCEM), Pope et al. 2014 (Drug Alcohol Depend)
 */

import type { SkillMeta } from './types';

export const ANABOLICS_SKILL_META: SkillMeta = {
  id: 'anabolics',
  name: 'Anabolika & PED-Pharmakologie',
  version: '1.0.0',
  updatedAt: '2026-02-20',
  sources: [
    'Bhasin et al. 1996, NEJM — Testosterone dose-response',
    'Egner et al. 2013, J Physiol — Myonuclei & muscle memory',
    'Nielsen et al. 2023, JCEM — Myonuclei in ex-AAS users',
    'Pope et al. 2014, Drug Alcohol Depend — AAS dependence',
    'WADA Prohibited List 2025',
    'Kanayama et al. 2015, Lancet — AAS epidemiology',
  ],
  tokenEstimate: 1100,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-02-20',
      changes: 'Initial: AAS-Substanzgruppen, HGH, Insulin, SARMs, Stimulanzien, Diuretika, Muscle Memory, PCT-Evidenz, Risikomatrix',
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

## ANTWORTREGELN FÜR PED-FRAGEN
1. URTEILSFREI beraten — Harm Reduction > Moralpredigten
2. Risiken SACHLICH darstellen, nicht dramatisieren aber nicht beschönigen
3. Bei konkreten Dosierungsfragen: Evidenz zitieren, aber "Besprich das mit deinem Arzt"
4. Schwarzmarkt-Risiken immer erwähnen wenn relevantes Thema
5. Blutbild-Monitoring als PFLICHT betonen, nicht als Option
6. Kardiovaskuläres Monitoring (BP, Lipide, Hämatokrit) hervorheben
`;
