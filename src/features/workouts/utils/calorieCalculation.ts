/**
 * Session calorie calculation for live workout tracking.
 * Uses MET values from the training skill knowledge base.
 *
 * @reference docs/WISSENSCHAFTLICHE_GRUNDLAGEN.md
 * @reference lib/ai/skills/training.ts (MET values)
 */

import { calculateActivityCalories } from '../../../lib/calculations/tdee';
import type { WorkoutExerciseResult, WarmupResult } from '../../../types/health';

// MET values for common exercise types (from Ainsworth 2024 Compendium)
const MET_VALUES: Record<string, number> = {
  // Strength
  strength: 5.0,
  strength_vigorous: 6.0,
  // Cardio
  walking: 3.5,
  jogging: 7.0,
  running: 9.8,
  running_fast: 11.5,
  cycling: 7.5,
  cycling_light: 5.5,
  rowing: 7.0,
  swimming: 8.0,
  jump_rope: 12.3,
  elliptical: 5.0,
  stairmaster: 9.0,
  // HIIT
  hiit: 8.0,
  circuit_training: 8.0,
  // Flexibility / Mind-Body
  yoga: 3.0,
  yoga_hatha: 2.5,
  yoga_vinyasa: 4.0,
  yoga_power: 4.5,
  yoga_ashtanga: 5.0,
  yoga_yin: 2.0,
  yoga_restorative: 1.5,
  yoga_bikram: 5.0,
  yoga_kundalini: 3.0,
  sun_salutation: 3.5,
  stretching: 2.5,
  pilates: 3.0,
  pilates_reformer: 4.0,
  // Tai Chi
  tai_chi: 3.0,
  tai_chi_yang24: 3.0,
  tai_chi_yang48: 3.0,
  tai_chi_chen: 4.0,
  tai_chi_qigong: 2.5,
  // Five Tibetans
  five_tibetans: 3.5,
  // Sports
  boxing: 7.8,
  kickboxing: 10.3,
  martial_arts: 8.0,
};

/**
 * Guess MET value from a warm-up description (free text).
 * Matches common German and English cardio keywords.
 */
export function guessWarmupMET(description: string): number {
  const lower = description.toLowerCase();

  if (/lauf(band|en)|joggen|jogging|running|run/.test(lower)) return 7.0;
  if (/gehen|walking|walk|spazier/.test(lower)) return 3.5;
  if (/rad|bike|cycling|fahrrad|ergometer/.test(lower)) return 5.5;
  if (/ruder|rowing|row/.test(lower)) return 7.0;
  if (/schwimm|swim/.test(lower)) return 8.0;
  if (/seil|rope|skip/.test(lower)) return 12.3;
  if (/crosstrainer|elliptical/.test(lower)) return 5.0;
  if (/stepper|stairmaster|treppe/.test(lower)) return 9.0;

  // Default: light cardio
  return 4.0;
}

/**
 * Calculate total calories burned in a workout session.
 */
export function calculateSessionCalories(
  exercises: WorkoutExerciseResult[],
  warmup: WarmupResult | undefined,
  weightKg: number,
  totalDurationMinutes: number,
): number {
  let total = 0;

  // Warmup calories
  if (warmup) {
    total += warmup.calories_burned;
  }

  // Exercise calories — estimate based on exercise types and duration
  const completedExercises = exercises.filter(ex => !ex.skipped);
  if (completedExercises.length === 0) return Math.round(total);

  // Estimate time per exercise: total minus warmup, split evenly
  const warmupMin = warmup?.duration_minutes ?? 0;
  const exerciseTime = Math.max(totalDurationMinutes - warmupMin, completedExercises.length * 3);
  const avgTimePerExercise = exerciseTime / completedExercises.length;

  for (const ex of completedExercises) {
    const met = getMETForExercise(ex);
    const duration = ex.duration_minutes ?? avgTimePerExercise;
    total += calculateActivityCalories(met, weightKg, duration);
  }

  return Math.round(total);
}

/**
 * Calculate warm-up calories from description and duration.
 */
export function calculateWarmupCalories(
  description: string,
  durationMinutes: number,
  weightKg: number,
): { calories: number; met: number } {
  const met = guessWarmupMET(description);
  const calories = calculateActivityCalories(met, weightKg, durationMinutes);
  return { calories, met };
}

/**
 * Get MET value for an exercise based on its type and subcategory.
 * For Mind-Body exercises, uses granular MET values when subcategory is available.
 */
function getMETForExercise(ex: WorkoutExerciseResult): number {
  const type = ex.exercise_type ?? 'strength';

  // Check subcategory first for granular Mind-Body MET values
  const subcategory = (ex as unknown as Record<string, unknown>).subcategory as string | undefined;
  if (subcategory && MET_VALUES[subcategory]) {
    return MET_VALUES[subcategory];
  }

  switch (type) {
    case 'cardio':
      return MET_VALUES.jogging;
    case 'flexibility':
      return MET_VALUES.yoga;
    case 'functional':
      return MET_VALUES.circuit_training;
    case 'strength':
    default:
      return MET_VALUES.strength;
  }
}
