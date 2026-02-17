import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { today } from '../../../lib/utils';
import type { Meal, MealType, DataSource } from '../../../types/health';

const MEALS_KEY = 'meals';

// === QUERIES ===

/**
 * Fetch meals for a specific date (default: today).
 */
export function useMealsByDate(date: string = today()) {
  return useQuery({
    queryKey: [MEALS_KEY, date],
    queryFn: async (): Promise<Meal[]> => {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Fetch daily meal totals for a date.
 */
export function useDailyMealTotals(date: string = today()) {
  const { data: meals, ...rest } = useMealsByDate(date);

  const totals = useMemo(() => {
    const result = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      mealCount: 0,
    };

    if (meals) {
      meals.forEach((meal) => {
        result.calories += meal.calories ?? 0;
        result.protein += meal.protein ?? 0;
        result.carbs += meal.carbs ?? 0;
        result.fat += meal.fat ?? 0;
        result.fiber += (meal.fiber ?? 0);
        result.mealCount++;
      });
    }

    return result;
  }, [meals]);

  return { totals, meals, ...rest };
}

// === MUTATIONS ===

interface AddMealInput {
  date?: string;
  name: string;
  type: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  source?: DataSource;
  source_ref?: string;
}

export function useAddMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddMealInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          date: input.date ?? today(),
          name: input.name,
          type: input.type,
          calories: input.calories,
          protein: input.protein,
          carbs: input.carbs,
          fat: input.fat,
          fiber: input.fiber,
          source: input.source ?? 'manual',
          source_ref: input.source_ref,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Meal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [MEALS_KEY, data.date] });
    },
  });
}

export function useUpdateMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Meal> & { id: string }) => {
      const { data, error } = await supabase
        .from('meals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Meal;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [MEALS_KEY, data.date] });
    },
  });
}

export function useDeleteMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      const { error } = await supabase.from('meals').delete().eq('id', id);
      if (error) throw error;
      return { id, date };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [MEALS_KEY, data.date] });
    },
  });
}
