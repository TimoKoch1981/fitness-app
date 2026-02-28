/**
 * Competition Countdown Widget
 * Shows countdown to the user's competition date (show_date in profile).
 * Visible in Power and Power+ modes when showCompetitionFeatures is true.
 */

import { Trophy, Calendar, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import { useProfile } from '../../../auth/hooks/useProfile';

export function CompetitionCountdown() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();

  const showDate = profile?.show_date;
  if (!showDate) return null;

  const now = new Date();
  const target = new Date(showDate);
  const diffMs = target.getTime() - now.getTime();
  const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (totalDays < -7) return null; // Don't show if competition was >1 week ago

  const isPast = totalDays < 0;
  const weeks = Math.floor(Math.abs(totalDays) / 7);
  const remainingDays = Math.abs(totalDays) % 7;

  // Phase suggestions based on weeks out
  const getPhaseHint = (days: number): string => {
    if (days <= 7) return t.power.phaseHintPeakWeek;
    if (days <= 21) return t.power.phaseHintDepletion;
    if (days <= 56) return t.power.phaseHintFinalCut;
    if (days <= 112) return t.power.phaseHintPrep;
    return t.power.phaseHintOffSeason;
  };

  // Color based on urgency
  const getColor = (days: number) => {
    if (isPast) return 'bg-gray-50 border-gray-200';
    if (days <= 7) return 'bg-red-50 border-red-200';
    if (days <= 28) return 'bg-amber-50 border-amber-200';
    return 'bg-teal-50 border-teal-200';
  };

  const getAccent = (days: number) => {
    if (isPast) return 'text-gray-500';
    if (days <= 7) return 'text-red-600';
    if (days <= 28) return 'text-amber-600';
    return 'text-teal-600';
  };

  const federation = profile?.show_federation;
  const formattedDate = target.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className={`rounded-xl border p-4 ${getColor(totalDays)}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-white/70 ${getAccent(totalDays)}`}>
          <Trophy className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {isPast ? t.power.showCompleted : t.power.showCountdown}
            </h3>
            {federation && (
              <span className="text-[10px] px-1.5 py-0.5 bg-white/60 rounded text-gray-500">
                {federation}
              </span>
            )}
          </div>

          {isPast ? (
            <p className="text-xs text-gray-500 mt-1">
              {t.power.showWasOn} {formattedDate}
            </p>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className={`text-2xl font-bold ${getAccent(totalDays)}`}>
                  {totalDays}
                </span>
                <span className="text-xs text-gray-500">
                  {t.power.daysLeft}
                  {weeks > 0 && ` (${weeks}${t.power.weeksShort} ${remainingDays}${t.power.daysShort})`}
                </span>
              </div>

              <div className="flex items-center gap-1 mt-2">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-[10px] text-gray-400">{formattedDate}</span>
                <ChevronRight className="h-3 w-3 text-gray-300 mx-1" />
                <span className="text-[10px] text-gray-500 font-medium">
                  {getPhaseHint(totalDays)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
