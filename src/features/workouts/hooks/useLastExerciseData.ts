/**
 * useLastExerciseData — Finds the most recent completed execution of a specific exercise.
 *
 * Works CROSS-PLAN: searches ALL completed workouts, not just the current plan.
 * Matches by exercise_id first (most reliable), then by name (case-insensitive).
 *
 * Industry standard (Strong, Hevy): "PREVIOUS" column shows last session's values
 * for each exercise, regardless of which plan/routine it was performed in.
 *
 * Architecture: Shared query for all recent workouts (1 Supabase fetch),
 * per-exercise selector via useMemo (zero extra network calls).
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '../../../lib/supabase';
import type { WorkoutExerciseResult, ExerciseSet } from '../../../types/health';
import { convertLegacyExercises } from './useWorkoutHistory';

// ── Types ────────────────────────────────────────────────────────────────

export interface LastExerciseData {
  /** Date of the workout (ISO YYYY-MM-DD) */
  date: string;
  /** The exercise data with per-set actual values */
  exercise: WorkoutExerciseResult;
}

interface NormalizedWorkout {
  date: string;
  session_exercises: WorkoutExerciseResult[];
}

// ── Shared Query — fetches once, cached for 5 min ────────────────────────

const RECENT_WORKOUTS_KEY = 'recent-workouts-for-previous';

export function useRecentCompletedWorkouts() {
  return useQuery({
    queryKey: [RECENT_WORKOUTS_KEY],
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<NormalizedWorkout[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('workouts')
        .select('date, exercises, session_exercises')
        .eq('user_id', user.id)
        .neq('status', 'in_progress')
        .order('date', { ascending: false })
        .limit(30);

      if (error || !data) return [];

      // Normalize: convert legacy exercises[] → session_exercises[]
      return data
        .map(w => {
          const se = w.session_exercises as WorkoutExerciseResult[] | undefined;
          if (se && se.length > 0) {
            return { date: w.date, session_exercises: se };
          }
          if (w.exercises && (w.exercises as ExerciseSet[]).length > 0) {
            return {
              date: w.date,
              session_exercises: convertLegacyExercises(w.exercises as ExerciseSet[]),
            };
          }
          return null;
        })
        .filter((w): w is NormalizedWorkout => w !== null && w.session_exercises.length > 0);
    },
  });
}

// ── Per-exercise selector — derived from shared data, zero extra fetches ─

export function useLastExerciseData(
  exerciseName?: string,
  exerciseId?: string,
): { data: LastExerciseData | null; isLoading: boolean } {
  const { data: workouts, isLoading } = useRecentCompletedWorkouts();

  const data = useMemo<LastExerciseData | null>(() => {
    if (!workouts || !exerciseName) return null;

    const nameLower = exerciseName.toLowerCase();

    for (const w of workouts) {
      const match = w.session_exercises.find(ex => {
        if (ex.skipped) return false;
        if (!ex.sets.some(s => s.completed)) return false;
        // Prefer exercise_id match (stable across renames)
        if (exerciseId && ex.exercise_id && ex.exercise_id === exerciseId) return true;
        // Fallback: case-insensitive name match
        return ex.name.toLowerCase() === nameLower;
      });

      if (match) {
        return { date: w.date, exercise: match };
      }
    }

    return null;
  }, [workouts, exerciseName, exerciseId]);

  return { data, isLoading };
}
