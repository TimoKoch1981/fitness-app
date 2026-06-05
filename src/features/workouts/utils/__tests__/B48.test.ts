/**
 * B48 — Goal- and movement-role-aware rep recommendations.
 *
 * Bug: rep defaults came purely from equipment, so compound and isolation
 * got near-identical targets and the user felt "alles wird gleich behandelt".
 *
 * Spec: suggestReps differentiates by goal (strength/hypertrophy/endurance/
 * general) × movement role (compound vs isolation). goalFromPhase maps the
 * user's training phase to a goal. suggestExerciseDefaults uses this so a
 * heavy compound and a light isolation no longer share rep ranges.
 *
 * Reported 2026-06-04 by Timo.
 */

import { describe, it, expect } from 'vitest';
import { suggestReps, goalFromPhase } from '../suggestRestTimes';
import { suggestExerciseDefaults } from '../suggestExerciseDefaults';

describe('B48 — suggestReps', () => {
  it('strength compound = 3-5, isolation = 6-8', () => {
    expect(suggestReps({ goal: 'strength', isCompound: true }).reps).toBe('3-5');
    expect(suggestReps({ goal: 'strength', isCompound: false }).reps).toBe('6-8');
  });

  it('hypertrophy compound = 6-10, isolation = 10-15', () => {
    expect(suggestReps({ goal: 'hypertrophy', isCompound: true }).reps).toBe('6-10');
    expect(suggestReps({ goal: 'hypertrophy', isCompound: false }).reps).toBe('10-15');
  });

  it('endurance pushes reps highest', () => {
    expect(suggestReps({ goal: 'endurance', isCompound: true }).reps).toBe('12-15');
    expect(suggestReps({ goal: 'endurance', isCompound: false }).reps).toBe('15-20');
  });

  it('general still differentiates compound vs isolation (the core B48 win)', () => {
    const compound = suggestReps({ goal: 'general', isCompound: true }).reps;
    const isolation = suggestReps({ goal: 'general', isCompound: false }).reps;
    expect(compound).toBe('6-10');
    expect(isolation).toBe('10-12');
    expect(compound).not.toBe(isolation);
  });

  it('derives role from exercise name when isCompound not given', () => {
    // Kniebeuge matches COMPOUND_PATTERNS → compound reps
    expect(suggestReps({ exerciseName: 'Kniebeuge', goal: 'hypertrophy' }).reps).toBe('6-10');
    // Bizeps-Curl → isolation
    expect(suggestReps({ exerciseName: 'Bizeps-Curl', goal: 'hypertrophy' }).reps).toBe('10-15');
  });
});

describe('B48 — goalFromPhase (real TrainingPhase enum)', () => {
  // Enum: 'bulk' | 'cut' | 'maintenance' | 'peak_week' | 'reverse_diet' | 'off_season'
  it('bulk / off_season / cut → hypertrophy (muscle-building / retention)', () => {
    expect(goalFromPhase('bulk')).toBe('hypertrophy');
    expect(goalFromPhase('off_season')).toBe('hypertrophy');
    expect(goalFromPhase('cut')).toBe('hypertrophy');
  });
  it('maintenance / reverse_diet / peak_week → general (peak_week is a taper, not max-strength)', () => {
    expect(goalFromPhase('maintenance')).toBe('general');
    expect(goalFromPhase('reverse_diet')).toBe('general');
    expect(goalFromPhase('peak_week')).toBe('general');
  });
  it('unknown / undefined / null → general', () => {
    expect(goalFromPhase('something_else')).toBe('general');
    expect(goalFromPhase(undefined)).toBe('general');
    expect(goalFromPhase(null)).toBe('general');
  });
});

describe('B48 — suggestExerciseDefaults uses goal-aware reps', () => {
  it('compound barbell exercise gets compound reps, isolation gets isolation reps (general goal)', () => {
    // Bankdrücken = barbell compound
    const bench = suggestExerciseDefaults('Bankdrücken mit Langhantel');
    // Bizeps-Curl = isolation
    const curl = suggestExerciseDefaults('Bizeps-Curl Kurzhantel');
    expect(bench.reps).not.toBe(curl.reps);
  });

  it('hypertrophy goal sharpens a compound exercise to 6-10', () => {
    const squat = suggestExerciseDefaults('Kniebeuge mit Langhantel', undefined, 'hypertrophy');
    expect(squat.reps).toBe('6-10');
  });

  it('strength goal lowers compound reps to 3-5', () => {
    const dl = suggestExerciseDefaults('Kreuzheben mit Langhantel', undefined, 'strength');
    expect(dl.reps).toBe('3-5');
  });
});
