/**
 * Shopping list domain types for FitBuddy.
 * F17: Smart shopping lists generated from recipes minus pantry.
 */

import type { IngredientCategory } from '../pantry/types';

/** DB: shopping_lists */
export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  source_recipe_id: string | null;
  is_active: boolean;
  created_at: string;
  completed_at: string | null;
  /** Joined items (populated via query) */
  items?: ShoppingListItem[];
}

/** DB: shopping_list_items */
export interface ShoppingListItem {
  id: string;
  list_id: string;
  ingredient_name: string;
  ingredient_normalized: string;
  amount: string | null;
  unit: string | null;
  category: IngredientCategory | string;
  is_checked: boolean;
  added_at: string;
}

/** Input for creating a new shopping list item (no id/list_id/added_at) */
export type ShoppingListItemInput = Omit<ShoppingListItem, 'id' | 'list_id' | 'added_at'>;
