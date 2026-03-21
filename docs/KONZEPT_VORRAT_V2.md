# Konzept: Vorratssystem v2 — Drei-Listen-Modell

> **Stand:** 2026-03-22
> **Autor:** KI-Architektur + Expertenpanel
> **Status:** KONZEPT — zur Entscheidung

---

## 1. Ausgangslage & Problemstellung

### 1.1 User-Feedback / Idee

Der Nutzer schlaegt vor, das Vorratssystem in **drei Kategorien** aufzuteilen:

1. **Favoriten-Liste** ("Was ich prinzipiell kaufen wuerde / zu Hause haette")
   - Grundstock an Zutaten, die der Nutzer prinzipiell verwendet
   - Basis fuer Rezeptvorschlaege ("passt zu deinem Kochstil")

2. **Aktueller Vorrat** ("Was ich gerade tatsaechlich da habe")
   - Abgeleitet von der Favoriten-Liste
   - Optional mit Mengenangaben
   - Basis fuer Einkaufslisten ("was fehlt dir?")

3. **Ausschluss-Liste** ("Was ich nie kaufen wuerde")
   - Zutaten, die der Nutzer aktiv ablehnt (Geschmack, Ethik, Allergie)
   - Harter Filter: Rezepte mit diesen Zutaten werden ausgeblendet

### 1.2 Aktueller Stand (v13.3)

Das bestehende System hat:
- `ingredient_catalog` (250 Items, 15 Kategorien, read-only)
- `user_pantry` mit `status` (available/low/empty) und `buy_preference` (always/sometimes/never)
- `pantryMatcher.ts` fuer Rezept-Abgleich
- `shoppingListBuilder.ts` fuer Einkaufslisten-Generierung
- Setup-Wizard mit Templates (Basis/Fitness/Vegan)

**Kernproblem:** Das aktuelle System vermischt zwei Konzepte:
- `buy_preference: 'always'` = "Ich kaufe das immer" (≈ Favorit)
- `status: 'available'` = "Ich habe das gerade" (≈ Vorrat)
- `buy_preference: 'never'` = "Ich mag das nicht" (≈ Ausschluss)

Die Datenstruktur traegt die Drei-Listen-Idee bereits **implizit** — aber die UX macht diese Unterscheidung nicht sichtbar!

---

## 2. Marktanalyse

### 2.1 Wie loesen es die fuehrenden Apps?

| App | Staples / Favoriten | Aktueller Vorrat | Ausschluss | Fazit |
|-----|---------------------|-------------------|------------|-------|
| **Mealime** | Staples-Kategorie in Einkaufsliste (manuell abhaken) | Pro-Feature "What's in my fridge" | Ueber Diaet-Filter | Leichtgewichtig, kein echtes Inventar |
| **Yummly** | Virtueller Pantry-Tracker | AI-basierte Inventar-Erkennung (Foto) | Diaet + Allergien in Profil | Am naechsten an 3-Listen, aber vermischt |
| **Whisk/Samsung Food** | Kein dedizierter Pantry | Manuelles Abwaehlen beim Einkauf | Diaet-Restriktionen + Dislikes | Kein Inventar, nur Ausschluss |
| **Plan to Eat** | Staples-Liste existiert | **Feature ENTFERNT** — "digitales Inventar bleibt nie synchron" | Ueber Tags | Bewusste Entscheidung GEGEN Inventar |
| **Grocy** | Nein (alles ist Inventar) | Volles ERP: Mengen, Ablaufdaten, Barcode | Nein | Maximaler Aufwand, maximale Kontrolle |
| **Eat This Much** | Lebensmittel-Praeferenzen | Kein Inventar | Dislikes in Profil | Nur Praeferenzen, kein Vorrat |
| **Ollie** | Nein | Foto-basiert (Kuehlschrank-Scan) | Allergien | Kein persistentes Inventar |

### 2.2 Markt-Erkenntnisse

1. **Kein Marktfuehrer hat alle 3 Listen explizit getrennt** — das waere ein USP
2. **Plan to Eat hat Inventar-Tracking bewusst entfernt** — "reale Kueche und digitales Inventar bleiben nie synchron"
3. **Trend 2025/26:** Weg von manuellem Inventar → hin zu **conversational/low-friction** Updates ("Ich hab Brokkoli verbraucht")
4. **Grocy** ist das Gegenextrem: volles ERP mit Mengen, Ablaufdaten, Barcode — aber nur fuer Power-User
5. **Dislike-Listen** sind selten als dediziertes Feature, meist in Allergie/Diaet-Einstellungen versteckt

### 2.3 Kern-Erkenntnis

> **Das Problem ist nicht die Datenstruktur — es ist die UX-Reibung.**
>
> Nutzer wollen nicht manuell zaehlen, wie viele Eier sie haben. Sie wollen:
> - "Zeig mir Rezepte, die zu meinem Kochstil passen" (→ Favoriten)
> - "Was kann ich JETZT kochen?" (→ Vorrat, grob)
> - "Bloß keine Pilze!" (→ Ausschluss)

---

## 3. Expertenpanel-Bewertung

### 3.1 Ernaehrungsberaterin (Dr. Nutrition)

> **"Die Drei-Listen-Idee ist fachlich korrekt."**
>
> In der Ernaehrungsberatung unterscheiden wir genau so:
> 1. **Grundausstattung** — was immer im Haus sein sollte (Oele, Gewuerze, Grundnahrungsmittel)
> 2. **Aktueller Bestand** — was diese Woche da ist und verbraucht werden sollte (Frischware!)
> 3. **No-Gos** — Allergene, Unvertraeglichkeiten, persoenliche Abneigungen
>
> Besonders wichtig: **Die Grundausstattung ist relativ stabil** (aendert sich vielleicht 2x im Jahr), waehrend der **aktuelle Bestand sich woechentlich aendert**. Diese unterschiedlichen Update-Frequenzen sprechen stark fuer eine Trennung.
>
> **Warnung:** Mengenangaben beim Vorrat sind fuer die meisten Menschen unrealistisch. Besser: "Da / Wenig / Leer" — das reicht fuer Ernaehrungsplanung voellig aus.

### 3.2 Lifestyle- und Fitness-Coach (Coach Pump)

> **"Fuer Fitness-Leute ist die Favoriten-Liste Gold wert."**
>
> Meine Klienten haben typischerweise 20-30 Kern-Lebensmittel, die sie rotieren:
> Haehnchenbrust, Reis, Brokkoli, Eier, Haferflocken, Whey, Quark, Bananen...
>
> Wenn die App nur Rezepte aus DIESEN Zutaten vorschlaegt, steigt die Compliance massiv.
> Die "Ausschluss-Liste" ist weniger relevant — meine Klienten wissen, was sie essen.
> Aber fuer den Massenmarkt (nicht nur Bodybuilder) ist sie wichtig.
>
> **Empfehlung:** Favoriten-Liste JA, Mengen-Tracking NEIN (zu viel Aufwand fuer Athlete).
> Stattdessen: Wochentlicher "Check-in" — "Hast du noch genug von deinen Basics?"

### 3.3 UX-Experte (UX Maestro)

> **"Die Idee ist richtig, aber die Umsetzung entscheidet."**
>
> **Drei separate Listen = drei separate Screens = kognitive Ueberlastung.**
> Plan to Eat hat sein Pantry-Feature ENTFERNT, weil es zu komplex war.
>
> Meine Empfehlung: **EINE Liste mit drei STATES**, nicht drei Listen.
> Jede Zutat hat einen Status: ❤️ Favorit / ✅ Da / ❌ Nie
>
> Die UX-Flows muessen sich UNTERSCHEIDEN:
> - **Favoriten:** Einmal einrichten, selten aendern → Setup-Wizard ist perfekt
> - **Vorrat:** Haeufig aendern, muss SCHNELL gehen → Quick-Toggle, Chat, Foto
> - **Ausschluss:** Einmal setzen, fast nie aendern → Profil-Einstellungen
>
> **Goldene Regel:** Je haeufiger die Interaktion, desto weniger Klicks.
>
> **Mengen-Tracking:** Optional und NIE erzwungen. "Da/Wenig/Leer" ist der Sweet Spot.
> Wer Mengen will (Grocy-Typ), kann es aktivieren. Default: AUS.

### 3.4 System-Architekt (Arch Mastermind)

> **"Die bestehende DB-Struktur traegt das bereits — kein Schema-Aenderung noetig!"**
>
> Aktuell:
> - `buy_preference: 'always'` = Favorit ✅
> - `buy_preference: 'sometimes'` = Normaler Vorrat ✅
> - `buy_preference: 'never'` = Ausschluss ✅
> - `status: 'available' | 'low' | 'empty'` = Aktueller Bestand ✅
>
> Die Drei-Listen-Logik IST SCHON IN DER DB. Was fehlt: **UX, die das sichtbar macht.**
>
> Architektur-Empfehlung:
> - Kein neues DB-Schema → nur UI-Refactoring
> - `buy_preference` wird zum "Listen-Typ" (Favorit/Normal/Ausschluss)
> - `status` bleibt der aktuelle Bestand
> - Rezept-Filter nutzt `buy_preference` fuer Vorschlaege, `status` fuer "jetzt kochbar"
> - Einkaufsliste: Favoriten mit `status != 'available'`

### 3.5 KI-Experte (AI Sage)

> **"Die Drei-Listen trennen sauber die KI-Anwendungsfaelle."**
>
> | Liste | KI-Nutzung | Aenderungsfrequenz |
> |-------|-----------|-------------------|
> | Favoriten | Rezeptvorschlaege filtern ("passt zu dir") | Selten (monatlich) |
> | Vorrat | "Was kann ich JETZT kochen?" + Einkaufsliste | Haeufig (woechentlich) |
> | Ausschluss | Harter Filter in ALLEN Empfehlungen | Sehr selten |
>
> **Conversational Pantry ist der Schluessel:** Statt manuell Vorrat zu pflegen,
> soll der Buddy das uebernehmen:
> - "Ich hab gestern den Rest Brokkoli verbraucht" → Status: leer
> - "Ich war einkaufen: Haenchenbrust, Reis, Eier" → Status: available
> - "Ich mag keine Pilze" → buy_preference: never
>
> Das reduziert die UX-Reibung auf natuerliche Sprache.

---

## 4. Empfehlung

### 4.1 Lohnt sich ein Konzept zur Umsetzung?

**JA — aber als UX-Refactoring, nicht als neues Feature.**

Die Drei-Listen-Logik ist **bereits in der Datenbank**. Was fehlt:
1. **UX, die die drei Konzepte sichtbar trennt**
2. **Rezept-Filter, der Favoriten vs. Vorrat unterscheidet**
3. **Ausschluss-Integration in Rezeptvorschlaege**
4. **Conversational Updates ueber den Buddy**

### 4.2 Aufwand-Schaetzung

| Komponente | Aufwand | Prioritaet |
|-----------|--------|-----------|
| PantryTabContent UI-Refactoring (3 Tabs/Sektionen) | 3-4h | P1 |
| Rezept-Filter "Passt zu mir" (Favoriten) | 2h | P1 |
| Rezept-Filter "Jetzt kochbar" (Vorrat) | 1h (existiert, muss sichtbar werden) | P1 |
| Ausschluss-Integration in Rezeptvorschlaege | 2h | P1 |
| Buddy-Aktion `update_pantry` (Chat-basiert) | 3-4h | P2 |
| Quick-Check-in ("Hast du noch genug?") | 2h | P2 |
| **Gesamt** | **~13-15h** | |

---

## 5. Implementierungskonzept

### 5.1 Datenmodell (KEINE Aenderung noetig!)

Bestehende `user_pantry` Spalten mappen direkt:

```
buy_preference: 'always'    →  ❤️ FAVORIT   (kaufe ich immer, Grundausstattung)
buy_preference: 'sometimes' →  📦 VORRAT    (kaufe ich bei Bedarf)
buy_preference: 'never'     →  🚫 AUSSCHLUSS (will ich nie)

status: 'available'  →  ✅ Da
status: 'low'        →  ⚠️ Wenig
status: 'empty'      →  ❌ Leer
```

### 5.2 UI-Konzept: PantryTabContent Redesign

#### Tab-Leiste (3 Bereiche)

```
┌─────────────────────────────────────────────────┐
│  ❤️ Meine Basics (42)  │  📦 Vorrat (18)  │  🚫 Nie (5)  │
└─────────────────────────────────────────────────┘
```

#### Tab 1: "Meine Basics" (buy_preference = 'always')

Zeigt alle Zutaten, die der Nutzer GRUNDSAETZLICH verwendet.
- Setup-Wizard zum Einrichten (existiert bereits)
- Selten geaendert (monatlich)
- Nutzen: Rezeptvorschlaege werden hierauf basiert gefiltert

```
┌─────────────────────────────────────────────────┐
│ ❤️ Meine Basics                          ＋ Neu │
│                                                  │
│ 🥩 Fleisch & Fisch                              │
│   Haehnchenbrust  ✅Da    Hackfleisch  ⚠️Wenig │
│   Lachs           ❌Leer                        │
│                                                  │
│ 🥚 Milch & Eier                                 │
│   Eier            ✅Da    Quark        ✅Da     │
│   Butter          ⚠️Wenig                      │
│                                                  │
│ 🌾 Getreide                                     │
│   Haferflocken    ✅Da    Reis         ✅Da     │
│   Vollkornnudeln  ❌Leer                        │
│                                                  │
│ 💡 3 Basics sind leer → Einkaufsliste?          │
└─────────────────────────────────────────────────┘
```

**Interaktion:** Schnell-Toggle Status (Da/Wenig/Leer) per Tap.
**CTA:** "3 Basics sind leer → Einkaufsliste erstellen?"

#### Tab 2: "Vorrat" (buy_preference = 'sometimes' UND status != 'empty')

Zeigt was TATSAECHLICH gerade im Haus ist — inkl. Basics.
- Wird haeufig aktualisiert (woechentlich)
- Nutzen: "Was kann ich JETZT kochen?"

```
┌─────────────────────────────────────────────────┐
│ 📦 Vorrat — 26 Zutaten verfuegbar              │
│                                                  │
│ 🔍 Suche...                                     │
│                                                  │
│ ✅ Verfuegbar (22)                              │
│   Haehnchenbrust, Eier, Reis, Quark, Hafer...   │
│                                                  │
│ ⚠️ Wenig (4)                                   │
│   Butter, Hackfleisch, Olivenoel, Bananen       │
│                                                  │
│ 📊 Du kannst 12 Rezepte komplett kochen         │
│    [Rezepte anzeigen]                           │
│                                                  │
│ 💬 "Sag dem Buddy was du eingekauft hast"       │
└─────────────────────────────────────────────────┘
```

**Interaktion:** Kompakte Ansicht (kein Kategorie-Akkordeon).
Alles was `status = 'available' OR 'low'` hat, egal ob Favorit oder nicht.

#### Tab 3: "Nie" (buy_preference = 'never')

Ausschluss-Liste: Zutaten, die in KEINEM Rezeptvorschlag vorkommen.

```
┌─────────────────────────────────────────────────┐
│ 🚫 Ausgeschlossen — 5 Zutaten                  │
│                                                  │
│ Rezepte mit diesen Zutaten werden nie            │
│ vorgeschlagen.                                   │
│                                                  │
│   🍄 Pilze           [Entfernen]                │
│   🫒 Oliven          [Entfernen]                │
│   🦐 Garnelen        [Entfernen]                │
│   🧀 Blauschimmel    [Entfernen]                │
│   🥜 Erdnuesse       [Entfernen] ⚠️ Allergen   │
│                                                  │
│ ＋ Zutat ausschliessen                          │
│                                                  │
│ 💡 Allergene aus dem Profil werden automatisch   │
│    ausgeschlossen.                               │
└─────────────────────────────────────────────────┘
```

### 5.3 Rezept-Integration

#### Zwei Filter-Chips auf RecipeList:

```
[Alle] [❤️ Passt zu mir] [📦 Jetzt kochbar] [⭐ Favoriten]
```

| Filter | Logik | Datenquelle |
|--------|-------|-------------|
| **Passt zu mir** | Rezept enthaelt NUR Zutaten aus Favoriten-Liste (buy_preference != 'never') | `user_pantry.buy_preference` |
| **Jetzt kochbar** | Rezept enthaelt NUR Zutaten mit `status = 'available' OR 'low'` | `user_pantry.status` |

#### Rezept-Karten Badge:

```
┌─────────────────────────┐
│ 🍗 Haenchenbrust-Bowl   │
│ ⏱ 25 Min  🔥 450 kcal   │
│                          │
│ ✅ 5/6 Zutaten da        │  ← Vorrat-Match
│ ❌ Fehlt: Brokkoli       │  ← Was fehlt
│                          │
│ [Kochen] [Einkaufsliste] │
└─────────────────────────┘
```

### 5.4 Einkaufslisten-Logik (verbessert)

**Aktuelle Logik:** Rezept-Zutaten minus Pantry-Items
**Neue Logik (Drei-Listen):**

```
Einkaufsliste = Rezept-Zutaten
              - Zutaten mit status='available'     (habe ich)
              - Zutaten mit status='low'            (optional: auch abziehen)
              - PLUS: Favoriten mit status='empty'  (Basics auffuellen!)
              - MINUS: buy_preference='never'       (will ich nie — Rezept sollte
                                                      gar nicht vorgeschlagen werden)
```

**Neues Feature: "Basics auffuellen"**
```
┌─────────────────────────────────────────────┐
│ Einkaufsliste erstellen                      │
│                                              │
│ ☑️ Aus Rezept: Haenchenbrust-Bowl           │
│    → 1x Brokkoli (200g)                     │
│    → 1x Sojasosse                           │
│                                              │
│ ☑️ Basics auffuellen (3 leer)               │
│    → Lachs                                  │
│    → Vollkornnudeln                         │
│    → Bananen                                │
│                                              │
│ [Erstellen]                                  │
└─────────────────────────────────────────────┘
```

### 5.5 Buddy-Integration (Conversational Pantry)

Neue ActionTypes fuer den Buddy:

```typescript
// Vorrat aktualisieren per Chat
'update_pantry_status'  // "Brokkoli ist alle" → status: empty
'add_to_pantry'         // "Hab Lachs gekauft" → status: available
'exclude_ingredient'    // "Ich mag keine Pilze" → buy_preference: never
'set_as_favorite'       // "Reis hab ich immer da" → buy_preference: always
```

**Chat-Beispiele:**
```
User: "Ich war einkaufen: Haehnchenbrust, Reis, Eier, Brokkoli"
Buddy: ✅ 4 Zutaten als verfuegbar markiert!
       Du kannst jetzt 8 Rezepte komplett kochen. Soll ich dir welche zeigen?

User: "Ich mag keine Pilze und keine Oliven"
Buddy: 🚫 Pilze und Oliven auf deine Ausschluss-Liste gesetzt.
       Rezepte mit diesen Zutaten werden dir nicht mehr vorgeschlagen.

User: "Der Reis ist alle"
Buddy: ✅ Reis als "leer" markiert. Soll ich ihn auf die Einkaufsliste setzen?
```

### 5.6 Woechentlicher Check-in (Push/Buddy)

```
┌─────────────────────────────────────────────┐
│ 📋 Woechentlicher Vorrats-Check             │
│                                              │
│ Hast du noch genug von deinen Basics?       │
│                                              │
│ Haehnchenbrust  [✅ Da] [⚠️ Wenig] [❌ Leer] │
│ Eier            [✅ Da] [⚠️ Wenig] [❌ Leer] │
│ Reis            [✅ Da] [⚠️ Wenig] [❌ Leer] │
│ Haferflocken    [✅ Da] [⚠️ Wenig] [❌ Leer] │
│ ...                                          │
│                                              │
│ [Fertig — Einkaufsliste aus Leeren?]        │
└─────────────────────────────────────────────┘
```

---

## 6. Zusammenfassung

### Was ist die Empfehlung?

| Aspekt | Entscheidung | Begruendung |
|--------|-------------|-------------|
| **Drei-Listen-Konzept** | ✅ JA | Fachlich korrekt, UX-relevant, USP gegenueber Markt |
| **Neue DB-Tabellen** | ❌ NEIN | Bestehende `buy_preference` + `status` reichen |
| **Mengen-Tracking** | ⚠️ OPTIONAL | Default: Da/Wenig/Leer. Power-User koennen Mengen eingeben |
| **Separate Screens** | ❌ NEIN | 3 Tabs in EINEM Screen (PantryTabContent) |
| **Rezept-Filter** | ✅ JA | "Passt zu mir" + "Jetzt kochbar" auf RecipeList |
| **Ausschluss-Filter** | ✅ JA | Harter Filter in ALLEN Rezeptvorschlaegen |
| **Conversational Updates** | ✅ JA | Buddy-Aktionen fuer natuerliche Vorratspflege |
| **Woechentlicher Check-in** | ✅ JA | Schnell-Abfrage der Top-Basics |

### Warum es sich lohnt:

1. **Kein Marktfuehrer hat das** — echtes Differenzierungsmerkmal
2. **Kein DB-Umbau noetig** — nur UX-Refactoring
3. **Loest das "Plan to Eat"-Problem** — Inventar bleibt nie synchron?
   Loesung: Favoriten aendern sich selten, Vorrat wird conversational gepflegt
4. **Fitness-Relevanz** — Bodybuilder rotieren 20-30 Lebensmittel, Favoriten-Liste bildet das perfekt ab
5. **Ernaehrungsberater-Best-Practice** — Grundausstattung vs. aktueller Bestand ist Standard in der Beratung

### Geschaetzter Aufwand:

**Phase 1 (P1, ~8h):** PantryTabContent Redesign (3 Tabs) + Rezept-Filter-Chips + Ausschluss-Integration
**Phase 2 (P2, ~6h):** Buddy-Aktionen + Woechentlicher Check-in + "Basics auffuellen" CTA

---

## Quellen

- [Best meal planning apps 2026 — Cooking with Robots](https://cookingwithrobots.com/blog/best-meal-planning-app-2026)
- [Meal Planning Apps with Pantry Tracking — MealThinker](https://mealthinker.com/blog/meal-planning-app-pantry-tracking)
- [AI Meal Planning with Pantry Scanning vs Recipe Aggregators](https://www.alibaba.com/product-insights/ai-meal-planning-apps-with-pantry-scanning-vs-recipe-aggregators-do-camera-first-tools-actually-cut-grocery-waste.html)
- [Grocy — ERP beyond your fridge (Open Source)](https://grocy.info/)
- [Mealime — How the grocery list works](https://support.mealime.com/article/75-how-the-grocery-list-works)
- [How to make an app like Whisk](https://ideausher.com/blog/how-to-make-app-like-whisk/)
- [A Dietitian's Grocery List — Staples for a Healthy Kitchen](https://jimwhitefit.com/a-dietitians-grocery-list-staples-for-a-healthy-kitchen/)
- [Meal Prep Guide — Jenna the Dietitian](https://www.jennathedietitian.com/post/nutritious-and-delicious-a-dietitian-s-guide-to-meal-prep)
- [Balanced Grocery List — Culina Health](https://culinahealth.com/balanced-grocery-list/)
- [Case Study: Perfect Recipes App — Tubik Studio](https://blog.tubikstudio.com/case-study-recipes-app-ux-design/)
- [Designing a better cook: Yummly — UX Collective](https://uxdesign.cc/designing-a-better-cook-a-look-at-yummly-4d7fb1dac340)
