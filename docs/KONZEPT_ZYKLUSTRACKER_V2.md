# Konzept: Zyklus-Tracker v2 — Feature-Gap-Analyse & Erweiterungskonzept

**Erstellt:** 2026-03-08
**Basis:** Web-Recherche (Clue, Flo, Natural Cycles, Apple Health), Screenshots Clue App, wissenschaftliche Literatur
**Status:** Entwurf — 2x Frauenaerztin-Challenge + Andrologen-Bewertung

---

## 1. Marktrecherche: Wie andere Apps das loesen

### 1.1 Clue (Marktfuehrer, CE-zertifiziert Class I Medical Device)
- **Vorhersage-Start:** Ab 3 kompletten Zyklen akkurate Predictions, davor Population-Prior
- **Algorithmus:** Eigenentwicklung mit Universitaetspartnerschaften (Columbia, Harvard, Stanford)
- **Tracking:** 200+ Faktoren (Periode, Schmierblutung, Gefuehle, Energie, PMS, Heisshunger, Ausfluss, Haut, Schlafqualitaet, Hitzewallungen, Vulva & Vagina, Sex, Schmerzen)
- **Premium:** 12 zukuenftige Perioden, erweiterte Analyse, Custom Tags, taegliche Notizen
- **Staerke:** Wissenschaftliche Basis, DSGVO (EU-Sitz Berlin), 15 Mrd. Datenpunkte

### 1.2 Flo (groesste Nutzerbasis: 420 Mio.)
- **Vorhersage-Start:** Sofort (ungenau), ab 3 Zyklen deutlich besser
- **Algorithmus:** Neuronales Netz mit 442 Input-Units, ML 2-Stufen-Prozess
- **Tracking:** 70+ Symptome, BBT, Zervixschleim, Ovulationstests, Wearable-Daten
- **Genauigkeit:** ML-Ansatz 54.2% genauer als herkoemmliche Methoden
- **Schwaeche:** FTC-Settlement 2021 (Datenweitergabe an Facebook/Google)

### 1.3 Natural Cycles (FDA-zugelassen als Verhuetungsmittel)
- **Vorhersage-Start:** Ab Zyklus 1 nutzbar, 3 Zyklen fuer beste Genauigkeit
- **Algorithmus:** BBT-basiert (Basaltemperatur), Progesterone-bedingte 0.45degC Erhoehung post-Ovulation
- **Features:** Rot/Gruen-Tage (fertil/nicht-fertil), Partner View, Temperatur-Exclude, Wearable-Integration
- **Genauigkeit:** 93% typical use, 98% perfect use (als Verhuetung)
- **Besonderheit:** 3 Modi (Verhuetung, Kinderwunsch, Schwangerschaft)

### 1.4 Apple Health Cycle Tracking
- **Vorhersage-Start:** Nach Eingabe der letzten Periode (einfacher Kalender)
- **Algorithmus:** Handgelenk-Temperatur (Watch Series 8+) + Herzfrequenz fuer retrospektive Ovulationsschaetzung
- **Features:** Zyklusabweichungs-Erkennung (unregelmaessig, selten, verlaengert, Schmierblutung), Benachrichtigungen
- **Integration:** Wearable-Daten automatisch, Faktoren-Logging (Schwangerschaft, Stillen, Verhuetung)
- **Staerke:** Privacy (E2E-verschluesselt), kostenlos, kein Account noetig

---

## 2. Feature-Kategorien aus Clue-Screenshots (Analyse)

| Kategorie | Clue-Features | FitBuddy Aktuell | GAP |
|-----------|---------------|-------------------|-----|
| **Periode** | Leicht/Mittel/Stark/Sehr stark (4 Stufen) | light/normal/heavy (3 Stufen) | 1 Stufe fehlt |
| **Schmierblutung** | Rot/Braun (2 Typen) | Nicht vorhanden | **FEHLT** |
| **Gefuehle** | Happy/Sad/Sensitive/PMS/Energiegeladen etc. | Mood 1-5 (Emoji-Skala) | Detailtiefe fehlt |
| **Energie** | Energielos/Muede/OK/Energiegeladen/Hoch | Energy 1-5 (Emoji-Skala) | ~Paritaet |
| **PMS** | Dedizierter PMS-Toggle | Kein expliziter PMS-Marker | **FEHLT** |
| **Heisshunger** | Suess/Salzig/Fettig (Kategorien) | Nicht vorhanden | **FEHLT** |
| **Ausfluss** | Keinen/Klebrig/Cremig/Fadenziehend (4 Typen) | Nicht vorhanden | **FEHLT** (Zervixschleim) |
| **Haut** | OK/Gut/Pickel/Trocken/Fettig | skin_changes (ja/nein Toggle) | Detailtiefe fehlt |
| **Schlafqualitaet** | Einschlafprobleme/Erholt/Muede/Unruhig | Separater Sleep-Tracker (MedicalPage) | Existiert, nicht integriert |
| **Hitzewallungen** | Heute nicht/Leicht/Maessig/Stark | hot_flashes (ja/nein Toggle) | Detailtiefe fehlt |
| **Vulva & Vagina** | Juckreiz/Trockenheit/Schwellung | Nicht vorhanden | **FEHLT** |
| **Sex** | Geschuetzt/Ungeschuetzt/Interruptus/Oral | Nicht vorhanden | **FEHLT** |
| **Schmerzen** | Kopf/Ruecken/Brust/Unterleib (Koerper-Map) | cramping/headache/back_pain/breast_tenderness etc. (Toggle-Liste) | ~Paritaet (Darstellung anders) |
| **Harndrang** | Haeufiger/Brennen/Harnverlust | urinary_frequency (ja/nein Toggle) | Detailtiefe fehlt |
| **Custom Tags** | Frei definierbar + "Neuen Tag erstellen" | notes (Freitext) | **FEHLT** (strukturiert) |
| **Kalender-Ansicht** | Wochenansicht mit Tag-Auswahl | 14-Tage-Slider | ~Paritaet |
| **Zyklus-Vorhersage** | 12 zukuenftige Perioden (Premium) | Naechste Periode + Ovulation | 1 vs 12 |

---

## 3. Vollstaendige GAP-Tabelle: FitBuddy vs. Markt

| Feature | Clue | Flo | Natural Cycles | Apple | **FitBuddy** | Prioritaet |
|---------|------|-----|----------------|-------|-------------|-----------|
| Phasen-Logging (4 Phasen) | ja | ja | ja | ja | **ja** | - |
| Perioden-Staerke (4 Stufen) | ja | ja | nein | ja | 3 Stufen | P2 |
| Schmierblutung | ja | ja | nein | ja | **NEIN** | P1 |
| Zervixschleim (4 Typen) | ja | ja | nein | ja | **NEIN** | P1 |
| PMS-Marker | ja | ja | nein | nein | **NEIN** | P1 |
| Heisshunger-Kategorien | ja | nein | nein | nein | **NEIN** | P3 |
| Ausfluss-Detail | ja | ja | nein | nein | **NEIN** | P2 |
| Haut-Detail (5 Typen) | ja | ja | nein | nein | Toggle nur | P3 |
| Sex-Logging | ja | ja | nein | ja | **NEIN** | P2 |
| Hitzewallungen-Stufen | ja | nein | nein | nein | Toggle nur | P3 |
| BBT (Basaltemperatur) | nein | ja | **ja (Kern)** | ja (Watch) | **NEIN** | P2 |
| Ovulationstest-Logging | nein | ja | ja | nein | **NEIN** | P3 |
| Custom Tags | ja | nein | nein | nein | **NEIN** | P3 |
| Fertiles Fenster (6 Tage) | ja | ja | ja | ja | **NEIN** (nur Ovulationstag) | P1 |
| Zyklusabweichungs-Alarm | nein | ja | nein | ja | **NEIN** | P1 |
| PMDD-Erkennung | nein | ja | nein | nein | **NEIN** | P2 |
| Lutealphase individuell | nein | ja | ja (BBT) | ja (BBT) | Hardcoded 14d | P2 |
| Schwangerschafts-Modus | nein | ja | ja | ja | **NEIN** | P3 |
| Partner View | nein | nein | ja | nein | **NEIN** | P3 |
| Wearable-Integration | nein | ja | ja | ja | **NEIN** | P3 |
| Cycle-Synced Training | nein | nein | nein | nein | **Teilweise** (Phasen-Tips) | P1 |
| Arztbericht-Export | nein | nein | ja | ja | Power+ PDF (ohne Zyklus) | P1 |
| ML-Vorhersage | ja | ja (NN) | ja (BBT) | ja (Temp) | Weighted Avg | OK fuer MVP |
| 12+ Perioden voraus | ja (Premium) | ja | ja | ja | 1 Periode | P2 |
| Sleep-Cycle-Korrelation | nein | ja | nein | ja (Watch) | Daten da, nicht verknuepft | P2 |
| Notification/Push | ja | ja | ja | ja | Nur lokal (Capacitor) | Phase 8.2 |

---

## 4. Priorisierte Erweiterungen (Konzeptvorschlag)

### Phase A: Quick Wins (1-2 Tage, hoher Impact)
1. **Schmierblutung als Phase hinzufuegen** — neuer phase-Wert `spotting`
2. **Zervixschleim-Tracking** — neues Feld `cervical_mucus`: none/sticky/creamy/egg_white
3. **PMS-Marker** — neues Boolean-Feld `pms_flag` im Log
4. **Fertiles Fenster** — 6-Tage-Window (Ovulation -5 bis +1) in CyclePhaseWidget anzeigen
5. **Zyklusabweichungs-Warnung** — wenn Zyklus > 38d oder < 21d: Insight-Karte mit Arzt-Empfehlung
6. **4. Flow-Stufe** — `very_heavy` hinzufuegen

### Phase B: Medium Effort (3-5 Tage)
7. **Cycle-Synced Training Auto-Anpassung** — RPE/Volumen-Modifikator basierend auf Zyklusphase
   - Menstruation: -15% Volumen, Fokus Erholung
   - Follikular: +10% Volumen, PR-Versuche ok
   - Ovulation: Vorsicht Baender (Relaxin), kein Max-Test
   - Luteal: RPE +1 subjektiv, Gewicht halten statt steigern
8. **Zyklus in Arztbericht integrieren** — DoctorReportButton um Zyklus-Sektion erweitern
9. **Mehrere Perioden voraussagen** — 3 zukuenftige Perioden statt nur naechste
10. **Sex-Logging** — Feld `sexual_activity`: none/protected/unprotected (fuer Fertilitaets-Kontext)
11. **Lutealphase individualisieren** — aus Ovulations-Logs berechnen statt hardcoded 14d

### Phase C: Groessere Features (5-10 Tage)
12. **Frauenaerztin-Agent** — KI-Agent mit Skill-Dateien (s. Abschnitt 5)
13. **Andrologen-Agent** — KI-Agent fuer maennliche Nutzer (s. Abschnitt 6)
14. **Sleep-Cycle-Korrelation** — Schlaf-Daten aus sleep_logs mit Zyklusphase korrelieren
15. **BBT-Tracking (manuell)** — Basaltemperatur-Eingabe + Chart
16. **PMDD-Screening** — Scoring-System basierend auf Symptom-Schwere ueber mehrere Zyklen

---

## 5. Challenge #1: Frauenaerztin-Perspektive

### Review-Frage: "Sind unsere aktuellen Skills medizinisch ausreichend?"

**Antwort (simulierte Fachaerztin fuer Gynaekologie):**

> **Positiv:**
> - Phase-Tracking mit 4 Phasen ist korrekt und medizinisch sinnvoll
> - Symptom-Liste (20 Symptome) deckt die haeufigsten zyklusabhaengigen Beschwerden ab
> - Confidence-Tiers (0/1-2/3-5/6+) sind wissenschaftlich korrekt (Fehring 2006, Bull 2019)
> - Training-Phasen-Tips sind evidenzbasiert (Relaxin in Ovulation, RPE-Shift in Lutealphase)
>
> **Kritisch:**
> - **Zervixschleim fehlt** — ist DIE wichtigste Fertilitaets-Eigenbeobachtung nach der Periode selbst
> - **Schmierblutung fehlt** — medizinisch relevant (Implantation, Hormonstoerung, Pathologie)
> - **Fertiles Fenster fehlt** — nur Ovulationstag ist zu wenig; Spermien ueberleben 5 Tage
> - **Kein PMDD-Screening** — ca. 5-8% der Frauen betroffen, schwer unterdiagnostiziert
> - **Lutealphase hardcoded 14d** — variiert tatsaechlich 10-16 Tage; wichtig fuer Fertilaet
> - **Zyklusabweichungs-Alarm fehlt** — unregelmaessige Zyklen koennen PCOS, Schilddruese, Stress signalisieren
>
> **Empfehlung:** Zervixschleim + Schmierblutung + fertiles Fenster SOFORT ergaenzen.
> Ein Frauenaerztin-Agent waere SEHR wertvoll — gerade fuer Fragen zu:
> - Unregelmaessigen Zyklen
> - PMS/PMDD-Management
> - Fertilitaetsfragen
> - Wechseljahre-Symptome (Hitzewallungen, Schlaf)
> - Interaktion Zyklus + Training

### Review-Frage: "Brauchen wir einen Frauenaerztin-Agent mit Skills?"

> **Ja, dringend empfohlen.** Gruende:
> 1. Zyklus-Fragen sind der #1 Grund fuer Gynaekologie-Besuche bei jungen Frauen
> 2. PMS-Management (Ernaehrung, Supplements, Bewegung) ist ein perfekter Buddy-Chat-Use-Case
> 3. Zyklusabhaengiges Training ist ein Alleinstellungsmerkmal gegenueber Clue/Flo (die kein Training haben!)
> 4. DSGVO-konform (Daten in DE, kein US-Subprocessor) ist ein Vertrauensargument
> 5. Disclaimer ist Pflicht: "Kein Ersatz fuer aerztliche Beratung"

---

## 6. Challenge #2: Frauenaerztin-Perspektive (Zweite Runde)

### Review-Frage: "Was wuerde eine Frauenaerztin an unserem Zyklus-Tracker aendern?"

> **Strukturelle Aenderungen:**
> 1. **Schmierblutung differenzieren** — Praeovulatorisch vs. Postovulatorisch vs. Kontaktblutung (verschiedene klinische Bedeutung)
> 2. **Periodenstaerke quantifizieren** — "Wie viele Binden/Tampons pro Tag?" ist klinisch relevanter als subjektiv leicht/mittel/stark
> 3. **Eisenmangel-Warnung** — bei wiederholt starker Blutung (>7 Tage oder "very_heavy") Hinweis auf Ferritin-Check
> 4. **Zykluslaenge-Trend** — werden Zyklen kuerzer/laenger? Trend ueber 6+ Monate zeigen (Perimenopause-Indikator)
> 5. **Amenorrhoe-Warnung** — keine Periode seit >60 Tagen: RED-S, Schwangerschaft, PCOS, Stress?
> 6. **Schilddruese-Hinweis** — bei unregelmaessigen Zyklen + Muedigkeit + Gewichtszunahme TSH-Check empfehlen
>
> **Zum Frauenaerztin-Agent:**
> - Muss klar als "Informationsassistent" positioniert sein, NICHT als Diagnose-Tool
> - Skills sollten evidenzbasiert sein (Leitlinien DGGG, ACOG, NICE)
> - Wichtige Skill-Bereiche:
>   - Zyklusgesundheit & Normalwerte
>   - PMS/PMDD natuerliche Behandlungsansaetze
>   - Fertilitaets-Grundlagen
>   - Sport & Zyklus (Alleinstellungsmerkmal!)
>   - Perimenopause-Erkennung
>   - Wann zum Arzt? (Red Flags)
> - Disclaimer bei JEDEM Ratschlag: "Dies ist keine aerztliche Beratung"

---

## 7. Andrologen-Agent fuer maennliche Nutzer

### Kontext
Maennliche Nutzer (besonders im Power/Power+ Modus) haben spezifische medizinische Fragen zu:
- TRT (Testosteron-Ersatztherapie) — Blutbild-Interpretation, Nebenwirkungen, Timing
- PED (Performance Enhancing) — Leberwerte, Haematokrit, Blutdruck-Monitoring
- PCT (Post Cycle Therapy) — Hormonachsen-Recovery, Fertilitaet
- Andrologische Grundlagen — Spermiogramm, Hormonspiegel, Prostata-Vorsorge
- Training unter TRT/PED — Recovery, Volumen-Anpassung, Deload-Timing

### Empfehlung: Ja, ein Andrologen-Agent ist sinnvoll

**Gruende:**
1. Power/Power+ Modus existiert bereits — Nutzer BRAUCHEN medizinische Informationen
2. Blutbild-Tracking (blood_work) ist implementiert — Agent kann Werte interpretieren
3. Substanzen-Tracking ist implementiert — Agent kann Wechselwirkungen erkennen
4. Kein vergleichbares Feature bei Konkurrenz (Alleinstellungsmerkmal)
5. Reduktion von Gesundheitsrisiken durch bessere Information

**Agent-Skills (Vorschlag):**
| Skill-Datei | Inhalt | PMIDs |
|-------------|--------|-------|
| `androTRT.md` | TRT-Grundlagen, Dosierung, Monitoring-Intervalle, Nebenwirkungen | 5-8 |
| `androBloodWork.md` | Testosteron, Oestradiol, LH/FSH, SHBG, Haematokrit, Leber, Niere | 8-10 |
| `androPCT.md` | Post-Cycle-Therapie, HCG, Clomid, Fertilitaets-Recovery | 5-8 |
| `androProstate.md` | PSA-Screening, Prostata-Gesundheit unter TRT | 3-5 |
| `androFertility.md` | Spermiogramm-Basics, TRT-Auswirkungen auf Fertilitaet | 5-8 |
| `androTraining.md` | Training unter Hormonersatz, Recovery-Optimierung | 3-5 |

**Disclaimer (PFLICHT):**
- "Dies ist keine aerztliche Beratung. TRT/PED erfordern aerztliche Begleitung."
- "Bei Symptomen wie Brustvergroesserung, Stimmungsschwankungen oder Bluthochdruck sofort Arzt aufsuchen."

---

## 8. Skill-Dateien: Frauenaerztin-Agent

### Vorgeschlagene Skill-Dateien

| Skill-Datei | Inhalt | Tokens (ca.) | PMIDs |
|-------------|--------|-------------|-------|
| `gynoZyklus.md` | Zyklusgesundheit, Normalwerte (21-35d), Phasen, Hormone | ~3000 | 8-10 |
| `gynoPMS.md` | PMS/PMDD: Erkennung, natuerliche Behandlung, Supplements (Mg, B6, Vitex) | ~3000 | 8-10 |
| `gynoFertility.md` | Fertilitaetsfenster, Zervixschleim, Ovulationszeichen, Timing | ~2500 | 6-8 |
| `gynoTraining.md` | Cycle-Synced Training: Phasen-spezifische Empfehlungen, RPE, Volumen | ~3000 | 8-10 |
| `gynoPerimenopause.md` | Uebergangsphase, Symptome, Wann zum Arzt, HRT-Grundlagen | ~2000 | 5-8 |
| `gynoRedFlags.md` | Wann zum Arzt: Amenorrhoe, starke Blutung, Zwischenblutung, Schmerzen | ~2000 | 5-8 |
| `gynoNutrition.md` | Zyklusabhaengige Ernaehrung: Eisen, Magnesium, Omega-3, Anti-Inflammatorisch | ~2500 | 6-8 |
| `gynoREDS.md` | RED-S (Relative Energy Deficiency in Sport): Erkennung bei Sportlerinnen | ~2000 | 5-8 |

**Gesamt:** ~21.000 Tokens, ~55-70 PMIDs

### Agent-Konfiguration
```typescript
// Frauenaerztin-Agent
{
  id: 'gynecologist',
  name: { de: 'Frauenaerztin', en: 'Gynecologist' },
  emoji: '👩‍⚕️',
  description: { de: 'Fragen zu Zyklus, PMS, Fertilitaet & Training', en: 'Cycle, PMS, fertility & training questions' },
  systemPrompt: `Du bist eine virtuelle Frauenaerztin-Assistentin in einer Fitness-App.
    Deine Aufgabe ist es, evidenzbasierte Informationen zu Zyklusgesundheit,
    PMS-Management, Fertilitaet und zyklusabhaengigem Training zu geben.
    Du bist KEIN Ersatz fuer eine aerztliche Untersuchung.
    Bei Red Flags (Amenorrhoe >60d, starke Blutungen, akute Schmerzen)
    empfiehlst du IMMER einen Arztbesuch.`,
  triggerKeywords: ['zyklus', 'periode', 'pms', 'eisprung', 'fruchtbar', 'menstruation',
    'cycle', 'period', 'ovulation', 'fertile', 'cramps', 'pmdd'],
  genderGating: ['female', 'other'],
  conditionalSkills: true,
}
```

---

## 9. Umsetzungsreihenfolge (Empfehlung)

| Phase | Aufgabe | Aufwand | Abhaengigkeiten |
|-------|---------|---------|-----------------|
| **A1** | Schmierblutung + 4. Flow-Stufe | 0.5d | DB-Migration |
| **A2** | Zervixschleim-Feld | 0.5d | DB-Migration |
| **A3** | PMS-Marker + fertiles Fenster (6d) | 0.5d | useCyclePrediction |
| **A4** | Zyklusabweichungs-Warnung | 0.5d | CycleInsightsCard |
| **A5** | Amenorrhoe-Warnung + Eisenmangel-Hint | 0.5d | CycleInsightsCard |
| **B1** | Cycle-Synced Training (RPE-Modifikator) | 2d | TrainingPage + ActiveWorkout |
| **B2** | Zyklus in Arztbericht | 1d | DoctorReportButton |
| **B3** | 3 zukuenftige Perioden | 0.5d | useCyclePrediction |
| **B4** | Frauenaerztin-Agent + Skills | 3d | Skill-Dateien + Agent-Config |
| **B5** | Andrologen-Agent + Skills | 3d | Skill-Dateien + Agent-Config |
| **C1** | BBT-Tracking + Chart | 2d | DB + neue Komponente |
| **C2** | PMDD-Screening | 2d | Scoring-Algorithmus |
| **C3** | Sleep-Cycle-Korrelation | 1d | sleep_logs + cycle_logs Join |

**Gesamt Phase A:** ~2.5 Tage (Quick Wins)
**Gesamt Phase B:** ~9.5 Tage (Medium)
**Gesamt Phase C:** ~5 Tage (Groessere Features)

---

## 10. Quellen

### Wissenschaftliche Literatur
- Bull et al. 2019 (PMID: 31523756) — Clue-Population, mittlere Zykluslaenge 29.3d
- Fehring et al. 2006 (PMID: 16865627) — Zykluslaenge-Variabilitaet
- Kleinschmidt et al. 2019 (PMID: 31738859) — Natural Cycles vs. Kalender-Methoden
- Rhea 2004 (PMID: 15142003) — BW-Multiplier Referenz

### App-Recherche
- Clue: https://helloclue.com/articles/about-clue/science-your-cycle-evidence-based-app-design
- Flo: https://flo.health/flo-accuracy + https://indatalabs.com/resources/neural-network-implementation-in-healthcare-app
- Natural Cycles: https://www.naturalcycles.com/how-does-natural-cycles-work
- Apple Health: https://support.apple.com/en-us/120356

### Medizinische Bewertung
- ACOG (American College of Obstetricians and Gynecologists) — App-Bewertungsstudie
- PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC10018377/ — Menstrual Tracking App Quality Evaluation
- PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC8631160/ — Symptom Tracking Functionality Review
