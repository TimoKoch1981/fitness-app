/**
 * Recipe domain types for the FitBuddy recipe database.
 * Client-side only (localStorage) — no DB migration needed.
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

export interface MacrosPerServing {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  prepTime: number; // minutes
  cookTime: number; // minutes
  ingredients: Ingredient[];
  instructions: string[];
  macrosPerServing: MacrosPerServing;
  tags: string[];
  imageUrl?: string;
  userId: string;
  isPublic: boolean;
  createdAt: string; // ISO date
}

export type RecipeSortBy = 'name' | 'newest' | 'prepTime' | 'calories';

export interface RecipeFilter {
  searchQuery: string;
  tags: string[];
  maxPrepTime: number | null;
  maxCalories: number | null;
  sortBy: RecipeSortBy;
}

export const DEFAULT_RECIPE_FILTER: RecipeFilter = {
  searchQuery: '',
  tags: [],
  maxPrepTime: null,
  maxCalories: null,
  sortBy: 'newest',
};
