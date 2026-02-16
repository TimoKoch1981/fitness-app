/**
 * Total Daily Energy Expenditure (TDEE) calculations.
 *
 * Two methods:
 * 1. PAL-based: TDEE = BMR × PAL factor (simple, estimate)
 * 2. MET-based: TDEE = BMR + Σ(MET_i × weight × duration_i) (precise)
 *
 * @reference FAO/WHO/UNU (2004), Human Energy Requirements, Technical Report
 * @reference Herrmann et al. (2024), J Sport Health Sci, 13(1):6-12
 * @reference docs/WISSENSCHAFTLICHE_GRUNDLAGEN.md
 */

import { PAL_FACTORS } from '../constants';

/**
 * PAL (Physical Activity Level) based TDEE.
 * Simple method using activity level multiplier.
 *
 * TDEE = BMR × PAL
 */
export function calculateTDEE_PAL(bmr: number, palFactor: number): number {
  return Math.round(bmr * palFactor);
}

/**
 * MET-based TDEE calculation (precise mode).
 * Used when workout data is logged.
 *
 * TDEE = BMR + Σ(MET × weight_kg × duration_hours)
 *
 * MET definition: 1 MET = resting metabolic rate ≈ 1.0 kcal/kg/h
 */
export function calculateTDEE_MET(
  bmr: number,
  weight_kg: number,
  activities: Array<{ met: number; duration_minutes: number }>
): number {
  const activityCalories = activities.reduce((total, activity) => {
    const durationHours = activity.duration_minutes / 60;
    return total + activity.met * weight_kg * durationHours;
  }, 0);

  return Math.round(bmr + activityCalories);
}

/**
 * Calculate calories burned for a single activity.
 *
 * Calories = MET × weight_kg × duration_hours
 */
export function calculateActivityCalories(
  met: number,
  weight_kg: number,
  duration_minutes: number
): number {
  const durationHours = duration_minutes / 60;
  return Math.round(met * weight_kg * durationHours);
}

/**
 * Get PAL factor description for UI display.
 */
export function getPALDescription(palFactor: number): string {
  if (palFactor <= PAL_FACTORS.bedridden) return 'bedridden';
  if (palFactor <= PAL_FACTORS.sedentary) return 'sedentary';
  if (palFactor <= PAL_FACTORS.lightly_active) return 'lightly_active';
  if (palFactor <= PAL_FACTORS.moderately_active) return 'moderately_active';
  if (palFactor <= PAL_FACTORS.very_active) return 'very_active';
  return 'extremely_active';
}
