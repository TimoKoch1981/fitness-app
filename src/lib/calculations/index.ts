/**
 * Centralized exports for all calculation modules.
 * All calculations are hardcoded (deterministic, no AI needed).
 *
 * @see docs/WISSENSCHAFTLICHE_GRUNDLAGEN.md for scientific references
 * @see docs/ARCHITEKTUR.md Section 4 for KI vs. Hardcode decision
 */

export {
  calculateBMR,
  calculateBMR_MifflinStJeor,
  calculateBMR_KatchMcArdle,
  calculateLeanMass,
  calculateBMI,
  calculateAge,
} from './bmr';

export {
  calculateTDEE_PAL,
  calculateTDEE_MET,
  calculateActivityCalories,
  getPALDescription,
} from './tdee';

export {
  classifyBloodPressure,
  detectBPTrend,
} from './bloodPressure';

export {
  calculateProteinRecommendation,
  getCalorieRecommendation,
  calculateCalorieBalance,
} from './protein';
