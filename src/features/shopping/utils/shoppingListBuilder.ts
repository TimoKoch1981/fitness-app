/**
 * Shopping List Builder — generates shopping items from recipe minus pantry.
 * Uses pantryMatcher from F16 for ingredient subtraction.
 */

import type { Recipe } from '../../recipes/types';
import type { PantryItem } from '../../pantry/types';
import type { ShoppingListItemInput } from '../types';
import { normalizeIngredient } from '../../pantry/types';
import { matchRecipeAgainstPantry } from '../../pantry/utils/pantryMatcher';

/**
 * Build a shopping list from a recipe, subtracting pantry items.
 * Only missing ingredients are included.
 *
 * @param recipe The recipe to shop for
 * @param pantryItems Current pantry items (optional — if empty, all ingredients included)
 * @param servingsMultiplier Scale factor for amounts (default 1)
 */
export function buildShoppingListFromRecipe(
  recipe: Recipe,
  pantryItems: PantryItem[] = [],
  servingsMultiplier = 1,
): ShoppingListItemInput[] {
  if (!recipe.ingredients || recipe.ingredients.length === 0) return [];

  // Get missing ingredients from pantry matcher
  const match = pantryItems.length > 0
    ? matchRecipeAgainstPantry(recipe, pantryItems)
    : { matched: [], missing: recipe.ingredients.map((i) => i.name), matchPercent: 0 };

  const missingSet = new Set(match.missing);

  return recipe.ingredients
    .filter((ing) => missingSet.has(ing.name))
    .map((ing) => {
      const scaledAmount = Math.round(ing.amount * servingsMultiplier * 10) / 10;
      const normalized = normalizeIngredient(ing.name);

      // Try to determine category from pantry items or catalog
      const category = lookupCategory(normalized, pantryItems);

      return {
        ingredient_name: ing.name,
        ingredient_normalized: normalized,
        amount: scaledAmount > 0 ? String(scaledAmount) : null,
        unit: ing.unit || null,
        category,
        is_checked: false,
      };
    });
}

/**
 * Try to find the category for an ingredient by looking at pantry items.
 * Falls back to 'sonstiges' if no match found.
 */
function lookupCategory(normalizedName: string, pantryItems: PantryItem[]): string {
  // Check if any pantry item partially matches
  for (const p of pantryItems) {
    if (
      p.ingredient_normalized.includes(normalizedName) ||
      normalizedName.includes(p.ingredient_normalized)
    ) {
      return p.category;
    }
  }
  return 'sonstiges';
}

/**
 * Generate clipboard-friendly text for a shopping list.
 */
export function shoppingListToClipboardText(
  name: string,
  items: { ingredient_name: string; amount: string | null; unit: string | null; category: string; is_checked: boolean }[],
): string {
  const lines: string[] = [`🛒 ${name}`, '───────────'];

  // Group by category
  const grouped = new Map<string, typeof items>();
  for (const item of items) {
    const list = grouped.get(item.category) ?? [];
    list.push(item);
    grouped.set(item.category, list);
  }

  for (const [, catItems] of grouped) {
    for (const item of catItems) {
      const check = item.is_checked ? '✓' : '☐';
      const qty = item.amount && item.unit
        ? `${item.amount} ${item.unit} `
        : item.amount
        ? `${item.amount} `
        : '';
      lines.push(`${check} ${qty}${item.ingredient_name}`);
    }
  }

  return lines.join('\n');
}
