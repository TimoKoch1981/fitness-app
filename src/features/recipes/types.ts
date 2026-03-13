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

export type RecipeSortBy = 'name' | 'newest' | 'prepTime' | 'calories' | 'protein';

export interface RecipeFilter {
  searchQuery: string;
  tags: string[];
  mealType: string | null;
  maxPrepTime: number | null;
  maxCalories: number | null;
  sortBy: RecipeSortBy;
}

export const DEFAULT_RECIPE_FILTER: RecipeFilter = {
  searchQuery: '',
  tags: [],
  mealType: null,
  maxPrepTime: null,
  maxCalories: null,
  sortBy: 'newest',
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

/** Known allergens for auto-detection from ingredient names */
const ALLERGEN_PATTERNS: Record<string, RegExp> = {
  gluten: /weizen|mehl|brot|nudel|pasta|semmelbr|paniermehl|hafer|roggen|gerste|dinkel|couscous|bulgur|tortilla/i,
  laktose: /milch|joghurt|quark|kaese|sahne|butter|cream|mozzarella|parmesan|gouda|feta|ricotta/i,
  ei: /\bei(er)?\b|eigelb|eiweiss|meringue/i,
  nuesse: /mandel|haselnuss|walnuss|cashew|pistazie|pekan|macadamia|erdnuss|peanut/i,
  soja: /soja|tofu|edamame|miso|tempeh/i,
  fisch: /lachs|thunfisch|kabeljau|forelle|hering|sardine|makrele|pangasius|dorade|zander/i,
  krusten: /garnele|shrimp|krebs|hummer|langustine|krabbe/i,
  sellerie: /sellerie/i,
  senf: /senf|mostrich/i,
  sesam: /sesam|tahini/i,
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
    is_favorite: false,
    is_public: legacy.isPublic || false,
    fitness_goal: [],
  };
}
