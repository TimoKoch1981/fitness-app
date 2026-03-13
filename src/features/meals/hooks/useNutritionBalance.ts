/**
 * useNutritionBalance — Combines meal history with BMR/TDEE/workout data
 * to produce per-day energy balance (intake vs expenditure).
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useProfile } from '../../auth/hooks/useProfile';
import { useLatestBodyMeasurement } from '../../body/hooks/useBodyMeasurements';
import { calculateBMR, calculateAge } from '../../../lib/calculations';
import type { MealHistoryData, DaySummary } from './useMealHistory';

export interface DayBalance {
  date: string;
  // Intake
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
  // Expenditure
  bmr: number;
  activityCalories: number;
  workoutCalories: number;
  totalExpenditure: number;
  // Balance
  balance: number;
}

export interface NutritionBalanceData {
  days: DayBalance[];
  averages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    expenditure: number;
    balance: number;
    mealsPerDay: number;
  };
  bmr: number;
  tdee: number;
  hasProfile: boolean;
}

function useWorkoutCaloriesByRange(from: string, to: string) {
  return useQuery({
    queryKey: ['workout_calories_range', from, to],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Map<string, number>();

      const { data, error } = await supabase
        .from('workouts')
        .select('date, calories_burned')
        .eq('user_id', user.id)
        .gte('date', from)
        .lte('date', to)
        .neq('status', 'in_progress');

      if (error) throw error;
      const map = new Map<string, number>();
      for (const w of data ?? []) {
        map.set(w.date, (map.get(w.date) ?? 0) + (w.calories_burned ?? 0));
      }
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useNutritionBalance(
  history: MealHistoryData | undefined,
  from: string,
  to: string,
): NutritionBalanceData | null {
  const { data: profile } = useProfile();
  const { data: latestBody } = useLatestBodyMeasurement();
  const { data: workoutMap } = useWorkoutCaloriesByRange(from, to);

  return useMemo(() => {
    if (!history) return null;

    const hasProfile = !!(profile?.height_cm && profile?.birth_date && latestBody?.weight_kg);

    let bmr = 0;
    let activityCalories = 0;
    let tdee = 0;

    if (hasProfile) {
      const age = calculateAge(profile!.birth_date!);
      const pal = profile!.activity_level ?? 1.55;
      const bmrResult = calculateBMR(
        {
          weight_kg: latestBody!.weight_kg!,
          height_cm: profile!.height_cm!,
          age,
          gender: profile!.gender ?? 'male',
          body_fat_pct: latestBody!.body_fat_pct ?? undefined,
        },
        profile!.preferred_bmr_formula ?? 'auto'
      );
      bmr = bmrResult.bmr;
      activityCalories = Math.round(bmr * (pal - 1));
      tdee = bmr + activityCalories;
    }

    const days: DayBalance[] = history.days.map((day: DaySummary) => {
      const wCal = workoutMap?.get(day.date) ?? 0;
      const totalExp = tdee + wCal;
      return {
        ...day,
        bmr,
        activityCalories,
        workoutCalories: wCal,
        totalExpenditure: totalExp,
        balance: day.calories - totalExp,
      };
    });

    const daysWithData = days.length;
    const avgExpenditure = daysWithData > 0
      ? Math.round(days.reduce((sum, d) => sum + d.totalExpenditure, 0) / daysWithData)
      : 0;
    const avgBalance = daysWithData > 0
      ? Math.round(days.reduce((sum, d) => sum + d.balance, 0) / daysWithData)
      : 0;

    return {
      days,
      averages: {
        calories: history.averages.calories,
        protein: history.averages.protein,
        carbs: history.averages.carbs,
        fat: history.averages.fat,
        expenditure: avgExpenditure,
        balance: avgBalance,
        mealsPerDay: history.averages.mealsPerDay,
      },
      bmr,
      tdee,
      hasProfile,
    };
  }, [history, profile, latestBody, workoutMap]);
}
