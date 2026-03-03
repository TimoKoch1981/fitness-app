/**
 * Progressive Overload Calculations — 1RM estimation, volume load,
 * weekly volume, and strength progression tracking.
 *
 * All functions are pure math (no React, no side effects).
 *
 * References:
 * - Epley Formula: Epley, B. (1985). Poundage Chart.
 * - Volume Load: Schoenfeld et al. (2017). Dose-response relationship
 *   between weekly resistance training volume and increases in muscle mass.
 */

import type { Workout, WorkoutExerciseResult, SetResult } from '../../types/health';

// ── Types ────────────────────────────────────────────────────────────────

/** A single completed set with weight and reps */
export interface CompletedSet {
  weight_kg: number;
  reps: number;
}

/** Data point for strength progression over time */
export interface StrengthProgressionPoint {
  date: string;
  estimated1RM: number;
  maxWeight: number;
  maxReps: number;
  totalVolume: number;
  totalSets: number;
}

/** Weekly volume summary per muscle group */
export interface WeeklyVolumePoint {
  weekLabel: string;   // e.g. "KW 10" or "W10"
  weekStart: string;   // ISO date of Monday
  totalVolume: number; // sum of (weight * reps) across all sets
  totalSets: number;
}

// ── Core Calculations ────────────────────────────────────────────────────

/**
 * Estimate 1-rep maximum using Epley formula.
 * Formula: 1RM = weight * (1 + reps / 30)
 *
 * @param weight - Weight in kg
 * @param reps - Number of repetitions (must be >= 1)
 * @returns Estimated 1RM in kg, rounded to 1 decimal
 */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps < 1) return 0;
  // For 1 rep, 1RM = weight itself
  if (reps === 1) return weight;
  const oneRM = weight * (1 + reps / 30);
  return Math.round(oneRM * 10) / 10;
}

/**
 * Calculate volume load for a set of completed sets.
 * Volume Load = sum of (weight * reps) for each set.
 *
 * @param sets - Array of completed sets with weight and reps
 * @returns Total volume load in kg
 */
export function calculateVolumeLoad(sets: CompletedSet[]): number {
  return sets.reduce((sum, set) => {
    if (set.weight_kg <= 0 || set.reps <= 0) return sum;
    return sum + set.weight_kg * set.reps;
  }, 0);
}

/**
 * Calculate weekly volume for a specific muscle group from workout history.
 * Groups workouts by ISO week and sums volume for exercises matching
 * the muscle group (matched by exercise name containing the group name,
 * or by the workout session exercises).
 *
 * @param workouts - Array of workouts (with session_exercises)
 * @param muscleGroup - Optional muscle group filter (case-insensitive substring match on exercise name)
 * @returns Array of weekly volume points, oldest first
 */
export function calculateWeeklyVolume(
  workouts: Workout[],
  muscleGroup?: string,
): WeeklyVolumePoint[] {
  const weekMap = new Map<string, { weekLabel: string; weekStart: string; totalVolume: number; totalSets: number }>();

  // Sort workouts oldest first
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date));

  for (const w of sorted) {
    const sessionExercises = w.session_exercises as WorkoutExerciseResult[] | undefined;
    if (!sessionExercises) continue;

    const weekStart = getISOWeekStart(w.date);
    const weekNumber = getISOWeekNumber(w.date);
    const year = new Date(w.date).getFullYear();
    const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;
    const weekLabel = `KW ${weekNumber}`;

    for (const ex of sessionExercises) {
      if (ex.skipped) continue;

      // Filter by muscle group if specified
      if (muscleGroup && !ex.name.toLowerCase().includes(muscleGroup.toLowerCase())) {
        continue;
      }

      const completedSets = ex.sets.filter(s => s.completed);
      const volume = completedSets.reduce(
        (sum, s) => sum + (s.actual_reps ?? 0) * (s.actual_weight_kg ?? 0),
        0,
      );

      const existing = weekMap.get(weekKey);
      if (existing) {
        existing.totalVolume += volume;
        existing.totalSets += completedSets.length;
      } else {
        weekMap.set(weekKey, {
          weekLabel,
          weekStart,
          totalVolume: volume,
          totalSets: completedSets.length,
        });
      }
    }
  }

  return Array.from(weekMap.values());
}

/**
 * Get strength progression data for a specific exercise over time.
 * Returns one data point per workout session where the exercise was performed.
 *
 * @param workoutHistory - Array of workouts (with session_exercises), any order
 * @param exerciseName - Name of the exercise (case-insensitive match)
 * @returns Array of progression points, oldest first
 */
export function getStrengthProgression(
  workoutHistory: Workout[],
  exerciseName: string,
): StrengthProgressionPoint[] {
  const points: StrengthProgressionPoint[] = [];

  // Sort oldest first for chronological output
  const sorted = [...workoutHistory].sort((a, b) => a.date.localeCompare(b.date));

  for (const w of sorted) {
    const sessionExercises = w.session_exercises as WorkoutExerciseResult[] | undefined;
    if (!sessionExercises) continue;

    const match = sessionExercises.find(
      ex => ex.name.toLowerCase() === exerciseName.toLowerCase() && !ex.skipped,
    );
    if (!match) continue;

    const completedSets = match.sets.filter(s => s.completed);
    if (completedSets.length === 0) continue;

    // Find best set for 1RM estimation
    let best1RM = 0;
    let maxWeight = 0;
    let maxReps = 0;

    for (const s of completedSets) {
      const w_kg = s.actual_weight_kg ?? 0;
      const reps = s.actual_reps ?? 0;
      if (w_kg > maxWeight) maxWeight = w_kg;
      if (reps > maxReps) maxReps = reps;

      const est = estimate1RM(w_kg, reps);
      if (est > best1RM) best1RM = est;
    }

    const totalVolume = completedSets.reduce(
      (sum, s) => sum + (s.actual_reps ?? 0) * (s.actual_weight_kg ?? 0),
      0,
    );

    points.push({
      date: w.date,
      estimated1RM: best1RM,
      maxWeight,
      maxReps,
      totalVolume: Math.round(totalVolume),
      totalSets: completedSets.length,
    });
  }

  return points;
}

/**
 * Extract the best estimated 1RM from a single set of SetResults.
 * Useful for showing current session 1RM.
 */
export function getBest1RMFromSets(sets: SetResult[]): number {
  let best = 0;
  for (const s of sets) {
    if (!s.completed) continue;
    const est = estimate1RM(s.actual_weight_kg ?? 0, s.actual_reps ?? 0);
    if (est > best) best = est;
  }
  return best;
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Get the ISO week number for a date.
 */
function getISOWeekNumber(dateStr: string): number {
  const date = new Date(dateStr);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number (make Sunday=7)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNum;
}

/**
 * Get the Monday of the ISO week for a date.
 */
function getISOWeekStart(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}
