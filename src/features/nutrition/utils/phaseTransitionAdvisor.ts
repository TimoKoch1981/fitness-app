/**
 * Phase Transition Advisor — Detects signals for recommending phase changes.
 *
 * Analyzes:
 * - Weight stagnation (>2 weeks no change in cut)
 * - Body fat target reached
 * - Training performance decline (>10% volume drop)
 * - Phase duration exceeded (recommended max)
 *
 * Used by NutritionAgent to proactively suggest transitions.
 *
 * Evidence:
 * - Helms et al. 2014: Contest preparation guidelines
 * - Trexler et al. 2014: Metabolic adaptation
 * - Campbell et al. 2020: Contest prep recovery
 */

import type { TrainingPhase } from '../../../types/health';

export interface PhaseTransitionSignal {
  /** Should a transition be recommended? */
  shouldTransition: boolean;
  /** Confidence level 0-1 */
  confidence: number;
  /** Recommended next phase */
  suggestedPhase: TrainingPhase;
  /** Reasons for the recommendation */
  reasons: { de: string; en: string }[];
  /** How urgent (info, warning, critical) */
  urgency: 'info' | 'warning' | 'critical';
}

interface PhaseTransitionInput {
  /** Current training phase */
  currentPhase: TrainingPhase;
  /** Weeks in current phase */
  weeksInPhase: number;
  /** Target weeks for phase (user-set) */
  targetWeeks?: number;
  /** Body fat percentage (if known) */
  bodyFatPct?: number;
  /** Target body fat percentage (if set) */
  targetBodyFatPct?: number;
  /** Recent weight trend (last 3 weeks, kg) */
  recentWeights?: number[];
  /** Has the user logged reduced training volume? */
  volumeDeclinePct?: number;
}

/** Recommended maximum weeks per phase */
const MAX_PHASE_WEEKS: Record<TrainingPhase, number> = {
  cut: 20,
  bulk: 24,
  maintenance: 52,
  peak_week: 1,
  reverse_diet: 8,
  off_season: 52,
};

export function analyzePhaseTransition(input: PhaseTransitionInput): PhaseTransitionSignal {
  const {
    currentPhase,
    weeksInPhase,
    targetWeeks,
    bodyFatPct,
    targetBodyFatPct,
    recentWeights,
    volumeDeclinePct,
  } = input;

  const reasons: { de: string; en: string }[] = [];
  let confidence = 0;
  let suggestedPhase: TrainingPhase = 'maintenance';
  let urgency: 'info' | 'warning' | 'critical' = 'info';

  switch (currentPhase) {
    case 'cut': {
      // 1. Duration exceeded
      const maxWeeks = targetWeeks ?? MAX_PHASE_WEEKS.cut;
      if (weeksInPhase >= maxWeeks) {
        reasons.push({
          de: `Cut dauert bereits ${weeksInPhase} Wochen (Ziel: ${maxWeeks}). Reverse Diet empfohlen.`,
          en: `Cut has been ${weeksInPhase} weeks (target: ${maxWeeks}). Reverse diet recommended.`,
        });
        confidence += 0.4;
        suggestedPhase = 'reverse_diet';
        urgency = 'warning';
      }

      // 2. Weight stagnation
      if (recentWeights && recentWeights.length >= 3) {
        const range = Math.max(...recentWeights) - Math.min(...recentWeights);
        if (range < 0.3) { // Less than 300g change in 3 weeks
          reasons.push({
            de: 'Gewichtsstagnation seit 3+ Wochen. Metabolische Adaptation moeglich.',
            en: 'Weight stagnation for 3+ weeks. Metabolic adaptation possible.',
          });
          confidence += 0.3;
          if (!suggestedPhase || suggestedPhase === 'maintenance') suggestedPhase = 'reverse_diet';
        }
      }

      // 3. Body fat target reached
      if (bodyFatPct != null && targetBodyFatPct != null && bodyFatPct <= targetBodyFatPct) {
        reasons.push({
          de: `Ziel-KFA erreicht (${bodyFatPct}% ≤ ${targetBodyFatPct}%). Reverse Diet starten.`,
          en: `Target body fat reached (${bodyFatPct}% ≤ ${targetBodyFatPct}%). Start reverse diet.`,
        });
        confidence += 0.5;
        suggestedPhase = 'reverse_diet';
        urgency = 'warning';
      }

      // 4. Training performance decline
      if (volumeDeclinePct != null && volumeDeclinePct > 10) {
        reasons.push({
          de: `Trainingsvolumen um ${volumeDeclinePct}% gesunken. Diaet-Erschoepfung moeglich.`,
          en: `Training volume down ${volumeDeclinePct}%. Diet fatigue possible.`,
        });
        confidence += 0.2;
        urgency = urgency === 'info' ? 'warning' : urgency;
      }

      // 5. Very long cut — critical
      if (weeksInPhase >= 24) {
        urgency = 'critical';
        confidence = Math.max(confidence, 0.8);
      }
      break;
    }

    case 'bulk': {
      const maxWeeks = targetWeeks ?? MAX_PHASE_WEEKS.bulk;
      if (weeksInPhase >= maxWeeks) {
        reasons.push({
          de: `Aufbauphase seit ${weeksInPhase} Wochen. Maintenance-Phase empfohlen.`,
          en: `Bulk phase for ${weeksInPhase} weeks. Maintenance phase recommended.`,
        });
        confidence += 0.3;
        suggestedPhase = 'maintenance';
        urgency = 'warning';
      }

      // Body fat getting too high
      if (bodyFatPct != null && bodyFatPct > 20) {
        reasons.push({
          de: `KFA bei ${bodyFatPct}% — Mini-Cut oder Maintenance empfohlen.`,
          en: `Body fat at ${bodyFatPct}% — mini-cut or maintenance recommended.`,
        });
        confidence += 0.4;
        suggestedPhase = 'cut';
        urgency = 'warning';
      }
      break;
    }

    case 'reverse_diet': {
      // Check if TDEE reached (approximated by weeks)
      const expectedWeeksToTdee = 5; // ~500kcal deficit / 100kcal per week = 5 weeks
      if (weeksInPhase >= expectedWeeksToTdee) {
        reasons.push({
          de: `Reverse Diet seit ${weeksInPhase} Wochen. TDEE wahrscheinlich erreicht — Maintenance empfohlen.`,
          en: `Reverse diet for ${weeksInPhase} weeks. TDEE likely reached — maintenance recommended.`,
        });
        confidence += 0.5;
        suggestedPhase = 'maintenance';
        urgency = 'info';
      }
      break;
    }

    case 'peak_week': {
      if (weeksInPhase >= 1) {
        suggestedPhase = 'reverse_diet';
        reasons.push({
          de: 'Peak Week abgeschlossen. Reverse Diet empfohlen fuer Erholung.',
          en: 'Peak week completed. Reverse diet recommended for recovery.',
        });
        confidence = 0.9;
        urgency = 'critical';
      }
      break;
    }

    default:
      // maintenance, off_season — no automatic transitions
      break;
  }

  return {
    shouldTransition: confidence >= 0.3,
    confidence: Math.min(1, confidence),
    suggestedPhase,
    reasons,
    urgency,
  };
}

/**
 * Format the transition signal for display in the Nutrition Agent context.
 */
export function formatTransitionForAgent(signal: PhaseTransitionSignal, language: 'de' | 'en'): string {
  if (!signal.shouldTransition || signal.reasons.length === 0) return '';
  const de = language === 'de';
  const header = de ? 'PHASE-TRANSITION-EMPFEHLUNG' : 'PHASE TRANSITION RECOMMENDATION';
  const phaseLabel = de
    ? { cut: 'Definitionsphase', bulk: 'Aufbauphase', maintenance: 'Erhaltung', peak_week: 'Peak Week', reverse_diet: 'Reverse Diet', off_season: 'Off-Season' }[signal.suggestedPhase]
    : { cut: 'Cut', bulk: 'Bulk', maintenance: 'Maintenance', peak_week: 'Peak Week', reverse_diet: 'Reverse Diet', off_season: 'Off-Season' }[signal.suggestedPhase];

  const reasonTexts = signal.reasons.map(r => `- ${de ? r.de : r.en}`).join('\n');
  return `\n[${header}]\n${de ? 'Empfohlen' : 'Recommended'}: ${phaseLabel}\n${de ? 'Konfidenz' : 'Confidence'}: ${Math.round(signal.confidence * 100)}%\n${de ? 'Gruende' : 'Reasons'}:\n${reasonTexts}\n`;
}
