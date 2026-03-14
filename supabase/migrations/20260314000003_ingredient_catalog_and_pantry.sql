-- ============================================================
-- Phase 0+A: Zutatenkatalog (ingredient_catalog) + Vorrat (user_pantry)
-- 35. + 36. DB-Tabelle
-- ============================================================

-- ============================================================
-- 1. ingredient_catalog — Globaler Zutatenkatalog (~250 Items)
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredient_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_de TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  is_staple BOOLEAN DEFAULT false,
  is_fitness BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT true,
  default_unit TEXT DEFAULT 'g',
  default_quantity TEXT,
  calories_per_100g NUMERIC,
  protein_per_100g NUMERIC,
  carbs_per_100g NUMERIC,
  fat_per_100g NUMERIC,
  fiber_per_100g NUMERIC,
  allergens TEXT[] DEFAULT '{}',
  storage_type TEXT DEFAULT 'vorratsschrank',
  shelf_life_days INT,
  search_terms TEXT[] DEFAULT '{}',
  bls_code TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingredient_catalog_search ON ingredient_catalog USING GIN (search_terms);
CREATE INDEX IF NOT EXISTS idx_ingredient_catalog_category ON ingredient_catalog (category);

-- Kein RLS — globaler read-only Katalog
GRANT SELECT ON ingredient_catalog TO authenticated, anon;

-- ============================================================
-- 2. user_pantry — Persoenlicher Vorrat mit Katalog-Referenz
-- ============================================================
CREATE TABLE IF NOT EXISTS user_pantry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredient_catalog(id) ON DELETE SET NULL,
  ingredient_name TEXT NOT NULL,
  ingredient_normalized TEXT NOT NULL,
  category TEXT DEFAULT 'sonstiges',
  quantity_text TEXT,
  storage_location TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'low', 'empty')),
  buy_preference TEXT DEFAULT 'sometimes' CHECK (buy_preference IN ('always', 'sometimes', 'never')),
  added_at TIMESTAMPTZ DEFAULT now(),
  expires_at DATE,
  last_confirmed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, ingredient_normalized)
);

CREATE INDEX IF NOT EXISTS idx_user_pantry_user ON user_pantry (user_id);
CREATE INDEX IF NOT EXISTS idx_user_pantry_status ON user_pantry (user_id, status);

ALTER TABLE user_pantry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pantry" ON user_pantry FOR ALL USING (auth.uid() = user_id);
GRANT ALL ON user_pantry TO authenticated;

-- ============================================================
-- 3. SEED DATA: ~250 Zutaten in 15 Kategorien
-- Naehrwerte: BLS 4.0 Referenzwerte (pro 100g, roh)
-- ============================================================

-- Helper: category sort prefix for ordering
-- gemuese=01, obst=02, fleisch_fisch=03, milchprodukte=04, getreide_nudeln=05,
-- huelsenfruechte=06, nuesse=07, oele_fette=08, gewuerze=09, konserven=10,
-- backzutaten=11, getraenke=12, tiefkuehl=13, brot_aufstriche=14, supplements=15

-- ============================================================
-- 3.1 GEMUESE (~35 Items)
-- ============================================================
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Brokkoli', 'Broccoli', 'gemuese', true, true, true, 'g', 34, 2.8, 7, 0.4, 2.6, 'kuehlschrank', 5, ARRAY['Brokkoli', 'Broccoli', 'Brokoli'], 1),
('Tomaten', 'Tomatoes', 'gemuese', true, false, true, 'Stueck', 18, 0.9, 3.9, 0.2, 1.2, 'gemuese_obst', 7, ARRAY['Tomaten', 'Tomate', 'Tomatoes'], 2),
('Zwiebeln', 'Onions', 'gemuese', true, false, true, 'Stueck', 40, 1.1, 9.3, 0.1, 1.7, 'vorratsschrank', 30, ARRAY['Zwiebeln', 'Zwiebel', 'Onion'], 3),
('Kartoffeln', 'Potatoes', 'gemuese', true, false, true, 'g', 77, 2, 17, 0.1, 2.2, 'vorratsschrank', 21, ARRAY['Kartoffeln', 'Kartoffel', 'Erdaepfel'], 4),
('Karotten', 'Carrots', 'gemuese', true, false, true, 'Stueck', 41, 0.9, 10, 0.2, 2.8, 'kuehlschrank', 14, ARRAY['Karotten', 'Karotte', 'Moehren', 'Moehre', 'Mohrrüben'], 5),
('Paprika', 'Bell pepper', 'gemuese', true, false, true, 'Stueck', 31, 1, 6.7, 0.3, 1.7, 'kuehlschrank', 7, ARRAY['Paprika', 'Pepper', 'Paprikaschote'], 6),
('Gurke', 'Cucumber', 'gemuese', true, false, true, 'Stueck', 12, 0.7, 1.8, 0.2, 0.5, 'kuehlschrank', 7, ARRAY['Gurke', 'Salatgurke', 'Cucumber'], 7),
('Spinat', 'Spinach', 'gemuese', false, true, true, 'g', 23, 2.9, 3.6, 0.4, 2.2, 'kuehlschrank', 3, ARRAY['Spinat', 'Blattspinat', 'Spinach'], 8),
('Zucchini', 'Zucchini', 'gemuese', false, false, true, 'Stueck', 17, 1.2, 3.1, 0.3, 1, 'kuehlschrank', 7, ARRAY['Zucchini', 'Courgette'], 9),
('Knoblauch', 'Garlic', 'gemuese', true, false, true, 'Stueck', 149, 6.4, 33, 0.5, 2.1, 'vorratsschrank', 60, ARRAY['Knoblauch', 'Garlic', 'Knoblauchzehe'], 10),
('Salat', 'Lettuce', 'gemuese', false, false, true, 'Stueck', 14, 1.3, 2.9, 0.2, 1.3, 'kuehlschrank', 5, ARRAY['Salat', 'Kopfsalat', 'Eisbergsalat', 'Lettuce'], 11),
('Champignons', 'Mushrooms', 'gemuese', false, false, true, 'g', 22, 3.1, 3.3, 0.3, 1, 'kuehlschrank', 5, ARRAY['Champignons', 'Pilze', 'Mushrooms'], 12),
('Aubergine', 'Eggplant', 'gemuese', false, false, true, 'Stueck', 25, 1, 5.9, 0.2, 3, 'kuehlschrank', 7, ARRAY['Aubergine', 'Eggplant', 'Melanzane'], 13),
('Blumenkohl', 'Cauliflower', 'gemuese', false, true, true, 'Stueck', 25, 1.9, 5, 0.3, 2, 'kuehlschrank', 7, ARRAY['Blumenkohl', 'Cauliflower', 'Karfiol'], 14),
('Susskartoffel', 'Sweet potato', 'gemuese', false, true, true, 'g', 86, 1.6, 20, 0.1, 3, 'vorratsschrank', 14, ARRAY['Susskartoffel', 'Suesskartoffel', 'Sweet Potato', 'Batate'], 15),
('Lauch', 'Leek', 'gemuese', false, false, true, 'Stueck', 31, 1.5, 6.1, 0.3, 1.8, 'kuehlschrank', 7, ARRAY['Lauch', 'Porree', 'Leek'], 16),
('Sellerie', 'Celery', 'gemuese', false, false, true, 'Stueck', 16, 0.7, 3, 0.2, 1.6, 'kuehlschrank', 10, ARRAY['Sellerie', 'Staudensellerie', 'Celery'], 17),
('Kohlrabi', 'Kohlrabi', 'gemuese', false, false, true, 'Stueck', 27, 1.7, 6.2, 0.1, 1.7, 'kuehlschrank', 10, ARRAY['Kohlrabi', 'Oberkohlrabi'], 18),
('Ingwer', 'Ginger', 'gemuese', false, false, true, 'g', 80, 1.8, 18, 0.8, 2, 'vorratsschrank', 21, ARRAY['Ingwer', 'Ginger'], 19),
('Erbsen', 'Peas', 'gemuese', false, true, true, 'g', 81, 5.4, 14, 0.4, 5.1, 'kuehlschrank', 3, ARRAY['Erbsen', 'Peas', 'Gruene Erbsen'], 20),
('Mais', 'Corn', 'gemuese', false, false, true, 'g', 86, 3.3, 19, 1.2, 2.7, 'kuehlschrank', 3, ARRAY['Mais', 'Corn', 'Zuckermais'], 21),
('Avocado', 'Avocado', 'gemuese', false, true, true, 'Stueck', 160, 2, 8.5, 15, 6.7, 'gemuese_obst', 5, ARRAY['Avocado', 'Avocados'], 22),
('Fenchel', 'Fennel', 'gemuese', false, false, true, 'Stueck', 31, 1.2, 7.3, 0.2, 3.1, 'kuehlschrank', 7, ARRAY['Fenchel', 'Fennel'], 23),
('Rotkohl', 'Red cabbage', 'gemuese', false, false, true, 'g', 31, 1.4, 7.4, 0.2, 2.1, 'kuehlschrank', 14, ARRAY['Rotkohl', 'Blaukraut', 'Red Cabbage'], 24),
('Weisskohl', 'White cabbage', 'gemuese', false, false, true, 'g', 25, 1.3, 5.8, 0.1, 2.5, 'kuehlschrank', 14, ARRAY['Weisskohl', 'Weißkohl', 'Kraut', 'Cabbage'], 25),
('Radieschen', 'Radish', 'gemuese', false, false, true, 'Stueck', 16, 0.7, 3.4, 0.1, 1.6, 'kuehlschrank', 7, ARRAY['Radieschen', 'Rettich', 'Radish'], 26),
('Spargel', 'Asparagus', 'gemuese', false, true, true, 'g', 20, 2.2, 3.9, 0.1, 2.1, 'kuehlschrank', 3, ARRAY['Spargel', 'Asparagus', 'Gruener Spargel'], 27),
('Rosenkohl', 'Brussels sprouts', 'gemuese', false, true, true, 'g', 43, 3.4, 9, 0.3, 3.8, 'kuehlschrank', 5, ARRAY['Rosenkohl', 'Brussels Sprouts'], 28),
('Gruenkohl', 'Kale', 'gemuese', false, true, true, 'g', 49, 4.3, 8.8, 0.9, 3.6, 'kuehlschrank', 5, ARRAY['Gruenkohl', 'Kale', 'Grünkohl'], 29),
('Rote Bete', 'Beetroot', 'gemuese', false, false, true, 'g', 43, 1.6, 10, 0.1, 2.8, 'kuehlschrank', 14, ARRAY['Rote Bete', 'Rote Beete', 'Beetroot'], 30),
('Kuerbis', 'Pumpkin', 'gemuese', false, false, true, 'g', 26, 1, 6.5, 0.1, 0.5, 'vorratsschrank', 60, ARRAY['Kuerbis', 'Kürbis', 'Hokkaidokuerbis', 'Pumpkin'], 31),
('Pak Choi', 'Pak choi', 'gemuese', false, false, true, 'g', 13, 1.5, 2.2, 0.2, 1, 'kuehlschrank', 5, ARRAY['Pak Choi', 'Bok Choy', 'Pak Choy'], 32),
('Edamame', 'Edamame', 'gemuese', false, true, true, 'g', 121, 11, 8.9, 5.2, 5.2, 'kuehlschrank', 3, ARRAY['Edamame', 'Sojabohnen'], 33),
('Fruehlingszwiebeln', 'Spring onions', 'gemuese', false, false, true, 'Stueck', 32, 1.8, 7.3, 0.2, 2.6, 'kuehlschrank', 5, ARRAY['Fruehlingszwiebeln', 'Lauchzwiebeln', 'Spring Onions'], 34);

-- ============================================================
-- 3.2 OBST (~20 Items)
-- ============================================================
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Aepfel', 'Apples', 'obst', true, false, true, 'Stueck', 52, 0.3, 14, 0.2, 2.4, 'gemuese_obst', 14, ARRAY['Aepfel', 'Apfel', 'Apple'], 1),
('Bananen', 'Bananas', 'obst', true, true, true, 'Stueck', 89, 1.1, 23, 0.3, 2.6, 'gemuese_obst', 5, ARRAY['Bananen', 'Banane', 'Banana'], 2),
('Zitronen', 'Lemons', 'obst', true, false, true, 'Stueck', 29, 1.1, 9.3, 0.3, 2.8, 'gemuese_obst', 14, ARRAY['Zitronen', 'Zitrone', 'Lemon'], 3),
('Orangen', 'Oranges', 'obst', false, false, true, 'Stueck', 47, 0.9, 12, 0.1, 2.4, 'gemuese_obst', 14, ARRAY['Orangen', 'Orange', 'Apfelsine'], 4),
('Blaubeeren', 'Blueberries', 'obst', false, true, true, 'g', 57, 0.7, 14, 0.3, 2.4, 'kuehlschrank', 5, ARRAY['Blaubeeren', 'Heidelbeeren', 'Blueberries'], 5),
('Erdbeeren', 'Strawberries', 'obst', false, true, true, 'g', 32, 0.7, 7.7, 0.3, 2, 'kuehlschrank', 3, ARRAY['Erdbeeren', 'Erdbeere', 'Strawberries'], 6),
('Himbeeren', 'Raspberries', 'obst', false, true, true, 'g', 52, 1.2, 12, 0.7, 6.5, 'kuehlschrank', 3, ARRAY['Himbeeren', 'Himbeere', 'Raspberries'], 7),
('Weintrauben', 'Grapes', 'obst', false, false, true, 'g', 69, 0.7, 18, 0.2, 0.9, 'kuehlschrank', 7, ARRAY['Weintrauben', 'Trauben', 'Grapes'], 8),
('Birnen', 'Pears', 'obst', false, false, true, 'Stueck', 57, 0.4, 15, 0.1, 3.1, 'gemuese_obst', 10, ARRAY['Birnen', 'Birne', 'Pear'], 9),
('Mango', 'Mango', 'obst', false, false, true, 'Stueck', 60, 0.8, 15, 0.4, 1.6, 'gemuese_obst', 5, ARRAY['Mango', 'Mangos'], 10),
('Ananas', 'Pineapple', 'obst', false, false, true, 'Stueck', 50, 0.5, 13, 0.1, 1.4, 'gemuese_obst', 5, ARRAY['Ananas', 'Pineapple'], 11),
('Kiwi', 'Kiwi', 'obst', false, false, true, 'Stueck', 61, 1.1, 15, 0.5, 3, 'gemuese_obst', 7, ARRAY['Kiwi', 'Kiwis'], 12),
('Wassermelone', 'Watermelon', 'obst', false, false, true, 'g', 30, 0.6, 7.6, 0.2, 0.4, 'kuehlschrank', 5, ARRAY['Wassermelone', 'Watermelon', 'Melone'], 13),
('Pfirsich', 'Peach', 'obst', false, false, true, 'Stueck', 39, 0.9, 10, 0.3, 1.5, 'gemuese_obst', 5, ARRAY['Pfirsich', 'Pfirsiche', 'Peach', 'Nektarine'], 14),
('Granatapfel', 'Pomegranate', 'obst', false, true, true, 'Stueck', 83, 1.7, 19, 1.2, 4, 'gemuese_obst', 14, ARRAY['Granatapfel', 'Pomegranate'], 15),
('Limetten', 'Limes', 'obst', false, false, true, 'Stueck', 30, 0.7, 11, 0.2, 2.8, 'gemuese_obst', 14, ARRAY['Limetten', 'Limette', 'Lime'], 16),
('Grapefruit', 'Grapefruit', 'obst', false, false, true, 'Stueck', 42, 0.8, 11, 0.1, 1.6, 'gemuese_obst', 14, ARRAY['Grapefruit', 'Pampelmuse'], 17),
('Datteln', 'Dates', 'obst', false, true, true, 'g', 277, 1.8, 75, 0.2, 6.7, 'vorratsschrank', 180, ARRAY['Datteln', 'Dattel', 'Dates', 'Medjool'], 18);

-- ============================================================
-- 3.3 FLEISCH & FISCH (~22 Items)
-- ============================================================
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, allergens, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Haehnchenbrust', 'Chicken breast', 'fleisch_fisch', true, true, false, 'g', 165, 31, 0, 3.6, 0, '{}', 'kuehlschrank', 3, ARRAY['Haehnchenbrust', 'Hähnchenbrust', 'Hühnerbrust', 'Chicken Breast', 'Poulet'], 1),
('Hackfleisch gemischt', 'Mixed ground meat', 'fleisch_fisch', true, false, false, 'g', 212, 17, 0, 16, 0, '{}', 'kuehlschrank', 2, ARRAY['Hackfleisch', 'Hack', 'Mett', 'Ground Meat', 'Faschiertes'], 2),
('Rinderhackfleisch', 'Ground beef', 'fleisch_fisch', false, true, false, 'g', 254, 17, 0, 20, 0, '{}', 'kuehlschrank', 2, ARRAY['Rinderhackfleisch', 'Rinderhack', 'Ground Beef', 'Beef Mince'], 3),
('Putenbrust', 'Turkey breast', 'fleisch_fisch', false, true, false, 'g', 135, 30, 0, 1.5, 0, '{}', 'kuehlschrank', 3, ARRAY['Putenbrust', 'Truthahn', 'Turkey Breast', 'Pute'], 4),
('Lachs', 'Salmon', 'fleisch_fisch', true, true, false, 'g', 208, 20, 0, 13, 0, ARRAY['fisch'], 'kuehlschrank', 2, ARRAY['Lachs', 'Lachsfilet', 'Salmon'], 5),
('Thunfisch frisch', 'Fresh tuna', 'fleisch_fisch', false, true, false, 'g', 144, 23, 0, 5, 0, ARRAY['fisch'], 'kuehlschrank', 1, ARRAY['Thunfisch', 'Tuna', 'Tunfisch'], 6),
('Garnelen', 'Shrimp', 'fleisch_fisch', false, true, false, 'g', 99, 24, 0.2, 0.3, 0, ARRAY['krustentiere'], 'kuehlschrank', 2, ARRAY['Garnelen', 'Shrimp', 'Krabben', 'Crevetten'], 7),
('Rindfleisch', 'Beef', 'fleisch_fisch', false, true, false, 'g', 250, 26, 0, 15, 0, '{}', 'kuehlschrank', 3, ARRAY['Rindfleisch', 'Rind', 'Beef', 'Steak'], 8),
('Schweinefleisch', 'Pork', 'fleisch_fisch', false, false, false, 'g', 242, 27, 0, 14, 0, '{}', 'kuehlschrank', 3, ARRAY['Schweinefleisch', 'Schwein', 'Pork', 'Schnitzel'], 9),
('Haehnchenscnenkel', 'Chicken thigh', 'fleisch_fisch', false, false, false, 'g', 209, 26, 0, 11, 0, '{}', 'kuehlschrank', 3, ARRAY['Haehnchenschenkel', 'Hähnchenschenkel', 'Chicken Thigh', 'Keule'], 10),
('Kabeljau', 'Cod', 'fleisch_fisch', false, true, false, 'g', 82, 18, 0, 0.7, 0, ARRAY['fisch'], 'kuehlschrank', 2, ARRAY['Kabeljau', 'Dorsch', 'Cod'], 11),
('Forelle', 'Trout', 'fleisch_fisch', false, true, false, 'g', 190, 20, 0, 12, 0, ARRAY['fisch'], 'kuehlschrank', 2, ARRAY['Forelle', 'Trout', 'Lachsforelle'], 12),
('Schinken gekocht', 'Cooked ham', 'fleisch_fisch', true, false, false, 'g', 107, 18, 1, 3.5, 0, '{}', 'kuehlschrank', 5, ARRAY['Schinken', 'Kochschinken', 'Ham'], 13),
('Speck', 'Bacon', 'fleisch_fisch', false, false, false, 'g', 541, 37, 1, 42, 0, '{}', 'kuehlschrank', 14, ARRAY['Speck', 'Bacon', 'Raucherspeck', 'Frühstücksspeck'], 14),
('Bratwurst', 'Sausage', 'fleisch_fisch', false, false, false, 'Stueck', 313, 12, 1, 29, 0, '{}', 'kuehlschrank', 3, ARRAY['Bratwurst', 'Wurst', 'Sausage'], 15),
('Tofu', 'Tofu', 'fleisch_fisch', false, true, true, 'g', 76, 8, 1.9, 4.8, 0.3, ARRAY['soja'], 'kuehlschrank', 7, ARRAY['Tofu', 'Seidentofu', 'Raeuchertofu'], 16),
('Tempeh', 'Tempeh', 'fleisch_fisch', false, true, true, 'g', 192, 20, 7.6, 11, 0, ARRAY['soja'], 'kuehlschrank', 7, ARRAY['Tempeh'], 17),
('Seitan', 'Seitan', 'fleisch_fisch', false, true, true, 'g', 370, 75, 14, 1.9, 0.6, ARRAY['gluten'], 'kuehlschrank', 5, ARRAY['Seitan', 'Wheat Gluten'], 18),
('Raeucherlachs', 'Smoked salmon', 'fleisch_fisch', false, true, false, 'g', 117, 18, 0, 4.3, 0, ARRAY['fisch'], 'kuehlschrank', 7, ARRAY['Raeucherlachs', 'Räucherlachs', 'Smoked Salmon'], 19),
('Pangasius', 'Pangasius', 'fleisch_fisch', false, false, false, 'g', 82, 17, 0, 1.5, 0, ARRAY['fisch'], 'gefriertruhe', 180, ARRAY['Pangasius', 'Pangasiusfilet'], 20);

-- ============================================================
-- 3.4 MILCHPRODUKTE & EIER (~18 Items)
-- ============================================================
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, allergens, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Eier', 'Eggs', 'milchprodukte', true, true, false, 'Stueck', 155, 13, 1.1, 11, 0, ARRAY['ei'], 'kuehlschrank', 21, ARRAY['Eier', 'Ei', 'Eggs', 'Huehnereier'], 1),
('Milch', 'Milk', 'milchprodukte', true, false, false, 'ml', 64, 3.3, 4.8, 3.5, 0, ARRAY['laktose'], 'kuehlschrank', 7, ARRAY['Milch', 'Vollmilch', 'Milk', 'H-Milch'], 2),
('Butter', 'Butter', 'milchprodukte', true, false, false, 'g', 717, 0.9, 0.1, 81, 0, ARRAY['laktose'], 'kuehlschrank', 30, ARRAY['Butter', 'Süßrahmbutter'], 3),
('Quark', 'Quark', 'milchprodukte', true, true, false, 'g', 67, 12, 4, 0.2, 0, ARRAY['laktose'], 'kuehlschrank', 10, ARRAY['Quark', 'Magerquark', 'Speisequark'], 4),
('Joghurt natur', 'Plain yogurt', 'milchprodukte', true, true, false, 'g', 61, 3.5, 4.7, 3.3, 0, ARRAY['laktose'], 'kuehlschrank', 14, ARRAY['Joghurt', 'Jogurt', 'Yogurt', 'Naturjoghurt'], 5),
('Griechischer Joghurt', 'Greek yogurt', 'milchprodukte', false, true, false, 'g', 97, 9, 3.6, 5, 0, ARRAY['laktose'], 'kuehlschrank', 14, ARRAY['Griechischer Joghurt', 'Greek Yogurt', 'Skyr'], 6),
('Kaese Gouda', 'Gouda cheese', 'milchprodukte', true, false, false, 'g', 356, 25, 2.2, 27, 0, ARRAY['laktose'], 'kuehlschrank', 21, ARRAY['Gouda', 'Käse', 'Kaese', 'Cheese'], 7),
('Mozzarella', 'Mozzarella', 'milchprodukte', false, false, false, 'g', 280, 22, 2.2, 20, 0, ARRAY['laktose'], 'kuehlschrank', 7, ARRAY['Mozzarella', 'Mozzarella'], 8),
('Parmesan', 'Parmesan', 'milchprodukte', false, true, false, 'g', 431, 38, 4.1, 29, 0, ARRAY['laktose'], 'kuehlschrank', 60, ARRAY['Parmesan', 'Parmigiano', 'Grana Padano'], 9),
('Frischkaese', 'Cream cheese', 'milchprodukte', true, false, false, 'g', 342, 6, 3.5, 34, 0, ARRAY['laktose'], 'kuehlschrank', 14, ARRAY['Frischkaese', 'Frischkäse', 'Philadelphia', 'Cream Cheese'], 10),
('Sahne', 'Cream', 'milchprodukte', true, false, false, 'ml', 292, 2.8, 3.4, 30, 0, ARRAY['laktose'], 'kuehlschrank', 7, ARRAY['Sahne', 'Schlagsahne', 'Cream', 'Obers'], 11),
('Schmand', 'Sour cream', 'milchprodukte', false, false, false, 'g', 240, 3, 3.6, 24, 0, ARRAY['laktose'], 'kuehlschrank', 14, ARRAY['Schmand', 'Saure Sahne', 'Sour Cream', 'Creme fraiche'], 12),
('Feta', 'Feta', 'milchprodukte', false, false, false, 'g', 264, 14, 4.1, 21, 0, ARRAY['laktose'], 'kuehlschrank', 14, ARRAY['Feta', 'Fetakaese', 'Schafskäse'], 13),
('Skyr', 'Skyr', 'milchprodukte', false, true, false, 'g', 63, 11, 4, 0.2, 0, ARRAY['laktose'], 'kuehlschrank', 14, ARRAY['Skyr', 'Icelandic Yogurt'], 14),
('Hafermilch', 'Oat milk', 'milchprodukte', false, false, true, 'ml', 46, 1, 6.7, 1.5, 0.8, ARRAY['gluten'], 'kuehlschrank', 7, ARRAY['Hafermilch', 'Oat Milk', 'Haferdrink'], 15),
('Mandelmilch', 'Almond milk', 'milchprodukte', false, false, true, 'ml', 17, 0.6, 0.3, 1.1, 0.2, ARRAY['schalenfrueche'], 'kuehlschrank', 7, ARRAY['Mandelmilch', 'Almond Milk', 'Mandeldrink'], 16),
('Huettenkaese', 'Cottage cheese', 'milchprodukte', false, true, false, 'g', 98, 11, 3.4, 4.3, 0, ARRAY['laktose'], 'kuehlschrank', 7, ARRAY['Huettenkaese', 'Hüttenkäse', 'Cottage Cheese', 'Koerniger Frischkaese'], 17);

-- ============================================================
-- 3.5 GETREIDE & NUDELN (~18 Items)
-- ============================================================
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, allergens, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Reis', 'Rice', 'getreide_nudeln', true, true, true, 'g', 360, 7, 79, 0.6, 1.3, '{}', 'vorratsschrank', 365, ARRAY['Reis', 'Basmatireis', 'Jasminreis', 'Rice', 'Langkornreis'], 1),
('Nudeln', 'Pasta', 'getreide_nudeln', true, false, true, 'g', 371, 13, 75, 1.5, 3.2, ARRAY['gluten'], 'vorratsschrank', 365, ARRAY['Nudeln', 'Pasta', 'Spaghetti', 'Penne', 'Fusilli'], 2),
('Haferflocken', 'Oats', 'getreide_nudeln', true, true, true, 'g', 389, 17, 67, 7, 10, ARRAY['gluten'], 'vorratsschrank', 180, ARRAY['Haferflocken', 'Oats', 'Porridge', 'Hafer', 'Overnight Oats'], 3),
('Vollkornnudeln', 'Whole wheat pasta', 'getreide_nudeln', false, true, true, 'g', 348, 14, 66, 2.5, 7, ARRAY['gluten'], 'vorratsschrank', 365, ARRAY['Vollkornnudeln', 'Whole Wheat Pasta', 'Dinkelnudeln'], 4),
('Couscous', 'Couscous', 'getreide_nudeln', false, false, true, 'g', 376, 13, 77, 0.6, 2, ARRAY['gluten'], 'vorratsschrank', 365, ARRAY['Couscous', 'Cous Cous'], 5),
('Quinoa', 'Quinoa', 'getreide_nudeln', false, true, true, 'g', 368, 14, 64, 6.1, 7, '{}', 'vorratsschrank', 365, ARRAY['Quinoa', 'Quinua'], 6),
('Bulgur', 'Bulgur', 'getreide_nudeln', false, false, true, 'g', 342, 12, 76, 1.3, 8, ARRAY['gluten'], 'vorratsschrank', 365, ARRAY['Bulgur', 'Bulgurweizen'], 7),
('Brot Vollkorn', 'Whole grain bread', 'getreide_nudeln', true, false, true, 'Scheibe', 247, 9, 41, 3.5, 7, ARRAY['gluten'], 'vorratsschrank', 5, ARRAY['Vollkornbrot', 'Brot', 'Bread', 'Schwarzbrot'], 8),
('Toast', 'Toast bread', 'getreide_nudeln', false, false, true, 'Scheibe', 265, 8, 49, 3.5, 2.7, ARRAY['gluten'], 'vorratsschrank', 7, ARRAY['Toast', 'Toastbrot', 'Sandwich'], 9),
('Reiswaffeln', 'Rice cakes', 'getreide_nudeln', false, true, true, 'Stueck', 387, 7, 85, 2.8, 1.8, '{}', 'vorratsschrank', 180, ARRAY['Reiswaffeln', 'Rice Cakes', 'Reiskuchen'], 10),
('Wraps', 'Tortilla wraps', 'getreide_nudeln', false, false, true, 'Stueck', 312, 8, 52, 8, 2.1, ARRAY['gluten'], 'vorratsschrank', 14, ARRAY['Wraps', 'Tortilla', 'Tortillawraps'], 11),
('Hirse', 'Millet', 'getreide_nudeln', false, false, true, 'g', 378, 11, 73, 4.2, 8.5, '{}', 'vorratsschrank', 365, ARRAY['Hirse', 'Millet', 'Goldhirse'], 12),
('Polenta', 'Polenta', 'getreide_nudeln', false, false, true, 'g', 360, 8, 79, 1, 2, '{}', 'vorratsschrank', 365, ARRAY['Polenta', 'Maisgrieß', 'Cornmeal'], 13),
('Buchweizen', 'Buckwheat', 'getreide_nudeln', false, true, true, 'g', 343, 13, 72, 3.4, 10, '{}', 'vorratsschrank', 365, ARRAY['Buchweizen', 'Buckwheat'], 14),
('Reisnudeln', 'Rice noodles', 'getreide_nudeln', false, false, true, 'g', 360, 3.4, 84, 0.6, 1.6, '{}', 'vorratsschrank', 365, ARRAY['Reisnudeln', 'Rice Noodles', 'Glasnudeln', 'Pho'], 15),
('Muesli', 'Muesli', 'getreide_nudeln', false, false, true, 'g', 370, 10, 64, 7, 8, ARRAY['gluten'], 'vorratsschrank', 180, ARRAY['Muesli', 'Müsli', 'Granola', 'Crunchy'], 16),
('Dinkel', 'Spelt', 'getreide_nudeln', false, false, true, 'g', 338, 15, 70, 2.4, 11, ARRAY['gluten'], 'vorratsschrank', 365, ARRAY['Dinkel', 'Spelt', 'Dinkelmehl'], 17);

-- ============================================================
-- 3.6 HUELSENFRUECHTE & SAMEN (~12 Items)
-- ============================================================
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, allergens, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Rote Linsen', 'Red lentils', 'huelsenfruechte', true, true, true, 'g', 358, 24, 60, 1.1, 11, '{}', 'vorratsschrank', 365, ARRAY['Rote Linsen', 'Linsen', 'Red Lentils', 'Lentils'], 1),
('Kichererbsen', 'Chickpeas', 'huelsenfruechte', true, true, true, 'g', 364, 19, 61, 6, 17, '{}', 'vorratsschrank', 365, ARRAY['Kichererbsen', 'Chickpeas', 'Hummus'], 2),
('Kidneybohnen', 'Kidney beans', 'huelsenfruechte', false, true, true, 'g', 333, 24, 60, 0.8, 25, '{}', 'vorratsschrank', 365, ARRAY['Kidneybohnen', 'Kidney Beans', 'Rote Bohnen'], 3),
('Schwarze Bohnen', 'Black beans', 'huelsenfruechte', false, true, true, 'g', 341, 21, 63, 0.9, 16, '{}', 'vorratsschrank', 365, ARRAY['Schwarze Bohnen', 'Black Beans'], 4),
('Weisse Bohnen', 'White beans', 'huelsenfruechte', false, true, true, 'g', 333, 23, 60, 0.9, 25, '{}', 'vorratsschrank', 365, ARRAY['Weisse Bohnen', 'Cannellini', 'White Beans'], 5),
('Gruene Linsen', 'Green lentils', 'huelsenfruechte', false, true, true, 'g', 352, 25, 60, 1.1, 31, '{}', 'vorratsschrank', 365, ARRAY['Gruene Linsen', 'Berglinsen', 'Green Lentils', 'Belugalinsen'], 6),
('Chiasamen', 'Chia seeds', 'huelsenfruechte', false, true, true, 'g', 486, 17, 42, 31, 34, '{}', 'vorratsschrank', 365, ARRAY['Chiasamen', 'Chia Seeds', 'Chia'], 7),
('Leinsamen', 'Flaxseed', 'huelsenfruechte', false, true, true, 'g', 534, 18, 29, 42, 27, '{}', 'vorratsschrank', 180, ARRAY['Leinsamen', 'Flaxseed', 'Leinsaat', 'Geschrotet'], 8),
('Sesam', 'Sesame', 'huelsenfruechte', false, false, true, 'g', 573, 18, 23, 50, 12, ARRAY['sesam'], 'vorratsschrank', 180, ARRAY['Sesam', 'Sesame', 'Sesamkoerner'], 9),
('Sonnenblumenkerne', 'Sunflower seeds', 'huelsenfruechte', false, true, true, 'g', 584, 21, 20, 51, 8.6, '{}', 'vorratsschrank', 180, ARRAY['Sonnenblumenkerne', 'Sunflower Seeds'], 10),
('Kuerbiskerne', 'Pumpkin seeds', 'huelsenfruechte', false, true, true, 'g', 559, 30, 10, 49, 6, '{}', 'vorratsschrank', 180, ARRAY['Kuerbiskerne', 'Kürbiskerne', 'Pumpkin Seeds'], 11),
('Hanfsamen', 'Hemp seeds', 'huelsenfruechte', false, true, true, 'g', 553, 32, 8.7, 49, 4, '{}', 'vorratsschrank', 180, ARRAY['Hanfsamen', 'Hemp Seeds', 'Hanfherzen'], 12);

-- ============================================================
-- 3.7 NUESSE & TROCKENFRUECHE (~10 Items)
-- ============================================================
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, allergens, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Mandeln', 'Almonds', 'nuesse', false, true, true, 'g', 579, 21, 22, 50, 13, ARRAY['schalenfrueche'], 'vorratsschrank', 180, ARRAY['Mandeln', 'Almonds', 'Mandelblättchen'], 1),
('Walnuesse', 'Walnuts', 'nuesse', false, true, true, 'g', 654, 15, 14, 65, 6.7, ARRAY['schalenfrueche'], 'vorratsschrank', 180, ARRAY['Walnuesse', 'Walnüsse', 'Walnuts'], 2),
('Cashews', 'Cashews', 'nuesse', false, true, true, 'g', 553, 18, 30, 44, 3.3, ARRAY['schalenfrueche'], 'vorratsschrank', 180, ARRAY['Cashews', 'Cashewkerne', 'Cashew Nuts'], 3),
('Erdnuesse', 'Peanuts', 'nuesse', true, true, true, 'g', 567, 26, 16, 49, 8.5, ARRAY['erdnuesse'], 'vorratsschrank', 180, ARRAY['Erdnuesse', 'Erdnüsse', 'Peanuts'], 4),
('Haselnuesse', 'Hazelnuts', 'nuesse', false, false, true, 'g', 628, 15, 17, 61, 10, ARRAY['schalenfrueche'], 'vorratsschrank', 180, ARRAY['Haselnuesse', 'Haselnüsse', 'Hazelnuts'], 5),
('Pistazien', 'Pistachios', 'nuesse', false, true, true, 'g', 560, 20, 28, 45, 10, ARRAY['schalenfrueche'], 'vorratsschrank', 180, ARRAY['Pistazien', 'Pistachios'], 6),
('Erdnussbutter', 'Peanut butter', 'nuesse', false, true, true, 'g', 588, 25, 20, 50, 6, ARRAY['erdnuesse'], 'vorratsschrank', 180, ARRAY['Erdnussbutter', 'Peanut Butter', 'Erdnussmus'], 7),
('Mandelmus', 'Almond butter', 'nuesse', false, true, true, 'g', 614, 21, 19, 56, 10, ARRAY['schalenfrueche'], 'vorratsschrank', 180, ARRAY['Mandelmus', 'Almond Butter', 'Mandelbutter'], 8),
('Kokosflocken', 'Coconut flakes', 'nuesse', false, false, true, 'g', 660, 6.9, 24, 62, 16, '{}', 'vorratsschrank', 365, ARRAY['Kokosflocken', 'Kokosraspeln', 'Coconut Flakes'], 9),
('Rosinen', 'Raisins', 'nuesse', false, false, true, 'g', 299, 3.1, 79, 0.5, 3.7, '{}', 'vorratsschrank', 365, ARRAY['Rosinen', 'Sultaninen', 'Raisins'], 10);

-- ============================================================
-- 3.8 OELE & FETTE (~8 Items)
-- ============================================================
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Olivenoel', 'Olive oil', 'oele_fette', true, false, true, 'ml', 884, 0, 0, 100, 0, 'vorratsschrank', 365, ARRAY['Olivenoel', 'Olivenöl', 'Olive Oil'], 1),
('Rapsoel', 'Canola oil', 'oele_fette', true, false, true, 'ml', 884, 0, 0, 100, 0, 'vorratsschrank', 365, ARRAY['Rapsoel', 'Rapsöl', 'Canola Oil', 'Sonnenblumenoel'], 2),
('Kokosoel', 'Coconut oil', 'oele_fette', false, false, true, 'ml', 862, 0, 0, 100, 0, 'vorratsschrank', 365, ARRAY['Kokosoel', 'Kokosöl', 'Coconut Oil'], 3),
('Sesamoel', 'Sesame oil', 'oele_fette', false, false, true, 'ml', 884, 0, 0, 100, 0, 'vorratsschrank', 365, ARRAY['Sesamoel', 'Sesamöl', 'Sesame Oil'], 4),
('Leinoel', 'Linseed oil', 'oele_fette', false, true, true, 'ml', 884, 0, 0, 100, 0, 'vorratsschrank', 90, ARRAY['Leinoel', 'Leinöl', 'Linseed Oil', 'Flaxseed Oil'], 5),
('Ghee', 'Ghee', 'oele_fette', false, false, false, 'g', 900, 0, 0, 100, 0, 'vorratsschrank', 180, ARRAY['Ghee', 'Butterschmalz', 'Clarified Butter'], 6),
('Margarine', 'Margarine', 'oele_fette', false, false, true, 'g', 717, 0.2, 0.9, 80, 0, 'kuehlschrank', 90, ARRAY['Margarine'], 7),
('Avocadoel', 'Avocado oil', 'oele_fette', false, false, true, 'ml', 884, 0, 0, 100, 0, 'vorratsschrank', 365, ARRAY['Avocadoel', 'Avocadoöl', 'Avocado Oil'], 8);

-- ============================================================
-- 3.9 GEWUERZE & KRAEUTER (~28 Items)
-- ============================================================
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Salz', 'Salt', 'gewuerze', true, false, true, 'Prise', 0, 0, 0, 0, 0, 'gewuerze', 1825, ARRAY['Salz', 'Meersalz', 'Salt', 'Speisesalz'], 1),
('Pfeffer', 'Pepper', 'gewuerze', true, false, true, 'Prise', 251, 10, 64, 3.3, 25, 'gewuerze', 1825, ARRAY['Pfeffer', 'Pepper', 'Schwarzer Pfeffer'], 2),
('Paprikapulver', 'Paprika powder', 'gewuerze', true, false, true, 'TL', 282, 14, 54, 13, 35, 'gewuerze', 730, ARRAY['Paprikapulver', 'Paprika', 'Paprika Powder'], 3),
('Currypulver', 'Curry powder', 'gewuerze', true, false, true, 'TL', 325, 14, 58, 14, 53, 'gewuerze', 730, ARRAY['Currypulver', 'Curry', 'Curry Powder'], 4),
('Kurkuma', 'Turmeric', 'gewuerze', false, true, true, 'TL', 312, 10, 65, 3.3, 23, 'gewuerze', 730, ARRAY['Kurkuma', 'Gelbwurz', 'Turmeric'], 5),
('Zimt', 'Cinnamon', 'gewuerze', true, false, true, 'TL', 247, 4, 81, 1.2, 53, 'gewuerze', 730, ARRAY['Zimt', 'Cinnamon', 'Zimtpulver'], 6),
('Oregano', 'Oregano', 'gewuerze', true, false, true, 'TL', 265, 9, 69, 4.3, 43, 'gewuerze', 730, ARRAY['Oregano'], 7),
('Basilikum', 'Basil', 'gewuerze', true, false, true, 'TL', 233, 14, 48, 4, 38, 'gewuerze', 365, ARRAY['Basilikum', 'Basil'], 8),
('Thymian', 'Thyme', 'gewuerze', false, false, true, 'TL', 276, 9, 64, 7.4, 37, 'gewuerze', 730, ARRAY['Thymian', 'Thyme'], 9),
('Rosmarin', 'Rosemary', 'gewuerze', false, false, true, 'TL', 131, 3.3, 21, 5.9, 14, 'gewuerze', 730, ARRAY['Rosmarin', 'Rosemary'], 10),
('Chiliflocken', 'Chili flakes', 'gewuerze', false, false, true, 'TL', 282, 12, 50, 17, 28, 'gewuerze', 730, ARRAY['Chiliflocken', 'Chili Flakes', 'Cayenne', 'Chili'], 11),
('Muskatnuss', 'Nutmeg', 'gewuerze', true, false, true, 'Prise', 525, 6, 49, 36, 21, 'gewuerze', 1825, ARRAY['Muskatnuss', 'Muskat', 'Nutmeg'], 12),
('Kreuzkuemmel', 'Cumin', 'gewuerze', false, false, true, 'TL', 375, 18, 44, 22, 11, 'gewuerze', 730, ARRAY['Kreuzkuemmel', 'Cumin', 'Kumin'], 13),
('Koriander', 'Coriander', 'gewuerze', false, false, true, 'TL', 298, 12, 55, 18, 42, 'gewuerze', 730, ARRAY['Koriander', 'Coriander', 'Cilantro'], 14),
('Petersilie', 'Parsley', 'gewuerze', false, false, true, 'EL', 36, 3, 6.3, 0.8, 3.3, 'kuehlschrank', 5, ARRAY['Petersilie', 'Parsley', 'Glatte Petersilie'], 15),
('Dill', 'Dill', 'gewuerze', false, false, true, 'EL', 43, 3.5, 7, 1.1, 2.1, 'kuehlschrank', 5, ARRAY['Dill', 'Dillspitzen'], 16),
('Schnittlauch', 'Chives', 'gewuerze', false, false, true, 'EL', 30, 3.3, 4.4, 0.7, 2.5, 'kuehlschrank', 5, ARRAY['Schnittlauch', 'Chives'], 17),
('Minze', 'Mint', 'gewuerze', false, false, true, 'EL', 44, 3.3, 8.4, 0.7, 6.8, 'kuehlschrank', 5, ARRAY['Minze', 'Pfefferminze', 'Mint'], 18),
('Knoblauchpulver', 'Garlic powder', 'gewuerze', true, false, true, 'TL', 331, 17, 73, 0.7, 9, 'gewuerze', 730, ARRAY['Knoblauchpulver', 'Garlic Powder'], 19),
('Gemuesebruehe', 'Vegetable broth', 'gewuerze', true, false, true, 'Wuerfel', 175, 10, 26, 3.3, 0, 'gewuerze', 365, ARRAY['Gemuesebruehe', 'Gemüsebrühe', 'Brühwürfel', 'Vegetable Broth'], 20),
('Lorbeerblatt', 'Bay leaf', 'gewuerze', false, false, true, 'Stueck', 313, 8, 75, 8.4, 26, 'gewuerze', 730, ARRAY['Lorbeerblatt', 'Lorbeer', 'Bay Leaf'], 21),
('Majoran', 'Marjoram', 'gewuerze', false, false, true, 'TL', 271, 12, 61, 7, 40, 'gewuerze', 730, ARRAY['Majoran', 'Marjoram'], 22),
('Vanilleextrakt', 'Vanilla extract', 'gewuerze', false, false, true, 'TL', 288, 0.1, 13, 0.1, 0, 'gewuerze', 730, ARRAY['Vanilleextrakt', 'Vanille', 'Vanilla', 'Vanilleschote'], 23),
('Cayennepfeffer', 'Cayenne pepper', 'gewuerze', false, false, true, 'Prise', 318, 12, 57, 17, 27, 'gewuerze', 730, ARRAY['Cayennepfeffer', 'Cayenne'], 24),
('Garam Masala', 'Garam masala', 'gewuerze', false, false, true, 'TL', 379, 14, 45, 15, 54, 'gewuerze', 730, ARRAY['Garam Masala', 'Masala'], 25),
('Sumach', 'Sumac', 'gewuerze', false, false, true, 'TL', 239, 5, 44, 8, 28, 'gewuerze', 730, ARRAY['Sumach', 'Sumac', 'Sumak'], 26),
('Zaatar', 'Za''atar', 'gewuerze', false, false, true, 'TL', 276, 10, 48, 8, 18, 'gewuerze', 730, ARRAY['Zaatar', 'Za''atar', 'Zahtar'], 27);

-- ============================================================
-- 3.10 KONSERVEN & SAUCEN (~18 Items)
-- ============================================================
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, allergens, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Dosentomaten', 'Canned tomatoes', 'konserven', true, false, true, 'Dose', 24, 1.2, 4, 0.1, 1, '{}', 'vorratsschrank', 730, ARRAY['Dosentomaten', 'Tomaten Dose', 'Canned Tomatoes', 'Pelati', 'Stückige Tomaten'], 1),
('Tomatenmark', 'Tomato paste', 'konserven', true, false, true, 'EL', 82, 4.3, 19, 0.5, 4.1, '{}', 'vorratsschrank', 365, ARRAY['Tomatenmark', 'Tomato Paste', 'Tomatenpüree'], 2),
('Kokosmilch', 'Coconut milk', 'konserven', false, false, true, 'Dose', 197, 2.3, 2.8, 21, 0, '{}', 'vorratsschrank', 730, ARRAY['Kokosmilch', 'Coconut Milk', 'Kokosnussmilch'], 3),
('Sojasauce', 'Soy sauce', 'konserven', true, false, true, 'ml', 53, 8.1, 4.9, 0, 0.8, ARRAY['soja', 'gluten'], 'vorratsschrank', 730, ARRAY['Sojasauce', 'Sojasosse', 'Soy Sauce', 'Tamari'], 4),
('Senf', 'Mustard', 'konserven', true, false, true, 'TL', 66, 4, 6, 3, 3.2, ARRAY['senf'], 'kuehlschrank', 365, ARRAY['Senf', 'Mustard', 'Dijonsenf'], 5),
('Ketchup', 'Ketchup', 'konserven', true, false, true, 'ml', 112, 1.7, 26, 0.1, 0.3, '{}', 'kuehlschrank', 365, ARRAY['Ketchup', 'Tomatenketchup'], 6),
('Essig', 'Vinegar', 'konserven', true, false, true, 'ml', 18, 0, 0.6, 0, 0, '{}', 'vorratsschrank', 1825, ARRAY['Essig', 'Balsamico', 'Vinegar', 'Weissweinessig', 'Apfelessig'], 7),
('Passierte Tomaten', 'Tomato passata', 'konserven', true, false, true, 'ml', 24, 1, 4.2, 0.1, 1, '{}', 'vorratsschrank', 365, ARRAY['Passierte Tomaten', 'Passata', 'Tomato Passata'], 8),
('Thunfisch Dose', 'Canned tuna', 'konserven', true, true, false, 'Dose', 116, 26, 0, 1, 0, ARRAY['fisch'], 'vorratsschrank', 1095, ARRAY['Thunfisch Dose', 'Dosenthunfisch', 'Canned Tuna'], 9),
('Mais Dose', 'Canned corn', 'konserven', false, false, true, 'Dose', 64, 2.3, 14, 0.5, 1.7, '{}', 'vorratsschrank', 730, ARRAY['Mais Dose', 'Dosenmais', 'Canned Corn'], 10),
('Kichererbsen Dose', 'Canned chickpeas', 'konserven', false, true, true, 'Dose', 119, 7, 17, 2.6, 6, '{}', 'vorratsschrank', 730, ARRAY['Kichererbsen Dose', 'Canned Chickpeas'], 11),
('Kidneybohnen Dose', 'Canned kidney beans', 'konserven', false, true, true, 'Dose', 127, 9, 22, 0.5, 7, '{}', 'vorratsschrank', 730, ARRAY['Kidneybohnen Dose', 'Canned Kidney Beans'], 12),
('Pesto', 'Pesto', 'konserven', false, false, true, 'EL', 464, 5, 6, 47, 2, ARRAY['schalenfrueche', 'laktose'], 'kuehlschrank', 14, ARRAY['Pesto', 'Basilikumpesto', 'Pesto Genovese'], 13),
('Currypaste', 'Curry paste', 'konserven', false, false, true, 'EL', 113, 2, 12, 7, 3, '{}', 'kuehlschrank', 180, ARRAY['Currypaste', 'Curry Paste', 'Thai Curry', 'Rote Currypaste'], 14),
('Sambal Oelek', 'Sambal oelek', 'konserven', false, false, true, 'TL', 61, 1.1, 12, 0.7, 4.5, '{}', 'kuehlschrank', 365, ARRAY['Sambal Oelek', 'Sambal', 'Chili Paste'], 15),
('Worcestersauce', 'Worcestershire sauce', 'konserven', false, false, false, 'ml', 78, 0, 20, 0, 0, ARRAY['fisch'], 'vorratsschrank', 730, ARRAY['Worcestersauce', 'Worcestershire', 'Worcester'], 16),
('Tahini', 'Tahini', 'konserven', false, true, true, 'EL', 595, 17, 21, 54, 9, ARRAY['sesam'], 'vorratsschrank', 365, ARRAY['Tahini', 'Sesampaste', 'Tahina'], 17),
('Hoisinsauce', 'Hoisin sauce', 'konserven', false, false, true, 'ml', 220, 3.3, 44, 3.4, 2, ARRAY['soja'], 'kuehlschrank', 365, ARRAY['Hoisinsauce', 'Hoisin Sauce', 'Hoisin'], 18);

-- ============================================================
-- 3.11 BACKZUTATEN (~10 Items)
-- ============================================================
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, allergens, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Mehl', 'Flour', 'backzutaten', true, false, true, 'g', 364, 10, 76, 1, 2.7, ARRAY['gluten'], 'vorratsschrank', 365, ARRAY['Mehl', 'Weizenmehl', 'Flour', 'Type 405'], 1),
('Zucker', 'Sugar', 'backzutaten', true, false, true, 'g', 400, 0, 100, 0, 0, '{}', 'vorratsschrank', 1825, ARRAY['Zucker', 'Sugar', 'Kristallzucker'], 2),
('Backpulver', 'Baking powder', 'backzutaten', true, false, true, 'TL', 53, 0, 28, 0, 0, '{}', 'vorratsschrank', 365, ARRAY['Backpulver', 'Baking Powder'], 3),
('Vanillezucker', 'Vanilla sugar', 'backzutaten', true, false, true, 'Paeckchen', 400, 0, 100, 0, 0, '{}', 'vorratsschrank', 365, ARRAY['Vanillezucker', 'Vanilla Sugar'], 4),
('Speisestaerke', 'Cornstarch', 'backzutaten', false, false, true, 'g', 351, 0.3, 87, 0.1, 0.9, '{}', 'vorratsschrank', 730, ARRAY['Speisestaerke', 'Stärke', 'Cornstarch', 'Mondamin'], 5),
('Trockenhefe', 'Dry yeast', 'backzutaten', false, false, true, 'Paeckchen', 325, 40, 41, 7, 27, '{}', 'vorratsschrank', 365, ARRAY['Trockenhefe', 'Hefe', 'Dry Yeast', 'Backhefe'], 6),
('Kakao', 'Cocoa powder', 'backzutaten', false, true, true, 'g', 228, 20, 58, 14, 33, '{}', 'vorratsschrank', 730, ARRAY['Kakao', 'Kakaopulver', 'Cocoa', 'Backkakao'], 7),
('Zartbitterschokolade', 'Dark chocolate', 'backzutaten', false, false, true, 'g', 598, 8, 46, 43, 11, ARRAY['laktose'], 'vorratsschrank', 365, ARRAY['Zartbitterschokolade', 'Schokolade', 'Dark Chocolate', 'Kuvertuere'], 8),
('Paniermehl', 'Breadcrumbs', 'backzutaten', true, false, true, 'g', 395, 13, 72, 5, 4.5, ARRAY['gluten'], 'vorratsschrank', 365, ARRAY['Paniermehl', 'Semmelbrösel', 'Breadcrumbs'], 9),
('Kokosmehl', 'Coconut flour', 'backzutaten', false, true, true, 'g', 443, 19, 60, 14, 39, '{}', 'vorratsschrank', 365, ARRAY['Kokosmehl', 'Coconut Flour'], 10);

-- ============================================================
-- 3.12 GETRAENKE (~6 Items — nur Koch-relevante)
-- ============================================================
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, allergens, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Orangensaft', 'Orange juice', 'getraenke', false, false, true, 'ml', 45, 0.7, 10, 0.2, 0.2, '{}', 'kuehlschrank', 7, ARRAY['Orangensaft', 'O-Saft', 'Orange Juice'], 1),
('Apfelsaft', 'Apple juice', 'getraenke', false, false, true, 'ml', 46, 0.1, 11, 0.1, 0.1, '{}', 'vorratsschrank', 365, ARRAY['Apfelsaft', 'Apple Juice'], 2),
('Weisswein', 'White wine', 'getraenke', false, false, true, 'ml', 82, 0.1, 2.6, 0, 0, ARRAY['sulfite'], 'vorratsschrank', 365, ARRAY['Weisswein', 'Weißwein', 'White Wine', 'Wein'], 3),
('Rotwein', 'Red wine', 'getraenke', false, false, true, 'ml', 85, 0.1, 2.6, 0, 0, ARRAY['sulfite'], 'vorratsschrank', 365, ARRAY['Rotwein', 'Red Wine'], 4),
('Bier', 'Beer', 'getraenke', false, false, true, 'ml', 43, 0.5, 3.6, 0, 0, ARRAY['gluten'], 'kuehlschrank', 180, ARRAY['Bier', 'Beer', 'Pils'], 5),
('Zitronensaft', 'Lemon juice', 'getraenke', true, false, true, 'ml', 22, 0.4, 6.9, 0.2, 0.3, '{}', 'kuehlschrank', 30, ARRAY['Zitronensaft', 'Lemon Juice'], 6);

-- ============================================================
-- 3.13 TIEFKUEHL (~8 Items)
-- ============================================================
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('TK-Gemuese Mix', 'Frozen vegetable mix', 'tiefkuehl', true, false, true, 'g', 54, 2.6, 10, 0.3, 3.5, 'gefriertruhe', 365, ARRAY['TK-Gemuese', 'Tiefkuehlgemuese', 'Frozen Vegetables', 'Gemüse Mix'], 1),
('TK-Spinat', 'Frozen spinach', 'tiefkuehl', false, true, true, 'g', 23, 2.9, 3.6, 0.4, 2.2, 'gefriertruhe', 365, ARRAY['TK-Spinat', 'Tiefkuehlspinat', 'Frozen Spinach', 'Rahmspinat'], 2),
('TK-Beeren Mix', 'Frozen berry mix', 'tiefkuehl', false, true, true, 'g', 48, 1, 12, 0.3, 3, 'gefriertruhe', 365, ARRAY['TK-Beeren', 'Tiefkuehlbeeren', 'Frozen Berries', 'Beerenmix'], 3),
('TK-Brokkoli', 'Frozen broccoli', 'tiefkuehl', false, true, true, 'g', 34, 2.8, 7, 0.4, 2.6, 'gefriertruhe', 365, ARRAY['TK-Brokkoli', 'Tiefkuehlbrokkoli', 'Frozen Broccoli'], 4),
('TK-Erbsen', 'Frozen peas', 'tiefkuehl', false, true, true, 'g', 81, 5.4, 14, 0.4, 5.1, 'gefriertruhe', 365, ARRAY['TK-Erbsen', 'Tiefkuehlerbsen', 'Frozen Peas'], 5),
('TK-Haehnchenbrust', 'Frozen chicken breast', 'tiefkuehl', false, true, false, 'g', 165, 31, 0, 3.6, 0, 'gefriertruhe', 365, ARRAY['TK-Haehnchenbrust', 'TK-Hähnchen', 'Frozen Chicken'], 6),
('TK-Lachs', 'Frozen salmon', 'tiefkuehl', false, true, false, 'g', 208, 20, 0, 13, 0, 'gefriertruhe', 365, ARRAY['TK-Lachs', 'TK-Lachsfilet', 'Frozen Salmon'], 7),
('TK-Pizza', 'Frozen pizza', 'tiefkuehl', false, false, false, 'Stueck', 245, 10, 30, 10, 2, 'gefriertruhe', 365, ARRAY['TK-Pizza', 'Tiefkuehlpizza', 'Frozen Pizza'], 8);

-- ============================================================
-- 3.14 BROT & AUFSTRICHE (~8 Items)
-- ============================================================
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, allergens, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Honig', 'Honey', 'brot_aufstriche', true, false, false, 'g', 304, 0.3, 82, 0, 0.2, '{}', 'vorratsschrank', 730, ARRAY['Honig', 'Honey', 'Bienenhonig'], 1),
('Marmelade', 'Jam', 'brot_aufstriche', true, false, true, 'g', 250, 0.3, 63, 0.1, 1, '{}', 'vorratsschrank', 365, ARRAY['Marmelade', 'Jam', 'Konfituere', 'Erdbeermarm'], 2),
('Nutella', 'Nutella', 'brot_aufstriche', false, false, false, 'g', 539, 6.3, 58, 31, 3, ARRAY['schalenfrueche', 'laktose'], 'vorratsschrank', 365, ARRAY['Nutella', 'Nuss-Nougat-Creme', 'Schokoaufstrich'], 3),
('Hummus', 'Hummus', 'brot_aufstriche', false, true, true, 'g', 166, 8, 14, 10, 6, ARRAY['sesam'], 'kuehlschrank', 7, ARRAY['Hummus', 'Kichererbsenpaste'], 4),
('Frischkaese Kraeuter', 'Herb cream cheese', 'brot_aufstriche', false, false, false, 'g', 253, 5, 3, 25, 0.5, ARRAY['laktose'], 'kuehlschrank', 14, ARRAY['Kräuterfrischkäse', 'Herb Cream Cheese', 'Boursin'], 5),
('Leberwurst', 'Liverwurst', 'brot_aufstriche', false, false, false, 'g', 326, 13, 2, 30, 0, '{}', 'kuehlschrank', 7, ARRAY['Leberwurst', 'Liverwurst'], 6),
('Avocado-Aufstrich', 'Avocado spread', 'brot_aufstriche', false, true, true, 'g', 160, 2, 9, 15, 7, '{}', 'kuehlschrank', 3, ARRAY['Avocado-Aufstrich', 'Guacamole', 'Avocado Spread'], 7),
('Ahornsirup', 'Maple syrup', 'brot_aufstriche', false, false, true, 'ml', 260, 0, 67, 0, 0, '{}', 'vorratsschrank', 365, ARRAY['Ahornsirup', 'Maple Syrup', 'Agavendicksaft'], 8);

-- ============================================================
-- 3.15 SUPPLEMENTS & PROTEINE (~10 Items)
-- ============================================================
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, allergens, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Whey Protein', 'Whey protein', 'supplements', false, true, false, 'g', 370, 80, 7, 5, 0, ARRAY['laktose'], 'vorratsschrank', 730, ARRAY['Whey Protein', 'Whey', 'Proteinpulver', 'Eiweißpulver'], 1),
('Casein Protein', 'Casein protein', 'supplements', false, true, false, 'g', 360, 80, 5, 3, 0, ARRAY['laktose'], 'vorratsschrank', 730, ARRAY['Casein', 'Casein Protein', 'Micellar Casein'], 2),
('Veganes Protein', 'Vegan protein', 'supplements', false, true, true, 'g', 370, 75, 10, 6, 5, '{}', 'vorratsschrank', 730, ARRAY['Veganes Protein', 'Vegan Protein', 'Erbsenprotein', 'Reisprotein'], 3),
('Kreatin', 'Creatine', 'supplements', false, true, true, 'g', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 1095, ARRAY['Kreatin', 'Creatine', 'Creatin Monohydrat'], 4),
('EAA', 'EAA', 'supplements', false, true, true, 'g', 400, 100, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['EAA', 'Essentielle Aminosäuren', 'Essential Amino Acids'], 5),
('BCAA', 'BCAA', 'supplements', false, true, true, 'g', 400, 100, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['BCAA', 'Branched Chain Amino Acids'], 6),
('Omega-3', 'Omega-3', 'supplements', false, true, false, 'Kapsel', 900, 0, 0, 100, 0, ARRAY['fisch'], 'vorratsschrank', 730, ARRAY['Omega-3', 'Fischoel', 'Fish Oil', 'EPA DHA'], 7),
('Vitamin D3', 'Vitamin D3', 'supplements', false, true, true, 'Tropfen', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['Vitamin D3', 'Vitamin D', 'D3'], 8),
('Magnesium', 'Magnesium', 'supplements', false, true, true, 'Kapsel', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['Magnesium', 'Magnesiumcitrat'], 9),
('Proteinriegel', 'Protein bar', 'supplements', false, true, false, 'Stueck', 350, 30, 35, 12, 5, ARRAY['laktose'], 'vorratsschrank', 365, ARRAY['Proteinriegel', 'Protein Bar', 'Eiweißriegel'], 10);

-- ============================================================
-- Zusammenfassung: ~248 Zutaten in 15 Kategorien
-- davon ~80 is_staple, ~45 is_fitness
-- ============================================================

-- PostgREST Schema-Reload
NOTIFY pgrst, 'reload schema';
