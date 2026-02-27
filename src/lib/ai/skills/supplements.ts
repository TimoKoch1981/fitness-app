/**
 * Static supplement knowledge skill.
 * Contains evidence-based knowledge about training supplements,
 * dosing, timing, interactions, and safety.
 *
 * Condensed from: fitbuddy_skill_supplements_training_comprehensive_v1_0_0.md
 *
 * @version 1.0.0
 */

import type { SkillMeta } from './types';

export const SUPPLEMENTS_SKILL_META: SkillMeta = {
  id: 'supplements',
  name: 'Supplements & Nahrungsergaenzung',
  version: '1.0.0',
  updatedAt: '2026-02-26',
  sources: [
    'ISSN Position Stand: Creatine (Kreider et al. 2017, JISSN, PMID:28615996)',
    'ISSN Position Stand: Protein & Exercise (Jager et al. 2017, JISSN, PMID:28642676)',
    'DGE Referenzwerte 2024',
    'Meta-Analyse: Kreatin Nierenfunktion (Kabiri Naeini et al. 2025, BMC Nephrol, PMID:41199218)',
    'Saunders et al. 2017, Br J Sports Med, PMID:28007636 — Beta-Alanine',
    'Wankhede et al. 2015, JISSN, PMID:26609282 — Ashwagandha (KSM-66)',
    'Shaw et al. 2017, Am J Clin Nutr, PMID:27852613 — Collagen + Vitamin C',
    'Avgerinos et al. 2018, Exp Gerontol, PMID:29704637 — Creatine & Cognition Meta-Analysis',
  ],
  tokenEstimate: 2800,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-02-26',
      changes: 'Initial: 30 Supplements mit Evidenzgrad, Dosierung, Timing, Interaktionen, Safety-Gates',
    },
  ],
};

export const SUPPLEMENTS_SKILL = `
## SUPPLEMENTS — EVIDENZBASIERTE REFERENZ

### Evidenz-Kategorien
- **A (Stark)**: Mehrere RCTs + Meta-Analysen, konsistente Ergebnisse
- **B (Moderat)**: Einige RCTs, ueberwiegend positive Ergebnisse
- **C (Schwach)**: Wenig Studien, inkonsistent oder nur Tiermodelle
- **D (Kein Beleg)**: Keine oder negative Evidenz fuer behauptete Wirkung

### TOP-TIER SUPPLEMENTS (Evidenz A)

| Supplement | Dosierung | Timing | Evidenz | Hauptwirkung |
|-----------|-----------|--------|---------|-------------|
| Kreatin Monohydrat | 3-5g/Tag (Erhaltung) | Jederzeit, taeglich | A | Kraft +5-15%, FFM +0.5-2kg/4-12Wo |
| Koffein | 3-6 mg/kg | 30-60 Min pre-Workout | A | Ausdauer +2-4%, Kraft +3-5% |
| Protein (Whey/Casein) | 1.6-2.2 g/kg/Tag gesamt | Post-Workout + vor Schlaf | A | MPS, Muskelaufbau, Recovery |
| Vitamin D3 | 1000-4000 IE/Tag | Mit fettreicher Mahlzeit | A | Knochen, Immunsystem, T-Spiegel |

### SECOND-TIER (Evidenz B)

| Supplement | Dosierung | Timing | Evidenz | Hauptwirkung |
|-----------|-----------|--------|---------|-------------|
| Beta-Alanin | 3.2-6.4g/Tag (aufteilen) | Taeglich (Loading 4 Wo) | B | Carnosin +40-80%, Ausdauer bei 1-4 Min |
| Omega-3 (EPA+DHA) | 2-3g/Tag | Mit Mahlzeit | B | Antiinflammatorisch, Herzgesundheit |
| Magnesium | 200-400mg/Tag | Abends (Citrat/Glycinat) | B | Schlaf, Muskelrelaxation, >300 Enzyme |
| Zink | 15-30mg/Tag | Abends, nüchtern | B | Immunsystem, T-Synthese, Wundheilung |
| L-Citrullin | 6-8g oder 8-10g Malat | 30-60 Min pre-Workout | B | NO↑, Pump, Ausdauer, Ammoniak-Clearance |
| Ashwagandha (KSM-66) | 300-600mg/Tag | Morgens oder abends | B | Cortisol ↓, Kraft ↑, Schlaf ↑ |
| Kollagen-Peptide | 10-15g/Tag | 30-60 Min vor Belastung | B | Sehnen, Baender, Knorpel (mit Vitamin C) |
| Elektrolyte (Na/K/Mg) | Individuell | Waehrend Training >60 Min | B | Hydration, Muskelkontraktion |

### THIRD-TIER (Evidenz C oder Marketing > Evidenz)

| Supplement | Dosierung | Evidenz | Bewertung |
|-----------|-----------|---------|-----------|
| BCAAs | 5-10g | C | Ueberfluessig wenn Protein >1.6g/kg/Tag |
| EAAs | 6-12g | C | Besser als BCAAs, aber Whey ist ueberlegen |
| L-Glutamin | 5-10g | C | Kein Muskelaufbau-Effekt, evtl. Darmgesundheit |
| HMB | 3g/Tag | C | Nur bei Anfaengern/Kaloriendefizit/Aelteren |
| L-Arginin | 3-6g | C | Schlechte Bioverfuegbarkeit, Citrullin besser |
| Taurin | 1-3g | C | Antioxidans, moeglich Leistung ↑ |
| L-Carnitin | 2-3g/Tag | C | Fettstoffwechsel fraglich, evtl. kardiovaskulaer |
| CoQ10/Ubiquinol | 100-300mg | C | Bei Statin-Nutzern sinnvoll, sonst unklar |
| Curcumin | 500-1000mg (Piperinform) | C | Antiinflammatorisch, Bioverfuegbarkeit-Problem |
| Eisen | NUR bei Mangel | C | Nicht supplementieren ohne Laborbefund! |
| Melatonin | 0.3-1mg | C | Einschlaf-Hilfe, keine Schlafqualitaet-Daten |

### KEIN BELEG / MARKETING (Evidenz D)

| Supplement | Behauptung | Realitaet |
|-----------|-----------|-----------|
| Tribulus Terrestris | T-Booster | Kein T-Anstieg in RCTs (Qureshi 2014) |
| D-Asparaginsaeure | T-Booster | Kurzfristig +15-40% T, aber Normalisierung nach 2-4 Wo |
| Turkesteron/Ecdysteron | Anaboler Effekt | Keine ueberzeugenden Humandaten, kontaminierte Produkte |
| ZMA | T-Booster/Schlaf | Nur wirksam bei Zink/Mg-Mangel (dann Einzelstoffe günstiger) |
| Bockshornklee | T-Booster | Inkonsistent, moeglich DHT-Blockade → Libido |
| NO-Booster (L-Arginin) | Pump/Leistung | L-Arginin hat first-pass Effekt, Citrullin besser |

### KREATIN — DETAILWISSEN (haeufigste Fragen)
- **Loading**: Optional: 20g/Tag (4x5g) fuer 5-7 Tage; Alternative: 3-5g/Tag (Saettigung nach ~4 Wochen)
- **Formen**: Monohydrat = Goldstandard. HCL/Kre-Alkalyn/Ethylester: keine Ueberlegenheit belegt
- **Niere**: Meta-Analyse 2025: KEIN negativer GFR-Effekt bei Gesunden
- **Wasserretention**: +1-2kg initial (intramuskulaer, KEIN Fett)
- **Kognition**: Verbesserung bei Schlafentzug/Stress (Meta-Analyse 2024)
- **Veganer**: Profitieren staerker (niedrigere Baseline-Speicher)
- **Haarverlust**: Eine Studie (DHT ↑), aber nicht repliziert; Risiko gering
- **Langzeit**: Sicher bei >5 Jahren Supplementierung (ISSN)

### INTERAKTIONEN & SAFETY-GATES

#### Substanz-Interaktionen
| Kombination | Hinweis |
|-------------|---------|
| Kreatin + Koffein | Kein negativer Effekt (frueheres Concern widerlegt) |
| Omega-3 + Blutverdünner | Cave: Blutungsrisiko erhoht |
| Omega-3 + OP | 1-2 Wochen vorher pausieren |
| Eisen + Koffein/Tee | Absorption ↓↓ — 2h Abstand |
| Zink + Eisen | Konkurrenz bei Absorption — getrennt einnehmen |
| Magnesium + Antibiotika | Absorption beider ↓ — 2h Abstand |
| Ashwagandha + Schilddruese | Kann T3/T4 erhoehen → Cave bei Hyperthyreose |
| Vitamin D + Sarkoidose | Kann Hyperkalzaemie verursachen |

#### Red Flags → Absetzen + Arzt
- Leberprobleme (Ikterus, Oberbauchschmerz) bei JEDEM Supplement
- GI-Beschwerden >2 Wochen nach Beginn
- Allergische Reaktion (Ausschlag, Schwellung, Atemnot)
- Nierenprobleme bei Kreatin (nur bei Vorerkrankung relevant)
- DMAA/DMHA in Pre-Workouts → potentiell toedlich (verboten in DE/EU)

### ANTWORTREGELN
1. Evidenzgrad IMMER nennen (A/B/C/D)
2. Bei D-Supplements: Klar kommunizieren dass kein Beleg existiert
3. Dosierung + Timing + Evidenz als Dreierpaket
4. Bei Interaktionen: Proaktiv warnen
5. Nie Supplements als Ersatz fuer Ernaehrung empfehlen
6. Markenprodukte nur auf explizite Nutzerfrage
7. Bei Vorerkrankungen (Niere, Leber, Schilddruese): Arzt-Empfehlung
`;
