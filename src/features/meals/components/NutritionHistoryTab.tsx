/**
 * NutritionHistoryTab — Shows meal history with daily summaries,
 * energy balance (intake vs expenditure), trends, and export.
 * Matches training module pattern (TimeRangeSelector + Export).
 */

import { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Minus, Download, Flame } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useMealHistory } from '../hooks/useMealHistory';
import { useNutritionBalance } from '../hooks/useNutritionBalance';
import { today } from '../../../lib/utils';
import { TimeRangeSelector, getPresetRange } from '../../workouts/components/progress/TimeRangeSelector';
import type { TimeRange } from '../../workouts/components/progress/TimeRangeSelector';
import { NutritionExportDialog } from './NutritionExportDialog';

type QuickPreset = 'yesterday' | 'thisWeek' | null;

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split('T')[0];
}

export function NutritionHistoryTab() {
  const { t, language } = useTranslation();
  const isDE = language === 'de';

  const defaultRange = getPresetRange('1w');
  const [timeRange, setTimeRange] = useState<TimeRange>({ preset: '1w', ...defaultRange });
  const [quickPreset, setQuickPreset] = useState<QuickPreset>(null);
  const [showExport, setShowExport] = useState(false);

  const effectiveRange = useMemo(() => {
    if (quickPreset === 'yesterday') {
      const yd = getYesterday();
      return { from: yd, to: yd };
    }
    if (quickPreset === 'thisWeek') {
      return { from: getMonday(), to: today() };
    }
    return { from: timeRange.from, to: timeRange.to };
  }, [quickPreset, timeRange]);

  // Main data
  const { data: history, isLoading } = useMealHistory(effectiveRange);

  // Energy balance (intake + expenditure + balance per day)
  const balanceData = useNutritionBalance(history, effectiveRange.from, effectiveRange.to);

  // Previous period for trend comparison
  const prevRange = useMemo(() => {
    const fromMs = new Date(effectiveRange.from).getTime();
    const toMs = new Date(effectiveRange.to).getTime();
    const durationMs = toMs - fromMs;
    const prevTo = new Date(fromMs - 86400000);
    const prevFrom = new Date(prevTo.getTime() - durationMs);
    return {
      from: prevFrom.toISOString().split('T')[0],
      to: prevTo.toISOString().split('T')[0],
    };
  }, [effectiveRange]);

  const { data: prevHistory } = useMealHistory(prevRange);

  const prevAvg = useMemo(() => {
    if (!prevHistory || prevHistory.daysWithData === 0) return null;
    return {
      calories: prevHistory.averages.calories,
      protein: prevHistory.averages.protein,
    };
  }, [prevHistory]);

  const locale = isDE ? 'de-DE' : 'en-US';

  const formatDay = (date: string) => {
    return new Date(date).toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const handleTimeRangeChange = (range: TimeRange) => {
    setQuickPreset(null);
    setTimeRange(range);
  };

  const handleQuickPreset = (preset: QuickPreset) => {
    setQuickPreset(prev => prev === preset ? null : preset);
  };

  const TrendIcon = ({ current, previous }: { current: number; previous: number }) => {
    const diff = current - previous;
    const pct = previous > 0 ? Math.round((diff / previous) * 100) : 0;
    if (Math.abs(pct) < 3) return <Minus className="h-3 w-3 text-gray-400" />;
    if (diff > 0) return <TrendingUp className="h-3 w-3 text-red-400" />;
    return <TrendingDown className="h-3 w-3 text-emerald-500" />;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />

      {/* Quick Presets + Export */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleQuickPreset('yesterday')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
            quickPreset === 'yesterday'
              ? 'bg-teal-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isDE ? 'Gestern' : 'Yesterday'}
        </button>
        <button
          onClick={() => handleQuickPreset('thisWeek')}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
            quickPreset === 'thisWeek'
              ? 'bg-teal-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isDE ? 'Diese Woche' : 'This Week'}
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 rounded-full hover:bg-teal-100 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      {/* Averages Card */}
      {history && history.daysWithData > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-1.5 mb-3">
            <BarChart3 className="h-4 w-4 text-teal-500" />
            <p className="text-xs text-gray-500 font-medium">
              {isDE ? `Tagesdurchschnitt (${history.daysWithData} Tage)` : `Daily Average (${history.daysWithData} days)`}
            </p>
          </div>

          {/* Macro averages */}
          <div className="grid grid-cols-4 text-center gap-2">
            <div>
              <div className="flex items-center justify-center gap-1">
                <p className="text-lg font-bold text-gray-900">{history.averages.calories}</p>
                {prevAvg && <TrendIcon current={history.averages.calories} previous={prevAvg.calories} />}
              </div>
              <p className="text-[10px] text-gray-400">{t.meals.calories}</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1">
                <p className="text-lg font-bold text-teal-600">{history.averages.protein}</p>
                {prevAvg && <TrendIcon current={history.averages.protein} previous={prevAvg.protein} />}
              </div>
              <p className="text-[10px] text-gray-400">{t.meals.protein}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">{history.averages.carbs}</p>
              <p className="text-[10px] text-gray-400">{t.meals.carbs}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-amber-600">{history.averages.fat}</p>
              <p className="text-[10px] text-gray-400">{t.meals.fat}</p>
            </div>
          </div>

          {/* Energy balance averages */}
          {balanceData && balanceData.hasProfile && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 mb-2">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                <p className="text-[10px] text-gray-500 font-medium">
                  {isDE ? 'ø Energiebilanz' : 'ø Energy Balance'}
                </p>
              </div>
              <div className="grid grid-cols-3 text-center gap-2">
                <div>
                  <p className="text-sm font-semibold text-emerald-600">+{history.averages.calories}</p>
                  <p className="text-[9px] text-gray-400">{isDE ? 'ø Aufnahme' : 'ø Intake'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-orange-500">-{balanceData.averages.expenditure}</p>
                  <p className="text-[9px] text-gray-400">{isDE ? 'ø Verbrauch' : 'ø Expend.'}</p>
                </div>
                <div>
                  <p className={`text-sm font-bold ${balanceData.averages.balance < 0 ? 'text-blue-600' : balanceData.averages.balance > 300 ? 'text-red-500' : 'text-gray-900'}`}>
                    {balanceData.averages.balance > 0 ? '+' : ''}{balanceData.averages.balance}
                  </p>
                  <p className="text-[9px] text-gray-400">{isDE ? 'ø Bilanz' : 'ø Balance'}</p>
                </div>
              </div>
              <p className="text-[9px] text-gray-300 text-center mt-1.5">
                BMR {balanceData.bmr} + {isDE ? 'Aktivität' : 'Activity'} {balanceData.tdee - balanceData.bmr} = TDEE {balanceData.tdee} kcal
              </p>
            </div>
          )}

          {/* Totals row */}
          <div className="mt-3 pt-2 border-t border-gray-100 grid grid-cols-4 text-center gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-700">{history.totals.calories.toLocaleString(locale)}</p>
              <p className="text-[9px] text-gray-300">{isDE ? 'Gesamt kcal' : 'Total kcal'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-teal-500">{Math.round(history.totals.protein)}g</p>
              <p className="text-[9px] text-gray-300">{isDE ? 'Gesamt P' : 'Total P'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-500">{Math.round(history.totals.carbs)}g</p>
              <p className="text-[9px] text-gray-300">{isDE ? 'Gesamt K' : 'Total C'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-500">{Math.round(history.totals.fat)}g</p>
              <p className="text-[9px] text-gray-300">{isDE ? 'Gesamt F' : 'Total F'}</p>
            </div>
          </div>

          {history.averages.mealsPerDay > 0 && (
            <p className="text-[10px] text-gray-300 text-center mt-2">
              ø {history.averages.mealsPerDay} {isDE ? 'Mahlzeiten/Tag' : 'meals/day'}
            </p>
          )}
        </div>
      )}

      {/* Daily Breakdown List */}
      {balanceData && balanceData.days.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {isDE ? 'Tagesübersicht' : 'Daily Overview'}
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {balanceData.days.map((day) => (
              <div key={day.date} className="px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700">{formatDay(day.date)}</p>
                    <p className="text-[10px] text-gray-300">{day.mealCount} {isDE ? 'Mahlzeiten' : 'meals'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{day.calories} kcal</p>
                    <div className="flex gap-2 text-[10px] text-gray-400">
                      <span className="text-teal-500">P: {Math.round(day.protein)}g</span>
                      <span className="text-blue-500">K: {Math.round(day.carbs)}g</span>
                      <span className="text-amber-500">F: {Math.round(day.fat)}g</span>
                    </div>
                  </div>
                </div>
                {/* Energy balance per day */}
                {balanceData.hasProfile && (
                  <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                    <span className="text-orange-400">
                      {isDE ? 'Verbr.' : 'Exp.'}: {day.totalExpenditure}
                      {day.workoutCalories > 0 && ` (🏋️ ${day.workoutCalories})`}
                    </span>
                    <span className={`font-semibold ${day.balance < 0 ? 'text-blue-500' : day.balance > 300 ? 'text-red-400' : 'text-gray-500'}`}>
                      {isDE ? 'Bilanz' : 'Bal.'}: {day.balance > 0 ? '+' : ''}{day.balance} kcal
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : history && history.days.length > 0 ? (
        /* Fallback: show without balance if balanceData not ready */
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {isDE ? 'Tagesübersicht' : 'Daily Overview'}
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {history.days.map((day) => (
              <div key={day.date} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">{formatDay(day.date)}</p>
                  <p className="text-[10px] text-gray-300">{day.mealCount} {isDE ? 'Mahlzeiten' : 'meals'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{day.calories} kcal</p>
                  <div className="flex gap-2 text-[10px] text-gray-400">
                    <span className="text-teal-500">P: {Math.round(day.protein)}g</span>
                    <span className="text-blue-500">K: {Math.round(day.carbs)}g</span>
                    <span className="text-amber-500">F: {Math.round(day.fat)}g</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">
            {isDE ? 'Noch keine Daten für diesen Zeitraum' : 'No data for this period yet'}
          </p>
        </div>
      )}

      {/* Export Dialog */}
      {showExport && (
        <NutritionExportDialog
          timeRange={effectiveRange}
          history={history ?? null}
          balanceData={balanceData}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
