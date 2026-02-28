/**
 * PCT Countdown Widget
 * Shows countdown for Post Cycle Therapy when cycle_status is 'pct'.
 * Displays weeks remaining, blood work reminder, and recovery milestones.
 * Visible in Power+ mode when showPCTCountdown is true.
 */

import { Shield, AlertTriangle, Droplets } from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import { useProfile } from '../../../auth/hooks/useProfile';

export function PCTCountdown() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();

  const cycleStatus = profile?.cycle_status;
  const cycleStartDate = profile?.cycle_start_date;
  const plannedWeeks = profile?.cycle_planned_weeks ?? 6;

  // Only show during PCT
  if (cycleStatus !== 'pct') return null;

  let elapsedWeeks = 0;
  let remainingWeeks = plannedWeeks;
  let progressPercent = 0;

  if (cycleStartDate) {
    const start = new Date(cycleStartDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    elapsedWeeks = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)));
    remainingWeeks = Math.max(0, plannedWeeks - elapsedWeeks);
    progressPercent = Math.min(100, Math.round((elapsedWeeks / plannedWeeks) * 100));
  }

  // Blood work timing: at week 4 and at end of PCT
  const needsBloodWork = elapsedWeeks === 4 || elapsedWeeks >= plannedWeeks - 1;

  return (
    <div className="rounded-xl border bg-purple-50 border-purple-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="h-4 w-4 text-purple-600" />
        <h3 className="text-sm font-semibold text-gray-900">
          {t.powerPlus.pctCountdown}
        </h3>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600 font-medium">
          PCT
        </span>
      </div>

      {/* Progress */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>{t.powerPlus.pctRecovery}</span>
          <span>{t.trainingMode.cycleWeek} {elapsedWeeks}/{plannedWeeks}</span>
        </div>
        <div className="bg-white/60 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-purple-500 rounded-full h-2.5 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Remaining */}
      <div className="flex items-center gap-1 mb-2">
        <span className="text-xs text-gray-600">
          {remainingWeeks} {t.power.weeksShort} {t.powerPlus.remaining}
        </span>
      </div>

      {/* Blood work reminder */}
      {needsBloodWork && (
        <div className="flex items-start gap-2 p-2 bg-amber-100/60 rounded-lg">
          <Droplets className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-amber-700 font-medium">
            {t.powerPlus.pctBloodWorkReminder}
          </p>
        </div>
      )}

      {/* Warning */}
      <div className="flex items-start gap-1.5 mt-2">
        <AlertTriangle className="h-3 w-3 text-gray-300 mt-0.5 flex-shrink-0" />
        <p className="text-[9px] text-gray-300">
          {t.powerPlus.pctDisclaimer}
        </p>
      </div>
    </div>
  );
}
