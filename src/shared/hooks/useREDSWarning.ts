/**
 * RED-S (Relative Energy Deficiency in Sport) & Underweight Warning Hook.
 *
 * Detects risky energy availability and underweight conditions:
 * 1. BMI < 18.5 (WHO underweight) — amber warning
 * 2. BMI < 17.0 (severe underweight) — red danger
 * 3. Calorie deficit > 1000 kcal/day — amber warning
 * 4. Energy availability < 30 kcal/kg FFM/day — RED-S threshold (Loucks 2004)
 * 5. Total intake < 1200 kcal for women with high training — amber warning
 *
 * Gender-gated: Only active when showREDSWarning = true (female/other).
 * Also shows BMI underweight warnings for ALL genders.
 *
 * @reference Mountjoy et al. (2018) — IOC consensus on RED-S
 * @reference Loucks et al. (2004) — Energy availability threshold < 30 kcal/kg FFM
 * @reference WHO BMI classification — underweight < 18.5
 */

import { useProfile } from '../../features/auth/hooks/useProfile';
import { useLatestBodyMeasurement } from '../../features/body/hooks/useBodyMeasurements';
import { useGenderFeatures } from './useGenderFeatures';

// ── Thresholds ──────────────────────────────────────────────────────
const BMI_UNDERWEIGHT = 18.5;        // WHO underweight threshold
const BMI_SEVERE_UNDERWEIGHT = 17.0; // WHO severe underweight
const DEFICIT_WARNING = 1000;         // kcal — aggressive deficit warning
const REDS_EA_THRESHOLD = 30;         // kcal/kg FFM/day — RED-S risk (Loucks 2004)
const MIN_INTAKE_FEMALE = 1200;       // kcal — minimum safe intake for active women

export type REDSSeverity = 'none' | 'warning' | 'danger';

export interface REDSWarningState {
  /** Overall severity (highest of all checks) */
  severity: REDSSeverity;
  /** Whether any warning should be shown */
  hasWarning: boolean;

  // Individual flags
  /** BMI is below 18.5 (underweight) */
  isUnderweight: boolean;
  /** BMI is below 17.0 (severe underweight) */
  isSevereUnderweight: boolean;
  /** Current BMI value (null if no data) */
  bmi: number | null;

  /** Calorie deficit exceeds 1000 kcal */
  hasExcessiveDeficit: boolean;
  /** Calculated calorie deficit (positive = deficit) */
  calorieDeficit: number | null;

  /** Energy availability below RED-S threshold (< 30 kcal/kg FFM) */
  hasLowEnergyAvailability: boolean;
  /** Calculated energy availability in kcal/kg FFM */
  energyAvailability: number | null;

  /** Intake below 1200 kcal for active women */
  hasDangerouslyLowIntake: boolean;

  /** Is loading data */
  isLoading: boolean;
}

/**
 * Hook to detect RED-S risk and underweight conditions.
 *
 * @param caloriesConsumed - Today's consumed calories (from meal tracking)
 * @param caloriesGoal - Daily calorie goal (TDEE-based)
 * @param tdee - Calculated TDEE (null if profile incomplete)
 */
export function useREDSWarning(
  caloriesConsumed: number = 0,
  caloriesGoal: number = 0,
  tdee: number | null = null,
): REDSWarningState {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: latestBody, isLoading: bodyLoading } = useLatestBodyMeasurement();
  const { showREDSWarning, isFemaleOrOther } = useGenderFeatures();

  const isLoading = profileLoading || bodyLoading;

  // ── Default (no warning) ──
  const noWarning: REDSWarningState = {
    severity: 'none',
    hasWarning: false,
    isUnderweight: false,
    isSevereUnderweight: false,
    bmi: null,
    hasExcessiveDeficit: false,
    calorieDeficit: null,
    hasLowEnergyAvailability: false,
    energyAvailability: null,
    hasDangerouslyLowIntake: false,
    isLoading,
  };

  if (isLoading || !profile || !latestBody) return noWarning;

  const bmi = latestBody.bmi ?? null;
  const weightKg = latestBody.weight_kg;
  const leanMassKg = latestBody.lean_mass_kg ?? null;

  // ── Check 1 & 2: BMI underweight (ALL genders) ──
  const isUnderweight = bmi !== null && bmi < BMI_UNDERWEIGHT;
  const isSevereUnderweight = bmi !== null && bmi < BMI_SEVERE_UNDERWEIGHT;

  // ── Check 3: Excessive calorie deficit ──
  // Only check if we have TDEE and the user has logged some food today
  const calorieDeficit = tdee !== null && caloriesConsumed > 0
    ? tdee - caloriesConsumed
    : null;
  const hasExcessiveDeficit = calorieDeficit !== null && calorieDeficit > DEFICIT_WARNING;

  // ── Check 4: RED-S Energy Availability (female/other only) ──
  // EA = (Dietary Energy Intake - Exercise Energy Expenditure) / FFM
  // Simplified: We use calorie goal vs. lean mass since we don't track exercise separately here
  let energyAvailability: number | null = null;
  let hasLowEnergyAvailability = false;

  if (showREDSWarning && leanMassKg && leanMassKg > 0 && caloriesGoal > 0) {
    // EA per kg FFM = calorie_goal / lean_mass_kg
    energyAvailability = Math.round((caloriesGoal / leanMassKg) * 10) / 10;
    hasLowEnergyAvailability = energyAvailability < REDS_EA_THRESHOLD;
  }

  // ── Check 5: Dangerously low intake for active women ──
  const hasDangerouslyLowIntake = isFemaleOrOther
    && caloriesGoal > 0
    && caloriesGoal < MIN_INTAKE_FEMALE
    && (profile.activity_level ?? 1.55) >= 1.55;

  // ── Determine severity ──
  let severity: REDSSeverity = 'none';

  if (isSevereUnderweight || hasLowEnergyAvailability) {
    severity = 'danger';
  } else if (isUnderweight || hasExcessiveDeficit || hasDangerouslyLowIntake) {
    severity = 'warning';
  }

  const hasWarning = severity !== 'none';

  return {
    severity,
    hasWarning,
    isUnderweight,
    isSevereUnderweight,
    bmi,
    hasExcessiveDeficit,
    calorieDeficit,
    hasLowEnergyAvailability,
    energyAvailability,
    hasDangerouslyLowIntake,
    isLoading,
  };
}
