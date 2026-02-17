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
} from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';
import { useDailyMealTotals } from '../features/meals/hooks/useMeals';
import { useWorkoutsByDate } from '../features/workouts/hooks/useWorkouts';
import { useLatestBodyMeasurement } from '../features/body/hooks/useBodyMeasurements';
import { useBloodPressureLogs } from '../features/medical/hooks/useBloodPressure';
import { useProfile } from '../features/auth/hooks/useProfile';
import { classifyBloodPressure } from '../lib/calculations';
import { calculateBMR, calculateAge } from '../lib/calculations/bmr';
import { calculateTDEE_PAL } from '../lib/calculations/tdee';
import { today } from '../lib/utils';
import {
  DEFAULT_CALORIES_GOAL,
  DEFAULT_PROTEIN_GOAL,
  DEFAULT_CARBS_GOAL,
  DEFAULT_FAT_GOAL,
  DEFAULT_WATER_GOAL,
} from '../lib/constants';

const WATER_STORAGE_KEY = 'fitbuddy_water_';

export function DashboardPage() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const selectedDate = today();

  const { data: profile } = useProfile();
  const { totals } = useDailyMealTotals(selectedDate);
  const { data: workouts } = useWorkoutsByDate(selectedDate);
  const { data: latestBody } = useLatestBodyMeasurement();
  const { data: bpLogs } = useBloodPressureLogs(1);

  // Water tracker (localStorage-based for now)
  const waterKey = WATER_STORAGE_KEY + selectedDate;
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
                <p className="text-[9px] text-gray-300 mt-0.5">
                  {bmrResult.formula === 'katch' ? 'Katch-McArdle' : 'Mifflin-St Jeor'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-teal-600">{tdee}</p>
                <p className="text-[10px] text-gray-400">{t.dashboard.tdee}</p>
                <p className="text-[9px] text-gray-300 mt-0.5">{t.dashboard.kcalDay}</p>
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
                  ? `${workouts.length} ${language === 'de' ? 'Einheiten' : 'sessions'} · ${totalCaloriesBurned} kcal ${t.dashboard.burned}`
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
                  ? `${totals.mealCount} ${language === 'de' ? 'Mahlzeiten' : 'meals'} · ${totals.calories} kcal`
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
