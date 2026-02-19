/**
 * ReportsPage — Weekly/Monthly reports with Recharts charts.
 *
 * Tabs: Week (7 days), Month (30 days), Trends (body + BP long-term)
 */

import { useState } from 'react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';
import { useProfile } from '../features/auth/hooks/useProfile';
import { cn } from '../lib/utils';

// Report data hooks
import {
  useMealsForRange,
  useWorkoutsForRange,
  useBalanceForRange,
  useBodyTrend,
  useBloodPressureTrend,
  getLastNDays,
} from '../features/reports/hooks/useReportData';

// Chart components
import { CalorieChart } from '../features/reports/components/CalorieChart';
import { MacroChart } from '../features/reports/components/MacroChart';
import { BalanceChart } from '../features/reports/components/BalanceChart';
import { BalanceSummaryCard } from '../features/reports/components/BalanceSummaryCard';
import { WeightChart } from '../features/reports/components/WeightChart';
import { BloodPressureChart } from '../features/reports/components/BloodPressureChart';
import { WorkoutChart } from '../features/reports/components/WorkoutChart';

type ReportTab = 'week' | 'month' | 'trends';

export function ReportsPage() {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<ReportTab>('week');
  const { data: profile } = useProfile();

  // Date ranges
  const week = getLastNDays(7);
  const month = getLastNDays(30);

  // Fetch data based on active tab
  const weekMeals = useMealsForRange(week.start, week.end);
  const weekWorkouts = useWorkoutsForRange(week.start, week.end);
  const monthMeals = useMealsForRange(month.start, month.end);
  const monthWorkouts = useWorkoutsForRange(month.start, month.end);
  const weekBalance = useBalanceForRange(week.start, week.end);
  const monthBalance = useBalanceForRange(month.start, month.end);
  const bodyTrend = useBodyTrend(30);
  const bpTrend = useBloodPressureTrend(30);

  const tabs: { key: ReportTab; label: string }[] = [
    { key: 'week', label: t.reports.week },
    { key: 'month', label: t.reports.month },
    { key: 'trends', label: t.reports.trends },
  ];

  const calorieGoal = profile?.daily_calories_goal;

  // Summary stats for the selected period
  const currentMeals = activeTab === 'week' ? weekMeals.data : monthMeals.data;
  const currentWorkouts = activeTab === 'week' ? weekWorkouts.data : monthWorkouts.data;

  const avgCalories = currentMeals?.length
    ? Math.round(currentMeals.reduce((s, d) => s + d.calories, 0) / currentMeals.filter((d) => d.calories > 0).length || 0)
    : 0;
  const avgProtein = currentMeals?.length
    ? Math.round(currentMeals.reduce((s, d) => s + d.protein, 0) / currentMeals.filter((d) => d.protein > 0).length || 0)
    : 0;
  const totalWorkouts = currentWorkouts?.reduce((s, d) => s + d.workoutCount, 0) ?? 0;

  const isLoading =
    weekMeals.isLoading || weekWorkouts.isLoading ||
    weekBalance.isLoading || monthBalance.isLoading ||
    monthMeals.isLoading || monthWorkouts.isLoading ||
    bodyTrend.isLoading || bpTrend.isLoading;

  return (
    <PageShell title={t.reports.title}>
      {/* Tab Selector */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 py-2 text-xs font-medium rounded-md transition-all',
              activeTab === tab.key
                ? 'bg-white text-teal-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8 text-gray-400 text-sm">
          {t.common.loading}
        </div>
      )}

      {/* Week View */}
      {activeTab === 'week' && !isLoading && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryCard
              label={t.reports.avgCalories}
              value={avgCalories > 0 ? `${avgCalories}` : '—'}
              unit="kcal"
            />
            <SummaryCard
              label={t.reports.avgProtein}
              value={avgProtein > 0 ? `${avgProtein}g` : '—'}
              unit=""
            />
            <SummaryCard
              label={t.reports.workouts}
              value={`${totalWorkouts}`}
              unit={language === 'de' ? 'Einh.' : 'sess.'}
            />
          </div>

          {/* Charts */}
          {weekMeals.data && weekMeals.data.some((d) => d.calories > 0) ? (
            <>
              <CalorieChart data={weekMeals.data} calorieGoal={calorieGoal} language={language} />
              <MacroChart data={weekMeals.data} language={language} />
            </>
          ) : (
            <EmptyState message={t.reports.noMealData} />
          )}

          {weekWorkouts.data && weekWorkouts.data.some((d) => d.workoutCount > 0) ? (
            <WorkoutChart data={weekWorkouts.data} language={language} />
          ) : (
            <EmptyState message={t.reports.noWorkoutData} />
          )}

          {/* Calorie Balance */}
          {weekBalance.data && weekBalance.data.some((d) => d.intake > 0) && (
            <>
              <BalanceChart data={weekBalance.data} language={language} />
              <BalanceSummaryCard data={weekBalance.data} language={language} />
            </>
          )}
        </div>
      )}

      {/* Month View */}
      {activeTab === 'month' && !isLoading && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryCard
              label={t.reports.avgCalories}
              value={avgCalories > 0 ? `${avgCalories}` : '—'}
              unit="kcal"
            />
            <SummaryCard
              label={t.reports.avgProtein}
              value={avgProtein > 0 ? `${avgProtein}g` : '—'}
              unit=""
            />
            <SummaryCard
              label={t.reports.workouts}
              value={`${totalWorkouts}`}
              unit={language === 'de' ? 'Einh.' : 'sess.'}
            />
          </div>

          {monthMeals.data && monthMeals.data.some((d) => d.calories > 0) ? (
            <>
              <CalorieChart data={monthMeals.data} calorieGoal={calorieGoal} language={language} />
              <MacroChart data={monthMeals.data} language={language} />
            </>
          ) : (
            <EmptyState message={t.reports.noMealData} />
          )}

          {monthWorkouts.data && monthWorkouts.data.some((d) => d.workoutCount > 0) ? (
            <WorkoutChart data={monthWorkouts.data} language={language} />
          ) : (
            <EmptyState message={t.reports.noWorkoutData} />
          )}

          {/* Calorie Balance */}
          {monthBalance.data && monthBalance.data.some((d) => d.intake > 0) && (
            <>
              <BalanceChart data={monthBalance.data} language={language} />
              <BalanceSummaryCard data={monthBalance.data} language={language} />
            </>
          )}
        </div>
      )}

      {/* Trends View */}
      {activeTab === 'trends' && !isLoading && (
        <div className="space-y-4">
          {bodyTrend.data && bodyTrend.data.length > 0 ? (
            <WeightChart data={bodyTrend.data} language={language} />
          ) : (
            <EmptyState message={t.reports.noBodyData} />
          )}

          {bpTrend.data && bpTrend.data.length > 0 ? (
            <BloodPressureChart data={bpTrend.data} language={language} />
          ) : (
            <EmptyState message={t.reports.noBpData} />
          )}
        </div>
      )}
    </PageShell>
  );
}

// ── Helper Components ────────────────────────────────────────────────

function SummaryCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm text-center">
      <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
      {unit && <div className="text-[10px] text-gray-400">{unit}</div>}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-400 text-sm">
      {message}
    </div>
  );
}
