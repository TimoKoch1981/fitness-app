/**
 * ActiveWorkoutContext — Reducer unit tests.
 * Tests all action types for the workout session state machine.
 */

import { describe, it, expect } from 'vitest';
import { reducer, initialState, buildExercisesFromPlan, type ActiveWorkoutState } from '../ActiveWorkoutContext';
import type { TrainingPlanDay, PlanExercise, WorkoutExerciseResult, WarmupResult } from '../../../../types/health';

// ── Test Helpers ──────────────────────────────────────────────────────

const makePlanExercise = (name: string, overrides?: Partial<PlanExercise>): PlanExercise => ({
  name,
  sets: 3,
  reps: '10',
  weight_kg: 60,
  rest_seconds: 90,
  ...overrides,
});

const makePlanDay = (exercises: PlanExercise[]): TrainingPlanDay => ({
  id: 'day-1',
  plan_id: 'plan-1',
  day_number: 1,
  name: 'Push Day',
  focus: 'Chest & Shoulders',
  exercises,
  created_at: '2026-01-01T00:00:00Z',
});

function startedState(overrides?: Partial<ActiveWorkoutState>): ActiveWorkoutState {
  const exercises: PlanExercise[] = [
    makePlanExercise('Bankdrücken', { weight_kg: 80 }),
    makePlanExercise('Schulterdrücken', { weight_kg: 40 }),
    makePlanExercise('Seitheben', { weight_kg: 12, sets: 4 }),
  ];
  const planDay = makePlanDay(exercises);
  const state = reducer(initialState, { type: 'START_SESSION', planDay, planId: 'plan-1' });
  return { ...state, ...overrides };
}

// ── buildExercisesFromPlan ────────────────────────────────────────────

describe('buildExercisesFromPlan', () => {
  it('creates correct number of exercises', () => {
    const planExercises = [makePlanExercise('Bench Press'), makePlanExercise('Squat')];
    const result = buildExercisesFromPlan(planExercises);
    expect(result).toHaveLength(2);
  });

  it('creates correct number of sets per exercise', () => {
    const planExercises = [makePlanExercise('Bench Press', { sets: 5 })];
    const result = buildExercisesFromPlan(planExercises);
    expect(result[0].sets).toHaveLength(5);
  });

  it('defaults to 3 sets when not specified', () => {
    const planExercises = [makePlanExercise('Bench Press', { sets: undefined })];
    const result = buildExercisesFromPlan(planExercises);
    expect(result[0].sets).toHaveLength(3);
  });

  it('pre-fills target weight in sets', () => {
    const planExercises = [makePlanExercise('Bench Press', { weight_kg: 100 })];
    const result = buildExercisesFromPlan(planExercises);
    expect(result[0].sets[0].target_weight_kg).toBe(100);
    expect(result[0].sets[0].actual_weight_kg).toBe(100);
  });

  it('sets target_reps from plan', () => {
    const planExercises = [makePlanExercise('Bench Press', { reps: '12' })];
    const result = buildExercisesFromPlan(planExercises);
    expect(result[0].sets[0].target_reps).toBe('12');
  });

  it('carries exercise metadata (type, id)', () => {
    const planExercises = [makePlanExercise('Laufen', {
      exercise_type: 'cardio',
      exercise_id: 'ex-123',
      duration_minutes: 30,
      distance_km: 5,
    })];
    const result = buildExercisesFromPlan(planExercises);
    expect(result[0].exercise_type).toBe('cardio');
    expect(result[0].exercise_id).toBe('ex-123');
    expect(result[0].duration_minutes).toBe(30);
    expect(result[0].distance_km).toBe(5);
  });

  it('initializes all sets as not completed / not skipped', () => {
    const planExercises = [makePlanExercise('Bench Press')];
    const result = buildExercisesFromPlan(planExercises);
    for (const set of result[0].sets) {
      expect(set.completed).toBe(false);
      expect(set.skipped).toBe(false);
    }
  });

  it('sets plan_exercise_index correctly', () => {
    const planExercises = [makePlanExercise('A'), makePlanExercise('B'), makePlanExercise('C')];
    const result = buildExercisesFromPlan(planExercises);
    expect(result[0].plan_exercise_index).toBe(0);
    expect(result[1].plan_exercise_index).toBe(1);
    expect(result[2].plan_exercise_index).toBe(2);
  });
});

// ── START_SESSION ─────────────────────────────────────────────────────

describe('START_SESSION', () => {
  it('initializes session from plan day', () => {
    const state = startedState();
    expect(state.isActive).toBe(true);
    expect(state.planId).toBe('plan-1');
    expect(state.planDayId).toBe('day-1');
    expect(state.planDayNumber).toBe(1);
    expect(state.planDayName).toBe('Push Day');
    expect(state.phase).toBe('warmup');
    expect(state.exercises).toHaveLength(3);
  });

  it('sets defaults: mode, timer, indices', () => {
    const state = startedState();
    expect(state.mode).toBe('set-by-set');
    expect(state.timerEnabled).toBe(true);
    expect(state.timerSeconds).toBe(90);
    expect(state.currentExerciseIndex).toBe(0);
    expect(state.currentSetIndex).toBe(0);
  });

  it('sets startedAt timestamp', () => {
    const state = startedState();
    expect(state.startedAt).toBeTruthy();
    expect(new Date(state.startedAt).getTime()).toBeGreaterThan(0);
  });
});

// ── LOG_WARMUP / SKIP_WARMUP ─────────────────────────────────────────

describe('LOG_WARMUP', () => {
  it('stores warmup and moves to exercise phase', () => {
    const warmup: WarmupResult = {
      description: 'Laufband',
      duration_minutes: 10,
      calories_burned: 93,
      met_value: 7.0,
    };
    const state = reducer(startedState(), { type: 'LOG_WARMUP', warmup });
    expect(state.warmup).toEqual(warmup);
    expect(state.phase).toBe('exercise');
  });
});

describe('SKIP_WARMUP', () => {
  it('moves directly to exercise phase without warmup', () => {
    const state = reducer(startedState(), { type: 'SKIP_WARMUP' });
    expect(state.warmup).toBeUndefined();
    expect(state.phase).toBe('exercise');
  });
});

// ── LOG_SET ───────────────────────────────────────────────────────────

describe('LOG_SET', () => {
  it('records actual reps and weight', () => {
    const state = reducer(startedState({ phase: 'exercise' }), {
      type: 'LOG_SET', exerciseIndex: 0, setIndex: 0, actualReps: 10, actualWeightKg: 85,
    });
    const set = state.exercises[0].sets[0];
    expect(set.actual_reps).toBe(10);
    expect(set.actual_weight_kg).toBe(85);
    expect(set.completed).toBe(true);
    expect(set.skipped).toBe(false);
  });

  it('falls back to target weight when no weight provided', () => {
    const state = reducer(startedState({ phase: 'exercise' }), {
      type: 'LOG_SET', exerciseIndex: 0, setIndex: 0, actualReps: 10,
    });
    expect(state.exercises[0].sets[0].actual_weight_kg).toBe(80); // target weight
  });

  it('auto-advances set index', () => {
    const state = reducer(startedState({ phase: 'exercise' }), {
      type: 'LOG_SET', exerciseIndex: 0, setIndex: 0, actualReps: 10,
    });
    expect(state.currentSetIndex).toBe(1);
  });

  it('triggers rest phase when timer enabled and sets remaining', () => {
    const state = reducer(startedState({ phase: 'exercise', timerEnabled: true }), {
      type: 'LOG_SET', exerciseIndex: 0, setIndex: 0, actualReps: 10,
    });
    expect(state.phase).toBe('rest');
  });

  it('does NOT trigger rest phase when timer disabled', () => {
    const state = reducer(startedState({ phase: 'exercise', timerEnabled: false }), {
      type: 'LOG_SET', exerciseIndex: 0, setIndex: 0, actualReps: 10,
    });
    expect(state.phase).toBe('exercise');
  });

  it('resets set index to 0 when all sets complete', () => {
    let state = startedState({ phase: 'exercise' });
    // Complete all 3 sets of exercise 0
    state = reducer(state, { type: 'LOG_SET', exerciseIndex: 0, setIndex: 0, actualReps: 10 });
    state = reducer(state, { type: 'SET_PHASE', phase: 'exercise' }); // skip rest
    state = reducer(state, { type: 'LOG_SET', exerciseIndex: 0, setIndex: 1, actualReps: 10 });
    state = reducer(state, { type: 'SET_PHASE', phase: 'exercise' });
    state = reducer(state, { type: 'LOG_SET', exerciseIndex: 0, setIndex: 2, actualReps: 10 });
    expect(state.currentSetIndex).toBe(0);
  });

  it('stores notes on set', () => {
    const state = reducer(startedState({ phase: 'exercise' }), {
      type: 'LOG_SET', exerciseIndex: 0, setIndex: 0, actualReps: 10, notes: 'felt heavy',
    });
    expect(state.exercises[0].sets[0].notes).toBe('felt heavy');
  });
});

// ── SKIP_SET ──────────────────────────────────────────────────────────

describe('SKIP_SET', () => {
  it('marks set as skipped', () => {
    const state = reducer(startedState({ phase: 'exercise' }), {
      type: 'SKIP_SET', exerciseIndex: 0, setIndex: 0,
    });
    expect(state.exercises[0].sets[0].skipped).toBe(true);
    expect(state.exercises[0].sets[0].completed).toBe(false);
  });

  it('advances set index', () => {
    const state = reducer(startedState({ phase: 'exercise' }), {
      type: 'SKIP_SET', exerciseIndex: 0, setIndex: 0,
    });
    expect(state.currentSetIndex).toBe(1);
  });
});

// ── NEXT_EXERCISE / PREV_EXERCISE / GO_TO_EXERCISE ───────────────────

describe('NEXT_EXERCISE', () => {
  it('advances to next exercise and resets set index', () => {
    const state = reducer(startedState({ phase: 'exercise' }), { type: 'NEXT_EXERCISE' });
    expect(state.currentExerciseIndex).toBe(1);
    expect(state.currentSetIndex).toBe(0);
    expect(state.phase).toBe('exercise');
  });

  it('moves to summary when at last exercise', () => {
    const state = reducer(startedState({ currentExerciseIndex: 2, phase: 'exercise' }), { type: 'NEXT_EXERCISE' });
    expect(state.phase).toBe('summary');
  });
});

describe('PREV_EXERCISE', () => {
  it('goes back to previous exercise', () => {
    const state = reducer(startedState({ currentExerciseIndex: 2, phase: 'exercise' }), { type: 'PREV_EXERCISE' });
    expect(state.currentExerciseIndex).toBe(1);
    expect(state.currentSetIndex).toBe(0);
  });

  it('does not go below 0', () => {
    const state = reducer(startedState({ currentExerciseIndex: 0, phase: 'exercise' }), { type: 'PREV_EXERCISE' });
    expect(state.currentExerciseIndex).toBe(0);
  });
});

describe('GO_TO_EXERCISE', () => {
  it('jumps to specific exercise index', () => {
    const state = reducer(startedState({ phase: 'exercise' }), { type: 'GO_TO_EXERCISE', index: 2 });
    expect(state.currentExerciseIndex).toBe(2);
    expect(state.currentSetIndex).toBe(0);
    expect(state.phase).toBe('exercise');
  });
});

// ── SKIP_EXERCISE ────────────────────────────────────────────────────

describe('SKIP_EXERCISE', () => {
  it('marks exercise as skipped and advances', () => {
    const state = reducer(startedState({ phase: 'exercise' }), {
      type: 'SKIP_EXERCISE', exerciseIndex: 0,
    });
    expect(state.exercises[0].skipped).toBe(true);
    expect(state.currentExerciseIndex).toBe(1);
    expect(state.phase).toBe('exercise');
  });

  it('moves to summary when skipping last exercise', () => {
    const state = reducer(startedState({ currentExerciseIndex: 2, phase: 'exercise' }), {
      type: 'SKIP_EXERCISE', exerciseIndex: 2,
    });
    expect(state.exercises[2].skipped).toBe(true);
    expect(state.phase).toBe('summary');
  });
});

// ── REMOVE_EXERCISE ──────────────────────────────────────────────────

describe('REMOVE_EXERCISE', () => {
  it('removes exercise from list', () => {
    const state = reducer(startedState(), {
      type: 'REMOVE_EXERCISE', exerciseIndex: 1, permanent: false,
    });
    expect(state.exercises).toHaveLength(2);
    expect(state.exercises[0].name).toBe('Bankdrücken');
    expect(state.exercises[1].name).toBe('Seitheben');
  });

  it('adjusts currentExerciseIndex when removing before current', () => {
    const state = reducer(startedState({ currentExerciseIndex: 2 }), {
      type: 'REMOVE_EXERCISE', exerciseIndex: 0, permanent: false,
    });
    expect(state.currentExerciseIndex).toBe(1); // clamped
  });

  it('clamps index to last exercise', () => {
    const state = reducer(startedState({ currentExerciseIndex: 2 }), {
      type: 'REMOVE_EXERCISE', exerciseIndex: 2, permanent: false,
    });
    expect(state.currentExerciseIndex).toBe(1);
  });
});

// ── ADD_EXERCISE ──────────────────────────────────────────────────────

describe('ADD_EXERCISE', () => {
  it('appends exercise to list', () => {
    const newEx: WorkoutExerciseResult = {
      name: 'Dips',
      plan_exercise_index: -1,
      sets: [{ set_number: 1, target_reps: '12', completed: false, skipped: false }],
      skipped: false,
      is_addition: true,
    };
    const state = reducer(startedState(), { type: 'ADD_EXERCISE', exercise: newEx, permanent: false });
    expect(state.exercises).toHaveLength(4);
    expect(state.exercises[3].name).toBe('Dips');
    expect(state.exercises[3].is_addition).toBe(true);
  });
});

// ── TOGGLE_MODE / TOGGLE_TIMER / SET_TIMER_SECONDS ────────────────────

describe('TOGGLE_MODE', () => {
  it('toggles between set-by-set and exercise mode', () => {
    const s1 = reducer(startedState(), { type: 'TOGGLE_MODE' });
    expect(s1.mode).toBe('exercise');
    const s2 = reducer(s1, { type: 'TOGGLE_MODE' });
    expect(s2.mode).toBe('set-by-set');
  });
});

describe('TOGGLE_TIMER', () => {
  it('toggles rest timer on/off', () => {
    const s1 = reducer(startedState(), { type: 'TOGGLE_TIMER' });
    expect(s1.timerEnabled).toBe(false);
    const s2 = reducer(s1, { type: 'TOGGLE_TIMER' });
    expect(s2.timerEnabled).toBe(true);
  });
});

describe('SET_TIMER_SECONDS', () => {
  it('updates timer duration', () => {
    const state = reducer(startedState(), { type: 'SET_TIMER_SECONDS', seconds: 120 });
    expect(state.timerSeconds).toBe(120);
  });
});

// ── SET_PHASE ────────────────────────────────────────────────────────

describe('SET_PHASE', () => {
  it('sets phase directly', () => {
    const state = reducer(startedState(), { type: 'SET_PHASE', phase: 'summary' });
    expect(state.phase).toBe('summary');
  });
});

// ── FINISH_SESSION ───────────────────────────────────────────────────

describe('FINISH_SESSION', () => {
  it('moves to summary and marks inactive', () => {
    const state = reducer(startedState({ phase: 'exercise' }), { type: 'FINISH_SESSION' });
    expect(state.phase).toBe('summary');
    expect(state.isActive).toBe(false);
  });
});

// ── RESTORE_SESSION ──────────────────────────────────────────────────

describe('RESTORE_SESSION', () => {
  it('restores full state from saved snapshot', () => {
    const saved = startedState({ currentExerciseIndex: 1, currentSetIndex: 2, phase: 'rest' });
    const state = reducer(initialState, { type: 'RESTORE_SESSION', state: saved });
    expect(state.currentExerciseIndex).toBe(1);
    expect(state.currentSetIndex).toBe(2);
    expect(state.phase).toBe('rest');
    expect(state.isActive).toBe(true);
  });
});

// ── CLEAR_SESSION ────────────────────────────────────────────────────

describe('CLEAR_SESSION', () => {
  it('resets to initial state', () => {
    const state = reducer(startedState(), { type: 'CLEAR_SESSION' });
    expect(state.isActive).toBe(false);
    expect(state.exercises).toHaveLength(0);
    expect(state.planId).toBe('');
    expect(state.phase).toBe('warmup');
  });
});

// ── Integration: Full Session Flow ───────────────────────────────────

describe('Full session flow', () => {
  it('warmup → exercises → summary', () => {
    const planDay = makePlanDay([
      makePlanExercise('Bench Press', { sets: 2, weight_kg: 80 }),
    ]);

    // Start
    let state = reducer(initialState, { type: 'START_SESSION', planDay, planId: 'p1' });
    expect(state.phase).toBe('warmup');

    // Log warmup
    state = reducer(state, {
      type: 'LOG_WARMUP',
      warmup: { description: 'Laufband', duration_minutes: 5, calories_burned: 50, met_value: 7 },
    });
    expect(state.phase).toBe('exercise');

    // Log set 1 → rest
    state = reducer(state, { type: 'LOG_SET', exerciseIndex: 0, setIndex: 0, actualReps: 10, actualWeightKg: 80 });
    expect(state.phase).toBe('rest');
    expect(state.currentSetIndex).toBe(1);

    // Skip rest
    state = reducer(state, { type: 'SET_PHASE', phase: 'exercise' });

    // Log set 2 (last set)
    state = reducer(state, { type: 'LOG_SET', exerciseIndex: 0, setIndex: 1, actualReps: 8, actualWeightKg: 85 });
    expect(state.currentSetIndex).toBe(0); // reset after all sets done

    // Next exercise → summary (only 1 exercise)
    state = reducer(state, { type: 'NEXT_EXERCISE' });
    expect(state.phase).toBe('summary');

    // Finish
    state = reducer(state, { type: 'FINISH_SESSION' });
    expect(state.isActive).toBe(false);
    expect(state.phase).toBe('summary');
  });
});
