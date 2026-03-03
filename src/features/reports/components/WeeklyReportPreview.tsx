/**
 * WeeklyReportPreview — In-app preview of the weekly summary report.
 *
 * Shows nutrition, training, body, sleep, and streak summaries
 * with a clean, card-based layout in the teal FitBuddy theme.
 *
 * Actions:
 * - "Email senden" button — calls the edge function for the current user
 * - Date range selector (default: last 7 days)
 */

import { useState, useCallback } from 'react';
import {
  X,
  Calendar,
  Utensils,
  Dumbbell,
  Scale,
  Moon,
  Flame,
  Send,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { useWeeklyReport } from '../hooks/useWeeklyReport';
import { useTranslation } from '../../../i18n';

interface WeeklyReportPreviewProps {
  open: boolean;
  onClose: () => void;
}

type DateRangeOption = 7 | 14 | 30;

export function WeeklyReportPreview({ open, onClose }: WeeklyReportPreviewProps) {
  const { t } = useTranslation();
  const [days, setDays] = useState<DateRangeOption>(7);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<'success' | 'error' | null>(null);

  const { report, isLoading, sendReportEmail } = useWeeklyReport({ days });

  const handleSendEmail = useCallback(async () => {
    setSending(true);
    setSendResult(null);
    try {
      await sendReportEmail();
      setSendResult('success');
      setTimeout(() => setSendResult(null), 3000);
    } catch {
      setSendResult('error');
    } finally {
      setSending(false);
    }
  }, [sendReportEmail]);

  if (!open) return null;

  const formatDateRange = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' };
    return `${s.toLocaleDateString('de-DE', opts)} - ${e.toLocaleDateString('de-DE', opts)}`;
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-gray-50 w-full max-w-lg max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-4 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-white font-semibold text-lg">{t.report.weeklyReport}</h2>
            {report && (
              <p className="text-teal-100 text-xs mt-0.5">
                {formatDateRange(report.startDate, report.endDate)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Date Range Selector */}
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center gap-2 shrink-0">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">{t.report.dateRange}:</span>
          <div className="relative ml-auto">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value) as DateRangeOption)}
              className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 pr-7 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value={7}>7 {t.report.days}</option>
              <option value={14}>14 {t.report.days}</option>
              <option value={30}>30 {t.report.days}</option>
            </select>
            <ChevronDown className="h-3 w-3 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-teal-500 animate-spin" />
            </div>
          ) : !report ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {t.report.noData}
            </div>
          ) : (
            <>
              {/* Nutrition Summary */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-teal-50 rounded-lg">
                    <Utensils className="h-4 w-4 text-teal-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{t.report.nutritionSummary}</h3>
                </div>
                {report.nutrition.totalMeals === 0 ? (
                  <p className="text-xs text-gray-400">{t.reports.noMealData}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <StatItem label={t.report.totalMeals} value={String(report.nutrition.totalMeals)} />
                    <StatItem label={t.report.avgCalories} value={`${report.nutrition.avgCaloriesPerDay} kcal`} />
                    <StatItem label={t.report.avgProtein} value={`${report.nutrition.avgProteinPerDay}g`} />
                    <StatItem label={t.report.avgCarbs} value={`${report.nutrition.avgCarbsPerDay}g`} />
                    <StatItem label={t.report.avgFat} value={`${report.nutrition.avgFatPerDay}g`} />
                    <StatItem label={t.report.daysTracked} value={`${report.nutrition.daysTracked}/${days}`} />
                  </div>
                )}
              </div>

              {/* Training Summary */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <Dumbbell className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{t.report.trainingSummary}</h3>
                </div>
                {report.training.totalWorkouts === 0 ? (
                  <p className="text-xs text-gray-400">{t.reports.noWorkoutData}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <StatItem label={t.report.totalWorkouts} value={String(report.training.totalWorkouts)} />
                    <StatItem label={t.report.totalDuration} value={formatDuration(report.training.totalDurationMinutes)} />
                    <StatItem label={t.report.caloriesBurned} value={`${report.training.totalCaloriesBurned} kcal`} />
                    <StatItem label={t.report.avgDuration} value={`${report.training.avgDurationMinutes} min`} />
                  </div>
                )}
              </div>

              {/* Body Summary */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-purple-50 rounded-lg">
                    <Scale className="h-4 w-4 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{t.report.bodySummary}</h3>
                </div>
                {!report.body.hasData ? (
                  <p className="text-xs text-gray-400">{t.reports.noBodyData}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {report.body.weightChange != null && (
                      <StatItem
                        label={t.report.weightChange}
                        value={`${report.body.weightChange > 0 ? '+' : ''}${report.body.weightChange} kg`}
                        color={report.body.weightChange < 0 ? 'text-emerald-600' : report.body.weightChange > 0 ? 'text-amber-600' : undefined}
                      />
                    )}
                    {report.body.endWeight != null && (
                      <StatItem label={t.report.currentWeight} value={`${report.body.endWeight} kg`} />
                    )}
                    {report.body.bodyFatChange != null && (
                      <StatItem
                        label={t.report.bodyFatChange}
                        value={`${report.body.bodyFatChange > 0 ? '+' : ''}${report.body.bodyFatChange}%`}
                        color={report.body.bodyFatChange < 0 ? 'text-emerald-600' : report.body.bodyFatChange > 0 ? 'text-amber-600' : undefined}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Sleep Summary */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-amber-50 rounded-lg">
                    <Moon className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{t.report.sleepSummary}</h3>
                </div>
                {report.sleep.totalLogs === 0 ? (
                  <p className="text-xs text-gray-400">{t.report.noSleepData}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <StatItem label={t.report.avgSleep} value={formatDuration(report.sleep.avgDurationMinutes)} />
                    <StatItem label={t.report.avgQuality} value={`${report.sleep.avgQuality}/5`} />
                    <StatItem label={t.report.daysTracked} value={`${report.sleep.daysTracked}/${days}`} />
                  </div>
                )}
              </div>

              {/* Streak */}
              {report.streak.currentStreak > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 shadow-sm text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <span className="text-2xl font-bold text-orange-600">{report.streak.currentStreak}</span>
                  </div>
                  <p className="text-xs text-orange-700 font-medium">{t.report.streakCurrent}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-3 shrink-0">
          {sendResult === 'success' && (
            <span className="text-xs text-emerald-600 font-medium">{t.report.emailSent}</span>
          )}
          {sendResult === 'error' && (
            <span className="text-xs text-red-500 font-medium">{t.common.error}</span>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {t.common.close}
          </button>
          <button
            onClick={handleSendEmail}
            disabled={sending || isLoading || !report}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t.report.sendEmail}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Stat Item Subcomponent ──────────────────────────────────────────

function StatItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-semibold ${color ?? 'text-gray-900'}`}>{value}</p>
    </div>
  );
}
