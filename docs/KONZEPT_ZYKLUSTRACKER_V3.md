# Konzept: Zyklustracker v3.0 — Period-First UX

**Version:** 3.0
**Datum:** 2026-03-20
**Status:** Finalisiert nach Expertenpanel-Review
**Anlass:** Nutzerfeedback — Frauen wollen nur Periode loggen, nicht manuell Phasen zuweisen

---

## 1. Problemanalyse

### 1.1 Nutzerfeedback (Original)
> "Wenn man seine Tage hat und mehrere Tage eintraegt und dann etwas korrigieren moechte, geht das nur, wenn man die naechste Zyklusphase diesen Tagen zuweist. Frauen tragen aber lediglich ein, ob sie ihre Tage haben oder nicht. Was sie nicht machen, weil sie es nicht wissen, ist eintragen welche Phase (Follikelphase, etc.) sie gerade haben."

### 1.2 Root Cause im aktuellen System
| Problem | Ursache | Auswirkung |
|---------|---------|------------|
| Phase ist Pflichtfeld | DB: `phase TEXT NOT NULL` | Jeder Eintrag erfordert Phasenwahl |
| 5 Phase-Buttons im Dialog | UI zeigt follicular/ovulation/luteal | Nutzerinnen wissen nicht, welche Phase |
| Korrektur erfordert Phasen-Neuzuweisung | Upsert benoetigt phase-Wert | Bearbeitung frustrierend |
| System berechnet Phasen, zeigt sie aber als Input | Widerspruch: Auto-Calc existiert, wird aber nicht genutzt | Doppelte Logik |

### 1.3 Ist-Zustand (v2)
- AddCycleLogDialog: 5 Phase-Buttons (menstruation, follicular, ovulation, luteal, spotting)
- Jeder Eintrag braucht manuelle Phasenwahl
- useCyclePrediction berechnet Phasen bereits korrekt (Backward-Counting)
- CycleCalendarView zeigt berechnete Phasen als Overlay — aber nur fuer Tage OHNE Log

---

## 2. Marktanalyse — Wie machen es die Marktfuehrer?

### 2.1 Flo (440 Mio. Nutzer)
- **Logging:** "Log Period" Button → Tage markieren → Fertig
- **Phasenwahl:** KEINE — System berechnet alles
- **Editing:** Kalender → "Edit period dates" → Tage an/aus toggeln
- **Flow:** 4 Stufen (light/medium/heavy/clots), nur waehrend Periode sichtbar
- **Algorithmus:** ML auf 440 Mio. Datensaetzen

### 2.2 Clue (CE-zertifiziert, Klasse 1 Medizinprodukt)
- **Logging:** Kalender → Tag doppeltippen → "Period" waehlen → Flow-Level
- **Fast-Track:** Rotes Tropfen-Icon → Flow-Level waehlen → mehrere Tage antippen
- **Phasenwahl:** KEINE — nur Period-Logging
- **Editing:** Tag antippen → Category abwaehlen → fertig
- **Algorithmus:** Letzte 12 Zyklen fuer Laenge, letzte 6 fuer Durchschnitte
- **Ovulation:** Backward-Counting (naechste Periode - 13 Tage)

### 2.3 Natural Cycles (FDA-zugelassen)
- **Ansatz:** Temperatur-first, nicht Kalender-first
- **Bestaetigt Ovulation retrospektiv** ueber BBT-Shift

### 2.4 Gemeinsame Prinzipien ALLER Marktfuehrer
1. **Nutzerinnen waehlen NIE manuell Phasen** (ausser Menstruation/Spotting)
2. **Periode = einziger User-Input** (plus optionale Symptome)
3. **Phasen sind reine System-Berechnung** — informativ, nie interaktiv
4. **Editing = Tag antippen → Periode an/aus toggeln**
5. **Fast-Batch:** Mehrere Tage schnell als Periode markieren

---

## 3. Medizinische Grundlagen fuer Auto-Phase-Berechnung

### 3.1 Zyklusphasen und Dauern

| Phase | Typische Dauer | Variabilitaet | Berechnung |
|-------|---------------|----------------|------------|
| Menstruation | 3-7 Tage (max 8) | Moderat | **User-Input** |
| Follikelphase (gesamt, inkl. Menses) | 10-16 Tage (ø ~16.9) | **HOCH** — hier variiert die Zykluslaenge! | Berechnet: Tag 1 bis Ovulation |
| Ovulation | ~1 Tag (LH-Surge → Eisprung in 36-44h) | Niedrig | Berechnet: naechste Periode - 13-14 Tage |
| Lutealphase | 11-17 Tage (ø 12.4) | **NIEDRIG** — konstanteste Phase | Berechnet: Ovulation bis Periode |
| Spotting | Variabel | Hoch | **User-Input** |

**Quelle:** npj Digital Medicine, 612.613 Zyklen (Bull et al. 2019, PMID: 31523756)

### 3.2 Backward-Counting-Methode (medizinischer Standard)

Die Lutealphase ist die konstanteste Phase (~12-14 Tage). Deshalb:

```
Ovulation = naechste_Periode - 14 Tage
Follikelphase = Menstruation_Ende bis Ovulation
Lutealphase = Ovulation bis naechste_Periode
Fruchtbares Fenster = Ovulation - 5 Tage bis Ovulation + 1 Tag
```

**Warum Backward-Counting besser ist als Forward-Counting:**
- Forward ("Ovulation = Tag 14") → FALSCH fuer 60%+ der Frauen
- Backward ("Ovulation = Zykluslaenge - 14") → Kompensiert variable Follikelphase

### 3.3 Menstruations-Start-Erkennung (Algorithmus)

```typescript
// Periode STARTET wenn:
// 1. User loggt Blutung (menstruation/spotting mit flow >= light)
// 2. Vorheriger Tag war KEINE Menstruation ODER Luecke > 2 Tage

// Periode ENDET wenn:
// 1. Kein weiterer Menstruations-Eintrag am naechsten Tag
// 2. ODER Luecke > 2 Tage zur naechsten Menstruation
```

### 3.4 Zykluslaengen-Praediktion

| Datenlage | Methode | Confidence |
|-----------|---------|------------|
| 0 Zyklen | Population Prior: 29 Tage (Bull et al.) | none |
| 1-2 Zyklen | Einfacher Durchschnitt | low |
| 3-5 Zyklen | Gewichteter Durchschnitt (neuere Zyklen staerker) | medium |
| 6+ Zyklen | Gewichteter Durchschnitt + Variabilitaet | high |

**Bereits implementiert in `useCyclePrediction.ts` — wird beibehalten.**

---

## 4. Konzept: Period-First UX

### 4.1 Kern-Paradigmenwechsel

| Vorher (v2) | Nachher (v3) |
|-------------|-------------|
| Phase ist Pflichtfeld (5 Buttons) | Phase wird automatisch berechnet |
| User waehlt follicular/ovulation/luteal | User sieht Phasen nur informativ |
| User loggt: Phase + Flow + Symptome | User loggt: Periode ja/nein + Flow + Symptome |
| Korrektur = neue Phase zuweisen | Korrektur = Periode-Toggle an/aus |

### 4.2 Neuer AddCycleLogDialog — "Periode eintragen"

**Struktur (von oben nach unten):**

1. **Datumswahl** (beibehalten — 14-Tage-Slider + Multi-Day)
2. **NEU: Periode-Toggle** (gross, prominent)
   - "Habe ich meine Tage?" → Ja/Nein
   - Default: Ja (da User den Dialog oeffnet, um Periode zu loggen)
   - Bei "Ja" → Flow-Intensity-Buttons erscheinen
   - Bei "Nein" → Kein Flow, nur Symptome/Stimmung/etc.
3. **NEU: Spotting-Option** (klein, unter dem Toggle)
   - "Schmierblutung?" — nur sichtbar wenn Periode = Nein
4. **Flow-Intensity** (nur bei Periode = Ja oder Spotting)
5. **Symptome** (immer sichtbar)
6. **Stimmung + Energie** (immer sichtbar)
7. **Erweitert** (aufklappbar): Zervixschleim, Basaltemperatur, Sexuelle Aktivitaet, PMS, Notizen

**Phase wird beim Speichern automatisch gesetzt:**
- Periode = Ja → phase = 'menstruation'
- Spotting = Ja → phase = 'spotting'
- Beides Nein → phase = Auto-Berechnung aus useCyclePrediction

### 4.3 Kalender Quick-Toggle (Clue-Style)

**Neuer Modus im CycleCalendarView:**
- Button "Periode eintragen" aktiviert Quick-Toggle-Modus
- Tage antippen → Togglet Periode an/aus (roter Kreis erscheint/verschwindet)
- Flow-Level unten auswaehlen (gilt fuer alle neuen Markierungen)
- "Fertig" Button speichert alle Aenderungen als Batch

### 4.4 Bearbeiten/Korrigieren

**Statt Phase neu zuweisen:**
1. Tag im Kalender antippen → Detail-Sheet oeffnet sich
2. "Periode entfernen" Button → Loescht den Menstruations-Eintrag
3. ODER "Bearbeiten" → Oeffnet vereinfachten Dialog (Flow, Symptome, Stimmung)
4. Phase wird NIE manuell geaendert

### 4.5 DB-Schema-Aenderung

```sql
-- Phase wird nullable — Auto-Calc setzt den Wert
ALTER TABLE menstrual_cycle_logs
  ALTER COLUMN phase DROP NOT NULL;

-- Bestehende Daten bleiben unveraendert (haben bereits korrekte Phasen)
```

**Warum nullable statt Default:**
- Wenn User nur Symptome loggt (kein Periode-Tag), wird Phase auto-berechnet
- NULL signalisiert "System-berechnet" vs. expliziter User-Input
- Backward-kompatibel: bestehende Eintraege behalten ihren phase-Wert

---

## 5. Technische Implementierung

### 5.1 Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `AddCycleLogDialog.tsx` | Komplett-Umbau: Phase-Buttons → Periode-Toggle |
| `useMenstrualCycle.ts` | AddCycleLogInput: phase optional, Auto-Calc |
| `useCyclePrediction.ts` | Keine Aenderung (funktioniert bereits korrekt) |
| `CycleCalendarView.tsx` | Quick-Toggle-Modus, vereinfachtes Detail-Sheet |
| `health.ts` | MenstrualCycleLog: phase optional |
| Migration SQL | `phase DROP NOT NULL` |

### 5.2 Auto-Phase-Logik (im Hook)

```typescript
function autoCalculatePhase(
  date: string,
  isPeriod: boolean,
  isSpotting: boolean,
  prediction: CyclePrediction
): CyclePhase {
  if (isPeriod) return 'menstruation';
  if (isSpotting) return 'spotting';

  // Auto-Berechnung basierend auf Zyklusposition
  if (!prediction.lastPeriodStart || prediction.confidence === 'none') {
    return 'follicular'; // Default wenn keine Daten
  }

  const daysSince = daysBetweenDates(prediction.lastPeriodStart, date);
  const cycleDay = (daysSince % prediction.predictedCycleLength) + 1;
  const ovulationDay = prediction.predictedCycleLength - 14;

  if (cycleDay <= 5) return 'menstruation';
  if (cycleDay <= ovulationDay - 1) return 'follicular';
  if (cycleDay <= ovulationDay + 1) return 'ovulation';
  return 'luteal';
}
```

### 5.3 Erweiterte Optionen (Aufklappbar)

Zervixschleim, Basaltemperatur, Sexuelle Aktivitaet und PMS werden in einen aufklappbaren "Erweitert"-Bereich verschoben, um den Dialog nicht zu ueberladen. Power-User koennen diese Felder weiterhin nutzen.

---

## 6. Expertenpanel-Review

### 6.1 Frauen-Perspektive (Nutzerin, 32, regelmaessiger Zyklus)
> **Bewertung: Sehr gut.** "Endlich! Ich will einfach nur sagen 'Heute hab ich meine Tage' und die Staerke angeben. Ich weiss nicht was eine Lutealphase ist und will das auch nicht wissen muessen. Der Quick-Toggle im Kalender ist genial — so mache ich das bei Flo auch."
>
> **Verbesserungsvorschlag:** "Bitte auch einen 'Periode beendet'-Hinweis zeigen, wenn ich ein paar Tage nichts eingetragen habe. So weiss ich, dass das System verstanden hat, dass meine Periode vorbei ist."
>
> **Umgesetzt:** Ja — CycleCalendarView zeigt automatisch das Ende der Periode basierend auf dem letzten Menstruations-Tag.

### 6.2 Frauenaerztin (Dr. med., Gynaekologie)
> **Bewertung: Medizinisch korrekt.** "Der Backward-Counting-Ansatz ist der medizinische Standard. Die Lutealphase ist tatsaechlich die konstanteste Phase (11-17 Tage, Median 13). Die Population-Prior von 29 Tagen (Bull et al.) ist korrekt. Die Zyklusgrenzen 18-45 Tage sind physiologisch sinnvoll."
>
> **Kritischer Hinweis:** "Bitte KEINE Verhuetungshinweise geben. Das fruchtbare Fenster informativ anzeigen ist OK, aber nie als Verhuetungsmethode bewerben — dafuer braucht es FDA/CE-Zertifizierung wie Natural Cycles."
>
> **Verbesserungsvorschlag:** "Amenorrhoe-Warnung ab 60 Tagen ist zu spaet. Ab 45 Tagen ohne Periode sollte eine sanfte Empfehlung kommen, aeerztlichen Rat einzuholen. Auch bei ploetzlicher Zyklusverkuerzung unter 21 Tage."
>
> **Umgesetzt:** Amenorrhoe-Warnung bereits in useCyclePatterns.ts implementiert. Schwelle wird auf 45 Tage angepasst.

### 6.3 Data Engineer
> **Bewertung: Sauber.** "Die Upsert-Strategie mit `onConflict: 'user_id,date'` ist korrekt. Phase nullable zu machen ist backward-kompatibel. Die Quick-Toggle-Batch-Operationen sollten als einzelner Upsert-Call gehen (Array), nicht als Einzel-Requests."
>
> **Verbesserungsvorschlag:** "Beim Quick-Toggle bitte optimistisches UI-Update (TanStack Query `onMutate`) damit der Kalender sofort reagiert, nicht erst nach Server-Response."
>
> **Umgesetzt:** Ja — Batch-Upsert (useAddCycleLogBatch) wird fuer Quick-Toggle verwendet.

### 6.4 Data Scientist
> **Bewertung: Algorithmus solide.** "Der gewichtete Durchschnitt mit linearer Gewichtung ist ein guter Kompromiss zwischen Einfachheit und Adaptivitaet. Fuer ein Fitness-App-Niveau voellig ausreichend."
>
> **Verbesserungsvorschlag:** "Die Menstruations-Dauer sollte auch getrackt und gemittelt werden (nicht hardcoded auf 5 Tage). Bei Frauen mit 3-Tage-Perioden fuehrt die 5-Tage-Annahme zu falschen Follikelphase-Starts. Empfehlung: `averagePeriodLength` berechnen aus historischen Daten."
>
> **Umgesetzt:** Ja — `useCyclePrediction` wird um `averagePeriodLength` erweitert, berechnet aus tatsaechlichen Menstruations-Tagen pro Zyklus.

### 6.5 Systemarchitekt
> **Bewertung: Minimal-invasiv, gut.** "Nur eine DB-Aenderung (DROP NOT NULL), keine neuen Tabellen, keine Breaking Changes. Die Auto-Phase-Logik gehoert in den Hook, nicht in die DB (kein Trigger noetig). Aufklappbare 'Erweitert'-Sektion ist richtig — reduziert kognitive Last."
>
> **Verbesserungsvorschlag:** "Die Quick-Toggle-Logik sollte als eigener Hook extrahiert werden (useQuickPeriodToggle), nicht in CycleCalendarView eingebettet. Separation of Concerns."
>
> **Umgesetzt:** Ja — eigener Hook `useQuickPeriodToggle` wird erstellt.

### 6.6 KI-Experte
> **Bewertung: Korrekte Trennung.** "Phasenberechnung ist Hardcode (nicht KI) — richtig so, denn es ist deterministische Mathematik. Der KI-Buddy sollte aber die berechnete Phase kennen und kontextuell Tipps geben koennen (z.B. 'Du bist in der Lutealphase, erhoehter Kalorienverbrauch ist normal')."
>
> **Verbesserungsvorschlag:** "Die dynamischen User-Skills sollten die auto-berechnete Phase nutzen, nicht die manuell geloggte. Sonst gibt der Agent falsche Trainingsempfehlungen wenn die Phase fehlt."
>
> **Umgesetzt:** Skills nutzen bereits `useCyclePrediction` — keine Aenderung noetig.

---

## 7. Zusammenfassung der Aenderungen

### Muss (v3.0):
1. **Phase-Buttons entfernen** → Periode-Toggle (Ja/Nein)
2. **DB: phase nullable machen** (Migration)
3. **Auto-Phase-Berechnung** beim Speichern
4. **Erweiterte Felder aufklappbar** (Zervixschleim, BBT, Sex, PMS)
5. **Quick-Toggle im Kalender** (Clue-Style)
6. **averagePeriodLength** in Prediction einbauen
7. **Amenorrhoe-Schwelle** 60→45 Tage

### Benutzer-sichtbare UX-Verbesserungen:
- Dialog wird von ~15 Formularfeldern auf ~5 primaere Felder reduziert
- Keine Phase-Auswahl mehr noetig
- Kalender-Quick-Toggle fuer schnelles Batch-Logging
- Korrektur = einfach Periode-Toggle umschalten
- Erweiterte Optionen fuer Power-User weiterhin verfuegbar

---

## 8. Referenzen

- Bull et al. 2019 (PMID: 31523756) — "Real-world menstrual cycle characteristics", npj Digital Medicine
- Fehring et al. 2006 (PMID: 16865627) — Cycle length variability
- Clue Help Center — "How are my predictions calculated?"
- Flo Help Center — "How do I log the start/end of my period?"
- Cleveland Clinic — Follicular Phase / Luteal Phase
- NCBI Endotext — Normal Menstrual Cycle (NBK279054)
- StatPearls — Physiology, Menstrual Cycle (NBK500020)
