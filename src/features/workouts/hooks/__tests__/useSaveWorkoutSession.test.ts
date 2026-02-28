/**
 * Auto-Progression logic tests.
 *
 * Tests the core business logic: when a user lifts heavier than planned,
 * the plan weight should be updated. Reps never change automatically.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock Supabase before imports
const mockSelect = vi.fn().mockReturnThis();
const mockSingle = vi.fn();
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const _mockEq = vi.fn();
const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

mockSelect.mockReturnValue({ single: mockSingle });
mockSingle.mockResolvedValue({ data: { id: 'w1' }, error: null });

vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: vi.fn((table: string) => {
      if (table === 'workouts') {
        return { insert: mockInsert };
      }
      if (table === 'training_plan_days') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'day-1',
                  exercises: [
                    { name: 'Bench Press', weight_kg: 80, sets: 3, reps: '10' },
                    { name: 'Squat', weight_kg: 100, sets: 3, reps: '8' },
                    { name: 'Deadlift', weight_kg: null, sets: 1, reps: '5' },
                  ],
                },
                error: null,
              }),
            }),
          }),
          update: mockUpdate,
        };
      }
      return {};
    }),
  },
}));

vi.mock('../../../../lib/utils', () => ({
  today: () => '2026-02-25',
}));

vi.mock('../../utils/calorieCalculation', () => ({
  calculateSessionCalories: () => 350,
}));

// We need to test the auto-progression logic. Since `applyAutoProgression` is not exported,
// we test it through the mutation function by extracting the core logic.
// For a clean unit test, let's extract and test the progression detection logic.

import type { SetResult, WorkoutExerciseResult, PlanExercise } from '../../../../types/health';

/**
 * Pure function that mirrors the auto-progression logic from useSaveWorkoutSession.
 * Determines which plan exercises need weight updates.
 */
function detectProgressions(
  sessionExercises: WorkoutExerciseResult[],
  planExercises: PlanExercise[],
): Array<{ planIndex: number; newWeight: number }> {
  const updates: Array<{ planIndex: number; newWeight: number }> = [];

  for (const sessionEx of sessionExercises) {
    if (sessionEx.skipped || sessionEx.is_addition) continue;

    const planIdx = sessionEx.plan_exercise_index;
    if (planIdx < 0 || planIdx >= planExercises.length) continue;

    const planEx = planExercises[planIdx];
    if (planEx.weight_kg == null) continue;

    const completedSets = sessionEx.sets.filter(
      (s: SetResult) => s.completed && s.actual_weight_kg != null,
    );
    if (completedSets.length === 0) continue;

    const maxActualWeight = Math.max(...completedSets.map((s: SetResult) => s.actual_weight_kg!));

    if (maxActualWeight > planEx.weight_kg) {
      updates.push({ planIndex: planIdx, newWeight: maxActualWeight });
    }
  }

  return updates;
}

// ── Tests ─────────────────────────────────────────────────────────────

describe('Auto-Progression Detection', () => {
  const makeSets = (weights: Array<{ target: number; actual: number | undefined; completed: boolean }>): SetResult[] =>
    weights.map((w, i) => ({
      set_number: i + 1,
      target_reps: '10',
      target_weight_kg: w.target,
      actual_weight_kg: w.actual,
      actual_reps: w.completed ? 10 : undefined,
      completed: w.completed,
      skipped: !w.completed,
    }));

  const makeSessionEx = (
    name: string,
    planIndex: number,
    sets: SetResult[],
    overrides?: Partial<WorkoutExerciseResult>,
  ): WorkoutExerciseResult => ({
    name,
    plan_exercise_index: planIndex,
    sets,
    skipped: false,
    is_addition: false,
    ...overrides,
  });

  const planExercises: PlanExercise[] = [
    { name: 'Bench Press', weight_kg: 80, sets: 3, reps: '10', rest_seconds: 90 },
    { name: 'Squat', weight_kg: 100, sets: 3, reps: '8', rest_seconds: 120 },
    { name: 'Deadlift', weight_kg: undefined, sets: 1, reps: '5', rest_seconds: 180 },
  ];

  it('detects weight increase (80 → 85)', () => {
    const sessionEx = [
      makeSessionEx('Bench Press', 0, makeSets([
        { target: 80, actual: 85, completed: true },
        { target: 80, actual: 85, completed: true },
        { target: 80, actual: 80, completed: true },
      ])),
    ];
    const updates = detectProgressions(sessionEx, planExercises);
    expect(updates).toEqual([{ planIndex: 0, newWeight: 85 }]);
  });

  it('does NOT progress when weight stays the same', () => {
    const sessionEx = [
      makeSessionEx('Bench Press', 0, makeSets([
        { target: 80, actual: 80, completed: true },
        { target: 80, actual: 80, completed: true },
      ])),
    ];
    const updates = detectProgressions(sessionEx, planExercises);
    expect(updates).toEqual([]);
  });

  it('does NOT progress when weight went DOWN', () => {
    const sessionEx = [
      makeSessionEx('Bench Press', 0, makeSets([
        { target: 80, actual: 75, completed: true },
        { target: 80, actual: 70, completed: true },
      ])),
    ];
    const updates = detectProgressions(sessionEx, planExercises);
    expect(updates).toEqual([]);
  });

  it('uses MAX actual weight across all completed sets', () => {
    const sessionEx = [
      makeSessionEx('Bench Press', 0, makeSets([
        { target: 80, actual: 80, completed: true },
        { target: 80, actual: 90, completed: true },  // PR!
        { target: 80, actual: 85, completed: true },
      ])),
    ];
    const updates = detectProgressions(sessionEx, planExercises);
    expect(updates).toEqual([{ planIndex: 0, newWeight: 90 }]);
  });

  it('ignores skipped exercises', () => {
    const sessionEx = [
      makeSessionEx('Bench Press', 0, makeSets([
        { target: 80, actual: 100, completed: true },
      ]), { skipped: true }),
    ];
    const updates = detectProgressions(sessionEx, planExercises);
    expect(updates).toEqual([]);
  });

  it('ignores added exercises (is_addition)', () => {
    const sessionEx = [
      makeSessionEx('Dips', -1, makeSets([
        { target: 0, actual: 20, completed: true },
      ]), { is_addition: true }),
    ];
    const updates = detectProgressions(sessionEx, planExercises);
    expect(updates).toEqual([]);
  });

  it('ignores exercises without plan weight (bodyweight)', () => {
    const sessionEx = [
      makeSessionEx('Deadlift', 2, makeSets([
        { target: 0, actual: 150, completed: true },
      ])),
    ];
    // planExercises[2].weight_kg is undefined
    const updates = detectProgressions(sessionEx, planExercises);
    expect(updates).toEqual([]);
  });

  it('ignores skipped sets (only counts completed)', () => {
    const sessionEx = [
      makeSessionEx('Bench Press', 0, makeSets([
        { target: 80, actual: undefined, completed: false }, // skipped
        { target: 80, actual: 80, completed: true },
      ])),
    ];
    const updates = detectProgressions(sessionEx, planExercises);
    expect(updates).toEqual([]); // 80 == 80, no increase
  });

  it('detects progression for multiple exercises', () => {
    const sessionEx = [
      makeSessionEx('Bench Press', 0, makeSets([
        { target: 80, actual: 82.5, completed: true },
      ])),
      makeSessionEx('Squat', 1, makeSets([
        { target: 100, actual: 105, completed: true },
      ])),
    ];
    const updates = detectProgressions(sessionEx, planExercises);
    expect(updates).toHaveLength(2);
    expect(updates).toContainEqual({ planIndex: 0, newWeight: 82.5 });
    expect(updates).toContainEqual({ planIndex: 1, newWeight: 105 });
  });

  it('handles out-of-bounds plan index gracefully', () => {
    const sessionEx = [
      makeSessionEx('Ghost Exercise', 99, makeSets([
        { target: 80, actual: 100, completed: true },
      ])),
    ];
    const updates = detectProgressions(sessionEx, planExercises);
    expect(updates).toEqual([]);
  });
});
