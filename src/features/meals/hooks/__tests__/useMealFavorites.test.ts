/**
 * Tests for meal favorites aggregation logic.
 *
 * Since useMealFavorites uses client-side aggregation,
 * we test the deduplication and frequency counting logic
 * by extracting it into a testable function.
 */

import { describe, it, expect } from 'vitest';
import type { MealType } from '../../../../types/health';

// ── Extracted aggregation logic for testability ──────────────────────────

interface MealRow {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  type: MealType;
}

interface MealFavoriteResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  type: MealType;
  frequency: number;
}

/**
 * Pure function that mirrors the aggregation logic in useMealFavorites.
 * Groups meals by (name + macros), counts frequency, sorts descending, limits.
 */
function aggregateFavorites(meals: MealRow[], limit = 10): MealFavoriteResult[] {
  const freqMap = new Map<string, MealFavoriteResult>();
  for (const meal of meals) {
    const key = `${meal.name.toLowerCase().trim()}|${Math.round(meal.calories)}|${Math.round(meal.protein)}|${Math.round(meal.carbs)}|${Math.round(meal.fat)}`;
    const existing = freqMap.get(key);
    if (existing) {
      existing.frequency++;
    } else {
      freqMap.set(key, {
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        type: meal.type,
        frequency: 1,
      });
    }
  }
  return Array.from(freqMap.values())
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('aggregateFavorites (meal favorites logic)', () => {
  it('returns empty array for no meals', () => {
    expect(aggregateFavorites([])).toEqual([]);
  });

  it('counts frequency of identical meals', () => {
    const meals: MealRow[] = [
      { name: 'Chicken Breast', calories: 350, protein: 40, carbs: 10, fat: 12, type: 'lunch' },
      { name: 'Chicken Breast', calories: 350, protein: 40, carbs: 10, fat: 12, type: 'lunch' },
      { name: 'Chicken Breast', calories: 350, protein: 40, carbs: 10, fat: 12, type: 'lunch' },
      { name: 'Pasta', calories: 500, protein: 15, carbs: 60, fat: 8, type: 'dinner' },
    ];

    const result = aggregateFavorites(meals);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Chicken Breast');
    expect(result[0].frequency).toBe(3);
    expect(result[1].name).toBe('Pasta');
    expect(result[1].frequency).toBe(1);
  });

  it('is case-insensitive for meal names', () => {
    const meals: MealRow[] = [
      { name: 'Chicken Breast', calories: 350, protein: 40, carbs: 10, fat: 12, type: 'lunch' },
      { name: 'chicken breast', calories: 350, protein: 40, carbs: 10, fat: 12, type: 'lunch' },
      { name: 'CHICKEN BREAST', calories: 350, protein: 40, carbs: 10, fat: 12, type: 'lunch' },
    ];

    const result = aggregateFavorites(meals);
    expect(result).toHaveLength(1);
    expect(result[0].frequency).toBe(3);
  });

  it('differentiates meals with different macros', () => {
    const meals: MealRow[] = [
      { name: 'Chicken Breast', calories: 350, protein: 40, carbs: 10, fat: 12, type: 'lunch' },
      { name: 'Chicken Breast', calories: 250, protein: 30, carbs: 5, fat: 8, type: 'lunch' }, // different macros
    ];

    const result = aggregateFavorites(meals);
    expect(result).toHaveLength(2);
  });

  it('sorts by frequency descending', () => {
    const meals: MealRow[] = [
      { name: 'Oatmeal', calories: 300, protein: 10, carbs: 50, fat: 8, type: 'breakfast' },
      { name: 'Steak', calories: 600, protein: 50, carbs: 0, fat: 30, type: 'dinner' },
      { name: 'Steak', calories: 600, protein: 50, carbs: 0, fat: 30, type: 'dinner' },
      { name: 'Oatmeal', calories: 300, protein: 10, carbs: 50, fat: 8, type: 'breakfast' },
      { name: 'Oatmeal', calories: 300, protein: 10, carbs: 50, fat: 8, type: 'breakfast' },
    ];

    const result = aggregateFavorites(meals);
    expect(result[0].name).toBe('Oatmeal');
    expect(result[0].frequency).toBe(3);
    expect(result[1].name).toBe('Steak');
    expect(result[1].frequency).toBe(2);
  });

  it('respects limit parameter', () => {
    const meals: MealRow[] = Array.from({ length: 20 }, (_, i) => ({
      name: `Meal ${i}`,
      calories: 200 + i * 10,
      protein: 10 + i,
      carbs: 20 + i,
      fat: 5 + i,
      type: 'lunch' as MealType,
    }));

    const result = aggregateFavorites(meals, 5);
    expect(result).toHaveLength(5);
  });

  it('trims whitespace in meal names', () => {
    const meals: MealRow[] = [
      { name: '  Chicken Breast  ', calories: 350, protein: 40, carbs: 10, fat: 12, type: 'lunch' },
      { name: 'Chicken Breast', calories: 350, protein: 40, carbs: 10, fat: 12, type: 'lunch' },
    ];

    const result = aggregateFavorites(meals);
    expect(result).toHaveLength(1);
    expect(result[0].frequency).toBe(2);
  });

  it('rounds macros for grouping', () => {
    // Slightly different floats that should round to the same integer
    const meals: MealRow[] = [
      { name: 'Salad', calories: 200.4, protein: 10.3, carbs: 20.7, fat: 5.1, type: 'lunch' },
      { name: 'Salad', calories: 200.1, protein: 10.2, carbs: 20.9, fat: 5.4, type: 'lunch' },
    ];

    const result = aggregateFavorites(meals);
    // Both round to same values: 200, 10, 21, 5
    expect(result).toHaveLength(1);
    expect(result[0].frequency).toBe(2);
  });

  it('preserves original meal name casing', () => {
    const meals: MealRow[] = [
      { name: 'Hahnchenbrust mit Reis', calories: 400, protein: 45, carbs: 40, fat: 8, type: 'lunch' },
      { name: 'hahnchenbrust mit reis', calories: 400, protein: 45, carbs: 40, fat: 8, type: 'lunch' },
    ];

    const result = aggregateFavorites(meals);
    expect(result).toHaveLength(1);
    // Should preserve the name from the first occurrence
    expect(result[0].name).toBe('Hahnchenbrust mit Reis');
  });

  it('preserves meal type from first occurrence', () => {
    const meals: MealRow[] = [
      { name: 'Protein Shake', calories: 200, protein: 30, carbs: 10, fat: 5, type: 'snack' },
      { name: 'Protein Shake', calories: 200, protein: 30, carbs: 10, fat: 5, type: 'breakfast' },
    ];

    const result = aggregateFavorites(meals);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('snack'); // first occurrence wins
  });
});
