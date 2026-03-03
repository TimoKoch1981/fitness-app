/**
 * useWeeklyReport — Client-side hook for generating weekly report data.
 *
 * Queries meals, workouts, body_measurements, and sleep_logs for a date range.
 * Calculates summary statistics client-side (same logic as the edge function).
 * Provides a sendReportEmail() function to call the edge function.
 *
 * @see types.ts for WeeklyReportData shape
 */

import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Meal, Workout, BodyMeasurement, SleepLog } from '../../../types/health';
import type { WeeklyReportData, NutritionSummary, TrainingSummary, BodySummary, SleepSummary, StreakInfo } from '../types';

const WEEKLY_REPORT_KEY = 'weekly-report';

// ── Date Helpers ────────────────────────────────────────────────────

/** Get start/end date strings for the last N days (including today). */
export function getLastNDays(n: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (n - 1));
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

/** Get array of ISO date strings between start and end (inclusive). */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// ── Calculation Functions (exported for testing) ────────────────────

/** Calculate nutrition summary from an array of meals. */
export function calculateNutritionSummary(meals: Meal[], numDays: number): NutritionSummary {
  const totalCalories = meals.reduce((sum, m) => sum + (m.calories ?? 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein ?? 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs ?? 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (m.fat ?? 0), 0);
  const daysTracked = new Set(meals.map(m => m.date)).size;

  return {
    totalMeals: meals.length,
    daysTracked,
    totalCalories,
    avgCaloriesPerDay: numDays > 0 ? Math.round(totalCalories / numDays) : 0,
    avgProteinPerDay: numDays > 0 ? Math.round(totalProtein / numDays) : 0,
    avgCarbsPerDay: numDays > 0 ? Math.round(totalCarbs / numDays) : 0,
    avgFatPerDay: numDays > 0 ? Math.round(totalFat / numDays) : 0,
  };
}

/** Calculate training summary from an array of workouts. */
export function calculateTrainingSummary(workouts: Workout[]): TrainingSummary {
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration_minutes ?? 0), 0);
  const totalBurned = workouts.reduce((sum, w) => sum + (w.calories_burned ?? 0), 0);
  const daysWithWorkouts = new Set(workouts.map(w => w.date)).size;

  return {
    totalWorkouts: workouts.length,
    totalDurationMinutes: totalDuration,
    totalCaloriesBurned: totalBurned,
    daysWithWorkouts,
    avgDurationMinutes: workouts.length > 0 ? Math.round(totalDuration / workouts.length) : 0,
  };
}

/** Calculate body summary from body measurements. */
export function calculateBodySummary(measurements: BodyMeasurement[]): BodySummary {
  const withWeight = measurements.filter(b => b.weight_kg != null);
  if (withWeight.length === 0) {
    return { hasData: false };
  }

  const startWeight = withWeight[0].weight_kg;
  const endWeight = withWeight[withWeight.length - 1].weight_kg;
  const startBodyFat = withWeight[0].body_fat_pct ?? undefined;
  const endBodyFat = withWeight[withWeight.length - 1].body_fat_pct ?? undefined;

  return {
    hasData: true,
    startWeight: startWeight ?? undefined,
    endWeight: endWeight ?? undefined,
    weightChange: startWeight != null && endWeight != null
      ? Math.round((endWeight - startWeight) * 10) / 10
      : undefined,
    startBodyFat,
    endBodyFat,
    bodyFatChange: startBodyFat != null && endBodyFat != null
      ? Math.round((endBodyFat - startBodyFat) * 10) / 10
      : undefined,
  };
}

/** Calculate sleep summary from sleep logs. */
export function calculateSleepSummary(sleepLogs: SleepLog[]): SleepSummary {
  const withDuration = sleepLogs.filter(s => s.duration_minutes != null);
  const totalDuration = withDuration.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
  const withQuality = sleepLogs.filter(s => s.quality != null);
  const totalQuality = withQuality.reduce((sum, s) => sum + (s.quality ?? 0), 0);
  const daysTracked = new Set(sleepLogs.map(s => s.date)).size;

  return {
    totalLogs: sleepLogs.length,
    avgDurationMinutes: withDuration.length > 0 ? Math.round(totalDuration / withDuration.length) : 0,
    avgQuality: withQuality.length > 0 ? Math.round(totalQuality / withQuality.length * 10) / 10 : 0,
    daysTracked,
  };
}

/** Calculate current streak from meal and workout dates, counting backwards from endDate. */
export function calculateStreak(meals: Meal[], workouts: Workout[], endDate: string): StreakInfo {
  const activityDates = new Set([
    ...meals.map(m => m.date),
    ...workouts.map(w => w.date),
  ]);

  let currentStreak = 0;
  const cursor = new Date(endDate);
  while (true) {
    const dateStr = cursor.toISOString().split('T')[0];
    if (activityDates.has(dateStr)) {
      currentStreak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return { currentStreak };
}

// ── Main Hook ───────────────────────────────────────────────────────

interface UseWeeklyReportOptions {
  /** Number of days to include (default: 7) */
  days?: number;
  /** Custom start date (overrides days) */
  startDate?: string;
  /** Custom end date (overrides days) */
  endDate?: string;
}

interface UseWeeklyReportResult {
  report: WeeklyReportData | null;
  isLoading: boolean;
  error: Error | null;
  sendReportEmail: () => Promise<{ html: string } | null>;
}

export function useWeeklyReport(options: UseWeeklyReportOptions = {}): UseWeeklyReportResult {
  const { days = 7 } = options;

  // Compute date range
  const dateRange = useMemo(() => {
    if (options.startDate && options.endDate) {
      return { start: options.startDate, end: options.endDate };
    }
    return getLastNDays(days);
  }, [days, options.startDate, options.endDate]);

  // Fetch all data in one query to minimize re-renders
  const { data: rawData, isLoading, error } = useQuery({
    queryKey: [WEEKLY_REPORT_KEY, dateRange.start, dateRange.end],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [mealsResult, workoutsResult, bodyResult, sleepResult] = await Promise.all([
        supabase
          .from('meals')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', dateRange.start)
          .lte('date', dateRange.end)
          .order('date', { ascending: true }),
        supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', dateRange.start)
          .lte('date', dateRange.end)
          .order('date', { ascending: true }),
        supabase
          .from('body_measurements')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', dateRange.start)
          .lte('date', dateRange.end)
          .order('date', { ascending: true }),
        supabase
          .from('sleep_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', dateRange.start)
          .lte('date', dateRange.end)
          .order('date', { ascending: true }),
      ]);

      if (mealsResult.error) throw mealsResult.error;
      if (workoutsResult.error) throw workoutsResult.error;
      if (bodyResult.error) throw bodyResult.error;
      if (sleepResult.error) throw sleepResult.error;

      return {
        meals: (mealsResult.data ?? []) as Meal[],
        workouts: (workoutsResult.data ?? []) as Workout[],
        bodyMeasurements: (bodyResult.data ?? []) as BodyMeasurement[],
        sleepLogs: (sleepResult.data ?? []) as SleepLog[],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Calculate report from raw data
  const report = useMemo<WeeklyReportData | null>(() => {
    if (!rawData) return null;

    const numDays = getDateRange(dateRange.start, dateRange.end).length;

    return {
      startDate: dateRange.start,
      endDate: dateRange.end,
      nutrition: calculateNutritionSummary(rawData.meals, numDays),
      training: calculateTrainingSummary(rawData.workouts),
      body: calculateBodySummary(rawData.bodyMeasurements),
      sleep: calculateSleepSummary(rawData.sleepLogs),
      streak: calculateStreak(rawData.meals, rawData.workouts, dateRange.end),
    };
  }, [rawData, dateRange]);

  // Send report email via edge function
  const sendReportEmail = useCallback(async (): Promise<{ html: string } | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
    const response = await fetch(`${supabaseUrl}/functions/v1/weekly-report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_date: dateRange.start,
        end_date: dateRange.end,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? `HTTP ${response.status}`);
    }

    return await response.json() as { html: string };
  }, [dateRange]);

  return {
    report,
    isLoading,
    error: error as Error | null,
    sendReportEmail,
  };
}
