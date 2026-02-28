/**
 * Refeed / Diet Break Planner Widget
 * Helps users schedule refeed days and diet breaks during cutting phases.
 * Based on MATADOR study (Byrne et al. 2018) and Trexler et al. 2014.
 * Visible in Power and Power+ modes when showRefeedPlanner is true.
 */

import { useState } from 'react';
import { UtensilsCrossed, Calendar, Info } from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import { useProfile } from '../../../auth/hooks/useProfile';

export function RefeedPlanner() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const [expanded, setExpanded] = useState(false);

  const phase = profile?.current_phase;
  const cycleStartDate = profile?.cycle_start_date;

  // Only show during cutting phases
  if (phase !== 'cut' && phase !== 'peak_week') return null;

  // Calculate weeks into cut
  let weeksIntoCut = 0;
  if (cycleStartDate) {
    const start = new Date(cycleStartDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    weeksIntoCut = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)));
  }

  // Refeed recommendation
  const getRefeedRecommendation = (weeks: number) => {
    if (weeks < 4) return { frequency: t.power.refeedNotYet, type: 'none' as const };
    if (weeks < 8) return { frequency: t.power.refeed1xWeek, type: 'refeed' as const };
    if (weeks < 12) return { frequency: t.power.refeed2xWeek, type: 'refeed' as const };
    return { frequency: t.power.refeedDietBreak, type: 'break' as const };
  };

  const recommendation = getRefeedRecommendation(weeksIntoCut);

  // Next refeed day suggestion (e.g., Saturday for training day)
  const getNextRefeedDay = (): string => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    // Suggest Saturday (6) as typical refeed day
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + daysUntilSaturday);
    return nextSaturday.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <div className="rounded-xl border bg-orange-50 border-orange-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-orange-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            {t.power.refeedPlanner}
          </h3>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-orange-500 hover:text-orange-700"
        >
          {expanded ? t.common.close : t.power.details}
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="h-3 w-3 text-gray-400" />
        <span className="text-xs text-gray-600">
          {t.power.weeksIntoCut}: <strong>{weeksIntoCut}</strong>
        </span>
      </div>

      {/* Recommendation */}
      <div className={`rounded-lg p-2.5 ${
        recommendation.type === 'break'
          ? 'bg-red-100/60'
          : recommendation.type === 'refeed'
          ? 'bg-orange-100/60'
          : 'bg-gray-100/60'
      }`}>
        <p className="text-xs font-medium text-gray-800">{recommendation.frequency}</p>
        {recommendation.type !== 'none' && (
          <p className="text-[10px] text-gray-500 mt-0.5">
            {t.power.nextRefeed}: {getNextRefeedDay()}
          </p>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-1.5">
            <Info className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-[10px] text-gray-500 space-y-1">
              <p><strong>{t.power.refeedDay}:</strong> {t.power.refeedDayDesc}</p>
              <p><strong>{t.power.dietBreak}:</strong> {t.power.dietBreakDesc}</p>
              <p className="text-[9px] text-gray-300 mt-1">
                {t.power.refeedSource}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
