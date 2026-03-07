/**
 * reviewChanges.ts — Compute review changes for mesocycle review
 *
 * Pure Functions (kein Supabase, keine Side Effects).
 * Berechnet konkrete Plan-Aenderungen basierend auf Review-Empfehlung:
 * - continue: keine Aenderungen
 * - deload: alle Gewichte -40%, Saetze -1
 * - swap: Plateau-Uebungen durch Varianten ersetzen (Vorschlaege)
 * - overhaul: Volumen reduzieren, Uebungen vereinfachen
 *
 * Konzept: KONZEPT_KI_TRAINER.md Block D, Review-Dialog
 */

import type { TrainingPlanDay } from '../../../types/health';
import type { ReviewRecommendation } from './mesocycleReview';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExerciseChange {
  dayId: string;
  exerciseIndex: number;
  exerciseName: string;
  changeType: 'keep' | 'adjust_weight' | 'adjust_sets' | 'replace' | 'remove';
  /** Current value */
  currentWeight?: number;
  currentSets?: number;
  /** New value after change */
  newWeight?: number;
  newSets?: number;
  /** Replacement exercise suggestion (for swap) */
  replacementSuggestion?: string;
  /** Human-readable reason */
  reasonDE: string;
  reasonEN: string;
}

export interface ReviewChanges {
  recommendation: ReviewRecommendation;
  changes: ExerciseChange[];
  summaryDE: string;
  summaryEN: string;
}

// ---------------------------------------------------------------------------
// Swap Suggestions (Plateau-Varianten)
// ---------------------------------------------------------------------------

const SWAP_SUGGESTIONS: Record<string, string[]> = {
  'bankdruecken': ['Schrägbankdrücken', 'Kurzhantel-Bankdrücken', 'Brustpresse'],
  'bench press': ['Incline Bench Press', 'Dumbbell Bench Press', 'Chest Press'],
  'kniebeuge': ['Frontkniebeuge', 'Goblet Squat', 'Beinpresse'],
  'squat': ['Front Squat', 'Goblet Squat', 'Leg Press'],
  'kreuzheben': ['Rumänisches Kreuzheben', 'Trap-Bar Deadlift', 'Hip Thrust'],
  'deadlift': ['Romanian Deadlift', 'Trap Bar Deadlift', 'Hip Thrust'],
  'schulterdruecken': ['Arnold Press', 'Kurzhantel-Schulterdrücken', 'Landmine Press'],
  'overhead press': ['Arnold Press', 'Dumbbell OHP', 'Landmine Press'],
  'rudern': ['Kurzhantel-Rudern', 'Kabelrudern', 'T-Bar Row'],
  'row': ['Dumbbell Row', 'Cable Row', 'T-Bar Row'],
  'latzug': ['Klimmzüge', 'Enger Latzug', 'Straight Arm Pulldown'],
  'lat pulldown': ['Pull-Ups', 'Close Grip Pulldown', 'Straight Arm Pulldown'],
};

// ---------------------------------------------------------------------------
// Main Function
// ---------------------------------------------------------------------------

/**
 * Compute concrete plan changes based on review recommendation.
 */
export function computeReviewChanges(
  planDays: TrainingPlanDay[],
  recommendation: ReviewRecommendation,
  plateauExercises: string[] = [],
): ReviewChanges {
  const changes: ExerciseChange[] = [];

  switch (recommendation) {
    case 'continue':
      return {
        recommendation,
        changes: [],
        summaryDE: 'Keine Aenderungen noetig. Plan laeuft gut — weiter so!',
        summaryEN: 'No changes needed. Plan is working well — keep it up!',
      };

    case 'deload':
      for (const day of planDays) {
        for (let i = 0; i < day.exercises.length; i++) {
          const ex = day.exercises[i];
          if (ex.weight_kg != null && ex.weight_kg > 0) {
            const newWeight = roundToNearest(ex.weight_kg * 0.6, 2.5); // -40%
            const newSets = ex.sets && ex.sets > 1 ? ex.sets - 1 : ex.sets;
            changes.push({
              dayId: day.id,
              exerciseIndex: i,
              exerciseName: ex.name,
              changeType: 'adjust_weight',
              currentWeight: ex.weight_kg,
              currentSets: ex.sets,
              newWeight: Math.max(newWeight, 2.5),
              newSets,
              reasonDE: 'Deload: Gewicht -40%, Saetze -1',
              reasonEN: 'Deload: Weight -40%, Sets -1',
            });
          }
        }
      }
      return {
        recommendation,
        changes,
        summaryDE: `Deload-Woche: ${changes.length} Uebungen werden angepasst (Gewicht -40%, Saetze -1).`,
        summaryEN: `Deload week: ${changes.length} exercises adjusted (weight -40%, sets -1).`,
      };

    case 'swap': {
      const plateauSet = new Set(plateauExercises.map(n => n.toLowerCase()));

      for (const day of planDays) {
        for (let i = 0; i < day.exercises.length; i++) {
          const ex = day.exercises[i];
          const isOnPlateau = plateauSet.has(ex.name.toLowerCase());

          if (isOnPlateau) {
            const normalized = ex.name.toLowerCase().trim();
            const suggestions = findSwapSuggestion(normalized);

            changes.push({
              dayId: day.id,
              exerciseIndex: i,
              exerciseName: ex.name,
              changeType: 'replace',
              currentWeight: ex.weight_kg,
              replacementSuggestion: suggestions,
              reasonDE: `Plateau seit 3+ Sessions. Variante empfohlen: ${suggestions}`,
              reasonEN: `Plateau for 3+ sessions. Variant recommended: ${suggestions}`,
            });
          }
        }
      }
      return {
        recommendation,
        changes,
        summaryDE: `${changes.length} Uebungen auf Plateau — Varianten vorgeschlagen.`,
        summaryEN: `${changes.length} exercises on plateau — variants suggested.`,
      };
    }

    case 'overhaul':
      for (const day of planDays) {
        for (let i = 0; i < day.exercises.length; i++) {
          const ex = day.exercises[i];
          if (ex.weight_kg != null && ex.weight_kg > 0) {
            const newWeight = roundToNearest(ex.weight_kg * 0.8, 2.5); // -20%
            const newSets = ex.sets && ex.sets > 2 ? ex.sets - 1 : ex.sets;
            changes.push({
              dayId: day.id,
              exerciseIndex: i,
              exerciseName: ex.name,
              changeType: 'adjust_weight',
              currentWeight: ex.weight_kg,
              currentSets: ex.sets,
              newWeight: Math.max(newWeight, 2.5),
              newSets,
              reasonDE: 'Ueberarbeitung: Gewicht -20%, Saetze reduziert',
              reasonEN: 'Overhaul: Weight -20%, Sets reduced',
            });
          }
        }
      }
      return {
        recommendation,
        changes,
        summaryDE: `Grundlegende Anpassung: ${changes.length} Uebungen werden vereinfacht (Gewicht -20%).`,
        summaryEN: `Fundamental adjustment: ${changes.length} exercises simplified (weight -20%).`,
      };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function findSwapSuggestion(exerciseName: string): string {
  for (const [key, suggestions] of Object.entries(SWAP_SUGGESTIONS)) {
    if (exerciseName.includes(key) || key.includes(exerciseName)) {
      return suggestions[0]; // Return first suggestion
    }
  }
  return 'Variante wählen / Choose variant';
}
