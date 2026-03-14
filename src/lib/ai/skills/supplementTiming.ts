/**
 * Supplement Timing Skill — Evidence-based supplement timing recommendations.
 * Auto-discovered via import.meta.glob in skills/index.ts.
 *
 * Sources:
 * - ISSN Position Stand: Creatine (Kreider et al. 2017, PMID:28615996)
 * - ISSN Position Stand: Protein (Jager et al. 2017, PMID:28642676)
 * - Schoenfeld & Aragon 2018: Protein timing
 * - Trexler et al. 2014: Beta-alanine
 *
 * F15: Bodybuilder-Modus
 */

import type { SkillMeta } from './types';

export const SUPPLEMENT_TIMING_SKILL_META: SkillMeta = {
  id: 'supplementTiming',
  name: 'Supplement-Timing',
  version: '1.0.0',
  updatedAt: '2026-03-15',
  sources: [
    'ISSN Position Stand: Creatine (Kreider et al. 2017, JISSN, PMID:28615996)',
    'ISSN Position Stand: Protein & Exercise (Jager et al. 2017, JISSN, PMID:28642676)',
    'Schoenfeld & Aragon 2018, JISSN, PMID:29497353 — Protein Distribution',
    'Trexler et al. 2015, JISSN, PMID:26175657 — Beta-Alanine',
    'Gonzalez et al. 2023, JISSN — Citrulline Meta-Analysis',
  ],
  tokenEstimate: 1800,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-03-15',
      changes: 'Initial: 8 Supplements mit evidenzbasiertem Timing, Dosierung, Interaktionen',
    },
  ],
};

export const SUPPLEMENT_TIMING_SKILL = `
## SUPPLEMENT-TIMING — EVIDENZBASIERTE REFERENZ

### Kreatin (ISSN Level A)
- Dosis: 3-5g/Tag (Loading optional: 20g/Tag x5-7 Tage)
- Timing: Egal wann — Konsistenz > Timing
- Mit Kohlenhydraten fuer verbesserte Aufnahme
- Einziges Supplement mit Level-A-Evidenz fuer Kraft

### Whey Protein
- Post-Workout: innerhalb 2h (Fenster laenger als frueher angenommen)
- Dosis: 0.4-0.55g/kg pro Mahlzeit (Schoenfeld & Aragon 2018)
- Isolat bei Laktose-Empfindlichkeit

### Casein
- VOR dem Schlafen (langsame Verdauung, 6-8h Aminosaeure-Versorgung)
- 30-40g. Alternative: 400g Magerquark (~48g Protein)

### Koffein
- Pre-WO: 3-6mg/kg, 30-60min vorher
- Cutoff: <200mg nach 14 Uhr (HWZ 5-6h → Schlaf)
- Max 400mg/Tag. Toleranz-Reset: 2 Wochen Pause alle 2-3 Monate

### ZMA (Zink, Magnesium, B6)
- Vor dem Schlafen, nuechtern
- NICHT mit Calcium/Milchprodukte (hemmt Zink-Absorption)
- Nur sinnvoll bei nachgewiesenem Mangel

### Vitamin D3
- Morgens mit fetthaltiger Mahlzeit (fettloeslich)
- 1000-4000 IE/Tag (Ziel: 40-60 ng/ml Blutlevel)
- + Vitamin K2 (MK-7)

### Beta-Alanin
- 2-3x taeglich splitten (reduziert Kribbeln)
- 3.2-6.4g/Tag gesamt. Voller Effekt nach 2-4 Wochen
- Nutzen: Pufferkapazitaet bei Sets >60 Sekunden

### L-Citrullin (Malat)
- 30-60min pre-WO. 6-8g L-Citrullin (oder 8-10g Malat)
- NO-Produktion, Durchblutung, Pump

### Omega-3 (EPA/DHA)
- Mit Mahlzeit (verbesserte Absorption)
- 2-4g EPA+DHA. Triglycerid-Form > Ethylester

WICHTIG: Aktuelle Phase, Mahlzeiten-Timing, Interaktionen und Vertraeglichkeit beruecksichtigen.
`;
