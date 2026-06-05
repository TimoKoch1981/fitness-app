/**
 * B46 — Per-set cross-plan lookup.
 *
 * Bug: `buildExercisesFromPlan` reads `prevEx.sets.find(s => s.completed)`
 * — i.e. the FIRST completed set of the last workout. Every set in the new
 * session inherits THAT value, so a user who last did 40/45/50 kg sees
 * target=40 for all three sets and re-types twice.
 *
 * Spec: Set N should inherit `prevEx.sets[N]?.actual_weight_kg` (positional
 * match). Falls back to the legacy first-completed-set when the previous
 * workout had fewer sets.
 *
 * Reported 2026-06-04 by Timo (Rumänisches Kreuzheben 23.05. 40/45/50,
 * 04.06. plan-default 40 for all three sets).
 */

import { describe, it, expect } from 'vitest';
import { buildExercisesFromPlan } from '../ActiveWorkoutContext';
import type { PlanExercise, WorkoutExerciseResult } from '../../../../types/health';

describe('B46 — per-set cross-plan lookup', () => {
  const plan: PlanExercise[] = [{
    name: 'Rumänisches Kreuzheben',
    sets: 3,
    reps: '8-10',
    rest_seconds: 90,
  }];

  const prevWorkout: WorkoutExerciseResult = {
    name: 'Rumänisches Kreuzheben',
    exercise_id: undefined,
    exercise_type: 'strength',
    plan_exercise_index: 0,
    skipped: false,
    is_addition: false,
    sets: [
      { set_number: 1, target_reps: '8-10', actual_reps: 10, actual_weight_kg: 40, completed: true, skipped: false, set_tag: 'normal' },
      { set_number: 2, target_reps: '8-10', actual_reps: 10, actual_weight_kg: 45, completed: true, skipped: false, set_tag: 'normal' },
      { set_number: 3, target_reps: '8-10', actual_reps: 9,  actual_weight_kg: 50, completed: true, skipped: false, set_tag: 'normal' },
    ],
  };

  it('Set 1 / 2 / 3 inherit positional actuals 40 / 45 / 50 from last workout', () => {
    const map = new Map<string, WorkoutExerciseResult>([['rumänisches kreuzheben', prevWorkout]]);
    const result = buildExercisesFromPlan(plan, undefined, map);
    expect(result[0].sets[0].target_weight_kg).toBe(40);
    expect(result[0].sets[1].target_weight_kg).toBe(45);
    expect(result[0].sets[2].target_weight_kg).toBe(50);
  });

  it('falls back to first-completed-set when new plan has more sets than the previous workout', () => {
    const longerPlan: PlanExercise[] = [{ ...plan[0], sets: 4 }];
    const map = new Map<string, WorkoutExerciseResult>([['rumänisches kreuzheben', prevWorkout]]);
    const result = buildExercisesFromPlan(longerPlan, undefined, map);
    expect(result[0].sets[0].target_weight_kg).toBe(40);
    expect(result[0].sets[1].target_weight_kg).toBe(45);
    expect(result[0].sets[2].target_weight_kg).toBe(50);
    // Set 4 (no positional match) → take the heaviest previous set so the
    // user doesn't suddenly see plan-default after a higher cluster.
    expect(result[0].sets[3].target_weight_kg).toBe(50);
  });

  it('extra sets use the HEAVIEST previous set, not the last (review fix)', () => {
    // History 40/50/40 (last set is a back-off). A 4-set plan: sets 1-3 match
    // positionally (40/50/40), set 4 has no positional match → must take the
    // heaviest (50), NOT the last set's 40.
    const backoff: WorkoutExerciseResult = {
      name: 'Hip Thrust', exercise_id: undefined, exercise_type: 'strength',
      plan_exercise_index: 0, skipped: false, is_addition: false,
      sets: [
        { set_number: 1, target_reps: '8', actual_reps: 8, actual_weight_kg: 40, completed: true, skipped: false, set_tag: 'normal' },
        { set_number: 2, target_reps: '8', actual_reps: 8, actual_weight_kg: 50, completed: true, skipped: false, set_tag: 'normal' },
        { set_number: 3, target_reps: '8', actual_reps: 8, actual_weight_kg: 40, completed: true, skipped: false, set_tag: 'normal' },
      ],
    };
    const map = new Map<string, WorkoutExerciseResult>([['hip thrust', backoff]]);
    const fourSetPlan: PlanExercise[] = [{ name: 'Hip Thrust', sets: 4, reps: '8-10', rest_seconds: 90 }];
    const result = buildExercisesFromPlan(fourSetPlan, undefined, map);
    expect(result[0].sets[0].target_weight_kg).toBe(40);
    expect(result[0].sets[1].target_weight_kg).toBe(50);
    expect(result[0].sets[2].target_weight_kg).toBe(40);
    expect(result[0].sets[3].target_weight_kg).toBe(50); // heaviest, not last (40)
  });

  it('skips warmup sets from the previous workout when computing position', () => {
    const prevWithWarmup: WorkoutExerciseResult = {
      ...prevWorkout,
      sets: [
        { set_number: 1, target_reps: '12', actual_reps: 12, actual_weight_kg: 20, completed: true, skipped: false, set_tag: 'warmup' },
        ...prevWorkout.sets,
      ],
    };
    const map = new Map<string, WorkoutExerciseResult>([['rumänisches kreuzheben', prevWithWarmup]]);
    const result = buildExercisesFromPlan(plan, undefined, map);
    expect(result[0].sets[0].target_weight_kg).toBe(40); // first WORKING set
    expect(result[0].sets[1].target_weight_kg).toBe(45);
    expect(result[0].sets[2].target_weight_kg).toBe(50);
  });
});
