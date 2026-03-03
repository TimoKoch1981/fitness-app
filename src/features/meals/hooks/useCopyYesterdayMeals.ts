/**
 * useCopyYesterdayMeals — Copies all meals from a previous day to today.
 *
 * Loads meals from the last logged day (or yesterday), then creates
 * new meal entries with today's date and the same macro values.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { today } from '../../../lib/utils';
import type { Meal } from '../../../types/health';

const MEALS_KEY = 'meals';

interface CopyResult {
  copiedCount: number;
}

/**
 * Mutation that copies all meals from a source date to today.
 * If no sourceDate is provided, uses yesterday.
 */
export function useCopyYesterdayMeals() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceDate?: string): Promise<CopyResult> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const targetDate = today();

      // If no source date provided, find the most recent day with meals
      let actualSourceDate = sourceDate;
      if (!actualSourceDate) {
        const { data: recentMeals, error: searchError } = await supabase
          .from('meals')
          .select('date')
          .eq('user_id', user.id)
          .lt('date', targetDate)
          .order('date', { ascending: false })
          .limit(1);

        if (searchError) throw searchError;
        if (!recentMeals || recentMeals.length === 0) {
          return { copiedCount: 0 };
        }
        actualSourceDate = recentMeals[0].date;
      }

      // Fetch all meals from the source date
      const { data: sourceMeals, error: fetchError } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', actualSourceDate)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      if (!sourceMeals || sourceMeals.length === 0) {
        return { copiedCount: 0 };
      }

      // Create new meals with today's date
      const newMeals = sourceMeals.map((meal: Meal) => ({
        user_id: user.id,
        date: targetDate,
        name: meal.name,
        type: meal.type,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        fiber: meal.fiber,
        source: 'manual' as const,
      }));

      const { error: insertError } = await supabase
        .from('meals')
        .insert(newMeals);

      if (insertError) throw insertError;

      return { copiedCount: newMeals.length };
    },
    onSuccess: () => {
      // Invalidate today's meals to refresh the list
      queryClient.invalidateQueries({ queryKey: [MEALS_KEY, today()] });
    },
  });
}
