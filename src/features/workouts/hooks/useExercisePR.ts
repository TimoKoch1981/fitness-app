/**
 * useExercisePR — Detects if the current weight/reps represents a Personal Record.
 *
 * Derives max weight from useRecentCompletedWorkouts (shared query, zero extra fetches).
 * Returns the all-time max weight for a given exercise so the UI can show "NEW PR!"
 * when the user enters a higher weight.
 */

import { useMemo } from 'react';
import { useRecentCompletedWorkouts } from './useLastExerciseData';

export interface ExercisePRData {
  /** All-time max weight (kg) from recent history */
  maxWeight: number | null;
  /** All-time max reps at heaviest weight */
  maxRepsAtMax: number | null;
  /** All-time max volume in a single set (reps x weight) */
  maxSetVolume: number | null;
}

export function useExercisePR(
  exerciseName?: string,
  exerciseId?: string,
): ExercisePRData {
  const { data: workouts } = useRecentCompletedWorkouts();

  return useMemo(() => {
    if (!workouts || !exerciseName) {
      return { maxWeight: null, maxRepsAtMax: null, maxSetVolume: null };
    }

    const nameLower = exerciseName.toLowerCase();
    let maxWeight = 0;
    let maxRepsAtMax = 0;
    let maxSetVolume = 0;

    for (const w of workouts) {
      for (const ex of w.session_exercises) {
        if (ex.skipped) continue;

        // Match by ID or name
        const isMatch =
          (exerciseId && ex.exercise_id && ex.exercise_id === exerciseId) ||
          ex.name.toLowerCase() === nameLower;

        if (!isMatch) continue;

        for (const set of ex.sets) {
          if (!set.completed || set.set_tag === 'warmup') continue;
          const w = set.actual_weight_kg ?? 0;
          const r = set.actual_reps ?? 0;

          if (w > maxWeight) {
            maxWeight = w;
            maxRepsAtMax = r;
          } else if (w === maxWeight && r > maxRepsAtMax) {
            maxRepsAtMax = r;
          }

          const vol = w * r;
          if (vol > maxSetVolume) maxSetVolume = vol;
        }
      }
    }

    return {
      maxWeight: maxWeight > 0 ? maxWeight : null,
      maxRepsAtMax: maxRepsAtMax > 0 ? maxRepsAtMax : null,
      maxSetVolume: maxSetVolume > 0 ? maxSetVolume : null,
    };
  }, [workouts, exerciseName, exerciseId]);
}
