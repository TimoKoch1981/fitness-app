-- ============================================================
-- Migration: Split supplements category + add proteine_gainer
-- F15 Nacharbeit Punkt 1: Supplements ↔ Substanzliste verknuepfen
-- ============================================================

-- 1. Move protein-related items from 'supplements' to 'proteine_gainer'
UPDATE ingredient_catalog
SET category = 'proteine_gainer'
WHERE category = 'supplements'
  AND name_de IN ('Whey Protein', 'Casein Protein', 'Veganes Protein', 'EAA', 'BCAA', 'Proteinriegel');

-- 2. Add Weight Gainer + more protein items to 'proteine_gainer'
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, allergens, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Weight Gainer', 'Weight gainer', 'proteine_gainer', false, true, false, 'g', 400, 25, 60, 5, 2, ARRAY['laktose'], 'vorratsschrank', 730, ARRAY['Weight Gainer', 'Mass Gainer', 'Masse Gainer', 'Hardgainer'], 7),
('Mehrkomponenten Protein', 'Multi-component protein', 'proteine_gainer', false, true, false, 'g', 370, 78, 8, 5, 0, ARRAY['laktose'], 'vorratsschrank', 730, ARRAY['Mehrkomponenten Protein', 'Multi Protein', 'Multi Component'], 8),
('Whey Isolat', 'Whey isolate', 'proteine_gainer', false, true, false, 'g', 370, 90, 2, 1, 0, ARRAY['laktose'], 'vorratsschrank', 730, ARRAY['Whey Isolat', 'Whey Isolate', 'WPI', 'Isolat'], 9),
('Collagen Protein', 'Collagen protein', 'proteine_gainer', false, true, false, 'g', 340, 90, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['Collagen Protein', 'Kollagen', 'Collagen Peptide'], 10),
('Protein Pudding', 'Protein pudding', 'proteine_gainer', false, true, false, 'Stueck', 120, 20, 10, 2, 0, ARRAY['laktose'], 'kuehlschrank', 30, ARRAY['Protein Pudding', 'High Protein Pudding', 'Eiweißpudding'], 11),
('Protein Drink', 'Protein drink', 'proteine_gainer', false, true, false, 'ml', 60, 10, 3, 1, 0, ARRAY['laktose'], 'kuehlschrank', 60, ARRAY['Protein Drink', 'Eiweißdrink', 'Protein Shake fertig'], 12)
ON CONFLICT DO NOTHING;

-- 3. Add more supplement items (matching substancePresets.ts)
INSERT INTO ingredient_catalog (name_de, name_en, category, is_staple, is_fitness, is_vegan, default_unit, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, allergens, storage_type, shelf_life_days, search_terms, sort_order) VALUES
('Zink', 'Zinc', 'supplements', false, true, true, 'Kapsel', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['Zink', 'Zinc', 'Zinktabletten'], 11),
('Vitamin K2', 'Vitamin K2', 'supplements', false, true, true, 'Kapsel', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['Vitamin K2', 'MK-7', 'Menaquinon'], 12),
('Vitamin B-Komplex', 'Vitamin B complex', 'supplements', false, true, true, 'Kapsel', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['Vitamin B-Komplex', 'B Complex', 'B-Vitamine'], 13),
('Ashwagandha', 'Ashwagandha', 'supplements', false, true, true, 'Kapsel', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['Ashwagandha', 'KSM-66', 'Withania'], 14),
('Curcumin', 'Curcumin', 'supplements', false, true, true, 'Kapsel', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['Curcumin', 'Kurkuma', 'Turmeric'], 15),
('CoQ10', 'CoQ10', 'supplements', false, true, true, 'Kapsel', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['CoQ10', 'Coenzym Q10', 'Ubiquinol'], 16),
('Melatonin', 'Melatonin', 'supplements', false, true, true, 'Kapsel', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['Melatonin', 'Schlaf', 'Sleep'], 17),
('Eisen', 'Iron', 'supplements', false, true, true, 'Kapsel', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['Eisen', 'Iron', 'Eisentabletten'], 18),
('L-Carnitin', 'L-Carnitine', 'supplements', false, true, true, 'Kapsel', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['L-Carnitin', 'L-Carnitine', 'Carnitin'], 19),
('Beta-Alanin', 'Beta-Alanine', 'supplements', false, true, true, 'g', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['Beta-Alanin', 'Beta-Alanine', 'Beta Alanin'], 20),
('L-Citrullin', 'L-Citrulline', 'supplements', false, true, true, 'g', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['L-Citrullin', 'L-Citrulline', 'Citrullin Malat'], 21),
('Koffein Tabletten', 'Caffeine tablets', 'supplements', false, true, true, 'Stueck', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['Koffein', 'Caffeine', 'Koffeintabletten'], 22),
('Glucosamin', 'Glucosamine', 'supplements', false, true, false, 'Kapsel', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['Glucosamin', 'Glucosamine', 'Gelenk'], 23),
('Elektrolyte', 'Electrolytes', 'supplements', false, true, true, 'g', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 365, ARRAY['Elektrolyte', 'Electrolytes', 'Mineralien'], 24),
('Glutamin', 'Glutamine', 'supplements', false, true, true, 'g', 400, 100, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['Glutamin', 'Glutamine', 'L-Glutamin'], 25),
('L-Arginin', 'L-Arginine', 'supplements', false, true, true, 'g', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['L-Arginin', 'L-Arginine', 'Arginin'], 26),
('Taurin', 'Taurine', 'supplements', false, true, true, 'g', 0, 0, 0, 0, 0, '{}', 'vorratsschrank', 730, ARRAY['Taurin', 'Taurine'], 27)
ON CONFLICT DO NOTHING;

-- PostgREST Schema-Reload
NOTIFY pgrst, 'reload schema';
