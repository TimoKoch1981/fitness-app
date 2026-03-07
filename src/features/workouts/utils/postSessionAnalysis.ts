/**
 * postSessionAnalysis.ts — Post-Session-Analyse fuer KI-Trainer Review-System
 *
 * Pure Functions (kein Supabase, keine Side Effects).
 * Analysiert eine abgeschlossene Workout-Session und berechnet:
 * - Completion Rate
 * - Plateau-Erkennung (3+ Sessions gleiches Gewicht)
 * - RPE-Drift (Gefuehl wird schwerer bei gleicher Last)
 * - Volumen pro Muskelgruppe
 *
 * Wird von useSaveWorkoutSession nach Auto-Progression aufgerufen.
 */

import type { Workout, WorkoutExerciseResult, SessionFeedback } from '../../../types/health';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostSessionAnalysis {
  completion_rate: number;                    // 0-1 (z.B. 0.95)
  volume_per_muscle: Record<string, number>;  // Muskelgruppe → Gesamtvolumen (sets × reps × weight)
  plateau_exercises: string[];                // Uebungsnamen ohne Fortschritt seit 3+ Sessions
  rpe_drift_exercises: string[];              // Uebungsnamen bei denen Gefuehl schlechter wird
  total_sets_completed: number;
  total_sets_planned: number;
}

// ---------------------------------------------------------------------------
// Main Analysis Function
// ---------------------------------------------------------------------------

/**
 * Analyze a completed workout session against recent history.
 *
 * @param currentExercises - Exercises from the session that was just saved
 * @param recentWorkouts - Last 5 workouts for the same plan (sorted newest first)
 * @param exerciseMuscleMap - Maps exercise name (lowercase) → muscle group names
 */
export function analyzeSession(
  currentExercises: WorkoutExerciseResult[],
  recentWorkouts: Workout[],
  exerciseMuscleMap?: Record<string, string[]>,
): PostSessionAnalysis {
  const completionResult = calculateCompletionRate(currentExercises);
  const volumePerMuscle = calculateVolumePerMuscle(currentExercises, exerciseMuscleMap);
  const plateauExercises = detectPlateauExercises(currentExercises, recentWorkouts);
  const rpeDriftExercises = detectRPEDrift(recentWorkouts);

  return {
    completion_rate: completionResult.rate,
    total_sets_completed: completionResult.completed,
    total_sets_planned: completionResult.planned,
    volume_per_muscle: volumePerMuscle,
    plateau_exercises: plateauExercises,
    rpe_drift_exercises: rpeDriftExercises,
  };
}

// ---------------------------------------------------------------------------
// Completion Rate
// ---------------------------------------------------------------------------

function calculateCompletionRate(exercises: WorkoutExerciseResult[]): {
  rate: number;
  completed: number;
  planned: number;
} {
  let totalPlanned = 0;
  let totalCompleted = 0;

  for (const ex of exercises) {
    if (ex.is_addition) continue; // User-added exercises don't count against plan

    totalPlanned += ex.sets.length;
    totalCompleted += ex.sets.filter(s => s.completed).length;
  }

  const rate = totalPlanned > 0 ? totalCompleted / totalPlanned : 1;
  return { rate: Math.round(rate * 100) / 100, completed: totalCompleted, planned: totalPlanned };
}

// ---------------------------------------------------------------------------
// Volume per Muscle Group
// ---------------------------------------------------------------------------

/**
 * Default muscle group mapping for common exercises.
 * Used as fallback when exercise_catalog data is not available.
 */
const DEFAULT_MUSCLE_MAP: Record<string, string[]> = {
  // Push
  'bankdruecken': ['chest', 'triceps', 'shoulders'],
  'bankdrücken': ['chest', 'triceps', 'shoulders'],
  'bench press': ['chest', 'triceps', 'shoulders'],
  'flachbank': ['chest', 'triceps', 'shoulders'],
  'schraegbankdruecken': ['chest', 'shoulders'],
  'incline bench': ['chest', 'shoulders'],
  'schulterdruecken': ['shoulders', 'triceps'],
  'schulterdrücken': ['shoulders', 'triceps'],
  'overhead press': ['shoulders', 'triceps'],
  'military press': ['shoulders', 'triceps'],
  'seitheben': ['shoulders'],
  'lateral raise': ['shoulders'],
  'trizepsdruecken': ['triceps'],
  'trizepsdrücken': ['triceps'],
  'tricep pushdown': ['triceps'],
  'dips': ['chest', 'triceps'],
  'french press': ['triceps'],
  'skull crushers': ['triceps'],
  'brustpresse': ['chest', 'triceps'],
  // Pull
  'rudern': ['back', 'biceps'],
  'row': ['back', 'biceps'],
  'barbell row': ['back', 'biceps'],
  'langhantelrudern': ['back', 'biceps'],
  'latzug': ['back', 'biceps'],
  'lat pulldown': ['back', 'biceps'],
  'klimmzug': ['back', 'biceps'],
  'pull up': ['back', 'biceps'],
  'chin up': ['back', 'biceps'],
  'bizepscurls': ['biceps'],
  'bizeps curls': ['biceps'],
  'bicep curl': ['biceps'],
  'curls': ['biceps'],
  'hammer curls': ['biceps'],
  'face pull': ['shoulders', 'back'],
  // Legs
  'kniebeuge': ['quads', 'glutes'],
  'squat': ['quads', 'glutes'],
  'back squat': ['quads', 'glutes'],
  'front squat': ['quads'],
  'kreuzheben': ['back', 'glutes', 'hamstrings'],
  'deadlift': ['back', 'glutes', 'hamstrings'],
  'beinpresse': ['quads', 'glutes'],
  'leg press': ['quads', 'glutes'],
  'beinstrecker': ['quads'],
  'leg extension': ['quads'],
  'beinbeuger': ['hamstrings'],
  'leg curl': ['hamstrings'],
  'wadenheben': ['calves'],
  'calf raise': ['calves'],
  'ausfallschritte': ['quads', 'glutes'],
  'lunges': ['quads', 'glutes'],
  'hip thrust': ['glutes'],
  'hueftheben': ['glutes'],
  // Core
  'plank': ['core'],
  'sit-up': ['core'],
  'crunch': ['core'],
  'bauchpresse': ['core'],
};

function calculateVolumePerMuscle(
  exercises: WorkoutExerciseResult[],
  customMap?: Record<string, string[]>,
): Record<string, number> {
  const volumeMap: Record<string, number> = {};
  const muscleMap = customMap ?? DEFAULT_MUSCLE_MAP;

  for (const ex of exercises) {
    if (ex.skipped) continue;

    // Find muscle groups for this exercise
    const normalizedName = ex.name.toLowerCase().trim();
    let muscles = muscleMap[normalizedName];

    // Try partial match if exact didn't work
    if (!muscles) {
      for (const [key, groups] of Object.entries(muscleMap)) {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
          muscles = groups;
          break;
        }
      }
    }

    if (!muscles) muscles = ['other'];

    // Calculate volume for completed sets: sets × reps × weight
    for (const set of ex.sets) {
      if (!set.completed) continue;
      const reps = set.actual_reps ?? 0;
      const weight = set.actual_weight_kg ?? 0;
      const volume = reps * weight;

      for (const muscle of muscles) {
        volumeMap[muscle] = (volumeMap[muscle] ?? 0) + volume;
      }
    }
  }

  return volumeMap;
}

// ---------------------------------------------------------------------------
// Plateau Detection
// ---------------------------------------------------------------------------

/**
 * Detect exercises where max weight hasn't increased in the last 3 sessions.
 * Compares the current session against the previous 2+ sessions.
 */
function detectPlateauExercises(
  currentExercises: WorkoutExerciseResult[],
  recentWorkouts: Workout[],
): string[] {
  if (recentWorkouts.length < 2) return []; // Need at least 2 previous sessions

  const plateauNames: string[] = [];

  for (const currentEx of currentExercises) {
    if (currentEx.skipped || currentEx.is_addition) continue;

    // Get max weight from current session
    const currentMaxWeight = getMaxWeight(currentEx.sets);
    if (currentMaxWeight === 0) continue;

    // Find this exercise in the last 2 recent workouts
    const previousWeights: number[] = [];
    for (const workout of recentWorkouts.slice(0, 2)) {
      const sessionExs = workout.session_exercises;
      if (!sessionExs) continue;

      const matching = sessionExs.find(
        se => se.name.toLowerCase() === currentEx.name.toLowerCase() && !se.skipped,
      );
      if (matching) {
        const maxW = getMaxWeight(matching.sets);
        if (maxW > 0) previousWeights.push(maxW);
      }
    }

    // Plateau: current weight === previous weight in 2+ sessions
    if (previousWeights.length >= 2 && previousWeights.every(w => w === currentMaxWeight)) {
      plateauNames.push(currentEx.name);
    }
  }

  return plateauNames;
}

function getMaxWeight(sets: Array<{ actual_weight_kg?: number; completed?: boolean }>): number {
  const weights = sets
    .filter(s => s.completed !== false && s.actual_weight_kg != null)
    .map(s => s.actual_weight_kg!);
  return weights.length > 0 ? Math.max(...weights) : 0;
}

// ---------------------------------------------------------------------------
// RPE Drift Detection
// ---------------------------------------------------------------------------

/**
 * Detect RPE drift: If overall feeling trends from 'easy'/'good' to 'hard'/'exhausted'
 * across last 3 sessions at similar or same weights.
 *
 * Simplified: Checks if the last 3 session_feedbacks show increasing difficulty.
 */
function detectRPEDrift(recentWorkouts: Workout[]): string[] {
  // Need at least 3 sessions with feedback to detect drift
  const feedbacks = recentWorkouts
    .slice(0, 3)
    .map(w => w.session_feedback)
    .filter((f): f is SessionFeedback => f != null);

  if (feedbacks.length < 3) return [];

  // Map feelings to numeric scale
  const feelingToScore: Record<string, number> = {
    easy: 1,
    good: 2,
    hard: 3,
    exhausted: 4,
  };

  const scores = feedbacks.map(f => feelingToScore[f.overall_feeling] ?? 2);

  // Drift = consistently increasing (newest is hardest)
  // scores[0] = most recent, scores[2] = oldest
  if (scores[0] > scores[1] && scores[1] > scores[2] && scores[0] >= 3) {
    // Find exercises that appear in all 3 sessions with same/lower weight
    return findDriftExercises(recentWorkouts.slice(0, 3));
  }

  return [];
}

/**
 * Find specific exercises showing RPE drift (same weight, harder feeling).
 */
function findDriftExercises(workouts: Workout[]): string[] {
  if (workouts.length < 2) return [];

  const newest = workouts[0];
  const oldest = workouts[workouts.length - 1];

  if (!newest.session_exercises || !oldest.session_exercises) return [];

  const driftNames: string[] = [];

  for (const newestEx of newest.session_exercises) {
    if (newestEx.skipped) continue;

    const oldestMatch = oldest.session_exercises.find(
      e => e.name.toLowerCase() === newestEx.name.toLowerCase() && !e.skipped,
    );
    if (!oldestMatch) continue;

    const newestMax = getMaxWeight(newestEx.sets);
    const oldestMax = getMaxWeight(oldestMatch.sets);

    // Same or lower weight → RPE drift (feeling harder at same load)
    if (newestMax > 0 && newestMax <= oldestMax) {
      driftNames.push(newestEx.name);
    }
  }

  return driftNames;
}
