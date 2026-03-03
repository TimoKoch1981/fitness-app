/**
 * useStreaks — Computes streak data from existing DB tables.
 *
 * A "streak day" is any day where the user logged at least one of:
 * meal, workout, body measurement, or water (via localStorage).
 *
 * Queries the last 90 days of data from Supabase.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { StreakData } from '../types';

const GAMIFICATION_KEY = 'gamification';
const LOOKBACK_DAYS = 90;

/** Returns YYYY-MM-DD string for N days ago. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/** Returns today as YYYY-MM-DD. */
function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Given a sorted array (ascending) of YYYY-MM-DD date strings,
 * computes the current streak (consecutive days ending today or yesterday),
 * the longest streak, and total active days.
 *
 * Exported for testing.
 */
export function computeStreaks(activeDates: string[]): Omit<StreakData, 'isLoading'> {
  if (activeDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
  }

  // Deduplicate and sort ascending
  const unique = [...new Set(activeDates)].sort();
  const totalActiveDays = unique.length;

  // Helper: diff in calendar days between two YYYY-MM-DD strings
  const diffDays = (a: string, b: string): number => {
    const da = new Date(a + 'T00:00:00');
    const db = new Date(b + 'T00:00:00');
    return Math.round((db.getTime() - da.getTime()) / 86_400_000);
  };

  // Walk through sorted dates and find streaks
  let longestStreak = 1;
  let currentRun = 1;
  const streaks: { start: number; length: number }[] = [];
  let streakStart = 0;

  for (let i = 1; i < unique.length; i++) {
    if (diffDays(unique[i - 1], unique[i]) === 1) {
      currentRun++;
    } else {
      streaks.push({ start: streakStart, length: currentRun });
      if (currentRun > longestStreak) longestStreak = currentRun;
      currentRun = 1;
      streakStart = i;
    }
  }
  // Final run
  streaks.push({ start: streakStart, length: currentRun });
  if (currentRun > longestStreak) longestStreak = currentRun;

  // Current streak: the last run must include today or yesterday
  const today = todayStr();
  const yesterday = daysAgo(1);
  const lastDate = unique[unique.length - 1];
  const lastRun = streaks[streaks.length - 1];

  let currentStreak = 0;
  if (lastDate === today || lastDate === yesterday) {
    currentStreak = lastRun.length;
  }

  return { currentStreak, longestStreak, totalActiveDays };
}

/**
 * Fetches distinct activity dates from meals, workouts, and body_measurements
 * for the last 90 days.
 */
function useActivityDates() {
  const since = daysAgo(LOOKBACK_DAYS);

  const mealsQuery = useQuery({
    queryKey: [GAMIFICATION_KEY, 'meal_dates', since],
    queryFn: async (): Promise<string[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('meals')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', since)
        .order('date', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((r) => r.date as string);
    },
    staleTime: 5 * 60 * 1000,
  });

  const workoutsQuery = useQuery({
    queryKey: [GAMIFICATION_KEY, 'workout_dates', since],
    queryFn: async (): Promise<string[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('workouts')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', since)
        .order('date', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((r) => r.date as string);
    },
    staleTime: 5 * 60 * 1000,
  });

  const bodyQuery = useQuery({
    queryKey: [GAMIFICATION_KEY, 'body_dates', since],
    queryFn: async (): Promise<string[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('body_measurements')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', since)
        .order('date', { ascending: true });

      if (error) throw error;
      return (data ?? []).map((r) => r.date as string);
    },
    staleTime: 5 * 60 * 1000,
  });

  return { mealsQuery, workoutsQuery, bodyQuery };
}

/**
 * Main hook: returns StreakData computed from all activity sources.
 */
export function useStreaks(): StreakData {
  const { mealsQuery, workoutsQuery, bodyQuery } = useActivityDates();

  const isLoading = mealsQuery.isLoading || workoutsQuery.isLoading || bodyQuery.isLoading;

  const streakData = useMemo(() => {
    if (isLoading) {
      return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
    }

    // Merge all dates from all sources
    const allDates: string[] = [
      ...(mealsQuery.data ?? []),
      ...(workoutsQuery.data ?? []),
      ...(bodyQuery.data ?? []),
    ];

    return computeStreaks(allDates);
  }, [isLoading, mealsQuery.data, workoutsQuery.data, bodyQuery.data]);

  return { ...streakData, isLoading };
}

/**
 * Returns counts used by the badge system:
 * - totalMealDays: distinct days with meal entries
 * - totalWorkouts: total workout entries
 * - totalBodyMeasurements: total body measurement entries
 * - totalActiveDays: distinct days with any activity
 */
export function useActivityCounts() {
  const mealsQuery = useQuery({
    queryKey: [GAMIFICATION_KEY, 'meal_count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { totalMealDays: 0, totalWorkouts: 0 };

      // Total distinct meal days (all time)
      const { data: mealData } = await supabase
        .from('meals')
        .select('date')
        .eq('user_id', user.id);
      const mealDays = new Set((mealData ?? []).map((r) => r.date as string)).size;

      // Total workouts (all time)
      const { data: workoutData } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', user.id);
      const totalWorkouts = workoutData?.length ?? 0;

      // Total body measurements (all time)
      const { data: bodyData } = await supabase
        .from('body_measurements')
        .select('id')
        .eq('user_id', user.id);
      const totalBodyMeasurements = bodyData?.length ?? 0;

      return { totalMealDays: mealDays, totalWorkouts, totalBodyMeasurements };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    totalMealDays: mealsQuery.data?.totalMealDays ?? 0,
    totalWorkouts: mealsQuery.data?.totalWorkouts ?? 0,
    totalBodyMeasurements: mealsQuery.data?.totalBodyMeasurements ?? 0,
    isLoading: mealsQuery.isLoading,
  };
}

/**
 * Returns activity counts for the current week (Monday to Sunday).
 * Used by WeeklyChallengeCard.
 */
export function useWeeklyActivity() {
  // Find Monday of the current week
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun,1=Mon,...
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days since Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  const mondayStr = monday.toISOString().split('T')[0];
  const todayDate = todayStr();

  const query = useQuery({
    queryKey: [GAMIFICATION_KEY, 'weekly_activity', mondayStr],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { workoutDays: 0, mealDays: 0, bodyDays: 0, anyDays: 0 };

      const { data: workouts } = await supabase
        .from('workouts')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', mondayStr)
        .lte('date', todayDate);

      const { data: meals } = await supabase
        .from('meals')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', mondayStr)
        .lte('date', todayDate);

      const { data: body } = await supabase
        .from('body_measurements')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', mondayStr)
        .lte('date', todayDate);

      const workoutDays = new Set((workouts ?? []).map((r) => r.date)).size;
      const mealDays = new Set((meals ?? []).map((r) => r.date)).size;
      const bodyDays = new Set((body ?? []).map((r) => r.date)).size;

      const allDates = new Set([
        ...(workouts ?? []).map((r) => r.date as string),
        ...(meals ?? []).map((r) => r.date as string),
        ...(body ?? []).map((r) => r.date as string),
      ]);

      return { workoutDays, mealDays, bodyDays, anyDays: allDates.size };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    workoutDays: query.data?.workoutDays ?? 0,
    mealDays: query.data?.mealDays ?? 0,
    bodyDays: query.data?.bodyDays ?? 0,
    anyDays: query.data?.anyDays ?? 0,
    isLoading: query.isLoading,
  };
}
