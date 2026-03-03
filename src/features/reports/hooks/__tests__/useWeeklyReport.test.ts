import { describe, it, expect } from 'vitest';
import {
  calculateNutritionSummary,
  calculateTrainingSummary,
  calculateBodySummary,
  calculateSleepSummary,
  calculateStreak,
  getLastNDays,
  getDateRange,
} from '../useWeeklyReport';
import type { Meal, Workout, BodyMeasurement, SleepLog } from '../../../../types/health';

// ── Helper: Create mock data ───────────────────────────────────────

function makeMeal(overrides: Partial<Meal> = {}): Meal {
  return {
    id: crypto.randomUUID(),
    user_id: 'test-user',
    date: '2026-03-01',
    name: 'Test Meal',
    type: 'lunch',
    calories: 500,
    protein: 30,
    carbs: 50,
    fat: 20,
    source: 'manual',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: crypto.randomUUID(),
    user_id: 'test-user',
    date: '2026-03-01',
    name: 'Test Workout',
    type: 'strength',
    duration_minutes: 60,
    calories_burned: 400,
    exercises: [],
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeBody(overrides: Partial<BodyMeasurement> = {}): BodyMeasurement {
  return {
    id: crypto.randomUUID(),
    user_id: 'test-user',
    date: '2026-03-01',
    weight_kg: 85,
    source: 'manual',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeSleep(overrides: Partial<SleepLog> = {}): SleepLog {
  return {
    id: crypto.randomUUID(),
    user_id: 'test-user',
    date: '2026-03-01',
    duration_minutes: 480,
    quality: 4,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────

describe('calculateNutritionSummary', () => {
  it('returns zero values for empty meals', () => {
    const result = calculateNutritionSummary([], 7);
    expect(result.totalMeals).toBe(0);
    expect(result.avgCaloriesPerDay).toBe(0);
    expect(result.avgProteinPerDay).toBe(0);
    expect(result.daysTracked).toBe(0);
  });

  it('calculates correct averages for multiple meals', () => {
    const meals = [
      makeMeal({ date: '2026-03-01', calories: 600, protein: 40, carbs: 60, fat: 20 }),
      makeMeal({ date: '2026-03-01', calories: 400, protein: 30, carbs: 40, fat: 15 }),
      makeMeal({ date: '2026-03-02', calories: 700, protein: 50, carbs: 70, fat: 25 }),
    ];

    const result = calculateNutritionSummary(meals, 7);
    expect(result.totalMeals).toBe(3);
    expect(result.totalCalories).toBe(1700);
    expect(result.avgCaloriesPerDay).toBe(Math.round(1700 / 7)); // 243
    expect(result.avgProteinPerDay).toBe(Math.round(120 / 7)); // 17
    expect(result.avgCarbsPerDay).toBe(Math.round(170 / 7)); // 24
    expect(result.avgFatPerDay).toBe(Math.round(60 / 7)); // 9
    expect(result.daysTracked).toBe(2);
  });

  it('handles single day of meals', () => {
    const meals = [
      makeMeal({ date: '2026-03-01', calories: 2000, protein: 150, carbs: 200, fat: 80 }),
    ];

    const result = calculateNutritionSummary(meals, 1);
    expect(result.totalMeals).toBe(1);
    expect(result.avgCaloriesPerDay).toBe(2000);
    expect(result.daysTracked).toBe(1);
  });
});

describe('calculateTrainingSummary', () => {
  it('returns zero values for empty workouts', () => {
    const result = calculateTrainingSummary([]);
    expect(result.totalWorkouts).toBe(0);
    expect(result.totalDurationMinutes).toBe(0);
    expect(result.avgDurationMinutes).toBe(0);
    expect(result.daysWithWorkouts).toBe(0);
  });

  it('calculates correct totals and averages', () => {
    const workouts = [
      makeWorkout({ date: '2026-03-01', duration_minutes: 60, calories_burned: 400 }),
      makeWorkout({ date: '2026-03-01', duration_minutes: 30, calories_burned: 200 }),
      makeWorkout({ date: '2026-03-03', duration_minutes: 45, calories_burned: 300 }),
    ];

    const result = calculateTrainingSummary(workouts);
    expect(result.totalWorkouts).toBe(3);
    expect(result.totalDurationMinutes).toBe(135);
    expect(result.totalCaloriesBurned).toBe(900);
    expect(result.avgDurationMinutes).toBe(45); // 135/3 = 45
    expect(result.daysWithWorkouts).toBe(2);
  });

  it('handles workouts without duration', () => {
    const workouts = [
      makeWorkout({ duration_minutes: undefined, calories_burned: undefined }),
    ];

    const result = calculateTrainingSummary(workouts);
    expect(result.totalWorkouts).toBe(1);
    expect(result.totalDurationMinutes).toBe(0);
    expect(result.totalCaloriesBurned).toBe(0);
    expect(result.avgDurationMinutes).toBe(0);
  });
});

describe('calculateBodySummary', () => {
  it('returns hasData false for empty measurements', () => {
    const result = calculateBodySummary([]);
    expect(result.hasData).toBe(false);
    expect(result.weightChange).toBeUndefined();
  });

  it('calculates weight change between first and last measurement', () => {
    const measurements = [
      makeBody({ date: '2026-02-25', weight_kg: 90, body_fat_pct: 20 }),
      makeBody({ date: '2026-03-01', weight_kg: 88, body_fat_pct: 19 }),
    ];

    const result = calculateBodySummary(measurements);
    expect(result.hasData).toBe(true);
    expect(result.startWeight).toBe(90);
    expect(result.endWeight).toBe(88);
    expect(result.weightChange).toBe(-2);
    expect(result.bodyFatChange).toBe(-1);
  });

  it('handles single measurement', () => {
    const measurements = [
      makeBody({ date: '2026-03-01', weight_kg: 85 }),
    ];

    const result = calculateBodySummary(measurements);
    expect(result.hasData).toBe(true);
    expect(result.startWeight).toBe(85);
    expect(result.endWeight).toBe(85);
    expect(result.weightChange).toBe(0);
  });

  it('handles measurements without weight_kg', () => {
    const measurements = [
      makeBody({ weight_kg: undefined }),
    ];

    const result = calculateBodySummary(measurements);
    expect(result.hasData).toBe(false);
  });
});

describe('calculateSleepSummary', () => {
  it('returns zero values for empty sleep logs', () => {
    const result = calculateSleepSummary([]);
    expect(result.totalLogs).toBe(0);
    expect(result.avgDurationMinutes).toBe(0);
    expect(result.avgQuality).toBe(0);
    expect(result.daysTracked).toBe(0);
  });

  it('calculates correct averages', () => {
    const logs = [
      makeSleep({ date: '2026-03-01', duration_minutes: 480, quality: 4 }),
      makeSleep({ date: '2026-03-02', duration_minutes: 420, quality: 3 }),
      makeSleep({ date: '2026-03-03', duration_minutes: 540, quality: 5 }),
    ];

    const result = calculateSleepSummary(logs);
    expect(result.totalLogs).toBe(3);
    expect(result.avgDurationMinutes).toBe(480); // (480+420+540)/3 = 480
    expect(result.avgQuality).toBe(4); // (4+3+5)/3 = 4
    expect(result.daysTracked).toBe(3);
  });

  it('handles logs without duration or quality', () => {
    const logs = [
      makeSleep({ duration_minutes: undefined, quality: undefined }),
    ];

    const result = calculateSleepSummary(logs);
    expect(result.totalLogs).toBe(1);
    expect(result.avgDurationMinutes).toBe(0);
    expect(result.avgQuality).toBe(0);
    expect(result.daysTracked).toBe(1);
  });
});

describe('calculateStreak', () => {
  it('returns 0 for no activity', () => {
    const result = calculateStreak([], [], '2026-03-01');
    expect(result.currentStreak).toBe(0);
  });

  it('counts consecutive days from end date', () => {
    const meals = [
      makeMeal({ date: '2026-02-28' }),
      makeMeal({ date: '2026-03-01' }),
    ];
    const workouts = [
      makeWorkout({ date: '2026-02-27' }),
    ];

    const result = calculateStreak(meals, workouts, '2026-03-01');
    // 03-01 has meal, 02-28 has meal, 02-27 has workout = 3 consecutive days
    expect(result.currentStreak).toBe(3);
  });

  it('breaks streak on missing day', () => {
    const meals = [
      makeMeal({ date: '2026-02-26' }),
      // 02-27 missing
      makeMeal({ date: '2026-02-28' }),
      makeMeal({ date: '2026-03-01' }),
    ];

    const result = calculateStreak(meals, [], '2026-03-01');
    // 03-01 has meal, 02-28 has meal, 02-27 has NO activity -> streak = 2
    expect(result.currentStreak).toBe(2);
  });

  it('counts streak from workouts alone', () => {
    const workouts = [
      makeWorkout({ date: '2026-03-01' }),
    ];

    const result = calculateStreak([], workouts, '2026-03-01');
    expect(result.currentStreak).toBe(1);
  });
});

describe('getLastNDays', () => {
  it('returns correct range for 7 days', () => {
    const result = getLastNDays(7);
    const start = new Date(result.start);
    const end = new Date(result.end);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(6); // 7 days inclusive = 6 day diff
  });

  it('returns same date for 1 day', () => {
    const result = getLastNDays(1);
    expect(result.start).toBe(result.end);
  });
});

describe('getDateRange', () => {
  it('generates correct date array', () => {
    const result = getDateRange('2026-03-01', '2026-03-03');
    expect(result).toEqual(['2026-03-01', '2026-03-02', '2026-03-03']);
  });

  it('returns single date for same start and end', () => {
    const result = getDateRange('2026-03-01', '2026-03-01');
    expect(result).toEqual(['2026-03-01']);
  });

  it('handles month boundary', () => {
    const result = getDateRange('2026-02-27', '2026-03-02');
    expect(result).toHaveLength(4);
    expect(result[0]).toBe('2026-02-27');
    expect(result[3]).toBe('2026-03-02');
  });
});
