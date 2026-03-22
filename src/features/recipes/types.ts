/**
 * Recipe domain types for the FitBuddy recipe system.
 * v2.0: Supabase-backed with structured steps, allergens, and fitness goals.
 */

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface RecipeStep {
  text: string;
  duration_min?: number;
}

export interface MacrosPerServing {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** DB-backed recipe (Supabase schema) */
export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string;
  meal_type: string | null;
  prep_time_min: number;
  cook_time_min: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  fiber_per_serving: number | null;
  sugar_per_serving: number | null;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  tags: string[];
  allergens: string[];
  image_url: string | null;
  source_url: string | null;
  import_method: string | null;
  is_favorite: boolean;
  is_public: boolean;
  fitness_goal: string[];
  created_at: string;
  updated_at: string;
}

/** Legacy recipe format (localStorage, v1) — used for migration */
export interface LegacyRecipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  ingredients: Ingredient[];
  instructions: string[];
  macrosPerServing: MacrosPerServing;
  tags: string[];
  imageUrl?: string;
  userId: string;
  isPublic: boolean;
  createdAt: string;
}

export type RecipeSortBy = 'name' | 'newest' | 'prepTime' | 'calories' | 'protein' | 'bestMatch';

export interface RecipeFilter {
  searchQuery: string;
  tags: string[];
  mealType: string | null;
  favoritesOnly: boolean;
  pantryOnly: boolean;
  /** "Passt zu mir" — exclude recipes containing excluded pantry ingredients (buy_preference='never') */
  fitsMyBasics: boolean;
  maxPrepTime: number | null;
  maxCalories: number | null;
  sortBy: RecipeSortBy;
  /** Allergen filter: exclude recipes containing these allergens */
  excludeAllergens: string[];
  /** Whether allergen filter is active (synced from profile) */
  allergenFilterEnabled: boolean;
  /** Dietary preference filter: e.g. 'vegan', 'vegetarian' */
  dietaryFilter: string[];
  /** Whether dietary filter is active (synced from profile) */
  dietaryFilterEnabled: boolean;
}

export const DEFAULT_RECIPE_FILTER: RecipeFilter = {
  searchQuery: '',
  tags: [],
  mealType: null,
  favoritesOnly: false,
  pantryOnly: false,
  fitsMyBasics: false,
  maxPrepTime: null,
  maxCalories: null,
  sortBy: 'newest',
  excludeAllergens: [],
  allergenFilterEnabled: true,
  dietaryFilter: [],
  dietaryFilterEnabled: true,
};

/** Meal type options for recipes */
export const RECIPE_MEAL_TYPES = [
  'breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout',
] as const;

/** Auto-tags derived from macros */
export function deriveAutoTags(recipe: Pick<Recipe, 'calories_per_serving' | 'protein_per_serving' | 'carbs_per_serving' | 'fat_per_serving' | 'prep_time_min' | 'cook_time_min'>): string[] {
  const tags: string[] = [];
  if (recipe.protein_per_serving >= 30) tags.push('High-Protein');
  if (recipe.carbs_per_serving <= 20) tags.push('Low-Carb');
  if (recipe.fat_per_serving <= 10) tags.push('Low-Fat');
  if (recipe.calories_per_serving <= 300) tags.push('Kalorienarm');
  if ((recipe.prep_time_min + recipe.cook_time_min) <= 15) tags.push('Schnell');
  return tags;
}

/**
 * Maps profile allergen keys (from onboarding) to recipe allergen keys (from detectAllergens).
 * Profile uses English identifiers, recipes use German identifiers.
 */
export const PROFILE_TO_RECIPE_ALLERGEN: Record<string, string[]> = {
  nuts: ['nuesse'],
  peanuts: ['nuesse'],
  gluten: ['gluten'],
  lactose: ['laktose'],
  milk_protein: ['laktose'],
  shellfish: ['krusten'],
  mollusks: ['krusten'],
  soy: ['soja'],
  eggs: ['ei'],
  fructose: ['fruktose'],
  histamine: ['histamin'],
  celery: ['sellerie'],
  mustard: ['senf'],
  sesame: ['sesam'],
  lupins: [],              // no auto-detection pattern yet
  sulfites: [],            // no auto-detection pattern yet
  fish: ['fisch'],
  sorbitol: ['sorbitol'],
  fodmap: ['fodmap'],
  cross_allergy: [],       // context-dependent (raw vs cooked), handled by AI
  salicylate: ['salicylat'],
  nickel_food: ['nickel'],
  alpha_gal: ['alphagal'],
};

/** Convert profile allergen keys to recipe allergen keys for filtering */
export function profileAllergensToRecipeAllergens(profileAllergens: string[]): string[] {
  const result = new Set<string>();
  for (const pa of profileAllergens) {
    const mapped = PROFILE_TO_RECIPE_ALLERGEN[pa];
    if (mapped) {
      for (const ra of mapped) result.add(ra);
    }
  }
  return Array.from(result);
}

/**
 * Dietary preference → recipe filtering rules.
 * Each preference defines allergens to exclude and/or ingredient patterns to check.
 */
export const DIETARY_RECIPE_RULES: Record<string, { excludeAllergens: string[]; excludeIngredientPatterns: RegExp[] }> = {
  vegan: {
    excludeAllergens: ['laktose', 'ei'],
    excludeIngredientPatterns: [
      /fleisch|h[aä]hnchen|h[uü]hn|rind|schwein|pute|lamm|ente|kalb|wild|schinken|speck|wurst|salami|bacon/i,
      /lachs|thunfisch|kabeljau|forelle|hering|sardine|makrele|pangasius|dorade|zander|fisch/i,
      /garnele|shrimp|krebs|hummer|langustine|krabbe/i,
      /milch|joghurt|quark|k[aä]se|sahne|butter|cream|mozzarella|parmesan|gouda|feta|ricotta|whey|molke/i,
      /honig|gelatine/i,
    ],
  },
  vegetarian: {
    excludeAllergens: [],
    excludeIngredientPatterns: [
      /fleisch|h[aä]hnchen|h[uü]hn|rind|schwein|pute|lamm|ente|kalb|wild|schinken|speck|wurst|salami|bacon/i,
      /lachs|thunfisch|kabeljau|forelle|hering|sardine|makrele|pangasius|dorade|zander|fisch/i,
      /garnele|shrimp|krebs|hummer|langustine|krabbe/i,
      /gelatine/i,
    ],
  },
  pescatarian: {
    excludeAllergens: [],
    excludeIngredientPatterns: [
      /fleisch|h[aä]hnchen|h[uü]hn|rind|schwein|pute|lamm|ente|kalb|wild|schinken|speck|wurst|salami|bacon/i,
    ],
  },
  keto: {
    excludeAllergens: [],
    excludeIngredientPatterns: [], // Use macro filter: carbs_per_serving <= 20
  },
  paleo: {
    excludeAllergens: ['gluten', 'laktose'],
    excludeIngredientPatterns: [
      /nudel|pasta|reis|brot|br[oö]tchen|kartoffel|bohne|linse|erbse|erdnuss|soja|tofu|zucker/i,
    ],
  },
  glutenFree: {
    excludeAllergens: ['gluten'],
    excludeIngredientPatterns: [],
  },
  lactoseFree: {
    excludeAllergens: ['laktose'],
    excludeIngredientPatterns: [],
  },
};

/** Check if a recipe matches dietary preferences (returns true if recipe is OK) */
export function recipeFitsDietaryPrefs(recipe: Recipe, dietaryPrefs: string[]): boolean {
  for (const pref of dietaryPrefs) {
    const rules = DIETARY_RECIPE_RULES[pref];
    if (!rules) continue;

    // Check allergen exclusion
    for (const allergen of rules.excludeAllergens) {
      if (recipe.allergens.includes(allergen)) return false;
    }

    // Check ingredient patterns
    for (const pattern of rules.excludeIngredientPatterns) {
      for (const ing of recipe.ingredients) {
        if (pattern.test(ing.name)) return false;
      }
    }

    // Special keto rule: max 20g carbs per serving
    if (pref === 'keto' && recipe.carbs_per_serving > 20) return false;
  }
  return true;
}

/** Known allergens for auto-detection from ingredient names */
const ALLERGEN_PATTERNS: Record<string, RegExp> = {
  gluten: /weizen|mehl|brot|nudel|pasta|semmelbr|paniermehl|hafer|roggen|gerste|dinkel|couscous|bulgur|tortilla/i,
  laktose: /milch|joghurt|quark|kaese|sahne|butter|cream|mozzarella|parmesan|gouda|feta|ricotta/i,
  ei: /\bei(er)?\b|eigelb|eiweiss|meringue/i,
  nuesse: /mandel|haselnuss|walnuss|cashew|pistazie|pekan|macadamia|erdnuss|peanut/i,
  soja: /soja|tofu|edamame|miso|tempeh/i,
  fisch: /lachs|thunfisch|kabeljau|forelle|hering|sardine|makrele|pangasius|dorade|zander|seelachs|scholle|heilbutt|karpfen|barsch|sardelle|anchovis|matjes/i,
  krusten: /garnele|shrimp|krebs|hummer|langustine|krabbe/i,
  sellerie: /sellerie/i,
  senf: /senf|mostrich/i,
  sesam: /sesam|tahini/i,
  // Extended allergens/intolerances (v2.1)
  fruktose: /fruktose|fructose|agavensirup|agavendicksaft|honig|apfeldicksaft|birnendicksaft|maissirup/i,
  histamin: /salami|chorizo|sauerkraut|rotwein|thunfisch|makrele|hering|sardine|parmesan|hartkäse|hefe|sojasosse|balsamico/i,
  sorbitol: /sorbit|zuckerfrei|zuckeralkohol|xylit|maltit|isomalt|erythrit|mannit/i,
  fodmap: /zwiebel|knoblauch|lauch|schalotte|artischocke|blumenkohl|pilz|erbse|bohne|linse|kichererbse|inulin|chicor/i,
  salicylat: /tomate|ketchup|paprika|olive|erdbeere|himbeere|blaubeere|johannisbeere|curry|zimt|kurkuma|oregano|thymian|rosmarin|minze/i,
  nickel: /kakao|schokolade|haferflocke|hirse|buchweizen|linse|spinat|vollkorn|leinsamen|sonnenblumenkern/i,
  alphagal: /rind|schwein|lamm|wild|kalb|innereien|gelatine|schmalz/i,
};

/** Auto-detect allergens from ingredient names */
export function detectAllergens(ingredients: Ingredient[]): string[] {
  const detected = new Set<string>();
  for (const ing of ingredients) {
    for (const [allergen, pattern] of Object.entries(ALLERGEN_PATTERNS)) {
      if (pattern.test(ing.name)) {
        detected.add(allergen);
      }
    }
  }
  return Array.from(detected).sort();
}

/** Convert legacy recipe (localStorage) to new DB format */
export function convertLegacyRecipe(legacy: LegacyRecipe, userId: string): Omit<Recipe, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    title: legacy.name,
    description: legacy.description || '',
    meal_type: null,
    prep_time_min: legacy.prepTime || 0,
    cook_time_min: legacy.cookTime || 0,
    servings: legacy.servings || 1,
    difficulty: 'easy',
    calories_per_serving: legacy.macrosPerServing?.calories || 0,
    protein_per_serving: legacy.macrosPerServing?.protein || 0,
    carbs_per_serving: legacy.macrosPerServing?.carbs || 0,
    fat_per_serving: legacy.macrosPerServing?.fat || 0,
    fiber_per_serving: null,
    sugar_per_serving: null,
    ingredients: legacy.ingredients || [],
    steps: (legacy.instructions || []).map(text => ({ text })),
    tags: legacy.tags || [],
    allergens: detectAllergens(legacy.ingredients || []),
    image_url: legacy.imageUrl || null,
    source_url: null,
    import_method: null,
    is_favorite: false,
    is_public: legacy.isPublic || false,
    fitness_goal: [],
  };
}
