/**
 * Static sleep & regeneration knowledge skill.
 * Contains evidence-based knowledge about sleep physiology, recovery strategies,
 * HRV monitoring, overtraining detection, and regeneration optimization.
 *
 * Condensed from: fitbuddy_skill_sleep_regeneration_comprehensive_v1_0_0.md
 *
 * @version 1.0.0
 */

import type { SkillMeta } from './types';

export const SLEEP_SKILL_META: SkillMeta = {
  id: 'sleep',
  name: 'Schlaf & Regeneration',
  version: '1.0.0',
  updatedAt: '2026-02-26',
  sources: [
    'Walker 2017 — Why We Sleep',
    'Vitale et al. 2019, Int J Environ Res Public Health — Sleep & Athletic Performance',
    'Leproult & Van Cauter 2011, JAMA — Sleep & Testosterone',
    'Meeusen et al. 2013, Med Sci Sports Exerc — Overtraining Consensus',
    'Halson 2014, Sports Med — Recovery Techniques',
    'Plews et al. 2013, Int J Sports Physiol Perform — HRV & Training',
  ],
  tokenEstimate: 2200,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-02-26',
      changes: 'Initial: Schlaf-Physiologie, Hormone, Schlafhygiene, Melatonin, Regeneration, HRV, Overtraining, Alkohol/Koffein',
    },
  ],
};

export const SLEEP_SKILL = `
## SCHLAF & REGENERATION — FACHWISSEN

### Schlaf-Architektur
| Stadium | Anteil | Funktion |
|---------|--------|----------|
| N1 (Leichtschlaf) | 5% | Einschlafphase, Muskelentspannung |
| N2 (Mittlerer Schlaf) | 45-55% | Gedaechtniskonsolidierung, Spindeln |
| N3 (Tiefschlaf/Delta) | 15-25% | GH-Ausschuettung, Muskelreparatur, Immunsystem |
| REM | 20-25% | Gedaechtniskonsolidierung, emotionale Verarbeitung |

- Zyklusdauer: ~90 Minuten, 4-6 Zyklen/Nacht
- Tiefschlaf dominiert 1. Haelfte, REM dominiert 2. Haelfte
- Kraftsportler: N3 besonders wichtig (GH-Peak, Muskelproteinsynthese)

### Schlaf & Hormone
- **GH (Wachstumshormon)**: 70% der taeglichen GH-Sekretion in N3-Tiefschlaf
- **Testosteron**: Peak in fruehen REM-Phasen; 1 Woche Schlafentzug (<5h) senkt T um ~15% (Leproult 2011)
- **Cortisol**: Nadir um 23-01 Uhr, Peak 06-08 Uhr; Schlafmangel erhoht basales Cortisol
- **Melatonin**: Onset 2h vor Schlaf, Peak 02-04 Uhr; unterdrueckt durch Blaulicht
- **Insulin**: Schlafmangel → Insulinresistenz (+40% nach 4 Naechten <4.5h)

### Schlafmengen-Empfehlungen
| Gruppe | Empfehlung | Quelle |
|--------|-----------|--------|
| Erwachsene allgemein | 7-9 Stunden | NSF 2015 |
| Kraftsportler | 8-10 Stunden | ACSM/ISSN |
| Ausdauersportler | 8-10 Stunden | Vitale 2019 |
| Enhanced Athletes (AAS) | 8-10 Stunden | Erhoehter Recovery-Bedarf |
| GLP-1 Nutzer | 7-9 Stunden | Normale Empfehlung |
| Aeltere (>65 Jahre) | 7-8 Stunden | Tiefschlaf-Anteil sinkt natuerlich |

### Schlaf-Hygiene Protokoll (evidenzbasiert)
1. **Temperatur**: Schlafzimmer 16-19 Grad C (Hagnauer 2019)
2. **Dunkelheit**: Komplette Verdunkelung, kein Standby-Licht
3. **Blaulicht**: 60-90 Min vor Schlaf kein Screen ODER Blaulichtfilter
4. **Koffein-Cutoff**: 6-8h vor Schlafenszeit (Halbwertszeit ~5h)
5. **Alkohol**: Mindestens 3h vor Schlaf beenden (stoert REM)
6. **Mahlzeiten**: Letzte grosse Mahlzeit 2-3h vor Schlaf
7. **Bewegung**: Kein intensives Training 2-3h vor Schlaf
8. **Routine**: Konstante Schlaf-/Aufwachzeiten (±30 Min, auch Wochenende)
9. **Entspannung**: 10-20 Min Pre-Sleep-Routine (Lesen, Stretching, Atemuebungen)

### Melatonin — Evidenz
| Aspekt | Empfehlung |
|--------|-----------|
| Dosierung | 0.3-1.0 mg (physiologisch); >3mg pharmakologisch |
| Timing | 30-60 Min vor Schlaf |
| Evidenz | Einschlaflatenz: -7 Min (Meta-Analyse), Jetlag: gut belegt |
| Nicht belegt | Schlafqualitaet/Dauer-Verbesserung bei Gesunden |
| Cave | Nicht bei Autoimmunkrankheiten, Schwangerschaft |
| Toleranz | Keine physische Abhaengigkeit, aber Wirkungsverlust moeglich |

### Regenerationsstrategien
| Strategie | Evidenz | Wann |
|-----------|---------|------|
| Aktive Erholung (Zone 1) | Stark | Tag nach intensivem Training |
| Schlaf (7-9h) | Sehr stark | Taeglich |
| Protein-Timing (Casein vor Schlaf) | Moderat | Post-Workout / Vor Schlaf |
| Kaltwasser-Immersion (10-15°C, 10-15 Min) | Moderat | Nach intensivem Training (NICHT in Hypertrophie-Phase!) |
| Sauna (80-100°C, 15-20 Min) | Moderat | Erholungstage, HSP-Stimulation |
| Massage/Foam Rolling | Moderat | Post-Workout, Ruhetage |
| Kompression | Schwach-Moderat | Post-Workout |
| Stretching (statisch) | Schwach | Nach Training, nie vor Kraft |

WICHTIG: Kaltwasser-Immersion hemmt Hypertrophie-Signale (mTORC1)! Nicht nach Krafttraining in Aufbauphase.

### Overtraining vs. Overreaching
| Merkmal | Funktionales Overreaching | Non-funktionales OR | Overtraining-Syndrom |
|---------|--------------------------|--------------------|--------------------|
| Leistung | Kurzfristig ↓ | Laenger ↓ | Anhaltend ↓ |
| Erholung | 1-2 Wochen | 2-8 Wochen | Monate bis Jahre |
| Stimmung | Leicht ↓ | Deutlich ↓ | Depression moeglich |
| Schlaf | Normal | Gestoert | Stark gestoert |
| Ruhepuls | Normal | Erhoht/variabel | Erhoht |
| HRV | Normal/leicht ↓ | Deutlich ↓ | Chronisch ↓ |

### HRV als Regenerations-Tool
- **RMSSD** (Root Mean Square of Successive Differences): Parasympathikus-Marker
- Hoher RMSSD = gute Erholung, niedriger RMSSD = Stress/mangelnde Erholung
- Morgens direkt nach Aufwachen messen (konsistente Bedingungen)
- 7-Tage-Trend wichtiger als Einzelmessung
- Bei HRV-Abfall >15% vom Baseline: Trainingsintensitaet reduzieren
- Apps: HRV4Training, Elite HRV, Garmin/Apple Watch (weniger genau)

### Alkohol & Schlaf
- Verkuerzt Einschlaflatenz, ABER: zerstoert REM-Schlaf
- >2 Standarddrinks: Tiefschlaf +, REM ↓↓, Schlaffragmentierung ↑
- GH-Ausschuettung um bis zu 75% reduziert
- Dehydration verstaerkt Effekte
- Empfehlung: Mindestens 3h zwischen letztem Drink und Schlaf

### Koffein & Schlaf
- Halbwertszeit: ~5h (individuell 3-7h, CYP1A2-Polymorphismus)
- Blockiert Adenosin-Rezeptoren → unterdrueckt Schlaefrigkeit
- 400mg (4 Tassen) = max. empfohlene Tagesdosis
- Cutoff: 6-8h vor Schlafenszeit (fuer Schlafqualitaet)
- Koffein + Kreatin: Kein negativer Interaktionseffekt belegt

### Red Flags → Aerztliche Abklaerung
- Schnarchen + Tagessmuedigkeit + Atemaussetzer → Schlafapnoe-Verdacht
- Einschlafzeit >45 Min fuer >3 Wochen → Insomnie
- Ungewolltes Einschlafen tagsueber → Narkolepsie/schwerer Schlafmangel
- HRV chronisch niedrig + Leistungsabfall → Overtraining-Syndrom
- Naechtliches Schwitzen + Herzrasen → Kardial/Hormonstatus pruefen
`;
