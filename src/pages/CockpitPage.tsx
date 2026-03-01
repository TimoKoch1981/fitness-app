/**
 * CockpitPage — Central dashboard with daily overview, weekly charts, and insights.
 *
 * Replaces the old DashboardPage. Adds weekly CalorieChart and WeightChart
 * from Reports, removes Quick Info Cards (no longer needed with 5-item nav).
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Droplets,
  Plus,
  Minus,
  Flame,
  Zap,
  Bell,
  Check,
  Share2,
  Target,
  ChevronRight,
} from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { BuddyQuickAccess } from '../shared/components/BuddyQuickAccess';
import { useTranslation } from '../i18n';
import { usePageBuddySuggestions } from '../features/buddy/hooks/usePageBuddySuggestions';
import { useDailyMealTotals } from '../features/meals/hooks/useMeals';
import { useWorkoutsByDate } from '../features/workouts/hooks/useWorkouts';
import { useLatestBodyMeasurement, useBodyMeasurements } from '../features/body/hooks/useBodyMeasurements';
import { useBloodPressureLogs } from '../features/medical/hooks/useBloodPressure';
import { useProfile } from '../features/auth/hooks/useProfile';
import { useReminders, useTodayReminderLogs, getTodayReminderStatus, useCompleteReminder } from '../features/reminders/hooks/useReminders';
import { useSubstances } from '../features/medical/hooks/useSubstances';
import { calculateBMR, calculateAge } from '../lib/calculations/bmr';
import { calculateTDEE_PAL } from '../lib/calculations/tdee';
import { classifyBMI, calculateFFMI, classifyFFMI } from '../lib/calculations/bodyMetrics';
import { generateInsights } from '../lib/insights';
import { InsightCard } from '../shared/components/InsightCard';
import { DailyCheckinCard } from '../features/checkin/components/DailyCheckinCard';
import { GapAlertBanner } from '../shared/components/GapAlertBanner';
import { REDSWarningBanner } from '../shared/components/REDSWarningBanner';
import { ProactiveWarningCard } from '../shared/components/ProactiveWarningCard';
import { today } from '../lib/utils';
import { useAuth } from '../app/providers/AuthProvider';
import {
  DEFAULT_CALORIES_GOAL,
  DEFAULT_PROTEIN_GOAL,
  DEFAULT_CARBS_GOAL,
  DEFAULT_FAT_GOAL,
  DEFAULT_WATER_GOAL,
} from '../lib/constants';

// Report data hooks & chart components
import { useMealsForRange, useWorkoutsForRange, useBodyTrend, getLastNDays } from '../features/reports/hooks/useReportData';
import { CalorieChart } from '../features/reports/components/CalorieChart';
import { WeightChart } from '../features/reports/components/WeightChart';
import { ShareCardDialog } from '../features/share/components/ShareCardDialog';
import { ProgressionCard } from '../features/reports/components/ProgressionCard';
import type { ShareCardData } from '../features/share/components/ShareProgressCard';
import { useCelebrations } from '../features/celebrations/CelebrationProvider';

const WATER_STORAGE_KEY = 'fitbuddy_water_';

/** Auto-updates date at midnight so the cockpit stays current. */
function useToday(): string {
  const [date, setDate] = useState(() => today());

  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

    const timer = setTimeout(() => {
      setDate(today());
    }, msUntilMidnight + 100);

    return () => clearTimeout(timer);
  }, [date]);

  return date;
}

export function CockpitPage() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const selectedDate = useToday();
  const cockpitSuggestions = usePageBuddySuggestions('cockpit', language as 'de' | 'en');
  const { celebrateCalorieGoal, celebrateProteinGoal } = useCelebrations();

  const { data: profile } = useProfile();
  const { totals } = useDailyMealTotals(selectedDate);
  const { data: workouts } = useWorkoutsByDate(selectedDate);
  const { data: latestBody } = useLatestBodyMeasurement();
  const { data: bodyMeasurements } = useBodyMeasurements(10);
  const { data: bpLogs } = useBloodPressureLogs(5);
  const { data: substances } = useSubstances(true);

  // Reminders
  const { data: remindersList } = useReminders(true);
  const { data: todayLogs } = useTodayReminderLogs();
  const completeReminder = useCompleteReminder();
  const reminderStatus = remindersList && todayLogs
    ? getTodayReminderStatus(remindersList, todayLogs)
    : { pending: [], completed: [], totalDue: 0 };

  // Weekly data for charts + share card
  const week = getLastNDays(7);
  const weekMeals = useMealsForRange(week.start, week.end);
  const weekWorkouts = useWorkoutsForRange(week.start, week.end);
  const bodyTrendData = useBodyTrend(10);
  const [showShareCard, setShowShareCard] = useState(false);

  // Water tracker (localStorage-based, scoped per user)
  const waterKey = WATER_STORAGE_KEY + (user?.id ?? 'anon') + '_' + selectedDate;
  const [waterGlasses, setWaterGlasses] = useState(() => {
    const stored = localStorage.getItem(waterKey);
    return stored ? parseInt(stored) : 0;
  });

  useEffect(() => {
    localStorage.setItem(waterKey, waterGlasses.toString());
  }, [waterGlasses, waterKey]);

  // Profile data sufficient for personalized goals?
  const profileComplete = !!(profile?.height_cm && profile?.birth_date && latestBody?.weight_kg);

  // Profile-based goals with defaults (only meaningful when profileComplete)
  const caloriesGoal = profile?.daily_calories_goal ?? DEFAULT_CALORIES_GOAL;
  const proteinGoal = profile?.daily_protein_goal ?? DEFAULT_PROTEIN_GOAL;
  const waterGoal = profile?.daily_water_goal ?? DEFAULT_WATER_GOAL;

  // Workout calories
  const totalCaloriesBurned = workouts?.reduce((sum, w) => sum + (w.calories_burned ?? 0), 0) ?? 0;

  // BMR/TDEE calculation
  let bmrResult: { bmr: number; formula: string } | null = null;
  let tdee: number | null = null;

  if (profileComplete) {
    const age = calculateAge(profile.birth_date);
    bmrResult = calculateBMR(
      {
        weight_kg: latestBody.weight_kg,
        height_cm: profile.height_cm,
        age,
        gender: profile.gender ?? 'male',
        body_fat_pct: latestBody.body_fat_pct ?? undefined,
      },
      profile.preferred_bmr_formula ?? 'auto'
    );
    tdee = calculateTDEE_PAL(bmrResult.bmr, profile.activity_level ?? 1.55);
  }

  // Net calories
  const netCalories = totals.calories - totalCaloriesBurned;

  // Insights
  const insights = generateInsights({
    caloriesConsumed: totals.calories,
    caloriesGoal,
    caloriesBurned: totalCaloriesBurned,
    proteinConsumed: Math.round(totals.protein),
    proteinGoal,
    waterGlasses,
    waterGoal,
    bodyMeasurements: bodyMeasurements ?? [],
    bpLogs: bpLogs ?? [],
    weightKg: latestBody?.weight_kg ?? undefined,
    hasProfile: !!(profile?.height_cm && profile?.birth_date),
    hasSubstances: (substances?.length ?? 0) > 0,
    workoutCountToday: workouts?.length ?? 0,
  });

  const visibleInsights = insights.slice(0, 4);

  // Celebrate when calorie or protein goal is reached (only with real goals)
  useEffect(() => {
    if (profileComplete && totals.calories > 0 && totals.calories >= caloriesGoal) {
      celebrateCalorieGoal(1); // Single day achievement
    }
    if (profileComplete && totals.protein > 0 && totals.protein >= proteinGoal) {
      celebrateProteinGoal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileComplete, totals.calories >= caloriesGoal, totals.protein >= proteinGoal]);

  const isBreastfeeding = profile?.is_breastfeeding === true;

  const stats = [
    {
      label: t.dashboard.calories,
      value: totals.calories,
      goal: caloriesGoal,
      unit: 'kcal',
      color: 'from-teal-400 to-teal-500',
      badge: isBreastfeeding ? (language === 'de' ? '🤱 inkl. Stillzeit' : '🤱 incl. lactation') : undefined,
    },
    {
      label: t.dashboard.protein,
      value: Math.round(totals.protein),
      goal: proteinGoal,
      unit: 'g',
      color: 'from-emerald-400 to-emerald-500',
    },
    {
      label: t.dashboard.carbs,
      value: Math.round(totals.carbs),
      goal: DEFAULT_CARBS_GOAL,
      unit: 'g',
      color: 'from-blue-400 to-blue-500',
    },
    {
      label: t.dashboard.fat,
      value: Math.round(totals.fat),
      goal: DEFAULT_FAT_GOAL,
      unit: 'g',
      color: 'from-amber-400 to-amber-500',
    },
  ];

  const waterPct = waterGoal > 0 ? Math.min(100, Math.round((waterGlasses / waterGoal) * 100)) : 0;

  // Share card data
  const shareCardData: ShareCardData | null = (() => {
    if (!weekMeals.data) return null;
    const daysWithData = weekMeals.data.filter(d => d.calories > 0);
    const avgCal = daysWithData.length > 0
      ? Math.round(daysWithData.reduce((s, d) => s + d.calories, 0) / daysWithData.length)
      : 0;
    const avgProt = daysWithData.length > 0
      ? Math.round(daysWithData.reduce((s, d) => s + d.protein, 0) / daysWithData.length)
      : 0;
    const totalWorkouts = weekWorkouts.data
      ? weekWorkouts.data.reduce((s, d) => s + d.workoutCount, 0)
      : 0;

    // Weight change: compare first and last body measurement in trend
    let weightChange: number | undefined;
    if (bodyTrendData.data && bodyTrendData.data.length >= 2) {
      const first = bodyTrendData.data[0];
      const last = bodyTrendData.data[bodyTrendData.data.length - 1];
      if (first.weight_kg && last.weight_kg) {
        weightChange = last.weight_kg - first.weight_kg;
      }
    }

    // Week label
    const now = new Date();
    const weekNum = Math.ceil(
      ((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7
    );
    const weekLabel = `KW ${weekNum} / ${now.getFullYear()}`;

    return {
      displayName: profile?.display_name ?? 'FitBuddy User',
      currentWeight: latestBody?.weight_kg ?? undefined,
      weightChange,
      avgCalories: avgCal,
      caloriesGoal,
      avgProtein: avgProt,
      proteinGoal,
      workoutCount: totalWorkouts,
      weekLabel,
    };
  })();

  return (
    <PageShell title={t.cockpit.title}>
      <div className="space-y-4">
        {/* Share Button — top right float */}
        {shareCardData && shareCardData.avgCalories > 0 && (
          <div className="flex justify-end -mt-2 -mb-2">
            <button
              onClick={() => setShowShareCard(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-teal-600 bg-teal-50 rounded-full hover:bg-teal-100 transition-colors"
            >
              <Share2 className="h-3 w-3" />
              {t.share.shareProgress}
            </button>
          </div>
        )}

        {/* Share Card Dialog */}
        {showShareCard && shareCardData && (
          <ShareCardDialog
            data={shareCardData}
            onClose={() => setShowShareCard(false)}
          />
        )}

        {/* Daily Check-in */}
        <DailyCheckinCard />

        {/* RED-S / Underweight Warning — energy availability risk detection */}
        <REDSWarningBanner
          caloriesConsumed={totals.calories}
          caloriesGoal={caloriesGoal}
          tdee={tdee}
        />

        {/* Gap Alert — re-engagement when user hasn't logged for 2+ days */}
        <GapAlertBanner />

        {/* Proactive Warnings — overtraining, blood work, check-in anomalies */}
        <ProactiveWarningCard />

        {/* Buddy Quick Access */}
        <BuddyQuickAccess suggestions={cockpitSuggestions} />

        {/* Setup Goals CTA — shown when profile is incomplete */}
        {!profileComplete && (
          <button
            onClick={() => navigate('/profile')}
            className="w-full bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4 shadow-sm flex items-center gap-3 hover:from-teal-100 hover:to-emerald-100 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 text-teal-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-teal-800">{t.cockpit.setupGoals}</p>
              <p className="text-xs text-teal-600 mt-0.5">{t.cockpit.setupGoalsHint}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-teal-400 flex-shrink-0" />
          </button>
        )}

        {/* Macro Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const pct = profileComplete && stat.goal > 0 ? Math.min(100, Math.round((stat.value / stat.goal) * 100)) : 0;
            return (
              <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                  <span className="text-sm font-normal text-gray-400 ml-1">{stat.unit}</span>
                </p>
                {profileComplete ? (
                  <>
                    <div className="mt-2 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`bg-gradient-to-r ${stat.color} rounded-full h-1.5 transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {stat.goal - stat.value > 0
                        ? `${stat.goal - stat.value} ${stat.unit} ${t.dashboard.remaining}`
                        : `${t.dashboard.goal} ${t.dashboard.consumed}`
                      }
                    </p>
                    {(stat as { badge?: string }).badge && (
                      <p className="text-[9px] text-pink-500 mt-0.5 font-medium">{(stat as { badge?: string }).badge}</p>
                    )}
                  </>
                ) : (
                  <p className="text-[10px] text-gray-400 mt-2">{t.cockpit.noGoalSet}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Water Tracker + Energy Balance Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Water Tracker */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <p className="text-xs text-gray-500 font-medium">{t.dashboard.water}</p>
            </div>
            <div className="flex items-center justify-between">
              <button
                onClick={() => setWaterGlasses(Math.max(0, waterGlasses - 1))}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <Minus className="h-3 w-3" />
              </button>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{waterGlasses}</p>
                <p className="text-[10px] text-gray-400">/ {waterGoal} {t.dashboard.glasses}</p>
              </div>
              <button
                onClick={() => setWaterGlasses(waterGlasses + 1)}
                className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="mt-2 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-full h-1.5 transition-all duration-500"
                style={{ width: `${waterPct}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1 text-center">
              {waterGlasses >= waterGoal
                ? t.dashboard.glassesDone
                : `${waterGoal - waterGlasses} ${t.dashboard.glassesLeft}`
              }
            </p>
          </div>

          {/* Energy Balance */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <p className="text-xs text-gray-500 font-medium">{t.dashboard.balance}</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${profileComplete && netCalories > caloriesGoal ? 'text-red-500' : 'text-gray-900'}`}>
                {netCalories}
              </p>
              <p className="text-[10px] text-gray-400">{t.dashboard.net} kcal</p>
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-gray-400">
              <span>+{totals.calories} {t.dashboard.consumed}</span>
              <span>-{totalCaloriesBurned} {t.dashboard.burned}</span>
            </div>
          </div>
        </div>

        {/* Weekly Calorie Chart */}
        {weekMeals.data && weekMeals.data.some(d => d.calories > 0) && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1 mb-2">
              {t.cockpit.weeklyCalories}
            </p>
            <CalorieChart data={weekMeals.data} calorieGoal={profileComplete ? caloriesGoal : 0} language={language} />
          </div>
        )}

        {/* BMR/TDEE Card — only shown when profile has enough data */}
        {bmrResult && tdee && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <p className="text-xs text-gray-500 font-medium">{t.dashboard.bmrTdee}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">{bmrResult.bmr}</p>
                <p className="text-[10px] text-gray-400">{t.dashboard.bmr}</p>
                <p className="text-[10px] text-gray-300 mt-0.5">
                  {bmrResult.formula === 'katch' ? 'Katch-McArdle' : 'Mifflin-St Jeor'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-teal-600">{tdee}</p>
                <p className="text-[10px] text-gray-400">{t.dashboard.tdee}</p>
                <p className="text-[10px] text-gray-300 mt-0.5">{t.dashboard.kcalDay}</p>
              </div>
            </div>
          </div>
        )}

        {/* Weight Trend Chart */}
        {bodyTrendData.data && bodyTrendData.data.length > 1 && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1 mb-2">
              {t.cockpit.weightTrend}
            </p>
            <WeightChart data={bodyTrendData.data} language={language} />
          </div>
        )}

        {/* Progression / Forecast */}
        <ProgressionCard language={language} />

        {/* Key Metrics Card (BMI + FFMI) */}
        {latestBody?.bmi && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              {t.cockpit.keyMetrics}
            </p>
            <div className="flex gap-3">
              {/* BMI */}
              {(() => {
                const bmiClass = classifyBMI(latestBody.bmi!);
                return (
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{t.body.bmi}</p>
                    <p className="text-lg font-bold text-gray-900">{latestBody.bmi}</p>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-medium ${bmiClass.color} ${bmiClass.textColor}`}>
                      {language === 'de' ? bmiClass.label_de : bmiClass.label_en}
                    </span>
                  </div>
                );
              })()}
              {/* FFMI */}
              {latestBody.lean_mass_kg && profile?.height_cm && (() => {
                const ffmiResult = calculateFFMI(latestBody.lean_mass_kg!, profile.height_cm);
                const ffmiClass = classifyFFMI(ffmiResult.normalizedFFMI, profile.gender ?? 'male');
                return (
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">{t.body.ffmi}</p>
                    <p className="text-lg font-bold text-gray-900">{ffmiResult.normalizedFFMI}</p>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-medium ${ffmiClass.color} ${ffmiClass.textColor}`}>
                      {language === 'de' ? ffmiClass.label_de : ffmiClass.label_en}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Reminders Widget */}
        {reminderStatus.totalDue > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-teal-500" />
                <p className="text-xs text-gray-500 font-medium">{t.reminders.title}</p>
                {reminderStatus.pending.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-medium">
                    {reminderStatus.pending.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('/medical')}
                className="text-[10px] text-teal-600 hover:underline"
              >
                {t.dashboard.viewAll}
              </button>
            </div>

            {reminderStatus.pending.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {reminderStatus.pending.slice(0, 3).map((reminder) => {
                  const typeIcons: Record<string, string> = {
                    substance: '\u{1F48A}',
                    blood_pressure: '\u{2764}\u{FE0F}',
                    body_measurement: '\u{2696}\u{FE0F}',
                    custom: '\u{1F4CC}',
                  };
                  const timeDisplay = reminder.time
                    ? reminder.time
                    : reminder.time_period
                      ? (reminder.time_period === 'morning' ? '\u{1F305}' : reminder.time_period === 'noon' ? '\u{2600}\u{FE0F}' : '\u{1F319}')
                      : '';

                  return (
                    <div key={reminder.id} className="px-4 py-2.5 flex items-center gap-3">
                      <span className="text-sm">{typeIcons[reminder.type] ?? '\u{1F4CC}'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{reminder.title}</p>
                        {timeDisplay && (
                          <p className="text-[10px] text-gray-400">{timeDisplay}</p>
                        )}
                      </div>
                      <button
                        onClick={() => completeReminder.mutate(reminder.id)}
                        className="w-7 h-7 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-300 hover:border-teal-400 hover:text-teal-500 transition-all"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-teal-600">
                  {t.dashboard.allDone}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Insights Widget */}
        {visibleInsights.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1">
              {t.dashboard.recommendations}
            </p>
            {visibleInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} language={language} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
