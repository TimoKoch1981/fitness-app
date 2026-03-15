/**
 * Deload-Nutrition Sync — Adjusts calorie recommendations during deload weeks.
 *
 * During deload weeks (reduced training volume), energy expenditure drops
 * by ~10-15%, so calorie targets should be adjusted accordingly.
 * Protein stays high to preserve muscle mass.
 *
 * Detection: Checks if KI-Trainer review has flagged a deload,
 * or if training plan name/notes contain deload keywords.
 */

import type { TrainingPlan } from '../../../types/health';

export interface DeloadNutritionAdjustment {
  /** Whether a deload is currently active */
  isDeload: boolean;
  /** Calorie reduction percentage (0-15) */
  calorieReductionPct: number;
  /** Adjusted calorie target */
  adjustedCalories: number;
  /** Protein stays same or slightly higher */
  protein: number;
  /** Reason for deload detection */
  reason: { de: string; en: string };
}

const DELOAD_KEYWORDS = [
  'deload', 'entlastung', 'entlastungswoche', 'regeneration',
  'recovery', 'leicht', 'light', 'reduziert', 'reduced',
];

/**
 * Detect if the current training plan is in a deload phase
 * and calculate adjusted nutrition targets.
 */
export function calculateDeloadNutrition(
  plan: TrainingPlan | null,
  baseCalories: number,
  proteinGrams: number,
  bodyWeight: number,
): DeloadNutritionAdjustment {
  if (!plan) {
    return { isDeload: false, calorieReductionPct: 0, adjustedCalories: baseCalories, protein: proteinGrams, reason: { de: '', en: '' } };
  }

  // Check plan name/notes for deload keywords
  const planText = `${plan.name ?? ''} ${plan.notes ?? ''}`.toLowerCase();
  const hasDeloadKeyword = DELOAD_KEYWORDS.some(kw => planText.includes(kw));

  // Check mesocycle_week for deload patterns (typically week 4 of 4)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planAny = plan as any;
  const mesocycleWeek = planAny.mesocycle_week as number | undefined;
  const mesocycleLength = planAny.mesocycle_length as number | undefined;
  const isLastWeek = mesocycleWeek != null && mesocycleLength != null && mesocycleWeek >= mesocycleLength;

  if (!hasDeloadKeyword && !isLastWeek) {
    return { isDeload: false, calorieReductionPct: 0, adjustedCalories: baseCalories, protein: proteinGrams, reason: { de: '', en: '' } };
  }

  // Deload detected: reduce calories by 10-15%, keep protein high
  const reductionPct = 12; // 12% average of 10-15%
  const adjustedCalories = Math.round(baseCalories * (1 - reductionPct / 100));
  const protein = Math.round(Math.max(proteinGrams, bodyWeight * 2.2)); // At least 2.2g/kg

  const reason = hasDeloadKeyword
    ? { de: 'Deload-Woche erkannt (Planname)', en: 'Deload week detected (plan name)' }
    : { de: `Mesozyklus Woche ${mesocycleWeek}/${mesocycleLength} (Deload)`, en: `Mesocycle week ${mesocycleWeek}/${mesocycleLength} (deload)` };

  return {
    isDeload: true,
    calorieReductionPct: reductionPct,
    adjustedCalories,
    protein,
    reason,
  };
}
