/**
 * mesocycleReview.ts — Mesozyklus-Review Analyse
 *
 * Pure Functions (kein Supabase, keine Side Effects).
 * Analysiert den abgeschlossenen Mesozyklus und generiert Empfehlungen:
 * - continue: Plan laeuft gut, naechster Mesozyklus
 * - deload: Deload-Woche empfehlen
 * - swap: Einzelne Uebungen tauschen (Plateau)
 * - overhaul: Grundlegende Planaenderung noetig
 *
 * Konzept: KONZEPT_KI_TRAINER.md Block C, Mesozyklus-Review
 */

import type { Workout, TrainingPlanDay, ReviewConfig, SessionFeedback } from '../../../types/health';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReviewRecommendation = 'continue' | 'deload' | 'swap' | 'overhaul';

export interface MesocycleReviewSummary {
  /** Overall recommendation */
  recommendation: ReviewRecommendation;
  /** Human-readable summary (German) */
  summaryDE: string;
  /** Human-readable summary (English) */
  summaryEN: string;
  /** Average completion rate across the mesocycle */
  avgCompletionRate: number;
  /** Number of sessions completed in the mesocycle */
  sessionsCompleted: number;
  /** Exercises on a plateau (3+ sessions same weight) */
  plateauExercises: string[];
  /** Number of sessions with joint pain reported */
  sessionsWithPain: number;
  /** Average feeling across sessions */
  avgFeeling: string;
  /** Whether a deload week was recommended */
  deloadRecommended: boolean;
}

// ---------------------------------------------------------------------------
// Main Review Function
// ---------------------------------------------------------------------------

/**
 * Generate a mesocycle review summary.
 *
 * @param workouts - All workouts within the mesocycle period (newest first)
 * @param planDays - Current training plan days
 * @param reviewConfig - The review_config from the plan
 * @returns Review summary with recommendation
 */
export function generateReviewSummary(
  workouts: Workout[],
  _planDays: TrainingPlanDay[],
  reviewConfig: ReviewConfig,
): MesocycleReviewSummary {
  if (workouts.length === 0) {
    return {
      recommendation: 'continue',
      summaryDE: 'Keine Workouts im Mesozyklus gefunden.',
      summaryEN: 'No workouts found in mesocycle.',
      avgCompletionRate: 0,
      sessionsCompleted: 0,
      plateauExercises: [],
      sessionsWithPain: 0,
      avgFeeling: 'unknown',
      deloadRecommended: false,
    };
  }

  // Gather session feedbacks
  const feedbacks = workouts
    .map(w => w.session_feedback as SessionFeedback | null)
    .filter((f): f is SessionFeedback => f != null);

  // 1. Average completion rate
  const completionRates = feedbacks
    .map(f => f.completion_rate)
    .filter((r): r is number => r != null);
  const avgCompletionRate = completionRates.length > 0
    ? completionRates.reduce((s, r) => s + r, 0) / completionRates.length
    : 1;

  // 2. Plateau exercises (from latest auto_calculated)
  const latestAuto = feedbacks.find(f => f.auto_calculated)?.auto_calculated;
  const plateauExercises = latestAuto?.plateau_exercises ?? [];

  // 3. Joint pain count
  const sessionsWithPain = feedbacks.filter(f =>
    f.joint_pain && f.joint_pain.length > 0 && f.joint_pain_rating >= 2
  ).length;

  // 4. Average feeling
  const feelingMap: Record<string, number> = { easy: 1, good: 2, hard: 3, exhausted: 4 };
  const feelingScores = feedbacks
    .map(f => feelingMap[f.overall_feeling] ?? 2)
    .filter(s => s > 0);
  const avgFeelingScore = feelingScores.length > 0
    ? feelingScores.reduce((s, v) => s + v, 0) / feelingScores.length
    : 2;
  const avgFeeling = avgFeelingScore <= 1.5 ? 'easy'
    : avgFeelingScore <= 2.5 ? 'good'
      : avgFeelingScore <= 3.5 ? 'hard'
        : 'exhausted';

  // 5. Determine recommendation
  const deloadWeek = reviewConfig.deload_week ?? 4;
  const currentWeek = reviewConfig.current_week ?? 1;
  const deloadRecommended = currentWeek >= deloadWeek;

  const recommendation = determineRecommendation({
    avgCompletionRate,
    plateauCount: plateauExercises.length,
    sessionsWithPain,
    avgFeelingScore,
    sessionsCompleted: workouts.length,
    deloadRecommended,
  });

  // 6. Generate summary
  const { summaryDE, summaryEN } = generateSummaryText(recommendation, {
    avgCompletionRate,
    plateauExercises,
    sessionsWithPain,
    avgFeeling,
    sessionsCompleted: workouts.length,
    deloadRecommended,
  });

  return {
    recommendation,
    summaryDE,
    summaryEN,
    avgCompletionRate: Math.round(avgCompletionRate * 100) / 100,
    sessionsCompleted: workouts.length,
    plateauExercises,
    sessionsWithPain,
    avgFeeling,
    deloadRecommended,
  };
}

// ---------------------------------------------------------------------------
// Recommendation Logic
// ---------------------------------------------------------------------------

function determineRecommendation(data: {
  avgCompletionRate: number;
  plateauCount: number;
  sessionsWithPain: number;
  avgFeelingScore: number;
  sessionsCompleted: number;
  deloadRecommended: boolean;
}): ReviewRecommendation {
  // Overhaul: very low completion OR high pain + bad feeling
  if (data.avgCompletionRate < 0.5 || (data.sessionsWithPain >= 3 && data.avgFeelingScore >= 3.5)) {
    return 'overhaul';
  }

  // Deload: feeling hard/exhausted OR deload week reached
  if (data.deloadRecommended && data.avgFeelingScore >= 3) {
    return 'deload';
  }

  // Swap: multiple exercises on plateau
  if (data.plateauCount >= 2) {
    return 'swap';
  }

  // Continue: everything looks good
  return 'continue';
}

// ---------------------------------------------------------------------------
// Summary Text Generation
// ---------------------------------------------------------------------------

function generateSummaryText(
  recommendation: ReviewRecommendation,
  data: {
    avgCompletionRate: number;
    plateauExercises: string[];
    sessionsWithPain: number;
    avgFeeling: string;
    sessionsCompleted: number;
    deloadRecommended: boolean;
  },
): { summaryDE: string; summaryEN: string } {
  const pct = Math.round(data.avgCompletionRate * 100);
  const feelDE: Record<string, string> = { easy: 'leicht', good: 'gut', hard: 'anstrengend', exhausted: 'erschoepfend' };
  const feelEN: Record<string, string> = { easy: 'easy', good: 'good', hard: 'hard', exhausted: 'exhausting' };

  switch (recommendation) {
    case 'continue':
      return {
        summaryDE: `Guter Mesozyklus! ${data.sessionsCompleted} Sessions, ${pct}% Abschlussrate, Gefuehl: ${feelDE[data.avgFeeling] ?? data.avgFeeling}. Weiter so!`,
        summaryEN: `Good mesocycle! ${data.sessionsCompleted} sessions, ${pct}% completion, feeling: ${feelEN[data.avgFeeling] ?? data.avgFeeling}. Keep it up!`,
      };
    case 'deload':
      return {
        summaryDE: `Deload empfohlen: ${data.sessionsCompleted} Sessions, Gefuehl: ${feelDE[data.avgFeeling] ?? data.avgFeeling}. Volumen und Intensitaet fuer 1 Woche reduzieren.`,
        summaryEN: `Deload recommended: ${data.sessionsCompleted} sessions, feeling: ${feelEN[data.avgFeeling] ?? data.avgFeeling}. Reduce volume and intensity for 1 week.`,
      };
    case 'swap': {
      const plateaus = data.plateauExercises.slice(0, 3).join(', ');
      return {
        summaryDE: `Plateau bei: ${plateaus}. Uebungsvarianten empfohlen um neue Reize zu setzen.`,
        summaryEN: `Plateau at: ${plateaus}. Exercise variations recommended for new stimuli.`,
      };
    }
    case 'overhaul':
      return {
        summaryDE: `Plan-Ueberarbeitung noetig: Nur ${pct}% Abschlussrate${data.sessionsWithPain >= 3 ? `, ${data.sessionsWithPain}x Schmerzen gemeldet` : ''}. Volumen, Intensitaet oder Uebungsauswahl grundlegend anpassen.`,
        summaryEN: `Plan overhaul needed: Only ${pct}% completion${data.sessionsWithPain >= 3 ? `, pain reported ${data.sessionsWithPain}x` : ''}. Fundamentally adjust volume, intensity, or exercise selection.`,
      };
  }
}
