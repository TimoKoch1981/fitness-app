/**
 * Phase Progress Bar Widget
 * Shows progress in the current training phase (bulk, cut, maintenance, etc.)
 * with visual progress bar and phase-specific info.
 * Visible in Power and Power+ modes when showPhaseProgress is true.
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Zap, RotateCcw, Sun, SkipForward } from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import { useProfile } from '../../../auth/hooks/useProfile';
import { useActivePhaseCycle, useAdvancePhase } from '../../hooks/usePhaseCycles';
import type { TrainingPhase } from '../../../../types/health';
import type { TrainingPhaseCycle } from '../../types/phaseCycle';

const PHASE_CONFIG: Record<TrainingPhase, {
  icon: typeof TrendingUp;
  color: string;
  bgColor: string;
  barColor: string;
  defaultWeeks: number;
}> = {
  bulk: {
    icon: TrendingUp,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
    barColor: 'bg-emerald-500',
    defaultWeeks: 16,
  },
  cut: {
    icon: TrendingDown,
    color: 'text-red-500',
    bgColor: 'bg-red-50 border-red-200',
    barColor: 'bg-red-500',
    defaultWeeks: 12,
  },
  maintenance: {
    icon: Minus,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 border-blue-200',
    barColor: 'bg-blue-500',
    defaultWeeks: 8,
  },
  peak_week: {
    icon: Zap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    barColor: 'bg-amber-500',
    defaultWeeks: 1,
  },
  reverse_diet: {
    icon: RotateCcw,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 border-purple-200',
    barColor: 'bg-purple-500',
    defaultWeeks: 6,
  },
  off_season: {
    icon: Sun,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 border-gray-200',
    barColor: 'bg-gray-400',
    defaultWeeks: 12,
  },
};

interface PhaseProgressBarProps {
  onClick?: () => void;
}

export function PhaseProgressBar({ onClick }: PhaseProgressBarProps = {}) {
  const { t, language } = useTranslation();
  const { data: profile } = useProfile();
  const { data: activeCycle } = useActivePhaseCycle();
  const de = language === 'de';

  const phase: TrainingPhase = profile?.current_phase ?? 'maintenance';
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;

  // Calculate phase progress based on phase_started_at and phase_target_weeks
  const phaseStartDate = profile?.phase_started_at;
  const plannedWeeks = profile?.phase_target_weeks ?? config.defaultWeeks;

  let elapsedWeeks = 0;
  let progressPercent = 0;

  if (phaseStartDate) {
    const start = new Date(phaseStartDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    elapsedWeeks = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)));
    progressPercent = plannedWeeks > 0
      ? Math.min(100, Math.round((elapsedWeeks / plannedWeeks) * 100))
      : 0; // indefinite phase (0 weeks) → no progress
  }

  const phaseLabel = t.power.phases[phase] ?? phase;

  return (
    <div
      className={`rounded-xl border p-4 ${config.bgColor} ${onClick ? 'cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.color}`} />
          <span className="text-sm font-semibold text-gray-900">
            {phaseLabel}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {phaseStartDate
            ? plannedWeeks > 0
              ? `${elapsedWeeks} / ${plannedWeeks} ${t.power.weeksShort}`
              : `${elapsedWeeks} ${t.power.weeksShort}`
            : t.power.noPhaseStart}
        </span>
      </div>

      {/* Progress bar */}
      <div className="bg-white/60 rounded-full h-2 overflow-hidden">
        <div
          className={`${config.barColor} rounded-full h-2 transition-all duration-500`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Phase hints */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-gray-400">
          {progressPercent}%
        </span>
        <div className="flex items-center gap-2">
          {activeCycle && (
            <span className="text-[10px] text-teal-600 flex items-center gap-0.5">
              <RotateCcw className="h-2.5 w-2.5" />
              {activeCycle.current_phase_index + 1}/{activeCycle.phases.length}
            </span>
          )}
          {progressPercent >= 85 && progressPercent < 100 && (
            <span className="text-[10px] font-medium text-amber-600">
              {t.power.phaseEndingSoon}
            </span>
          )}
        </div>
      </div>

      {/* Auto-advance banner when phase is complete and a cycle is active */}
      {progressPercent >= 100 && activeCycle && (
        <PhaseAdvanceBanner activeCycle={activeCycle} de={de} />
      )}
    </div>
  );
}

/** Separate component to safely call useAdvancePhase hook */
function PhaseAdvanceBanner({ activeCycle, de }: { activeCycle: TrainingPhaseCycle; de: boolean }) {
  const advancePhase = useAdvancePhase();
  const [confirming, setConfirming] = useState(false);

  const nextIndex = activeCycle.current_phase_index + 1;
  const isLastPhase = nextIndex >= activeCycle.phases.length;
  const willLoop = isLastPhase && activeCycle.auto_repeat;
  const nextPhase = willLoop
    ? activeCycle.phases[0]
    : isLastPhase
      ? null
      : activeCycle.phases[nextIndex];

  const handleAdvance = () => {
    advancePhase.mutate(activeCycle);
    setConfirming(false);
  };

  return (
    <div className="mt-2 pt-2 border-t border-amber-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-amber-700">
          {de ? 'Phase abgeschlossen!' : 'Phase complete!'}
          {nextPhase && (
            <span className="text-gray-500 font-normal ml-1">
              → {nextPhase.phase} ({nextPhase.weeks}{de ? ' Wo.' : ' wk'})
            </span>
          )}
        </span>
        {nextPhase && !confirming && (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
            className="flex items-center gap-0.5 text-[10px] font-medium text-teal-600 hover:text-teal-700"
          >
            <SkipForward className="h-3 w-3" />
            {de ? 'Weiter' : 'Advance'}
          </button>
        )}
        {confirming && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); handleAdvance(); }}
              disabled={advancePhase.isPending}
              className="px-2 py-0.5 text-[10px] font-medium bg-teal-500 text-white rounded-full hover:bg-teal-600 disabled:opacity-50"
            >
              {de ? 'Ja, weiter' : 'Yes, advance'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
              className="px-2 py-0.5 text-[10px] text-gray-500 hover:text-gray-700"
            >
              {de ? 'Abbrechen' : 'Cancel'}
            </button>
          </div>
        )}
        {isLastPhase && !activeCycle.auto_repeat && (
          <span className="text-[10px] text-gray-400">
            {de ? 'Zyklus beendet' : 'Cycle complete'}
          </span>
        )}
      </div>
    </div>
  );
}
