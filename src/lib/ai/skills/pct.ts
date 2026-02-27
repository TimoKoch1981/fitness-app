/**
 * Static PCT & hormone recovery knowledge skill.
 * Contains evidence-based knowledge about HPG axis recovery,
 * post-cycle monitoring, fertility implications, and psychological aspects.
 *
 * SAFETY: NO dosing protocols. Education & monitoring ONLY.
 *
 * Condensed from: fitbuddy_skill_pct_hormone_recovery_comprehensive_v1_0_0.md
 *
 * @version 1.0.0
 */

import type { SkillMeta } from './types';

export const PCT_SKILL_META: SkillMeta = {
  id: 'pct',
  name: 'PCT & Hormon-Recovery',
  version: '1.0.0',
  updatedAt: '2026-02-26',
  sources: [
    'Rahnema et al. 2014, Fertil Steril, PMID:24636400 — AAS & Male Fertility',
    'Endocrine Society (Bhasin et al.) 2018, JCEM, PMID:29562364 — Testosterone Therapy Guidelines',
    'Pope et al. 2014, Am J Addict, PMID:24112239 — AAS Dependence',
    'Kanayama et al. 2015, Addiction, PMID:25598171 — Prolonged hypogonadism after AAS',
    'Kanayama et al. 2010, Drug Alcohol Depend — Suicide risk in AAS withdrawal',
  ],
  tokenEstimate: 2000,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-02-26',
      changes: 'Initial: HPG-Achse, ASIH, Recovery-Timelines, Fertilitaet, Labormonitoring, Psychologie, Red Flags',
    },
  ],
};

export const PCT_SKILL = `
## PCT & HORMON-RECOVERY — FACHWISSEN

### SAFETY-GATE ⚠️
Dieses Skill liefert EDUCATION & MONITORING. Es gibt KEINE:
- Konkreten PCT-Protokolle oder Dosierungen
- HCG/SERM/AI-Dosierungsanleitungen
- Zyklus-Planungen oder Aufdosierungsrichtlinien
Bei Fragen nach Protokollen: Risiken erklaeren + Arzt empfehlen.

### HPG-Achse (Hypothalamus → Hypophyse → Gonaden)
| Struktur | Hormon | Funktion |
|----------|--------|----------|
| Hypothalamus | GnRH | Pulsatile Sekretion (q 60-120 Min) → Hypophyse |
| Hypophyse | LH | Stimuliert Leydig-Zellen → Testosteron |
| Hypophyse | FSH | Stimuliert Sertoli-Zellen → Spermatogenese |
| Testes | Testosteron | Anabole/androgene Wirkung |
| Testes | Inhibin B | Selektive FSH-Suppression |

### AAS-induzierte Suppression (ASIH)
- ALLE AAS unterdruecken HPG-Achse (dosisabhaengig)
- LH/FSH kollabieren auf <0.5 mIU/mL (oft undetektierbar)
- Endogenes Testosteron: <50 ng/dL, oft <20 ng/dL
- Hodenvolumen: ↓ 20-50%
- Spermatogenese: ↓↓ bis Azoospermie
- Bereits nach 1 Zyklus (8-12 Wochen) signifikante Suppression

### Recovery-Timelines (evidenzbasiert)
| Parameter | Spontane Erholung | Mit PCT-Massnahmen |
|-----------|------------------|-------------------|
| LH/FSH | 1-6 Monate | 2-8 Wochen |
| Testosteron | 3-12 Monate | 1-4 Monate |
| Spermatogenese | 6-24 Monate | ~12 Monate (87.5% Normozoospermie) |
| Hodenvolumen | 3-12 Monate | Individuell |
| Fertilitaet (komplett) | 6-24 Monate | Variabel |

**WICHTIG**: Ca. 10-20% der Langzeitanwender (>2 Jahre, hohe Dosen) erholen sich NIE vollstaendig → lebenslange TRT.

### PCT-Substanzklassen (NUR Mechanismen)
| Klasse | Wirkstoffbeispiele | Mechanismus |
|--------|-------------------|------------|
| SERM | Tamoxifen, Clomifen | Blockiert Oestrogen-Rezeptoren im Hypothalamus → LH/FSH ↑ |
| HCG | Choriongonadotropin | LH-Mimikry → Leydig-Zell-Stimulation → T ↑ |
| AI | Anastrozol, Letrozol | Aromatase-Hemmung → E2 ↓ → weniger neg. Feedback |

- PCT ist wissenschaftlich NICHT vollstaendig validiert (keine RCTs mit Bodybuilding-Dosen)
- Rahnema 2014: Kombinationstherapie beschleunigt Recovery vs. spontan
- Kein Beleg dass "Ausschleichen" von AAS die Achse schont

### Estradiol-Symptomatik (wichtig fuer Monitoring)
| Symptom | Zu hoch (E2 ↑) | Zu niedrig (E2 ↓) |
|---------|----------------|-------------------|
| Stimmung | Emotional, weinerlich | Flat, antriebslos |
| Libido | Variabel | Stark reduziert |
| Koerper | Wasserretention, Gyno-Empfindlichkeit | Trockene Gelenke, Knacken |
| Haut | Akne (manchmal) | Trockene Haut |
| Schlaf | Gestoert | Gestoert |

### Labor-Monitoring Post-Cycle
| Parameter | Wann testen | Zielbereich |
|-----------|-------------|-------------|
| LH, FSH | 4 Wo nach letzter AAS-Dosis | LH >2 mIU/mL (Recovery-Zeichen) |
| Testosteron (gesamt) | 6-8 Wo nach letzter Dosis | >300 ng/dL (Recovery) |
| Estradiol | Bei Symptomen | 20-40 pg/mL |
| Spermiogramm | 6+ Monate nach Absetzen | >15 Mio/mL (WHO-Norm) |
| Haematokrit | Alle 3 Monate | <52% |
| Lipide | 3-6 Monate nach Absetzen | LDL <130, HDL >40 |
| Leberwerte | Bei oralen AAS: 4-8 Wo | GOT/GPT <40 U/L |

### Fertilitaet — Reale Zahlen
- ~90% der Maenner erholen Spermatogenese innerhalb 24 Monate
- Rahnema 2014: 87.5% Normozoospermie mit Intervention vs. 58.6% spontan
- Risikofaktoren fuer Non-Recovery: >2 Jahre AAS, Nandrolon (sehr suppressiv), Alter >40
- HCG waehrend Zyklus: Kann Hodenfunktion teilweise erhalten
- Bei Kinderwunsch: MINDESTENS 6-12 Monate vor geplantem Zeitpunkt absetzen

### Psychologische Aspekte
- **AAS-Withdrawal**: Depressivitaet, Anhedonie, Libidoverlust, Muedigkeit
- **Koerperdysmorphie**: Muskelverlust → Angst → Rueckfall-Risiko
- **AAS-Abhaengigkeit**: ~30% der Langzeitanwender (Pope et al. 2014)
- **Suizidalitaet**: Erhoehtes Risiko in Post-Cycle-Phase → ERNST NEHMEN
- Empfehlung: Psychologische Unterstuetzung bei schweren Symptomen

### Red Flags → SOFORT Arzt
- Persistierender Hypogonadismus >12 Monate nach Absetzen
- Depression mit Suizidgedanken
- Azoospermie bei Kinderwunsch
- Gynaemastie (progressive Vergroesserung)
- Haematokrit >54%
- Leberwerte >3x Normbereich
`;
