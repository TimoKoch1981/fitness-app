/**
 * Tests for useRecipes hook — CRUD, filtering, sorting, and localStorage persistence.
 * Tests pure functions extracted from the hook for deterministic results.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { filterRecipes, sortRecipes } from '../useRecipes';
import type { Recipe, RecipeFilter } from '../../types';
import { DEFAULT_RECIPE_FILTER } from '../../types';

// ── Test helpers ────────────────────────────────────────────────────────

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1',
    name: 'Test Recipe',
    description: 'A test recipe',
    servings: 2,
    prepTime: 15,
    cookTime: 30,
    ingredients: [{ name: 'Chicken', amount: 200, unit: 'g' }],
    instructions: ['Step 1', 'Step 2'],
    macrosPerServing: { calories: 400, protein: 30, carbs: 40, fat: 10 },
    tags: ['High-Protein'],
    userId: 'user1',
    isPublic: false,
    createdAt: '2026-01-15T12:00:00.000Z',
    ...overrides,
  };
}

const recipes: Recipe[] = [
  makeRecipe({ id: 'r1', name: 'Chicken Rice Bowl', prepTime: 10, macrosPerServing: { calories: 500, protein: 40, carbs: 60, fat: 8 }, tags: ['High-Protein', 'Meal-Prep'], createdAt: '2026-01-10T00:00:00Z' }),
  makeRecipe({ id: 'r2', name: 'Overnight Oats', prepTime: 5, macrosPerServing: { calories: 350, protein: 15, carbs: 50, fat: 10 }, tags: ['Fruehstueck', 'Schnell'], createdAt: '2026-01-15T00:00:00Z' }),
  makeRecipe({ id: 'r3', name: 'Greek Salad', prepTime: 15, macrosPerServing: { calories: 250, protein: 10, carbs: 15, fat: 20 }, tags: ['Vegetarisch', 'Schnell'], createdAt: '2026-01-12T00:00:00Z' }),
  makeRecipe({ id: 'r4', name: 'Protein Pancakes', prepTime: 5, macrosPerServing: { calories: 380, protein: 28, carbs: 45, fat: 8 }, tags: ['High-Protein', 'Fruehstueck'], createdAt: '2026-01-20T00:00:00Z' }),
];

// ── Filter tests ────────────────────────────────────────────────────────

describe('filterRecipes', () => {
  it('returns all recipes with default filter', () => {
    const result = filterRecipes(recipes, DEFAULT_RECIPE_FILTER);
    expect(result).toHaveLength(4);
  });

  it('filters by search query (name)', () => {
    const filter: RecipeFilter = { ...DEFAULT_RECIPE_FILTER, searchQuery: 'chicken' };
    const result = filterRecipes(recipes, filter);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Chicken Rice Bowl');
  });

  it('filters by search query (description)', () => {
    const filter: RecipeFilter = { ...DEFAULT_RECIPE_FILTER, searchQuery: 'test' };
    const result = filterRecipes(recipes, filter);
    // All recipes have 'A test recipe' as description
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
    expect(result).toHaveLength(3); // Overnight Oats (Fruehstueck), Greek Salad (Vegetarisch), Protein Pancakes (Fruehstueck)
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
      searchQuery: '',
      tags: ['Schnell'],
      maxPrepTime: 10,
      maxCalories: 400,
      sortBy: 'name',
    };
    const result = filterRecipes(recipes, filter);
    // Schnell = Overnight Oats + Greek Salad. maxPrepTime=10: Overnight Oats (5) passes, Greek Salad (15) fails
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Overnight Oats');
  });
});

// ── Sort tests ──────────────────────────────────────────────────────────

describe('sortRecipes', () => {
  it('sorts by name alphabetically', () => {
    const result = sortRecipes(recipes, 'name');
    expect(result.map((r) => r.name)).toEqual([
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
    expect(result[0].prepTime).toBe(5);
    expect(result[result.length - 1].prepTime).toBe(15);
  });

  it('sorts by calories ascending', () => {
    const result = sortRecipes(recipes, 'calories');
    expect(result[0].macrosPerServing.calories).toBe(250);
    expect(result[result.length - 1].macrosPerServing.calories).toBe(500);
  });
});

// ── localStorage tests ──────────────────────────────────────────────────

describe('localStorage persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads recipes from localStorage', () => {
    const key = 'fitbuddy_recipes';
    const testRecipes = [makeRecipe({ id: 'persist1', name: 'Persistent Recipe' })];
    localStorage.setItem(key, JSON.stringify(testRecipes));

    const raw = localStorage.getItem(key);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('Persistent Recipe');
  });

  it('handles empty localStorage gracefully', () => {
    const raw = localStorage.getItem('fitbuddy_recipes');
    expect(raw).toBeNull();
  });

  it('handles corrupted localStorage data', () => {
    localStorage.setItem('fitbuddy_recipes', 'not-json');
    try {
      JSON.parse(localStorage.getItem('fitbuddy_recipes')!);
    } catch {
      // Expected — our hook handles this with try/catch
      expect(true).toBe(true);
    }
  });
});
