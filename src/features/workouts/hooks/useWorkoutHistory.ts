/**
 * useWorkoutHistory — Loads workout session history for a plan.
 * Provides per-exercise trends (weight progression, volume).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Workout, WorkoutExerciseResult } from '../../../types/health';

const HISTORY_KEY = 'workout_history';

/** All session workouts for a plan (newest first) */
export function useWorkoutHistoryForPlan(planId: string | undefined) {
  return useQuery({
    queryKey: [HISTORY_KEY, 'plan', planId],
    enabled: !!planId,
    queryFn: async (): Promise<Workout[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_id', planId!)
        .not('session_exercises', 'is', null)
        .order('date', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

/** All session workouts (newest first, limited) */
export function useAllWorkoutHistory(limit = 50) {
  return useQuery({
    queryKey: [HISTORY_KEY, 'all', limit],
    queryFn: async (): Promise<Workout[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .not('session_exercises', 'is', null)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Exercise progress data point for charts */
export interface ExerciseProgressPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;   // sum of (reps × weight) across sets
  totalSets: number;
  avgReps: number;
}

/**
 * Extract per-exercise progress data from workout history.
 * Used for the exercise history chart.
 */
export function getExerciseProgress(
  workouts: Workout[],
  exerciseName: string,
): ExerciseProgressPoint[] {
  const points: ExerciseProgressPoint[] = [];

  // Go through workouts oldest-first for chronological chart
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));

  for (const w of sorted) {
    const sessionExercises = w.session_exercises as WorkoutExerciseResult[] | undefined;
    if (!sessionExercises) continue;

    const match = sessionExercises.find(
      ex => ex.name.toLowerCase() === exerciseName.toLowerCase() && !ex.skipped,
    );
    if (!match) continue;

    const completedSets = match.sets.filter(s => s.completed);
    if (completedSets.length === 0) continue;

    const weights = completedSets.map(s => s.actual_weight_kg ?? 0);
    const reps = completedSets.map(s => s.actual_reps ?? 0);
    const volume = completedSets.reduce(
      (sum, s) => sum + (s.actual_reps ?? 0) * (s.actual_weight_kg ?? 0),
      0,
    );

    points.push({
      date: w.date,
      maxWeight: Math.max(...weights),
      totalVolume: Math.round(volume),
      totalSets: completedSets.length,
      avgReps: reps.length > 0 ? Math.round(reps.reduce((a, b) => a + b, 0) / reps.length) : 0,
    });
  }

  return points;
}

/**
 * Get unique exercise names across all workout history.
 */
export function getUniqueExerciseNames(workouts: Workout[]): string[] {
  const names = new Set<string>();
  for (const w of workouts) {
    const sessionExercises = w.session_exercises as WorkoutExerciseResult[] | undefined;
    if (!sessionExercises) continue;
    for (const ex of sessionExercises) {
      if (!ex.skipped) names.add(ex.name);
    }
  }
  return Array.from(names).sort();
}
