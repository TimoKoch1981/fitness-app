-- Migration: Brand Products Seed — Real Manufacturer Data
-- FAKTEN-CODEX: All values from official packaging / manufacturer websites
-- Source column 'hersteller' = verified from manufacturer packaging
-- Source_ref = manufacturer website or product page

-- ══════════════════════════════════════════════════════════════════════
-- SUPPLEMENTS (echte Herstellerangaben / real manufacturer data)
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO standard_products (name, brand, category, serving_size_g, serving_label, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, fiber_per_serving, source, source_ref) VALUES

-- ALL STARS 100% Whey Protein 80% Vanille
-- Quelle: Verpackung / wheyprotein.de / amazon.de
-- Pro 100g: 386.2 kcal | 76.2g P | 5.0g C | 6.4g F
('ALL STARS 100% Whey Protein Vanille', 'ALL STARS', 'supplement', 30, '1 Scoop (30g)', 115.8, 22.8, 1.5, 1.9, 0, 'hersteller', 'all-stars.de'),

-- ESN Designer Whey Protein Vanilla
-- Quelle: esn.com Produktseite
-- Pro 100g: 377 kcal | 80.3g P | 4.7g C | 3.7g F
('ESN Designer Whey Vanilla', 'ESN', 'supplement', 30, '1 Scoop (30g)', 113, 24.1, 1.4, 1.1, 0, 'hersteller', 'esn.com'),

-- MyProtein Impact Whey Protein Vanilla
-- Quelle: myprotein.de Produktseite
-- Pro 100g: 388 kcal | 77g P | 6g C | 7.2g F
('MyProtein Impact Whey Vanilla', 'MyProtein', 'supplement', 25, '1 Scoop (25g)', 97, 19.3, 1.5, 1.8, 0, 'hersteller', 'myprotein.de'),

-- Optimum Nutrition Gold Standard 100% Whey Double Rich Chocolate
-- Quelle: optimumnutrition.com
-- Pro 100g: 381 kcal | 78.6g P | 8.6g C | 4.3g F
('ON Gold Standard Whey Chocolate', 'Optimum Nutrition', 'supplement', 31, '1 Scoop (31g)', 118, 24.0, 2.7, 1.3, 0, 'hersteller', 'optimumnutrition.com');


-- ══════════════════════════════════════════════════════════════════════
-- DEUTSCHE MARKENPRODUKTE (echte Herstellerangaben)
-- ══════════════════════════════════════════════════════════════════════

INSERT INTO standard_products (name, brand, category, serving_size_g, serving_label, calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, fiber_per_serving, source, source_ref) VALUES

-- Ehrmann High Protein Pudding Schoko (200g Becher)
-- Quelle: ehrmann.de / Verpackung
-- Pro 100g: 83 kcal | 10g P | 8.8g C | 0.7g F
('Ehrmann High Protein Pudding Schoko', 'Ehrmann', 'dairy', 200, '1 Becher (200g)', 166, 20.0, 17.6, 1.4, 0, 'hersteller', 'ehrmann.de'),

-- Ehrmann High Protein Pudding Vanille (200g Becher)
-- Quelle: ehrmann.de / Verpackung
-- Pro 100g: 81 kcal | 10g P | 8.3g C | 0.7g F
('Ehrmann High Protein Pudding Vanille', 'Ehrmann', 'dairy', 200, '1 Becher (200g)', 162, 20.0, 16.6, 1.4, 0, 'hersteller', 'ehrmann.de'),

-- Arla Skyr Natur (450g Becher)
-- Quelle: arla.de / Verpackung
-- Pro 100g: 63 kcal | 10.6g P | 4.0g C | 0.2g F
('Arla Skyr Natur', 'Arla', 'dairy', 150, '1 Portion (150g)', 95, 15.9, 6.0, 0.3, 0, 'hersteller', 'arla.de'),

-- Koelln Haferflocken kernig
-- Quelle: koelln.de / Verpackung
-- Pro 100g: 370 kcal | 13.5g P | 58.7g C | 7.0g F | 10g Ballaststoffe
('Koelln Haferflocken kernig', 'Koelln', 'grain', 50, '5 EL (50g)', 185, 6.8, 29.4, 3.5, 5.0, 'hersteller', 'koelln.de'),

-- Harzer Kaese (Handkaese)
-- Quelle: BLS 4.0 (generisches Produkt, keine Marke)
-- Pro 100g: 125 kcal | 27g P | 0g C | 0.7g F
('Harzer Kaese', NULL, 'dairy', 30, '1 Stueck (30g)', 38, 8.1, 0, 0.2, 0, 'bls', 'BLS 4.0'),

-- MILRAM Buttermilch
-- Quelle: milram.de / Verpackung
-- Pro 100ml: 38 kcal | 3.5g P | 4.0g C | 0.5g F
('MILRAM Buttermilch', 'MILRAM', 'dairy', 500, '1 Packung (500ml)', 190, 17.5, 20.0, 2.5, 0, 'hersteller', 'milram.de'),

-- Bertolli Olivenoel Extra Vergine
-- Quelle: bertolli.de / Verpackung
-- Pro 100ml: 824 kcal | 0g P | 0g C | 91.6g F
('Bertolli Olivenoel Extra Vergine', 'Bertolli', 'other', 10, '1 EL (10ml)', 82, 0, 0, 9.2, 0, 'hersteller', 'bertolli.de');
