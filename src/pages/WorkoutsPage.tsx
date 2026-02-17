import { useState } from 'react';
import { Plus, Dumbbell, Clock, Flame, Trash2 } from 'lucide-react';
import { PageShell } from '../shared/components/PageShell';
import { useTranslation } from '../i18n';
import { useWorkoutsByDate, useDeleteWorkout } from '../features/workouts/hooks/useWorkouts';
import { useActivePlan, useAddTrainingPlan, useDeleteTrainingPlan } from '../features/workouts/hooks/useTrainingPlans';
import { AddWorkoutDialog } from '../features/workouts/components/AddWorkoutDialog';
import { TrainingPlanView } from '../features/workouts/components/TrainingPlanView';
import { DEFAULT_PLAN } from '../features/workouts/data/defaultPlan';
import { today, formatDate } from '../lib/utils';

export function WorkoutsPage() {
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'today' | 'plan'>('today');
  const [selectedDate] = useState(today());
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Today's workouts
  const { data: workouts, isLoading } = useWorkoutsByDate(selectedDate);
  const deleteWorkout = useDeleteWorkout();

  // Training plan
  const { data: activePlan, isLoading: isPlanLoading } = useActivePlan();
  const addTrainingPlan = useAddTrainingPlan();
  const deleteTrainingPlan = useDeleteTrainingPlan();

  const locale = language === 'de' ? 'de-DE' : 'en-US';

  const workoutTypeLabels: Record<string, string> = {
    strength: t.workouts.strength,
    cardio: t.workouts.cardio,
    flexibility: t.workouts.flexibility,
    hiit: t.workouts.hiit,
    sports: t.workouts.sports,
    other: t.workouts.other,
  };

  const workoutTypeEmojis: Record<string, string> = {
    strength: '🏋️',
    cardio: '🏃',
    flexibility: '🧘',
    hiit: '⚡',
    sports: '⚽',
    other: '🔥',
  };

  const handleImportDefault = async () => {
    try {
      await addTrainingPlan.mutateAsync(DEFAULT_PLAN);
    } catch (error) {
      console.error('[WorkoutsPage] Failed to import default plan:', error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await deleteTrainingPlan.mutateAsync(planId);
    } catch (error) {
      console.error('[WorkoutsPage] Failed to delete plan:', error);
    }
  };

  return (
    <PageShell
      title={t.workouts.title}
      actions={
        activeTab === 'today' ? (
          <button
            onClick={() => setShowAddDialog(true)}
            className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        ) : undefined
      }
    >
      {/* Tab Bar */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'today'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.workouts.today}
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'plan'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.workouts.myPlan}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'today' ? (
        <>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto" />
            </div>
          ) : workouts && workouts.length > 0 ? (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <div key={workout.id} className="bg-white rounded-xl p-4 shadow-sm group">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{workoutTypeEmojis[workout.type] ?? '🔥'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{workout.name}</p>
                      <p className="text-xs text-gray-400">
                        {workoutTypeLabels[workout.type] ?? workout.type}
                        {' · '}{formatDate(workout.date, locale)}
                      </p>
                      <div className="flex gap-4 mt-2">
                        {workout.duration_minutes && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {workout.duration_minutes} {t.workouts.minutes}
                          </div>
                        )}
                        {workout.calories_burned && (
                          <div className="flex items-center gap-1 text-xs text-orange-500">
                            <Flame className="h-3 w-3" />
                            {workout.calories_burned} kcal
                          </div>
                        )}
                      </div>
                      {/* Exercises */}
                      {workout.exercises && workout.exercises.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {workout.exercises.map((ex, idx) => (
                            <p key={idx} className="text-xs text-gray-400">
                              {ex.name}
                              {ex.sets && ex.reps && ` · ${ex.sets}×${ex.reps}`}
                              {ex.weight_kg && ` · ${ex.weight_kg} kg`}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteWorkout.mutate({ id: workout.id, date: workout.date })}
                      className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Dumbbell className="h-12 w-12 mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">{t.common.noData}</p>
              <button
                onClick={() => setShowAddDialog(true)}
                className="mt-3 px-4 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors"
              >
                {t.workouts.addWorkout}
              </button>
            </div>
          )}

          <AddWorkoutDialog
            open={showAddDialog}
            onClose={() => setShowAddDialog(false)}
            date={selectedDate}
          />
        </>
      ) : (
        /* Plan Tab */
        isPlanLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto" />
          </div>
        ) : (
          <TrainingPlanView
            plan={activePlan ?? null}
            onDelete={handleDeletePlan}
            onImportDefault={handleImportDefault}
            isImporting={addTrainingPlan.isPending}
          />
        )
      )}
    </PageShell>
  );
}
