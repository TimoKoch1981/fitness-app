/**
 * Alternative Nutrition Scoring Systems
 * Implements WW Points, Nutri-Score (simplified), and Noom Color coding.
 *
 * All systems calculate from standard nutritional data:
 * calories, protein, carbs, fat, fiber, sugar (optional), saturated_fat (optional)
 *
 * Sources:
 * - WW SmartPoints: reverse-engineered formula (Omnicalculator, Calculator.net)
 * - WW Classic Points: (calories/50) + (fat/12) - (min(fiber,4)/5)
 * - Nutri-Score: FSA Nutrient Profiling System (EU public algorithm)
 * - Noom: Calorie density classification (< 1.0 green, 1-3 yellow, > 3 red)
 */

// ── Types ────────────────────────────────────────────────────────────────

export type NoomColor = 'green' | 'yellow' | 'red';
export type NutriScoreGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export interface NutritionScoringInput {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;          // optional — estimated from carbs if missing
  saturated_fat?: number;  // optional — estimated from fat if missing
  sodium_mg?: number;      // optional — default 0
  serving_weight_g?: number; // optional — estimated from macros if missing
}

export interface ScoringResult {
  wwPoints: number;          // WW SmartPoints (0+)
  wwClassicPoints: number;   // WW Classic/Original Points (0+)
  noomColor: NoomColor;      // Calorie density classification
  noomCalorieDensity: number; // kcal/g
  nutriScore: number;        // Raw Nutri-Score (-15 to 40)
  nutriScoreGrade: NutriScoreGrade; // A-E
  dataCompleteness: number;  // 0-100% — how much data was available vs estimated
}

// ── WW SmartPoints ───────────────────────────────────────────────────────

/**
 * WW SmartPoints formula (reverse-engineered, pre-PersonalPoints):
 * Points = (calories × 0.0305) + (saturated_fat × 0.275) + (sugar × 0.12) - (protein × 0.098)
 *
 * When sugar/saturated_fat are unknown, we estimate:
 * - Sugar ≈ 40% of carbs (conservative average for mixed diet)
 * - Saturated fat ≈ 35% of total fat (average for mixed diet)
 */
export function calculateWWSmartPoints(input: NutritionScoringInput): number {
  const sugar = input.sugar ?? input.carbs * 0.4;
  const satFat = input.saturated_fat ?? input.fat * 0.35;

  const points = (input.calories * 0.0305) + (satFat * 0.275) + (sugar * 0.12) - (input.protein * 0.098);
  return Math.max(0, Math.round(points));
}

/**
 * WW Classic/Original Points formula (fully calculable):
 * Points = (calories / 50) + (fat / 12) - (min(fiber, 4) / 5)
 */
export function calculateWWClassicPoints(input: NutritionScoringInput): number {
  const fiber = Math.min(input.fiber ?? 0, 4);
  const points = (input.calories / 50) + (input.fat / 12) - (fiber / 5);
  return Math.max(0, Math.round(points));
}

// ── Noom Color ───────────────────────────────────────────────────────────

/**
 * Noom color system based on calorie density (kcal/g).
 * If serving_weight_g is unknown, estimate from macros:
 * Weight ≈ protein + carbs + fat + fiber + water
 * Where water is estimated as: max(0, calories * 0.5 / 100) grams (rough)
 */
export function calculateNoomColor(input: NutritionScoringInput): { color: NoomColor; density: number } {
  let weight = input.serving_weight_g;

  if (!weight || weight <= 0) {
    // Estimate serving weight from macro composition
    // Dry weight: protein + carbs + fat + fiber
    // Add estimated water content (foods average ~50-60% water)
    const dryWeight = input.protein + input.carbs + input.fat + (input.fiber ?? 0);
    // Rough heuristic: for a typical mixed meal, water is roughly equal to dry weight
    weight = Math.max(dryWeight * 2, 1);
  }

  const density = input.calories / weight;

  if (density < 1.0) return { color: 'green', density: Math.round(density * 100) / 100 };
  if (density <= 3.0) return { color: 'yellow', density: Math.round(density * 100) / 100 };
  return { color: 'red', density: Math.round(density * 100) / 100 };
}

// ── Nutri-Score ──────────────────────────────────────────────────────────

/**
 * Simplified Nutri-Score calculation (per 100g or per serving).
 * Uses FSA Nutrient Profiling thresholds.
 * Omits fruits/vegetables/nuts percentage (defaults to 0).
 */
export function calculateNutriScore(input: NutritionScoringInput): { score: number; grade: NutriScoreGrade } {
  const energyKJ = input.calories * 4.184;
  const sugar = input.sugar ?? input.carbs * 0.4;
  const satFat = input.saturated_fat ?? input.fat * 0.35;
  const sodium = input.sodium_mg ?? 0;
  const fiber = input.fiber ?? 0;

  // Normalize per 100g (estimate weight if missing)
  let weight = input.serving_weight_g;
  if (!weight || weight <= 0) {
    const dryWeight = input.protein + input.carbs + input.fat + fiber;
    weight = Math.max(dryWeight * 2, 1);
  }

  const factor = 100 / weight;
  const e = energyKJ * factor;
  const sf = satFat * factor;
  const su = sugar * factor;
  const so = sodium * factor;
  const fi = fiber * factor;
  const pr = input.protein * factor;

  // Negative points
  const energyN = scoreThreshold(e, [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350]);
  const satFatN = scoreThreshold(sf, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const sugarN = scoreThreshold(su, [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45]);
  const sodiumN = scoreThreshold(so, [90, 180, 270, 360, 450, 540, 630, 720, 810, 900]);
  const N = energyN + satFatN + sugarN + sodiumN;

  // Positive points
  const fiberP = scoreThreshold(fi, [0.9, 1.9, 2.8, 3.7, 4.7]);
  const proteinP = scoreThreshold(pr, [1.6, 3.2, 4.8, 6.4, 8.0]);
  // Fruits/veg/nuts: default 0 (we don't have this data)
  const fvnP = 0;

  // Final score
  let score: number;
  if (N < 11) {
    score = N - (fiberP + proteinP + fvnP);
  } else if (fvnP >= 5) {
    score = N - (fiberP + proteinP + fvnP);
  } else {
    // If N >= 11 and fvn < 5, protein is NOT counted
    score = N - (fiberP + fvnP);
  }

  // Grade
  let grade: NutriScoreGrade;
  if (score <= -1) grade = 'A';
  else if (score <= 2) grade = 'B';
  else if (score <= 10) grade = 'C';
  else if (score <= 18) grade = 'D';
  else grade = 'E';

  return { score, grade };
}

function scoreThreshold(value: number, thresholds: number[]): number {
  let score = 0;
  for (const t of thresholds) {
    if (value > t) score++;
    else break;
  }
  return score;
}

// ── Combined Scoring ─────────────────────────────────────────────────────

/**
 * Calculate all scoring systems at once.
 * Returns results with a data completeness indicator.
 */
export function calculateAllScores(input: NutritionScoringInput): ScoringResult {
  // Data completeness: count how many fields are actual vs estimated
  let fieldsPresent = 4; // calories, protein, carbs, fat are always present
  let fieldsTotal = 8;
  if (input.fiber !== undefined) fieldsPresent++;
  if (input.sugar !== undefined) fieldsPresent++;
  if (input.saturated_fat !== undefined) fieldsPresent++;
  if (input.sodium_mg !== undefined) fieldsPresent++;
  // serving_weight_g is not counted because it's mainly for Noom

  const noom = calculateNoomColor(input);
  const nutri = calculateNutriScore(input);

  return {
    wwPoints: calculateWWSmartPoints(input),
    wwClassicPoints: calculateWWClassicPoints(input),
    noomColor: noom.color,
    noomCalorieDensity: noom.density,
    nutriScore: nutri.score,
    nutriScoreGrade: nutri.grade,
    dataCompleteness: Math.round((fieldsPresent / fieldsTotal) * 100),
  };
}

// ── Display Helpers ──────────────────────────────────────────────────────

export const NOOM_COLOR_CONFIG: Record<NoomColor, { bg: string; text: string; border: string; labelDe: string; labelEn: string }> = {
  green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', labelDe: 'Gruen', labelEn: 'Green' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', labelDe: 'Gelb', labelEn: 'Yellow' },
  red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', labelDe: 'Rot', labelEn: 'Red' },
};

export const NUTRI_SCORE_CONFIG: Record<NutriScoreGrade, { bg: string; text: string; colorHex: string }> = {
  A: { bg: 'bg-green-600', text: 'text-white', colorHex: '#16a34a' },
  B: { bg: 'bg-lime-500', text: 'text-white', colorHex: '#84cc16' },
  C: { bg: 'bg-yellow-400', text: 'text-gray-900', colorHex: '#facc15' },
  D: { bg: 'bg-orange-500', text: 'text-white', colorHex: '#f97316' },
  E: { bg: 'bg-red-600', text: 'text-white', colorHex: '#dc2626' },
};

/** Available scoring systems for user selection */
export type ScoringSystem = 'wwSmartPoints' | 'wwClassic' | 'noom' | 'nutriScore';

export const SCORING_SYSTEMS: { key: ScoringSystem; labelDe: string; labelEn: string; descDe: string; descEn: string }[] = [
  {
    key: 'wwSmartPoints',
    labelDe: 'WW SmartPoints',
    labelEn: 'WW SmartPoints',
    descDe: 'Punkte basierend auf Kalorien, gesaettigtem Fett, Zucker und Protein',
    descEn: 'Points based on calories, saturated fat, sugar, and protein',
  },
  {
    key: 'wwClassic',
    labelDe: 'WW Klassisch',
    labelEn: 'WW Classic',
    descDe: 'Klassische Punkte: Kalorien + Fett - Ballaststoffe',
    descEn: 'Classic points: calories + fat - fiber',
  },
  {
    key: 'noom',
    labelDe: 'Noom Farben',
    labelEn: 'Noom Colors',
    descDe: 'Kaloriendichte-Ampel (Gruen/Gelb/Rot)',
    descEn: 'Calorie density traffic light (Green/Yellow/Red)',
  },
  {
    key: 'nutriScore',
    labelDe: 'Nutri-Score',
    labelEn: 'Nutri-Score',
    descDe: 'EU-Naehrwertbewertung von A (best) bis E',
    descEn: 'EU nutrition grade from A (best) to E',
  },
];
