# Konzept: Zyklus-Integration in Training & Ernaehrung

> **Version:** 1.0 | **Erstellt:** 2026-03-07 | **Autor:** Claude / Entwickler
>
> **Ziel:** Der Menstruationszyklus soll auf Wunsch (opt-in) in Training, Ernaehrung
> und KI-Beratung beruecksichtigt werden. Evidenzbasiert, nicht-invasiv, inklusiv.

---

## 1. Wissenschaftliche Grundlage

### Zyklusphasen & Training

| Phase | Tage | Hormone | Training-Empfehlung |
|-------|------|---------|---------------------|
| Menstruation | 1-5 | OEstrogen/Progesteron niedrig | Leicht bis moderat, Endorphine lindern Kraempfe |
| Follikelphase | 6-13 | OEstrogen steigt | **Beste Phase fuer Kraft** — PR-Versuche, HIIT, Maximalkraft |
| Ovulation | ~14 | OEstrogen-Peak | Leistungs-Peak, aber ACL-Verletzungsrisiko erhoeht |
| Lutealphase | 15-28 | Progesteron dominiert | Moderate Intensitaet, RPE subjektiv hoeher, natuerlicher Deload |

**Quellen:**
- Niering et al. 2024, Sports (MDPI) — Meta-Analyse, SMD=0.60 fuer Kraft in Follikelphase
- NSCA Strength & Conditioning Journal 2025 — Kein Vorteil starrer zyklusbasierter Periodisierung
- Frontiers in Sports 2023 (Umbrella Review) — Individuelles Befinden wichtiger als Phase

**Konsens:** Kein starres Phasen-Schema. Tracking dient der Mustererkennung und Selbstwahrnehmung.
Die Tagesform (RPE, Energie, Stimmung) ist der primaere Trainingssteuerungs-Parameter.

### Zyklusphasen & Ernaehrung

| Phase | Kalorien | Fokus-Naehrstoffe |
|-------|----------|-------------------|
| Menstruation | Normal | Eisen (Blutverlust), Magnesium (Kraempfe), Omega-3 |
| Follikelphase | Normal | Carbs optimal verwertet, Zink |
| Ovulation | Normal | Carbs fuer Peak-Leistung, Zink |
| Lutealphase | **+100-300 kcal/Tag** | Protein hoeher, Magnesium, B6, Calcium, Tryptophan |

**Quellen:**
- PLOS One Meta-Analyse — Signifikant erhoehter RMR in Lutealphase (ES=0.33)
- PMC Minerals & Menstrual Cycle 2024 — Eisen, Zink, Magnesium, Selen

---

## 2. IST-Zustand in FitBuddy

### Vorhanden
- DB: `menstrual_cycle_logs` (phase, flow, 8 symptoms, energy, mood, notes)
- UI: `AddCycleLogDialog` (Bottom-Sheet, MedicalPage)
- Hook: `useMenstrualCycleLogs`, `estimateCyclePhase()`
- Gender-Gating: `female | other`
- i18n: 22 Keys `cycle.*` in 17 Sprachen
- HealthContext: `recentCycleLogs` Feld existiert
- Skill: `FEMALE_FITNESS_SKILL` (2200 Token, 7 PMIDs)

### Luecken
1. femaleFitness-Skill in keinem AGENT_SKILL_MAP → Buddy hat kein Zykluswissen
2. recentCycleLogs nicht in buildUserSkillData() → Buddy sieht keine Eintraege
3. Kein Date-Picker → nur "heute" eintragbar
4. Kein Opt-in Toggle → nur Gender-Gate
5. Keine Trainings-/Ernaehrungs-Anpassung basierend auf Phase
6. Kein Cockpit-Widget
7. Nur 8 Symptome (Clue hat 100+)
8. Keine Visualisierung, keine Mustererkennung

---

## 3. Implementierungsplan

### Prioritaet 1 — Quick Wins (Luecken schliessen)

**P1.1: femaleFitness-Skill aktivieren**
- `src/lib/ai/skills/index.ts` → AGENT_SKILL_MAP
- Hinzufuegen zu: training, nutrition, medical Agenten
- Bedingt laden: nur wenn Profil gender=female/other (Token-Effizienz)

**P1.2: Zyklusdaten in AI-Prompt**
- `src/lib/ai/skills/userSkills.ts` → UserSkillData erweitern
- `src/lib/ai/agents/baseAgent.ts` → buildUserSkillData() ergaenzen
- Neuer User-Skill-Generator: `generateCycleSkill()`

**P1.3: Date-Picker im AddCycleLogDialog**
- Datum-Auswahl (letzte 7 Tage) statt nur "heute"
- Wochen-Slider inspiriert von Clue-Screenshot

**P1.4: Opt-in Toggle im Profil**
- `enable_cycle_tracking` Boolean in profiles (DB + Type)
- Toggle in ProfilePage neben Breastfeeding
- useGenderFeatures erweitern: `showCycleTracker` beruecksichtigt Opt-in
- Fuer female/other: Default ein, abschaltbar
- Fuer alle anderen: Default aus, einschaltbar (inklusiv fuer trans Maenner)

### Prioritaet 2 — Training/Ernaehrungs-Integration

**P2.1: Zyklus-Triggers in Deviations**
- `src/lib/ai/deviations.ts` → 4 neue Trigger:
  1. Lutealphase + intensives Training → Hinweis auf moderate Intensitaet
  2. Menstruation + niedrige Energie → Recovery-Empfehlung
  3. Ovulation → ACL-Risiko-Hinweis bei Sprungtraining
  4. Allgemein: aktuelle Phase als Kontext-Info fuer Buddy

**P2.2: Ernaehrungs-Kontext**
- Lutealphase: "Etwas mehr Hunger ist physiologisch normal"
- Menstruation: "Eisenreiche Lebensmittel priorisieren"
- In Deviations als nutrition-Agent-Suggestions

**P2.3: Trainings-Hinweise**
- Follikelphase: "Gute Phase fuer intensive Einheiten"
- Lutealphase: "RPE kann hoeher ausfallen — das ist normal"
- Als Suggestion-Chips im Buddy

**P2.4: Cockpit-Widget**
- Neue Komponente: `CyclePhaseWidget`
- Mini-Karte: Phase-Emoji + Name + Tagesstipp
- Position: nach WaterWidget, vor Insights
- Nur sichtbar wenn Zyklus-Tracking aktiviert

### Prioritaet 3 — Erweiterte Features

**P3.1: Erweiterte Symptome**
- 12 neue Symptome: sleep_issues, hot_flashes, urinary_frequency,
  concentration_issues, libido_changes, back_pain, joint_pain,
  nausea, dizziness, appetite_changes, skin_changes, irritability
- CycleSymptom-Type erweitern, i18n ergaenzen

**P3.2: Zyklus-Visualisierung**
- Timeline-Ansicht: letzte 3 Zyklen als Farb-Balken
- Phase-Farben: rot (Menstruation), gruen (Follikel), amber (Ovulation), lila (Luteal)
- Neue Komponente: `CycleTimeline`

**P3.3: Muster-Erkennung**
- Hook: `useCyclePatterns(logs)` → analysiert Energie/Stimmung pro Phase
- "In deiner Lutealphase ist dein Energie-Level im Schnitt X Punkte niedriger"
- Darstellung als Summary-Text im Widget

**P3.4: Arzt-Export**
- Zyklusdaten in bestehenden PDF-Report (DoctorReport) integrieren
- Letzte 3 Monate: Phasen, Dauer, Symptome, Schmerz-Rating

---

## 4. UX-Prinzipien

1. **Opt-in, nie Opt-out** — Feature bewusst aktivieren
2. **Nicht-invasiv** — kein Push-Druck, kein "Du hast nicht geloggt!"
3. **Inklusiv** — auch fuer trans Maenner, non-binary, unabhaengig vom Geschlecht
4. **Evidenzbasiert** — keine starren Phasen-Regeln, sondern Kontext + Befinden
5. **Quick-Log** — Emoji-Kacheln, 1-2 Taps, keine Pflichtfelder
6. **Datenschutz** — Zyklusdaten = Art. 9 DSGVO, EU-Server, explizit kommunizieren
7. **Kein Schwangerschafts-Default** — keine Fertilitaets-Sprache

---

## 5. Datenschutz-Hinweis

Zyklusdaten fallen unter **DSGVO Art. 9 (Gesundheitsdaten)**:
- Bereits abgedeckt durch bestehende Einwilligung (user_consents)
- Server in DE (Hetzner Nuernberg), kein US-Subprocessor
- Im Opt-in-Dialog explizit erwaehnen: "Deine Daten bleiben in Deutschland"

---

## 6. Verifikation

- [ ] femaleFitness-Skill wird von training/nutrition/medical Agent geladen
- [ ] Buddy kennt aktuelle Zyklusphase und kann darauf eingehen
- [ ] Date-Picker erlaubt Nachtragen der letzten 7 Tage
- [ ] Opt-in Toggle funktioniert (ein/aus), Gender-unabhaengig
- [ ] Cockpit-Widget zeigt aktuelle Phase mit Tipp
- [ ] Deviations: Phasen-spezifische Hinweise erscheinen
- [ ] Erweiterte Symptome trackbar (20 statt 8)
- [ ] Timeline-Visualisierung zeigt 3 Zyklen
- [ ] Mustererkennung liefert Zusammenfassung
- [ ] PDF-Export enthaelt Zyklusdaten
- [ ] npm run build → 0 TS-Fehler
