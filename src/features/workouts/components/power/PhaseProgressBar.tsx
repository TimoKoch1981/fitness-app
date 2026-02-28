/**
 * Phase Progress Bar Widget
 * Shows progress in the current training phase (bulk, cut, maintenance, etc.)
 * with visual progress bar and phase-specific info.
 * Visible in Power and Power+ modes when showPhaseProgress is true.
 */

import { TrendingUp, TrendingDown, Minus, Zap, RotateCcw, Sun } from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import { useProfile } from '../../../auth/hooks/useProfile';
import type { TrainingPhase } from '../../../../types/health';

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

export function PhaseProgressBar() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();

  const phase: TrainingPhase = profile?.current_phase ?? 'maintenance';
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;

  // Calculate phase progress based on cycle_start_date and cycle_planned_weeks
  const cycleStartDate = profile?.cycle_start_date;
  const plannedWeeks = profile?.cycle_planned_weeks ?? config.defaultWeeks;

  let elapsedWeeks = 0;
  let progressPercent = 0;

  if (cycleStartDate) {
    const start = new Date(cycleStartDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    elapsedWeeks = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)));
    progressPercent = Math.min(100, Math.round((elapsedWeeks / plannedWeeks) * 100));
  }

  const phaseLabel = t.power.phases[phase] ?? phase;

  return (
    <div className={`rounded-xl border p-4 ${config.bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.color}`} />
          <span className="text-sm font-semibold text-gray-900">
            {phaseLabel}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {cycleStartDate
            ? `${elapsedWeeks} / ${plannedWeeks} ${t.power.weeksShort}`
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
        {progressPercent >= 85 && (
          <span className="text-[10px] font-medium text-amber-600">
            {t.power.phaseEndingSoon}
          </span>
        )}
      </div>
    </div>
  );
}
