-- Migration: User Product Database (Standard + User Products)
-- Two-layer product system for exact nutritional tracking
-- standard_products: systemwide defaults (~50 basics, read-only for users)
-- user_products: per-user custom products with aliases

-- ══════════════════════════════════════════════════════════════════════
-- 1. STANDARD PRODUCTS (systemwide, everyone can read)
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE standard_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  brand TEXT,
  barcode TEXT,
  serving_size_g REAL NOT NULL,
  serving_label TEXT,
  calories_per_serving REAL NOT NULL,
  protein_per_serving REAL NOT NULL DEFAULT 0,
  carbs_per_serving REAL NOT NULL DEFAULT 0,
  fat_per_serving REAL NOT NULL DEFAULT 0,
  fiber_per_serving REAL DEFAULT 0,
  source TEXT DEFAULT 'manual',
  source_ref TEXT,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE standard_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Standard-Produkte lesen" ON standard_products FOR SELECT USING (true);

-- ══════════════════════════════════════════════════════════════════════
-- 2. USER PRODUCTS (per user, full CRUD with RLS)
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  barcode TEXT,
  serving_size_g REAL NOT NULL,
  serving_label TEXT,
  calories_per_serving REAL NOT NULL,
  protein_per_serving REAL NOT NULL DEFAULT 0,
  carbs_per_serving REAL NOT NULL DEFAULT 0,
  fat_per_serving REAL NOT NULL DEFAULT 0,
  fiber_per_serving REAL DEFAULT 0,
  aliases TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  source TEXT DEFAULT 'manual',
  source_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eigene Produkte lesen" ON user_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Eigene Produkte erstellen" ON user_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Eigene Produkte aendern" ON user_products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Eigene Produkte loeschen" ON user_products FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_user_products_user ON user_products(user_id);
CREATE INDEX idx_user_products_aliases ON user_products USING GIN(aliases);

-- ══════════════════════════════════════════════════════════════════════
-- 3. SEED: ~50 Standard Products (BLS 4.0 / USDA FDC / Open Food Facts)
--    All values per serving_size_g (typically 100g or typical portion)
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO standard_products (name, category, serving_size_g, serving_label, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, fiber_per_serving, source) VALUES

-- GETREIDE / GRAIN
('Basmati Reis (gekocht)', 'grain', 100, '100g', 130, 2.7, 28.2, 0.3, 0.4, 'bls'),
('Vollkornnudeln (gekocht)', 'grain', 100, '100g', 150, 5.3, 28.8, 1.5, 3.5, 'bls'),
('Nudeln (gekocht)', 'grain', 100, '100g', 158, 5.0, 30.9, 0.9, 1.8, 'bls'),
('Haferflocken', 'grain', 50, '50g (5 EL)', 189, 6.7, 30.1, 3.5, 5.0, 'bls'),
('Vollkornbrot', 'grain', 50, '1 Scheibe (50g)', 112, 4.4, 19.5, 1.3, 3.4, 'bls'),
('Toastbrot (Weizen)', 'grain', 30, '1 Scheibe (30g)', 78, 2.5, 14.4, 0.9, 0.8, 'bls'),

-- MILCHPRODUKTE / DAIRY
('Milch 1.5%', 'dairy', 200, '1 Glas (200ml)', 94, 6.8, 9.6, 3.0, 0, 'bls'),
('Milch 3.5%', 'dairy', 200, '1 Glas (200ml)', 128, 6.6, 9.4, 7.0, 0, 'bls'),
('Skyr natur', 'dairy', 100, '100g', 63, 10.6, 3.7, 0.2, 0, 'off'),
('Magerquark', 'dairy', 100, '100g', 67, 12.0, 4.0, 0.3, 0, 'bls'),
('Griechischer Joghurt (10%)', 'dairy', 100, '100g', 133, 5.0, 4.0, 10.0, 0, 'off'),
('Naturjoghurt 1.5%', 'dairy', 150, '1 Becher (150g)', 74, 5.6, 7.2, 2.3, 0, 'bls'),
('Gouda (jung)', 'dairy', 30, '1 Scheibe (30g)', 107, 7.5, 0, 8.4, 0, 'bls'),
('Mozzarella', 'dairy', 50, '50g', 126, 9.3, 0.5, 9.8, 0, 'bls'),
('Parmesan', 'dairy', 10, '10g (gerieben)', 39, 3.6, 0, 2.8, 0, 'bls'),
('Hüttenkäse', 'dairy', 100, '100g', 98, 12.3, 2.6, 4.3, 0, 'bls'),

-- FLEISCH / MEAT
('Hähnchenbrust (gegart)', 'meat', 150, '150g', 232, 46.5, 0, 3.8, 0, 'bls'),
('Putenbrust (gegart)', 'meat', 150, '150g', 225, 46.2, 0, 3.0, 0, 'bls'),
('Rindfleisch mager (gegart)', 'meat', 150, '150g', 273, 39.0, 0, 12.8, 0, 'bls'),
('Hackfleisch gemischt (gebraten)', 'meat', 100, '100g', 255, 20.0, 0, 19.5, 0, 'bls'),
('Schweineschnitzel (gebraten)', 'meat', 150, '150g', 285, 42.0, 0, 12.8, 0, 'bls'),

-- FISCH / FISH
('Lachs (gegart)', 'fish', 150, '150g', 312, 30.3, 0, 20.7, 0, 'bls'),
('Thunfisch (Dose, in Wasser)', 'fish', 100, '100g (abgetropft)', 116, 26.0, 0, 1.0, 0, 'off'),
('Garnelen (gegart)', 'fish', 100, '100g', 99, 20.9, 0.2, 1.7, 0, 'usda'),

-- EIER / EGGS
('Hühnerei (M, 60g)', 'dairy', 60, '1 Stück (Größe M)', 86, 7.5, 0.4, 6.0, 0, 'bls'),

-- OBST / FRUIT
('Apfel', 'fruit', 180, '1 mittelgroß (180g)', 94, 0.5, 21.1, 0.2, 3.6, 'bls'),
('Banane', 'fruit', 120, '1 mittelgroß (120g)', 107, 1.3, 24.5, 0.2, 2.4, 'bls'),
('Orange', 'fruit', 180, '1 mittelgroß (180g)', 81, 1.6, 16.6, 0.2, 3.2, 'bls'),
('Erdbeeren', 'fruit', 100, '100g', 32, 0.7, 5.5, 0.4, 2.0, 'bls'),
('Blaubeeren', 'fruit', 100, '100g', 57, 0.7, 12.2, 0.3, 2.4, 'bls'),

-- GEMÜSE / VEGETABLE
('Brokkoli (gegart)', 'vegetable', 100, '100g', 35, 3.7, 3.0, 0.4, 3.0, 'bls'),
('Kartoffel (gekocht)', 'vegetable', 200, '200g (1 mittelgroß)', 142, 3.4, 30.0, 0.2, 3.4, 'bls'),
('Süßkartoffel (gegart)', 'vegetable', 200, '200g', 172, 3.2, 38.0, 0.2, 6.0, 'bls'),
('Tomaten', 'vegetable', 100, '1 mittelgroß (100g)', 18, 0.9, 2.6, 0.2, 1.2, 'bls'),
('Paprika (rot)', 'vegetable', 150, '1 Stück (150g)', 47, 1.5, 8.4, 0.5, 2.6, 'bls'),
('Spinat (gegart)', 'vegetable', 100, '100g', 23, 2.9, 0.8, 0.4, 2.2, 'bls'),
('Avocado', 'vegetable', 80, '1/2 Avocado (80g)', 128, 1.6, 1.4, 12.0, 4.0, 'usda'),

-- SNACKS
('Schokolade (Vollmilch)', 'snack', 25, '~5 Stücke (25g)', 134, 1.9, 14.8, 7.5, 0.5, 'bls'),
('Erdnussbutter', 'snack', 15, '1 EL (15g)', 94, 3.8, 2.4, 7.5, 1.0, 'off'),
('Mandeln', 'snack', 30, '1 Handvoll (30g)', 177, 6.3, 2.1, 15.2, 3.6, 'bls'),
('Walnüsse', 'snack', 30, '1 Handvoll (30g)', 196, 4.5, 2.1, 18.5, 1.9, 'bls'),
('Reiswaffeln', 'snack', 10, '2 Stück (10g)', 39, 0.8, 8.0, 0.3, 0.3, 'off'),

-- GETRÄNKE / BEVERAGE
('Orangensaft', 'beverage', 200, '1 Glas (200ml)', 86, 1.4, 18.0, 0.2, 0.4, 'bls'),
('Cola', 'beverage', 330, '1 Dose (330ml)', 139, 0, 35.0, 0, 0, 'off'),
('Bier (Pils)', 'beverage', 330, '1 Flasche (330ml)', 132, 1.6, 9.9, 0, 0, 'bls'),
('Apfelschorle', 'beverage', 500, '1 Flasche (500ml)', 130, 0.3, 30.0, 0.1, 0.2, 'off'),

-- SUPPLEMENTS
('Whey Protein (Standard)', 'supplement', 30, '1 Scoop (30g)', 120, 24.0, 2.0, 1.5, 0, 'off'),
('Kreatin Monohydrat', 'supplement', 5, '1 Portion (5g)', 0, 0, 0, 0, 0, 'manual'),
('Maltodextrin', 'supplement', 30, '30g', 114, 0, 28.5, 0, 0, 'manual'),
('Proteinriegel (Standard)', 'snack', 60, '1 Riegel (60g)', 220, 20.0, 22.0, 7.0, 3.0, 'off');
