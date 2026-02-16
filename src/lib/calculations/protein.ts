/**
 * Protein recommendation calculations.
 *
 * Based on scientific guidelines:
 * - General: 0.8 g/kg (WHO/RDA)
 * - Strength training (maintenance): 1.6-2.2 g/kg (Morton et al. 2018)
 * - Strength training + deficit: 2.3-3.1 g/kg lean mass (Helms et al. 2014)
 * - Strength training + anabolic support: 2.0-3.0 g/kg (Mero et al. 2010)
 *
 * @reference Morton RW et al. (2018), Br J Sports Med, 52(6):376-384
 * @reference Helms et al. (2014)
 * @reference docs/WISSENSCHAFTLICHE_GRUNDLAGEN.md
 */

type TrainingContext = 'general' | 'strength_maintenance' | 'strength_deficit' | 'strength_anabolic';

interface ProteinRecommendation {
  min_g: number;
  max_g: number;
  context: TrainingContext;
  source: string;
}

/**
 * Calculate protein recommendation based on body weight and training context.
 */
export function calculateProteinRecommendation(
  weight_kg: number,
  context: TrainingContext = 'strength_maintenance',
  lean_mass_kg?: number
): ProteinRecommendation {
  switch (context) {
    case 'general':
      return {
        min_g: Math.round(weight_kg * 0.8),
        max_g: Math.round(weight_kg * 1.0),
        context,
        source: 'WHO/RDA',
      };

    case 'strength_maintenance':
      return {
        min_g: Math.round(weight_kg * 1.6),
        max_g: Math.round(weight_kg * 2.2),
        context,
        source: 'Morton et al. (2018)',
      };

    case 'strength_deficit':
      // Uses lean mass if available, otherwise estimates
      const lm = lean_mass_kg ?? weight_kg * 0.8; // rough estimate
      return {
        min_g: Math.round(lm * 2.3),
        max_g: Math.round(lm * 3.1),
        context,
        source: 'Helms et al. (2014)',
      };

    case 'strength_anabolic':
      return {
        min_g: Math.round(weight_kg * 2.0),
        max_g: Math.round(weight_kg * 3.0),
        context,
        source: 'Mero et al. (2010)',
      };

    default:
      return {
        min_g: Math.round(weight_kg * 1.6),
        max_g: Math.round(weight_kg * 2.2),
        context: 'strength_maintenance',
        source: 'Morton et al. (2018)',
      };
  }
}

/**
 * Calculate calorie balance recommendations.
 *
 * @reference ACSM Position Stand
 * @reference Helms et al. (2014)
 * @reference Phillips & Van Loon (2011)
 */
export type FitnessGoal = 'fat_loss_moderate' | 'fat_loss_aggressive' | 'lean_bulk' | 'bulk' | 'recomposition';

interface CalorieRecommendation {
  min_kcal: number;
  max_kcal: number;
  goal: FitnessGoal;
  source: string;
}

export function getCalorieRecommendation(
  tdee: number,
  goal: FitnessGoal
): CalorieRecommendation {
  switch (goal) {
    case 'fat_loss_moderate':
      return {
        min_kcal: tdee - 500,
        max_kcal: tdee - 300,
        goal,
        source: 'ACSM Position Stand',
      };

    case 'fat_loss_aggressive':
      return {
        min_kcal: tdee - 750,
        max_kcal: tdee - 500,
        goal,
        source: 'ACSM Position Stand',
      };

    case 'lean_bulk':
      return {
        min_kcal: tdee + 200,
        max_kcal: tdee + 300,
        goal,
        source: 'Helms et al. (2014)',
      };

    case 'bulk':
      return {
        min_kcal: tdee + 300,
        max_kcal: tdee + 500,
        goal,
        source: 'Helms et al. (2014)',
      };

    case 'recomposition':
      return {
        min_kcal: tdee,
        max_kcal: tdee + 100,
        goal,
        source: 'Phillips & Van Loon (2011)',
      };

    default:
      return {
        min_kcal: tdee - 500,
        max_kcal: tdee - 300,
        goal: 'fat_loss_moderate',
        source: 'ACSM Position Stand',
      };
  }
}

/**
 * Calculate daily calorie balance.
 */
export function calculateCalorieBalance(
  caloriesConsumed: number,
  tdee: number
): { balance: number; status: 'deficit' | 'maintenance' | 'surplus' } {
  const balance = caloriesConsumed - tdee;

  let status: 'deficit' | 'maintenance' | 'surplus';
  if (balance < -100) status = 'deficit';
  else if (balance > 100) status = 'surplus';
  else status = 'maintenance';

  return { balance: Math.round(balance), status };
}
