/**
 * B47 — Set-2's target_weight should follow Set-1's actual_weight.
 *
 * Bug: User logs Set 1 with 80 kg (override of plan default 70 kg).
 * Set 2 still shows target_weight_kg = 70. User must retype 80 again,
 * which is the most common "why is this app so dumb" complaint.
 *
 * Spec: after a LOG_SET, every later non-completed set gets its
 *   target_weight_kg updated to the freshly logged actualWeightKg
 *   (mirrored for reps + duration so isometric and cardio also benefit).
 *   Already-completed sets are NEVER touched.
 *
 * Reported 2026-06-04 by Timo (Rumänisches Kreuzheben target=40, actual
 * 50/55/55 — user re-typed weight 3 times).
 */

import { describe, it, expect } from 'vitest';
import { reducer } from '../ActiveWorkoutContext';
import type { ActiveWorkoutState, WorkoutExerciseResult } from '../../../../types/health';

function makeState(): ActiveWorkoutState {
  const exercise: WorkoutExerciseResult = {
    name: 'Rumänisches Kreuzheben',
    exercise_type: 'strength',
    plan_exercise_index: 0,
    skipped: false,
    is_addition: false,
    sets: [
      { set_number: 1, target_reps: '8-10', target_weight_kg: 40, completed: false, skipped: false },
      { set_number: 2, target_reps: '8-10', target_weight_kg: 40, completed: false, skipped: false },
      { set_number: 3, target_reps: '8-10', target_weight_kg: 40, completed: false, skipped: false },
    ],
  };
  return {
    planId: 'p1', planDayId: 'd1', planDayNumber: 1, planDayName: 'Day',
    exercises: [exercise], planExercises: [],
    currentExerciseIndex: 0, currentSetIndex: 0,
    mode: 'set-by-set', timerEnabled: false, timerSeconds: 90,
    startedAt: '2026-06-04T10:00:00Z', phase: 'exercise',
    isActive: true, setReady: false,
  } as ActiveWorkoutState;
}

describe('B47 — Set-default propagation', () => {
  it('logs set 1 with 50 kg → sets 2 and 3 inherit target=50', () => {
    const state = reducer(makeState(), {
      type: 'LOG_SET',
      exerciseIndex: 0,
      setIndex: 0,
      actualReps: 12,
      actualWeightKg: 50,
    });
    expect(state.exercises[0].sets[1].target_weight_kg).toBe(50);
    expect(state.exercises[0].sets[2].target_weight_kg).toBe(50);
  });

  it('logging set 2 with 55 kg propagates only to set 3, not back to set 1', () => {
    let state = reducer(makeState(), {
      type: 'LOG_SET',
      exerciseIndex: 0,
      setIndex: 0,
      actualReps: 12,
      actualWeightKg: 50,
    });
    state = reducer(state, {
      type: 'LOG_SET',
      exerciseIndex: 0,
      setIndex: 1,
      actualReps: 12,
      actualWeightKg: 55,
    });
    expect(state.exercises[0].sets[0].actual_weight_kg).toBe(50);
    expect(state.exercises[0].sets[1].actual_weight_kg).toBe(55);
    expect(state.exercises[0].sets[2].target_weight_kg).toBe(55);
  });

  it('does NOT override already-completed sets', () => {
    let state = reducer(makeState(), {
      type: 'LOG_SET',
      exerciseIndex: 0,
      setIndex: 0,
      actualReps: 12,
      actualWeightKg: 50,
    });
    // Complete set 1, then a re-edit of set 0 must not retro-mutate it
    state = reducer(state, {
      type: 'LOG_SET',
      exerciseIndex: 0,
      setIndex: 1,
      actualReps: 10,
      actualWeightKg: 60,
    });
    expect(state.exercises[0].sets[0].actual_weight_kg).toBe(50);
  });
});
