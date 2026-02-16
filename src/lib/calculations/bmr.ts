/**
 * Basal Metabolic Rate (BMR) calculations.
 *
 * Two formulas implemented:
 * 1. Mifflin-St Jeor (1990) - Standard, recommended by ADA
 * 2. Katch-McArdle (1975) - More precise when body fat % is known
 *
 * @reference Frankenfield DC et al. (2005), J Am Diet Assoc, 105(5):775-789
 * @reference docs/WISSENSCHAFTLICHE_GRUNDLAGEN.md
 */

import type { Gender, BMRFormula } from '../../types/health';

interface BMRParams {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: Gender;
}

interface BMRParamsWithBF extends BMRParams {
  body_fat_pct: number;
}

/**
 * Mifflin-St Jeor equation (1990)
 * Recommended by American Dietetic Association (ADA)
 * Accuracy: ~82% in general population
 *
 * Men:   BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
 * Women: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
 */
export function calculateBMR_MifflinStJeor({ weight_kg, height_cm, age, gender }: BMRParams): number {
  const base = 10 * weight_kg + 6.25 * height_cm - 5 * age;
  const offset = gender === 'female' ? -161 : 5;
  return Math.round(base + offset);
}

/**
 * Katch-McArdle equation (1975)
 * More precise (±5-8%) when body fat percentage is known.
 * Gender-neutral (uses lean body mass directly).
 *
 * BMR = 370 + (21.6 × lean_mass_kg)
 * lean_mass_kg = weight_kg × (1 - body_fat_pct / 100)
 */
export function calculateBMR_KatchMcArdle({ weight_kg, body_fat_pct }: BMRParamsWithBF): number {
  const leanMass = weight_kg * (1 - body_fat_pct / 100);
  return Math.round(370 + 21.6 * leanMass);
}

/**
 * Calculate lean body mass from weight and body fat percentage.
 */
export function calculateLeanMass(weight_kg: number, body_fat_pct: number): number {
  return Math.round((weight_kg * (1 - body_fat_pct / 100)) * 10) / 10;
}

/**
 * Calculate BMI from weight and height.
 */
export function calculateBMI(weight_kg: number, height_cm: number): number {
  const height_m = height_cm / 100;
  return Math.round((weight_kg / (height_m * height_m)) * 10) / 10;
}

/**
 * Calculate age from birth date.
 */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Auto-select BMR formula based on available data.
 * Uses Katch-McArdle when body fat is known (more precise for athletes).
 * Falls back to Mifflin-St Jeor otherwise.
 */
export function calculateBMR(
  params: BMRParams & { body_fat_pct?: number },
  preferredFormula: BMRFormula = 'auto'
): { bmr: number; formula: 'mifflin' | 'katch' } {
  if (preferredFormula === 'katch' && params.body_fat_pct != null) {
    return {
      bmr: calculateBMR_KatchMcArdle({ ...params, body_fat_pct: params.body_fat_pct }),
      formula: 'katch',
    };
  }

  if (preferredFormula === 'auto' && params.body_fat_pct != null) {
    return {
      bmr: calculateBMR_KatchMcArdle({ ...params, body_fat_pct: params.body_fat_pct }),
      formula: 'katch',
    };
  }

  return {
    bmr: calculateBMR_MifflinStJeor(params),
    formula: 'mifflin',
  };
}
