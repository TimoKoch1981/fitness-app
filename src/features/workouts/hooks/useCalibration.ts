/**
 * useCalibration.ts — BW-Multiplier Berechnung + Smart Presets fuer CalibrationWizard
 *
 * Pure Logic (keine Side Effects). Berechnet Startgewichte basierend auf:
 * - Koerpergewicht × BW-Multiplier (nach Erfahrungslevel + Geschlecht)
 * - 10 Referenz-Uebungen mit Fuzzy-Matching
 *
 * Quellen: NSCA (Haff & Triplett 2016), ExRx.net, Rhea 2004 (PMID:15142003)
 */

import type { TrainingPlanDay, PlanExercise, ReviewConfig, TrainingMode } from '../../../types/health';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface BwMultiplierEntry {
  name_de: string;
  name_en: string;
  aliases: string[];
  beginner_m: number;
  intermediate_m: number;
  advanced_m: number;
  beginner_f: number;
  intermediate_f: number;
  advanced_f: number;
}

export interface CalibrationExercise {
  planDayId: string;
  exerciseIndex: number;
  name: string;
  suggestedWeight: number | null;
  userWeight: number | null;
  matchedReference: string | null;
  isBodyweight?: boolean;
}

export interface ReviewPreset {
  mesocycle_weeks: number;
  deload_week: number;
}

// ---------------------------------------------------------------------------
// BW-Multiplier Table (10 Uebungen × 3 Level × 2 Geschlechter)
// Quelle: trainerReview.ts Lines 47-65
// ---------------------------------------------------------------------------

export const BW_MULTIPLIER_TABLE: BwMultiplierEntry[] = [
  {
    name_de: 'Bankdruecken', name_en: 'Bench Press',
    aliases: ['bench press', 'bankdruecken', 'bankdrücken', 'flachbank', 'flat bench', 'bench', 'brustpresse'],
    beginner_m: 0.30, intermediate_m: 0.65, advanced_m: 1.0,
    beginner_f: 0.15, intermediate_f: 0.40, advanced_f: 0.65,
  },
  {
    name_de: 'Kniebeuge', name_en: 'Squat',
    aliases: ['squat', 'kniebeuge', 'back squat', 'backsquat', 'front squat'],
    beginner_m: 0.40, intermediate_m: 0.80, advanced_m: 1.25,
    beginner_f: 0.25, intermediate_f: 0.55, advanced_f: 0.85,
  },
  {
    name_de: 'Kreuzheben', name_en: 'Deadlift',
    aliases: ['deadlift', 'kreuzheben', 'conventional deadlift', 'sumo deadlift', 'trap bar deadlift', 'trap-bar deadlift'],
    beginner_m: 0.50, intermediate_m: 1.0, advanced_m: 1.5,
    beginner_f: 0.30, intermediate_f: 0.65, advanced_f: 1.0,
  },
  {
    name_de: 'Schulterdruecken', name_en: 'Overhead Press',
    aliases: ['overhead press', 'ohp', 'schulterdruecken', 'schulterdrücken', 'überkopfdrücken', 'ueberkopfdruecken', 'military press', 'shoulder press'],
    beginner_m: 0.20, intermediate_m: 0.45, advanced_m: 0.65,
    beginner_f: 0.10, intermediate_f: 0.25, advanced_f: 0.40,
  },
  {
    name_de: 'Rudern', name_en: 'Row',
    aliases: ['row', 'rudern', 'barbell row', 'bent over row', 'langhantelrudern', 'pendlay row', 't-bar row', 'kurzhantelrudern', 'dumbbell row', 'einarmiges rudern'],
    beginner_m: 0.25, intermediate_m: 0.55, advanced_m: 0.85,
    beginner_f: 0.15, intermediate_f: 0.35, advanced_f: 0.55,
  },
  {
    name_de: 'Bizepscurls', name_en: 'Bicep Curls',
    aliases: ['bicep curl', 'bizepscurls', 'bizeps curls', 'curls', 'langhantelcurls', 'hammer curls', 'sz curls'],
    beginner_m: 0.10, intermediate_m: 0.20, advanced_m: 0.30,
    beginner_f: 0.05, intermediate_f: 0.12, advanced_f: 0.20,
  },
  {
    name_de: 'Trizepsdruecken', name_en: 'Tricep Pushdown',
    aliases: ['tricep pushdown', 'trizepsdruecken', 'trizepsdrücken', 'skull crushers', 'french press', 'dips'],
    beginner_m: 0.10, intermediate_m: 0.18, advanced_m: 0.28,
    beginner_f: 0.05, intermediate_f: 0.10, advanced_f: 0.18,
  },
  {
    name_de: 'Latzug', name_en: 'Lat Pulldown',
    aliases: ['lat pulldown', 'latzug', 'latziehen', 'pull down', 'pulldown', 'klimmzug', 'pull up', 'chin up'],
    beginner_m: 0.35, intermediate_m: 0.65, advanced_m: 0.90,
    beginner_f: 0.20, intermediate_f: 0.40, advanced_f: 0.60,
  },
  {
    name_de: 'Beinpresse', name_en: 'Leg Press',
    aliases: ['leg press', 'beinpresse', 'leg press 45'],
    beginner_m: 0.80, intermediate_m: 1.5, advanced_m: 2.2,
    beginner_f: 0.50, intermediate_f: 1.0, advanced_f: 1.5,
  },
  {
    name_de: 'Wadenheben', name_en: 'Calf Raise',
    aliases: ['calf raise', 'wadenheben', 'standing calf raise', 'seated calf raise', 'wadenmaschine'],
    beginner_m: 0.40, intermediate_m: 0.80, advanced_m: 1.2,
    beginner_f: 0.25, intermediate_f: 0.50, advanced_f: 0.80,
  },
  {
    name_de: 'Face Pulls', name_en: 'Face Pull',
    aliases: ['face pull', 'face pulls', 'facepull', 'facepulls', 'cable face pull'],
    beginner_m: 0.10, intermediate_m: 0.18, advanced_m: 0.25,
    beginner_f: 0.05, intermediate_f: 0.10, advanced_f: 0.15,
  },
  {
    name_de: 'Seitheben', name_en: 'Lateral Raise',
    aliases: ['lateral raise', 'seitheben', 'seitenheben', 'side raise', 'lateral raises', 'kurzhantel seitheben'],
    beginner_m: 0.05, intermediate_m: 0.10, advanced_m: 0.15,
    beginner_f: 0.03, intermediate_f: 0.06, advanced_f: 0.10,
  },
];

// ---------------------------------------------------------------------------
// Exercise Matching (Fuzzy)
// ---------------------------------------------------------------------------

/**
 * Fuzzy-match a plan exercise name against the BW-Multiplier reference table.
 * Strategy: exact → alias → partial (includes)
 */
export function matchExerciseToReference(
  exerciseName: string,
  table: BwMultiplierEntry[] = BW_MULTIPLIER_TABLE,
): BwMultiplierEntry | null {
  const normalized = exerciseName.toLowerCase().trim();

  // 1. Exact match on name_de or name_en
  for (const entry of table) {
    if (
      normalized === entry.name_de.toLowerCase() ||
      normalized === entry.name_en.toLowerCase()
    ) {
      return entry;
    }
  }

  // 2. Alias match (exact)
  for (const entry of table) {
    if (entry.aliases.some((alias) => normalized === alias.toLowerCase())) {
      return entry;
    }
  }

  // 3. Partial match (contains)
  for (const entry of table) {
    if (
      normalized.includes(entry.name_de.toLowerCase()) ||
      normalized.includes(entry.name_en.toLowerCase()) ||
      entry.name_de.toLowerCase().includes(normalized) ||
      entry.name_en.toLowerCase().includes(normalized)
    ) {
      return entry;
    }
  }

  // 4. Partial alias match
  for (const entry of table) {
    if (
      entry.aliases.some(
        (alias) =>
          normalized.includes(alias.toLowerCase()) ||
          alias.toLowerCase().includes(normalized),
      )
    ) {
      return entry;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Weight Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate suggested starting weight: bodyWeight × multiplier, rounded to nearest 2.5 kg.
 */
export function calculateSuggestedWeight(
  bodyWeight: number,
  level: ExperienceLevel,
  gender: 'male' | 'female' | 'other',
  entry: BwMultiplierEntry,
): number {
  // For gender 'other', use female multipliers (more conservative / safer)
  const genderKey = gender === 'male' ? 'm' : 'f';
  const key = `${level}_${genderKey}` as keyof BwMultiplierEntry;
  const multiplier = entry[key] as number;
  const raw = bodyWeight * multiplier;
  return Math.round(raw / 2.5) * 2.5;
}

// ---------------------------------------------------------------------------
// Calibrate All Exercises
// ---------------------------------------------------------------------------

/**
 * Process all exercises across all plan days.
 * Skips cardio and flexibility exercises (no weight_kg).
 */
export function calibrateAllExercises(
  days: TrainingPlanDay[],
  bodyWeight: number,
  level: ExperienceLevel,
  gender: 'male' | 'female' | 'other',
): CalibrationExercise[] {
  const results: CalibrationExercise[] = [];

  for (const day of days) {
    for (let i = 0; i < day.exercises.length; i++) {
      const exercise = day.exercises[i];

      // Skip non-strength exercises
      if (isCardioOrFlex(exercise)) continue;

      const isBodyweight = isBodyweightExercise(exercise.name);
      const matched = matchExerciseToReference(exercise.name);
      const suggestedWeight = matched && !isBodyweight
        ? calculateSuggestedWeight(bodyWeight, level, gender, matched)
        : null;

      results.push({
        planDayId: day.id,
        exerciseIndex: i,
        name: exercise.name,
        suggestedWeight,
        userWeight: exercise.weight_kg ?? suggestedWeight,
        matchedReference: matched && !isBodyweight ? matched.name_de : null,
        isBodyweight,
      });
    }
  }

  return results;
}

/**
 * Bodyweight exercises: no weight suggestion applicable (user lifts their own weight).
 */
const BODYWEIGHT_KEYWORDS = [
  'klimmzug', 'klimmzüge', 'pull up', 'pullup', 'chin up', 'chinup',
  'dip', 'dips', 'push up', 'pushup', 'liegestütz', 'liegestuetz',
  'plank', 'pike push', 'muscle up', 'muscleup',
  'hanging', 'dead hang',
];

function isBodyweightExercise(name: string): boolean {
  const n = name.toLowerCase().trim();
  return BODYWEIGHT_KEYWORDS.some((kw) => n.includes(kw));
}

/**
 * Check if an exercise is cardio or flexibility (no weight needed).
 */
function isCardioOrFlex(exercise: PlanExercise): boolean {
  const type = exercise.exercise_type;
  if (type === 'cardio' || type === 'flexibility') return true;
  // Heuristic: has duration but no sets → likely cardio
  if (exercise.duration_minutes && !exercise.sets) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Smart Presets
// ---------------------------------------------------------------------------

/**
 * Get smart review preset based on experience, training mode, and optional PED cycle status.
 * Concept: KONZEPT_KI_TRAINER.md Lines 319-335
 */
export function getSmartPreset(
  level: ExperienceLevel,
  trainingMode: TrainingMode = 'standard',
  cycleStatus?: string | null,
): ReviewPreset {
  // Power+ mode: PED-cycle-specific presets
  if (trainingMode === 'power_plus') {
    if (cycleStatus === 'blast') return { mesocycle_weeks: 6, deload_week: 6 };
    if (cycleStatus === 'pct') return { mesocycle_weeks: 3, deload_week: 2 };
    // cruise or default
    return { mesocycle_weeks: 4, deload_week: 4 };
  }

  // Standard / Power: experience-based
  if (level === 'beginner') return { mesocycle_weeks: 3, deload_week: 3 };
  if (level === 'advanced') return { mesocycle_weeks: 5, deload_week: 4 };
  // intermediate default
  return { mesocycle_weeks: 4, deload_week: 4 };
}

/**
 * Default review trigger thresholds.
 * Concept: KONZEPT_KI_TRAINER.md + Migration Schema
 */
export function getDefaultReviewTriggers(): ReviewConfig['review_triggers'] {
  return {
    plateau_sessions: 3,
    missed_sessions_pct: 30,
    joint_pain_threshold: 3,
    sleep_days_threshold: 5,
    rpe_drift_threshold: 2,
  };
}

// ---------------------------------------------------------------------------
// RIR (Reps in Reserve) Feedback — Weight Adjustment
// ---------------------------------------------------------------------------

/**
 * Calculate weight adjustment based on RIR feedback (first session only).
 *
 * - "lighter" (felt too light, 4+ reps in reserve) → +15% (more weight needed)
 * - "heavier" (barely made it, 0-1 RIR) → −15% (less weight needed)
 *
 * Result is rounded to nearest 2.5 kg step, minimum 2.5 kg.
 * Concept: KONZEPT_KI_TRAINER.md Block B, RIR-Feedback
 */
export function calculateRIRAdjustment(
  currentWeight: number,
  direction: 'lighter' | 'heavier',
  _exerciseName?: string,
): number {
  const factor = direction === 'lighter' ? 1.15 : 0.85;
  const raw = currentWeight * factor;
  const rounded = Math.round(raw / 2.5) * 2.5;
  return Math.max(rounded, 2.5);
}
