import { describe, it, expect } from 'vitest';
import {
  getISOWeek,
  getWeekStartDate,
  calculateExerciseVolume,
  inferMuscleGroup,
  detectPhase,
  aggregateWeeklyData,
} from '../usePeriodization';
import type { Workout, ExerciseSet } from '../../../../types/health';

// ── getISOWeek ──────────────────────────────────────────────────────

describe('getISOWeek', () => {
  it('returns correct ISO week for a known date', () => {
    // 2026-01-01 is a Thursday => ISO week 1
    expect(getISOWeek('2026-01-01')).toBe(1);
  });

  it('returns correct ISO week mid-year', () => {
    // 2026-03-02 is a Monday => ISO week 10
    expect(getISOWeek('2026-03-02')).toBe(10);
  });
});

// ── getWeekStartDate ────────────────────────────────────────────────

describe('getWeekStartDate', () => {
  it('returns Monday for a Wednesday', () => {
    // 2026-03-04 is a Wednesday => Monday is 2026-03-02
    expect(getWeekStartDate('2026-03-04')).toBe('2026-03-02');
  });

  it('returns same day for a Monday', () => {
    expect(getWeekStartDate('2026-03-02')).toBe('2026-03-02');
  });

  it('returns previous Monday for a Sunday', () => {
    // 2026-03-08 is a Sunday => Monday is 2026-03-02
    expect(getWeekStartDate('2026-03-08')).toBe('2026-03-02');
  });
});

// ── calculateExerciseVolume ─────────────────────────────────────────

describe('calculateExerciseVolume', () => {
  it('calculates volume as sets * reps * weight', () => {
    const exercise: ExerciseSet = { name: 'Bench Press', sets: 4, reps: 10, weight_kg: 60 };
    expect(calculateExerciseVolume(exercise)).toBe(2400); // 4 * 10 * 60
  });

  it('calculates bodyweight volume as sets * reps when no weight', () => {
    const exercise: ExerciseSet = { name: 'Push-ups', sets: 3, reps: 15 };
    expect(calculateExerciseVolume(exercise)).toBe(45); // 3 * 15
  });

  it('handles missing sets (defaults to 1)', () => {
    const exercise: ExerciseSet = { name: 'Plank', reps: 60, weight_kg: 0 };
    expect(calculateExerciseVolume(exercise)).toBe(60); // 1 * 60
  });

  it('handles zero weight correctly', () => {
    const exercise: ExerciseSet = { name: 'Running', sets: 1, reps: 30, weight_kg: 0 };
    expect(calculateExerciseVolume(exercise)).toBe(30); // 1 * 30 (bodyweight proxy)
  });
});

// ── inferMuscleGroup ────────────────────────────────────────────────

describe('inferMuscleGroup', () => {
  it('identifies chest exercises', () => {
    expect(inferMuscleGroup('Bankdruecken')).toBe('chest');
    expect(inferMuscleGroup('Bench Press')).toBe('chest');
  });

  it('identifies back exercises', () => {
    expect(inferMuscleGroup('Latziehen')).toBe('back');
    expect(inferMuscleGroup('Barbell Row')).toBe('back');
    expect(inferMuscleGroup('Deadlift')).toBe('back');
  });

  it('identifies shoulder exercises', () => {
    expect(inferMuscleGroup('Schulter Press')).toBe('shoulders');
    expect(inferMuscleGroup('Face Pull')).toBe('shoulders');
  });

  it('identifies leg exercises', () => {
    expect(inferMuscleGroup('Bulgarian Split Squat')).toBe('legs');
    expect(inferMuscleGroup('Hip Thrust')).toBe('legs');
    expect(inferMuscleGroup('Beinpresse')).toBe('legs');
  });

  it('identifies arm exercises', () => {
    expect(inferMuscleGroup('Bizeps Curl')).toBe('arms');
    expect(inferMuscleGroup('Trizeps Kabel')).toBe('arms');
  });

  it('identifies core exercises', () => {
    expect(inferMuscleGroup('Plank')).toBe('core');
    expect(inferMuscleGroup('Bauchpresse')).toBe('core');
  });

  it('returns other for unrecognized exercises', () => {
    expect(inferMuscleGroup('XYZ Exercise')).toBe('other');
  });
});

// ── detectPhase ─────────────────────────────────────────────────────

describe('detectPhase', () => {
  it('detects deload when volume < 60% of average', () => {
    expect(detectPhase(500, 1000)).toBe('deload');
    expect(detectPhase(100, 1000)).toBe('deload');
  });

  it('detects intensification when volume >= 115% of average', () => {
    expect(detectPhase(1200, 1000)).toBe('intensification');
    expect(detectPhase(1500, 1000)).toBe('intensification');
  });

  it('detects accumulation for normal volume', () => {
    expect(detectPhase(1000, 1000)).toBe('accumulation');
    expect(detectPhase(800, 1000)).toBe('accumulation');
    expect(detectPhase(1140, 1000)).toBe('accumulation');
  });

  it('returns unknown when average is 0', () => {
    expect(detectPhase(500, 0)).toBe('unknown');
  });
});

// ── aggregateWeeklyData ─────────────────────────────────────────────

describe('aggregateWeeklyData', () => {
  const makeWorkout = (date: string, exercises: ExerciseSet[]): Workout => ({
    id: Math.random().toString(),
    user_id: 'test-user',
    date,
    name: 'Test Workout',
    type: 'strength',
    exercises,
    created_at: date + 'T10:00:00Z',
  });

  it('returns empty array for no workouts', () => {
    expect(aggregateWeeklyData([])).toEqual([]);
  });

  it('groups workouts by week', () => {
    const workouts = [
      makeWorkout('2026-03-02', [{ name: 'Bench Press', sets: 4, reps: 10, weight_kg: 60 }]),
      makeWorkout('2026-03-04', [{ name: 'Squat', sets: 4, reps: 8, weight_kg: 80 }]),
      makeWorkout('2026-03-09', [{ name: 'Deadlift', sets: 3, reps: 5, weight_kg: 100 }]),
    ];
    const weeks = aggregateWeeklyData(workouts);
    expect(weeks).toHaveLength(2); // Week 10 and Week 11
  });

  it('calculates total volume correctly', () => {
    const workouts = [
      makeWorkout('2026-03-02', [
        { name: 'Bench Press', sets: 4, reps: 10, weight_kg: 60 },  // 2400
        { name: 'Row', sets: 3, reps: 10, weight_kg: 50 },          // 1500
      ]),
    ];
    const weeks = aggregateWeeklyData(workouts);
    expect(weeks[0].totalVolume).toBe(3900);
  });

  it('assigns phases based on volume', () => {
    const workouts = [
      makeWorkout('2026-02-02', [{ name: 'Bench Press', sets: 4, reps: 10, weight_kg: 60 }]), // 2400
      makeWorkout('2026-02-09', [{ name: 'Bench Press', sets: 4, reps: 10, weight_kg: 60 }]), // 2400
      makeWorkout('2026-02-16', [{ name: 'Bench Press', sets: 1, reps: 5, weight_kg: 40 }]),  // 200 — deload
    ];
    const weeks = aggregateWeeklyData(workouts);
    expect(weeks).toHaveLength(3);
    // Third week (200) should be detected as deload (< 60% of avg ~1666)
    const deloadWeek = weeks.find(w => w.totalVolume === 200);
    expect(deloadWeek?.phase).toBe('deload');
  });

  it('calculates muscle group breakdown', () => {
    const workouts = [
      makeWorkout('2026-03-02', [
        { name: 'Bench Press', sets: 4, reps: 10, weight_kg: 60 },
        { name: 'Squat', sets: 4, reps: 8, weight_kg: 80 },
      ]),
    ];
    const weeks = aggregateWeeklyData(workouts);
    const breakdown = weeks[0].muscleGroupBreakdown;
    expect(breakdown.length).toBeGreaterThanOrEqual(2);
    const chest = breakdown.find(b => b.muscleGroup === 'chest');
    const legs = breakdown.find(b => b.muscleGroup === 'legs');
    expect(chest).toBeDefined();
    expect(legs).toBeDefined();
  });

  it('sorts weeks by date ascending', () => {
    const workouts = [
      makeWorkout('2026-03-09', [{ name: 'Bench Press', sets: 1, reps: 1, weight_kg: 10 }]),
      makeWorkout('2026-03-02', [{ name: 'Bench Press', sets: 1, reps: 1, weight_kg: 10 }]),
    ];
    const weeks = aggregateWeeklyData(workouts);
    expect(weeks[0].startDate < weeks[1].startDate).toBe(true);
  });
});
