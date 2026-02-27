/**
 * Static competition preparation knowledge skill.
 * Contains evidence-based knowledge about natural & enhanced competition prep,
 * peak week protocols, macro periodization, and post-competition recovery.
 *
 * Condensed from: fitbuddy_skill_competition_prep_comprehensive_v1_0_0.md
 *
 * @version 1.0.0
 */

import type { SkillMeta } from './types';

export const COMPETITION_SKILL_META: SkillMeta = {
  id: 'competition',
  name: 'Wettkampfvorbereitung',
  version: '1.0.0',
  updatedAt: '2026-02-26',
  sources: [
    'Helms et al. 2014, JISSN, PMID:24864135 — Natural Bodybuilding Contest Prep',
    'Trexler et al. 2014, JISSN, PMID:24571926 — Metabolic Adaptation to Weight Loss',
    'Chappell & Simper 2018, J Sports Sci, PMID:30352979 — Peak Week Strategies',
    'Roberts et al. 2020, J Hum Kinet, PMID:32148575 — Bodybuilding Prep Recommendations',
    'Rossow et al. 2013, Int J Sport Nutr Exerc Metab, PMID:23412685 — Post-Competition Recovery',
    'Fagerberg 2018, Int J Sport Nutr Exerc Metab — Low Energy Availability in Natural BB',
  ],
  tokenEstimate: 2000,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-02-26',
      changes: 'Initial: Natural/Enhanced Prep, Makro-Periodisierung, Peak Week, Dehydration Safety, Post-Comp Recovery',
    },
  ],
};

export const COMPETITION_SKILL = `
## WETTKAMPFVORBEREITUNG — FACHWISSEN

### SAFETY WARNING: Peak Week Dehydration ⚠️
Extreme Dehydration birgt ernsthafte Risiken:
- Kardial: Arrhythmien, Synkope, selten ploetzlicher Herztod
- Renal: Akutes Nierenversagen, Elektrolytstoerung
- Neurologisch: Kraempfe, Hitzschlag
- EMPFEHLUNG: Konservative Wasser-Manipulation, aerztliche Begleitung

### Natural vs. Enhanced Prep — Ueberblick
| Eigenschaft | Natural | Enhanced |
|-------------|---------|----------|
| Prep-Dauer | 20-30 Wochen (5-7 Mo) | 8-16 Wochen (2-4 Mo) |
| Fettabbau/Woche | 0.5-0.75% KG | 0.75-1.5% KG |
| Krafterhalt | 85-95% | 80-90% |
| Muskelverlust-Risiko | Hoeher | Niedriger (hormonelle Absicherung) |
| Hormonelles Risiko | Niedrig | Moderat-Hoch |
| Recovery post-Show | 12-24h | 6-12h |

### Natural Prep Timeline
| Phase | Wochen | Fokus | KFA-Ziel |
|-------|--------|-------|----------|
| Baseline Assessment | 0-2 | Startpunkt, Defizit planen | Aktueller KFA |
| Early Prep | 2-6 | Moderates Defizit, Training optimieren | -2 bis -3% |
| Main Cutting | 6-16 | Stetiges Defizit, Kraft erhalten | -5 bis -8% |
| Advanced Cutting | 16-22 | Aggressives Defizit, Muskelschutz | -8 bis -12% |
| Final Polish | 22-26 | Feintuning, kosmetische Anpassung | <2% vom Ziel |
| Peak Week | 26-30 | Carb Loading, Wasser-Manipulation | WETTKAMPF |

### Makro-Periodisierung
#### Protein (hoechste Prioritaet)
- Formel: 2.3-3.1 g/kg Magermasse (LBM)
- Baseline: 1.8-2.0 g/kg LBM
- Fruehes Defizit: 2.2-2.5 g/kg LBM
- Aggressives Defizit: 2.6-2.9 g/kg LBM
- Peak Week: 2.5-3.1 g/kg LBM

#### Fett (Minimum-Schwelle)
- Nie unter 15% der Gesamtkalorien (Hormonstatus!)
- Optimal: 0.5-0.8 g/kg Koerpergewicht
- Unter 0.5 g/kg: Testosteron-Abfall wahrscheinlich

#### Kohlenhydrate (variabel)
- Restliche Kalorien nach Protein + Fett
- Refeed-Tage: 1-2x/Woche bei niedrigem KFA (<12%)
- Glykogen-Supercompensation: Carb Loading 2-3 Tage vor Show

### Peak Week Protokoll (konservativ/evidenzbasiert)
| Tag | Wasser | Carbs | Natrium | Training |
|-----|--------|-------|---------|----------|
| Mo (D-6) | Normal (4-6L) | Niedrig (Depletion) | Normal | Ganzkörper-Depletion |
| Di (D-5) | Normal | Niedrig | Normal | Optionales leichtes Training |
| Mi (D-4) | Normal | HOCH (Carb-Load Start) | Normal | Ruhe |
| Do (D-3) | Reduzieren auf 2-3L | HOCH | Leicht reduzieren | Ruhe |
| Fr (D-2) | 1-1.5L | Moderat-Hoch | Reduziert | Posing Practice |
| Sa (D-1) | 0.5-1L (Sipping) | Moderat | Minimal | Posing, Tan, Rest |
| So (Show) | Minimal Sips | Nach Bedarf | Nach Bedarf | SHOWTIME |

WARNUNG: Aggressive Dehydration (0L fuer >24h) ist medizinisch GEFAEHRLICH!

### Metabolische Adaptation ("Metabolic Damage")
- Laengeres Defizit → TDEE sinkt (adaptive Thermogenese, -10 bis -15%)
- NEAT sinkt unbewusst (weniger Alltagsbewegung)
- T3 (Schilddruese) sinkt
- Leptin sinkt → staerkerer Hunger
- Gegenmassnahmen: Refeed-Tage, Diet Breaks (1-2 Wochen Maintenance alle 8-12 Wo)

### Post-Competition Recovery (Reverse Dieting)
| Phase | Dauer | Kalorien-Anpassung | Fokus |
|-------|-------|-------------------|-------|
| Sofort | 1-3 Tage | +500-1000 kcal | Rehydration, Elektrolyte |
| Woche 1-2 | 2 Wochen | +200-300 kcal/Wo | Langsam steigern, GI beachten |
| Woche 3-8 | 6 Wochen | +100-200 kcal/Wo | Richtung Maintenance |
| Woche 9-16 | 8 Wochen | Maintenance oder leichter Ueberschuss | Hormon-Recovery, Muskelaufbau |

**Post-Show-Risiken:**
- Binge-Eating-Episode: SEHR haeufig (~70% berichten unkontrolliertes Essen)
- Rapid Fat Regain: +5-10kg in ersten 2-4 Wochen (Wasser + Glykogen + Fett)
- Depression/Sinnkrise: "Post-Show Blues" — Ziel erreicht, was jetzt?
- Hormon-Dysregulation: Kann Monate dauern (besonders Natural)

### ANTWORTREGELN
1. Natural-First: Immer zuerst Natural-Optionen besprechen
2. Safety: Dehydrations-Risiken IMMER erwaehnen bei Peak Week
3. Zeitrahmen: Realistische Prep-Dauer kommunizieren (nicht 4 Wochen Natural!)
4. Psychologie: Post-Show-Blues ansprechen
5. Bei Enhanced: Substanz-Risiken nicht beschoenigen
6. Arzt-Empfehlung bei extremen Massnahmen
`;
