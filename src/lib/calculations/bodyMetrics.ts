/**
 * Body Metrics — BMI classification + FFMI calculation & classification.
 *
 * BMI Categories: WHO classification (underweight → obese class III)
 * FFMI: Fat-Free Mass Index = lean_mass / height_m²
 *   - Gender-specific classification thresholds
 *   - normalizedFFMI adjusted to 1.80m reference height
 *
 * @reference WHO BMI Classification
 * @reference Schutz et al. (2002) — FFMI norms
 * @reference Kouri et al. (1995) — FFMI in athletes
 */

import type { Gender } from '../../types/health';

// ── BMI Classification ────────────────────────────────────────────────

export interface BMIClassification {
  category: 'underweight' | 'normal' | 'overweight' | 'obese_1' | 'obese_2' | 'obese_3';
  color: string;     // Tailwind bg color
  textColor: string; // Tailwind text color
  label_de: string;
  label_en: string;
}

export function classifyBMI(bmi: number): BMIClassification {
  if (bmi < 18.5) {
    return { category: 'underweight', color: 'bg-blue-100', textColor: 'text-blue-700', label_de: 'Untergewicht', label_en: 'Underweight' };
  }
  if (bmi < 25) {
    return { category: 'normal', color: 'bg-emerald-100', textColor: 'text-emerald-700', label_de: 'Normalgewicht', label_en: 'Normal' };
  }
  if (bmi < 30) {
    return { category: 'overweight', color: 'bg-amber-100', textColor: 'text-amber-700', label_de: 'Übergewicht', label_en: 'Overweight' };
  }
  if (bmi < 35) {
    return { category: 'obese_1', color: 'bg-orange-100', textColor: 'text-orange-700', label_de: 'Adipositas I', label_en: 'Obese Class I' };
  }
  if (bmi < 40) {
    return { category: 'obese_2', color: 'bg-red-100', textColor: 'text-red-700', label_de: 'Adipositas II', label_en: 'Obese Class II' };
  }
  return { category: 'obese_3', color: 'bg-red-200', textColor: 'text-red-800', label_de: 'Adipositas III', label_en: 'Obese Class III' };
}

// ── FFMI Calculation ──────────────────────────────────────────────────

export interface FFMIResult {
  ffmi: number;
  normalizedFFMI: number; // adjusted to 1.80m reference height
}

/**
 * Calculate FFMI (Fat-Free Mass Index).
 *
 * FFMI = lean_mass_kg / height_m²
 * Normalized FFMI = FFMI + 6.1 × (1.80 - height_m)
 */
export function calculateFFMI(
  lean_mass_kg: number,
  height_cm: number,
): FFMIResult {
  const height_m = height_cm / 100;
  const ffmi = lean_mass_kg / (height_m * height_m);
  const normalizedFFMI = ffmi + 6.1 * (1.80 - height_m);

  return {
    ffmi: Math.round(ffmi * 10) / 10,
    normalizedFFMI: Math.round(normalizedFFMI * 10) / 10,
  };
}

// ── FFMI Classification ───────────────────────────────────────────────

export interface FFMIClassification {
  category: 'below_average' | 'average' | 'above_average' | 'excellent' | 'superior' | 'suspicious';
  color: string;
  textColor: string;
  label_de: string;
  label_en: string;
}

/**
 * Classify FFMI based on gender-specific thresholds.
 *
 * Male thresholds (normalized FFMI):
 * - < 18: Below average
 * - 18-20: Average
 * - 20-22: Above average
 * - 22-25: Excellent
 * - 25+: Superior (natural limit ~25-26)
 *
 * Female thresholds (normalized FFMI):
 * - < 14: Below average
 * - 14-16.5: Average
 * - 16.5-18: Above average
 * - 18-20: Excellent
 * - 20+: Superior
 */
export function classifyFFMI(
  normalizedFFMI: number,
  gender: Gender,
): FFMIClassification {
  if (gender === 'female') {
    if (normalizedFFMI < 14) {
      return { category: 'below_average', color: 'bg-blue-100', textColor: 'text-blue-700', label_de: 'Unter Durchschnitt', label_en: 'Below Average' };
    }
    if (normalizedFFMI < 16.5) {
      return { category: 'average', color: 'bg-emerald-100', textColor: 'text-emerald-700', label_de: 'Durchschnitt', label_en: 'Average' };
    }
    if (normalizedFFMI < 18) {
      return { category: 'above_average', color: 'bg-teal-100', textColor: 'text-teal-700', label_de: 'Überdurchschnittlich', label_en: 'Above Average' };
    }
    if (normalizedFFMI < 20) {
      return { category: 'excellent', color: 'bg-amber-100', textColor: 'text-amber-700', label_de: 'Sehr gut', label_en: 'Excellent' };
    }
    return { category: 'superior', color: 'bg-purple-100', textColor: 'text-purple-700', label_de: 'Exzellent', label_en: 'Superior' };
  }

  // Male / other
  if (normalizedFFMI < 18) {
    return { category: 'below_average', color: 'bg-blue-100', textColor: 'text-blue-700', label_de: 'Unter Durchschnitt', label_en: 'Below Average' };
  }
  if (normalizedFFMI < 20) {
    return { category: 'average', color: 'bg-emerald-100', textColor: 'text-emerald-700', label_de: 'Durchschnitt', label_en: 'Average' };
  }
  if (normalizedFFMI < 22) {
    return { category: 'above_average', color: 'bg-teal-100', textColor: 'text-teal-700', label_de: 'Überdurchschnittlich', label_en: 'Above Average' };
  }
  if (normalizedFFMI < 25) {
    return { category: 'excellent', color: 'bg-amber-100', textColor: 'text-amber-700', label_de: 'Sehr gut', label_en: 'Excellent' };
  }
  if (normalizedFFMI <= 26) {
    return { category: 'superior', color: 'bg-purple-100', textColor: 'text-purple-700', label_de: 'Exzellent', label_en: 'Superior' };
  }
  return { category: 'suspicious', color: 'bg-red-100', textColor: 'text-red-700', label_de: 'Über nat. Limit', label_en: 'Above Natural Limit' };
}
