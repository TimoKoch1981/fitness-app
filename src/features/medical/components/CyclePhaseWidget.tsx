/**
 * CyclePhaseWidget — Prominent cycle card for the Cockpit.
 *
 * Shows:
 *   - Current cycle phase + emoji + training tip
 *   - Cycle day X of Y (predicted length)
 *   - Mini progress bar showing position in cycle
 *   - Next period prediction with days countdown
 *   - Confidence indicator
 *
 * Only visible when cycle_tracking_enabled AND gender is female/other.
 * Uses the useCyclePrediction hook for forward-looking predictions.
 */

import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { getCyclePhaseEmoji } from '../hooks/useMenstrualCycle';
import { useCyclePrediction } from '../hooks/useCyclePrediction';
import type { CyclePhase } from '../../../types/health';

interface Props {
  cycleTrackingEnabled?: boolean;
  onStartTracking?: () => void;
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
  spotting: {
    de: 'Schmierblutung — Training normal moeglich. Bei Schmerzen Intensitaet reduzieren.',
    en: 'Spotting — training as normal. Reduce intensity if experiencing pain.',
  },
};

const PHASE_COLORS: Record<CyclePhase, string> = {
  menstruation: 'bg-red-50 border-red-200',
  follicular: 'bg-green-50 border-green-200',
  ovulation: 'bg-amber-50 border-amber-200',
  luteal: 'bg-purple-50 border-purple-200',
  spotting: 'bg-orange-50 border-orange-200',
};

const PHASE_TEXT_COLORS: Record<CyclePhase, string> = {
  menstruation: 'text-red-700',
  follicular: 'text-green-700',
  ovulation: 'text-amber-700',
  luteal: 'text-purple-700',
  spotting: 'text-orange-700',
};

const PHASE_BAR_COLORS: Record<CyclePhase, string> = {
  menstruation: 'bg-red-400',
  follicular: 'bg-green-400',
  ovulation: 'bg-amber-400',
  luteal: 'bg-purple-400',
  spotting: 'bg-orange-400',
};

const PHASE_NAMES: Record<CyclePhase, { de: string; en: string }> = {
  menstruation: { de: 'Menstruation', en: 'Menstruation' },
  follicular: { de: 'Follikelphase', en: 'Follicular Phase' },
  ovulation: { de: 'Eisprung', en: 'Ovulation' },
  luteal: { de: 'Lutealphase', en: 'Luteal Phase' },
  spotting: { de: 'Schmierblutung', en: 'Spotting' },
};

const CONFIDENCE_DOTS: Record<string, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3,
};

export function CyclePhaseWidget({ cycleTrackingEnabled, onStartTracking }: Props) {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const prediction = useCyclePrediction();

  if (!cycleTrackingEnabled) return null;

  const de = language === 'de';
  const phase = prediction.currentPhase;

  // No data at all — show CTA to start logging (only when no phase can be estimated)
  if (!phase) {
    return (
      <button
        onClick={() => onStartTracking ? onStartTracking() : navigate('/cycle')}
        className="w-full rounded-xl p-4 border border-rose-200 bg-rose-50 shadow-sm text-left flex items-center gap-3 hover:bg-rose-100 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
          <Calendar className="h-5 w-5 text-rose-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-rose-800">
            {de ? 'Zyklus-Tracking starten' : 'Start Cycle Tracking'}
          </p>
          <p className="text-xs text-rose-600 mt-0.5">
            {de
              ? 'Trage deine Periode ein fuer personalisierte Vorhersagen'
              : 'Log your period for personalized predictions'}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 text-rose-400 flex-shrink-0" />
      </button>
    );
  }

  const colors = PHASE_COLORS[phase];
  const textColor = PHASE_TEXT_COLORS[phase];
  const barColor = PHASE_BAR_COLORS[phase];
  const tip = PHASE_TIPS[phase];
  const phaseName = de ? PHASE_NAMES[phase].de : PHASE_NAMES[phase].en;

  // Progress through cycle
  const cycleProgress = prediction.currentCycleDay && prediction.predictedCycleLength
    ? Math.min(100, Math.round((prediction.currentCycleDay / prediction.predictedCycleLength) * 100))
    : 0;

  const confidenceDots = CONFIDENCE_DOTS[prediction.confidence] ?? 0;

  // Format prediction date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString(de ? 'de-DE' : 'en-US', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${colors}`}>
      {/* Header */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{getCyclePhaseEmoji(phase)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-semibold ${textColor}`}>
                {phaseName}
              </h3>
              {prediction.currentCycleDay && (
                <span className="text-[10px] text-gray-500 bg-white/60 px-1.5 py-0.5 rounded-full">
                  {de ? `Tag ${prediction.currentCycleDay}` : `Day ${prediction.currentCycleDay}`}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              {de ? tip.de : tip.en}
            </p>
          </div>
        </div>

        {/* Cycle Progress Bar */}
        {prediction.currentCycleDay && (
          <div className="mt-2.5">
            <div className="flex justify-between text-[9px] text-gray-400 mb-0.5">
              <span>{de ? `Zyklus ~${prediction.predictedCycleLength} Tage` : `Cycle ~${prediction.predictedCycleLength} days`}</span>
              <span>{cycleProgress}%</span>
            </div>
            <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${cycleProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Fertile Window Banner */}
      {prediction.isFertileToday && (
        <div className="mx-3 mb-2 px-2.5 py-1.5 bg-amber-100 border border-amber-200 rounded-lg flex items-center gap-2">
          <span className="text-sm">{'\u{1F95A}'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-amber-800">
              {de ? 'Fruchtbares Fenster' : 'Fertile Window'}
            </p>
            <p className="text-[9px] text-amber-600">
              {de
                ? `Bis ${new Date(prediction.fertileWindowEnd!).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}`
                : `Until ${new Date(prediction.fertileWindowEnd!).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`}
            </p>
          </div>
        </div>
      )}
      {!prediction.isFertileToday && prediction.daysUntilFertile !== null && prediction.daysUntilFertile <= 5 && (
        <div className="mx-3 mb-2 px-2.5 py-1.5 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-2">
          <span className="text-xs">{'\u{1F95A}'}</span>
          <p className="text-[10px] text-amber-700">
            {de
              ? `Fruchtbares Fenster in ${prediction.daysUntilFertile} ${prediction.daysUntilFertile === 1 ? 'Tag' : 'Tagen'}`
              : `Fertile window in ${prediction.daysUntilFertile} day${prediction.daysUntilFertile === 1 ? '' : 's'}`}
          </p>
        </div>
      )}

      {/* Prediction Footer */}
      {prediction.daysUntilPeriod !== null && (
        <div className="border-t border-inherit bg-white/40 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Next Period */}
            <div>
              <p className="text-[9px] text-gray-400 uppercase tracking-wide">
                {de ? 'Nächste Periode' : 'Next Period'}
              </p>
              <p className="text-xs font-semibold text-gray-700">
                {prediction.daysUntilPeriod <= 1
                  ? (de ? 'Heute/Morgen' : 'Today/Tomorrow')
                  : (de ? `in ${prediction.daysUntilPeriod} Tagen` : `in ${prediction.daysUntilPeriod} days`)}
              </p>
              <p className="text-[9px] text-gray-400">
                {formatDate(prediction.nextPeriodDate)}
              </p>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200" />

            {/* Next Ovulation */}
            {prediction.daysUntilOvulation !== null && prediction.daysUntilOvulation > 0 && (
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">
                  {de ? 'Eisprung' : 'Ovulation'}
                </p>
                <p className="text-xs font-semibold text-gray-700">
                  {prediction.daysUntilOvulation <= 1
                    ? (de ? 'Heute/Morgen' : 'Today/Tomorrow')
                    : (de ? `in ${prediction.daysUntilOvulation} T.` : `in ${prediction.daysUntilOvulation} d.`)}
                </p>
                <p className="text-[9px] text-gray-400">
                  {formatDate(prediction.nextOvulationDate)}
                </p>
              </div>
            )}
          </div>

          {/* Confidence Dots */}
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex gap-0.5">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i <= confidenceDots ? 'bg-rose-400' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-[8px] text-gray-400">
              {de ? prediction.confidenceLabel.de : prediction.confidenceLabel.en}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
