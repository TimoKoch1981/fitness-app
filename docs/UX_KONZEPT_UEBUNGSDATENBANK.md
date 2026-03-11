# UX-Konzept: Uebungsdatenbank & Plan-Editor

**Stand:** 2026-03-09 | **Version:** 1.0
**Kontext:** FitBuddy / fudda.de — PWA + Capacitor
**Aktueller Katalog:** ~70 Uebungen mit DE/EN Namen, Aliases, Videos, Muskelgruppen, Equipment
**Reviewer-Perspektive:** UX-Designer mit Fitnesstrainer-Hintergrund

---

## A. Web-Recherche: Wie machen es die Besten?

### A.1 Hevy

**Uebungsauswahl-Flow:**
- Hevy nutzt einen zweistufigen Ansatz: Zuerst waehlt der User aus vordefinierten Kategorien (Muskelgruppe ODER Equipment ODER "Alle"), dann sucht/scrollt er in der gefilterten Liste.
- Das Suchfeld ist **persistent oben** fixiert — der User kann jederzeit tippen.
- **Favoriten-Stern** direkt neben jeder Uebung — ein Tipp genuegte, um haeufig genutzte Uebungen nach oben zu pinnen.
- "Custom Exercise" Button am Ende der Liste, nicht versteckt.
- Jede Uebung zeigt ein **kleines Thumbnail** (Muskel-Illustration) und den Primaer-Muskel als Subtitle.
- **Superset-Gruppierung:** Drag-Zuordnung nach Hinzufuegen; zwei Uebungen werden visuell verklammert.
- Keine Videos direkt in der Auswahl, aber ein (i)-Button oeffnet eine Detail-Ansicht mit GIF-Animation.

**Was User lieben (App Store Reviews):**
- Schnelle Uebungssuche, Favoriten-System
- Superset-Markierung ("endlich eine App, die das kann")
- History pro Uebung direkt sichtbar

**Was User hassen:**
- Manche Uebungen fehlen im Katalog, Custom-Uebungen haben keine Muskelgruppen-Zuordnung
- Kein Video/GIF fuer eigene Uebungen
- Suche findet Umlaute nicht zuverlaessig

### A.2 Strong

**Uebungssuche + Filter:**
- Strong setzt auf eine **flache Liste mit Suchfeld** — kein Kategorie-Vorfilter, reine Textsuche.
- Ergebnisse erscheinen als einfache Textliste, sehr schnell und minimalistisch.
- "Zuletzt verwendet" Sektion ganz oben — die 5 letzten Uebungen.
- Custom-Uebungen sind gleichberechtigt in der Suche sichtbar.
- **Kein Muskelgruppen-Filter**, was Power-User kritisieren.
- History-Button pro Uebung zeigt Fortschritts-Chart.

**Was User lieben:**
- Extremer Minimalismus, schnelle Eingabe
- "Zuletzt verwendet" spart enorm Zeit
- Saubere Dateneingabe (Sets/Reps/Weight inline)

**Was User hassen:**
- Fehlende Filter (Muskelgruppe, Equipment)
- Keine Video-Anleitungen
- Begrenzte kostenlose Workouts (3 Routinen-Limit in Free-Tier)

### A.3 Fitbod

**AI-basierte Uebungsvorschlaege:**
- Fitbod generiert den **gesamten Workout-Plan automatisch** basierend auf: verfuegbarem Equipment, Erholungszustand der Muskelgruppen, Trainingshistorie, Zeitbudget.
- Der User sieht einen fertigen Plan und kann einzelne Uebungen **austauschen** (Swipe oder Tap auf "Replace") — die KI schlaegt 3-5 Alternativen vor, sortiert nach Eignung.
- **Muskel-Heatmap** zeigt visuell, welche Muskeln frisch/erschoepft sind.
- Video-Anleitungen sind **inline als Loop-GIF** direkt in der Uebungsliste sichtbar.
- Manuelle Uebungsauswahl ist moeglich, aber als sekundaerer Flow positioniert.

**Was User lieben:**
- "Ich muss nicht nachdenken, die App plant fuer mich"
- Muskel-Erholungs-Visualisierung
- Inline-Video-Demos ohne extra Klick

**Was User hassen:**
- Wenig Kontrolle fuer erfahrene Lifter
- KI-Vorschlaege manchmal unlogisch (z.B. 3x Trizeps-Isolation nach Bench)
- Teuer ($12.99/Monat)

### A.4 JEFIT

**Uebungsbibliothek mit Videos:**
- JEFIT hat die **groesste Uebungsdatenbank** (1.300+ Uebungen) mit GIF-Animationen.
- **Dreistu figer Filter:** Muskelgruppe > Equipment > Schwierigkeit.
- Jede Uebung hat: GIF-Animation, Schritt-fuer-Schritt-Anleitung, beteiligte Muskelgruppen (Primaer + Sekundaer), User-Bewertung.
- "Body Map" — klickbare Koerper-Silhouette, Tipp auf Muskelgruppe zeigt alle Uebungen dafuer.
- **Community-Uebungen** koennen eingereicht werden.

**Was User lieben:**
- Riesige Datenbank, kaum eine Uebung fehlt
- Body Map Visualisierung
- GIF-Animationen statt statischer Bilder

**Was User hassen:**
- UI wirkt veraltet / ueberladen
- Zu viele Optionen, Entscheidungsmuedigkeit
- Werbung in der Free-Version unterbricht den Flow

### A.5 Nike Training Club & Peloton

**NTC:**
- Curated Workouts (kein offener Katalog), Video-gefuehrt
- Uebungen sind Teil eines gesamten Video-Workouts, nicht einzeln waehlbar
- Kein Custom-Plan-Erstellen

**Peloton:**
- Class-basiert, Uebungen nicht einzeln durchsuchbar
- Staerke: professionelle Video-Produktion
- Schwaech: kein eigener Plan-Editor, kein Tracking einzelner Uebungen

### A.6 Zusammenfassung: Best Practices & Worst Practices

| Feature | Best Practice | Wer macht es am besten |
|---------|--------------|----------------------|
| Suche | Fuzzy + Alias + mehrsprachig | Hevy |
| Filter | Muskelgruppe + Equipment + Schwierigkeit | JEFIT |
| Favoriten | Stern-Toggle, oben gepinnt | Hevy, Strong |
| Zuletzt verwendet | Top-5-Sektion ueber Suchergebnissen | Strong |
| Video-Anzeige | Inline-Loop-GIF, kein extra Screen | Fitbod |
| KI-Integration | "Replace Exercise" mit KI-Alternativen | Fitbod |
| Superset | Visuelle Klammer, Drag-Zuordnung | Hevy |
| Body Map | Klickbare Koerpersilhouette | JEFIT |
| Custom Exercise | Gleichberechtigt in Suche, mit Muskelgruppen | Hevy |
| Plan-Editor | Tage benennen, D&D Reihenfolge | Hevy |

**Kritischste Fehler zum Vermeiden:**
1. Suche ohne Umlaute/Alias-Support (Strong-Problem in DE)
2. Kein Filter ausser Textsuche (Strong)
3. Ueberladene UI mit zu vielen Filtern (JEFIT)
4. KI als einziger Weg (Fitbod — frustriert erfahrene Lifter)
5. Kein Custom-Exercise-Support fuer Muskelgruppen

---

## B. UX-Konzept: Uebungsauswahl

### B.1 Suchfeld mit intelligentem Autocomplete

**Aktueller Zustand:**
- `AddWorkoutDialog`: Reines Freitext-Feld ohne Autocomplete — Katalog wird nicht genutzt.
- `AddExerciseDialog`: Hat Autocomplete aus Katalog, aber nur waehrend Live-Workout.

**Soll-Zustand: Unified Exercise Picker Component**

```
┌──────────────────────────────────────────┐
│  [Lupe] Uebung suchen...           [X]  │
├──────────────────────────────────────────┤
│  ★ FAVORITEN                             │
│  ├─ Bankdruecken        Brust, Tri  ▶   │
│  ├─ Kniebeugen          Quad, Glut  ▶   │
│  └─ Klimmzuege          Lat, Bizeps ▶   │
├──────────────────────────────────────────┤
│  ⏱ ZULETZT VERWENDET                    │
│  ├─ Seitheben           Schulter    ▶   │
│  └─ Cable Crunches      Bauch       ▶   │
├──────────────────────────────────────────┤
│  🔽 FILTER                               │
│  [Brust] [Ruecken] [Beine] [Schulter]   │
│  [Arme] [Core] [Cardio] [Flex]          │
│                                          │
│  Equipment: [Alle ▼]                     │
│  Schwierigkeit: [Alle ▼]                 │
├──────────────────────────────────────────┤
│  ERGEBNISSE (70)                         │
│  ├─ Bankdruecken ★      Brust, Tri  ▶   │
│  │  Compound · Intermediate · LH         │
│  ├─ Schraegbankdr.       ob. Brust  ▶   │
│  │  Compound · Intermediate · LH         │
│  └─ ...                                  │
├──────────────────────────────────────────┤
│  [+] Eigene Uebung eingeben              │
│  [🤖] Buddy fragen: "Ich brauche eine   │
│       Alternative zu Bankdruecken"       │
└──────────────────────────────────────────┘
```

**Kernprinzipien:**
1. **Suchfeld immer sichtbar** — sticky oben, sofortige Filterung ab 1. Buchstabe
2. **Fuzzy-Suche** mit Alias-Match (bestehendes `findExerciseInCatalog` erweitern um Fuzzy-Scoring statt First-Match)
3. **Muskelgruppen-Chips** als horizontale Scroll-Leiste — Tap-Toggle, Mehrfachauswahl moeglich
4. **Equipment-Filter** als Dropdown, optional mit Gym-Profil-Integration (zeigt nur verfuegbares Equipment)
5. **Favoriten** ganz oben, persistent ueber Sessions (neues Feld `user_exercise_favorites` in DB oder localStorage)
6. **Zuletzt verwendet** — letzte 5 Uebungen aus der Workout-History, dynamisch berechnet
7. **Play-Button** (Dreieck ▶) oeffnet Inline-Video-Preview, kein Seitenwechsel
8. **Buddy-Shortcut** am Ende: "Frag den Buddy nach Alternativen" — oeffnet Chat mit Kontext

### B.2 Video-Inline-Preview

Wenn der User auf den Play-Button (▶) tippt:

```
┌──────────────────────────────────────────┐
│  Bankdruecken                       [X]  │
│  ┌────────────────────────────────────┐  │
│  │                                    │  │
│  │   ▶ Video (16:9, autoplay, loop)  │  │
│  │      [YouTube embed, nocookie]     │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│  Compound · Intermediate                 │
│  Brust · Trizeps · vordere Schulter      │
│  Equipment: Langhantel, Flachbank        │
│                                          │
│  Grunduebung fuer die Brustmuskulatur.   │
│  Langhantel kontrolliert zur Brust       │
│  senken, explosiv nach oben druecken.    │
│                                          │
│  [Uebung waehlen]            [Zurueck]   │
└──────────────────────────────────────────┘
```

**Implementierung:** Das bestehende `ExerciseVideoModal` wird erweitert mit einem "Uebung waehlen"-Button, der die Uebung direkt in den Picker-Callback uebergibt.

### B.3 Unilaterale Uebungen (L/R)

**Problem:** Uebungen wie Bulgarian Split Squat, einarmiges Rudern, Pistol Squats erfordern separate Erfassung fuer links/rechts.

**Loesung — Zweistufig:**

1. **Katalog-Erweiterung:**
   - Neues Feld `is_unilateral BOOLEAN DEFAULT false` in `exercise_catalog`
   - Seed: Bulgarian Split Squat, Kurzhantelrudern, Pistol Squats, Ausfallschritte markieren

2. **UI bei Set-Eingabe (ExerciseTracker):**
   ```
   Kurzhantelrudern (Einarmig)
   ┌──────────────────────────────────────┐
   │  [L/R Toggle]                        │
   │  ┌──────┐  ┌──────┐                 │
   │  │  L   │  │  R   │   (aktiv: blau) │
   │  └──────┘  └──────┘                 │
   │                                      │
   │  Satz 1:  12 Wdh · 30kg  [✓]       │
   │  Satz 2:  12 Wdh · 30kg  [ ]       │
   │  Satz 3:  10 Wdh · 30kg  [ ]       │
   └──────────────────────────────────────┘
   ```

   - Toggle zwischen L und R, Saetze werden **separat pro Seite** erfasst
   - Automatisch: Wenn `is_unilateral === true`, wird der Toggle angezeigt
   - Fallback: User kann den Toggle auch manuell ein-/ausschalten fuer beliebige Uebungen
   - In der History/Summary: "L: 3x12@30kg | R: 3x12@30kg"

### B.4 KI-Buddy-Integration

**Prinzip: KI = Parallel-Option, NICHT Pflicht**

Der KI-Buddy ist auf drei Wegen integriert, aber **nie der einzige Weg:**

1. **"Buddy fragen" Button** im Exercise Picker:
   - Kontextuelle Anfrage: "Alternative zu [aktuelle Uebung] fuer [Muskelgruppe] mit [Equipment]"
   - Buddy antwortet im Bottom-Sheet-Chat, schlaegt 3 Uebungen vor
   - Jeder Vorschlag hat einen "Hinzufuegen"-Button, der die Uebung direkt einfuegt

2. **Plan-Erstellung via Buddy:**
   - User kann sagen: "Erstell mir einen 4er-Split Push/Pull/Legs/Upper"
   - Buddy erstellt den Plan, User kann ihn dann im Plan-Editor manuell anpassen
   - **Beides moeglich:** Buddy-Erstellung ODER manueller Editor

3. **Workout-Kontext:**
   - Waehrend eines Live-Workouts kann der Buddy alternative Uebungen vorschlagen
   - "Diese Uebung tut in der Schulter weh — was kann ich stattdessen machen?"
   - Buddy beruecksichtigt aktuelles Equipment und Muskelgruppen-Fokus

---

## C. UX-Konzept: Plan-Editor

### C.1 Aktueller Zustand vs. Soll

**Ist-Zustand:**
- "Neuen Plan" oeffnet nur Buddy-Chat (kein Formular)
- Plus-Button legt einzelnes Workout an, kein Plan
- Keine klare Trennung: Workout-Logging vs. Plan-Management
- Plan-Editing nur ueber Buddy-Chat moeglich (Pencil-Icon → Navigate to Buddy)

**Soll-Zustand:** Dedizierter Plan-Editor als Modal/Full-Screen-Page

### C.2 Plan-Editor UI

```
┌──────────────────────────────────────────┐
│  ← Plan bearbeiten              [Save]   │
│                                          │
│  Plan-Name: [Push/Pull/Legs/Upper    ]   │
│  Split:     [PPL          ▼]            │
│  Tage/Woche: [4 ▼]                      │
│                                          │
│  ─────────────────────────────────────   │
│                                          │
│  ☰ TAG 1: Push Day                  [⋮] │
│  ┌────────────────────────────────────┐  │
│  │ ☰ 1. Bankdruecken                 │  │
│  │    4 × 8-10 · 80kg          [⋮]  │  │
│  │ ☰ 2. Schraegbankdr. (KH)         │  │
│  │    3 × 10-12 · 22.5kg       [⋮]  │  │
│  │ ┌─ SUPERSET ─────────────────┐    │  │
│  │ │ ☰ 3. Seitheben             │    │  │
│  │ │    3 × 12-15 · 10kg        │    │  │
│  │ │ ☰ 4. Face Pulls            │    │  │
│  │ │    3 × 15 · 15kg           │    │  │
│  │ └────────────────────────────┘    │  │
│  │ ☰ 5. Trizepsdruecken             │  │
│  │    3 × 12 · 25kg            [⋮]  │  │
│  │                                    │  │
│  │ [+ Uebung hinzufuegen]            │  │
│  │ [🔗 Superset markieren]           │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ☰ TAG 2: Pull Day (zugeklappt)    [⋮]  │
│  ☰ TAG 3: Legs (zugeklappt)        [⋮]  │
│  ☰ TAG 4: Upper (zugeklappt)       [⋮]  │
│                                          │
│  [+ Tag hinzufuegen]                     │
│                                          │
│  ─────────────────────────────────────   │
│  🤖 Buddy: "Soll ich den Plan              │
│     analysieren und Verbesserungen       │
│     vorschlagen?"                [Ja]    │
│                                          │
│  [Plan speichern]                        │
└──────────────────────────────────────────┘
```

### C.3 Einzelne Features des Plan-Editors

#### C.3.1 Tage erstellen/benennen
- **"+ Tag hinzufuegen"** Button am Ende der Tag-Liste
- Jeder Tag hat: Nummer (auto), Name (editierbar), Focus (optional, z.B. "Brust/Schultern/Trizeps")
- **Drei-Punkt-Menue [drei Punkte]** pro Tag: Umbenennen, Duplizieren, Loeschen, Nach oben/unten verschieben
- Maximale Tage: 7 (Validierung)

#### C.3.2 Uebungen hinzufuegen
- **"+ Uebung hinzufuegen"** oeffnet den Unified Exercise Picker (siehe B.1)
- Nach Auswahl: Sofort inline editierbar (Sets, Reps, Weight)
- **Freitext-Fallback:** Im Exercise Picker gibt es immer "Eigene Uebung eingeben"
- Uebung wird mit Katalog-Referenz (`exercise_id`) verknuepft — ermoeglicht spaeter Video-Zugriff und Fortschritts-Tracking

#### C.3.3 Saetze/Wiederholungen/Gewicht vorgeben
- **Inline-Editing** direkt in der Uebungs-Zeile (kein extra Dialog)
- Tippen auf "4 x 8-10 · 80kg" oeffnet Edit-Row:
  ```
  Saetze: [4]   Wdh: [8-10]   Gewicht: [80] kg
  ```
- Wdh-Feld akzeptiert sowohl "10" als auch "8-10" (Range-Format)
- Weight ist optional (Bodyweight-Uebungen)
- **Zusaetzliche Felder** per Expand:
  - Pause (Sek): [90]
  - RIR-Ziel: [2]
  - Notizen: [Slow eccentric]

#### C.3.4 Drag & Drop Reihenfolge
- **Grip-Handle** (☰/GripVertical) links an jeder Uebung UND jedem Tag
- @dnd-kit Integration (bereits im Projekt fuer Workout D&D)
- **Touch + Pointer Sensor** (bereits implementiert in v12.63)
- Drag innerhalb eines Tages: Uebungs-Reihenfolge aendern
- Drag zwischen Tagen: Uebung von Tag 1 nach Tag 2 verschieben
- Tag-Reihenfolge aendern: Grip am Tag-Header

#### C.3.5 Superset-Markierung
- **"Superset markieren"** Button erscheint, wenn 2+ Uebungen ausgewaehlt (Checkbox-Modus)
- Alternativ: Drei-Punkt-Menue an Uebung > "Mit naechster Uebung als Superset"
- Visuell: Verbindungslinie/Klammer links, Hintergrund leicht eingefaerbt (z.B. blau-tint)
- Superset-Aufloesung: Klammer-X Button oder Drei-Punkt-Menue > "Superset aufloesen"
- Datenmodell-Erweiterung in `PlanExercise`:
  ```typescript
  superset_group?: number; // null = normal, gleiche Nummer = ein Superset
  ```

#### C.3.6 Buddy-Hilfe parallel verfuegbar
- Sticky-Banner am Ende des Editors: "Buddy fragen"
- Kontext-Anfragen:
  - "Analysiere meinen Plan" — Buddy gibt Feedback (Volumen, Balance, Schwaechen)
  - "Fuege eine Rueckenuebung zu Tag 2 hinzu" — Buddy schlaegt vor, User bestaetigt
  - "Ersetze Bankdruecken durch eine Schulter-schonende Alternative"
- Buddy kann den Plan direkt modifizieren (nach User-Bestaetigung), aber der User kann auch alles manuell machen

### C.4 Zugangs-Flow zum Plan-Editor

**Aktuell fehlt:** Ein klarer Eintrittspunkt fuer den manuellen Plan-Editor.

**Loesung: Drei Eintrittspunkte:**

1. **Plan-Tab, kein Plan vorhanden:**
   ```
   [Standard-Plan laden]        <- bestehend
   [Eigenen Plan erstellen]     <- NEU: oeffnet Plan-Editor
   [Buddy einen Plan erstellen lassen]  <- bestehend (Chat)
   ```

2. **Plan-Tab, Plan vorhanden:**
   - Pencil-Icon oeffnet **Plan-Editor** (nicht mehr Buddy-Chat)
   - Buddy-Chat ist ueber separaten Button erreichbar

3. **Buddy-Chat:**
   - "Erstell mir einen Plan" → Buddy erstellt, Plan erscheint im Editor zur Anpassung

---

## D. UX-Konzept: Video-Anzeige

### D.1 Wo und wann soll ein Video gezeigt werden?

| Kontext | Video-Trigger | Format |
|---------|---------------|--------|
| Exercise Picker (Uebung suchen) | Play-Button (▶) neben Uebungsname | Bottom-Sheet mit Embed |
| Plan-Editor (Uebung bearbeiten) | Tap auf Uebungsname | ExerciseDetailModal (bestehend) |
| Live-Workout (aktuelle Uebung) | Info-Button am ExerciseTracker | ExerciseVideoModal (bestehend) |
| Workout-History | Tap auf Uebungsname | ExerciseDetailModal |
| Uebungskatalog-Browser (NEU) | Tap auf Uebung | Fullscreen Detail + Video |

### D.2 Auto-Play oder nur on-demand?

**Empfehlung: On-Demand mit Smart-Defaults**

- **Exercise Picker:** Kein Auto-Play (zu viel Datenverbrauch beim Scrollen)
- **Live-Workout, Info-Button:** Auto-Play, Loop, Muted — User will schnell die Form sehen
- **Plan-Editor:** Kein Auto-Play
- **Katalog-Browser:** Auto-Play wenn WiFi, on-demand bei Mobile Daten (via `navigator.connection` API)
- **Settings-Option:** "Videos automatisch abspielen" Toggle (Default: nur bei WiFi)

### D.3 Mann/Frau Variante

**Aktueller Stand:** DB-Schema hat `video_url_de` und `video_url_en` — kein Gender-Split.

**Geplant:** 4 Videos pro Uebung (DE/EN x Mann/Frau)

**Schema-Erweiterung:**
```sql
ALTER TABLE exercise_catalog ADD COLUMN video_url_de_female TEXT;
ALTER TABLE exercise_catalog ADD COLUMN video_url_en_female TEXT;
-- Bestehende video_url_de/video_url_en werden zu "male" Default
```

**UI-Loesung:**
```
┌──────────────────────────────────────┐
│  Video                               │
│  ┌──────────────────────────────┐    │
│  │                              │    │
│  │     [YouTube Embed]          │    │
│  │                              │    │
│  └──────────────────────────────┘    │
│  [👤 Maennlich] [👤 Weiblich]       │
│   ^^^aktiv^^^                        │
└──────────────────────────────────────┘
```

- **Default:** Wird aus dem User-Profil (`gender` Feld) abgeleitet
- **Toggle:** Jederzeit umschaltbar, aendert sofort das Video
- **Fallback:** Wenn kein weibliches Video vorhanden, zeige maennliches (mit Hinweis)
- **Settings:** "Video-Praeferenz: Maennlich / Weiblich / Aus Profil" (einmal setzen, gilt ueberall)

### D.4 Settings fuer Video-Praeferenz

Neuer Abschnitt in den Profil-Einstellungen:

```
Video-Einstellungen
├─ Auto-Play: [Nur bei WLAN ▼]  (Aus / Immer / Nur bei WLAN)
├─ Video-Variante: [Aus Profil ▼]  (Maennlich / Weiblich / Aus Profil)
└─ Video-Qualitaet: [Auto ▼]  (Auto / 720p / 480p / 360p)
```

---

## E. UX-Flow-Diagramme (ASCII)

### E.1 Flow: "User will neuen Plan erstellen"

```
                    ┌─────────────┐
                    │ Training-   │
                    │ Tab oeffnen │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ Sub-Tab:    │
                    │ "Plan"      │
                    └──────┬──────┘
                           │
                ┌──────────┼──────────┐
                │          │          │
         ┌──────▼─────┐   │   ┌──────▼──────┐
         │ Plan vorh. │   │   │ Kein Plan   │
         └──────┬─────┘   │   └──────┬──────┘
                │         │          │
         ┌──────▼─────┐   │   ┌──────▼──────────────┐
         │ Pencil-    │   │   │ "Eigenen Plan        │
         │ Icon       │   │   │  erstellen"          │
         └──────┬─────┘   │   │ ODER                 │
                │         │   │ "Standard-Plan laden" │
                │         │   │ ODER                 │
                │         │   │ "Buddy fragen"       │
                │         │   └────┬──────┬─────┬───┘
                │         │        │      │     │
                │         │        │      │  ┌──▼──────────┐
                │         │        │      │  │ Buddy-Chat  │
                │         │        │      │  │ erstellt    │
                │         │        │      │  │ Plan        │
                │         │        │      │  └──────┬──────┘
                │         │        │      │         │
                ▼         │        ▼      ▼         ▼
         ┌────────────────┴────────────────────────────┐
         │          PLAN-EDITOR (Full-Screen)           │
         │                                              │
         │  1. Plan-Name + Split-Typ eingeben           │
         │  2. Tage erstellen + benennen                │
         │  3. Pro Tag: Uebungen hinzufuegen            │
         │     └─> Exercise Picker oeffnet sich         │
         │         └─> Suche / Filter / Favoriten       │
         │         └─> Uebung waehlen                   │
         │         └─> Sets/Reps/Weight konfigurieren   │
         │  4. Reihenfolge per Drag & Drop anpassen     │
         │  5. Supersets markieren (optional)            │
         │  6. Buddy-Analyse (optional)                 │
         │  7. [Plan speichern]                         │
         └──────────────────┬───────────────────────────┘
                            │
                     ┌──────▼──────┐
                     │ Plan aktiv, │
                     │ Tage sicht- │
                     │ bar im Tab  │
                     └─────────────┘
```

### E.2 Flow: "User will einzelnes Workout loggen"

```
                    ┌─────────────┐
                    │ Training-   │
                    │ Tab oeffnen │
                    └──────┬──────┘
                           │
                ┌──────────┼──────────┐
                │                     │
         ┌──────▼──────┐       ┌──────▼──────┐
         │ Plan vorh.: │       │ Kein Plan:  │
         │ [Start] am  │       │ [+] Button  │
         │ Tag druecken│       │ druecken    │
         └──────┬──────┘       └──────┬──────┘
                │                     │
                │              ┌──────▼───────────┐
                │              │ AddWorkoutDialog  │
                │              │ (VERBESSERT)      │
                │              │                   │
                │              │ 1. Workout-Typ    │
                │              │ 2. Name           │
                │              │ 3. [+ Uebung]     │
                │              │    └─> Exercise    │
                │              │       Picker      │
                │              │ 4. Dauer/Kalorien │
                │              │ 5. [Speichern]    │
                │              └──────┬────────────┘
                │                     │
         ┌──────▼──────┐              │
         │ ActiveWork- │              │
         │ outPage     │              │
         │ (Live)      │              │
         │             │              │
         │ 1. Warmup   │              │
         │ 2. Uebung   │              │
         │    fuer      │              │
         │    Uebung    │              │
         │    durcharb. │              │
         │ 3. [+ Add]  │              │
         │    └─> Add-  │              │
         │    Exercise  │              │
         │    Dialog    │              │
         │ 4. Finish   │              │
         └──────┬──────┘              │
                │                     │
                ▼                     ▼
         ┌─────────────────────────────┐
         │ Workout gespeichert,        │
         │ sichtbar in "Heute" +       │
         │ "Historie"                  │
         └─────────────────────────────┘
```

### E.3 Flow: "User sucht eine Uebung und schaut Video"

```
         ┌─────────────┐
         │ Beliebiger   │
         │ Kontext:     │
         │ • Plan-Edit  │
         │ • Workout    │
         │ • Katalog    │
         └──────┬──────┘
                │
         ┌──────▼──────────────────────────┐
         │ Exercise Picker / Katalog       │
         │                                  │
         │ [🔍 "bench" eingeben]           │
         │                                  │
         │ Ergebnisse:                      │
         │ ├─ Bankdruecken ★    Brust  [▶] │
         │ ├─ Schraegbankdr.    Brust  [▶] │
         │ └─ Close-Grip BP    Tri.   [▶] │
         └──────────────┬──────────────────┘
                        │
                  User tippt [▶]
                        │
         ┌──────────────▼──────────────────┐
         │ Exercise Video Modal            │
         │ (Bottom-Sheet, 85vh)            │
         │                                  │
         │ ┌────────────────────────────┐  │
         │ │  YouTube Embed             │  │
         │ │  (autoplay, loop, muted)   │  │
         │ └────────────────────────────┘  │
         │ [Maennlich] [Weiblich]          │
         │                                  │
         │ Compound · Intermediate          │
         │ Brust · Trizeps · vord. Schulter │
         │ Equipment: Langhantel, Flachbank │
         │                                  │
         │ "Grunduebung fuer die Brust..."  │
         │                                  │
         │ [Uebung waehlen]    [Zurueck]   │
         └──────────────┬──────────────────┘
                        │
              ┌─────────┴─────────┐
              │                   │
       [Uebung waehlen]    [Zurueck]
              │                   │
       ┌──────▼──────┐    ┌──────▼──────┐
       │ Uebung wird │    │ Zurueck zum │
       │ eingefuegt  │    │ Picker/     │
       │ (Config-    │    │ Katalog     │
       │  Dialog)    │    └─────────────┘
       └─────────────┘
```

---

## F. Mobile-First Design-Prinzipien

### F.1 Touch-Targets & Thumb-Zone

**Mindestgroessen (Apple HIG / Material Design):**
- Touch-Target: mindestens 44x44pt (iOS) / 48x48dp (Android)
- Aktuell sind einige Buttons im AddWorkoutDialog zu klein (`text-xs`, `py-1.5` = ca. 28px)

**Thumb-Zone-Optimierung:**
```
┌─────────────────────────┐
│                         │  <- Schwer erreichbar
│    Titel / Info         │     (nur Anzeige)
│                         │
│─────────────────────────│
│                         │  <- Komfortabel
│    Uebungsliste         │     (Scrollen)
│    (scrollbar)          │
│                         │
│─────────────────────────│
│                         │  <- Leicht erreichbar
│  [Hauptaktion-Button]   │     (Primaer-Aktionen)
│  [Sekundaer-Aktion]     │
│                         │
└─────────────────────────┘
```

**Regeln:**
- **Primaer-Aktionen** (Speichern, Hinzufuegen, Start) immer im unteren Drittel
- **Destruktive Aktionen** (Loeschen) erfordern Wischgeste oder Drei-Punkt-Menue, nicht direkt sichtbar
- **Suchfeld** oben (sticky) — Thumb muss nur einmal hochreichen, dann Tastatur
- **Filter-Chips** horizontal scrollbar, nicht wrap (spart vertikalen Platz)

### F.2 Schnelle Eingabe (wenig Tippen)

**Strategien:**

1. **Vorausgefuellte Werte:**
   - Sets: 3 (Default), Reps: 10 (Default), Weight: letzter Wert aus History
   - "Letzte Session wiederholen" Button bei bekannten Uebungen

2. **Stepper statt Tippen:**
   ```
   Saetze: [−] 3 [+]     (Tap statt Tippen)
   Wdh:    [−] 10 [+]
   Gewicht: [60] kg       (Nummernblock, vorausgefuellt)
   ```
   - Plus/Minus-Buttons fuer Sets und Reps (Inkrement: 1)
   - Gewicht: Nummernblock mit vorausgefuelltem Wert

3. **Quick-Add aus History:**
   - "Wie beim letzten Mal" Button kopiert Sets/Reps/Weight der letzten Session
   - Progressive Overload Vorschlag: "+2.5kg" Button wenn KI-Trainer aktiv

4. **Swipe-Aktionen:**
   - Swipe rechts auf Uebung = zum Satz hinzufuegen
   - Swipe links = Loeschen (mit Bestaetigung)

5. **Bulk-Edit Modus:**
   - "Alle Saetze gleich" Toggle — aendert man einen Wert, wird er auf alle Saetze uebernommen
   - Besonders nuetzlich beim initialen Plan-Setup

### F.3 Offline-Verfuegbarkeit des Katalogs

**Aktueller Stand:**
- `useExerciseCatalog` laedt via Supabase mit `staleTime: 1h`
- Kein expliziter Offline-Cache

**Soll-Zustand:**

1. **TanStack Query Persistence:**
   ```typescript
   // Bereits verfuegbar ueber @tanstack/query-persist-client-core
   // Katalog wird in IndexedDB gecacht
   {
     queryKey: ['exercise-catalog'],
     staleTime: 24 * 60 * 60 * 1000, // 24h statt 1h
     gcTime: 7 * 24 * 60 * 60 * 1000, // 7 Tage Garbage Collection
   }
   ```

2. **Service Worker Precache:**
   - Exercise Catalog API-Response in den SW-Cache aufnehmen
   - Workbox Runtime-Caching Strategie: StaleWhileRevalidate fuer `/rest/v1/exercise_catalog`
   - Bereits 100 PWA Precache Entries — einer mehr ist vertretbar

3. **Video-Offline:**
   - Videos werden NICHT offline gecacht (zu gross)
   - Stattdessen: Placeholder-Text "Video nicht verfuegbar (offline)" mit Retry-Button
   - Optional in Zukunft: Download-Button fuer einzelne Favoriten-Videos

### F.4 Performance-Ueberlegungen

- **Katalog:** 70 Uebungen = ~50KB JSON — kein Lazy-Loading noetig
- **Bei 500+ Uebungen:** Virtualisierte Liste (@tanstack/react-virtual) noetig
- **Video-Embeds:** Lazy-Loading, nur rendern wenn im Viewport
- **Bilder/GIFs:** WebP mit `loading="lazy"`, Aspect-Ratio Placeholder

---

## G. Priorisierte Implementierungs-Roadmap

### Phase 1: Quick Wins (1-2 Tage)
1. **AddWorkoutDialog: Autocomplete integrieren** — Exercise Picker auch hier nutzen, nicht nur im Live-Workout
2. **Favoriten-System** — localStorage-basiert, Stern-Toggle im Picker
3. **"Zuletzt verwendet" Sektion** — aus Workout-History berechnen, oben im Picker anzeigen
4. **Katalog staleTime erhoehen** — 1h auf 24h, bessere Offline-UX

### Phase 2: Plan-Editor (3-5 Tage)
5. **Plan-Editor als eigenstaendige Komponente** (`PlanEditorDialog.tsx`)
6. **Eintrittspunkt aendern** — Pencil-Icon oeffnet Editor, nicht Buddy-Chat
7. **Inline-Edit fuer Sets/Reps/Weight** im Plan-Editor
8. **Drag & Drop Uebungs-Reihenfolge** (@dnd-kit, bereits im Projekt)

### Phase 3: Erweiterte Features (2-3 Tage)
9. **Superset-Markierung** — UI + Datenmodell-Erweiterung
10. **Unilaterale Uebungen** — `is_unilateral` Flag, L/R Toggle im Tracker
11. **Muskelgruppen-Filter-Chips** im Exercise Picker
12. **Equipment-Filter** mit Gym-Profil-Integration

### Phase 4: Video & KI (2-3 Tage)
13. **Video-Inline-Preview** im Exercise Picker (Play-Button)
14. **Video-Gender-Toggle** (Schema-Erweiterung + UI)
15. **Buddy "Alternative vorschlagen"** Button im Picker
16. **Video-Settings** in Profil-Einstellungen

### Phase 5: Polish (1-2 Tage)
17. **Offline-Cache** fuer Katalog (TanStack Persistence + SW)
18. **Touch-Target Audit** — alle Buttons auf 44px pruefen
19. **Stepper-Inputs** fuer Sets/Reps
20. **"Wie beim letzten Mal"** Button bei bekannten Uebungen

---

## H. Datenmodell-Aenderungen (Zusammenfassung)

### Neue DB-Felder:
```sql
-- exercise_catalog Erweiterung
ALTER TABLE exercise_catalog ADD COLUMN is_unilateral BOOLEAN DEFAULT false;
ALTER TABLE exercise_catalog ADD COLUMN video_url_de_female TEXT;
ALTER TABLE exercise_catalog ADD COLUMN video_url_en_female TEXT;

-- User-spezifische Favoriten (optional, alternativ localStorage)
CREATE TABLE user_exercise_favorites (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercise_catalog(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, exercise_id)
);
ALTER TABLE user_exercise_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_favorites" ON user_exercise_favorites
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### TypeScript-Erweiterungen:
```typescript
// CatalogExercise erweitern
interface CatalogExercise {
  // ... bestehend ...
  is_unilateral?: boolean;
  video_url_de_female?: string;
  video_url_en_female?: string;
}

// PlanExercise erweitern
interface PlanExercise {
  // ... bestehend ...
  superset_group?: number;
}

// WorkoutSet erweitern (fuer L/R Tracking)
interface WorkoutSet {
  // ... bestehend ...
  side?: 'left' | 'right'; // nur bei unilateralen Uebungen
}
```

---

## I. Kritisches Delta zum Ist-Zustand

| Problem | Schwere | Loesung |
|---------|---------|---------|
| AddWorkoutDialog nutzt Katalog nicht | HOCH | Exercise Picker integrieren (Phase 1) |
| "Neuen Plan" = nur Buddy-Chat | HOCH | Plan-Editor als Alternative (Phase 2) |
| Pencil-Icon navigiert zu Buddy statt Editor | MITTEL | Ziel aendern (Phase 2) |
| Plus-Button = einzelnes Workout, kein Plan | MITTEL | Klare Trennung der CTAs (Phase 2) |
| Keine Favoriten/Zuletzt-verwendet | MITTEL | localStorage + History-Query (Phase 1) |
| Keine Muskelgruppen-/Equipment-Filter | MITTEL | Chip-Filter im Picker (Phase 3) |
| Kein Superset-Support im Plan | NIEDRIG | Datenmodell + UI (Phase 3) |
| Keine Unilateral-Markierung | NIEDRIG | DB-Flag + L/R Toggle (Phase 3) |
| Kein Video-Gender-Toggle | NIEDRIG | Schema + UI (Phase 4) |
| Offline-Katalog nur 1h Cache | NIEDRIG | staleTime + SW (Phase 5) |
