/**
 * useCyclePrediction — Forward-looking cycle prediction.
 *
 * Predicts next period start, ovulation, and current cycle day
 * using a weighted moving average of past cycle lengths.
 *
 * Confidence tiers (aligned with industry standard — Clue, Flo, Apple Health):
 *   - 0 cycles:  Population prior (29 days), low confidence
 *   - 1-2 cycles: Simple average, low-medium confidence
 *   - 3-5 cycles: Weighted average, medium confidence
 *   - 6+ cycles:  Weighted average + variability, high confidence
 *
 * References:
 *   - Fehring et al. 2006 (PMID: 16865627) — cycle length variability
 *   - Bull et al. 2019 (PMID: 31523756) — Clue app population data, mean 29.3 days
 */

import { useMemo } from 'react';
import { useMenstrualCycleLogs, daysBetweenDates } from './useMenstrualCycle';
import type { MenstrualCycleLog, CyclePhase } from '../../../types/health';

/** Population average cycle length (Bull et al. 2019, PMID: 31523756) */
const POPULATION_PRIOR = 29;

/** Minimum physiological cycle length */
const MIN_CYCLE = 18;
/** Maximum physiological cycle length */
const MAX_CYCLE = 45;

export interface CyclePrediction {
  /** Predicted next period start date (ISO string) */
  nextPeriodDate: string | null;
  /** Days until next predicted period */
  daysUntilPeriod: number | null;
  /** Predicted ovulation date (ISO string) */
  nextOvulationDate: string | null;
  /** Days until next predicted ovulation */
  daysUntilOvulation: number | null;
  /** Current day in cycle (1-based) */
  currentCycleDay: number | null;
  /** Predicted cycle length used */
  predictedCycleLength: number;
  /** Current estimated phase */
  currentPhase: CyclePhase | null;
  /** Confidence level */
  confidence: 'none' | 'low' | 'medium' | 'high';
  /** Number of complete cycles used for prediction */
  cyclesUsed: number;
  /** Human-readable confidence label */
  confidenceLabel: { de: string; en: string };
  /** Last menstruation start date */
  lastPeriodStart: string | null;
}

/**
 * Find menstruation start dates from sorted (ascending) cycle logs.
 * A menstruation start is a 'menstruation' entry that isn't a continuation
 * of the previous day's menstruation.
 */
function findMenstruationStarts(sortedLogs: MenstrualCycleLog[]): string[] {
  const starts: string[] = [];
  for (let i = 0; i < sortedLogs.length; i++) {
    if (sortedLogs[i].phase === 'menstruation') {
      const prev = sortedLogs[i - 1];
      if (!prev || prev.phase !== 'menstruation' || daysBetweenDates(prev.date, sortedLogs[i].date) > 2) {
        starts.push(sortedLogs[i].date);
      }
    }
  }
  return starts;
}

/**
 * Calculate valid cycle lengths from menstruation start dates.
 * Filters out physiologically implausible values (< 18 or > 45 days).
 */
function calculateCycleLengths(starts: string[]): number[] {
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const len = daysBetweenDates(starts[i - 1], starts[i]);
    if (len >= MIN_CYCLE && len <= MAX_CYCLE) {
      lengths.push(len);
    }
  }
  return lengths;
}

/**
 * Weighted average of cycle lengths.
 * More recent cycles get higher weight (linear weighting).
 * E.g. with 4 cycles: weights are [1, 2, 3, 4] — most recent = 4.
 */
function weightedAverage(lengths: number[]): number {
  if (lengths.length === 0) return POPULATION_PRIOR;
  if (lengths.length === 1) return lengths[0];

  let weightedSum = 0;
  let totalWeight = 0;
  for (let i = 0; i < lengths.length; i++) {
    const weight = i + 1; // linear: older cycles get less weight
    weightedSum += lengths[i] * weight;
    totalWeight += weight;
  }
  return Math.round(weightedSum / totalWeight);
}

/**
 * Estimate current cycle phase from cycle day and predicted length.
 */
function estimatePhase(cycleDay: number, cycleLength: number): CyclePhase {
  if (cycleDay <= 5) return 'menstruation';
  if (cycleDay <= Math.round(cycleLength * 0.5)) return 'follicular';
  if (cycleDay <= Math.round(cycleLength * 0.5) + 2) return 'ovulation';
  return 'luteal';
}

/**
 * Add days to an ISO date string.
 */
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const CONFIDENCE_LABELS: Record<CyclePrediction['confidence'], { de: string; en: string }> = {
  none: {
    de: 'Keine Daten — Durchschnittswert',
    en: 'No data — using average',
  },
  low: {
    de: 'Wenige Daten — Vorhersage wird genauer',
    en: 'Limited data — prediction will improve',
  },
  medium: {
    de: 'Gute Datenbasis — zuverlässige Schätzung',
    en: 'Good data — reliable estimate',
  },
  high: {
    de: 'Starke Datenbasis — hohe Genauigkeit',
    en: 'Strong data — high accuracy',
  },
};

export function useCyclePrediction(): CyclePrediction {
  const { data: logs } = useMenstrualCycleLogs(365); // 12 months for solid prediction

  return useMemo<CyclePrediction>(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    // No data at all
    if (!logs || logs.length === 0) {
      return {
        nextPeriodDate: null,
        daysUntilPeriod: null,
        nextOvulationDate: null,
        daysUntilOvulation: null,
        currentCycleDay: null,
        predictedCycleLength: POPULATION_PRIOR,
        currentPhase: null,
        confidence: 'none',
        cyclesUsed: 0,
        confidenceLabel: CONFIDENCE_LABELS.none,
        lastPeriodStart: null,
      };
    }

    // Sort ascending for analysis
    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    const starts = findMenstruationStarts(sorted);

    if (starts.length === 0) {
      return {
        nextPeriodDate: null,
        daysUntilPeriod: null,
        nextOvulationDate: null,
        daysUntilOvulation: null,
        currentCycleDay: null,
        predictedCycleLength: POPULATION_PRIOR,
        currentPhase: null,
        confidence: 'none',
        cyclesUsed: 0,
        confidenceLabel: CONFIDENCE_LABELS.none,
        lastPeriodStart: null,
      };
    }

    const cycleLengths = calculateCycleLengths(starts);
    const lastPeriodStart = starts[starts.length - 1];
    const daysSinceLastPeriod = daysBetweenDates(lastPeriodStart, todayStr);

    // Determine predicted cycle length and confidence
    let predictedLength: number;
    let confidence: CyclePrediction['confidence'];

    if (cycleLengths.length === 0) {
      // Only 1 period logged, no complete cycle
      predictedLength = POPULATION_PRIOR;
      confidence = 'none';
    } else if (cycleLengths.length <= 2) {
      // 1-2 complete cycles: simple average
      predictedLength = Math.round(cycleLengths.reduce((s, v) => s + v, 0) / cycleLengths.length);
      confidence = 'low';
    } else if (cycleLengths.length <= 5) {
      // 3-5 cycles: weighted average
      predictedLength = weightedAverage(cycleLengths);
      confidence = 'medium';
    } else {
      // 6+ cycles: weighted average, high confidence
      predictedLength = weightedAverage(cycleLengths);
      confidence = 'high';
    }

    // Calculate current cycle day (1-based)
    const currentCycleDay = daysSinceLastPeriod + 1;

    // Predict next period: last period start + predicted length
    // If we're past the predicted date, add another cycle
    let nextPeriodDate = addDays(lastPeriodStart, predictedLength);
    if (nextPeriodDate <= todayStr) {
      nextPeriodDate = addDays(nextPeriodDate, predictedLength);
    }
    const daysUntilPeriod = daysBetweenDates(todayStr, nextPeriodDate);

    // Predict ovulation: ~14 days before next period (luteal phase is relatively constant)
    const ovulationDayInCycle = Math.max(1, predictedLength - 14);
    const nextOvulationDate = addDays(lastPeriodStart, ovulationDayInCycle);
    let actualOvulationDate = nextOvulationDate;
    if (actualOvulationDate <= todayStr) {
      // Ovulation already passed this cycle, calculate for next cycle
      actualOvulationDate = addDays(nextPeriodDate, ovulationDayInCycle);
    }
    const daysUntilOvulation = daysBetweenDates(todayStr, actualOvulationDate);

    // Current phase estimation
    const effectiveCycleDay = currentCycleDay <= predictedLength
      ? currentCycleDay
      : ((currentCycleDay - 1) % predictedLength) + 1;
    const currentPhase = estimatePhase(effectiveCycleDay, predictedLength);

    return {
      nextPeriodDate,
      daysUntilPeriod,
      nextOvulationDate: actualOvulationDate,
      daysUntilOvulation,
      currentCycleDay: effectiveCycleDay,
      predictedCycleLength: predictedLength,
      currentPhase,
      confidence,
      cyclesUsed: cycleLengths.length,
      confidenceLabel: CONFIDENCE_LABELS[confidence],
      lastPeriodStart,
    };
  }, [logs]);
}
