/**
 * Pantry Matcher — matches recipe ingredients against user's pantry.
 *
 * Uses bidirectional normalized substring matching to handle
 * compound names, plurals, and umlaut variations.
 */

import type { Recipe } from '../../recipes/types';
import type { PantryItem } from '../types';
import { normalizeIngredient } from '../types';

export interface PantryMatchResult {
  /** Ingredient names that are in the pantry */
  matched: string[];
  /** Ingredient names that are missing */
  missing: string[];
  /** Match percentage (0-100) */
  matchPercent: number;
}

/**
 * Match a single recipe's ingredients against the user's pantry.
 *
 * Matching strategy:
 * 1. Normalize both recipe ingredient names and pantry ingredient names
 * 2. Bidirectional substring check (handles "Hühnerbrust" ↔ "Hähnchenbrustfilet")
 * 3. Items with buy_preference='always' count as available (staples like salt, oil)
 */
export function matchRecipeAgainstPantry(
  recipe: Recipe,
  pantryItems: PantryItem[],
): PantryMatchResult {
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return { matched: [], missing: [], matchPercent: 100 };
  }

  // Build normalized pantry lookup (includes items with status 'available' or 'low')
  // Items with buy_preference='always' are always considered "available"
  const pantryNormalized = pantryItems
    .filter((p) => p.status !== 'empty' || p.buy_preference === 'always')
    .map((p) => p.ingredient_normalized);

  const matched: string[] = [];
  const missing: string[] = [];

  for (const ingredient of recipe.ingredients) {
    const normName = normalizeIngredient(ingredient.name);

    // Skip very short/generic names (e.g., "Salz", "Pfeffer", "Wasser")
    if (isBasicIngredient(normName)) {
      matched.push(ingredient.name);
      continue;
    }

    const found = pantryNormalized.some(
      (pn) => pn.includes(normName) || normName.includes(pn),
    );

    if (found) {
      matched.push(ingredient.name);
    } else {
      missing.push(ingredient.name);
    }
  }

  const total = recipe.ingredients.length;
  const matchPercent = total > 0 ? Math.round((matched.length / total) * 100) : 100;

  return { matched, missing, matchPercent };
}

/**
 * Batch-compute pantry match for all recipes.
 * Returns a Map<recipeId, PantryMatchResult>.
 */
export function computePantryMatchMap(
  recipes: Recipe[],
  pantryItems: PantryItem[],
): Map<string, PantryMatchResult> {
  const map = new Map<string, PantryMatchResult>();
  for (const recipe of recipes) {
    map.set(recipe.id, matchRecipeAgainstPantry(recipe, pantryItems));
  }
  return map;
}

/**
 * Sort recipes by pantry match percentage (descending).
 */
export function sortByPantryMatch(
  recipes: Recipe[],
  pantryItems: PantryItem[],
): Recipe[] {
  const matchMap = computePantryMatchMap(recipes, pantryItems);
  return [...recipes].sort((a, b) => {
    const ma = matchMap.get(a.id)?.matchPercent ?? 0;
    const mb = matchMap.get(b.id)?.matchPercent ?? 0;
    return mb - ma;
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────

/** Basic ingredients that virtually everyone has */
const BASIC_INGREDIENTS = new Set([
  'salz', 'pfeffer', 'wasser', 'salt', 'pepper', 'water',
  'schwarzer pfeffer', 'meersalz', 'leitungswasser',
]);

function isBasicIngredient(normalizedName: string): boolean {
  return BASIC_INGREDIENTS.has(normalizedName);
}
