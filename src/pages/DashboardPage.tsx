import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Dumbbell, Heart, Activity, ChevronRight } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';
import { useDailyMealTotals } from '../features/meals/hooks/useMeals';
import { useWorkoutsByDate } from '../features/workouts/hooks/useWorkouts';
import { useLatestBodyMeasurement } from '../features/body/hooks/useBodyMeasurements';
import { useBloodPressureLogs } from '../features/medical/hooks/useBloodPressure';
import { classifyBloodPressure } from '../lib/calculations';
import { today } from '../lib/utils';
import {
  DEFAULT_CALORIES_GOAL,
  DEFAULT_PROTEIN_GOAL,
  DEFAULT_CARBS_GOAL,
  DEFAULT_FAT_GOAL,
} from '../lib/constants';

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const selectedDate = today();

  const { totals } = useDailyMealTotals(selectedDate);
  const { data: workouts } = useWorkoutsByDate(selectedDate);
  const { data: latestBody } = useLatestBodyMeasurement();
  const { data: bpLogs } = useBloodPressureLogs(1);

  const totalCaloriesBurned = workouts?.reduce((sum, w) => sum + (w.calories_burned ?? 0), 0) ?? 0;
  const latestBP = bpLogs?.[0];
  const bpClass = latestBP ? classifyBloodPressure(latestBP.systolic, latestBP.diastolic) : null;

  const stats = [
    {
      label: t.dashboard.calories,
      value: totals.calories,
      goal: DEFAULT_CALORIES_GOAL,
      unit: 'kcal',
      color: 'from-teal-400 to-teal-500',
    },
    {
      label: t.dashboard.protein,
      value: Math.round(totals.protein),
      goal: DEFAULT_PROTEIN_GOAL,
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
                  ? `${workouts.length} Einheiten · ${totalCaloriesBurned} kcal ${t.dashboard.burned}`
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
                  ? `${totals.mealCount} Mahlzeiten · ${totals.calories} kcal`
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
