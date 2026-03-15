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
  version: '1.1.0',
  updatedAt: '2026-03-15',
  sources: [
    'ISSN Position Stand: Creatine (Kreider et al. 2017, JISSN, PMID:28615996)',
    'ISSN Position Stand: Protein & Exercise (Jaeger et al. 2017, JISSN, PMID:28642676)',
    'ISSN Position Stand: Caffeine (Guest et al. 2021, JISSN, PMID:33388079)',
    'Schoenfeld & Aragon 2018, JISSN, PMID:29497353 — Protein Distribution',
    'Trexler et al. 2015, JISSN, PMID:26175657 — Beta-Alanine',
    'Gonzalez & Trexler 2020, JSCR, PMID:31977835 — Citrulline',
    'Res et al. 2012, Med Sci Sports Exerc, PMID:22330017 — Pre-Sleep Casein',
    'Philpott et al. 2019, Br J Sports Med, PMID:30504512 — Omega-3',
    'Roberts et al. 2020, J Hum Kinet, PMID:32148575 — Physique Athlete Nutrition',
    'Campbell et al. 2020, JFMK, PMID:33467235 — Intermittent Energy Restriction',
  ],
  tokenEstimate: 2200,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-03-15',
      changes: 'Initial: 8 Supplements mit evidenzbasiertem Timing, Dosierung, Interaktionen',
    },
    {
      version: '1.1.0',
      date: '2026-03-15',
      changes: 'PMIDs aktualisiert: Koffein (Guest 2021), Casein (Res 2012), Omega-3 (Philpott 2019), Citrullin (Gonzalez 2020). ZMA-Evidenz praezisiert. Neue Quellen: Roberts 2020, Campbell 2020.',
    },
  ],
};

export const SUPPLEMENT_TIMING_SKILL = `
## SUPPLEMENT-TIMING — EVIDENZBASIERTE REFERENZ

### Kreatin (ISSN Level A, PMID:28615996)
- Dosis: 3-5g/Tag (Loading optional: 20g/Tag x5-7 Tage)
- Timing: Egal wann — Konsistenz > Timing (Kreider et al. 2017)
- Mit Kohlenhydraten fuer verbesserte Aufnahme
- Einziges Supplement mit Level-A-Evidenz fuer Kraft und Magermasse

### Whey Protein (PMID:29497353)
- Post-Workout: innerhalb 2h (Fenster laenger als frueher angenommen, Aragon & Schoenfeld 2013)
- Dosis: 0.4-0.55g/kg pro Mahlzeit (Schoenfeld & Aragon 2018)
- 4-6 Mahlzeiten/Tag fuer optimale Muskelproteinsynthese
- Isolat bei Laktose-Empfindlichkeit

### Casein (PMID:22330017)
- VOR dem Schlafen (langsame Verdauung, 6-8h Aminosaeure-Versorgung)
- 30-40g. Alternative: 400g Magerquark (~48g Protein)
- Res et al. 2012: Pre-Sleep Protein verbessert naechtliche MPS + Erholung

### Koffein (PMID:33388079)
- Pre-WO: 3-6mg/kg, 30-60min vorher (Guest et al. 2021 ISSN Position Stand)
- Cutoff: <200mg nach 14 Uhr (HWZ 5-6h → Schlaf)
- Max 400mg/Tag. Toleranz-Reset: 2 Wochen Pause alle 2-3 Monate
- Genetik beeinflusst Metabolismus: CYP1A2 Slow Metabolizer → niedrigere Dosis
- Interaktion: Nicht mit Kreatin gleichzeitig (theoretisch antagonistisch, praktisch irrelevant)

### ZMA (Zink, Magnesium, B6)
- Vor dem Schlafen, nuechtern
- NICHT mit Calcium/Milchprodukte (hemmt Zink-Absorption)
- NUR sinnvoll bei nachgewiesenem Mangel (Blutbild pruefen!)
- Evidenzlage schwach: Keine robuste Studie zeigt Testosteron-Boost bei gesunden Athleten
- Magnesium allein (300-400mg Citrat/Glycinat) oft sinnvoller + guenstiger

### Vitamin D3
- Morgens mit fetthaltiger Mahlzeit (fettloeslich)
- 2000-5000 IE/Tag (Ziel: 40-60 ng/ml Blutlevel, PMID:17634462)
- + Vitamin K2 (MK-7, 100-200mcg)
- Athleten mit Indoor-Training: haeufiger defizient → supplementieren

### Beta-Alanin (PMID:26175657)
- 2-3x taeglich splitten (reduziert Paraesthesie/Kribbeln)
- 3.2-6.4g/Tag gesamt. Voller Effekt nach 2-4 Wochen Loading
- Nutzen: Pufferkapazitaet bei Sets 60-240 Sekunden (Trexler et al. 2015)

### L-Citrullin (PMID:31977835)
- 30-60min pre-WO. 6-8g L-Citrullin (oder 8-10g Citrullin-Malat 2:1)
- NO-Produktion, Durchblutung, Pump (Gonzalez & Trexler 2020)
- Moderate Effektgroesse fuer Kraftausdauer bei hohem Volumen

### Omega-3 EPA/DHA (PMID:30504512)
- Mit Mahlzeit (verbesserte Absorption)
- 2-3g EPA+DHA/Tag (Philpott et al. 2019)
- Triglycerid-Form > Ethylester (hoehere Bioverfuegbarkeit)
- Anti-inflammatorisch: unterstuetzt Erholung bei hohem Trainingsvolumen

### PHASEN-SPEZIFISCHE HINWEISE
- **Cut-Phase:** Protein hoch halten (2.3-3.1g/kg LBM, Roberts 2020 PMID:32148575). Kreatin beibehalten (schuetzt Kraft). Koffein nuetzlich fuer Leistung im Defizit.
- **Bulk-Phase:** Kreatin + Post-WO Protein (20-40g) + Carbs. Beta-Alanin fuer hohe Wiederholungszahlen.
- **Peak Week:** Nur bewusst ergaenzen, Natrium/Wasser-Interaktionen beachten. Koffein-Toleranz bewusst nutzen.
- **Refeed-Tage:** Protein konstant, Carbs erhoehen (Campbell et al. 2020 PMID:33467235 — erhalt FFM bei intermittierendem Defizit).

WICHTIG: Aktuelle Phase, Mahlzeiten-Timing, Interaktionen und Vertraeglichkeit beruecksichtigen.
`;
