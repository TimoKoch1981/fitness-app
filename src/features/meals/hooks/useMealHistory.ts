/**
 * useMealHistory — Fetches meal data for a date range,
 * grouped by date with daily totals and period averages.
 *
 * Supports two call patterns:
 *   useMealHistory(7)            — last N days (legacy)
 *   useMealHistory({ from, to }) — explicit date range
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { today } from '../../../lib/utils';

const MEAL_HISTORY_KEY = 'meal_history';

export interface DaySummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
}

export interface MealHistoryData {
  days: DaySummary[];
  averages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    mealsPerDay: number;
  };
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  daysWithData: number;
}

function getDateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const EMPTY_RESULT: MealHistoryData = {
  days: [],
  averages: { calories: 0, protein: 0, carbs: 0, fat: 0, mealsPerDay: 0 },
  totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  daysWithData: 0,
};

type MealHistoryInput = number | { from: string; to: string };

export function useMealHistory(input: MealHistoryInput = 7) {
  const fromDate = typeof input === 'number' ? getDateNDaysAgo(input) : input.from;
  const toDate = typeof input === 'number' ? today() : input.to;
  const cacheKey = typeof input === 'number' ? input : `${input.from}_${input.to}`;

  return useQuery({
    queryKey: [MEAL_HISTORY_KEY, cacheKey],
    queryFn: async (): Promise<MealHistoryData> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return EMPTY_RESULT;

      const { data, error } = await supabase
        .from('meals')
        .select('date, calories, protein, carbs, fat')
        .eq('user_id', user.id)
        .gte('date', fromDate)
        .lte('date', toDate)
        .order('date', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return EMPTY_RESULT;

      // Group by date
      const dayMap = new Map<string, DaySummary>();
      for (const meal of data) {
        const existing = dayMap.get(meal.date);
        if (existing) {
          existing.calories += meal.calories ?? 0;
          existing.protein += meal.protein ?? 0;
          existing.carbs += meal.carbs ?? 0;
          existing.fat += meal.fat ?? 0;
          existing.mealCount++;
        } else {
          dayMap.set(meal.date, {
            date: meal.date,
            calories: meal.calories ?? 0,
            protein: meal.protein ?? 0,
            carbs: meal.carbs ?? 0,
            fat: meal.fat ?? 0,
            mealCount: 1,
          });
        }
      }

      const daySummaries = Array.from(dayMap.values()).sort((a, b) => b.date.localeCompare(a.date));
      const daysWithData = daySummaries.length;

      const totals = daySummaries.reduce(
        (acc, d) => ({
          calories: acc.calories + d.calories,
          protein: acc.protein + d.protein,
          carbs: acc.carbs + d.carbs,
          fat: acc.fat + d.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      const totalMeals = daySummaries.reduce((sum, d) => sum + d.mealCount, 0);

      const averages = daysWithData > 0
        ? {
            calories: Math.round(totals.calories / daysWithData),
            protein: Math.round(totals.protein / daysWithData),
            carbs: Math.round(totals.carbs / daysWithData),
            fat: Math.round(totals.fat / daysWithData),
            mealsPerDay: Math.round((totalMeals / daysWithData) * 10) / 10,
          }
        : { calories: 0, protein: 0, carbs: 0, fat: 0, mealsPerDay: 0 };

      return { days: daySummaries, averages, totals, daysWithData };
    },
    staleTime: 5 * 60 * 1000,
  });
}
