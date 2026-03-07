/**
 * doubleProgression.ts — Double Progression Auto-Kalibrierung
 *
 * Pure Functions (kein Supabase, keine Side Effects).
 * Analysiert Workout-Historie und erkennt Muster fuer automatische Gewichtsanpassung:
 *
 * - Obergrenze 2× hintereinander erreicht → +2.5kg (Iso) oder +5kg (Compound)
 * - Untergrenze 2× nicht geschafft → −5% Gewicht
 *
 * Konzept: KONZEPT_KI_TRAINER.md Lines 200-220 (Double Progression)
 * Quelle: Helms et al. 2015 (PMID:25530497), Schoenfeld 2010 (PMID:20847704)
 */

import type { Workout, TrainingPlanDay } from '../../../types/health';
import { matchExerciseToReference } from '../hooks/useCalibration';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProgressionSuggestion {
  exerciseName: string;
  planDayId: string;
  exerciseIndex: number;
  currentWeight: number;
  suggestedWeight: number;
  reason: 'upper_bound_hit' | 'lower_bound_miss';
  direction: 'increase' | 'decrease';
  /** Number of consecutive sessions this pattern was observed */
  consecutiveSessions: number;
}

// ---------------------------------------------------------------------------
// Main Analysis Function
// ---------------------------------------------------------------------------

/**
 * Analyze workout history for Double Progression patterns.
 *
 * @param recentWorkouts - Last 3-5 workouts for the same plan (newest first)
 * @param planDays - Current training plan days with exercises
 * @returns Array of progression suggestions
 */
export function analyzeDoubleProgression(
  recentWorkouts: Workout[],
  planDays: TrainingPlanDay[],
): ProgressionSuggestion[] {
  if (recentWorkouts.length < 2) return [];

  const suggestions: ProgressionSuggestion[] = [];

  for (const day of planDays) {
    for (let exIdx = 0; exIdx < day.exercises.length; exIdx++) {
      const planEx = day.exercises[exIdx];

      // Skip exercises without weight or rep range
      if (planEx.weight_kg == null || !planEx.reps) continue;

      // Parse rep range
      const range = parseRepRange(planEx.reps);
      if (!range) continue;

      // Find this exercise in recent workouts
      const exerciseHistory = findExerciseHistory(
        planEx.name,
        recentWorkouts,
      );

      if (exerciseHistory.length < 2) continue;

      // Check for upper bound pattern (all sets hit max reps)
      const upperBoundStreak = countConsecutiveUpperBound(exerciseHistory, range.upper);
      if (upperBoundStreak >= 2) {
        const isCompound = checkIsCompound(planEx.name);
        const increment = isCompound ? 5 : 2.5;
        const newWeight = roundToNearest(planEx.weight_kg + increment, 2.5);

        suggestions.push({
          exerciseName: planEx.name,
          planDayId: day.id,
          exerciseIndex: exIdx,
          currentWeight: planEx.weight_kg,
          suggestedWeight: newWeight,
          reason: 'upper_bound_hit',
          direction: 'increase',
          consecutiveSessions: upperBoundStreak,
        });
        continue;
      }

      // Check for lower bound pattern (can't hit min reps)
      const lowerBoundStreak = countConsecutiveLowerBoundMiss(exerciseHistory, range.lower);
      if (lowerBoundStreak >= 2) {
        const newWeight = roundToNearest(planEx.weight_kg * 0.95, 2.5);

        suggestions.push({
          exerciseName: planEx.name,
          planDayId: day.id,
          exerciseIndex: exIdx,
          currentWeight: planEx.weight_kg,
          suggestedWeight: Math.max(newWeight, 2.5), // Never suggest below 2.5kg
          reason: 'lower_bound_miss',
          direction: 'decrease',
          consecutiveSessions: lowerBoundStreak,
        });
      }
    }
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Parse a rep range string like "8-12", "10", "8-10".
 * Returns { lower, upper } or null if unparseable.
 */
export function parseRepRange(reps: string): { lower: number; upper: number } | null {
  const trimmed = reps.trim();

  // Range format: "8-12"
  const rangeMatch = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)$/);
  if (rangeMatch) {
    return {
      lower: parseInt(rangeMatch[1], 10),
      upper: parseInt(rangeMatch[2], 10),
    };
  }

  // Single number: "10" → treat as exact target (lower=upper)
  const singleMatch = trimmed.match(/^(\d+)$/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10);
    return { lower: val, upper: val };
  }

  return null;
}

/**
 * Check if an exercise is a compound movement (→ larger weight increments).
 * Uses the BW-Multiplier reference table for matching.
 */
function checkIsCompound(exerciseName: string): boolean {
  const matched = matchExerciseToReference(exerciseName);
  if (!matched) return false;

  // Compound exercises from the BW-Multiplier table (higher multipliers)
  const compoundNames = [
    'Bankdruecken', 'Kniebeuge', 'Kreuzheben', 'Schulterdruecken',
    'Rudern', 'Latzug', 'Beinpresse',
  ];
  return compoundNames.includes(matched.name_de);
}

/**
 * Find session data for a specific exercise across workout history.
 * Returns array of { sets with actual_reps } per session, newest first.
 */
function findExerciseHistory(
  exerciseName: string,
  workouts: Workout[],
): Array<{ reps: number[] }> {
  const results: Array<{ reps: number[] }> = [];
  const normalized = exerciseName.toLowerCase().trim();

  for (const workout of workouts) {
    if (!workout.session_exercises) continue;

    const matching = workout.session_exercises.find(
      e => e.name.toLowerCase().trim() === normalized && !e.skipped,
    );

    if (matching) {
      const completedReps = matching.sets
        .filter(s => s.completed && s.actual_reps != null)
        .map(s => s.actual_reps!);

      if (completedReps.length > 0) {
        results.push({ reps: completedReps });
      }
    }
  }

  return results;
}

/**
 * Count consecutive sessions (from newest) where ALL sets hit the upper rep bound.
 */
function countConsecutiveUpperBound(
  history: Array<{ reps: number[] }>,
  upperBound: number,
): number {
  let streak = 0;

  for (const session of history) {
    if (session.reps.every(r => r >= upperBound)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Count consecutive sessions (from newest) where ANY set missed the lower rep bound.
 */
function countConsecutiveLowerBoundMiss(
  history: Array<{ reps: number[] }>,
  lowerBound: number,
): number {
  let streak = 0;

  for (const session of history) {
    if (session.reps.some(r => r < lowerBound)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Round a number to the nearest multiple of step (typically 2.5 kg).
 */
function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}
