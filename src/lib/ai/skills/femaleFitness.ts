/**
 * Static female fitness knowledge skill.
 * Contains evidence-based knowledge about female-specific physiology,
 * menstrual cycle training, pregnancy, menopause, and Female Athlete Triad.
 *
 * Condensed from: fitbuddy_skill_female_fitness_comprehensive_v1_0_0.md
 *
 * @version 1.0.0
 */

import type { SkillMeta } from './types';

export const FEMALE_FITNESS_SKILL_META: SkillMeta = {
  id: 'femaleFitness',
  name: 'Weibliche Fitness & Physiologie',
  version: '1.0.0',
  updatedAt: '2026-02-26',
  sources: [
    'McNulty et al. 2020, Sports Med, PMID:32661839 — Menstrual Cycle & Exercise Performance',
    'ACOG Committee Opinion No. 804, 2020 — Physical Activity During Pregnancy',
    'Mountjoy et al. 2018, Br J Sports Med, PMID:29773536 — IOC Consensus on RED-S',
    'Nattiv et al. 2007, Med Sci Sports Exerc, PMID:17909417 — Female Athlete Triad Position Stand',
    'Beynnon et al. 2006, J Athl Train, PMID:16620079 — ACL Injury Risk & Menstrual Cycle',
    'Mottola et al. 2018, Br J Sports Med — Postpartum Return-to-Exercise Guidelines',
    'Peeling et al. 2008, Med Sci Sports Exerc — Iron Status in Female Athletes',
  ],
  tokenEstimate: 2200,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-02-26',
      changes: 'Initial: Menstrualzyklus, Training nach Phase, Schwangerschaft, Menopause, Female Athlete Triad, Virilisierung, Beckenboden',
    },
  ],
};

export const FEMALE_FITNESS_SKILL = `
## WEIBLICHE FITNESS — FACHWISSEN

### VIRILISIERUNGS-WARNUNG ⚠️
AAS bei Frauen fuehren zu TEILWEISE oder VOLLSTAENDIG IRREVERSIBLEN Veraenderungen:
- **Irreversibel**: Stimmvertiefung, Klitorisvergroesserung, maennlicher Haarwuchs, Stirnglatze
- **Reversibel**: Wasserretention, Akne, Menstruationsaenderungen
Die App gibt KEINE AAS-Dosierungsempfehlungen fuer Frauen — nur Risikoaufklaerung.

### Hormonprofil Frauen
| Hormon | Follikelphase | Ovulation | Lutealphase | Funktion |
|--------|--------------|-----------|-------------|----------|
| Oestrogen | ↑ steigend | Peak | ↑↓ biphasisch | Knochen, Kollagen, KV-Schutz |
| Progesteron | Niedrig (<1.5 ng/mL) | — | Hoch (2-25 ng/mL) | Thermogenese, RMR ↑ |
| Testosteron | 15-70 ng/dL | Peak | Mittel | MPS, Kraft, Motivation |
| FSH | ↑ frueh | ↓ | Niedrig | Follikelreifung |
| LH | Niedrig | Surge (17-77) | Niedrig | Ovulation ausloesen |

### Koerperkomposition Frauen vs. Maenner
| Parameter | Frau (Durchschnitt) | Mann (Durchschnitt) |
|-----------|-------------------|-------------------|
| Essentielles Koerperfett | 10-13% | 2-5% |
| Fit-Bereich KFA | 18-24% | 10-17% |
| Athletisch KFA | 15-20% | 8-15% |
| Muskelmasse-Anteil | 30-35% | 40-45% |

### Menstrualzyklus & Training
#### Follikelphase (Tag 1-14)
- Oestrogen steigt → verbesserte Erholung, hoehere Schmerztoleranz
- **Empfehlung**: Intensivste Trainingsphase, Kraft-PRs moeglich
- Hohe Kohlenhydrat-Toleranz
- HIIT und Maximalkraft gut vertragen

#### Ovulation (Tag ~14)
- Peak Oestrogen + Testosteron → hoechste Leistungsfaehigkeit
- ABER: Erhoehtes Verletzungsrisiko (Baender laxer durch Relaxin)
- Cave: ACL-Verletzungen haeufiger perimenstruell
- Plyometrik/explosive Bewegungen mit Vorsicht

#### Lutealphase (Tag 15-28)
- Progesteron dominant → RMR +100-300 kcal/Tag
- Koerpertemperatur erhoht → Ausdauerleistung kann sinken
- **Empfehlung**: Moderates Training, Volumen erhalten, Intensitaet ggf. senken
- Mehr Fett-Oxidation → ketogene Ansaetze funktionieren besser
- PMS-Symptome: Training hilft! Aber Intensitaet anpassen
- Kalorienaufnahme: +100-300 kcal/Tag erlaubt (nicht hungern!)

#### Menstruation (Tag 1-5)
- Hormone am niedrigsten → Energielevel individuell
- Training ist NICHT schaedlich (Mythos!)
- Bei starken Krämpfen: leichtes Training, Yoga, Walking
- Eisen-Verlust: +1-2mg/Tag erhoehter Bedarf

### Female Athlete Triad / RED-S
Drei zusammenhaengende Probleme:
1. **Niedrige Energieverfuegbarkeit** (<30 kcal/kg FFM/Tag)
2. **Menstruationsstoerung** (Oligomenorrhoe/Amenorrhoe)
3. **Knochengesundheitsstoerung** (Osteopenie/Osteoporose)

**RED-S Screening Fragen:**
- Periode ausgeblieben fuer ≥3 Monate?
- Stressfrakturen in der Vorgeschichte?
- Kalorienaufnahme bewusst stark eingeschraenkt?
- BMI <18.5 oder rapider Gewichtsverlust?

**Red Flags → SOFORT Arzt:**
- Amenorrhoe >3 Monate
- Stressfraktur
- BMI <17 oder rapider Gewichtsverlust >1kg/Woche
- Anzeichen einer Essstoerung
- Synkope/Ohnmacht beim Training

### Schwangerschaft & Training (ACOG Guidelines)
#### Erlaubt:
- 150 Min/Woche moderates Ausdauertraining
- Krafttraining mit moderaten Gewichten
- Schwimmen, Walking, stationaeres Radfahren, praenatales Yoga
- Beckenbodentraining (SEHR empfohlen)

#### Verboten:
- Kontaktsportarten, Sturzrisiko-Sportarten
- Rueckenlage-Training ab 2. Trimester (Vena-Cava-Kompression)
- Maximalkraft-Versuche
- Tauchen, Hoehensport >2500m
- Ueberhitzung (>38.5°C Kerntemperatur)

#### Abbruchzeichen (sofort aufhoeren):
- Vaginale Blutung, Schwindel, Kopfschmerzen, Brustschmerz
- Wehen vor Termin, Fruchtwasserabgang
- Atemnot VOR Belastung

### Postpartum Return-to-Exercise
| Phase | Zeitraum | Erlaubt |
|-------|----------|---------|
| Frühes Wochenbett | 0-6 Wochen | Beckenboden, Spaziergänge, Atmung |
| Post-Clearance | 6-12 Wochen | Leichtes Kraft, Cardio (nach ärztl. OK) |
| Progressive Phase | 12-24 Wochen | Normales Training aufbauen |
| Vollstaendig | >24 Wochen | Alle Aktivitaeten |

**Diastasis Recti**: Rektusdiastase pruefen lassen (>2 Finger breit = physio-Bedarf)

### Perimenopause & Menopause (ab ~45-55 Jahre)
- Oestrogen sinkt → viszerales Fett ↑, Muskelmasse ↓, Knochenabbau ↑
- Krafttraining wird NOCH wichtiger (Osteoporose-Praevention)
- Protein: 1.6-2.0 g/kg/Tag (hoeher als praeenopause)
- Vitamin D + Calcium: ESSENTIELL
- Schlafqualitaet oft schlechter → Schlafhygiene priorisieren
- HRT (Hormonersatztherapie): Mit Gynaekologin besprechen

### Eisen-Management fuer Sportlerinnen
- Ferritin-Ziel: >30 ng/mL (fuer Sportlerinnen ideal: >50 ng/mL)
- Menstruation: +1-2mg/Tag Eisen-Verlust
- Symptome bei Mangel: Muedigkeit, Kurzatmigkeit, Haarausfall, Kaelte
- NICHT blind supplementieren → Ferritin messen lassen!
- Eisen-Absorption: Mit Vitamin C, ohne Kaffee/Tee (2h Abstand)

### Beckenboden
- Krafttraining kann Beckenboden STAERKEN (wenn korrekt ausgefuehrt)
- Valsalva-Manoever bei schweren Gewichten: Druck auf Beckenboden
- Symptome schwacher Beckenboden: Inkontinenz beim Laufen/Husten/Heben
- Kegel-Uebungen: 3x taeglich, 10 Wiederholungen, 5-10 Sek halten
- Bei Beschwerden: Physiotherapie (Beckenboden-Spezialistin)

### ANTWORTREGELN
1. Menstrualzyklus-Phase IMMER beruecksichtigen wenn bekannt
2. Keine Schoenheitsideale → Gesundheit und Leistung betonen
3. Female Athlete Triad aktiv screenen bei niedrigem KFA/Amenorrhoe
4. AAS bei Frauen: NUR Risikoaufklaerung, KEINE Empfehlungen
5. Schwangerschaft: ACOG-konform, Safety first
6. Eisen: Nie blind empfehlen → Laborbefund
7. Beckenboden: Proaktiv ansprechen bei Kraftsportlerinnen
`;
