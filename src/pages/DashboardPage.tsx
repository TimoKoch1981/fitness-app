import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  Dumbbell,
  Heart,
  Activity,
  ChevronRight,
  Droplets,
  Plus,
  Minus,
  Flame,
  Zap,
  Bell,
  Check,
} from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';
import { useDailyMealTotals } from '../features/meals/hooks/useMeals';
import { useWorkoutsByDate } from '../features/workouts/hooks/useWorkouts';
import { useLatestBodyMeasurement, useBodyMeasurements } from '../features/body/hooks/useBodyMeasurements';
import { useBloodPressureLogs } from '../features/medical/hooks/useBloodPressure';
import { useProfile } from '../features/auth/hooks/useProfile';
import { useReminders, useTodayReminderLogs, getTodayReminderStatus, useCompleteReminder } from '../features/reminders/hooks/useReminders';
import { useSubstances } from '../features/medical/hooks/useSubstances';
import { classifyBloodPressure } from '../lib/calculations';
import { calculateBMR, calculateAge } from '../lib/calculations/bmr';
import { calculateTDEE_PAL } from '../lib/calculations/tdee';
import { generateInsights } from '../lib/insights';
import { InsightCard } from '../shared/components/InsightCard';
import { today } from '../lib/utils';
import { useAuth } from '../app/providers/AuthProvider';
import {
  DEFAULT_CALORIES_GOAL,
  DEFAULT_PROTEIN_GOAL,
  DEFAULT_CARBS_GOAL,
  DEFAULT_FAT_GOAL,
  DEFAULT_WATER_GOAL,
} from '../lib/constants';

const WATER_STORAGE_KEY = 'fitbuddy_water_';

/** Auto-updates date at midnight so the dashboard stays current. */
function useToday(): string {
  const [date, setDate] = useState(() => today());

  useEffect(() => {
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

    const timer = setTimeout(() => {
      setDate(today());
    }, msUntilMidnight + 100); // +100ms buffer

    return () => clearTimeout(timer);
  }, [date]);

  return date;
}

export function DashboardPage() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const selectedDate = useToday();

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

  // Water tracker (localStorage-based for now, scoped per user)
  const waterKey = WATER_STORAGE_KEY + (user?.id ?? 'anon') + '_' + selectedDate;
  const [waterGlasses, setWaterGlasses] = useState(() => {
    const stored = localStorage.getItem(waterKey);
    return stored ? parseInt(stored) : 0;
  });

  useEffect(() => {
    localStorage.setItem(waterKey, waterGlasses.toString());
  }, [waterGlasses, waterKey]);

  // Profile-based goals with defaults
  const caloriesGoal = profile?.daily_calories_goal ?? DEFAULT_CALORIES_GOAL;
  const proteinGoal = profile?.daily_protein_goal ?? DEFAULT_PROTEIN_GOAL;
  const waterGoal = profile?.daily_water_goal ?? DEFAULT_WATER_GOAL;

  // Workout calories
  const totalCaloriesBurned = workouts?.reduce((sum, w) => sum + (w.calories_burned ?? 0), 0) ?? 0;

  // BMR/TDEE calculation
  let bmrResult: { bmr: number; formula: string } | null = null;
  let tdee: number | null = null;

  if (profile?.height_cm && profile?.birth_date && latestBody?.weight_kg) {
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

  // Blood pressure
  const latestBP = bpLogs?.[0];
  const bpClass = latestBP ? classifyBloodPressure(latestBP.systolic, latestBP.diastolic) : null;

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

  // Show max 4 insights (critical/warning always, then fill with info/success)
  const visibleInsights = insights.slice(0, 4);

  const stats = [
    {
      label: t.dashboard.calories,
      value: totals.calories,
      goal: caloriesGoal,
      unit: 'kcal',
      color: 'from-teal-400 to-teal-500',
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

  return (
    <PageShell title={t.dashboard.title}>
      <div className="space-y-4">
        {/* Macro Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const pct = stat.goal > 0 ? Math.min(100, Math.round((stat.value / stat.goal) * 100)) : 0;
            return (
              <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                  <span className="text-sm font-normal text-gray-400 ml-1">{stat.unit}</span>
                </p>
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
              <p className={`text-2xl font-bold ${netCalories > caloriesGoal ? 'text-red-500' : 'text-gray-900'}`}>
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

        {/* BMR/TDEE Card */}
        {bmrResult && tdee ? (
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
        ) : (
          <button
            onClick={() => navigate('/profile')}
            className="w-full bg-yellow-50 rounded-xl p-3 shadow-sm text-center hover:bg-yellow-100 transition-colors"
          >
            <Zap className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-xs text-yellow-700 font-medium">{t.dashboard.completeProfile}</p>
          </button>
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
                    substance: '💊',
                    blood_pressure: '❤️',
                    body_measurement: '⚖️',
                    custom: '📌',
                  };
                  const timeDisplay = reminder.time
                    ? reminder.time
                    : reminder.time_period
                      ? (reminder.time_period === 'morning' ? '🌅' : reminder.time_period === 'noon' ? '☀️' : '🌙')
                      : '';

                  return (
                    <div key={reminder.id} className="px-4 py-2.5 flex items-center gap-3">
                      <span className="text-sm">{typeIcons[reminder.type] ?? '📌'}</span>
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

        {/* Quick Info Cards */}
        <div className="space-y-2">
          {/* Training Today */}
          <button
            onClick={() => navigate('/workouts')}
            className="w-full bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{t.workouts.title}</p>
              <p className="text-xs text-gray-400">
                {workouts && workouts.length > 0
                  ? `${workouts.length} ${t.dashboard.sessions} · ${totalCaloriesBurned} kcal ${t.dashboard.burned}`
                  : t.common.noData
                }
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </button>

          {/* Latest Body */}
          <button
            onClick={() => navigate('/body')}
            className="w-full bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{t.body.title}</p>
              <p className="text-xs text-gray-400">
                {latestBody?.weight_kg
                  ? `${latestBody.weight_kg} kg${latestBody.body_fat_pct ? ` · ${latestBody.body_fat_pct}% KFA` : ''}`
                  : t.common.noData
                }
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </button>

          {/* Latest BP */}
          <button
            onClick={() => navigate('/medical')}
            className="w-full bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              bpClass?.color === 'green' ? 'bg-green-50' :
              bpClass?.color === 'yellow' ? 'bg-yellow-50' :
              bpClass?.color === 'orange' ? 'bg-orange-50' :
              bpClass?.color === 'red' ? 'bg-red-50' : 'bg-gray-50'
            }`}>
              <Heart className={`h-5 w-5 ${
                bpClass?.color === 'green' ? 'text-green-500' :
                bpClass?.color === 'yellow' ? 'text-yellow-500' :
                bpClass?.color === 'orange' ? 'text-orange-500' :
                bpClass?.color === 'red' ? 'text-red-500' : 'text-gray-400'
              }`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{t.medical.bloodPressure}</p>
              <p className="text-xs text-gray-400">
                {latestBP
                  ? `${latestBP.systolic}/${latestBP.diastolic} ${t.medical.mmHg}${latestBP.pulse ? ` · ${latestBP.pulse} bpm` : ''}`
                  : t.common.noData
                }
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </button>

          {/* Meals shortcut */}
          <button
            onClick={() => navigate('/meals')}
            className="w-full bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-teal-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{t.meals.title}</p>
              <p className="text-xs text-gray-400">
                {totals.mealCount > 0
                  ? `${totals.mealCount} ${t.dashboard.mealsCount} · ${totals.calories} kcal`
                  : t.common.noData
                }
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </button>
        </div>
      </div>
    </PageShell>
  );
}
