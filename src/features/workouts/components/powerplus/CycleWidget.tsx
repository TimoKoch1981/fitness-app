/**
 * Cycle Tracker Widget
 * Shows current cycle week, status (blast/cruise/pct/off), and remaining time.
 * Visible in Power+ mode when showCycleTracker is true.
 */

import { Activity, Clock } from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import { useProfile } from '../../../auth/hooks/useProfile';
import type { CycleStatus } from '../../../../types/health';

const CYCLE_CONFIG: Record<CycleStatus, {
  color: string;
  bgColor: string;
  barColor: string;
}> = {
  natural: { color: 'text-green-600', bgColor: 'bg-green-50 border-green-200', barColor: 'bg-green-500' },
  blast: { color: 'text-red-500', bgColor: 'bg-red-50 border-red-200', barColor: 'bg-red-500' },
  cruise: { color: 'text-blue-500', bgColor: 'bg-blue-50 border-blue-200', barColor: 'bg-blue-500' },
  pct: { color: 'text-purple-500', bgColor: 'bg-purple-50 border-purple-200', barColor: 'bg-purple-500' },
  off: { color: 'text-gray-500', bgColor: 'bg-gray-50 border-gray-200', barColor: 'bg-gray-400' },
};

export function CycleWidget() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();

  const cycleStatus: CycleStatus = profile?.cycle_status ?? 'natural';
  const cycleStartDate = profile?.cycle_start_date;
  const plannedWeeks = profile?.cycle_planned_weeks ?? 12;

  if (cycleStatus === 'natural' || cycleStatus === 'off') return null;

  const config = CYCLE_CONFIG[cycleStatus];

  let elapsedWeeks = 0;
  let progressPercent = 0;
  let remainingWeeks = plannedWeeks;

  if (cycleStartDate) {
    const start = new Date(cycleStartDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    elapsedWeeks = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)));
    remainingWeeks = Math.max(0, plannedWeeks - elapsedWeeks);
    progressPercent = Math.min(100, Math.round((elapsedWeeks / plannedWeeks) * 100));
  }

  const statusLabel = t.trainingMode[cycleStatus] ?? cycleStatus;

  return (
    <div className={`rounded-xl border p-4 ${config.bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Activity className={`h-4 w-4 ${config.color}`} />
          <h3 className="text-sm font-semibold text-gray-900">
            {t.powerPlus.cycleTracker}
          </h3>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${config.color} bg-white/60`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1">
          <div className="bg-white/60 rounded-full h-2 overflow-hidden">
            <div
              className={`${config.barColor} rounded-full h-2 transition-all duration-500`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {t.trainingMode.cycleWeek} {elapsedWeeks} {t.trainingMode.cycleOf} {plannedWeeks}
        </span>
      </div>

      {/* Bottom info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-gray-400" />
          <span className="text-[10px] text-gray-500">
            {remainingWeeks} {t.power.weeksShort} {t.powerPlus.remaining}
          </span>
        </div>
        {progressPercent >= 80 && (
          <span className="text-[10px] font-medium text-amber-600">
            {t.powerPlus.cycleEndingSoon}
          </span>
        )}
      </div>
    </div>
  );
}
