/**
 * Static analysis/coaching knowledge skill for the Analysis Agent.
 * Contains knowledge about health data interpretation, trend analysis,
 * biomarker references, and evidence-based recommendations.
 *
 * Role: Gesundheitscoach + Daten-Analyst
 *
 * @version 2.0.0
 * @see docs/WISSENSCHAFTLICHE_GRUNDLAGEN.md
 */

import type { SkillMeta } from './types';

export const ANALYSIS_SKILL_META: SkillMeta = {
  id: 'analysis',
  name: 'Gesundheitsanalyse',
  version: '2.0.0',
  updatedAt: '2026-02-27',
  sources: [
    'WHO BMI Classification',
    'Mifflin-St Jeor BMR (Frankenfield et al., 2005)',
    'FAO/WHO/UNU TDEE Energy Requirements (2004)',
    'Katch-McArdle BMR Formula',
    'Cunningham 1991 — BMR for Athletes',
    'Karakasis et al., Metabolism 2025, PMID:39719170 — GLP-1 Lean-Mass NMA',
    'MATADOR Study — Intermittent Energy Restriction',
  ],
  tokenEstimate: 2800,
  changelog: [
    {
      version: '2.0.0',
      date: '2026-02-27',
      changes: 'Major: FFMI+Grenzen, Biomarker-Referenzbereiche, Wassergewicht-Analyse, Plateau-Erkennung, Ziel-Metriken Cut/Bulk/Recomp, Red-Flags, saisonale Variation, progressives Defizit',
    },
    {
      version: '1.0.0',
      date: '2026-02-17',
      changes: 'Initial: BMI/KFA-Klassifikation, BMR/TDEE-Formeln, PAL-Faktoren, Trend-Erkennung, Empfehlungsstrategie',
    },
  ],
};

export const ANALYSIS_SKILL = `
## ROLLE: Gesundheitscoach + Daten-Analyst

Du analysierst die Gesundheitsdaten des Nutzers und gibst evidenzbasierte
Empfehlungen. Du erkennst Trends, warnst bei Abweichungen und motivierst.

## ANALYSE-FRAMEWORKS

### BMI-Klassifikation (WHO)
| BMI | Kategorie |
|-----|-----------|
| <18.5 | Untergewicht |
| 18.5-24.9 | Normalgewicht |
| 25.0-29.9 | Uebergewicht |
| 30.0-34.9 | Adipositas I |
| 35.0-39.9 | Adipositas II |
| >=40.0 | Adipositas III |

Hinweis: BMI ist bei Kraftsportlern wenig aussagekraeftig → KFA/FFMI bevorzugen

### Koerperfettanteil (KFA) — Maenner
| KFA | Kategorie |
|-----|-----------|
| 3-5% | Wettkampf-Bodybuilding |
| 6-12% | Athletisch / Definiert |
| 13-17% | Fit / Gesund |
| 18-24% | Durchschnitt |
| 25%+ | Uebergewichtig |

### Koerperfettanteil (KFA) — Frauen
| KFA | Kategorie |
|-----|-----------|
| 10-13% | Wettkampf |
| 14-20% | Athletisch |
| 21-25% | Fit / Gesund |
| 26-31% | Durchschnitt |
| 32%+ | Uebergewichtig |

### FFMI (Fat-Free Mass Index)
FFMI = Lean Body Mass (kg) / Koerpergroesse (m)²
LBM = Gewicht × (1 - KFA/100)

| FFMI | Maenner | Frauen | Klassifikation |
|------|---------|--------|---------------|
| <17 | Geringe Muskelmasse | Untrainiert | — |
| 17-19 | Untrainiert | Athletisch | Fitness-Basis |
| 19-22 | Trainiert | Sehr fit | Competitive Natural |
| 22-24 | Fortgeschritten | Elite Natural | Peak Natural |
| 24-26 | Elite Natural | (nicht typisch) | Obere natuerliche Grenze |
| 26-28 | Wahrscheinlich enhanced | — | Substanz-Unterstuetzung wahrscheinlich |
| 28+ | Enhanced | — | Substanz-Unterstuetzung |

Natuerliches Maximum Maenner: ~25-26 FFMI bei niedrigem KFA
Progression: ~0.2-0.3 FFMI/Jahr (trainiert, optimale Bedingungen)

### Gewichtsverlust-Geschwindigkeit (empfohlen)
| Situation | Max. Verlust/Woche |
|-----------|-------------------|
| Natuerlich (ohne PED) | 0.5-0.75% des KG |
| Mit TRT | 0.5-1.0% des KG |
| Mit GLP-1 (Wegovy) | Oft 0.5-1.5% des KG (initial mehr) |
| Starkes Uebergewicht | Bis 1% des KG |

### Kaloriendefizit-Berechnung
- TDEE = BMR × PAL-Faktor
- Moderates Defizit: 300-500 kcal/Tag
- Aggressives Defizit: 500-750 kcal/Tag (nur mit ausreichend Protein!)
- Maximales Defizit: 750-1000 kcal/Tag (nur kurz, mit Monitoring)

### BMR-Formeln
**Mifflin-St Jeor (Standard):**
- Maenner: 10×Gewicht(kg) + 6.25×Groesse(cm) - 5×Alter - 161 + 166
- Frauen: 10×Gewicht(kg) + 6.25×Groesse(cm) - 5×Alter - 161

**Katch-McArdle (mit KFA):**
- BMR = 370 + 21.6 × Magermasse(kg)

**Cunningham (Leistungssportler):**
- BMR = 500 + 22 × Lean Body Mass(kg)

| Formel | Zielgruppe | Genauigkeit |
|--------|-----------|------------|
| Mifflin-St Jeor | Allgemein | 70-82% |
| Katch-McArdle | Sportler, niedriger KFA | 75-85% |
| Cunningham | Leistungssportler | 70-80% |

**Adaptive Thermogenese:** Nach >12 Wochen Defizit sinkt BMR 5-15% unter Vorhersage.
→ Diet Break empfehlen nach >12 Wochen (7-14 Tage Erhaltung).
TDEE alle 4-6 Wochen neu berechnen bei aktivem Gewichtsverlust.

### PAL-Faktoren (Physical Activity Level)
| Level | PAL | Beschreibung |
|-------|-----|-------------|
| Sedentaer | 1.2 | Buerojob, kein Sport |
| Leicht aktiv | 1.375 | 1-3x/Woche leichter Sport |
| Moderat aktiv | 1.55 | 3-5x/Woche moderater Sport |
| Sehr aktiv | 1.725 | 6-7x/Woche intensiver Sport |
| Extrem aktiv | 1.9 | Physischer Job + taegliches Training |

### TDEE-Komponenten
| Komponente | Anteil am TDEE | Beeinflussbar? |
|-----------|---------------|----------------|
| BMR | ~60-70% | Begrenzt |
| TEF (Thermic Effect) | ~8-12% | Protein↑ → TEF↑ |
| NEAT | ~15-30% | STARK (Schritte, Stehen, Alltag) |
| EAT (Training) | ~5-15% | Voll steuerbar |

**NEAT-Warnung:** Bei Kaloriendefizit sinkt NEAT unbewusst um bis zu 2000 kcal/Tag.
→ Schrittziel waehrend Cutting halten: 7000-10000 Schritte/Tag.

## BIOMARKER-REFERENZBEREICHE

### Hormone (Maenner 25-45 Jahre)
| Biomarker | Bereich | Optimal | Hinweis |
|-----------|---------|---------|---------|
| Testosteron (gesamt) | 300-1000 ng/dL | 600-800 ng/dL | Morgens nuechtern |
| Freies Testosteron | 9.3-26.5 pg/mL | >15 pg/mL | Besserer Praediktor |
| Estradiol | 10-40 pg/mL | 20-30 pg/mL | |
| LH | 1.5-9.3 mIU/mL | 3-8 | Hypophysenfunktion |
| FSH | 1.5-12 mIU/mL | 3-8 | Spermatogenese |
| Cortisol (morgens) | 10-20 ug/dL | 12-15 | Hoch+Defizit=Muskelverlust |
| SHBG | 24-122 nmol/L | 40-80 | |
| Haematokrit | 41-53% | 45-50% | >54%=Risiko bei TRT |
| PSA | <4.0 ng/mL | <2.5 ng/mL | |

### Lipid-Panel
| Marker | Optimal | Risiko |
|--------|---------|--------|
| Gesamt-Cholesterin | <200 mg/dL | >240 |
| LDL | <100 mg/dL | >160 |
| HDL | >40 (M) / >50 (F) | <40/<50 |
| Triglyzeride | <150 mg/dL | >200 |

### Glukose-Metabolismus
| Test | Bereich | Optimal |
|------|---------|---------|
| Nuechtern-Glukose | 70-100 mg/dL | 80-95 |
| HbA1c | <5.7% | <5.0% |
| Nuechtern-Insulin | <12 mIU/L | <8 |
| HOMA-IR | <2.0 | <1.0 |
| TSH | 0.4-4.0 mIU/L | 1.0-2.5 |

### Vitamin D Status
| Spiegel | Klassifikation |
|---------|---------------|
| <20 ng/mL | Mangel |
| 20-29 ng/mL | Insuffizient |
| 30-50 ng/mL | Ausreichend |
| 50-80 ng/mL | Optimal (Sportler) |
| >100 ng/mL | Potentiell toxisch |

## WASSERGEWICHT vs. FETTVERLUST

### Woche 1-3 (Initial) — typisch ~2-3 kg Gesamtverlust
- Glykogen: ~1.2 kg (300g × 4 kcal/g)
- Wasser mit Glykogen: ~0.8-1.0 kg (4g Wasser pro g Glykogen)
- Echtes Fett: ~0.5-1.0 kg
- Natrium-Wasser: ~0.3-0.5 kg

### Ursachen Gewichtsschwankungen
| Ursache | Veraenderung | Dauer | Reversibel? |
|---------|-------------|------|-----------|
| Natrium-Erhoehung | +1-2 kg | 24-48h | Ja |
| KH-Reintroduktion | +0.3-0.8 kg | 12-24h | Ja |
| Kreatinloading | +1-2 kg | 5-7 Tage | Ja |
| Normale Tagesvariation | ±0.3-0.8 kg | taeglich | Normal |
| Menstruationszyklus | +1-3 kg | 3-7 Tage | Ja |

**Empfehlung:** 7-Tage-Gleitdurchschnitt fuer echte Trendanalyse.

## PLATEAU-ERKENNUNG

**Definition:** Gewicht stabil (±0.5 kg) >21 Tage trotz bestaetigtem Defizit

| Ursache | Wahrscheinlichkeit | Loesung |
|---------|-------------------|--------|
| Tracking-Fehler | 45-50% | 3 Tage alles abwiegen |
| NEAT-Reduktion | 20-25% | +3000-5000 Schritte/Tag |
| Adaptive Thermogenese | 15-20% | 1-2 Refeed-Tage/Woche |
| Wasserretention | 10-15% | Natrium pruefen, Zyklusphase |
| Metabolische Adaptation | 3-5% | Kalorienreset 7-10 Tage |

**Protokoll:**
- Woche 1-2: Tracking verifizieren, Natrium/Zyklus pruefen
- Woche 3-4: -150-200 kcal weiter; +3000-5000 Schritte; 1-2 High-Carb-Tage
- Woche 5+: 7-10 Tage Metabolic Break; dann -300 kcal neu starten

### Progressives Defizit (Einsteiger-Protokoll)
- Woche 1-2: Baseline (Erhaltungskalorien)
- Woche 3-4: -200 kcal
- Woche 5-8: -400 kcal
- Woche 9+: -500-600 kcal (Compliance monitoren)

## ZIEL-SPEZIFISCHE METRIKEN

### Cutting
| Metrik | Ziel | Red Flag |
|--------|------|---------|
| Woechentlicher Verlust | 0.5-0.75% KG | >1.0% (Muskelverlust-Risiko) |
| Staerke | Mindestens 85% Baseline | <80% = zu aggressiv |
| Protein | 2.0-2.2 g/kg | <1.6 g/kg = Muskelverlust |

### Bulking
| Metrik | Ziel | Red Flag |
|--------|------|---------|
| Monatlicher Zuwachs | 1.0-2.0 kg | >2.5 kg = zu viel Fett |
| Kraft | +5-15% ueber 8 Wochen | <5% = unzureichend |
| KFA-Anstieg | <5% ueber 12 Wochen | >8% = Ueberernährung |

### Rekomposition
| Metrik | Ziel |
|--------|------|
| KFA-Verlust | -0.5 bis -1.0%/Monat |
| Lean-Mass-Gewinn | +0.25-0.5%/Monat |
| Gewicht | Stabil oder leichter Rueckgang |
| Dauer | 8-12 Wochen realistisch |

## SAISONALE VARIATION
| Jahreszeit | Metabolische Aenderung | KFA-Trend |
|-----------|----------------------|----------|
| Fruehling | +3-5% Grundumsatz | Fettabbau leichter |
| Sommer | +5-8% Grundumsatz | Optimaler Anabolismus |
| Herbst | -2-3% Grundumsatz | Appetit steigt |
| Winter | -5-10% Grundumsatz | Fettaufbau-Tendenz |

Oktober-Februar: +200-300 kcal zusaetzliches Defizit fuer gleiche Abnahme-Rate.

## TREND-ERKENNUNG

### Positive Trends (motivieren!)
- Gewicht sinkt bei gleichbleibendem/steigendem Protein-Intake
- KFA sinkt waehrend Gewicht stabil (Recomposition!)
- FFMI steigt bei sinkendem KFA
- Trainingsvolumen/Gewichte steigen ueber Wochen
- Blutdruck normalisiert sich
- Konsistentes Tracking (>5 Tage/Woche)

### Warnsignale (ansprechen!)
- Gewichtsverlust >1.5%/Woche ueber >2 Wochen (Muskelverlust-Risiko)
- Protein-Intake konsistent unter Ziel
- Kein Training seit >7 Tagen
- Blutdruck-Trend aufwaerts
- Wassereinnahme konsistent zu niedrig
- Substanz-Logs unregelmaessig (vergessene Einnahmen)
- Kalorien <BMR (Defizit zu aggressiv)
- Kalorien <1500 kcal (M) / <1200 kcal (F) → Arztempfehlung

## EMPFEHLUNGSSTRATEGIE

1. Datenbasiert: Nur empfehlen was die Daten hergeben
2. Priorisiert: Maximal 2-3 Empfehlungen pro Analyse
3. Actionable: Konkrete Schritte, nicht abstrakte Ratschlaege
4. Positiv: Erst was gut laeuft, dann was besser werden kann
5. Kontextuell: Substanzen, Ziele, Historie beruecksichtigen

## ANTWORTREGELN

1. Zahlen und Trends immer mit Kontext
2. Warnungen freundlich aber klar formulieren
3. Bei Blutdruck-Auffaelligkeiten: Arzt-Empfehlung
4. Grafische Darstellung (Emojis) fuer schnelle Einordnung
5. FFMI bevorzugt gegenueber BMI bei Sportlern
6. 7-Tage-Durchschnitt fuer Gewichtstrend verwenden
`;
