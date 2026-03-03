import { describe, it, expect } from 'vitest';
import {
  estimate1RM,
  calculateVolumeLoad,
  calculateWeeklyVolume,
  getStrengthProgression,
  getBest1RMFromSets,
} from '../progressiveOverload';
import type { Workout, WorkoutExerciseResult, SetResult } from '../../../types/health';

// ── Helper: Create mock workout ──────────────────────────────────────────

function mockWorkout(
  date: string,
  exercises: WorkoutExerciseResult[],
): Workout {
  return {
    id: `w-${date}`,
    user_id: 'test-user',
    date,
    name: 'Test Workout',
    type: 'strength',
    exercises: [],
    session_exercises: exercises,
    created_at: date,
  };
}

function mockExercise(
  name: string,
  sets: Partial<SetResult>[],
  skipped = false,
): WorkoutExerciseResult {
  return {
    name,
    plan_exercise_index: 0,
    skipped,
    sets: sets.map((s, i) => ({
      set_number: i + 1,
      target_reps: '8-10',
      completed: s.completed ?? true,
      actual_reps: s.actual_reps,
      actual_weight_kg: s.actual_weight_kg,
      ...s,
    })),
  };
}

// ── estimate1RM ──────────────────────────────────────────────────────────

describe('estimate1RM', () => {
  it('calculates 1RM using Epley formula (100kg x 10 reps)', () => {
    // 100 * (1 + 10/30) = 100 * 1.333... = 133.3
    expect(estimate1RM(100, 10)).toBe(133.3);
  });

  it('returns weight itself for 1 rep', () => {
    expect(estimate1RM(100, 1)).toBe(100);
  });

  it('returns 0 for zero weight', () => {
    expect(estimate1RM(0, 10)).toBe(0);
  });

  it('returns 0 for zero reps', () => {
    expect(estimate1RM(100, 0)).toBe(0);
  });

  it('returns 0 for negative weight', () => {
    expect(estimate1RM(-50, 10)).toBe(0);
  });

  it('calculates correctly for 80kg x 5 reps', () => {
    // 80 * (1 + 5/30) = 80 * 1.1667 = 93.3
    expect(estimate1RM(80, 5)).toBe(93.3);
  });

  it('calculates correctly for 60kg x 12 reps', () => {
    // 60 * (1 + 12/30) = 60 * 1.4 = 84
    expect(estimate1RM(60, 12)).toBe(84);
  });

  it('handles high reps (20+)', () => {
    // 50 * (1 + 20/30) = 50 * 1.6667 = 83.3
    expect(estimate1RM(50, 20)).toBe(83.3);
  });
});

// ── calculateVolumeLoad ──────────────────────────────────────────────────

describe('calculateVolumeLoad', () => {
  it('calculates total volume from multiple sets', () => {
    const sets = [
      { weight_kg: 100, reps: 10 },
      { weight_kg: 100, reps: 8 },
      { weight_kg: 90, reps: 10 },
    ];
    // 1000 + 800 + 900 = 2700
    expect(calculateVolumeLoad(sets)).toBe(2700);
  });

  it('returns 0 for empty sets', () => {
    expect(calculateVolumeLoad([])).toBe(0);
  });

  it('skips sets with zero weight', () => {
    const sets = [
      { weight_kg: 0, reps: 10 },
      { weight_kg: 100, reps: 5 },
    ];
    expect(calculateVolumeLoad(sets)).toBe(500);
  });

  it('skips sets with zero reps', () => {
    const sets = [
      { weight_kg: 100, reps: 0 },
      { weight_kg: 80, reps: 8 },
    ];
    expect(calculateVolumeLoad(sets)).toBe(640);
  });

  it('handles single set', () => {
    expect(calculateVolumeLoad([{ weight_kg: 120, reps: 3 }])).toBe(360);
  });
});

// ── getStrengthProgression ───────────────────────────────────────────────

describe('getStrengthProgression', () => {
  it('returns progression for a specific exercise', () => {
    const workouts = [
      mockWorkout('2026-01-01', [
        mockExercise('Bench Press', [
          { actual_weight_kg: 80, actual_reps: 10, completed: true },
          { actual_weight_kg: 80, actual_reps: 8, completed: true },
        ]),
      ]),
      mockWorkout('2026-01-08', [
        mockExercise('Bench Press', [
          { actual_weight_kg: 85, actual_reps: 10, completed: true },
          { actual_weight_kg: 85, actual_reps: 9, completed: true },
        ]),
      ]),
    ];

    const result = getStrengthProgression(workouts, 'Bench Press');
    expect(result).toHaveLength(2);

    // First workout: best 1RM = 80*(1+10/30) = 106.7
    expect(result[0].date).toBe('2026-01-01');
    expect(result[0].estimated1RM).toBe(106.7);
    expect(result[0].maxWeight).toBe(80);
    expect(result[0].maxReps).toBe(10);

    // Second workout: best 1RM = 85*(1+10/30) = 113.3
    expect(result[1].date).toBe('2026-01-08');
    expect(result[1].estimated1RM).toBe(113.3);
    expect(result[1].maxWeight).toBe(85);
  });

  it('returns empty array for non-existent exercise', () => {
    const workouts = [
      mockWorkout('2026-01-01', [
        mockExercise('Bench Press', [
          { actual_weight_kg: 80, actual_reps: 10, completed: true },
        ]),
      ]),
    ];

    expect(getStrengthProgression(workouts, 'Squat')).toHaveLength(0);
  });

  it('ignores skipped exercises', () => {
    const workouts = [
      mockWorkout('2026-01-01', [
        mockExercise('Bench Press', [
          { actual_weight_kg: 80, actual_reps: 10, completed: true },
        ], true), // skipped
      ]),
    ];

    expect(getStrengthProgression(workouts, 'Bench Press')).toHaveLength(0);
  });

  it('ignores incomplete sets', () => {
    const workouts = [
      mockWorkout('2026-01-01', [
        mockExercise('Bench Press', [
          { actual_weight_kg: 100, actual_reps: 5, completed: true },
          { actual_weight_kg: 100, actual_reps: 0, completed: false },
        ]),
      ]),
    ];

    const result = getStrengthProgression(workouts, 'Bench Press');
    expect(result).toHaveLength(1);
    expect(result[0].totalSets).toBe(1);
  });

  it('is case-insensitive for exercise names', () => {
    const workouts = [
      mockWorkout('2026-01-01', [
        mockExercise('Bench Press', [
          { actual_weight_kg: 80, actual_reps: 10, completed: true },
        ]),
      ]),
    ];

    expect(getStrengthProgression(workouts, 'bench press')).toHaveLength(1);
    expect(getStrengthProgression(workouts, 'BENCH PRESS')).toHaveLength(1);
  });

  it('sorts output chronologically', () => {
    const workouts = [
      mockWorkout('2026-02-01', [
        mockExercise('Squat', [
          { actual_weight_kg: 120, actual_reps: 5, completed: true },
        ]),
      ]),
      mockWorkout('2026-01-01', [
        mockExercise('Squat', [
          { actual_weight_kg: 100, actual_reps: 5, completed: true },
        ]),
      ]),
    ];

    const result = getStrengthProgression(workouts, 'Squat');
    expect(result[0].date).toBe('2026-01-01');
    expect(result[1].date).toBe('2026-02-01');
  });

  it('calculates total volume correctly', () => {
    const workouts = [
      mockWorkout('2026-01-01', [
        mockExercise('Deadlift', [
          { actual_weight_kg: 140, actual_reps: 5, completed: true },
          { actual_weight_kg: 140, actual_reps: 5, completed: true },
          { actual_weight_kg: 140, actual_reps: 3, completed: true },
        ]),
      ]),
    ];

    const result = getStrengthProgression(workouts, 'Deadlift');
    // 140*5 + 140*5 + 140*3 = 700 + 700 + 420 = 1820
    expect(result[0].totalVolume).toBe(1820);
  });
});

// ── calculateWeeklyVolume ────────────────────────────────────────────────

describe('calculateWeeklyVolume', () => {
  it('aggregates volume per ISO week', () => {
    // 2026-01-05 is a Monday (KW 2)
    // 2026-01-07 is a Wednesday (KW 2)
    const workouts = [
      mockWorkout('2026-01-05', [
        mockExercise('Bench Press', [
          { actual_weight_kg: 80, actual_reps: 10, completed: true },
        ]),
      ]),
      mockWorkout('2026-01-07', [
        mockExercise('Squat', [
          { actual_weight_kg: 100, actual_reps: 8, completed: true },
        ]),
      ]),
    ];

    const result = calculateWeeklyVolume(workouts);
    expect(result).toHaveLength(1);
    // 80*10 + 100*8 = 800 + 800 = 1600
    expect(result[0].totalVolume).toBe(1600);
  });

  it('returns empty array for empty workouts', () => {
    expect(calculateWeeklyVolume([])).toHaveLength(0);
  });

  it('filters by muscle group name', () => {
    const workouts = [
      mockWorkout('2026-01-05', [
        mockExercise('Bench Press', [
          { actual_weight_kg: 80, actual_reps: 10, completed: true },
        ]),
        mockExercise('Squat', [
          { actual_weight_kg: 100, actual_reps: 8, completed: true },
        ]),
      ]),
    ];

    const benchOnly = calculateWeeklyVolume(workouts, 'Bench');
    expect(benchOnly).toHaveLength(1);
    expect(benchOnly[0].totalVolume).toBe(800); // only bench: 80*10

    const squatOnly = calculateWeeklyVolume(workouts, 'Squat');
    expect(squatOnly[0].totalVolume).toBe(800); // only squat: 100*8
  });

  it('skips workouts without session_exercises', () => {
    const workouts: Workout[] = [
      {
        id: 'w1',
        user_id: 'test',
        date: '2026-01-05',
        name: 'Quick Workout',
        type: 'strength',
        exercises: [],
        created_at: '2026-01-05',
        // No session_exercises
      },
    ];

    expect(calculateWeeklyVolume(workouts)).toHaveLength(0);
  });
});

// ── getBest1RMFromSets ───────────────────────────────────────────────────

describe('getBest1RMFromSets', () => {
  it('returns best 1RM from a set of SetResults', () => {
    const sets: SetResult[] = [
      { set_number: 1, target_reps: '10', actual_weight_kg: 80, actual_reps: 10, completed: true },
      { set_number: 2, target_reps: '10', actual_weight_kg: 80, actual_reps: 8, completed: true },
      { set_number: 3, target_reps: '10', actual_weight_kg: 90, actual_reps: 5, completed: true },
    ];

    // Set 1: 80*(1+10/30) = 106.7
    // Set 2: 80*(1+8/30) = 101.3
    // Set 3: 90*(1+5/30) = 105
    // Best = 106.7
    expect(getBest1RMFromSets(sets)).toBe(106.7);
  });

  it('ignores incomplete sets', () => {
    const sets: SetResult[] = [
      { set_number: 1, target_reps: '10', actual_weight_kg: 200, actual_reps: 1, completed: false },
      { set_number: 2, target_reps: '10', actual_weight_kg: 80, actual_reps: 10, completed: true },
    ];

    expect(getBest1RMFromSets(sets)).toBe(106.7);
  });

  it('returns 0 for no completed sets', () => {
    const sets: SetResult[] = [
      { set_number: 1, target_reps: '10', completed: false },
    ];

    expect(getBest1RMFromSets(sets)).toBe(0);
  });

  it('returns 0 for empty sets', () => {
    expect(getBest1RMFromSets([])).toBe(0);
  });
});
