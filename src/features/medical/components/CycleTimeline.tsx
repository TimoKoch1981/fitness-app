/**
 * CycleTimeline — Visualisierung der letzten 3 Zyklen als Farbbalken.
 *
 * Zeigt eine horizontale Timeline mit farbcodierten Phasen:
 *   Rot = Menstruation, Gruen = Follikelphase, Amber = Eisprung, Lila = Lutealphase
 *
 * Berechnet Zyklen anhand aufeinanderfolgender Menstruations-Eintraege.
 * Zeigt Zykluslaenge, durchschnittliche Zykluslaenge und aktuelle Phase.
 */

import { useMemo } from 'react';
import { useTranslation } from '../../../i18n';
import { useMenstrualCycleLogs, getCyclePhaseEmoji, daysBetweenDates } from '../hooks/useMenstrualCycle';
import type { MenstrualCycleLog, CyclePhase } from '../../../types/health';

interface CycleInfo {
  startDate: string;
  endDate: string;
  lengthDays: number;
  phases: Array<{ phase: CyclePhase; startDay: number; endDay: number }>;
}

export const PHASE_BAR_COLORS: Record<CyclePhase, string> = {
  menstruation: 'bg-red-400',
  follicular: 'bg-green-400',
  ovulation: 'bg-amber-400',
  luteal: 'bg-purple-400',
  spotting: 'bg-orange-400',
};

export const PHASE_TEXT_COLORS: Record<CyclePhase, string> = {
  menstruation: 'text-red-600',
  follicular: 'text-green-600',
  ovulation: 'text-amber-600',
  luteal: 'text-purple-600',
  spotting: 'text-orange-600',
};

/** Group logs into cycles based on menstruation start dates */
function buildCycles(logs: MenstrualCycleLog[]): CycleInfo[] {
  if (logs.length === 0) return [];

  // Sort oldest first
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  // Find menstruation start dates (first day of each menstruation period)
  const menstruationStarts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].phase === 'menstruation') {
      const prev = sorted[i - 1];
      // New menstruation start if: first entry, or previous entry is not menstruation, or gap > 2 days
      if (!prev || prev.phase !== 'menstruation' || daysBetweenDates(prev.date, sorted[i].date) > 2) {
        menstruationStarts.push(sorted[i].date);
      }
    }
  }

  if (menstruationStarts.length < 2) {
    // Not enough data for full cycles, show current partial cycle
    if (menstruationStarts.length === 1) {
      const start = menstruationStarts[0];
      const today = new Date().toISOString().split('T')[0];
      const length = daysBetweenDates(start, today);
      const phases = buildPhasesForCycle(sorted, start, today);
      return [{ startDate: start, endDate: today, lengthDays: length, phases }];
    }
    return [];
  }

  const cycles: CycleInfo[] = [];
  for (let i = 0; i < menstruationStarts.length - 1 && cycles.length < 3; i++) {
    const start = menstruationStarts[i];
    const nextStart = menstruationStarts[i + 1];
    // End date is day before next menstruation starts
    const endDate = addDays(nextStart, -1);
    const length = daysBetweenDates(start, nextStart);

    if (length >= 18 && length <= 45) {
      const phases = buildPhasesForCycle(sorted, start, endDate);
      cycles.push({ startDate: start, endDate, lengthDays: length, phases });
    }
  }

  // Add current (partial) cycle if there's a latest menstruation start
  const lastStart = menstruationStarts[menstruationStarts.length - 1];
  const today = new Date().toISOString().split('T')[0];
  const currentLength = daysBetweenDates(lastStart, today);
  if (currentLength > 0 && currentLength <= 45 && cycles.length < 3) {
    const phases = buildPhasesForCycle(sorted, lastStart, today);
    cycles.push({ startDate: lastStart, endDate: today, lengthDays: currentLength, phases });
  }

  return cycles.slice(-3); // Return last 3
}

/** Build phase segments for a single cycle */
function buildPhasesForCycle(
  allLogs: MenstrualCycleLog[],
  startDate: string,
  endDate: string,
): Array<{ phase: CyclePhase; startDay: number; endDay: number }> {
  const cycleLogs = allLogs.filter(l => l.date >= startDate && l.date <= endDate);
  if (cycleLogs.length === 0) return [];

  const totalDays = daysBetweenDates(startDate, endDate) || 1;
  const phases: Array<{ phase: CyclePhase; startDay: number; endDay: number }> = [];
  let currentPhase: CyclePhase | null = null;
  let phaseStartDay = 0;

  for (const log of cycleLogs) {
    const logPhase = log.phase ?? 'follicular';
    const dayNum = daysBetweenDates(startDate, log.date);
    if (currentPhase === null) {
      currentPhase = logPhase;
      phaseStartDay = dayNum;
    } else if (logPhase !== currentPhase) {
      phases.push({ phase: currentPhase, startDay: phaseStartDay, endDay: dayNum - 1 });
      currentPhase = logPhase;
      phaseStartDay = dayNum;
    }
  }

  // Close last phase
  if (currentPhase) {
    phases.push({ phase: currentPhase, startDay: phaseStartDay, endDay: totalDays });
  }

  // Fill gaps with estimated phases if logged data is sparse
  if (phases.length === 0) {
    // Fallback: split into rough 28-day segments
    phases.push(
      { phase: 'menstruation', startDay: 0, endDay: Math.min(4, totalDays) },
      { phase: 'follicular', startDay: 5, endDay: Math.min(13, totalDays) },
      { phase: 'ovulation', startDay: 14, endDay: Math.min(15, totalDays) },
      { phase: 'luteal', startDay: 16, endDay: totalDays },
    );
  }

  return phases.filter(p => p.endDay <= totalDays + 1);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function formatShortDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
}

interface CycleTimelineProps {
  cycleTrackingEnabled?: boolean;
}

export function CycleTimeline({ cycleTrackingEnabled }: CycleTimelineProps) {
  const { language } = useTranslation();
  const { data: logs } = useMenstrualCycleLogs(90);
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  const de = language === 'de';

  const cycles = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    return buildCycles(logs);
  }, [logs]);

  const avgLength = useMemo(() => {
    if (cycles.length < 2) return null;
    const completeCycles = cycles.filter((_, i) => i < cycles.length - 1); // Exclude current partial
    if (completeCycles.length === 0) return null;
    const sum = completeCycles.reduce((acc, c) => acc + c.lengthDays, 0);
    return Math.round(sum / completeCycles.length);
  }, [cycles]);

  if (!cycleTrackingEnabled || cycles.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {de ? 'Zyklus-Verlauf' : 'Cycle Timeline'}
        </h3>
        {avgLength && (
          <span className="text-xs text-gray-500">
            {de ? `\u00D8 ${avgLength} Tage` : `\u00D8 ${avgLength} days`}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {cycles.map((cycle, idx) => {
          const isCurrentCycle = idx === cycles.length - 1 && cycle.endDate === new Date().toISOString().split('T')[0];
          return (
            <div key={cycle.startDate} className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span>
                  {formatShortDate(cycle.startDate, locale)}
                  {isCurrentCycle && (
                    <span className="ml-1 text-rose-500 font-medium">
                      {de ? '(aktuell)' : '(current)'}
                    </span>
                  )}
                </span>
                <span>{cycle.lengthDays} {de ? 'Tage' : 'days'}</span>
              </div>

              {/* Phase bar */}
              <div className="flex h-5 rounded-full overflow-hidden bg-gray-100">
                {cycle.phases.map((p, pi) => {
                  const total = cycle.lengthDays || 1;
                  const width = ((p.endDay - p.startDay + 1) / total) * 100;
                  return (
                    <div
                      key={pi}
                      className={`${PHASE_BAR_COLORS[p.phase]} flex items-center justify-center`}
                      style={{ width: `${Math.max(width, 3)}%` }}
                      title={`${getCyclePhaseEmoji(p.phase)} ${p.phase} (${de ? 'Tag' : 'Day'} ${p.startDay + 1}-${p.endDay + 1})`}
                    >
                      {width > 12 && (
                        <span className="text-[8px] text-white font-medium truncate px-0.5">
                          {getCyclePhaseEmoji(p.phase)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 pt-2 border-t border-gray-100">
        {(['menstruation', 'follicular', 'ovulation', 'luteal', 'spotting'] as const).map(phase => {
          const labels: Record<CyclePhase, { de: string; en: string }> = {
            menstruation: { de: 'Menstruation', en: 'Menstruation' },
            follicular: { de: 'Follikel', en: 'Follicular' },
            ovulation: { de: 'Eisprung', en: 'Ovulation' },
            luteal: { de: 'Luteal', en: 'Luteal' },
            spotting: { de: 'Schmierblutung', en: 'Spotting' },
          };
          return (
            <div key={phase} className="flex items-center gap-1">
              <div className={`w-2.5 h-2.5 rounded-full ${PHASE_BAR_COLORS[phase]}`} />
              <span className={`text-[10px] ${PHASE_TEXT_COLORS[phase]}`}>
                {de ? labels[phase].de : labels[phase].en}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
