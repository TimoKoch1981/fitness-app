/**
 * useWorkoutHistory — Loads workout history for a plan or globally.
 * Provides per-exercise trends (weight progression, volume).
 *
 * v2 (2026-03-10): Removed session_exercises IS NOT NULL filter.
 * Quick-logs (from AddWorkoutDialog + Buddy) now appear in history
 * alongside plan-based sessions. Legacy exercises[] is auto-converted
 * to session_exercises format for unified rendering.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Workout, WorkoutExerciseResult, ExerciseSet } from '../../../types/health';

const HISTORY_KEY = 'workout_history';

/**
 * Convert legacy exercises[] to WorkoutExerciseResult[] format.
 * Enables quick-log workouts to appear in history & charts.
 */
export function convertLegacyExercises(exercises: ExerciseSet[]): WorkoutExerciseResult[] {
  return exercises
    .filter(ex => ex.name && ex.name.trim() !== '')
    .map((ex, idx) => ({
      name: ex.name,
      plan_exercise_index: idx,
      duration_minutes: ex.duration_minutes,
      notes: ex.notes,
      sets: Array.from({ length: ex.sets ?? 1 }, (_, i) => ({
        set_number: i + 1,
        target_reps: ex.reps ? String(ex.reps) : '',
        target_weight_kg: ex.weight_kg,
        actual_reps: ex.reps,
        actual_weight_kg: ex.weight_kg,
        completed: true,
        skipped: false,
      })),
    }));
}

/**
 * Ensure every workout has session_exercises populated.
 * If only legacy exercises[] exist, auto-convert them.
 */
function normalizeWorkouts(workouts: Workout[]): Workout[] {
  return workouts.map(w => {
    if (w.session_exercises && (w.session_exercises as WorkoutExerciseResult[]).length > 0) {
      return w;
    }
    // Fallback: convert legacy exercises[] → session_exercises[]
    if (w.exercises && w.exercises.length > 0) {
      return {
        ...w,
        session_exercises: convertLegacyExercises(w.exercises),
      };
    }
    return w;
  });
}

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
        .neq('status', 'in_progress')
        .order('date', { ascending: false });

      if (error) throw error;
      return normalizeWorkouts(data ?? []);
    },
  });
}

/** All workouts (newest first, limited) — includes quick-logs + plan sessions */
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
        .neq('status', 'in_progress')
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return normalizeWorkouts(data ?? []);
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
