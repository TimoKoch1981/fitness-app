/**
 * WorkoutsTabContent — Inner content of the Workouts tab, extracted from WorkoutsPage.
 * Contains sub-tabs: Today | Plan | History | Progress | Periodization.
 * Used inside TrackingPage as one of 3 tracking tabs.
 *
 * Plan tab now shows:
 * - TrainingPlanList (accordion: expandable plan cards with inline DayCards)
 * - CreatePlanDialog (2-step dialog for new plans)
 * - Post-creation choice: manual edit or Buddy help
 */

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Dumbbell, Clock, Flame, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { BuddyQuickAccess } from '../../../shared/components/BuddyQuickAccess';
import { useTranslation } from '../../../i18n';
import { useWorkoutsByDate, useDeleteWorkout } from '../hooks/useWorkouts';
import { useActivePlan, usePlanById } from '../hooks/useTrainingPlans';
import { usePageBuddySuggestions, type BuddySuggestion } from '../../buddy/hooks/usePageBuddySuggestions';
import { AddWorkoutDialog } from './AddWorkoutDialog';
import { TrainingPlanList } from './TrainingPlanList';
import { PlanWizardProvider, usePlanWizard } from '../context/PlanWizardContext';
import { PlanWizardDialog } from './PlanWizardDialog';
import { PlanEditorDialog } from './PlanEditorDialog';
import { WorkoutHistoryPage } from './WorkoutHistoryPage';
import { useInlineBuddyChat } from '../../../shared/components/InlineBuddyChatContext';
import type { TrainingPlan, TrainingPlanDay } from '../../../types/health';
// Lazy-load heavy chart components (~350KB Recharts)
const ProgressiveOverloadCharts = lazy(() => import('./ProgressiveOverloadCharts').then(m => ({ default: m.ProgressiveOverloadCharts })));
const PeriodizationView = lazy(() => import('./PeriodizationView').then(m => ({ default: m.PeriodizationView })));
import { today, formatDate } from '../../../lib/utils';

interface WorkoutsTabContentProps {
  showAddDialog: boolean;
  onOpenAddDialog: () => void;
  onCloseAddDialog: () => void;
  /** Switch to a specific sub-tab externally (e.g., "plan" from WorkoutStartDialog U2) */
  forceTab?: 'today' | 'plan' | 'history' | 'progress' | 'periodization' | null;
  /** Called after forceTab has been applied so parent can clear it */
  onForceTabApplied?: () => void;
  /** If true, open CreatePlanDialog immediately when switching to plan tab */
  openCreatePlan?: boolean;
  /** Called after openCreatePlan has been consumed */
  onCreatePlanOpened?: () => void;
}

export function WorkoutsTabContent({
  showAddDialog, onOpenAddDialog, onCloseAddDialog,
  forceTab, onForceTabApplied, openCreatePlan, onCreatePlanOpened,
}: WorkoutsTabContentProps) {
  const { t, language } = useTranslation();
  const isDE = language === 'de';
  const queryClient = useQueryClient();
  const { openBuddyChat } = useInlineBuddyChat();
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'plan' | 'history' | 'progress' | 'periodization'>('today');

  // Apply forceTab from parent (U2: "Plan erstellen" → switch to plan tab)
  useEffect(() => {
    if (forceTab && forceTab !== activeSubTab) {
      setActiveSubTab(forceTab);
      onForceTabApplied?.();
    }
  }, [forceTab]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Multi-plan state
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // PlanWizard: pending action from buddy chips (consumed inside PlanWizardProvider)
  const [pendingWizardAction, setPendingWizardAction] = useState<'create' | 'edit' | null>(null);

  // Accordion: which plan is expanded (auto-expand active plan)
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Load expanded plan data (with days) for review context
  const { data: expandedPlanData } = usePlanById(expandedPlanId ?? undefined);

  // Auto-expand active plan on first load
  useEffect(() => {
    if (activePlan?.id && expandedPlanId === null) {
      setExpandedPlanId(activePlan.id);
    }
  }, [activePlan?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleExpand = useCallback((planId: string) => {
    setExpandedPlanId(prev => prev === planId ? null : planId);
  }, []);

  // Open PlanWizard when requested by parent (e.g., WorkoutStartDialog)
  useEffect(() => {
    if (openCreatePlan && activeSubTab === 'plan') {
      setPendingWizardAction('create');
      onCreatePlanOpened?.();
    }
  }, [openCreatePlan, activeSubTab]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Intercept buddy chips → handle plan_create, plan_edit, plan_evaluate
  const handleBuddySuggestionClick = useCallback((suggestion: BuddySuggestion): boolean => {
    if (suggestion.id === 'plan_create') {
      if (activeSubTab !== 'plan') setActiveSubTab('plan');
      setPendingWizardAction('create');
      return true;
    }
    if (suggestion.id === 'plan_edit') {
      if (activeSubTab !== 'plan') setActiveSubTab('plan');
      if (activePlan) {
        setPendingWizardAction('edit');
      }
      return true;
    }
    if (suggestion.id === 'plan_evaluate') {
      // Open buddy with plan review context
      const plan = expandedPlanData ?? activePlan;
      if (plan) {
        const daysSummary = plan.days
          ? plan.days.map(d => {
              const exNames = (d.exercises ?? []).map((ex: { name?: string; exercise_id?: string }) => ex.name ?? ex.exercise_id).filter(Boolean).join(', ');
              return `${d.name}: ${exNames || (isDE ? 'keine Übungen' : 'no exercises')}`;
            }).join('; ')
          : '';
        const context = `${plan.name} (${plan.split_type}, ${plan.days_per_week}x/${isDE ? 'Woche' : 'week'})${daysSummary ? ` — ${daysSummary}` : ''}`;
        const msg = isDE
          ? `Bewerte meinen Trainingsplan: ${context}`
          : `Evaluate my training plan: ${context}`;
        openBuddyChat(msg, 'training');
      }
      return true;
    }
    return false;
  }, [activeSubTab, activePlan, expandedPlanData, isDE, openBuddyChat]);

  return (
    <PlanWizardProvider>
      <WizardActionBridge
        pendingAction={pendingWizardAction}
        onConsumed={() => setPendingWizardAction(null)}
        plan={activePlan ?? undefined}
      />
      <PlanWizardDialog />
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
        <button
          onClick={() => setActiveSubTab('progress')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeSubTab === 'progress'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {language === 'de' ? 'Fortschritt' : 'Progress'}
        </button>
        <button
          onClick={() => setActiveSubTab('periodization')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeSubTab === 'periodization'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {((t as unknown as Record<string, Record<string, string>>).periodization?.tab) ?? (language === 'de' ? 'Perioden' : 'Periods')}
        </button>
      </div>

      {/* Buddy Quick Access */}
      <BuddyQuickAccess suggestions={buddySuggestions} onSuggestionClick={handleBuddySuggestionClick} />

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

        </>
      ) : activeSubTab === 'plan' ? (
        /* Plan Sub-Tab — Now with Multi-Plan List + Detail View */
        isPlanLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Plan List — Accordion: click plan to expand/collapse inline day cards */}
            <TrainingPlanList
              selectedPlanId={selectedPlanId ?? activePlan?.id}
              onSelectPlan={() => {/* accordion handles selection now */}}
              onCreatePlan={() => setPendingWizardAction('create')}
              expandedPlanId={expandedPlanId}
              onToggleExpand={handleToggleExpand}
            />
          </div>
        )
      ) : activeSubTab === 'history' ? (
        /* History Sub-Tab */
        <WorkoutHistoryPage embedded />
      ) : activeSubTab === 'progress' ? (
        /* Progress Sub-Tab */
        <Suspense fallback={<div className="h-64 bg-gray-50 rounded-xl animate-pulse" />}>
          <ProgressiveOverloadCharts />
        </Suspense>
      ) : (
        /* Periodization Sub-Tab */
        <Suspense fallback={<div className="h-64 bg-gray-50 rounded-xl animate-pulse" />}>
          <PeriodizationView />
        </Suspense>
      )}

      {/* AddWorkoutDialog — always rendered so Plus button works from any sub-tab */}
      <AddWorkoutDialog
        open={showAddDialog}
        onClose={onCloseAddDialog}
        date={selectedDate}
      />

    </>
    </PlanWizardProvider>
  );
}

/** Bridges parent state (buddy chips / forceTab) with PlanWizardContext. */
function WizardActionBridge({ pendingAction, onConsumed, plan }: {
  pendingAction: 'create' | 'edit' | null;
  onConsumed: () => void;
  plan?: TrainingPlan;
}) {
  const { openWizard } = usePlanWizard();

  useEffect(() => {
    if (!pendingAction) return;
    if (pendingAction === 'create') {
      openWizard('create');
    } else if (pendingAction === 'edit' && plan) {
      openWizard('edit', plan);
    }
    onConsumed();
  }, [pendingAction]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
