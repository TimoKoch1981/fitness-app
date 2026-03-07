/**
 * CyclePhaseWidget — Mini-Widget fuer das Cockpit.
 *
 * Zeigt aktuelle Zyklusphase + Emoji + kurzen Tagesstipp.
 * Nur sichtbar wenn Zyklus-Tracking aktiviert UND Daten vorhanden.
 */

import { useMemo } from 'react';
import { useTranslation } from '../../../i18n';
import { useMenstrualCycleLogs, getCyclePhaseEmoji, estimateCyclePhase, daysBetweenDates } from '../hooks/useMenstrualCycle';
import type { CyclePhase } from '../../../types/health';

interface Props {
  cycleTrackingEnabled?: boolean;
}

const PHASE_TIPS: Record<CyclePhase, { de: string; en: string }> = {
  menstruation: {
    de: 'Leichtes Training okay. Eisen & Magnesium priorisieren.',
    en: 'Light training is fine. Prioritize iron & magnesium.',
  },
  follicular: {
    de: 'Gute Phase fuer Kraft & HIIT. Nutze den Energieschub!',
    en: 'Great phase for strength & HIIT. Use the energy boost!',
  },
  ovulation: {
    de: 'Leistungs-Peak! Aufwaermen wichtig — Bandlaxitaet erhoeht.',
    en: 'Performance peak! Warm up well — ligament laxity increased.',
  },
  luteal: {
    de: 'RPE kann hoeher sein — das ist normal. Moderate Intensitaet.',
    en: 'RPE may feel higher — this is normal. Moderate intensity.',
  },
};

const PHASE_COLORS: Record<CyclePhase, string> = {
  menstruation: 'bg-red-50 border-red-200',
  follicular: 'bg-green-50 border-green-200',
  ovulation: 'bg-amber-50 border-amber-200',
  luteal: 'bg-purple-50 border-purple-200',
};

const PHASE_TEXT_COLORS: Record<CyclePhase, string> = {
  menstruation: 'text-red-700',
  follicular: 'text-green-700',
  ovulation: 'text-amber-700',
  luteal: 'text-purple-700',
};

export function CyclePhaseWidget({ cycleTrackingEnabled }: Props) {
  const { language } = useTranslation();
  const { data: cycleLogs } = useMenstrualCycleLogs(7);

  const currentPhase = useMemo<CyclePhase | null>(() => {
    if (!cycleLogs || cycleLogs.length === 0) return null;

    const latest = cycleLogs[0];
    const daysSince = daysBetweenDates(latest.date, new Date().toISOString().split('T')[0]);

    // If entry is from today or yesterday, use logged phase
    if (daysSince <= 1) return latest.phase;

    // If last entry was menstruation, estimate based on days
    if (latest.phase === 'menstruation') {
      return estimateCyclePhase(latest.date, daysSince);
    }

    // If more than 3 days old, data is stale — don't show
    if (daysSince > 3) return null;

    return latest.phase;
  }, [cycleLogs]);

  if (!cycleTrackingEnabled || !currentPhase) return null;

  const de = language === 'de';
  const phaseNames: Record<CyclePhase, { de: string; en: string }> = {
    menstruation: { de: 'Menstruation', en: 'Menstruation' },
    follicular: { de: 'Follikelphase', en: 'Follicular Phase' },
    ovulation: { de: 'Eisprung', en: 'Ovulation' },
    luteal: { de: 'Lutealphase', en: 'Luteal Phase' },
  };

  const tip = PHASE_TIPS[currentPhase];
  const colors = PHASE_COLORS[currentPhase];
  const textColor = PHASE_TEXT_COLORS[currentPhase];

  return (
    <div className={`rounded-xl p-3 border ${colors}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getCyclePhaseEmoji(currentPhase)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-semibold ${textColor}`}>
              {de ? phaseNames[currentPhase].de : phaseNames[currentPhase].en}
            </h3>
            <span className="text-[10px] text-gray-400">
              {de ? 'Zyklus-Tracker' : 'Cycle Tracker'}
            </span>
          </div>
          <p className="text-xs text-gray-600 mt-0.5">
            {de ? tip.de : tip.en}
          </p>
        </div>
      </div>
    </div>
  );
}
