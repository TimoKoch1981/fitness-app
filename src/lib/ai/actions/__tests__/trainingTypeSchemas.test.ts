import { describe, it, expect } from 'vitest';
import { validateAction } from '../schemas';

// ── PlanExercise Schema Tests ─────────────────────────────────────────

describe('save_training_plan — PlanExercise schema', () => {
  const basePlan = {
    name: 'Test Plan',
    split_type: 'custom',
    days_per_week: 3,
  };

  function makePlan(exercises: Record<string, unknown>[]) {
    return {
      ...basePlan,
      days: [{
        day_number: 1,
        name: 'Tag 1',
        exercises,
      }],
    };
  }

  // ── Backwards compatibility: strength format ────────────────────────

  it('accepts classic strength format (sets + reps)', () => {
    const result = validateAction('save_training_plan', makePlan([
      { name: 'Bankdrücken', sets: 4, reps: '8-10', weight_kg: 80 },
    ]));
    expect(result.success).toBe(true);
  });

  it('accepts strength format with optional weight', () => {
    const result = validateAction('save_training_plan', makePlan([
      { name: 'Klimmzüge', sets: 3, reps: '5-8' },
    ]));
    expect(result.success).toBe(true);
  });

  it('accepts strength format with rest_seconds', () => {
    const result = validateAction('save_training_plan', makePlan([
      { name: 'Kniebeugen', sets: 5, reps: '5', weight_kg: 100, rest_seconds: 180 },
    ]));
    expect(result.success).toBe(true);
  });

  // ── New endurance format ────────────────────────────────────────────

  it('accepts endurance format (duration_minutes only)', () => {
    const result = validateAction('save_training_plan', makePlan([
      { name: 'Lockerer Lauf', duration_minutes: 30, exercise_type: 'cardio' },
    ]));
    expect(result.success).toBe(true);
  });

  it('accepts endurance format (distance_km only)', () => {
    const result = validateAction('save_training_plan', makePlan([
      { name: '5K Lauf', distance_km: 5, exercise_type: 'cardio' },
    ]));
    expect(result.success).toBe(true);
  });

  it('accepts full endurance format with all fields', () => {
    const result = validateAction('save_training_plan', makePlan([
      {
        name: 'Tempo Run',
        duration_minutes: 30,
        distance_km: 5,
        pace: '6:00 min/km',
        intensity: 'Zone 3',
        exercise_type: 'cardio',
      },
    ]));
    expect(result.success).toBe(true);
  });

  it('accepts yoga/flexibility format', () => {
    const result = validateAction('save_training_plan', makePlan([
      {
        name: 'Vinyasa Flow',
        duration_minutes: 45,
        intensity: 'moderat',
        exercise_type: 'flexibility',
      },
    ]));
    expect(result.success).toBe(true);
  });

  // ── Rejection: no strength AND no endurance fields ──────────────────

  it('rejects exercise without sets/reps AND without duration/distance', () => {
    const result = validateAction('save_training_plan', makePlan([
      { name: 'Empty Exercise' },
    ]));
    expect(result.success).toBe(false);
    expect(result.errors?.some(e => e.includes('sets/reps') || e.includes('duration/distance'))).toBe(true);
  });

  it('rejects exercise with only weight (no sets/reps, no duration)', () => {
    const result = validateAction('save_training_plan', makePlan([
      { name: 'Bad Exercise', weight_kg: 50 },
    ]));
    expect(result.success).toBe(false);
  });

  // ── Mixed plan (strength + endurance) ───────────────────────────────

  it('accepts mixed plan with both strength and endurance exercises', () => {
    const result = validateAction('save_training_plan', makePlan([
      { name: 'Bankdrücken', sets: 4, reps: '8-10', weight_kg: 80 },
      { name: 'Laufen', duration_minutes: 20, intensity: 'Zone 2', exercise_type: 'cardio' },
    ]));
    expect(result.success).toBe(true);
  });

  // ── exercise_type enum ──────────────────────────────────────────────

  it('accepts all valid exercise_type values', () => {
    const types = ['strength', 'cardio', 'flexibility', 'functional', 'other'];
    for (const type of types) {
      const result = validateAction('save_training_plan', makePlan([
        { name: 'Test', sets: 3, reps: '10', exercise_type: type },
      ]));
      expect(result.success).toBe(true);
    }
  });

  it('rejects invalid exercise_type', () => {
    const result = validateAction('save_training_plan', makePlan([
      { name: 'Test', sets: 3, reps: '10', exercise_type: 'invalid' },
    ]));
    expect(result.success).toBe(false);
  });
});

// ── SaveTrainingPlan — split_type ──────────────────────────────────────

describe('save_training_plan — split_type', () => {
  const baseDay = {
    day_number: 1,
    name: 'Tag 1',
    exercises: [{ name: 'Test', sets: 3, reps: '10' }],
  };

  it('accepts classic split types', () => {
    const types = ['ppl', 'upper_lower', 'full_body', 'custom'];
    for (const type of types) {
      const result = validateAction('save_training_plan', {
        name: 'Test Plan',
        split_type: type,
        days_per_week: 3,
        days: [baseDay],
      });
      expect(result.success).toBe(true);
    }
  });

  it('accepts new sport-specific split types', () => {
    const types = ['running', 'swimming', 'cycling', 'yoga', 'martial_arts', 'mixed'];
    for (const type of types) {
      const result = validateAction('save_training_plan', {
        name: 'Sport Plan',
        split_type: type,
        days_per_week: 3,
        days: [baseDay],
      });
      expect(result.success).toBe(true);
    }
  });

  it('defaults to custom when no split_type given', () => {
    const result = validateAction('save_training_plan', {
      name: 'Test Plan',
      days_per_week: 3,
      days: [baseDay],
    });
    expect(result.success).toBe(true);
    expect((result.data as any).split_type).toBe('custom');
  });

  it('rejects invalid split_type', () => {
    const result = validateAction('save_training_plan', {
      name: 'Test Plan',
      split_type: 'invalid_split',
      days_per_week: 3,
      days: [baseDay],
    });
    expect(result.success).toBe(false);
  });
});
