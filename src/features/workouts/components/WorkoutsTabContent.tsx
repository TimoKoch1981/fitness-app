/**
 * WorkoutsTabContent — Inner content of the Workouts tab, extracted from WorkoutsPage.
 * Contains sub-tabs: Today | Plan.
 * Used inside TrackingPage as one of 3 tracking tabs.
 */

import { useState } from 'react';
import { Dumbbell, Clock, Flame, Trash2 } from 'lucide-react';
import { BuddyQuickAccess } from '../../../shared/components/BuddyQuickAccess';
import { useTranslation } from '../../../i18n';
import { useWorkoutsByDate, useDeleteWorkout } from '../hooks/useWorkouts';
import { useActivePlan, useAddTrainingPlan, useDeleteTrainingPlan } from '../hooks/useTrainingPlans';
import { usePageBuddySuggestions } from '../../buddy/hooks/usePageBuddySuggestions';
import { AddWorkoutDialog } from './AddWorkoutDialog';
import { TrainingPlanView } from './TrainingPlanView';
import { WorkoutHistoryPage } from './WorkoutHistoryPage';
import { DEFAULT_PLAN } from '../data/defaultPlan';
import { today, formatDate } from '../../../lib/utils';

interface WorkoutsTabContentProps {
  showAddDialog: boolean;
  onOpenAddDialog: () => void;
  onCloseAddDialog: () => void;
}

export function WorkoutsTabContent({ showAddDialog, onOpenAddDialog, onCloseAddDialog }: WorkoutsTabContentProps) {
  const { t, language } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'plan' | 'history'>('today');
  const buddySuggestions = usePageBuddySuggestions(
    activeSubTab === 'plan' ? 'tracking_training_plan' : 'tracking_training',
    language as 'de' | 'en',
  );
  const [selectedDate] = useState(today());

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
    strength: '\u{1F3CB}\u{FE0F}',
    cardio: '\u{1F3C3}',
    flexibility: '\u{1F9D8}',
    hiit: '\u{26A1}',
    sports: '\u{26BD}',
    other: '\u{1F525}',
  };

  const handleImportDefault = async () => {
    try {
      await addTrainingPlan.mutateAsync(DEFAULT_PLAN);
    } catch (error) {
      console.error('[WorkoutsTabContent] Failed to import default plan:', error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await deleteTrainingPlan.mutateAsync(planId);
    } catch (error) {
      console.error('[WorkoutsTabContent] Failed to delete plan:', error);
    }
  };

  return (
    <>
      {/* Sub-Tab Bar (Today | Plan | History) */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveSubTab('today')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeSubTab === 'today'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.workouts.today}
        </button>
        <button
          onClick={() => setActiveSubTab('plan')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeSubTab === 'plan'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.workouts.myPlan}
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeSubTab === 'history'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {language === 'de' ? 'Historie' : 'History'}
        </button>
      </div>

      {/* Buddy Quick Access */}
      <BuddyQuickAccess suggestions={buddySuggestions} />

      {/* Sub-Tab Content */}
      {activeSubTab === 'today' ? (
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
                    <span className="text-2xl">{workoutTypeEmojis[workout.type] ?? '\u{1F525}'}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{workout.name}</p>
                      <p className="text-xs text-gray-400">
                        {workoutTypeLabels[workout.type] ?? workout.type}
                        {' \u00b7 '}{formatDate(workout.date, locale)}
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
                              {ex.sets && ex.reps && ` \u00b7 ${ex.sets}\u00d7${ex.reps}`}
                              {ex.weight_kg && ` \u00b7 ${ex.weight_kg} kg`}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteWorkout.mutate({ id: workout.id, date: workout.date })}
                      className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
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
                onClick={onOpenAddDialog}
                className="mt-3 px-4 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors"
              >
                {t.workouts.addWorkout}
              </button>
            </div>
          )}

          <AddWorkoutDialog
            open={showAddDialog}
            onClose={onCloseAddDialog}
            date={selectedDate}
          />
        </>
      ) : activeSubTab === 'plan' ? (
        /* Plan Sub-Tab */
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
      ) : (
        /* History Sub-Tab */
        <WorkoutHistoryPage embedded />
      )}
    </>
  );
}
