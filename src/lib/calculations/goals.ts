/**
 * Goal recommendation calculations.
 *
 * Chain: Weight + Profile → BMR → TDEE → Calorie Goal → Protein Goal → Water Goal
 *
 * Uses existing calculation functions:
 * - calculateBMR (bmr.ts) — Basal Metabolic Rate
 * - calculateTDEE_PAL (tdee.ts) — Total Daily Energy Expenditure
 * - getCalorieRecommendation (protein.ts) — Goal-based calorie adjustment
 * - calculateProteinRecommendation (protein.ts) — Context-based protein targets
 *
 * @see docs/WISSENSCHAFTLICHE_GRUNDLAGEN.md
 */

import { calculateBMR, calculateAge } from './bmr';
import { calculateTDEE_PAL } from './tdee';
import { getCalorieRecommendation, calculateProteinRecommendation } from './protein';
import type { FitnessGoal } from './protein';
import type { Gender, PrimaryGoal, BMRFormula } from '../../types/health';

export interface GoalCalculationInput {
  weight_kg: number;
  height_cm: number;
  birth_date: string;
  gender: Gender;
  activity_level: number; // PAL factor (1.2–2.4)
  preferred_bmr_formula?: BMRFormula;
  body_fat_pct?: number;
  primary_goal?: PrimaryGoal;
  lean_mass_kg?: number;
}

export interface RecommendedGoals {
  calories: number;
  protein: number;
  water_glasses: number;
  /** Computed intermediate values for display */
  bmr: number;
  tdee: number;
  bmr_formula: 'mifflin' | 'katch';
}

/**
 * Map PrimaryGoal to FitnessGoal for calorie calculation.
 *
 * fat_loss     → fat_loss_moderate (TDEE - 300 to -500) — controlled deficit
 * muscle_gain  → lean_bulk (TDEE + 200 to +300) — clean surplus for hypertrophy
 * body_recomp  → recomposition (TDEE to TDEE+100) — near maintenance
 * performance  → lean_bulk (TDEE + 200 to +300) — fuel for training
 * health       → recomposition (TDEE to TDEE+100) — maintenance, no forced deficit
 */
function mapPrimaryGoalToFitnessGoal(goal?: PrimaryGoal): FitnessGoal {
  switch (goal) {
    case 'fat_loss':
      return 'fat_loss_moderate';
    case 'muscle_gain':
      return 'lean_bulk';
    case 'body_recomp':
      return 'recomposition';
    case 'performance':
      return 'lean_bulk';
    case 'health':
    default:
      return 'recomposition'; // Default: near maintenance, no forced deficit
  }
}

/**
 * Map PrimaryGoal to protein training context.
 *
 * Standard for all training goals: strength_maintenance (1.6-2.2 g/kg, Morton et al. 2018)
 * This is the scientifically well-supported range for active individuals.
 *
 * strength_anabolic (2.0-3.0 g/kg, Mero et al. 2010) is available as optional
 * "Boost" for users on anabolic support — selectable in profile, not auto-mapped.
 *
 * fat_loss uses strength_deficit (2.3-3.1 g/kg lean mass, Helms et al. 2014)
 * to preserve muscle during calorie deficit.
 */
function mapPrimaryGoalToProteinContext(goal?: PrimaryGoal) {
  switch (goal) {
    case 'fat_loss':
      return 'strength_deficit' as const;
    case 'muscle_gain':
    case 'body_recomp':
    case 'performance':
    case 'health':
    default:
      return 'strength_maintenance' as const;
  }
}

/**
 * Calculate recommended daily goals based on profile data.
 *
 * Returns null if essential data is missing.
 */
export function calculateRecommendedGoals(
  input: GoalCalculationInput,
): RecommendedGoals | null {
  const { weight_kg, height_cm, birth_date, gender, activity_level } = input;

  // Validate required fields
  if (!weight_kg || weight_kg <= 0) return null;
  if (!height_cm || height_cm <= 0) return null;
  if (!birth_date) return null;

  const age = calculateAge(birth_date);
  if (age <= 0 || age > 120) return null;

  // Step 1: BMR
  const bmrResult = calculateBMR(
    { weight_kg, height_cm, age, gender, body_fat_pct: input.body_fat_pct },
    input.preferred_bmr_formula ?? 'auto',
  );

  // Step 2: TDEE
  const tdee = calculateTDEE_PAL(bmrResult.bmr, activity_level || 1.55);

  // Step 3: Calorie goal (based on primary goal)
  const fitnessGoal = mapPrimaryGoalToFitnessGoal(input.primary_goal);
  const calorieRec = getCalorieRecommendation(tdee, fitnessGoal);
  // Use midpoint of recommendation range
  const calories = Math.round((calorieRec.min_kcal + calorieRec.max_kcal) / 2);

  // Step 4: Protein goal
  const proteinContext = mapPrimaryGoalToProteinContext(input.primary_goal);
  const proteinRec = calculateProteinRecommendation(
    weight_kg,
    proteinContext,
    input.lean_mass_kg,
  );
  // Use midpoint
  const protein = Math.round((proteinRec.min_g + proteinRec.max_g) / 2);

  // Step 5: Water goal (35ml/kg → convert to glasses of ~250ml)
  const waterMl = weight_kg * 35;
  const water_glasses = Math.round(waterMl / 250);

  return {
    calories,
    protein,
    water_glasses,
    bmr: Math.round(bmrResult.bmr),
    tdee: Math.round(tdee),
    bmr_formula: bmrResult.formula,
  };
}
