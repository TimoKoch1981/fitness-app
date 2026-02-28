/**
 * Glossary Skill — Umfassendes Fachwoerterbuch fuer Training, Ernaehrung,
 * Bodybuilding, Supplements, PEDs, Medizin und Koerperzusammensetzung.
 *
 * 400+ Begriffe aus allen 15 bestehenden Skills extrahiert und kategorisiert.
 * Dient als Referenz fuer den KI-Buddy, um Fachbegriffe praeziese zu erklaeren.
 *
 * @version 1.0.0
 * @date 2026-02-28
 */

import type { SkillMeta } from './types';

// ── Metadata ──────────────────────────────────────────────────────────────

export const GLOSSARY_SKILL_META: SkillMeta = {
  id: 'glossary',
  name: 'Glossar — Fachwoerterbuch Fitness & Gesundheit',
  version: '1.0.0',
  updatedAt: '2026-02-28',
  sources: [
    'Aggregiert aus 15 FitBuddy-Skills (nutrition, training, substances, anabolics, medical, sleep, supplements, pct, competition, femaleFitness, beauty, attractiveness, analysis, nutritionScience, anabolics_powerplus)',
    'NSCA Essentials of Strength Training and Conditioning (4th Ed., 2016)',
    'ISSN Position Stands (2017-2024)',
    'Lehrbuch Sportmedizin (Dickhuth et al., 2010)',
    'Klinische Chemie und Haematologie (Thomas, 2012)',
  ],
  tokenEstimate: 4500,
  changelog: [
    {
      version: '1.0.0',
      date: '2026-02-28',
      changes: 'Initial: 400+ Begriffe in 12 Kategorien, extrahiert aus allen 15 Skills',
    },
  ],
};

// ── Content ───────────────────────────────────────────────────────────────

export const GLOSSARY_SKILL = `
## GLOSSAR — FACHWOERTERBUCH FITNESS & GESUNDHEIT

Referenz fuer alle Fachbegriffe in FitBuddy. Wenn der Nutzer einen Begriff nicht kennt,
erklaere ihn verstaendlich mit dem hier hinterlegten Fachwissen.

---

### 1. TRAINING — Grundlagen & Methoden

| Begriff | Erklaerung |
|---------|-----------|
| **1RM (One Rep Max)** | Maximales Gewicht fuer genau eine Wiederholung. Basis fuer Intensitaetssteuerung. |
| **RPE (Rate of Perceived Exertion)** | Subjektive Belastungsskala 1-10 (Borg CR-10). RPE 8 = 2 Wiederholungen in Reserve. |
| **RIR (Reps in Reserve)** | Wiederholungen die noch moeglich waeren. RIR 2 = RPE 8. |
| **Volumen** | Gesamtarbeit: Saetze x Wiederholungen x Gewicht (Tonnage) oder nur Saetze pro Muskelgruppe/Woche. |
| **Intensitaet** | Prozent des 1RM (%1RM) oder RPE/RIR. Nicht mit "Anstrengung" verwechseln. |
| **Frequenz** | Wie oft ein Muskel pro Woche trainiert wird. 2-3x/Woche optimal laut Metaanalysen. |
| **Progressive Overload** | Systematische Steigerung von Volumen, Intensitaet oder Dichte ueber Zeit. Grundprinzip der Adaptation. |
| **Periodisierung** | Langfristige Trainingsplanung in Zyklen (Mikro/Meso/Makro) zur Optimierung von Adaptation und Erholung. |
| **Mikrozyklus** | Kuerzeste Planungseinheit, meist 1 Woche. |
| **Mesozyklus** | 3-6 Wochen, ein zusammenhaengender Trainingsblock mit spezifischem Ziel. |
| **Makrozyklus** | Langfristplan ueber mehrere Monate bis 1 Jahr. |
| **Deload** | Geplante Reduzierung (40-60% Volumen) fuer 1 Woche zur Erholung und Supercompensation. |
| **Supercompensation** | Koerper erholt sich ueber das Ausgangsniveau hinaus = Leistungszuwachs. |
| **Hypertrophie** | Muskelwachstum durch Zunahme der Muskelfaserquerschnittsflaeche. |
| **Sarkoplasmatische Hypertrophie** | Zunahme des Zellplasmas (Glykogen, Wasser) — volumetrischer Effekt. |
| **Myofibrillaere Hypertrophie** | Zunahme der kontraktilen Proteine (Aktin, Myosin) — Kraftzuwachs. |
| **Mechanische Spannung** | Haupttreiber fuer Hypertrophie: Last x Zeit unter Spannung auf dem Muskel. |
| **Metabolischer Stress** | Ansammlung von Metaboliten (Laktat, H+, Pi) — sekundaerer Hypertrophie-Stimulus. |
| **Muskelversagen** | Punkt, an dem keine weitere konzentrische Wiederholung moeglich ist (=RPE 10, RIR 0). |
| **Effektive Wiederholungen** | Die letzten ~5 Wiederholungen vor dem Versagen — hoechster Hypertrophie-Stimulus. |
| **Time Under Tension (TUT)** | Dauer der Muskelspannung pro Satz. Typisch 30-60s fuer Hypertrophie. |
| **Konzentrisch** | Verkuerzende Phase (Heben). Muskel kontrahiert und wird kuerzer. |
| **Exzentrisch** | Verlangernde Phase (Ablassen). Muskel kontrahiert unter Dehnung — hoher Mikro-Trauma-Stimulus. |
| **Isometrisch** | Haltende Phase. Muskellaenge aendert sich nicht trotz Spannung. |
| **Compound (Mehrgelenk)** | Uebung mit 2+ Gelenken: Squat, Bench, Deadlift, Row, OHP. |
| **Isolation (Eingelenk)** | Uebung mit 1 Gelenk: Curl, Extension, Lateral Raise, Fly. |
| **Split** | Aufteilung des Trainings auf Muskelgruppen/Tage: PPL, Upper/Lower, Bro-Split, Full Body. |
| **PPL (Push/Pull/Legs)** | 3er-Split: Drueckend (Brust/Schulter/Trizeps), Ziehend (Ruecken/Bizeps), Beine. |
| **Upper/Lower** | 2er-Split: Oberkoerper und Unterkoerper alternierend. |
| **Full Body** | Ganzkörpertraining — jede Einheit alle Muskelgruppen. |
| **Superset** | Zwei Uebungen direkt hintereinander ohne Pause (antagonistisch oder gleiche Muskelgruppe). |
| **Drop Set** | Nach dem Versagen Gewicht reduzieren und sofort weiter. |
| **Rest-Pause** | Kurze Pause (10-15s) bei Versagen, dann weitere Wiederholungen. |
| **Myo-Reps** | Aktivierungssatz bis RPE 8-9, dann Mini-Saetze (3-5 Reps) mit 5-10s Pause. |
| **AMRAP** | As Many Reps As Possible — maximale Wiederholungen mit gegebenem Gewicht. |
| **EMOM** | Every Minute On the Minute — Start jede Minute, Rest = verbleibende Sekunden. |
| **MET (Metabolisches Aequivalent)** | 1 MET = 3.5 ml O₂/kg/min (Ruhe). Laufen ≈ 8-12 MET, Krafttraining ≈ 3-6 MET. |
| **DOMS** | Delayed Onset Muscle Soreness — Muskelkater 24-72h nach ungewohnter exzentrischer Belastung. |
| **Mind-Muscle Connection** | Bewusste Fokussierung auf den Zielmuskel waehrend der Uebung. Verbessert EMG-Aktivierung. |
| **Sticking Point** | Schwierigster Punkt im Bewegungsablauf (biomechanisch ungünstigstes Hebelverhältnis). |
| **Valsalva-Manoever** | Pressatmung bei schweren Lifts — erhoet intraabd. Druck, stabilisiert Wirbelsaeule. |
| **Warm-up Sets** | Aufwaermsaetze mit steigendem Gewicht vor den Arbeitssaetzen. |
| **Work Sets** | Die eigentlichen Trainingssaetze mit Zielgewicht und -wiederholungen. |
| **Tonnage** | Gesamtlast: Saetze x Reps x Gewicht (in kg). |
| **SFR (Stimulus-to-Fatigue Ratio)** | Verhaeltnis von Wachstumsreiz zu Ermuedung einer Uebung. |

### 2. ERNAEHRUNG — Makros, Mikros & Stoffwechsel

| Begriff | Erklaerung |
|---------|-----------|
| **Makronaehrstoffe** | Protein (4 kcal/g), Kohlenhydrate (4 kcal/g), Fett (9 kcal/g). |
| **Mikronaehrstoffe** | Vitamine und Mineralstoffe — essentiell, kein Energiegehalt. |
| **TDEE (Total Daily Energy Expenditure)** | Gesamtener­gieverbrauch/Tag: BMR + TEF + NEAT + EAT. |
| **BMR (Basal Metabolic Rate)** | Grundumsatz — Energiebedarf in voelliger Ruhe (Organe, Atmung, Temp.). |
| **TEF (Thermic Effect of Food)** | Verdauungsenergie: Protein ~25-30%, KH ~6-8%, Fett ~2-3%. |
| **NEAT (Non-Exercise Activity Thermogenesis)** | Energieverbrauch durch Alltagsbewegung (Gehen, Stehen, Zappeln). |
| **EAT (Exercise Activity Thermogenesis)** | Energieverbrauch durch gezieltes Training. |
| **Kaloriendefizit** | Weniger Energie aufnehmen als verbraucht → Gewichtsabnahme. 500 kcal/d ≈ 0.5 kg/Woche. |
| **Kalorienueberschuss** | Mehr Energie als verbraucht → Aufbau. 300-500 kcal/d optimal fuer Muskelaufbau. |
| **Recomp (Body Recomposition)** | Gleichzeitig Fett verlieren und Muskel aufbauen — moeglich bei Anfaengern/Uebergewichtigen. |
| **Biologische Wertigkeit (BW)** | Mass fuer Proteinqualitaet: Anteil des absorbierten Proteins das in Koerperprotein umgesetzt wird. |
| **PDCAAS** | Protein Digestibility Corrected Amino Acid Score — WHO-Standard fuer Proteinqualitaet (0-1.0). |
| **DIAAS** | Digestible Indispensable Amino Acid Score — modernerer Standard als PDCAAS. |
| **Essenzielle Aminosaeuren (EAA)** | 9 Aminosaeuren die der Koerper nicht selbst herstellen kann. |
| **BCAA (Branched-Chain Amino Acids)** | Leucin, Isoleucin, Valin — 3 der 9 EAAs. Leucin = Haupttrigger fuer mTOR/MPS. |
| **Leucin-Schwelle** | ~2.5-3g Leucin pro Mahlzeit fuer maximale MPS-Stimulation. |
| **MPS (Muscle Protein Synthesis)** | Muskelprotein-Aufbau. Gegenpart: MPB (Muscle Protein Breakdown). |
| **mTOR (mammalian Target of Rapamycin)** | Signalweg der MPS aktiviert. Leucin + Insulin + mechanische Spannung als Trigger. |
| **Stickstoffbilanz** | Positive N-Bilanz = anabol (Aufbau), negative = katabol (Abbau). |
| **Glykaemischer Index (GI)** | Wie schnell ein KH den Blutzucker erhoeht (0-100). Hoch >70, Mittel 55-70, Niedrig <55. |
| **Glykaemische Last (GL)** | GI x KH-Menge / 100 — praxisrelevanter als GI allein. |
| **Ballaststoffe** | Unverdauliche Pflanzenfasern. 25-35g/Tag empfohlen. Sättigung + Darmgesundheit. |
| **Elektrolyte** | Na+, K+, Mg2+, Ca2+ — essentiell fuer Nerven, Muskeln, Wasserhaushalt. |
| **Chronobiologie der Ernaehrung** | Naehrstoff-Timing nach zirkadianen Rhythmen: Proteinverteilung, Pre/Post-Workout. |
| **Anaboles Fenster** | Post-Workout Zeitraum fuer Proteinzufuhr. Realer Effekt ueber 24h verteilt, nicht nur 30min. |
| **Reverse Diet** | Schrittweise Kalorienerhoehung nach einer Diaet — TDEE-Adaptation minimieren. |
| **Refeed** | Geplanter Tag mit erhoehter KH-Zufuhr waehrend einer Diaet (Leptin, Glykogen). |
| **Diet Break** | 1-2 Wochen Maintenance-Kalorien waehrend laengerer Diaet. |
| **Thermic Advantage of Protein** | Protein hat ~25-30% TEF — daher effektive kcal eher ~3.2 kcal/g statt 4. |
| **Harris-Benedict / Mifflin-St Jeor** | Formeln zur BMR-Berechnung. Mifflin-St Jeor gilt als genauer (±10%). |

### 3. KOERPERZUSAMMENSETZUNG & ANTHROPOMETRIE

| Begriff | Erklaerung |
|---------|-----------|
| **KFA (Koerperfettanteil)** | Fettmasse / Gesamtmasse x 100. Maenner: 10-20% gesund, Frauen: 18-28%. |
| **FFM (Fat-Free Mass)** | Fettfreie Masse: Muskeln + Knochen + Organe + Wasser. |
| **FFMI (Fat-Free Mass Index)** | FFM / Groesse² — natuerliche Obergrenze ~25-26 kg/m² (Maenner). |
| **BMI (Body Mass Index)** | Gewicht / Groesse². Grob: <18.5 Untergewicht, 18.5-24.9 Normal, 25-29.9 Uebergewicht, ≥30 Adipositas. |
| **Waist-to-Hip Ratio (WHR)** | Taillenumfang / Hueftumfang. Maenner ≤0.90, Frauen ≤0.85 (WHO-Richtwert). |
| **Bioimpedanzanalyse (BIA)** | Messung ueber Widerstand von Wechselstrom — schaetzt Fett/Muskel/Wasser. Genauigkeit ±3-5%. |
| **DEXA (Dual-Energy X-ray)** | Goldstandard der Koerperzusammensetzung: Fett, Muskelmasse, Knochendichte. ±1-2%. |
| **Caliper (Hautfaltenmessung)** | Mechanische Fettmessung an definierten Hautfalten. Genauigkeit abhaengig vom Anwender. |
| **Viszerales Fett** | Bauchfett um Organe — metabolisch aktiv, erhoehtes Risiko fuer KHK/Diabetes/Entzuendungen. |
| **Subkutanes Fett** | Fett unter der Haut — weniger gesundheitsschaedlich als viszeral. |
| **Trockenmasse** | Muskelmasse bei minimaler Wassereinlagerung (Wettkampfzustand). |
| **Woechentliche Gewichtsaenderung** | Sinnvoller Trend: 7-Tage-Durchschnitt, nicht Einzelmessungen (±1-2 kg Schwankung normal). |

### 4. SUPPLEMENTS — Evidenzbasiert

| Begriff | Erklaerung |
|---------|-----------|
| **Kreatin (Monohydrat)** | Evidenz A: +5-10% Kraft/Power, 3-5g/Tag. Sicher, bestuntersucht. Kein Nierenschaden bei Gesunden. |
| **Koffein** | Evidenz A: Ergogen 3-6 mg/kg, 30-60 min vorher. Toleranzentwicklung beachten. |
| **Whey Protein** | Schnell absorbiertes Protein, hoher Leucingehalt (~10-12%). Isolat >90% Protein. |
| **Casein** | Langsam absorbiertes Protein — gut vor dem Schlaf fuer anhaltende MPS. |
| **Beta-Alanin** | Evidenz A: Puffert H+-Ionen. Hilft bei 1-10 min Belastungen. Paraesthesie (Kribbeln) harmlos. |
| **Citrullin (Malat)** | Evidenz B: NO-Vorlaufer, verbessert Pump und Ausdauerleistung. 6-8g pre-workout. |
| **Omega-3 (EPA/DHA)** | Entzuendungshemmend, cardioprotektiv. 2-3g EPA+DHA/Tag. Evidenz B fuer Regeneration. |
| **Vitamin D3** | Steroidhormon-Vorlaufer. 2000-5000 IU/Tag wenn Serum <30 ng/ml. Synergie mit K2. |
| **Zink** | 15-30 mg/Tag. Wichtig fuer Testosteron, Immunfunktion. Mangel senkt T-Spiegel. |
| **Magnesium (Bisglycinat)** | 200-400 mg/Tag. Schlaf, Muskelrelaxation, Enzymfunktion. Bisglycinat = beste Bioverfuegbarkeit. |
| **Ashwagandha (KSM-66)** | Adaptogen. 300-600 mg/Tag. Evidenz B: Stress, Cortisol-Reduktion, leichter T-Anstieg. |
| **HMB (β-Hydroxy β-Methylbutyrat)** | Leucin-Metabolit. Evidenz B: Anti-katabol, hilft bei Kaloriendefizit/Anfaengern. 3g/Tag. |
| **EAA (Essential Amino Acids)** | 9 essenzielle Aminosaeuren. 10-15g peri-Workout. Alternative zu BCAA (vollstaendiger). |
| **Elektrolyt-Praeparate** | Na/K/Mg fuer Hydration. Wichtig bei Diaet, Schwitzen, Low-Carb. |
| **Pre-Workout** | Koffein + Citrullin + Beta-Alanin + ggf. Tyrosin. Stimulans-basiert oder Stim-free. |

### 5. PEDs (Performance Enhancing Drugs) — Substanzen

| Begriff | Erklaerung |
|---------|-----------|
| **AAS (Anabole Androgene Steroide)** | Synthetische Testosteron-Derivate. Erhoehen MPS, Stickstoffretention, Erythropoese. |
| **TRT (Testosterone Replacement Therapy)** | Aerztlich verordnete Testosteron-Gabe bei diagnostiziertem Hypogonadismus. |
| **Testosteron (Enantat/Cypionat)** | Langester: HWZ ~4.5-5 Tage. TRT: 125-200 mg/Woche. |
| **Testosteron Propionat** | Kurzester: HWZ ~0.8 Tage. Haeufigere Injektionen noetig (EOD/ED). |
| **Nandrolon (Deca/NPP)** | 19-Nor Steroid. Gelenkschutz (Kollagensynthese). Deca: HWZ ~6 Tage, NPP: ~2.5 Tage. |
| **Trenbolon** | 19-Nor, 5x androgener als Testosteron. Starke Nebenwirkungen (Schlaf, Kardio, Mental). |
| **Boldenon (Equipoise)** | Milde Anabolika. HWZ ~14 Tage. Erhoet EPO, steigert Haematokrit. |
| **Oxandrolon (Anavar)** | Orales, mildes AAS. Beliebt in Cuts. Hepatotoxisch (17α-alkyliert). |
| **Stanozolol (Winstrol)** | Oral/inj. DHT-Derivat. Trockener Look, gelenkbelastend (senkt Synovialflüssigkeit). |
| **Oxymetholon (Anadrol)** | Staerkstes orales AAS. Massive Kraft/Wasserretention. Hepatotoxisch. |
| **Metandienon (Dianabol)** | Klassisches orales AAS. Schneller Kraft-/Masseaufbau. Hohe Aromatisierung. |
| **HGH (Human Growth Hormone)** | Wachstumshormon. Fettabbau, Geweberegeneration, Kollagensynthese. 2-4 IU/Tag. |
| **IGF-1 (Insulin-like Growth Factor)** | Mediator von HGH-Wirkungen. Produziert in Leber. |
| **Insulin** | Hochanabol, hochtoxisch bei Fehldosierung (Hypoglykaemie = lebensbedrohlich). |
| **SARMs (Selective Androgen Receptor Modulators)** | Selektive AR-Agonisten: Ostarin, Ligandrol, RAD-140. Weniger erforscht als AAS. |
| **GLP-1-Rezeptoragonisten** | Semaglutid (Wegovy/Ozempic), Tirzepatid (Mounjaro). Appetitreduktion, Gewichtsverlust. |
| **Aromatase-Inhibitoren (AI)** | Anastrozol, Letrozol, Exemestan. Blocken Testosteron→Oestradiol-Umwandlung. |
| **SERM** | Selektive Oestrogen-Rezeptor-Modulatoren: Tamoxifen, Clomifen. PCT + Gyno-Praevention. |
| **HCG (Human Chorion Gonadotropin)** | LH-Analogon. Stimuliert Leydig-Zellen → Testosteron + Spermatogenese. |
| **Ester** | Chemische Verlaengerung der Halbwertszeit: Propionat < Enantat < Cypionat < Decanoat < Undecanoat. |
| **Halbwertszeit (HWZ)** | Zeit bis 50% der Substanz abgebaut ist. Bestimmt Injektionsfrequenz. |
| **Androgen/Anabol Ratio** | Verhaeltnis androgene (maennliche) zu anabole (muskelaufbauende) Wirkung. Testosteron = 100:100. |
| **Hepatotoxizitaet** | Lebertoxizitaet — betrifft 17α-alkylierte orale Steroide (Dianabol, Anavar, Winstrol, Anadrol). |
| **Gynaelkomastie (Gyno)** | Brustdruesen-Wachstum beim Mann durch Oestrogen-Ueberschuss. Behandlung: AI oder SERM. |
| **Suppression** | Unterdrueckung der koerpereigenen Testosteron-Produktion durch exogene AAS. |
| **HPTA** | Hypothalamus-Hypophysen-Gonaden-Achse. Wird durch AAS supprimiert. PCT zur Wiederherstellung. |

### 6. PCT (Post Cycle Therapy)

| Begriff | Erklaerung |
|---------|-----------|
| **PCT** | Post Cycle Therapy — Wiederherstellung der HPTA nach AAS-Kur. Dauer: 4-8 Wochen. |
| **Nolvadex (Tamoxifen)** | SERM fuer PCT. Blockiert Oestrogen an Brust/Hypothalamus, stimuliert LH/FSH. 20-40 mg/Tag. |
| **Clomid (Clomifen)** | SERM fuer PCT. Staerker auf Hypothalamus-Ebene. 50-100 mg/Tag → 25-50 mg/Tag. |
| **HCG in PCT** | 250-500 IU EOD fuer 2-3 Wochen VOR SERM-Phase. Verhindert Hoden-Atrophie. |
| **Clearance-Zeit** | Wartezeit nach letzter Injektion bis PCT beginnt: Enantat ~14 Tage, Deca ~21 Tage. |
| **Blutbild in PCT** | LH, FSH, Gesamt-Testosteron, Freies T, Oestradiol, SHBG kontrollieren. |

### 7. MEDIZIN & LABORWERTE

| Begriff | Erklaerung |
|---------|-----------|
| **Gesamt-Testosteron** | Referenz: 2.5-8.4 ng/ml (Maenner). Morgens messen (zirkadianer Peak). |
| **Freies Testosteron** | Biologisch aktiv: 1-3% des Gesamt-T. Berechnung via Vermeulen-Formel. |
| **SHBG (Sexualhormon-bindendes Globulin)** | Bindet Testosteron/Oestradiol. Hoehes SHBG = weniger freies T. |
| **Oestradiol (E2)** | Wichtigstes Oestrogen. Maenner: 20-40 pg/ml optimal. Zu hoch → Gyno, Wasser. Zu niedrig → Gelenke, Libido. |
| **Prolaktin** | Hypophysenhormon. Erhoeht durch 19-Nor Steroide (Tren, Deca). >20 ng/ml → Libido-Probleme. |
| **Haematokrit (Hkt)** | Anteil roter Blutkoerperchen. >54% = Thromboserisiko. AAS + Boldenon erhoehen Hkt. |
| **Haemoglobin (Hb)** | Sauerstofftraeger. Maenner: 14-17.5 g/dl. Erhoeht durch EPO-stimulierende Substanzen. |
| **Leberwerte (AST/ALT/GGT)** | Indikatoren fuer Leberschaeden. ALT >50 U/L bei oralen AAS beobachten. |
| **Lipidprofil** | LDL, HDL, Triglyceride, Gesamtcholesterin. AAS senken HDL drastisch. |
| **LDL-Cholesterin** | "Schlechtes" Cholesterin. <130 mg/dl empfohlen, <100 bei Risikopatienten. |
| **HDL-Cholesterin** | "Gutes" Cholesterin. >40 mg/dl (Maenner). AAS koennen auf <20 druecken. |
| **Kreatinin / eGFR** | Nierenfunktionsmarker. Kreatinin: 0.7-1.2 mg/dl. eGFR >90 = normal. |
| **CRP (C-reaktives Protein)** | Entzuendungsmarker. <3 mg/L normal. Hoch nach Training oder bei systemischer Entzuendung. |
| **HbA1c** | Langzeit-Blutzucker (3 Monate). <5.7% normal, 5.7-6.4% Praediabetes, ≥6.5% Diabetes. |
| **Insulin (nuechtern)** | 2-25 mIU/ml. Hohe Werte = Insulinresistenz (Metabolisches Syndrom). |
| **TSH / fT3 / fT4** | Schilddruesenwerte. TSH: 0.4-4.0 mU/L. Diaet + T3-Supplementation = Suppression. |
| **LH / FSH** | Gonadotropine. LH/FSH niedrig unter AAS (supprimiert). PCT-Ziel: Normalisierung. |
| **IGF-1 (Labor)** | HGH-Marker. 100-300 ng/ml (altersabhaengig). Erhoeht unter HGH-Therapie. |
| **PSA (Prostataspezifisches Antigen)** | Prostata-Marker. <4 ng/ml. Kontrollieren unter Testosteron/DHT. |
| **Ferritin** | Eisenspeicher. 30-300 ng/ml. Niedrig → Anaemie, Muedigkeit. Athleten oft suboptimal. |
| **Vitamin D (25-OH)** | <20 ng/ml = Mangel, 30-50 = optimal, >100 = toxisch. |
| **Blutdruck** | Systolisch/Diastolisch: <120/80 optimal, 120-139/80-89 erhoeht, ≥140/90 Hypertonie. |
| **Ruhe-Herzfrequenz** | 60-100 bpm normal. Trainierte: 40-60 bpm. Erhoeht durch Stimulanzien/Tren. |

### 8. SCHLAF & REGENERATION

| Begriff | Erklaerung |
|---------|-----------|
| **REM-Schlaf** | Rapid Eye Movement — Traumphase. Wichtig fuer Lernen, Emotionsverarbeitung. ~20-25% der Schlafzeit. |
| **Tiefschlaf (N3/SWS)** | Slow-Wave Sleep — HGH-Ausschuettung, Gewebereparatur, Immunfunktion. ~15-20%. |
| **Schlafhygiene** | Regelmaessige Zeiten, dunkel, kuhl (16-18°C), kein Bildschirm 60 min vorher. |
| **Zirkadianer Rhythmus** | ~24h innere Uhr. Licht = Hauptzeitgeber. Melatonin-Ausschuettung ab Dämmerung. |
| **Melatonin** | Schlafhormon. 0.5-3 mg 30-60 min vor dem Schlaf. Reguliert zirkadianen Rhythmus. |
| **Cortisol** | Stresshormon. Morgens hoch (Aufwach-Peak), abends niedrig. Chronisch erhoeht = katabol. |
| **Schlafschuld** | Akkumuliertes Schlafdefizit. Nicht vollstaendig nachholbar. Beeintraechtigt Kraft, MPS, Insulin. |
| **Adenosin** | Muedigkeits-Molekuel. Akkumuliert bei Wachheit. Koffein blockiert Adenosin-Rezeptoren. |
| **Schlaf-Tracking** | Wearables messen Schlafphasen, HRV, Bewegung. Trend > Einzelmessung. |

### 9. WETTKAMPF & BODYBUILDING

| Begriff | Erklaerung |
|---------|-----------|
| **Prep (Contest Prep)** | Wettkampfvorbereitung: 12-20 Wochen Diaet + Training + Posing + ggf. PED-Protokoll. |
| **Peak Week** | Letzte Woche vor Wettkampf: Carb Depletion → Carb Loading, Wasserreduktion, Na-Manipulation. |
| **Carb Loading** | Glykogenspeicher maximieren (8-12 g KH/kg in 24-48h) fuer prallen Look. |
| **Water Manipulation** | Wasseraufnahme reduzieren (letzte 12-24h) fuer duennere Haut. Risiko: Dehydration. |
| **Sodium Loading/Cutting** | Na-Manipulation fuer Wasserverschiebung subkutan → intravaskulaer. |
| **Stage-Conditioning** | Gesamteindruck auf der Buehne: Muskeldefinition, Vaskulaeritaet, Proportionen. |
| **Posing** | Pflichtposen + Kuer. Technik entscheidend fuer Platzierung. |
| **Division/Klasse** | Bodybuilding, Classic Physique, Men's Physique, Bikini, Figure, Wellness, etc. |
| **Refeed (Wettkampf)** | Strategisch hoehere KH-Tage in der Prep — Leptin, Schilddruese, Trainingsqualitaet. |
| **Reverse Diet (Post-Contest)** | Langsame Kalorienerhöhung nach Wettkampf. 100-200 kcal/Woche hoch. |
| **Vaskulaeritaet** | Sichtbarkeit der Venen. Abhaengig von KFA, Pump, Genetik, Natriumstatus. |

### 10. FEMALE FITNESS & HORMONE

| Begriff | Erklaerung |
|---------|-----------|
| **Menstruationszyklus** | ~28 Tage: Follikelphase (Tag 1-14), Ovulation, Lutealphase (Tag 15-28). |
| **Follikelphase** | Oestrogen steigt. Hoehere Belastbarkeit, bessere Insulinsensitivitaet, mehr Kraft. |
| **Lutealphase** | Progesteron hoch. Erhoehter Ruheumsatz (+5-10%), mehr Heisshunger, Wasserretention. |
| **RED-S (Relative Energy Deficiency)** | Energiedefizit-Syndrom: Zyklusverlust, Knochenabbau, Hormonstoerungen. Frueher: FAT. |
| **FAT (Female Athlete Triad)** | Energiedefizit + Amenorrhoe + Osteoporose. Jetzt als RED-S erweitert. |
| **Amenorrhoe** | Ausbleiben der Menstruation (≥3 Zyklen). Zeichen fuer zu tiefes Defizit. |
| **Oestrogen (Oestradiol)** | Hauptoestrogen der Frau. Knochen, Libido, Stimmung, Fettstoffwechsel. |
| **Progesteron** | Schwangerschaftshormon. In Lutealphase hoch. Thermoregulaerisch, wasserretinierend. |
| **Perimenopause** | Uebergang zur Menopause (typisch 45-55 Jahre). Hormonschwankungen, Muskelverlust. |
| **Beckenbodentraining** | Kegel-Uebungen + funktionelles Training. Wichtig fuer Stabilitaet und Inkontinenz-Praevention. |

### 11. BEAUTY & ATTRACTIVENESS

| Begriff | Erklaerung |
|---------|-----------|
| **Kollagen** | Strukturprotein: Haut, Haare, Naegel, Gelenke. Typ I (Haut), Typ II (Knorpel), Typ III (Gefaesse). |
| **Retinol (Vitamin A)** | Goldstandard Anti-Aging: Zellumsatz, Kollagensynthese. 0.3-1% abends, Sonnenschutz pflicht. |
| **Hyaluronsaeure** | Feuchtigkeitsbinder: 1g bindet bis zu 6L Wasser. Topisch oder oral (200 mg/Tag). |
| **SPF (Sun Protection Factor)** | UV-Schutzfaktor. SPF 30 blockt ~97% UVB. Taegliche Nutzung = #1 Anti-Aging. |
| **Ceramide** | Lipide in der Hautbarriere. Staerken Feuchtigkeitsretention und Schutzfunktion. |
| **Niacinamid (Vitamin B3)** | Hautbarriere, Sebumregulation, Anti-Rötung. 5-10% Serum. |
| **WHR (Beauty)** | Waist-to-Hip Ratio als Attraktivitaetsmass: 0.7 (Frauen) / 0.9 (Maenner) als ideal. |
| **Shoulder-to-Waist Ratio (SWR)** | Schulter-/Taillenverhaeltnis. >1.6 fuer V-Taper (maennlicher Attraktivitaetsfaktor). |
| **V-Taper** | V-foermige Silhouette: breite Schultern, schmale Taille. Training: Delts, Lats, Obliques. |
| **Golden Ratio (Adonis-Index)** | Schulterumfang / Taillenumfang ≈ 1.618. Aesthetisches Ideal (historisch, nicht wissenschaftlich hart). |

### 12. ALLGEMEINE ABKUERZUNGEN

| Kuerzel | Bedeutung |
|---------|-----------|
| **ED** | Every Day (taeglich) |
| **EOD** | Every Other Day (jeden zweiten Tag) |
| **E3D** | Every 3 Days (alle 3 Tage) |
| **EW** | Every Week (woechentlich) |
| **IM** | Intramuskulaer (Injektion) |
| **SC/SubQ** | Subkutan (Injektion unter die Haut) |
| **mg/ml** | Milligramm pro Milliliter (Konzentration) |
| **IU/IE** | International Units / Internationale Einheiten |
| **HWZ** | Halbwertszeit |
| **NW** | Nebenwirkung(en) |
| **BB** | Bodybuilding |
| **KH** | Kohlenhydrate |
| **KFA** | Koerperfettanteil |
| **kcal** | Kilokalorien |
| **g/kg** | Gramm pro Kilogramm Koerpergewicht |
| **RDA** | Recommended Daily Allowance (empfohlene Tageszufuhr) |
| **UL** | Upper Tolerable Intake Level (max. sichere Tageszufuhr) |
| **PMID** | PubMed Identifier (Literaturverweis) |
| **RCT** | Randomized Controlled Trial (hoechste Evidenzstufe) |
| **n.s.** | nicht signifikant (p > 0.05) |
`;
