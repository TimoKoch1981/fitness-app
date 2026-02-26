/**
 * calorieCalculation — Tests for workout session calorie calculations.
 */

import { describe, it, expect } from 'vitest';
import {
  guessWarmupMET,
  calculateSessionCalories,
  calculateWarmupCalories,
} from '../calorieCalculation';
import type { WorkoutExerciseResult, WarmupResult } from '../../../../types/health';

// ── guessWarmupMET ──────────────────────────────────────────────────────

describe('guessWarmupMET', () => {
  it('detects treadmill / running keywords', () => {
    expect(guessWarmupMET('Laufband, leichtes Joggen')).toBe(7.0);
    expect(guessWarmupMET('10 Min Running')).toBe(7.0);
    expect(guessWarmupMET('jogging warm-up')).toBe(7.0);
  });

  it('detects walking', () => {
    expect(guessWarmupMET('5 Min Gehen')).toBe(3.5);
    expect(guessWarmupMET('walking on treadmill')).toBe(3.5);
  });

  it('detects cycling / bike', () => {
    expect(guessWarmupMET('Ergometer 10 Min')).toBe(5.5);
    expect(guessWarmupMET('Fahrrad fahren')).toBe(5.5);
    expect(guessWarmupMET('stationary bike')).toBe(5.5);
  });

  it('detects rowing', () => {
    expect(guessWarmupMET('Rudergerät')).toBe(7.0);
    expect(guessWarmupMET('rowing machine')).toBe(7.0);
  });

  it('detects swimming', () => {
    expect(guessWarmupMET('Schwimmen 15 Min')).toBe(8.0);
    expect(guessWarmupMET('swim warmup')).toBe(8.0);
  });

  it('detects jump rope', () => {
    expect(guessWarmupMET('Seilspringen')).toBe(12.3);
    expect(guessWarmupMET('jump rope 5 min')).toBe(12.3);
  });

  it('detects elliptical / crosstrainer', () => {
    expect(guessWarmupMET('Crosstrainer')).toBe(5.0);
    expect(guessWarmupMET('elliptical trainer')).toBe(5.0);
  });

  it('detects stairmaster', () => {
    expect(guessWarmupMET('Stairmaster')).toBe(9.0);
    expect(guessWarmupMET('Treppensteiger')).toBe(9.0);
  });

  it('returns default 4.0 for unknown descriptions', () => {
    expect(guessWarmupMET('Allgemeines Aufwärmen')).toBe(4.0);
    expect(guessWarmupMET('general warmup')).toBe(4.0);
    expect(guessWarmupMET('')).toBe(4.0);
  });
});

// ── calculateWarmupCalories ─────────────────────────────────────────────

describe('calculateWarmupCalories', () => {
  it('calculates calories for treadmill warmup', () => {
    const result = calculateWarmupCalories('Laufband', 10, 80);
    expect(result.met).toBe(7.0);
    expect(result.calories).toBeGreaterThan(0);
    expect(result.calories).toBeLessThan(200); // sanity check
  });

  it('heavier person burns more calories', () => {
    const light = calculateWarmupCalories('Laufband', 10, 60);
    const heavy = calculateWarmupCalories('Laufband', 10, 100);
    expect(heavy.calories).toBeGreaterThan(light.calories);
  });

  it('longer duration burns more calories', () => {
    const short = calculateWarmupCalories('Laufband', 5, 80);
    const long = calculateWarmupCalories('Laufband', 15, 80);
    expect(long.calories).toBeGreaterThan(short.calories);
  });

  it('returns 0 calories for 0 duration', () => {
    const result = calculateWarmupCalories('Laufband', 0, 80);
    expect(result.calories).toBe(0);
  });
});

// ── calculateSessionCalories ────────────────────────────────────────────

describe('calculateSessionCalories', () => {
  const makeExercise = (name: string, type: string = 'strength', skipped = false): WorkoutExerciseResult => ({
    name,
    exercise_type: type as WorkoutExerciseResult['exercise_type'],
    plan_exercise_index: 0,
    sets: [{ set_number: 1, target_reps: '10', completed: true }],
    skipped,
  });

  const warmup: WarmupResult = {
    description: '10 Min Laufband',
    duration_minutes: 10,
    calories_burned: 93,
    met_value: 7.0,
  };

  it('includes warmup calories', () => {
    const total = calculateSessionCalories([], warmup, 80, 60);
    expect(total).toBe(93); // only warmup
  });

  it('calculates exercise + warmup calories', () => {
    const exercises = [
      makeExercise('Bankdrücken', 'strength'),
      makeExercise('Kniebeugen', 'strength'),
    ];
    const total = calculateSessionCalories(exercises, warmup, 80, 60);
    expect(total).toBeGreaterThan(93); // more than just warmup
  });

  it('skips skipped exercises', () => {
    const exercises = [
      makeExercise('Bankdrücken', 'strength', false),
      makeExercise('Kniebeugen', 'strength', true), // skipped
    ];
    const withSkipped = calculateSessionCalories(exercises, undefined, 80, 60);

    const exercisesNoSkip = [
      makeExercise('Bankdrücken', 'strength', false),
    ];
    const withoutSkipped = calculateSessionCalories(exercisesNoSkip, undefined, 80, 60);

    // With skip should equal one exercise (same total time)
    expect(withSkipped).toBe(withoutSkipped);
  });

  it('returns 0 for no exercises and no warmup', () => {
    const total = calculateSessionCalories([], undefined, 80, 0);
    expect(total).toBe(0);
  });

  it('higher MET exercises burn more (cardio vs strength)', () => {
    const strength = [makeExercise('Bench Press', 'strength')];
    const cardio = [makeExercise('Running', 'cardio')];

    const strengthCal = calculateSessionCalories(strength, undefined, 80, 30);
    const cardioCal = calculateSessionCalories(cardio, undefined, 80, 30);
    expect(cardioCal).toBeGreaterThan(strengthCal);
  });

  it('heavier person burns more in session', () => {
    const exercises = [makeExercise('Bench Press', 'strength')];
    const light = calculateSessionCalories(exercises, undefined, 60, 60);
    const heavy = calculateSessionCalories(exercises, undefined, 100, 60);
    expect(heavy).toBeGreaterThan(light);
  });
});
