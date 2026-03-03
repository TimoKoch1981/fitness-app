/**
 * usePeriodization — Queries workout data for the last 8 weeks
 * and aggregates it into weekly periodization metrics.
 *
 * Groups workouts by ISO week and calculates:
 * - Total volume (sets x reps x weight)
 * - Average intensity (average weight used)
 * - Muscle group breakdown
 * - Deload week detection (volume < 60% of average)
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Workout, ExerciseSet } from '../../../types/health';
import type { WeekData, MuscleGroupVolume, PeriodizationPhase, PeriodizationData } from '../types/periodization';

const WEEKS_TO_FETCH = 8;
const DELOAD_THRESHOLD = 0.6; // 60% of average = deload

/**
 * Returns ISO week number for a given date string.
 */
export function getISOWeek(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00');
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Returns the Monday of the ISO week for a given date string.
 * Uses UTC-safe arithmetic to avoid timezone shifting.
 */
export function getWeekStartDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = date.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // offset to Monday
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().split('T')[0];
}

/**
 * Calculates volume for a single exercise set.
 * Volume = sets * reps * weight_kg. Falls back to sets * reps if no weight.
 */
export function calculateExerciseVolume(exercise: ExerciseSet): number {
  const sets = exercise.sets ?? 1;
  const reps = exercise.reps ?? 0;
  const weight = exercise.weight_kg ?? 0;
  if (weight > 0) {
    return sets * reps * weight;
  }
  // Bodyweight or cardio: just count sets * reps as volume proxy
  return sets * reps;
}

/**
 * Infers muscle group from exercise name using simple keyword matching.
 * Used when exercise_type or muscle_groups data is not available.
 */
export function inferMuscleGroup(exerciseName: string): string {
  const name = exerciseName.toLowerCase();

  // Legs — check early because compound words like "Beinpresse" contain "press"
  if (name.includes('squat') || name.includes('leg') || name.includes('bein') || name.includes('lunge')
    || name.includes('split') || name.includes('hip') || name.includes('glut') || name.includes('thrust')
    || name.includes('farmer') || name.includes('calf') || name.includes('wade')) {
    return 'legs';
  }
  // Core — check before shoulders because "Bauchpresse" contains "press"
  if (name.includes('core') || name.includes('plank') || name.includes('crunch')
    || name.includes('bauch') || name.includes('rumpf')
    || (name.includes('ab') && !name.includes('kabel'))) {
    return 'core';
  }
  // Shoulders — check "face pull" before back's "pull"
  if (name.includes('face pull') || name.includes('shoulder') || name.includes('schulter')
    || name.includes('raise') || name.includes('landmine') || name.includes('delt')
    || (name.includes('press') && !name.includes('bench') && !name.includes('bank'))) {
    return 'shoulders';
  }
  // Chest
  if (name.includes('bench') || name.includes('bank') || name.includes('brust') || name.includes('chest')
    || name.includes('push-up') || name.includes('fly') || name.includes('liegestuetz')) {
    return 'chest';
  }
  // Back — "pull" now won't catch "face pull" (already caught above)
  if (name.includes('row') || name.includes('ruder') || name.includes('lat') || name.includes('pull')
    || name.includes('deadlift') || name.includes('kreuz') || name.includes('rdl') || name.includes('hyperext')
    || name.includes('ruecken') || name.includes('back')) {
    return 'back';
  }
  // Arms
  if (name.includes('bicep') || name.includes('bizep') || name.includes('curl') || name.includes('tricep')
    || name.includes('trizep') || name.includes('arm')) {
    return 'arms';
  }

  return 'other';
}

/**
 * Detects the phase of a week based on its volume relative to average.
 */
export function detectPhase(weekVolume: number, avgVolume: number): PeriodizationPhase {
  if (avgVolume === 0) return 'unknown';
  const ratio = weekVolume / avgVolume;
  if (ratio < DELOAD_THRESHOLD) return 'deload';
  if (ratio >= 1.15) return 'intensification';
  return 'accumulation';
}

/**
 * Aggregates workout data into weekly periodization data.
 * Pure function — testable without React hooks.
 */
export function aggregateWeeklyData(workouts: Workout[]): WeekData[] {
  if (!workouts || workouts.length === 0) return [];

  // Group workouts by ISO week
  const weekMap = new Map<string, Workout[]>();

  for (const workout of workouts) {
    const weekStart = getWeekStartDate(workout.date);
    const existing = weekMap.get(weekStart);
    if (existing) {
      existing.push(workout);
    } else {
      weekMap.set(weekStart, [workout]);
    }
  }

  // Build WeekData for each week
  const weeks: WeekData[] = [];

  for (const [weekStart, weekWorkouts] of weekMap.entries()) {
    const weekNumber = getISOWeek(weekStart);
    let totalVolume = 0;
    let totalSets = 0;
    let totalWeight = 0;
    let weightCount = 0;
    const muscleGroupMap = new Map<string, { volume: number; sets: number }>();

    for (const workout of weekWorkouts) {
      const exercises = workout.exercises ?? [];
      for (const ex of exercises) {
        const volume = calculateExerciseVolume(ex);
        const sets = ex.sets ?? 1;
        totalVolume += volume;
        totalSets += sets;

        if (ex.weight_kg && ex.weight_kg > 0) {
          totalWeight += ex.weight_kg;
          weightCount++;
        }

        const muscleGroup = inferMuscleGroup(ex.name);
        const existing = muscleGroupMap.get(muscleGroup);
        if (existing) {
          existing.volume += volume;
          existing.sets += sets;
        } else {
          muscleGroupMap.set(muscleGroup, { volume, sets });
        }
      }
    }

    const muscleGroupBreakdown: MuscleGroupVolume[] = Array.from(muscleGroupMap.entries()).map(
      ([muscleGroup, data]) => ({
        muscleGroup,
        volume: Math.round(data.volume),
        sets: data.sets,
      })
    );

    weeks.push({
      weekLabel: `KW ${weekNumber}`,
      weekNumber,
      startDate: weekStart,
      totalVolume: Math.round(totalVolume),
      totalSets,
      avgIntensity: weightCount > 0 ? Math.round(totalWeight / weightCount) : 0,
      workoutCount: weekWorkouts.length,
      muscleGroupBreakdown,
      phase: 'unknown', // Will be set after all weeks are processed
    });
  }

  // Sort by startDate ascending
  weeks.sort((a, b) => a.startDate.localeCompare(b.startDate));

  // Calculate average volume and assign phases
  const avgVolume = weeks.length > 0
    ? weeks.reduce((sum, w) => sum + w.totalVolume, 0) / weeks.length
    : 0;

  for (const week of weeks) {
    week.phase = detectPhase(week.totalVolume, avgVolume);
  }

  return weeks;
}

export function usePeriodization(weeksToFetch = WEEKS_TO_FETCH): PeriodizationData {
  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - weeksToFetch * 7);
    return d.toISOString().split('T')[0];
  }, [weeksToFetch]);

  const { data: workouts, isLoading } = useQuery({
    queryKey: ['periodization-workouts', startDate],
    queryFn: async (): Promise<Workout[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .order('date', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const weeks = useMemo(() => aggregateWeeklyData(workouts ?? []), [workouts]);

  const avgWeeklyVolume = useMemo(() => {
    if (weeks.length === 0) return 0;
    return Math.round(weeks.reduce((sum, w) => sum + w.totalVolume, 0) / weeks.length);
  }, [weeks]);

  return { weeks, avgWeeklyVolume, isLoading };
}
