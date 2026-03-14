# Konzept: Vorratsverwaltung, Einkaufsliste & "Kochen mit Vorrat"

> **Version:** 2.0 | **Datum:** 2026-03-14 | **Status:** Konzept (erweitert um Zutatenkatalog)

---

## Zusammenfassung

Drei zusammenhaengende Features, die FitBuddy von der Konkurrenz abheben:

| Phase | Feature | Aufwand | Prio |
|-------|---------|---------|------|
| **A** | Conversational Pantry (Vorrat via Buddy-Chat) | 1-2 Tage | HOCH |
| **B** | "Kochen mit Vorrat" (Rezeptfilter + Buddy) | 1 Tag | HOCH |
| **C** | Smarte Einkaufsliste (Rezept → Liste − Vorrat) | 2-3 Tage | MITTEL |

**Kernidee:** Kein Nutzer will ein Warenlager verwalten. Der Vorrat wird *nebenbei* gepflegt — durch Chat, Meal-Logging und Einkaufszettel. Der Buddy weiss dann, was da ist, und kann Rezepte vorschlagen.

| Phase | Feature | Aufwand | Prio |
|-------|---------|---------|------|
| **0** | Zutatenkatalog (Master-DB + Quick-Setup) | 1 Tag | VORAUSSETZUNG |

---

## Phase 0: Zutatenkatalog (Master-Datenbank)

### Warum zuerst?

Ohne Zutatenkatalog muss der Nutzer jede Zutat frei eintippen → Tippfehler, Duplikate, keine Makro-Daten.
Der Katalog ist die **Grundlage** fuer Vorrat, Einkaufsliste UND Rezept-Matching.

### Datenquellen

| Quelle | Lizenz | Nutzen |
|--------|--------|--------|
| **BLS 4.0** (Bundeslebensmittelschluessel) | CC BY 4.0 (GRATIS) | 1.000 Basis-Zutaten, 138 Naehrwerte, offiziell DE |
| **OpenFoodFacts** | ODbL (GRATIS) | 4 Mio+ Produkte, Barcode-Scan, EAN-13 |
| **USDA FoodData Central** | CC0 (GRATIS) | 6.200 Foundation Foods, Fallback |

**Strategie:** BLS 4.0 als Primaerquelle fuer Naehrwerte. OpenFoodFacts fuer Barcode-Scan. Eigener kuratierter Katalog (~250 Items) als Frontend-Referenz.

### DB-Tabelle: `ingredient_catalog`

```sql
CREATE TABLE ingredient_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_de TEXT NOT NULL,              -- "Haferflocken"
  name_en TEXT,                       -- "Oats"
  category TEXT NOT NULL,             -- eine der 15 Kategorien
  subcategory TEXT,                   -- optionale Unterkategorie
  is_staple BOOLEAN DEFAULT false,    -- ~80 Items die fast jeder hat
  is_fitness BOOLEAN DEFAULT false,   -- High-Protein / Fitness-relevant
  is_vegan BOOLEAN DEFAULT true,      -- fuer Template-Filter
  default_unit TEXT DEFAULT 'g',      -- g, ml, Stueck, EL, TL, Packung
  default_quantity TEXT,              -- "500g", "1 Packung" (typische Kaufmenge)
  calories_per_100g NUMERIC,          -- aus BLS 4.0
  protein_per_100g NUMERIC,
  carbs_per_100g NUMERIC,
  fat_per_100g NUMERIC,
  fiber_per_100g NUMERIC,
  allergens TEXT[],                   -- ["gluten", "laktose", "ei", ...]
  storage_type TEXT DEFAULT 'vorratsschrank',
    -- kuehlschrank, gefriertruhe, vorratsschrank, gewuerze, gemuese_obst
  shelf_life_days INT,               -- typische Haltbarkeit in Tagen
  search_terms TEXT[],               -- ["Haferflocken", "Oats", "Porridge"]
  bls_code TEXT,                     -- BLS 4.0 Referenz (optional)
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index fuer Suche
CREATE INDEX idx_ingredient_catalog_search ON ingredient_catalog USING GIN (search_terms);
CREATE INDEX idx_ingredient_catalog_category ON ingredient_catalog (category);

-- Kein RLS noetig — globaler Katalog, read-only fuer alle
GRANT SELECT ON ingredient_catalog TO authenticated, anon;
```

### 15 Kategorien (~250 Items)

| # | Kategorie | DE | Items | Staples |
|---|-----------|-----|-------|---------|
| 1 | `gemuese` | Gemuese | ~35 | Zwiebeln, Kartoffeln, Karotten, Tomaten, Knoblauch |
| 2 | `obst` | Obst | ~20 | Aepfel, Bananen, Zitronen |
| 3 | `fleisch_fisch` | Fleisch & Fisch | ~20 | Haehnchenbrust, Hackfleisch, Lachs |
| 4 | `milchprodukte` | Milchprodukte & Eier | ~18 | Milch, Eier, Butter, Quark, Joghurt, Kaese |
| 5 | `getreide_nudeln` | Getreide & Nudeln | ~18 | Reis, Nudeln, Haferflocken, Brot, Mehl |
| 6 | `huelsenfruechte` | Huelsenfruechte & Samen | ~12 | Linsen, Kichererbsen, Kidneybohnen |
| 7 | `nuesse` | Nuesse & Trockenfrueche | ~10 | Mandeln, Walnuesse, Erdnuesse |
| 8 | `oele_fette` | Oele & Fette | ~8 | Olivenoel, Rapsoel, Butter |
| 9 | `gewuerze` | Gewuerze & Kraeuter | ~28 | Salz, Pfeffer, Paprika, Curry, Oregano |
| 10 | `konserven` | Konserven & Saucen | ~18 | Dosentomaten, Tomatenmark, Kokosmilch, Senf |
| 11 | `backzutaten` | Backzutaten | ~10 | Mehl, Zucker, Backpulver, Vanillezucker |
| 12 | `getraenke` | Getraenke | ~8 | Milch, Hafermilch, Saft |
| 13 | `tiefkuehl` | Tiefkuehl | ~10 | TK-Gemuese, TK-Beeren, TK-Pizza |
| 14 | `brot_aufstriche` | Brot & Aufstriche | ~8 | Vollkornbrot, Honig, Marmelade, Nutella |
| 15 | `supplements` | Supplements & Proteine | ~10 | Whey Protein, Kreatin, Omega-3, EAA |

**Gesamt: ~250 Items**, davon ~80 `is_staple`, ~40 `is_fitness`

### Quick-Setup Templates (Onboarding)

Statt 250 Items einzeln durchzugehen, waehlt der Nutzer ein Template:

| Template | Beschreibung | Pre-selected Items |
|----------|-------------|-------------------|
| **Basis-Kueche** | Standard deutscher Haushalt | ~60 Staples |
| **Fitness-Kueche** | Basis + High-Protein | ~80 (Staples + Fitness) |
| **Vegane Kueche** | Basis ohne Tierprodukte + Tofu etc. | ~65 (vegan only) |
| **Leere Kueche** | Komplett leer, alles selbst waehlen | 0 |

**UX-Flow (3 Schritte, <2 Minuten):**

1. **Template waehlen** — 4 grosse Karten mit Icon + Beschreibung
2. **Anpassen** — Kategorien aufklappbar, Items an/aus togglen, Suche oben
3. **Fertig** — "Du hast 73 Zutaten in deinem Vorrat. Los geht's!"

### Nutzer-Praeferenzen pro Zutat

Ueber `user_pantry` hinaus brauchen wir:

```sql
-- Erweiterte user_pantry mit Katalog-Referenz
CREATE TABLE user_pantry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredient_catalog(id), -- FK zum Katalog (optional)
  ingredient_name TEXT NOT NULL,                         -- Freitext-Fallback
  ingredient_normalized TEXT NOT NULL,                   -- lowercase, singular
  category TEXT DEFAULT 'sonstiges',
  quantity_text TEXT,                                    -- "500g", "2 Stueck"
  storage_location TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'low', 'empty')),
  buy_preference TEXT DEFAULT 'sometimes'
    CHECK (buy_preference IN ('always', 'sometimes', 'never')),
    -- always = "habe ich immer da" (Auto-Einkaufsliste wenn leer)
    -- sometimes = "kaufe ich bei Bedarf"
    -- never = "kaufe/esse ich nicht" (Rezeptfilter!)
  added_at TIMESTAMPTZ DEFAULT now(),
  expires_at DATE,
  last_confirmed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, ingredient_normalized)
);
```

**`buy_preference` ist der Schluessel:**
- `always` → Wenn Vorrat leer → automatisch auf Einkaufsliste
- `sometimes` → Nur wenn Rezept es braucht → auf Einkaufsliste
- `never` → Rezepte mit dieser Zutat werden nicht vorgeschlagen / niedrig gerankt

### Allergene-Integration

Der Nutzer hat bereits im Onboarding Allergene angegeben (9 Kategorien).
Der Katalog hat `allergens[]` pro Zutat.
→ Zutaten mit Nutzer-Allergenen werden automatisch `buy_preference: 'never'` gesetzt.

---

## Marktanalyse

### Wettbewerber-Vergleich

| Feature | SuperCook | Yummly | Paprika 3 | Whisk | Mealime | EatSmarter | Chefkoch | NoWaste |
|---------|-----------|--------|-----------|-------|---------|------------|----------|---------|
| Vorrat-Tracking | ✅ (20+ Kat.) | Basic | ✅ (+Ablauf) | ✅ | ❌ | Checkliste | ❌ | ✅ (AI Scan) |
| Einkaufsliste | ❌ | ✅ | ✅ (Auto-Sort) | ✅ | ✅ | ✅ | Via Bring! | ✅ |
| Rezept→Liste | ❌ | ✅ | ✅ (Mengen-Merge) | ✅ | ✅ | ✅ | Via Bring! | ❌ |
| Kochen mit Vorrat | ✅ (Kern) | Ja (sekundaer) | ❌ | Vision AI | ❌ | ❌ | ❌ | Ja (Ablauf) |
| Makro-Tracking | ❌ | Basic | ❌ | Basic | ✅ | ✅ | ❌ | ❌ |
| KI-Features | ❌ | Personalisierung | ❌ | Vision AI | ❌ | ❌ | ❌ | Receipt AI |

**Marktluecke:** KEIN Wettbewerber kombiniert alle 3 Saeulen (Vorrat + Einkauf + "Was kann ich kochen?") MIT Makro-Tracking. Das ist FitBuddys Differenzierungschance.

### Haeufigste Fehler (Learnings aus gescheiterten Apps)

1. **"Inventory-Management-Falle"**: Nutzer wollen kein ERP-System → leichtgewichtig halten
2. **Initiales Setup-Wall**: SuperCook 20+ Kategorien beim Onboarding → hohe Abbruchrate
3. **Stale Data**: Nutzer fuegen hinzu, entfernen aber nie → Auto-Dekrement bei Meal-Logging
4. **Einheiten-Chaos**: "200g Mehl" vs "2 Tassen Mehl" → Normalisierung noetig
5. **Scope Creep**: Plan-to-Eat hat Pantry-Feature ENTFERNT weil es mehr verwirrte als half

---

## Phase A: Conversational Pantry (Vorrat via Chat)

### Prinzip
Kein eigener "Vorrat verwalten"-Screen noetig. Der Buddy ist das Interface.

### Nutzer-Interaktionen

```
User: "Ich habe eingekauft: Haehnchenbrust, Reis, Brokkoli, Eier, Quark"
Buddy: "✅ 5 Zutaten zum Vorrat hinzugefuegt! Du hast jetzt 12 Zutaten verfuegbar."

User: "Der Reis ist alle"
Buddy: "✅ Reis als aufgebraucht markiert."

User: "Was habe ich noch da?"
Buddy: [zeigt Vorrat als kompakte Liste]
```

### DB-Tabelle: `user_pantry`

Siehe Phase 0 — erweiterte Version mit `ingredient_id` FK und `buy_preference`.

### Kategorien

Uebernommen aus dem Zutatenkatalog (15 Kategorien statt 6) — konsistent zwischen Katalog, Vorrat und Einkaufsliste.

### ActionType: `update_pantry`

```typescript
// In ActionRegistry registrieren
{
  type: 'update_pantry',
  schema: z.object({
    action: z.enum(['add', 'remove', 'set_status', 'clear_all']),
    items: z.array(z.object({
      name: z.string(),
      category: z.string().optional(),
      quantity: z.string().optional(),
      status: z.enum(['available', 'low', 'empty']).optional(),
      expires_at: z.string().optional(),
    })).optional(),
  }),
  execute: async (data, ctx) => { /* upsert/delete in user_pantry */ }
}
```

### User-Skill: `pantry_inventory` (18. dynamischer Skill)

```typescript
// Max 50 Items, gruppiert nach Kategorie
{
  name: 'pantry_inventory',
  description: 'Aktuelle Vorratsliste des Nutzers',
  data: {
    total_items: 23,
    by_category: {
      kuehlschrank: ['Eier (6 Stueck)', 'Quark 500g', 'Milch'],
      vorratsschrank: ['Reis 1kg', 'Haferflocken', 'Whey Protein'],
      gewuerze: ['Salz', 'Pfeffer', 'Kurkuma'],
      // ...
    },
    expiring_soon: ['Haehnchenbrust (morgen)', 'Joghurt (uebermorgen)'],
    low_items: ['Eier (wenig)'],
  }
}
```

### Auto-Dekrement bei Meal-Logging

Wenn ein Nutzer ein Rezept als Mahlzeit loggt:
1. Rezept-Zutaten mit Vorrat abgleichen (fuzzy Name-Matching)
2. Optional: "Zutaten vom Vorrat abziehen?" Bestaetigungs-Chip im Chat
3. Matched Items auf `status: 'low'` oder `status: 'empty'` setzen

### UI-Integration (minimal, Phase A)

- **Kein eigener Screen** — Buddy-Chat ist das primaere Interface
- **Optional:** Kleiner "Vorrat"-Badge auf der Ernaehrungsseite (Anzahl Items)
- **Optional:** Vorrat-Chip im Buddy ("Was habe ich?", "Vorrat aktualisieren")

---

## Phase B: "Kochen mit Vorrat" (Rezeptfilter)

### Buddy-Integration

```
User: "Was kann ich mit meinem Vorrat kochen?"
Buddy: "Du hast 23 Zutaten. Hier sind Rezepte die du SOFORT kochen kannst:
  1. 🟢 Haehnchen-Reis-Bowl (alle 6 Zutaten da!)
  2. 🟡 Protein-Pancakes (fehlt nur: Banane)
  3. 🟡 Brokkoli-Quark-Auflauf (fehlt nur: Kaese)
  Soll ich eins davon vorschlagen?"
```

### Logik

Der Nutrition Agent hat bereits Zugriff auf alle Rezepte (max 50). Mit dem `pantry_inventory` Skill kann er:

1. Rezept-Zutaten gegen Vorrat matchen (Fuzzy: "Haehnchenbrust" ↔ "Haehnchen")
2. Match-Prozent berechnen (5/6 Zutaten = 83%)
3. Sortieren nach: Match% DESC, dann Makro-Fit, dann Favoriten
4. "Fehlende Zutaten" anzeigen (SuperCook-Pattern: "fehlt nur 1-2")

### UI: Filter-Chip auf Rezeptliste

```
[Alle] [Favoriten] [🟢 Mit Vorrat kochbar] [Eigene]
```

- **🟢 Mit Vorrat kochbar:** Zeigt Rezepte sortiert nach Vorrat-Match
- Jede Rezeptkarte zeigt: "5/6 Zutaten vorhanden" oder "✅ Alles da!"
- Rezepte mit 0 fehlenden Zutaten → gruener Badge
- Rezepte mit 1-2 fehlenden → gelber Badge mit fehlenden Items

### Ablauf-Priorisierung

Falls Ablaufdaten vorhanden: Rezepte die bald ablaufende Zutaten verwenden werden hoeher gerankt.

```
Buddy: "⚠️ Deine Haehnchenbrust laeuft morgen ab!
  Vorschlag: Haehnchen-Reis-Bowl (alle Zutaten da, 42g Protein)"
```

---

## Phase C: Smarte Einkaufsliste

### DB-Tabellen

```sql
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Einkaufsliste',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity TEXT, -- "500g", "2 Stueck"
  unit TEXT, -- optional normalized unit
  category TEXT DEFAULT 'sonstiges',
  recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  recipe_name TEXT, -- denormalized fuer Anzeige
  checked BOOLEAN DEFAULT false,
  in_pantry BOOLEAN DEFAULT false, -- bereits im Vorrat vorhanden
  sort_order INT DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lists" ON shopping_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own items" ON shopping_list_items FOR ALL
  USING (list_id IN (SELECT id FROM shopping_lists WHERE user_id = auth.uid()));

-- Grants
GRANT ALL ON shopping_lists TO authenticated;
GRANT ALL ON shopping_list_items TO authenticated;
```

### Rezept → Einkaufsliste Flow

1. **Button auf RecipeDetail:** "Zur Einkaufsliste hinzufuegen"
2. **Mehrfach-Auswahl:** Nutzer waehlt mehrere Rezepte fuer die Woche
3. **Intelligente Aggregation:**
   - "200g Haehnchenbrust" + "300g Haehnchenbrust" = "500g Haehnchenbrust"
   - Einheiten-Normalisierung (Stueck, g, ml, EL, TL)
4. **Vorrat-Abzug:** Items die im Vorrat sind → durchgestrichen / vorausgewaehlt
5. **Kategorie-Sortierung:** Nach Supermarkt-Abteilung

### Sortierung nach Supermarkt-Abteilung (8 Gruppen)

| Abteilung | Sortierung | Beispiele |
|-----------|------------|-----------|
| Obst & Gemuese | 1 | Brokkoli, Tomaten, Aepfel |
| Brot & Backwaren | 2 | Vollkornbrot, Wraps |
| Kuehlregal | 3 | Quark, Joghurt, Kaese |
| Fleisch & Fisch | 4 | Haehnchenbrust, Lachs |
| Tiefkuehl | 5 | TK-Gemuese, Beeren |
| Trockenprodukte | 6 | Reis, Nudeln, Haferflocken |
| Getraenke | 7 | Milch, Saft |
| Sonstiges | 8 | Gewuerze, Oel, Supplements |

### UI: Einkaufslisten-Tab

Neuer Tab auf der Ernaehrungsseite (oder eigener Menuepunkt):

```
┌─────────────────────────────────┐
│ 🛒 Einkaufsliste               │
│ KW 12 · 3 Rezepte · 18 Items   │
│ Makros gesamt: 2.400 kcal       │
│ 180g P · 240g K · 80g F        │
├─────────────────────────────────┤
│ 🥦 Obst & Gemuese              │
│ ☐ Brokkoli 500g (Bowl + Auflauf)│
│ ☐ Tomaten 4 Stueck              │
│ ☑ Zwiebeln 2 (✅ im Vorrat)     │
├─────────────────────────────────┤
│ 🧊 Kuehlregal                  │
│ ☐ Quark 500g                    │
│ ☐ Eier 10 Stueck                │
│ ☑ Milch 1L (✅ im Vorrat)       │
├─────────────────────────────────┤
│ [Teilen]  [Bring! Export]       │
└─────────────────────────────────┘
```

### Makro-Preview (Fitness-Differenzierung!)

Kein Wettbewerber zeigt Gesamt-Makros der Einkaufsliste:

```
"Deine Einkaufsliste diese Woche:
 🔥 ~12.600 kcal | 💪 840g Protein | 🍚 1.200g Carbs | 🫒 420g Fett
 Das reicht fuer ~7 Tage bei deinem Ziel von 1.800 kcal/Tag. ✅"
```

### Bring!-Export (DACH-Markt)

Da Chefkoch komplett auf Bring! migriert hat und es der De-facto-Standard in DACH ist:
- **Deep-Link:** `https://api.getbring.com/rest/bringrecipes/deeplink`
- **Text-Export:** Items als Text kopieren fuer WhatsApp/Telegram

### Buddy-Integration

```
User: "Erstell mir eine Einkaufsliste fuer die naechsten 3 Tage"
Buddy: "Basierend auf deinen geplanten Mahlzeiten und dem was du noch hast:

  Brauchst du noch:
  • 500g Haehnchenbrust
  • 1kg Reis
  • 6 Eier
  • 500g Brokkoli

  Bereits im Vorrat: Quark, Haferflocken, Whey

  Soll ich die Liste erstellen? 🛒"
```

---

## Fitness-spezifische Differenzierungen (USPs)

Kein Wettbewerber bietet diese Kombination:

### 1. Makro-bewusster Einkauf
```
"Du brauchst noch 120g Protein diese Woche.
 Deine Einkaufsliste enthaelt 340g Protein. ✅ Passt!"
```

### 2. Meal-Prep-Optimierung
```
"Koche Reis und Haehnchen am Sonntag fuer 4 Tage vor.
 Einkaufsliste fuer Meal-Prep: 2kg Reis, 1.5kg Haehnchen, ..."
```

### 3. Supplement-Tracking im Vorrat
Proteinpulver, Kreatin, Omega-3 als Vorrats-Items mit Verbrauchsprognose:
```
"Dein Whey reicht noch fuer ~8 Shakes (ca. 4 Tage bei 2x taeglich)"
```

### 4. Training-Day-Ernaehrung
```
"Morgen ist Leg Day → hohe Carbs empfohlen.
 Du hast Reis und Haehnchen da — perfekt!
 Vorschlag: Haehnchen-Reis-Bowl (580 kcal, 42g P, 65g K)"
```

---

## Implementierungsreihenfolge

### Empfehlung: 0 → A → B → C

| Schritt | Was | Warum |
|---------|-----|-------|
| **0** | Zutatenkatalog + Quick-Setup | VORAUSSETZUNG — ohne Katalog kein strukturierter Vorrat |
| **A** | Conversational Pantry + Pantry-UI | Vorrat aufbauen via Chat UND Katalog-UI |
| **B** | Kochen mit Vorrat | Baut auf 0+A auf, Prompt-basiert + Filter-Chip |
| **C** | Einkaufsliste | Braucht neue UI. Sinnvoll erst wenn Vorrat gefuellt |

### Neue Dateien (geschaetzt)

**Phase 0:**
- `supabase/migrations/xxx_ingredient_catalog.sql` — Tabelle + 250 Seed-Items
- `src/features/pantry/types.ts` — IngredientCatalogItem + PantryItem Types
- `src/features/pantry/hooks/useIngredientCatalog.ts` — Katalog laden + suchen

**Phase A:**
- `src/features/pantry/hooks/usePantry.ts` — CRUD Hook
- `src/features/pantry/components/PantrySetupWizard.tsx` — 3-Schritt Onboarding
- `src/features/pantry/components/PantryOverview.tsx` — Vorrats-Uebersicht (optional)
- `supabase/migrations/xxx_user_pantry.sql` — Tabelle
- ActionRegistry: `update_pantry` registrieren
- Skills: `pantryInventory.ts` (dynamischer User-Skill)
- Agent-Prompts: nutritionAgent Pantry-Kontext

**Phase B:**
- `src/features/recipes/components/PantryMatchBadge.tsx`
- RecipeList Filter-Chip ergaenzen
- `src/features/pantry/utils/ingredientMatcher.ts` — Fuzzy-Matching
- Agent-Prompts: "Was kann ich kochen?" Logik

**Phase C:**
- `src/features/shopping/` (neues Feature-Verzeichnis)
  - `components/ShoppingListTab.tsx`
  - `components/ShoppingListItem.tsx`
  - `components/AddToListDialog.tsx`
  - `hooks/useShoppingList.ts`
  - `hooks/useShoppingListItems.ts`
  - `utils/ingredientAggregator.ts` — Mengen-Merge
- `supabase/migrations/xxx_shopping_lists.sql`
- RecipeDetail: "Zur Einkaufsliste" Button
- NutritionPage: Shopping-Tab

### Neue DB-Tabellen

| Tabelle | Phase | Nr. |
|---------|-------|-----|
| `ingredient_catalog` | 0 | 35. Tabelle |
| `user_pantry` | A | 36. Tabelle |
| `shopping_lists` | C | 37. Tabelle |
| `shopping_list_items` | C | 38. Tabelle |

---

## Quellen

- SuperCook (supercook.com) — "Cook with what you have" Referenz
- Paprika 3 — Pantry + Einkaufsliste mit Ablaufdaten
- NoWaste.ai — KI-basiertes Pantry-Management
- Chefkoch → Bring! Migration — Lesson learned (Shopping-Liste outsourcen)
- Mealime — Einkaufsliste nach Supermarkt-Abteilung
- Plan to Eat — Pantry-Feature ENTFERNT (zu komplex)
- MealBoard — Vorrat-Abzug von Einkaufsliste
- KitchenOwl — NLP-basiertes Ingredient-Matching (Open Source)
