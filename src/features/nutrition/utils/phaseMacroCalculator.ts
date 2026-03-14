/**
 * Phase-specific macro calculator for competitive bodybuilders.
 *
 * Evidence-based targets per training phase:
 * - Helms et al. 2014: Protein recommendations for natural bodybuilders
 * - Trexler et al. 2014: Metabolic adaptation to weight loss
 * - ISSN Position Stands on protein timing and distribution
 * - Schoenfeld & Aragon 2018: Protein distribution across meals
 *
 * F15: Bodybuilder-Modus
 */

import type { TrainingPhase } from '../../../types/health';

export interface PhaseMacros {
  /** Total daily calories */
  calories: number;
  /** Protein in grams */
  protein: number;
  /** Carbohydrates in grams */
  carbs: number;
  /** Fat in grams */
  fat: number;
  /** Phase description (DE) */
  phaseLabelDe: string;
  /** Phase description (EN) */
  phaseLabelEn: string;
  /** Recommended protein per meal (g) for 4-6 meals */
  proteinPerMeal: { min: number; max: number };
  /** Phase-specific notes */
  notes: { de: string; en: string }[];
}

export interface PhaseMacroInput {
  /** TDEE from BMR calculation chain */
  tdee: number;
  /** Current training phase */
  phase: TrainingPhase;
  /** Weeks into current phase (for adaptive deficit) */
  weeksIntoPhase: number;
  /** Body weight in kg */
  bodyWeight: number;
  /** Body fat percentage (optional, for lean mass calc) */
  bodyFatPct?: number;
  /** Number of meals per day (default 5) */
  mealsPerDay?: number;
}

/**
 * Calculate phase-specific macronutrient targets.
 */
export function calculatePhaseMacros(input: PhaseMacroInput): PhaseMacros {
  const { tdee, phase, weeksIntoPhase, bodyWeight, bodyFatPct, mealsPerDay = 5 } = input;
  const leanMass = bodyFatPct != null ? bodyWeight * (1 - bodyFatPct / 100) : bodyWeight * 0.8;

  switch (phase) {
    case 'bulk':
      return calcBulk(tdee, bodyWeight, leanMass, mealsPerDay);
    case 'cut':
      return calcCut(tdee, bodyWeight, leanMass, weeksIntoPhase, mealsPerDay);
    case 'maintenance':
      return calcMaintenance(tdee, bodyWeight, leanMass, mealsPerDay);
    case 'peak_week':
      return calcPeakWeek(tdee, bodyWeight, leanMass, weeksIntoPhase, mealsPerDay);
    case 'reverse_diet':
      return calcReverseDiet(tdee, bodyWeight, leanMass, weeksIntoPhase, mealsPerDay);
    case 'off_season':
    default:
      return calcOffSeason(tdee, bodyWeight, leanMass, mealsPerDay);
  }
}

// ── Phase calculators ──────────────────────────────────────────────────

function calcBulk(tdee: number, bw: number, _lm: number, meals: number): PhaseMacros {
  const surplus = 400; // Conservative lean bulk: +300-500 kcal
  const calories = tdee + surplus;
  const protein = Math.round(bw * 2.2); // 2.2g/kg (Helms 2014)
  const fat = Math.round(bw * 0.9); // 0.8-1g/kg
  const carbCals = calories - (protein * 4) - (fat * 9);
  const carbs = Math.round(Math.max(carbCals / 4, 100));

  return {
    calories: Math.round(calories),
    protein,
    carbs,
    fat,
    phaseLabelDe: 'Aufbauphase',
    phaseLabelEn: 'Bulk Phase',
    proteinPerMeal: calcProteinPerMeal(protein, meals),
    notes: [
      { de: `Surplus: +${surplus} kcal ueber TDEE`, en: `Surplus: +${surplus} kcal above TDEE` },
      { de: 'Protein: 2.2g/kg Koerpergewicht (Helms 2014)', en: 'Protein: 2.2g/kg body weight (Helms 2014)' },
      { de: 'Ziel: 0.25-0.5% KG-Zunahme pro Woche', en: 'Target: 0.25-0.5% BW gain per week' },
    ],
  };
}

function calcCut(tdee: number, bw: number, _lm: number, weeks: number, meals: number): PhaseMacros {
  // Adaptive deficit: start -500, reduce by 50 every 4 weeks (Trexler 2014)
  const adaptiveReduction = Math.floor(weeks / 4) * 50;
  const deficit = Math.min(500 + adaptiveReduction, 750); // Cap at -750
  const calories = tdee - deficit;

  // Higher protein in deficit: 2.5-3.1g/kg (Helms 2014)
  const protein = Math.round(bw * 2.8);
  const fat = Math.round(Math.max(bw * 0.5, 40)); // Min 0.5g/kg, at least 40g
  const carbCals = calories - (protein * 4) - (fat * 9);
  const carbs = Math.round(Math.max(carbCals / 4, 50));

  return {
    calories: Math.round(calories),
    protein,
    carbs,
    fat,
    phaseLabelDe: 'Definitionsphase',
    phaseLabelEn: 'Cut Phase',
    proteinPerMeal: calcProteinPerMeal(protein, meals),
    notes: [
      { de: `Defizit: -${deficit} kcal (Woche ${weeks}, adaptiv)`, en: `Deficit: -${deficit} kcal (week ${weeks}, adaptive)` },
      { de: 'Protein: 2.8g/kg (erhoehter Bedarf im Defizit)', en: 'Protein: 2.8g/kg (increased need in deficit)' },
      { de: 'Fett min. 0.5g/kg fuer Hormonfunktion', en: 'Fat min. 0.5g/kg for hormone function' },
      ...(weeks >= 12 ? [{ de: '⚠️ Refeed-Tage empfohlen (alle 7-14 Tage)', en: '⚠️ Refeed days recommended (every 7-14 days)' }] : []),
    ],
  };
}

function calcMaintenance(tdee: number, bw: number, _lm: number, meals: number): PhaseMacros {
  const calories = tdee;
  const protein = Math.round(bw * 2.0);
  const fat = Math.round(bw * 0.8);
  const carbCals = calories - (protein * 4) - (fat * 9);
  const carbs = Math.round(Math.max(carbCals / 4, 100));

  return {
    calories: Math.round(calories),
    protein,
    carbs,
    fat,
    phaseLabelDe: 'Erhaltungsphase',
    phaseLabelEn: 'Maintenance',
    proteinPerMeal: calcProteinPerMeal(protein, meals),
    notes: [
      { de: 'Kalorienziel = TDEE', en: 'Calorie target = TDEE' },
      { de: 'Protein: 2.0g/kg Koerpergewicht', en: 'Protein: 2.0g/kg body weight' },
    ],
  };
}

function calcPeakWeek(_tdee: number, bw: number, _lm: number, dayInWeek: number, meals: number): PhaseMacros {
  // 7-day protocol (day 0 = 7 days before show)
  const day = Math.min(dayInWeek, 7);

  let carbMultiplier: number;
  let waterNote: string;
  let sodiumNote: string;

  if (day <= 3) {
    // Days 1-3: Carb depletion
    carbMultiplier = 0.5; // 0.5g/kg
    waterNote = '6-8L Wasser / 6-8L water';
    sodiumNote = '5-8g Natrium (hoch) / 5-8g sodium (high)';
  } else if (day <= 6) {
    // Days 4-6: Carb loading
    carbMultiplier = 9; // 8-10g/kg
    waterNote = '2-4L Wasser (reduziert) / 2-4L water (reduced)';
    sodiumNote = 'Natrium reduziert / Sodium reduced';
  } else {
    // Day 7: Show day
    carbMultiplier = 4; // Moderate carbs
    waterNote = 'Nur Schlucke / Sips only';
    sodiumNote = 'Natrium minimal / Sodium minimal';
  }

  const protein = Math.round(bw * 2.5);
  const carbs = Math.round(bw * carbMultiplier);
  const fat = Math.round(Math.max(bw * 0.3, 30));
  const calories = Math.round(protein * 4 + carbs * 4 + fat * 9);

  return {
    calories,
    protein,
    carbs,
    fat,
    phaseLabelDe: `Peak Week — Tag ${day}/7`,
    phaseLabelEn: `Peak Week — Day ${day}/7`,
    proteinPerMeal: calcProteinPerMeal(protein, meals),
    notes: [
      { de: `⚠️ Peak Week ist fortgeschritten. Absprache mit Coach empfohlen.`, en: `⚠️ Peak week is advanced. Consult your coach.` },
      { de: waterNote, en: waterNote },
      { de: sodiumNote, en: sodiumNote },
      ...(day <= 3
        ? [{ de: 'Carb Depletion: 0.5g/kg', en: 'Carb Depletion: 0.5g/kg' }]
        : day <= 6
        ? [{ de: `Carb Loading: ${carbMultiplier}g/kg`, en: `Carb Loading: ${carbMultiplier}g/kg` }]
        : [{ de: 'Show Day: moderate Carbs', en: 'Show Day: moderate carbs' }]),
    ],
  };
}

function calcReverseDiet(tdee: number, bw: number, _lm: number, weeks: number, meals: number): PhaseMacros {
  // Start from ~cut calories, add 100 kcal/week
  const baseDeficit = 500;
  const weeklyIncrease = 100;
  const currentAdjustment = Math.min(weeks * weeklyIncrease, baseDeficit);
  const calories = tdee - baseDeficit + currentAdjustment;

  const protein = Math.round(bw * 2.2); // Slightly lower than cut
  const fat = Math.round(bw * 0.7);
  const carbCals = calories - (protein * 4) - (fat * 9);
  const carbs = Math.round(Math.max(carbCals / 4, 80));

  return {
    calories: Math.round(calories),
    protein,
    carbs,
    fat,
    phaseLabelDe: 'Reverse Diet',
    phaseLabelEn: 'Reverse Diet',
    proteinPerMeal: calcProteinPerMeal(protein, meals),
    notes: [
      { de: `+${weeklyIncrease} kcal/Woche (Woche ${weeks})`, en: `+${weeklyIncrease} kcal/week (week ${weeks})` },
      { de: 'Langsam Kalorien erhoehen nach Diaet', en: 'Slowly increasing calories post-diet' },
      { de: `Aktuell: ${Math.round(calories)} kcal (Ziel: ${tdee} kcal)`, en: `Current: ${Math.round(calories)} kcal (target: ${tdee} kcal)` },
    ],
  };
}

function calcOffSeason(tdee: number, bw: number, lm: number, meals: number): PhaseMacros {
  // Similar to maintenance but slightly more relaxed
  return calcMaintenance(tdee, bw, lm, meals);
}

// ── Helpers ─────────────────────────────────────────────────────────────

function calcProteinPerMeal(totalProtein: number, meals: number): { min: number; max: number } {
  const avg = totalProtein / meals;
  return {
    min: Math.round(avg * 0.85),
    max: Math.round(avg * 1.15),
  };
}

// ── Macro Cycling ────────────────────────────────────────────────────────

export type DayType = 'high' | 'moderate' | 'low' | 'rest';

export interface MacroCyclingDay {
  dayType: DayType;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

/**
 * Calculate macro cycling targets for a specific day type.
 * Protein stays constant; carbs/fat adjust based on day type.
 */
export function calculateMacroCyclingDay(
  baseMacros: PhaseMacros,
  dayType: DayType,
): MacroCyclingDay {
  const { protein } = baseMacros;

  let carbMultiplier: number;
  let fatMultiplier: number;

  switch (dayType) {
    case 'high':
      carbMultiplier = 1.3;
      fatMultiplier = 0.8;
      break;
    case 'low':
      carbMultiplier = 0.7;
      fatMultiplier = 1.2;
      break;
    case 'rest':
      carbMultiplier = 0.6;
      fatMultiplier = 1.1;
      break;
    case 'moderate':
    default:
      carbMultiplier = 1.0;
      fatMultiplier = 1.0;
      break;
  }

  const carbs = Math.round(baseMacros.carbs * carbMultiplier);
  const fat = Math.round(baseMacros.fat * fatMultiplier);
  const calories = protein * 4 + carbs * 4 + fat * 9;

  return { dayType, protein, carbs, fat, calories: Math.round(calories) };
}

/**
 * Generate a full week of macro cycling.
 */
export function generateMacroCyclingWeek(
  baseMacros: PhaseMacros,
  weekPattern: DayType[] = ['high', 'moderate', 'low', 'high', 'moderate', 'low', 'rest'],
): MacroCyclingDay[] {
  return weekPattern.map((dayType) => calculateMacroCyclingDay(baseMacros, dayType));
}

// ── Day type labels ──────────────────────────────────────────────────────

export const DAY_TYPE_INFO: Record<DayType, { de: string; en: string; color: string }> = {
  high: { de: 'High Carb', en: 'High Carb', color: 'bg-green-100 text-green-700' },
  moderate: { de: 'Moderate', en: 'Moderate', color: 'bg-blue-100 text-blue-700' },
  low: { de: 'Low Carb', en: 'Low Carb', color: 'bg-amber-100 text-amber-700' },
  rest: { de: 'Ruhetag', en: 'Rest Day', color: 'bg-gray-100 text-gray-600' },
};
