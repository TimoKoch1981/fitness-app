# FitBuddy — Digital Twin Testing Report v1.0

> Datum: 2026-02-28
> Getestet: Lokale Entwicklungsumgebung (Vite + Supabase CLI)
> Version: v11.1 (develop Branch, Commit 2b48ebe)
> Methodik: Visuelle App-Exploration + Source-Code-Analyse + 25-Persona-Perspektiven

---

## Executive Summary

FitBuddy ist eine solide, funktionsreiche Fitness-App mit starkem KI-Buddy, gutem Substanz-Tracking
und einem breiten Feature-Set. Die App bedient Standard-, Power- und Enhanced-Nutzer mit unterschiedlichen
Trainingsmodi. Die groessten Luecken betreffen **Anfaenger-Onboarding**, **Ernaehrungseingabe ohne KI-Hilfe**,
**fehlende Profil-Felder** (Allergien, Ernaehrungsform, Medizin) und **Frauen-spezifische Features** (Zyklus-Tracking).

### Bewertung nach Nutzergruppe

| Gruppe | Gesamtnote | Staerke | Groesste Luecke |
|--------|-----------|---------|-----------------|
| **A: Einsteiger** | 6/10 | Buddy-Chat hilft, Trainingsplan-Generator | Mahlzeit-Logging ohne KI, kein Profil-Onboarding |
| **B: Fortgeschrittene** | 8/10 | Volumen-Tracking, Equipment-Setup, Periodisierung | Kein Zyklus-Tracking (Julia B2), kein MFP-Import (Lisa C3) |
| **C: Power-User** | 8/10 | Wettkampf-Skill, Supplement-Presets, Buddy-Expertise | Kein Peak-Week-Planer, keine Contest-Countdown |
| **D: Enhanced** | 9/10 | TRT/PED-Presets, Harm-Reduction, Substanz-Scheduling | Kein Blutbild-Logging (nur Blutdruck), kein PCT-Kalender |
| **E: Frauen** | 5/10 | Grundlegende Funktionen vorhanden | Kein Zyklus-Tracking, keine Rektusdiastase-Warnung, kein PCOS-Support |

---

## 1. UEBERGREIFENDE UX-FINDINGS

### 1.1 Positiv (alle Twins)

| # | Finding | Betroffene Twins |
|---|---------|-----------------|
| ✅1 | **Buddy-Chat exzellent**: 8 Faehigkeiten, Voice-Input, Agent-Tabs, Inline-Overlay auf jeder Seite | Alle |
| ✅2 | **Geraetepark umfangreich**: 52 Geraete in 6 Kategorien, Gym-Profile, wird an KI uebergeben | A3,A4,A5,B1-B5,C1-C5 |
| ✅3 | **Substanz-Tracking exzellent**: 24 Presets (12 Supplements + 12 PEDs), 5 Kategorien (TRT/PED/Medikament/Supplement/Sonstige), Harm-Reduction-Disclaimer, Injektionsstellen, Auto-Reminder | D1-D5, C1-C4 |
| ✅4 | **Trainingsmodus 3-stufig**: Standard/Power/Power+ mit Feature-Flags und modus-bewusstem Skill-Loading | Alle |
| ✅5 | **17 Sprachen**: DE, EN, AR, ES, FA, FIL, FR, IT, JA, KO, PL, PT, RO, RU, TR, UK, ZH | Alle |
| ✅6 | **Koerperdaten umfassend**: 8 Messwerte + BMI + FFMI + Silhouette + Screenshot-Import + CSV-Import | B1,C1,D1-D5 |
| ✅7 | **Buddy-Suggestions kontextbezogen**: Jede Seite hat passende Quick-Actions (Essen loggen, Plan erstellen, BD analysieren) | Alle |
| ✅8 | **Haftungshinweise korrekt**: Disclaimer-Modal beim ersten Start, Harm-Reduction bei PEDs/TRT, Arzthinweise | Alle (rechtlich wichtig) |

### 1.2 Kritische UX-Probleme

| # | Schwere | Finding | Betroffene Twins | Loesung |
|---|---------|---------|-----------------|---------|
| ❌1 | **HOCH** | **Mahlzeit-Dialog NUR manuell**: Bezeichnung + 4 Makro-Felder muessen von Hand ausgefuellt werden. Kein KI-Freitext ("Doener mit alles"), keine Lebensmittel-DB, kein Barcode-Scan. Die KI-Ernaehrungsschaetzung existiert NUR im Buddy-Chat — aber der Mahlzeit-Dialog weiss davon nichts. | A1,A2,A3,A5,B3,B4,B5,E2,E4 | KI-Button im Mahlzeit-Dialog: "Per KI schaetzen" — schickt Bezeichnung an Buddy und fuellt Makros automatisch |
| ❌2 | **HOCH** | **Kein Profil-Onboarding**: Nach Registrierung landet der User auf leerem Cockpit. Kein Wizard, kein "Erzaehl mir ueber dich", kein geführter Setup. Der gelbe Banner "Profil ausfuellen fuer BMR-Berechnung" ist leicht uebersehbar. | A1,A2,A3,A5,E2 | Onboarding-Wizard nach Registrierung: Name → Alter/Groesse/Gewicht → Ziel → Erfahrung → Equipment → Fertig |
| ❌3 | **HOCH** | **Keine Allergien/Ernaehrungsform im Profil**: Kein Feld fuer Vegetarier, Veganer, Halal, Laktosefrei, Glutenfrei, Allergien (Erdnuesse etc.). KI-Trainingsplan und Buddy kennen diese Info nicht. | A4(Vegetarierin), A5(Erdnussallergie), E2(Halal), B4 | Profil-Sektion "Ernaehrungspraeferenzen": Checkboxen + Freitext-Allergien. An KI-Context uebergeben. |
| ❌4 | **HOCH** | **Kein Menstruationszyklus-Tracking**: Frauen koennen Zyklusphasen nicht loggen. Keine Korrelation Zyklus↔Leistung. Kein RED-S/FAT/Amenorrhoe-Warnsystem. | E1,E3,E4,E5,B2,B4,C3,C5 | Zyklus-Tracker: Phaseneingabe (Follikel/Luteal/Menstruation), Symptome, Leistungskorrelation |
| ❌5 | **MITTEL** | **Medikament-Tab zeigt PED-Disclaimer**: "Hinweis zu leistungssteigernden Substanzen" erscheint auch wenn Monika ihr L-Thyroxin als Medikament loggen will. Verwirrend und abschreckend fuer regulaere Medikamente. | A2,E2(Metformin),E5(HRT) | Disclaimer nur bei TRT/PED anzeigen, nicht bei Medikament/Supplement/Sonstige |
| ❌6 | **MITTEL** | **Kein Blutbild-Logging**: Nur Blutdruck wird getrackt. Keine Laborwerte (Testosteron, LH, FSH, Haematokrit, HDL, LDL, Leberwerte, PSA, IGF-1 etc.). Fuer Enhanced-User essentiell. | D1-D5, C2,C5 | Medizin-Sektion "Laborwerte": Vordefinierte Felder + Freitext, Trends, Warnschwellen (Hkt>54%, HDL<25) |
| ❌7 | **MITTEL** | **Kein Mahlzeit-Reminder-Typ**: Erinnerungen nur fuer Substanzen, Blutdruck, Koerpermessung, Custom. Stefan (A1) vergisst Mahlzeiten zu loggen — kein dedizierter Reminder dafuer. | A1,A2,B3,B5,E2,E4 | Neuen Reminder-Typ "meal_logging" mit 3x taeglich Option |
| ❌8 | **MITTEL** | **Datumsformat in Datumswechsler**: "2026-02-28" (ISO-Format) statt "28. Februar 2026" oder "28.02.2026". Fuer Ralf (B5, technik-scheu) verwirrend. | B5,A1,A2 | de-DE Formatierung: `new Date().toLocaleDateString('de-DE')` |
| ❌9 | **NIEDRIG** | **Kein Medizinische-Vorerkrankungen-Feld**: Monika (Bandscheibe), Elena (Hashimoto), Fatima (PCOS) koennen Vorerkrankungen nirgends im Profil hinterlegen. Buddy weiss es nicht, kann also nicht warnen. | A2,A4,E2,B4,E4 | Profil: "Gesundheitliche Einschraenkungen" Freitext + Tags (Ruecken, Schulter, Knie, etc.) → an KI-Context |
| ❌10 | **NIEDRIG** | **Cockpit-Makro-Karten zeigen Standard-Ziele**: 2000 kcal, 150g Protein, 250g KH, 65g Fett — obwohl Profil unvollstaendig. Fuer Viktor (D2, 4000 kcal) oder Karim (A3, 1800 kcal Ist) irrefuehrend. | Alle ohne ausgefuelltes Profil | Keine Standard-Ziele anzeigen bis Profil vollstaendig. Stattdessen: "Profil ausfuellen" CTA. |

---

## 2. FINDINGS PRO NUTZERGRUPPE

### Gruppe A: Einsteiger (Standard-Modus)

#### A1 — Stefan (42, Bueroangestellter, 98kg, Anfaenger)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **Freitext-Mahlzeit "Doener mit alles"** | Im Mahlzeit-Dialog: NUR manuell. Im Buddy-Chat: KI-Schaetzung moeglich. Aber Stefan weiss das nicht — es gibt keinen Hinweis. | ⚠️ UX-Luecke |
| **Erinnerungen zum Logging** | Kein Mahlzeit-Reminder-Typ. Muss Custom-Reminder anlegen — zu umstaendlich fuer Anfaenger. | ⚠️ Feature fehlt |
| **Trainingsplan ohne Gym** | Kann "Kurzhantel-Set" im Geraetepark waehlen. Buddy generiert passenden Plan. | ✅ Funktioniert |
| **Fachbegriffe vermeiden** | Buddy antwortet auf Deutsch, aber Glossar-Skill nutzt Fachsprache. Kein "Einfache Sprache"-Modus. | ⚠️ Nice-to-have |
| **Ramipril als Medikament loggen** | Medikament-Tab existiert, aber PED-Disclaimer erscheint. Verwirrend. | ❌ Bug/UX |
| **Praediabetes/BMR** | Profil hat keine Vorerkrankungen. Buddy weiss nicht von HbA1c 5.9%. | ⚠️ Feature fehlt |

#### A2 — Monika (55, Lehrerin, Ruecken, Schilddruese)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **Rueckenschonende Uebungen** | Geraetepark hat keine "Einschraenkungen"-Option. Buddy kann theoretisch darauf eingehen, aber Profil speichert es nicht. | ⚠️ Feature fehlt |
| **L-Thyroxin loggen** | Medikament-Tab zeigt PED-Disclaimer. | ❌ UX-Problem |
| **Schilddruesen-Wechselwirkungen** | Buddy hat medical + supplements Skills — kann theoretisch Interaktionen erkennen. Aber ohne Profil-Daten wird nicht proaktiv gewarnt. | ⚠️ Passiv |
| **Osteopenie** | Kein Knochendichte-Tracking. DEXA-Werte koennen nicht geloggt werden. | ⚠️ Feature fehlt |

#### A3 — Karim (28, Lagerist, will "breit" werden)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **"Nur Brust/Bizeps" erkennen** | Buddy kann Trainingslog analysieren und einseitige Verteilung erkennen. Aber kein automatischer Hinweis. | ✅ Moeglich |
| **Schnelle Ergebnisse erwarten** | Keine Prognose-Funktion ("In X Wochen erreichst du Y"). Cockpit zeigt nur Vergangenheitsdaten. | ⚠️ Feature fehlt |
| **Voice-Input** | Buddy hat Mikrofon-Button. Karim kann per Sprache loggen. | ✅ Gut |
| **Lange Buddy-Antworten** | Keine "Kurzantwort"-Option im Buddy. Immer ausführlich. | ⚠️ Nice-to-have |

#### A4 — Elena (34, Vegetarierin, Hashimoto, Home-Gym)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **Vegetarische Praeferenz** | Kein Profil-Feld. Buddy weiss es nur wenn sie es sagt. Bei jeder neuen Session vergessen. | ❌ Feature fehlt |
| **Hashimoto im Profil** | Keine Vorerkrankungen. Buddy kann nicht proaktiv darauf eingehen. | ❌ Feature fehlt |
| **Widerstandsbaender-Plan** | Geraetepark: "Widerstandsband" vorhanden → Buddy generiert passende Plaene. | ✅ Funktioniert |
| **Schlaf-Training-Korrelation** | Buddy hat sleep-Skill, aber kein Schlaf-Tracking-Feature in der App (nur Tagesform-Emoji). | ⚠️ Rudimentaer |

#### A5 — Hassan (19, Azubi, fragt nach SARMs)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **SARMs-Frage** | Substanz-Agent hat anabolics-Skill mit SARM-Info. Antwortet neutral-informativ mit Risiken. | ✅ Gut |
| **Erdnussallergie** | Kein Allergie-Feld im Profil. Buddy-Ernaehrungsempfehlungen koennen Erdnuesse enthalten. | ❌ Risiko! |
| **Uebertraining erkennen** | Kein automatisches Uebertraining-Warnsystem bei 7x/Woche. Buddy kann es nur ansprechen wenn gefragt. | ⚠️ Passiv |
| **Gamification/Badges** | CelebrationProvider existiert (Konfetti + Toast bei Meilensteinen). Aber keine Badges/Leaderboard. | ⚠️ Teilweise |

### Gruppe B: Fortgeschrittene

#### B1 — Thomas (31, Entwickler, Recomp)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **Graphen und Trends** | Cockpit: Wochen-Kalorien-Chart. Koerper-Tab: Gewichtsverlauf, FFMI. Analyse-Agent fuer Fortschrittsbewertung. | ✅ Gut |
| **200+ Mahlzeiten Performance** | Supabase mit RLS. Paginierung nicht sichtbar — koennte bei vielen Daten langsam werden. | ⚠️ Testen |
| **Recomp-Tracking** | Kein dedizierter "Recomp-Modus". Muss Gewicht + KFA + Kraftwerte parallel verfolgen. | ⚠️ Moeglich aber umstaendlich |
| **Datenexport** | Share-Card Generator, Trainingsplan-PDF, QR-Code. Kein CSV-Export der eigenen Daten. | ⚠️ Teilweise |

#### B2 — Julia (27, Physiotherapeutin, Powerlifting)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **Zyklus-Periodisierung** | Kein Zyklus-Tracking. Kann Leistung nicht mit Menstruationsphasen korrelieren. | ❌ Feature fehlt |
| **Periodisierung** | Trainingsplaene haben Split-Typen aber keine formale Periodisierung (Hypertrophie→Kraft→Peak). | ⚠️ Manuell moeglich |
| **Powerlifting-Meet Vorbereitung** | Kein Wettkampf-Countdown, kein Peak-Planer. Nur Training-Skill hat Wettkampf-Wissen. | ⚠️ Nur via Buddy |

#### B3 — Marco (38, Feuerwehrmann, Schichtarbeit)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **Schichtarbeit-Tagesrhythmus** | App nutzt feste Mahlzeit-Kategorien (Fruehstueck/Mittag/Abend/Snack). Bei 24h-Schicht unklar wann "Fruehstueck" ist. | ⚠️ Rigid |
| **Sporadisches Logging** | Keine Luecken-Erkennung ("Du hast 3 Tage nicht geloggt"). Kein Re-Engagement. | ⚠️ Feature fehlt |
| **Schlaf bei Nachtschicht** | Nur Tagesform-Emoji fuer Schlaf. Kein Schlafzeiten-Tracking. | ⚠️ Rudimentaer |

#### B4 — Aylin (25, Studentin, nur Glutes)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **"Du isst zu wenig" kommunizieren** | Buddy kann analysieren aber keine automatische Warnung bei <1200 kcal. | ⚠️ Passiv |
| **L-Carnitin Evidenz** | Supplements-Skill hat Evidenzgrade. Buddy kann "Evidenz C" kommunizieren. | ✅ Gut |
| **Pille als Substanz** | Medikament-Tab: Freitext moeglich. Aber PED-Disclaimer stoert. | ⚠️ UX |
| **Foto statt Wiegen** | Kein Foto-basiertes Mahlzeit-Logging (nur Screenshot-Import fuer Waage). | ❌ Feature fehlt |

#### B5 — Ralf (48, Elektriker, technik-scheu)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **Grosse Schrift** | Keine Schriftgroessen-Einstellung in der App. System-Accessibility muss genutzt werden. | ⚠️ Feature fehlt |
| **Zu viele Optionen** | Profil hat 52 Geraete, 5 Ziele, 3 Modi, etc. Kein "Einfach"-Modus. | ⚠️ Komplex |
| **Bier-Tracking** | Alkohol hat keine eigene Kategorie. Muss als Snack geloggt werden ("2 Bier, 300 kcal"). | ⚠️ Umstaendlich |
| **Plateau erkennen** | Analyse-Agent kann Plateau theoretisch erkennen. Aber kein proaktiver Hinweis. | ⚠️ Passiv |

### Gruppe C: Power-User

#### C1 — Dominik (29, Contest Prep)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **Peak-Week-Planer** | Nicht vorhanden. Competition-Skill hat Wissen, aber kein UI. | ❌ Feature fehlt |
| **6 Mahlzeiten/Tag** | Nur 4 Kategorien (F/M/A/S). Kann mehrere "Snacks" loggen, aber unuebersichtlich. | ⚠️ Eingeschraenkt |
| **Posing als Training** | Training-Typen: Yoga vorhanden, aber kein "Posing"-Typ. Muss als "Custom" geloggt werden. | ⚠️ Workaround |
| **Conditioning-Tracking** | Kein Wasser-/Natrium-/Carb-Load Tracker fuer Peak Week. | ❌ Feature fehlt |

#### C2 — Nils (34, natuerliches Limit, erwaegt TRT)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **"Lohnt sich TRT?" Beratung** | Substance-Agent mit anabolics-Skill kann neutral informieren. Kein Pushen. | ✅ Gut |
| **Natural-Limit Einschaetzung** | FFMI wird berechnet. Buddy kann theoretisch FFMI ~25 als Limit kommunizieren. | ✅ Moeglich |
| **Testosteron 3.8 ng/ml einordnen** | Kein Blutbild-Logging. Kann Buddy im Chat fragen. | ⚠️ Nur Chat |

#### C3 — Lisa (30, Crossfit)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **2x taeglich Training** | Training-Log erlaubt mehrere Eintraege/Tag. Funktioniert. | ✅ Gut |
| **Olympic Lifts** | Trainingsplan-Uebungen: frei definierbar. Clean/Snatch moeglich. | ✅ Gut |
| **MFP-Import** | Kein MyFitnessPal Import. Nur manuell oder Screenshot-Import. | ❌ Feature fehlt |
| **WOD-Zeiten** | Kein spezifisches Crossfit-Metrik-Feld (WOD-Zeit, Row-Erg, etc.). | ⚠️ Feature fehlt |

#### C4 — Jan (26, Gym-Besitzer, testet fuer Kunden)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **KI-Trainingsplan-Qualitaet** | Buddy generiert Plaene basierend auf Equipment + Ziel. Qualitaet abhaengig vom LLM. | ⚠️ LLM-abhaengig |
| **Turkesteron-Evidenz** | Supplements-Skill: Turkesteron nicht in Presets. Buddy kann trotzdem informieren. | ⚠️ Nicht vordefiniert |
| **App fuer Kunden empfehlen** | Kein Trainer-/Coach-Modus. Kein Multi-User-Management. | ❌ Feature fehlt |

#### C5 — Petra (44, Aerztin, Perimenopause)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **Quellenangaben** | Skills haben PMIDs und Quellen. Buddy zitiert sie aber nicht proaktiv in Antworten. | ⚠️ Nicht sichtbar |
| **Perimenopause** | femaleFitness-Skill erwaehnt Perimenopause. Aber kein UI-Support. | ⚠️ Nur Wissen |
| **Laborwerte loggen** | Kein Blutbild-Feature. Nur Blutdruck. | ❌ Feature fehlt |

### Gruppe D: Enhanced (Power+)

#### D1 — Timo (43, TRT + Wegovy, Referenz-User)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **TRT loggen** | TRT-Tab mit Presets (Test Enantat/Cypionat). Dosierung, Frequenz, Injektionsstelle. Auto-Reminder. | ✅ Exzellent |
| **Wegovy loggen** | GLP-1 Preset vorhanden (Semaglutid/Wegovy). Subkutan-Kategorie. | ✅ Exzellent |
| **Haematokrit-Warnung** | Kein Blutbild-Logging → kein automatischer Hkt-Alert bei >52%. | ❌ Feature fehlt |
| **Arztbericht generieren** | Kein PDF-Arztbericht-Export. Nur Share-Card und Trainingsplan-PDF. | ❌ Feature fehlt |
| **Semaglutid-Interaktionen** | Buddy hat medical-Skill. Kann Interaktionen theoretisch erkennen. | ⚠️ Nur Chat |

#### D2 — Viktor (35, Multi-Compound-Zyklus)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **Multi-Compound loggen** | Jede Substanz einzeln hinzufuegen (Test + Boldenon + Anavar + AI + HCG). Funktioniert. | ✅ Gut |
| **Zyklus-Kalender** | Kein visueller Zykluskalender (Start/Ende, On/Off, Blast/Cruise). | ❌ Feature fehlt |
| **Haematokrit 52%** | Nicht loggbar, keine Warnung. | ❌ Feature fehlt |
| **HDL 28 mg/dl** | Nicht loggbar, keine Warnung. | ❌ Feature fehlt |
| **"Nicht moralisieren"** | Buddy im Power+-Modus informiert neutral. Kein "Doping ist gefaehrlich". | ✅ Gut |

#### D3 — Alexander (50, TRT + HGH, Anti-Aging)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **HGH loggen** | PED-Preset vorhanden ("HGH"). Dosierung + Frequenz. | ✅ Gut |
| **PSA-Trend** | Kein Laborwert-Tracking. | ❌ Feature fehlt |
| **IGF-1-Monitoring** | Kein Laborwert-Tracking. | ❌ Feature fehlt |
| **IF + Trainingstiming** | Keine Intermittent-Fasting Unterstützung in der App. | ⚠️ Feature fehlt |

#### D4 — Kevin (27, Influencer, Blast: Test+Tren+Mast)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **Trenbolon-NW erkennen** | Buddy hat anabolics-Skill mit Tren-Info (Schlaf, Prolaktin, Kardio). | ✅ Gut |
| **350g Protein als "zu viel" kommunizieren** | Buddy kann bei Analyse darauf hinweisen. Kein automatischer Alert. | ⚠️ Passiv |
| **Share-Cards fuer Instagram** | Share-Card Generator existiert (Dark-Theme, PNG-Export). | ✅ Gut |
| **Blast/Cruise loggen** | Kein formaler Blast/Cruise-Status. Substanzen einzeln An/Aus. | ⚠️ Workaround |

#### D5 — Sergei (38, PCT)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **PCT-Timeline** | PCT-Skill vorhanden mit Wissen. Aber kein PCT-Kalender/Countdown in der App. | ⚠️ Nur Wissen |
| **Nolvadex loggen** | Supplement-Presets enthalten kein Nolvadex. Aber PED-Tab hat Tamoxifen. | ✅ Vorhanden |
| **Clearance-Berechnung** | Buddy kann theoretisch Clearance-Zeit berechnen (Ester → HWZ). Kein UI-Tool. | ⚠️ Nur Chat |
| **Emotionale Unterstuetzung** | Buddy antwortet empathisch. Kein Stimmungs-Tracking ausser Tagesform-Emoji. | ⚠️ Rudimentaer |

### Gruppe E: Frauen

#### E1 — Sarah (22, Bikini-Prep)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **12-Wochen Prep-Countdown** | Kein Wettkampf-Countdown in der App. Zieldatum im Profil, aber kein Countdown-Widget. | ❌ Feature fehlt |
| **Zyklus + Training Korrelation** | Kein Zyklus-Tracking. | ❌ Feature fehlt |
| **RED-S Warnung bei aggressivem Cut** | Keine automatische Warnung bei <1200 kcal + hohem Volumen. | ❌ Sicherheitsluecke |
| **Progressive Deficit Planning** | Kein Makro-Periodisierungs-Tool. Ziel manuell aendern. | ⚠️ Manuell |

#### E2 — Fatima (32, PCOS, Halal)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **PCOS-Ernaehrung** | Kein PCOS-spezifischer Modus. Buddy hat medical-Skill mit Grundwissen. | ⚠️ Nur Chat |
| **Halal-Ernaehrung** | Kein Profil-Feld. KI weiss nicht automatisch. | ❌ Feature fehlt |
| **Emotional Eating erkennen** | Tagesform hat "Stress"-Emoji. Aber keine Korrelation Stress→Ueberessen. | ⚠️ Rudimentaer |
| **Home-Training ohne Equipment** | Geraetepark: "Koerpergewicht" Kategorie (8 Bodyweight-Uebungen). Yogamatte nicht explizit, aber funktioniert. | ✅ Moeglich |
| **Ermutigende Antworten** | Buddy-Tone abhaengig vom LLM. Keine "Sanft"-Einstellung. | ⚠️ LLM-abhaengig |

#### E3 — Katharina (40, Perimenopause)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **Perimenopause-Support** | femaleFitness-Skill erwaehnt Thema. Kein UI-Feature. | ⚠️ Nur Wissen |
| **DEXA-Werte loggen** | Koerpermessungen haben KFA + Muskelmasse, aber keine Knochendichte. | ⚠️ Teilweise |
| **60-Min-Limit fuer Workouts** | Trainingsplaene haben keine Zeitbegrenzung. User muss Buddy bitten. | ⚠️ Manuell |

#### E4 — Lena (29, Mutter, Rektusdiastase)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **Rektusdiastase-Warnung** | Keine Kontraindikations-Warnungen in Trainingsplaenen (kein "Keine Crunches!"). | ❌ Sicherheitsluecke |
| **20-Min-Workouts** | Trainingsplan hat kein Zeitlimit-Feld. Buddy muss gefragt werden. | ⚠️ Manuell |
| **Workout mit Unterbrechungen** | Timer hat Pause-Funktion. Workout kann pausiert und fortgesetzt werden. | ✅ Funktioniert |
| **Stillen + Kalorienbedarf** | Keine Stillzeit-Info im Profil. TDEE-Berechnung beruecksichtigt es nicht. | ❌ Feature fehlt |

#### E5 — Nina (47, HRT, Perimenopause)

| Aspekt | Finding | Status |
|--------|---------|--------|
| **HRT loggen** | Medikament-Tab: Oestradiol-Gel + Progesteron als Freitext moeglich. Aber PED-Disclaimer stoert. | ⚠️ UX-Problem |
| **Schlaf-Tracking** | Nur Tagesform "Schlaf"-Emoji (1-5). Kein Schlafzeiten/Phasen/HRV-Tracking. | ⚠️ Rudimentaer |
| **Hitzewallungen loggen** | Nicht moeglich. Kein Symptom-Tracker. | ❌ Feature fehlt |
| **Dashboard mit allen Daten** | Cockpit zeigt Kalorien + Makros + Wochen-Chart. Kein "All-in-One" Executive Dashboard. | ⚠️ Ausbaufaehig |

---

## 3. PRIORISIERTE FEATURE-REQUESTS

### P0 — Kritisch (sollte vor naechstem Release)

| # | Feature | Aufwand | Begruendung | Betroffene Twins |
|---|---------|---------|------------|-----------------|
| 1 | **KI-Button im Mahlzeit-Dialog** | 4h | Bezeichnung → Buddy-API → Makros auto-fill. Kernproblem fuer 60% der Nutzer. | A1-A5,B3-B5,E2,E4 |
| 2 | **Profil: Ernaehrungspraeferenzen + Allergien** | 3h | Checkboxen (Vegan/Vegetarisch/Halal/Glutenfrei/Laktosefrei) + Freitext-Allergien → KI-Context | A4,A5,E2,B4 |
| 3 | **Medikament-Disclaimer fixen** | 30min | PED-Disclaimer NUR bei TRT/PED Tabs, nicht bei Medikament/Supplement/Sonstige | A2,E2,E5 |
| 4 | **Profil: Gesundheitliche Einschraenkungen** | 3h | Tags (Ruecken, Schulter, Knie, Schwanger, Rektusdiastase) + Freitext → KI-Context + Trainingsplan-Warnung | A2,E4,B3 |

### P1 — Wichtig (naechste 2-4 Wochen)

| # | Feature | Aufwand | Begruendung | Betroffene Twins |
|---|---------|---------|------------|-----------------|
| 5 | **Onboarding-Wizard** | 8h | Gefuehrtes Profil-Setup nach Registrierung (5 Schritte, Mobile-optimiert) | A1-A5,E2 |
| 6 | **Blutbild/Laborwerte-Tracking** | 12h | Vordefinierte Felder (Testosteron, Hkt, HDL, LDL, ALT, PSA, etc.) + Trends + Warnschwellen | D1-D5,C2,C5 |
| 7 | **Menstruationszyklus-Tracker** | 10h | Phaseneingabe + Symptome + Leistungskorrelation | E1-E5,B2,C3 |
| 8 | **Mahlzeit-Reminder-Typ** | 2h | Neuer Reminder-Typ mit 3x taeglich Standard | A1,B3,E2,E4 |
| 9 | **Datumsformat de-DE** | 1h | "28. Feb. 2026" statt "2026-02-28" im Datumswechsler | Alle DE-Nutzer |

### P2 — Nice-to-Have (naechste 1-3 Monate)

| # | Feature | Aufwand | Begruendung | Betroffene Twins |
|---|---------|---------|------------|-----------------|
| 10 | **Wettkampf-Countdown** | 6h | Zieldatum → Dashboard-Widget mit Tagen bis Wettkampf, Phase-Tracker | C1,E1,D2 |
| 11 | **Blut-/Zyklus-Kalender fuer AAS** | 8h | Blast/Cruise/PCT Phasen visuell, Clearance-Timer, Blutbild-Faelligkeiten | D2,D4,D5 |
| 12 | **CSV-Export eigener Daten** | 4h | Mahlzeiten, Training, Koerper, Substanzen als CSV/JSON Download | B1,C4 |
| 13 | **Schriftgroessen-Option** | 2h | Klein/Normal/Gross in Profil-Einstellungen | B5,A2 |
| 14 | **Luecken-Erkennung** | 4h | "Du hast 3 Tage nicht geloggt — alles OK?" Push/In-App | A1,B3,E4 |
| 15 | **Schlaf-Tracking (Zeiten)** | 6h | Einschlaf-/Aufwachzeit, Qualitaet, → Korrelation mit Training | A4,E5,D4 |
| 16 | **Mahlzeit-Kategorien erweitern** | 2h | 6 statt 4: Fruehstueck, Vormittag, Mittag, Nachmittag, Abend, Spaet | C1,B3 |
| 17 | **Buddy-Kommunikationsstil** | 3h | Einstellung: Knapp/Normal/Ausfuehrlich + Fachsprache-Level (Anfaenger/Fortgeschritten) | A1,A3,C5 |

---

## 4. SICHERHEITSRELEVANTE FINDINGS

| # | Schwere | Finding | Risiko | Loesung |
|---|---------|---------|--------|---------|
| 🔴1 | **HOCH** | Kein Allergie-Feld → KI koennte Erdnuss-Rezepte fuer Hassan (A5) vorschlagen | Gesundheitsgefahr | P0: Allergie-Feld im Profil, KI-Context, Warnhinweis |
| 🔴2 | **HOCH** | Kein RED-S/Untergewicht-Warnsystem → Sarah (E1) koennte in gefaehrlich tiefes Defizit rutschen | Gesundheitsgefahr | Automatische Warnung bei BMI <18.5 ODER Defizit >1000 kcal ODER <1200 kcal Frau |
| 🟡3 | **MITTEL** | Kein Rektusdiastase-Kontraindikations-Check → Lena (E4) koennte Crunches in KI-Plan bekommen | Verletzungsgefahr | Gesundheits-Tags → Trainingsplan-Filter (keine Crunches bei Rektusdiastase) |
| 🟡4 | **MITTEL** | Kein Haematokrit-Alert → Viktor (D2) bei 52% ohne Warnung | Thromboserisiko | Blutbild-Feature mit Schwellenwert-Alerts |
| 🟢5 | **NIEDRIG** | PED-Disclaimer bei Medikamenten → Monika (A2) koennte denken App ist "fuer Doper" | Nutzer-Abschreckung | Disclaimer nur bei TRT/PED Tabs |

---

## 5. KI-QUALITAET — BUDDY-BEWERTUNG

### Staerken
- **Multi-Agent-System** mit 8 spezialisierten Agents (Buddy/Essen/Training/Substanzen/Analyse/Medizin/Beauty/Lifestyle)
- **16 Skills** mit ~50.000+ Tokens Fachwissen (alle mit PMIDs/Quellen)
- **Voice-Input** funktioniert auf Deutsch und Englisch
- **Inline-Chat** auf jeder Seite — kein Kontextwechsel noetig
- **Modus-bewusst**: Power+-Agent hat andere Skills als Standard-Agent

### Schwaechen
- **Kein proaktives Warnsystem**: Buddy warnt nur wenn gefragt, nicht automatisch bei gefaehrlichen Mustern
- **Kein Kontext-Persistence**: Buddy "vergisst" Allergien/Praeferenzen zwischen Sessions (sessionStorage)
- **Keine Quellenangaben in Antworten**: Skills haben PMIDs, aber Buddy zitiert sie nicht
- **Kein Kommunikationsstil-Setting**: Immer gleicher Ton fuer A1(Stefan, Anfaenger) und C1(Dominik, Profi)

---

## 6. ZUSAMMENFASSUNG: TOP-5 SOFORT-MASSNAHMEN

1. **KI-Button im Mahlzeit-Dialog** — Groesster UX-Pain-Point fuer die Mehrheit der Nutzer
2. **Allergie- + Ernaehrungsform-Feld** — Sicherheitsrelevant (Erdnussallergie!)
3. **Medikament-Disclaimer fixen** — 30-Minuten-Fix, grosse Wirkung
4. **Gesundheits-Einschraenkungen im Profil** — Sicherheitsrelevant (Rektusdiastase, Ruecken)
5. **Onboarding-Wizard** — Entscheidend fuer Erstnutzer-Retention

---

## Anhang: Test-Abdeckung

| Seite | Visuell getestet | Code analysiert | Twins-relevant |
|-------|-----------------|----------------|---------------|
| Login/Register | ✅ | ✅ | A1-A5, E2 |
| Cockpit | ✅ Komplett (Tagesform, Makros, Chart, Empfehlungen) | ✅ | Alle |
| Ernaehrung | ✅ (Mahlzeit-Dialog, Koerper-Tab, Imports) | ✅ | Alle |
| Training | ✅ (Heute, Mein Plan, Historie) | ✅ | Alle |
| Medizin | ✅ (BD, Substanzen, Erinnerungen, alle 5 Tabs) | ✅ | D1-D5, A2, C2 |
| Profil | ✅ Komplett (Daten, Ziele, Modus, Geraetepark) | ✅ | Alle |
| Buddy | ✅ (Chat, Tutorial, Tabs, Voice) | ✅ | Alle |
| Workout-Modus | ❌ (nicht live getestet, Code analysiert) | ✅ | B1-B5, C1-C4 |
