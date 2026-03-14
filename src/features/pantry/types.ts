/**
 * Pantry domain types for the FitBuddy pantry system.
 * Phase 0+A: Zutatenkatalog + persoenlicher Vorrat.
 */

/** Kategorien im Zutatenkatalog (16 Stueck) */
export type IngredientCategory =
  | 'gemuese'
  | 'obst'
  | 'fleisch_fisch'
  | 'milchprodukte'
  | 'getreide_nudeln'
  | 'huelsenfruechte'
  | 'nuesse'
  | 'oele_fette'
  | 'gewuerze'
  | 'konserven'
  | 'backzutaten'
  | 'getraenke'
  | 'tiefkuehl'
  | 'brot_aufstriche'
  | 'proteine_gainer'
  | 'supplements'
  | 'sonstiges';

/** Display info for each category */
export const CATEGORY_INFO: Record<IngredientCategory, { labelDe: string; labelEn: string; icon: string; sortOrder: number }> = {
  gemuese:          { labelDe: 'Gemüse',                  labelEn: 'Vegetables',          icon: '🥦', sortOrder: 1 },
  obst:             { labelDe: 'Obst',                    labelEn: 'Fruits',              icon: '🍎', sortOrder: 2 },
  fleisch_fisch:    { labelDe: 'Fleisch & Fisch',         labelEn: 'Meat & Fish',         icon: '🥩', sortOrder: 3 },
  milchprodukte:    { labelDe: 'Milchprodukte & Eier',    labelEn: 'Dairy & Eggs',        icon: '🥛', sortOrder: 4 },
  getreide_nudeln:  { labelDe: 'Getreide & Nudeln',       labelEn: 'Grains & Pasta',      icon: '🌾', sortOrder: 5 },
  huelsenfruechte:  { labelDe: 'Hülsenfrüchte & Samen',   labelEn: 'Legumes & Seeds',     icon: '🫘', sortOrder: 6 },
  nuesse:           { labelDe: 'Nüsse & Trockenfrüchte',  labelEn: 'Nuts & Dried Fruits', icon: '🥜', sortOrder: 7 },
  oele_fette:       { labelDe: 'Öle & Fette',             labelEn: 'Oils & Fats',         icon: '🫒', sortOrder: 8 },
  gewuerze:         { labelDe: 'Gewürze & Kräuter',        labelEn: 'Spices & Herbs',      icon: '🧂', sortOrder: 9 },
  konserven:        { labelDe: 'Konserven & Saucen',       labelEn: 'Canned Goods & Sauces', icon: '🥫', sortOrder: 10 },
  backzutaten:      { labelDe: 'Backzutaten',              labelEn: 'Baking Supplies',     icon: '🎂', sortOrder: 11 },
  getraenke:        { labelDe: 'Getränke',                 labelEn: 'Beverages',           icon: '🥤', sortOrder: 12 },
  tiefkuehl:        { labelDe: 'Tiefkühl',                 labelEn: 'Frozen',              icon: '❄️', sortOrder: 13 },
  brot_aufstriche:  { labelDe: 'Brot & Aufstriche',        labelEn: 'Bread & Spreads',     icon: '🍞', sortOrder: 14 },
  proteine_gainer:  { labelDe: 'Proteine & Weight Gainer', labelEn: 'Protein & Weight Gainer', icon: '🥤', sortOrder: 15 },
  supplements:      { labelDe: 'Supplements & Vitamine',   labelEn: 'Supplements & Vitamins', icon: '💊', sortOrder: 16 },
  sonstiges:        { labelDe: 'Sonstiges',                labelEn: 'Other',               icon: '📦', sortOrder: 17 },
};

/** Zutatenkatalog-Eintrag (DB: ingredient_catalog) */
export interface IngredientCatalogItem {
  id: string;
  name_de: string;
  name_en: string | null;
  category: IngredientCategory;
  subcategory: string | null;
  is_staple: boolean;
  is_fitness: boolean;
  is_vegan: boolean;
  default_unit: string;
  default_quantity: string | null;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbs_per_100g: number | null;
  fat_per_100g: number | null;
  fiber_per_100g: number | null;
  allergens: string[];
  storage_type: string;
  shelf_life_days: number | null;
  search_terms: string[];
  bls_code: string | null;
  sort_order: number;
}

/** Vorrats-Status */
export type PantryStatus = 'available' | 'low' | 'empty';

/** Kauf-Praeferenz */
export type BuyPreference = 'always' | 'sometimes' | 'never';

/** Persoenlicher Vorrats-Eintrag (DB: user_pantry) */
export interface PantryItem {
  id: string;
  user_id: string;
  ingredient_id: string | null;
  ingredient_name: string;
  ingredient_normalized: string;
  category: IngredientCategory;
  quantity_text: string | null;
  storage_location: string | null;
  status: PantryStatus;
  buy_preference: BuyPreference;
  added_at: string;
  expires_at: string | null;
  last_confirmed_at: string;
  // Joined from ingredient_catalog (optional)
  catalog_item?: IngredientCatalogItem;
}

/** Quick-Setup Template */
export type PantryTemplate = 'basis' | 'fitness' | 'vegan' | 'empty';

export const PANTRY_TEMPLATES: Record<PantryTemplate, { labelDe: string; labelEn: string; descDe: string; descEn: string; icon: string; filter: (item: IngredientCatalogItem) => boolean }> = {
  basis: {
    labelDe: 'Basis-Küche',
    labelEn: 'Basic Kitchen',
    descDe: 'Standard-Ausstattung (~60 Zutaten)',
    descEn: 'Standard pantry (~60 items)',
    icon: '🏠',
    filter: (item) => item.is_staple,
  },
  fitness: {
    labelDe: 'Fitness-Küche',
    labelEn: 'Fitness Kitchen',
    descDe: 'Basis + High-Protein (~80 Zutaten)',
    descEn: 'Basics + High-Protein (~80 items)',
    icon: '💪',
    filter: (item) => item.is_staple || item.is_fitness,
  },
  vegan: {
    labelDe: 'Vegane Küche',
    labelEn: 'Vegan Kitchen',
    descDe: 'Pflanzliche Grundausstattung (~65 Zutaten)',
    descEn: 'Plant-based pantry (~65 items)',
    icon: '🌱',
    filter: (item) => (item.is_staple || item.is_fitness) && item.is_vegan,
  },
  empty: {
    labelDe: 'Leere Küche',
    labelEn: 'Empty Kitchen',
    descDe: 'Alles selbst auswählen',
    descEn: 'Choose everything yourself',
    icon: '📝',
    filter: () => false,
  },
};

/** Helper: normalize ingredient name for matching */
export function normalizeIngredient(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/\s+/g, ' ');
}
