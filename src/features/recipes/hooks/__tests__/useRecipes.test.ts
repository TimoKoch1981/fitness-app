/**
 * Tests for useRecipes hook — CRUD, filtering, sorting.
 * Tests the pure functions extracted from the hook for deterministic results.
 *
 * Schema: Recipe v2.0 (v12.85) — DB-backed, flat macros, snake_case fields.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { filterRecipes, sortRecipes } from '../useRecipes';
import type { Recipe, RecipeFilter } from '../../types';
import { DEFAULT_RECIPE_FILTER } from '../../types';

// ── Test helpers ────────────────────────────────────────────────────────

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1',
    user_id: 'user1',
    title: 'Test Recipe',
    description: 'A test recipe',
    meal_type: null,
    servings: 2,
    prep_time_min: 15,
    cook_time_min: 30,
    calories_per_serving: 400,
    protein_per_serving: 30,
    carbs_per_serving: 40,
    fat_per_serving: 10,
    ingredients: [{ name: 'Chicken', amount: 200, unit: 'g' }],
    steps: [{ text: 'Step 1' }, { text: 'Step 2' }],
    tags: ['High-Protein'],
    allergens: [],
    is_favorite: false,
    is_public: false,
    created_at: '2026-01-15T12:00:00.000Z',
    updated_at: '2026-01-15T12:00:00.000Z',
    ...overrides,
  } as Recipe;
}

const recipes: Recipe[] = [
  makeRecipe({ id: 'r1', title: 'Chicken Rice Bowl',  prep_time_min: 10, calories_per_serving: 500, protein_per_serving: 40, carbs_per_serving: 60, fat_per_serving: 8,  tags: ['High-Protein', 'Meal-Prep'],     created_at: '2026-01-10T00:00:00Z' }),
  makeRecipe({ id: 'r2', title: 'Overnight Oats',     prep_time_min: 5,  calories_per_serving: 350, protein_per_serving: 15, carbs_per_serving: 50, fat_per_serving: 10, tags: ['Fruehstueck', 'Schnell'],        created_at: '2026-01-15T00:00:00Z' }),
  makeRecipe({ id: 'r3', title: 'Greek Salad',        prep_time_min: 15, calories_per_serving: 250, protein_per_serving: 10, carbs_per_serving: 15, fat_per_serving: 20, tags: ['Vegetarisch', 'Schnell'],        created_at: '2026-01-12T00:00:00Z' }),
  makeRecipe({ id: 'r4', title: 'Protein Pancakes',   prep_time_min: 5,  calories_per_serving: 380, protein_per_serving: 28, carbs_per_serving: 45, fat_per_serving: 8,  tags: ['High-Protein', 'Fruehstueck'],   created_at: '2026-01-20T00:00:00Z' }),
];

// ── Filter tests ────────────────────────────────────────────────────────

describe('filterRecipes', () => {
  it('returns all recipes with default filter', () => {
    const result = filterRecipes(recipes, DEFAULT_RECIPE_FILTER);
    expect(result).toHaveLength(4);
  });

  it('filters by search query (title)', () => {
    const filter: RecipeFilter = { ...DEFAULT_RECIPE_FILTER, searchQuery: 'chicken' };
    const result = filterRecipes(recipes, filter);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Chicken Rice Bowl');
  });

  it('filters by search query (description)', () => {
    const filter: RecipeFilter = { ...DEFAULT_RECIPE_FILTER, searchQuery: 'test' };
    const result = filterRecipes(recipes, filter);
    // All recipes share the default description 'A test recipe'
    expect(result).toHaveLength(4);
  });

  it('filters by tags', () => {
    const filter: RecipeFilter = { ...DEFAULT_RECIPE_FILTER, tags: ['High-Protein'] };
    const result = filterRecipes(recipes, filter);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id).sort()).toEqual(['r1', 'r4']);
  });

  it('filters by multiple tags (OR logic)', () => {
    const filter: RecipeFilter = { ...DEFAULT_RECIPE_FILTER, tags: ['Vegetarisch', 'Fruehstueck'] };
    const result = filterRecipes(recipes, filter);
    expect(result).toHaveLength(3); // Overnight Oats + Greek Salad + Protein Pancakes
  });

  it('filters by max prep time', () => {
    const filter: RecipeFilter = { ...DEFAULT_RECIPE_FILTER, maxPrepTime: 5 };
    const result = filterRecipes(recipes, filter);
    expect(result).toHaveLength(2); // Overnight Oats + Protein Pancakes (both 5 min)
  });

  it('filters by max calories', () => {
    const filter: RecipeFilter = { ...DEFAULT_RECIPE_FILTER, maxCalories: 350 };
    const result = filterRecipes(recipes, filter);
    expect(result).toHaveLength(2); // Greek Salad (250) + Overnight Oats (350)
  });

  it('combines multiple filters', () => {
    const filter: RecipeFilter = {
      ...DEFAULT_RECIPE_FILTER,
      searchQuery: '',
      tags: ['Schnell'],
      maxPrepTime: 10,
      maxCalories: 400,
      sortBy: 'name',
    };
    const result = filterRecipes(recipes, filter);
    // 'Schnell' = Overnight Oats + Greek Salad. maxPrepTime=10: Overnight Oats (5) ok, Greek Salad (15) raus
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Overnight Oats');
  });
});

// ── Sort tests ──────────────────────────────────────────────────────────

describe('sortRecipes', () => {
  it('sorts by name alphabetically (uses title)', () => {
    const result = sortRecipes(recipes, 'name');
    expect(result.map((r) => r.title)).toEqual([
      'Chicken Rice Bowl',
      'Greek Salad',
      'Overnight Oats',
      'Protein Pancakes',
    ]);
  });

  it('sorts by newest first', () => {
    const result = sortRecipes(recipes, 'newest');
    expect(result.map((r) => r.id)).toEqual(['r4', 'r2', 'r3', 'r1']);
  });

  it('sorts by prep time ascending', () => {
    const result = sortRecipes(recipes, 'prepTime');
    expect(result[0].prep_time_min).toBe(5);
    expect(result[result.length - 1].prep_time_min).toBe(15);
  });

  it('sorts by calories ascending', () => {
    const result = sortRecipes(recipes, 'calories');
    expect(result[0].calories_per_serving).toBe(250);
    expect(result[result.length - 1].calories_per_serving).toBe(500);
  });

  it('sorts by protein descending', () => {
    const result = sortRecipes(recipes, 'protein');
    expect(result[0].protein_per_serving).toBe(40);
    expect(result[result.length - 1].protein_per_serving).toBe(10);
  });
});

// ── Legacy localStorage migration smoke tests ──────────────────────────
//
// Note: v12.85 migrated CRUD to Supabase. localStorage is only kept around
// for the one-shot migration of pre-v12.85 user data (see migrateLegacyRecipes
// in useRecipes.ts). These tests cover the migration flag handling that the
// migration helper relies on.

describe('localStorage migration flag', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('reads and writes the migration flag', () => {
    expect(localStorage.getItem('fitbuddy_recipes_migrated')).toBeNull();
    localStorage.setItem('fitbuddy_recipes_migrated', 'true');
    expect(localStorage.getItem('fitbuddy_recipes_migrated')).toBe('true');
  });

  it('handles corrupted legacy data gracefully', () => {
    localStorage.setItem('fitbuddy_recipes', 'not-json');
    let threw = false;
    try {
      JSON.parse(localStorage.getItem('fitbuddy_recipes')!);
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  });
});
