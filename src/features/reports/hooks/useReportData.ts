/**
 * Report Data Hooks — Aggregated data for date ranges.
 *
 * Fetches meals, workouts, body measurements, and blood pressure
 * for a given date range and aggregates them for chart consumption.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Meal, Workout, BodyMeasurement, BloodPressure } from '../../../types/health';
import { useProfile } from '../../auth/hooks/useProfile';
import { calculateBMR, calculateAge } from '../../../lib/calculations/bmr';
import { calculateTDEE_PAL } from '../../../lib/calculations/tdee';

const REPORT_KEY = 'reports';

// ── Helper: Generate array of date strings for a range ───────────────

function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/** Get start/end dates for "last N days" (including today) */
export function getLastNDays(n: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (n - 1));
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

// ── Daily Nutrition Aggregation ──────────────────────────────────────

export interface DailyNutrition {
  date: string;
  /** Short label for chart x-axis (e.g. "Mo", "Di") */
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
}

export function useMealsForRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [REPORT_KEY, 'meals', startDate, endDate],
    queryFn: async (): Promise<DailyNutrition[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;

      const meals = (data ?? []) as Meal[];
      const dates = getDateRange(startDate, endDate);

      // Aggregate per day
      return dates.map((date) => {
        const dayMeals = meals.filter((m) => m.date === date);
        const d = new Date(date);
        const label = d.toLocaleDateString('de-DE', { weekday: 'short' });
        return {
          date,
          label,
          calories: dayMeals.reduce((sum, m) => sum + (m.calories ?? 0), 0),
          protein: dayMeals.reduce((sum, m) => sum + (m.protein ?? 0), 0),
          carbs: dayMeals.reduce((sum, m) => sum + (m.carbs ?? 0), 0),
          fat: dayMeals.reduce((sum, m) => sum + (m.fat ?? 0), 0),
          mealCount: dayMeals.length,
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ── Daily Workout Aggregation ────────────────────────────────────────

export interface DailyWorkout {
  date: string;
  label: string;
  workoutCount: number;
  totalDuration: number;
  totalCalories: number;
}

export function useWorkoutsForRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [REPORT_KEY, 'workouts', startDate, endDate],
    queryFn: async (): Promise<DailyWorkout[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;

      const workouts = (data ?? []) as Workout[];
      const dates = getDateRange(startDate, endDate);

      return dates.map((date) => {
        const dayWorkouts = workouts.filter((w) => w.date === date);
        const d = new Date(date);
        return {
          date,
          label: d.toLocaleDateString('de-DE', { weekday: 'short' }),
          workoutCount: dayWorkouts.length,
          totalDuration: dayWorkouts.reduce((sum, w) => sum + (w.duration_minutes ?? 0), 0),
          totalCalories: dayWorkouts.reduce((sum, w) => sum + (w.calories_burned ?? 0), 0),
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Body Measurement Trend ───────────────────────────────────────────

export interface BodyDataPoint {
  date: string;
  label: string;
  weight_kg?: number;
  body_fat_pct?: number;
  muscle_mass_kg?: number;
}

export function useBodyTrend(limit = 30) {
  return useQuery({
    queryKey: [REPORT_KEY, 'body', limit],
    queryFn: async (): Promise<BodyDataPoint[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('body_measurements')
        .select('date, weight_kg, body_fat_pct, muscle_mass_kg')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return ((data ?? []) as BodyMeasurement[]).map((b) => ({
        date: b.date,
        label: new Date(b.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        weight_kg: b.weight_kg ?? undefined,
        body_fat_pct: b.body_fat_pct ?? undefined,
        muscle_mass_kg: b.muscle_mass_kg ?? undefined,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Blood Pressure Trend ─────────────────────────────────────────────

export interface BPDataPoint {
  date: string;
  time: string;
  label: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
}

export function useBloodPressureTrend(limit = 30) {
  return useQuery({
    queryKey: [REPORT_KEY, 'bp', limit],
    queryFn: async (): Promise<BPDataPoint[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('blood_pressure_logs')
        .select('date, time, systolic, diastolic, pulse')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return ((data ?? []) as BloodPressure[]).map((bp) => ({
        date: bp.date,
        time: bp.time,
        label: new Date(bp.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
        systolic: bp.systolic,
        diastolic: bp.diastolic,
        pulse: bp.pulse ?? undefined,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ── Calorie Balance (Intake vs Expenditure) ─────────────────────────

export interface DailyBalance {
  date: string;
  /** Short label for chart x-axis */
  label: string;
  /** Total calories consumed */
  intake: number;
  /** Workout calories burned */
  burned: number;
  /** TDEE = BMR × PAL factor */
  tdee: number;
  /** User's calorie goal from profile */
  goal: number;
  /** intake - tdee (negative = deficit) */
  netBalance: number;
  mealCount: number;
  workoutCount: number;
}

/**
 * Combined hook: Fetches meals + workouts for a date range and
 * merges with profile-based TDEE to produce a daily calorie balance.
 */
export function useBalanceForRange(startDate: string, endDate: string) {
  const { data: profile } = useProfile();

  // Compute TDEE from profile (or 0 if profile incomplete)
  let dailyTDEE = 0;
  const dailyGoal = profile?.daily_calories_goal ?? 0;

  if (profile?.height_cm && profile?.birth_date && profile?.gender) {
    // We need current weight — fetch latest body measurement
    // For now, use a reasonable approach: compute from profile data
    const age = calculateAge(profile.birth_date);
    const palFactor = profile.activity_level ?? 1.55;

    // BMR needs weight — we'll fetch it inside the query
    // But we can pre-compute if we have the data
    const bmrResult = calculateBMR(
      {
        weight_kg: 90, // Fallback, will be overridden in query
        height_cm: profile.height_cm,
        age,
        gender: profile.gender,
      },
      profile.preferred_bmr_formula ?? 'auto'
    );
    dailyTDEE = calculateTDEE_PAL(bmrResult.bmr, palFactor);
  }

  return useQuery({
    queryKey: [REPORT_KEY, 'balance', startDate, endDate, dailyTDEE, dailyGoal],
    queryFn: async (): Promise<DailyBalance[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch meals + workouts + latest weight in parallel
      const [mealsResult, workoutsResult, weightResult] = await Promise.all([
        supabase
          .from('meals')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true }),
        supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true }),
        supabase
          .from('body_measurements')
          .select('weight_kg, body_fat_pct')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(1),
      ]);

      if (mealsResult.error) throw mealsResult.error;
      if (workoutsResult.error) throw workoutsResult.error;

      const meals = (mealsResult.data ?? []) as Meal[];
      const workouts = (workoutsResult.data ?? []) as Workout[];

      // Recalculate TDEE with actual weight if available
      let computedTDEE = dailyTDEE;
      const latestWeight = weightResult.data?.[0];
      if (profile?.height_cm && profile?.birth_date && profile?.gender && latestWeight?.weight_kg) {
        const age = calculateAge(profile.birth_date);
        const palFactor = profile.activity_level ?? 1.55;
        const bmrResult = calculateBMR(
          {
            weight_kg: latestWeight.weight_kg,
            height_cm: profile.height_cm,
            age,
            gender: profile.gender,
            body_fat_pct: latestWeight.body_fat_pct ?? undefined,
          },
          profile.preferred_bmr_formula ?? 'auto'
        );
        computedTDEE = calculateTDEE_PAL(bmrResult.bmr, palFactor);
      }

      const dates = getDateRange(startDate, endDate);

      return dates.map((date) => {
        const dayMeals = meals.filter((m) => m.date === date);
        const dayWorkouts = workouts.filter((w) => w.date === date);
        const d = new Date(date);
        const intake = dayMeals.reduce((sum, m) => sum + (m.calories ?? 0), 0);

        return {
          date,
          label: d.toLocaleDateString('de-DE', { weekday: 'short' }),
          intake,
          burned: dayWorkouts.reduce((sum, w) => sum + (w.calories_burned ?? 0), 0),
          tdee: computedTDEE,
          goal: dailyGoal,
          netBalance: intake - computedTDEE,
          mealCount: dayMeals.length,
          workoutCount: dayWorkouts.length,
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}
