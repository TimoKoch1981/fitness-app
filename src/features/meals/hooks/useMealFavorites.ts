/**
 * useMealFavorites — Returns the top-N most frequently logged meals.
 *
 * Queries: SELECT name, calories, protein, carbs, fat, COUNT(*) as freq
 *          FROM meals WHERE user_id = ? GROUP BY name, calories, protein, carbs, fat
 *          ORDER BY freq DESC LIMIT 10
 *
 * Since Supabase doesn't support GROUP BY directly via PostgREST,
 * we fetch recent meals and aggregate client-side.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { MealType } from '../../../types/health';

const FAVORITES_KEY = 'meal_favorites';

export interface MealFavorite {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  type: MealType;
  frequency: number;
}

/**
 * Fetch the top-10 most frequently logged meals for the current user.
 * Aggregated client-side from the last 200 meals.
 */
export function useMealFavorites(limit = 10) {
  return useQuery({
    queryKey: [FAVORITES_KEY, limit],
    queryFn: async (): Promise<MealFavorite[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch the last 200 meals to build frequency map
      const { data, error } = await supabase
        .from('meals')
        .select('name, calories, protein, carbs, fat, type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Group by (name + macros) to deduplicate
      const freqMap = new Map<string, MealFavorite>();
      for (const meal of data) {
        // Key: normalized name + rounded macros (to group similar entries)
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
            type: meal.type as MealType,
            frequency: 1,
          });
        }
      }

      // Sort by frequency descending and take top N
      return Array.from(freqMap.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, limit);
    },
    // Refresh every 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}
