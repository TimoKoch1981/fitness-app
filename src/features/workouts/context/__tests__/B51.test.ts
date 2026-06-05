/**
 * B51 — Resistance-band mode for exercises like Hip Thrust.
 *
 * Bug/feature: Hip Thrust (and similar) should support training with an ATX
 * resistance band instead of free weight. When PlanExercise.is_band is true,
 * buildExercisesFromPlan must hide the kg target (like bodyweight) and carry
 * the band_color through to the session.
 *
 * Requested 2026-06-04 by Timo.
 */

import { describe, it, expect } from 'vitest';
import { buildExercisesFromPlan, reducer } from '../ActiveWorkoutContext';
import { ATX_BANDS, getAtxBand, DEFAULT_BAND_KEY } from '../../data/atxBands';
import type { PlanExercise, ActiveWorkoutState, WorkoutExerciseResult } from '../../../../types/health';

describe('B51 — ATX band data', () => {
  it('has exactly 9 levels, no grey/gold', () => {
    expect(ATX_BANDS).toHaveLength(9);
    const keys = ATX_BANDS.map(b => b.key);
    expect(keys).not.toContain('grey');
    expect(keys).not.toContain('gold');
    expect(keys).toEqual(['pink','white','yellow','orange','green','blue','red','purple','black']);
  });
  it('levels are 1..9 ascending', () => {
    expect(ATX_BANDS.map(b => b.level)).toEqual([1,2,3,4,5,6,7,8,9]);
  });
  it('marks green/blue/red as hip-thrust-typical', () => {
    const typical = ATX_BANDS.filter(b => b.hipThrustTypical).map(b => b.key);
    expect(typical).toEqual(['green','blue','red']);
  });
  it('getAtxBand resolves known + unknown keys', () => {
    expect(getAtxBand('blue')?.labelDe).toBe('Blau');
    expect(getAtxBand('nonsense')).toBeUndefined();
    expect(getAtxBand(undefined)).toBeUndefined();
  });
  it('default band is hip-thrust-typical', () => {
    expect(getAtxBand(DEFAULT_BAND_KEY)?.hipThrustTypical).toBe(true);
  });
});

describe('B51 — buildExercisesFromPlan band mode', () => {
  const bandPlan: PlanExercise[] = [{
    name: 'Hip Thrust',
    sets: 3,
    reps: '8-10',
    is_band: true,
    band_color: 'red',
  } as PlanExercise];

  it('band exercise has no kg target (mirrors bodyweight)', () => {
    const result = buildExercisesFromPlan(bandPlan, undefined, undefined);
    for (const s of result[0].sets) {
      expect(s.target_weight_kg).toBeUndefined();
    }
  });

  it('carries band_color to the session exercise', () => {
    const result = buildExercisesFromPlan(bandPlan, undefined, undefined);
    expect(result[0].band_color).toBe('red');
  });

  it('a normal weighted Hip Thrust still gets a kg target', () => {
    const weightedPlan: PlanExercise[] = [{ name: 'Hip Thrust', sets: 3, reps: '8-10', weight_kg: 60 }];
    const result = buildExercisesFromPlan(weightedPlan, undefined, undefined);
    expect(result[0].sets[0].target_weight_kg).toBe(60);
    expect(result[0].band_color).toBeUndefined();
  });

  it('is_band without a color defaults to the hip-thrust band (review fix)', () => {
    const plan: PlanExercise[] = [{ name: 'Hip Thrust', sets: 3, reps: '8-10', is_band: true } as PlanExercise];
    const result = buildExercisesFromPlan(plan, undefined, undefined);
    expect(result[0].band_color).toBe(DEFAULT_BAND_KEY);
  });
});

describe('B51 — changing the band mid-workout keeps the current set (review fix)', () => {
  function bandSessionAtSet3(): ActiveWorkoutState {
    const ex: WorkoutExerciseResult = {
      name: 'Hip Thrust',
      exercise_type: 'strength',
      plan_exercise_index: 0,
      band_color: 'red',
      skipped: false,
      is_addition: false,
      sets: [
        { set_number: 1, target_reps: '8-10', completed: true, skipped: false },
        { set_number: 2, target_reps: '8-10', completed: true, skipped: false },
        { set_number: 3, target_reps: '8-10', completed: false, skipped: false },
      ],
    };
    return {
      planId: 'p', planDayId: 'd', planDayNumber: 1, planDayName: 'Day',
      exercises: [ex], planExercises: [],
      currentExerciseIndex: 0, currentSetIndex: 2,
      mode: 'set-by-set', timerEnabled: false, timerSeconds: 90,
      startedAt: '2026-06-05T10:00:00Z', phase: 'exercise',
      isActive: true, setReady: false,
    } as ActiveWorkoutState;
  }

  it('EDIT_EXERCISE { band_color } does NOT reset currentSetIndex', () => {
    const state = reducer(bandSessionAtSet3(), {
      type: 'EDIT_EXERCISE', exerciseIndex: 0, updates: { band_color: 'green' },
    });
    expect(state.currentSetIndex).toBe(2);           // still on set 3
    expect(state.exercises[0].band_color).toBe('green');
  });

  it('EDIT_EXERCISE { numSets } still resets to set 1 (structure changed)', () => {
    const state = reducer(bandSessionAtSet3(), {
      type: 'EDIT_EXERCISE', exerciseIndex: 0, updates: { numSets: 5 },
    });
    expect(state.currentSetIndex).toBe(0);
  });
});
