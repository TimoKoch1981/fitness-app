/**
 * Static nutrition science skill — evidence-based knowledge from
 * current research on nutrition, fasting, obesity, and physical activity.
 *
 * Sources: Spiegel-Artikel (01-02/2025) + PubMed-Recherche der zitierten Forscher.
 * All claims verified against primary literature (33 PMIDs).
 *
 * @version 1.0.0
 * @see docs/WISSENSCHAFTLICHE_GRUNDLAGEN.md
 */

import type { SkillMeta } from './types';

export const NUTRITION_SCIENCE_SKILL_META: SkillMeta = {
  id: 'nutritionScience',
  name: 'Ernaehrungswissenschaft — aktuelle Forschung',
  version: '1.0.0',
  updatedAt: '2026-02-28',
  sources: [
    // Ernaehrung & Fasten
    'Michalsen A et al. 2013, Forsch Komplementmed, PMID:24434759 — Fasting therapy review',
    'Michalsen A et al. 2024, Review Nutrition & Fasting, PMID:39271484',
    'Michalsen A et al. 2019, PLoS ONE, PMID:30601864 — Fasting safety n=1422',
    'Longo V & Anderson RM 2022, Cell, PMID:35487190 — Nutrition, longevity and disease',
    'Anderson RM et al. 2017, Cell Metab, PMID:29240911 — Caloric restriction new perspectives',
    'Anderson RM et al. 2009, Exp Gerontol, PMID:19075044 — CR mice and monkeys',
    'Hall KD et al. 2019, Cell Metab, PMID:31105044 — Ultra-processed food RCT',
    'Fadnes LT et al. 2022, PLoS Med, PMID:35134804 — Food choices and life expectancy',
    // Adipositas-Neudefinition
    'Rubino F et al. 2025, Lancet Diabetes Endocrinol, PMID:39800537 — Lancet Commission clinical obesity',
    'Blueher M 2020, Endocr Rev, PMID:31564442 — Metabolically healthy obesity review',
    'Schulze MB et al. 2019, Diabetologia, PMID:30569272 — Metabolic health in obesity',
    'Schulze MB et al. 2026, Nat Commun, PMID:41091468 — New obesity definition validation',
    // Schritte & Bewegung
    'Stamatakis E et al. 2022, Nature Med, PMID:36482104 — VILPA and mortality',
    'Stamatakis E et al. 2022, JAMA Intern Med, PMID:36094529 — Steps, cancer, CVD, mortality',
    'Stamatakis E et al. 2023, JAMA Oncol, PMID:37498576 — VILPA + cancer UK Biobank',
    'Stamatakis E et al. 2021, Br J Sports Med, PMID:33108651 — VILPA framework',
    'Ekelund U et al. 2019, BMJ, PMID:31221684 — PA dose-response all-cause mortality meta-analysis',
    'Ekelund U et al. 2016, Lancet, PMID:27174305 — PA offsets sitting risk 1M+ adults',
    'Arem H et al. 2015, JAMA Intern Med, PMID:26014514 — Leisure PA + mortality 661k adults',
    'Ding M et al. 2025, Lancet Public Health — Daily steps dose-response meta-analysis (57 Studien)',
  ],
  tokenEstimate: 3800,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-02-28',
      changes: 'Initial: Ernaehrung & Langlebigkeit (Michalsen, Longo), Fasten (16:8, Longevity-Diaet), Adipositas-Neudefinition (Lancet Commission 2025, BMI-Kritik), Schritte & Bewegung (VILPA, 10.000-Schritte-Mythos, Dosis-Wirkungs-Kurve), 33 PMIDs, 9 Forscher',
    },
  ],
};

export const NUTRITION_SCIENCE_SKILL = `
## Aktuelle Ernaehrungswissenschaft — Evidenzbasiertes Wissen

### Referenz-Forscher (zitiere bei Nachfrage)
| Forscher | Institution | Schwerpunkt |
|----------|-------------|-------------|
| Prof. Andreas Michalsen | Charite Berlin, Immanuel KH | Fasten, Naturheilkunde |
| Prof. Valter Longo | USC Los Angeles | Longevity, Ernaehrung & Altern |
| Prof. Rozalyn Anderson | Univ. Wisconsin-Madison | Kalorienrestriktion |
| Prof. Matthias Blueher | Uniklinikum Leipzig | Adipositas, metabol. Gesundheit |
| Prof. Francesco Rubino | King's College London | Lancet Adipositas-Kommission |
| Prof. Matthias Schulze | DIfE Potsdam | Molekulare Epidemiologie |
| Prof. Emmanuel Stamatakis | Univ. Sydney | VILPA, Bewegung & Gesundheit |
| Prof. Ulf Ekelund | Norw. Sporthochschule Oslo | Bewegungsdosis & Mortalitaet |
| Prof. Melody Ding | Univ. Sydney | Schritte-Metaanalyse |

---

### A) Ernaehrung & Langlebigkeit

1. **Pflanzenbetonte Ernaehrung verlaengert das Leben**
   - Ernaehrung beeinflusst alle 12 Hallmarks of Aging (chron. Entzuendung, gestoerte Autophagie etc.)
   - Naehrstoff-Sensoren in Zellen entscheiden ueber Reparatur- vs. Wachstumsprogramme
   - Quelle: Longo & Anderson 2022, Cell (PMID:35487190)

2. **Lebensmittel und Lebenserwartung** (Fadnes et al. 2022, PMID:35134804)
   - Huelsenfruechte (Bohnen, Linsen): +2,4 Jahre
   - Vollkorn: +2,2 Jahre
   - Positiv: Pilze, Nuesse, Joghurt, Olivenoel, Brokkoli, Zwiebeln, Gewuerze
   - Negativ: Fleisch, Wurst, Zuckergetraenke, Weissmehl
   - Evidenzlevel: HOCH (grosse prospektive Kohortenstudie)

3. **Ultra-verarbeitete Lebensmittel fuehren zu Ueberkonsum** (Hall et al. 2019, PMID:31105044)
   - RCT (NIH): Ultra-verarbeitete Gruppe ass 500+ kcal/Tag MEHR
   - Identische Makro-Zusammensetzung beider Gruppen
   - Ultra-verarbeitete Gruppe nahm Gewicht und Fettmasse zu
   - Evidenzlevel: SEHR HOCH (randomisiert-kontrolliert, Goldstandard)

4. **Viszeralfett treibt chronische Entzuendung**
   - Abdominales Fett ist pro-inflammatorisch
   - Weniger Viszeralfett = weniger Entzuendungsmarker im Blut
   - Beschleunigt mehrere Hallmarks of Aging

---

### B) Fasten & Intervallfasten

5. **Intervallfasten aktiviert Zellreparatur**
   - Fasten aktiviert Autophagie (Zell-Selbstreinigung)
   - Stimuliert Neubildung von Immunzellen und Stammzellen
   - Quelle: Michalsen 2013 Review (PMID:24434759), Michalsen 2024 (PMID:39271484)

6. **16:8-Methode — am besten untersucht**
   - Alle Mahlzeiten innerhalb 8h-Fenster (z.B. 10:00-18:00)
   - Einstieg: Nichts nach 19:00, Wiederaufnahme ab 09:00
   - Typisch: ~10% Kalorienreduktion, 3-5 kg Gewichtsverlust/Jahr
   - Michalsen 2018 Pilotstudie (PMID:29031771), Sicherheit n=1422 (PMID:30601864)

7. **Longo Longevity-Diaet** (Longo & Anderson 2022, Cell, PMID:35487190)
   - Viel: Huelsenfruechte, Vollkorn, Gemuese
   - Etwas Fisch; kein rotes/verarbeitetes Fleisch, wenig weisses
   - Wenig Zucker und raffiniertes Getreide
   - Reichlich Nuesse, Olivenoel, etwas Zartbitterschokolade
   - Optimal: 11-12h Essensfenster/Tag + mehrere Fastenperioden/Jahr

---

### C) Adipositas — Neue Definition (Lancet Commission 2025)

8. **BMI allein reicht nicht** (Rubino et al. 2025, PMID:39800537)
   - BMI pathologisiert gesunde Menschen (z.B. muskuloese Sportler)
   - BMI uebersieht Personen mit hohem Viszeralfett aber Normalgewicht ("TOFI")
   - 56-koepfige Lancet-Kommission empfiehlt: BMI + Koerperfettanteil oder Taille-Hueft-Verhaeltnis
   - Evidenzlevel: SEHR HOCH (internationaler Expertenkonsens)

9. **Zwei neue Adipositas-Kategorien**
   - **Klinische Adipositas:** Chronische Krankheit mit messbarem Organschaden (>=1 von 18 Kriterien)
   - **Praeklinische Adipositas:** Ueberschuessige Fettmasse OHNE signifikanten Organschaden
   - Praeklinisch = Risikomanagement/Praevention, nicht Therapie

10. **Metabolisch gesunde Adipositas** (Blueher 2020, PMID:31564442)
    - 10-15% der Adipositas-Patienten haben keine Begleiterkrankung
    - Erklaerung: Fettspeicherung an weniger schaedlichen Stellen (Hueften, Beine)
    - ~50% haben Bluthochdruck, ~30% Typ-2-Diabetes

11. **Schulze-Validierungsstudie** (2026, Nat Commun, PMID:41091468)
    - 100% der Personen mit BMI >= 30 waren auch nach zusaetzlichen Kriterien adipoes
    - ~80% erfuellten Kriterien fuer KLINISCHE Adipositas
    - Klinische Adipositas: 3x hoeheres CVD-Risiko, 8x hoeheres T2D-Risiko
    - Praeklinische Adipositas: KEIN erhoehtes CVD-Risiko, aber T2D-Risiko bleibt erhoeht

---

### D) Schritte & Koerperliche Aktivitaet

12. **10.000 Schritte = Marketing, keine Wissenschaft**
    - Ursprung: Japanischer Schrittzaehler "Manpo-kei" (1964, Olympia Tokio)
    - Runde, einpraegsame Zahl — NULL wissenschaftliche Basis
    - Stamatakis 2023 Editorial (PMID:37549996)

13. **Nutzen-Kurve ist nichtlinear** (Ekelund et al. 2019, BMJ, PMID:31221684)
    - Groesster Effekt: Von Inaktivitaet zu IRGENDWELCHER Aktivitaet
    - Nutzen flacht deutlich ab bei 7.000-8.000 Schritten/Tag
    - Steiler Anstieg, dann zunehmend flache Kurve

14. **Ding-Metaanalyse 2025** (Lancet Public Health, 57 Studien, Metaanalyse von 31)
    - 7.000 Schritte/Tag: ~47% geringere Mortalitaet
    - 25% weniger Krebs, 25% weniger CVD
    - 14% weniger T2D, 22% weniger Depression, 38% weniger Demenz
    - Nutzen beginnt ab 2.000 Schritten

15. **150 min/Woche moderate Aktivitaet = ~30% geringere Mortalitaet**
    - Bis 300 min/Woche: zusaetzlicher Nutzen beobachtbar
    - >300 min/Woche: Fast-Plateau, nur moderater Zusatzeffekt
    - Arem et al. 2015 (PMID:26014514), Ekelund et al. 2016 (PMID:27174305)

16. **Intensitaet zaehlt so viel wie Dauer**
    - 1 Minute intensive Aktivitaet ≈ bis zu 9-10 Minuten moderate Aktivitaet (fuer CVD/T2D)
    - 1000 schnelle Schritte >> 1000 langsame Haushalt-Schritte
    - Quelle: UK-Biobank Accelerometer-Studien

17. **VILPA — Vigorous Intermittent Lifestyle Physical Activity**
    - Kurze intensive Alltagsbewegungen (Bus nachlaufen, Treppen schnell steigen)
    - 3-4 Minuten VILPA/Tag = ~40% geringeres Krebsrisiko (Stamatakis 2023, PMID:37498576)
    - Signifikante Mortalitaetsreduktion auch bei Nicht-Sportlern (PMID:36482104)
    - Evidenzlevel: HOCH (grosse Kohortenstudien, UK Biobank)

18. **Kurze Aktivitaets-Bouts zaehlen**
    - Alte Richtlinie (>=10 Min am Stueck) wurde gestrichen
    - Treppensteigens, flotter Gang zur Bahn — alles zaehlt
    - Aktivitaet summiert sich ueber den Tag

19. **Sweetspot ist relativ zur Basislinie**
    - Sehr inaktive Personen (2.500-3.000 Schritte): Sweetspot bei ~3.500-4.000
    - Bereits aktive Personen: Sweetspot verschiebt sich nach oben
    - Europa/USA Durchschnitt: nur 6.000-7.000 Schritte/Tag
    - UK: <5 min/Tag intensive Aktivitaet; USA: <2 min/Tag

### Praxis-Empfehlungen fuer Nutzer-Beratung

- **Ernaehrung:** Mehr Huelsenfruechte, Vollkorn, Gemuese; weniger verarbeitete Lebensmittel
- **Fasten:** 16:8 als Einstieg empfehlen; kein Dogma, User-Praeferenz respektieren
- **BMI:** Immer im Kontext interpretieren — KFA/Taille-Hueft-Verhaeltnis einbeziehen
- **Schritte:** Nicht auf 10.000 fixieren — jede Steigerung zaehlt, besonders von 0 auf "etwas"
- **Intensitaet:** VILPA-Konzept vorstellen — kurze intensive Alltagsbewegungen empfehlen
- **Adipositas:** Urteilsfrei beraten; genetische Komponente anerkennen; auf klinisch vs. praeklinisch hinweisen
`;
