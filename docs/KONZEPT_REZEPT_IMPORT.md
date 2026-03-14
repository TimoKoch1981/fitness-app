# Konzept: Rezept-Import aus dem Internet

> **Ziel:** Nutzer koennen Rezepte von beliebigen Websites (Chefkoch, EatSmarter, BBC Good Food, etc.)
> per URL importieren. Die App extrahiert automatisch Titel, Zutaten, Schritte, Makros und Bild —
> der Nutzer kann alles bearbeiten und als eigenes Rezept speichern.

---

## 1. Wettbewerber-Analyse

| App | Methode | Staerken | Schwaechen |
|-----|---------|----------|------------|
| **MyFitnessPal** | URL-Import + 14M Food-DB Match | Makro-Genauigkeit durch DB-Match | Versagt bei verschluesseltem Text, Ads |
| **Paprika** | In-App Browser, 600+ Seiten nativ | Sehr zuverlaessig, lokale Speicherung | Geschlossenes System, kein Makro-Match |
| **RecipeSage** | URL + "Deep Import" Toggle (KI) | KI-Fallback fuer schwierige Seiten | Open-Source, aber weniger poliert |
| **Samsung Food** | JSON-LD + hRecipe Standards | Standard-konform | Kein KI-Fallback |
| **Mealie** | Markdown-Konvertierung + LLM-Fallback | Open-Source, sehr flexibel | Self-Hosted, Token-Kosten |
| **CopyMeThat** | Browser-Extension | Funktioniert ueberall | Extra Extension noetig |

**Erkenntnis:** Alle erfolgreichen Apps nutzen eine **Kaskade**: Strukturierte Daten zuerst, KI als Fallback.

---

## 2. Technische Architektur

### 2.1 Parsing-Kaskade (Server-seitig)

```
User gibt URL ein
        │
        ▼
┌──────────────────────────┐
│  Supabase Edge Function  │  (Server-seitig, kein CORS-Problem)
│  "recipe-import"         │
│                          │
│  1. HTML fetchen         │
│  2. JSON-LD extrahieren  │──→ schema.org/Recipe gefunden? → Fertig
│  3. Microdata-Fallback   │──→ itemscope Recipe gefunden? → Fertig
│  4. KI-Fallback          │──→ HTML→Markdown→LLM→JSON
│  5. Fehler               │──→ "Konnte nicht extrahiert werden"
└──────────────────────────┘
        │
        ▼
  Strukturiertes JSON zurueck an Client
```

### 2.2 Warum Server-seitig?

- **CORS:** Browser kann keine beliebigen Websites fetchen
- **Sicherheit:** HTML wird server-seitig geparst, kein XSS-Risiko
- **Zentrales Update:** Parser-Fixes deployen ohne App-Update
- **Rate-Limiting:** Pro User, nicht pro Client-IP

### 2.3 JSON-LD Extraktion (Primaerer Pfad, ~80% der Food-Blogs)

**Standard:** `schema.org/Recipe` — von Google fuer Rich Results empfohlen.

```json
{
  "@type": "Recipe",
  "name": "Protein Pancakes",
  "recipeIngredient": ["100g Haferflocken", "2 Eier", "150g Magerquark"],
  "recipeInstructions": [{ "@type": "HowToStep", "text": "Alles verruehren..." }],
  "prepTime": "PT10M",
  "cookTime": "PT5M",
  "recipeYield": "2 Portionen",
  "nutrition": {
    "calories": "320 kcal",
    "proteinContent": "28g",
    "carbohydrateContent": "35g",
    "fatContent": "8g"
  },
  "recipeCategory": "Fruehstueck",
  "image": "https://..."
}
```

**Adoption:** 80%+ der Food-Blogs nutzen dies (WordPress-Plugins wie WP Recipe Maker generieren es automatisch). Google incentiviert es durch Rich Results (bis zu 35% mehr Traffic).

**Mapping auf FitBuddy `recipes`-Tabelle:**

| JSON-LD Feld | FitBuddy Spalte | Transformation |
|-------------|----------------|----------------|
| `name` | `title` | Direkt |
| `description` | `description` | Direkt |
| `recipeIngredient[]` | `ingredients[]` | Parsing: Menge + Einheit + Name trennen |
| `recipeInstructions[]` | `steps[]` | `{text, duration_min}` |
| `prepTime` (ISO 8601) | `prep_time_min` | PT10M → 10 |
| `cookTime` (ISO 8601) | `cook_time_min` | PT5M → 5 |
| `recipeYield` | `servings` | Zahl extrahieren |
| `nutrition.calories` | `calories_per_serving` | Zahl extrahieren |
| `nutrition.proteinContent` | `protein_per_serving` | Zahl extrahieren |
| `nutrition.carbohydrateContent` | `carbs_per_serving` | Zahl extrahieren |
| `nutrition.fatContent` | `fat_per_serving` | Zahl extrahieren |
| `recipeCategory` | `meal_type` | Mapping (Breakfast→breakfast, etc.) |
| `image` | `image_url` | URL uebernehmen (kein Re-Upload) |

### 2.4 KI-Fallback (Sekundaerer Pfad, ~20% der Seiten)

Wenn kein JSON-LD/Microdata gefunden:

1. HTML → Markdown konvertieren (Turndown-Library, ~3KB)
2. Irrelevantes entfernen (Nav, Footer, Ads, Kommentare)
3. An bestehende `ai-proxy` Edge Function senden mit speziellem Prompt:

```
Extrahiere aus diesem Text ein Rezept als JSON:
{title, description, ingredients: [{name, amount, unit}],
 steps: [{text}], prep_time_min, cook_time_min, servings,
 calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving}

Text: [Markdown]
```

**Token-Kosten:** ~500-1500 Tokens pro Import (gpt-4o-mini: ~$0.001)

### 2.5 Zutat-Parsing

Kritisch fuer Makro-Genauigkeit. Beispiel:
- Input: `"200g Haehnchenbrust, gewuerfelt"`
- Output: `{ name: "Haehnchenbrust", amount: 200, unit: "g" }`

**Regex-basiert (DE+EN):**
```
/^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|EL|TL|Stueck|Prise|Tasse|cup|tbsp|tsp|oz|lb)?\s+(.+)$/
```

Fallback: Gesamter String als `name`, amount=1, unit="Stueck".

---

## 3. UX-Flow

### 3.1 Bewaehertes Muster (Paprika/RecipeSage/Mealie)

```
┌─────────────────────────────────────┐
│  Rezept importieren                 │
│                                     │
│  🔗 URL einfuegen:                 │
│  ┌─────────────────────────────┐   │
│  │ https://chefkoch.de/...     │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Importieren]                      │
└─────────────────────────────────────┘
          │  (1-3 Sek)
          ▼
┌─────────────────────────────────────┐
│  Vorschau & Bearbeiten              │
│                                     │
│  Titel: [Protein Pancakes    ]      │
│  Kategorie: [Fruehstueck ▼]        │
│  Portionen: [2]                     │
│  Zubereitung: [10] min              │
│  Kochzeit: [5] min                  │
│                                     │
│  Makros pro Portion:                │
│  Kcal [320] P [28] K [35] F [8]    │
│                                     │
│  Zutaten: (editierbar)              │
│  ├ 100g Haferflocken                │
│  ├ 2 Eier                          │
│  └ 150g Magerquark                  │
│                                     │
│  Schritte: (editierbar)             │
│  1. Alles verruehren...             │
│  2. In der Pfanne braten...         │
│                                     │
│  Quelle: chefkoch.de               │
│                                     │
│  [Speichern]  [Abbrechen]          │
└─────────────────────────────────────┘
```

### 3.2 Einstiegspunkt

**Option A (empfohlen):** Neuer Tab/Button im RecipeEditor
- "Aus URL importieren" neben "Manuell erstellen"
- Oeffnet Import-Dialog → befuellt RecipeEditor-Felder

**Option B:** Buddy-Integration
- "Importiere dieses Rezept: https://..."
- Buddy nutzt Edge Function, zeigt Vorschau, speichert via `save_recipe` Action

**Option C:** Share-to-App (Capacitor, spaeter)
- Nutzer teilt URL von Browser an FitBuddy
- Deep-Link oeffnet Import-Dialog

**Empfehlung:** A + B parallel. C als spaetere Erweiterung.

---

## 4. FitBuddy-Mehrwert (vs. generische Rezept-Apps)

| Feature | Generische Apps | FitBuddy |
|---------|----------------|----------|
| Import | ✅ | ✅ |
| Makro-Berechnung | ❌ (uebernimmt nur was da steht) | ✅ Auto-Berechnung aus Zutaten |
| Allergen-Erkennung | ❌ | ✅ `detectAllergens()` (10 EU-Kategorien) |
| Auto-Tags | ❌ | ✅ `deriveAutoTags()` (High-Protein, Low-Carb, Schnell) |
| Fitness-Goal Mapping | ❌ | ✅ Muskelaufbau/Diaet/Ausdauer |
| Praeferenz-Learning | ❌ | ✅ nutritionPreferenceEngine lernt mit |
| Buddy-Integration | ❌ | ✅ "Importiere und passe an meine Makros an" |

---

## 5. Edge Function Spezifikation

**Name:** `recipe-import`
**Route:** `POST /functions/v1/recipe-import`
**Auth:** JWT Required (authenticated users only)
**Rate-Limit:** 10 Imports/User/Stunde

### Request
```json
{
  "url": "https://chefkoch.de/rezepte/12345/protein-pancakes.html"
}
```

### Response (Erfolg)
```json
{
  "success": true,
  "source": "json-ld",
  "recipe": {
    "title": "Protein Pancakes",
    "description": "Fluffige Pancakes mit extra Protein",
    "meal_type": "breakfast",
    "prep_time_min": 10,
    "cook_time_min": 5,
    "servings": 2,
    "calories_per_serving": 320,
    "protein_per_serving": 28,
    "carbs_per_serving": 35,
    "fat_per_serving": 8,
    "ingredients": [
      { "name": "Haferflocken", "amount": 100, "unit": "g" },
      { "name": "Eier", "amount": 2, "unit": "Stueck" },
      { "name": "Magerquark", "amount": 150, "unit": "g" }
    ],
    "steps": [
      { "text": "Alle Zutaten in einer Schuessel verruehren." },
      { "text": "In einer beschichteten Pfanne bei mittlerer Hitze ausbacken." }
    ],
    "tags": ["High-Protein", "Schnell"],
    "allergens": ["gluten", "ei", "laktose"],
    "image_url": "https://img.chefkoch-cdn.de/...",
    "source_url": "https://chefkoch.de/rezepte/12345/protein-pancakes.html"
  }
}
```

### Response (Fehler)
```json
{
  "success": false,
  "error": "no_recipe_found",
  "message": "Kein Rezept auf dieser Seite gefunden."
}
```

---

## 6. Rechtliche Bewertung

### 6.1 Urheberrecht
- **Zutatenlisten:** NICHT urheberrechtlich geschuetzt (US Copyright Office explizit; EU analog)
- **Bare Anweisungen:** NICHT geschuetzt (Verfahren/Methoden)
- **Kreative Texte:** GESCHUETZT (persoenliche Geschichten, einzigartige Formulierungen, Fotos)
- **Fazit:** Strukturierte Daten (Zutaten, Schritte, Makros) extrahieren = unbedenklich

### 6.2 Terms of Service
- Viele Seiten verbieten Scraping in AGB (Chefkoch, AllRecipes)
- **Aber:** JSON-LD wird explizit fuer maschinelle Verarbeitung publiziert (Google, Pinterest)
- **Nutzer-initiiert** (kein Bulk-Crawl) = praktisch nicht durchsetzbar
- Paprika, CopyMeThat, Samsung Food operieren seit Jahren so

### 6.3 Risikominimierung
- ✅ Nur nutzer-initiiert (1 URL pro Aktion, kein Crawling)
- ✅ Nur strukturierte/faktische Daten extrahieren (keine kreativen Texte)
- ✅ `source_url` immer speichern (Attribution)
- ✅ Bilder nur verlinken, nicht re-hosten
- ✅ Rate-Limiting (10/Stunde)
- ✅ Kein automatisches Scraping, kein Index-Aufbau

**Risikoeinschaetzung:** GERING — vergleichbar mit jedem Browser-Bookmark.

---

## 7. Implementierungsplan

### Phase 1: Edge Function + Basis-UI (~1 Tag)
1. Edge Function `recipe-import` erstellen (HTML fetch, JSON-LD parse)
2. Import-Dialog Komponente (URL-Eingabe, Loading, Vorschau)
3. Integration in RecipeEditor (vorausgefuellte Felder)
4. `source_url` in Rezept-Karte anzeigen

### Phase 2: KI-Fallback + Polish (~0.5 Tage)
5. HTML→Markdown Konvertierung in Edge Function
6. LLM-Fallback ueber bestehenden `ai-proxy`
7. Besseres Zutat-Parsing (Regex DE+EN)
8. Error-Handling + User-Feedback

### Phase 3: Buddy-Integration (~0.5 Tage)
9. Neuer ActionType `import_recipe` im Registry
10. Nutrition Agent Prompt: URL erkennen → Import ausfuehren
11. Buddy zeigt Vorschau → User bestaetigt → Speichern

### Phase 4: Erweiterungen (spaeter)
12. Share-to-App (Capacitor Deep Links)
13. Clipboard-Erkennung (URL automatisch erkennen)
14. Batch-Import (mehrere URLs)
15. Browser-Extension (CopyMeThat-Stil)

---

## 8. Technische Abhaengigkeiten

| Komponente | Abhaengigkeit | Status |
|-----------|---------------|--------|
| Edge Function | Supabase Edge Functions Runtime (Deno) | ✅ Vorhanden |
| HTML Parsing | `deno-dom` (Deno-nativer DOM-Parser) | Neu |
| JSON-LD Parse | Regex/DOM querySelector | Kein Package noetig |
| KI-Fallback | `ai-proxy` Edge Function | ✅ Vorhanden |
| Zutat-Parsing | Regex (custom) | Neu, ~50 Zeilen |
| UI | RecipeEditor (vorausfuellen) | ✅ Vorhanden |
| DB | `recipes` Tabelle + `source_url` Spalte | ✅ Vorhanden |
| Auth | JWT Validation in Edge Function | ✅ Vorhanden |

**Geschaetzter Aufwand:** ~2 Tage fuer Phase 1+2, ~0.5 Tage fuer Phase 3.

---

## 9. Offene Entscheidungen

1. **Bild-Handling:** Nur verlinken (schnell, rechtssicher) oder re-upload nach recipe-images Bucket (offline-faehig, aber rechtlich fragwuerdig)?
   - **Empfehlung:** Nur verlinken. Bei Bedarf spaeter optionalen Re-Upload anbieten.

2. **Makro-Quelle:** Makros vom Rezept uebernehmen oder aus Zutaten neu berechnen?
   - **Empfehlung:** Beides anzeigen. Rezept-Makros als Default, "Neu berechnen" Button.

3. **Duplikat-Erkennung:** Warnen wenn `source_url` bereits importiert?
   - **Empfehlung:** Ja, einfacher Check vor Import.
