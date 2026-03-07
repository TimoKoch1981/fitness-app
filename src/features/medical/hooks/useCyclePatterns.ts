/**
 * useCyclePatterns — Muster-Erkennung ueber mehrere Zyklen.
 *
 * Analysiert gespeicherte Zyklus-Logs und berechnet:
 *   - Durchschnittliche Zykluslaenge
 *   - Phase-spezifische Durchschnitte (Energie, Stimmung)
 *   - Haeufigste Symptome pro Phase
 *   - Trend-Erkennung (Zykluslaenge stabil/variabel)
 *
 * Gibt Insights als strukturierte Daten zurueck fuer UI-Darstellung + KI-Kontext.
 */

import { useMemo } from 'react';
import { useMenstrualCycleLogs, daysBetweenDates } from './useMenstrualCycle';
import type { CyclePhase, CycleSymptom, MenstrualCycleLog } from '../../../types/health';

export interface PhaseAverage {
  phase: CyclePhase;
  avgEnergy: number | null;
  avgMood: number | null;
  logCount: number;
  topSymptoms: Array<{ symptom: CycleSymptom; count: number }>;
}

export interface CyclePatternData {
  /** Average cycle length in days (null if not enough data) */
  avgCycleLength: number | null;
  /** Cycle length standard deviation — high = irregular */
  cycleLengthStdDev: number | null;
  /** Number of complete cycles found */
  completeCycleCount: number;
  /** Phase-specific averages */
  phaseAverages: PhaseAverage[];
  /** Overall top symptoms across all phases */
  overallTopSymptoms: Array<{ symptom: CycleSymptom; count: number }>;
  /** Insights as short text keys for display */
  insights: CycleInsight[];
  /** Has enough data for meaningful analysis (>= 2 complete cycles) */
  hasSufficientData: boolean;
}

export interface CycleInsight {
  type: 'info' | 'positive' | 'warning';
  key: string;
  de: string;
  en: string;
}

/** Find menstruation start dates in sorted (ascending) logs */
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

/** Calculate cycle lengths from menstruation start dates */
function calculateCycleLengths(starts: string[]): number[] {
  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const len = daysBetweenDates(starts[i - 1], starts[i]);
    if (len >= 18 && len <= 45) {
      lengths.push(len);
    }
  }
  return lengths;
}

/** Standard deviation */
function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const squaredDiffs = values.map(v => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((s, v) => s + v, 0) / (values.length - 1));
}

/** Compute per-phase statistics */
function computePhaseAverages(logs: MenstrualCycleLog[]): PhaseAverage[] {
  const phases: CyclePhase[] = ['menstruation', 'follicular', 'ovulation', 'luteal'];
  return phases.map(phase => {
    const phaseLogs = logs.filter(l => l.phase === phase);
    const energies = phaseLogs.map(l => l.energy_level).filter((e): e is number => e != null && e > 0);
    const moods = phaseLogs.map(l => l.mood).filter((m): m is number => m != null && m > 0);

    // Count symptom frequency
    const symptomCounts: Map<CycleSymptom, number> = new Map();
    for (const log of phaseLogs) {
      const symptoms = (log.symptoms ?? []) as CycleSymptom[];
      for (const s of symptoms) {
        symptomCounts.set(s, (symptomCounts.get(s) ?? 0) + 1);
      }
    }

    const topSymptoms = Array.from(symptomCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symptom, count]) => ({ symptom, count }));

    return {
      phase,
      avgEnergy: energies.length > 0 ? +(energies.reduce((s, v) => s + v, 0) / energies.length).toFixed(1) : null,
      avgMood: moods.length > 0 ? +(moods.reduce((s, v) => s + v, 0) / moods.length).toFixed(1) : null,
      logCount: phaseLogs.length,
      topSymptoms,
    };
  });
}

/** Generate insights based on patterns */
function generateInsights(
  cycleLengths: number[],
  sd: number | null,
  phaseAvgs: PhaseAverage[],
): CycleInsight[] {
  const insights: CycleInsight[] = [];

  // Cycle regularity
  if (cycleLengths.length >= 2 && sd !== null) {
    if (sd <= 2) {
      insights.push({
        type: 'positive',
        key: 'cycle_regular',
        de: 'Dein Zyklus ist sehr regelmaessig — gute Grundlage fuer Trainingsplanung.',
        en: 'Your cycle is very regular — great base for training planning.',
      });
    } else if (sd > 5) {
      insights.push({
        type: 'warning',
        key: 'cycle_irregular',
        de: 'Dein Zyklus variiert stark. Bei Unregelmaessigkeiten aerztlichen Rat einholen.',
        en: 'Your cycle varies significantly. Consult a doctor if irregularity persists.',
      });
    }
  }

  // Energy dip in luteal
  const luteal = phaseAvgs.find(p => p.phase === 'luteal');
  const follicular = phaseAvgs.find(p => p.phase === 'follicular');
  if (luteal?.avgEnergy && follicular?.avgEnergy && luteal.avgEnergy < follicular.avgEnergy - 0.8) {
    insights.push({
      type: 'info',
      key: 'luteal_energy_dip',
      de: 'Deine Energie sinkt in der Lutealphase deutlich — reduzierte Intensitaet einplanen.',
      en: 'Your energy drops noticeably in the luteal phase — plan for reduced intensity.',
    });
  }

  // High symptom burden in menstruation
  const menstruation = phaseAvgs.find(p => p.phase === 'menstruation');
  if (menstruation && menstruation.topSymptoms.length >= 3) {
    const totalCount = menstruation.topSymptoms.reduce((s, t) => s + t.count, 0);
    if (totalCount > menstruation.logCount * 2) {
      insights.push({
        type: 'info',
        key: 'menstruation_symptoms',
        de: 'Du hast waehrend der Menstruation haeufig mehrere Symptome — leichtes Training + Erholung priorisieren.',
        en: 'You frequently report multiple symptoms during menstruation — prioritize light training + recovery.',
      });
    }
  }

  // Mood pattern
  if (luteal?.avgMood && follicular?.avgMood && luteal.avgMood < follicular.avgMood - 1) {
    insights.push({
      type: 'info',
      key: 'luteal_mood_drop',
      de: 'Stimmungseinbruch in der Lutealphase erkannt — progesteronbedingt, normal bei PMS.',
      en: 'Mood dip detected in luteal phase — progesterone-related, normal with PMS.',
    });
  }

  return insights;
}

export function useCyclePatterns(): CyclePatternData {
  const { data: logs } = useMenstrualCycleLogs(180); // 6 months

  return useMemo<CyclePatternData>(() => {
    if (!logs || logs.length < 3) {
      return {
        avgCycleLength: null,
        cycleLengthStdDev: null,
        completeCycleCount: 0,
        phaseAverages: [],
        overallTopSymptoms: [],
        insights: [],
        hasSufficientData: false,
      };
    }

    const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
    const starts = findMenstruationStarts(sorted);
    const lengths = calculateCycleLengths(starts);

    const avg = lengths.length > 0
      ? Math.round(lengths.reduce((s, v) => s + v, 0) / lengths.length)
      : null;

    const sd = lengths.length >= 2 ? +stdDev(lengths).toFixed(1) : null;

    const phaseAverages = computePhaseAverages(sorted);

    // Overall symptoms
    const allSymptomCounts: Map<CycleSymptom, number> = new Map();
    for (const log of sorted) {
      const symptoms = (log.symptoms ?? []) as CycleSymptom[];
      for (const s of symptoms) {
        allSymptomCounts.set(s, (allSymptomCounts.get(s) ?? 0) + 1);
      }
    }
    const overallTopSymptoms = Array.from(allSymptomCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([symptom, count]) => ({ symptom, count }));

    const insights = generateInsights(lengths, sd, phaseAverages);

    return {
      avgCycleLength: avg,
      cycleLengthStdDev: sd,
      completeCycleCount: lengths.length,
      phaseAverages,
      overallTopSymptoms,
      insights,
      hasSufficientData: lengths.length >= 2,
    };
  }, [logs]);
}
