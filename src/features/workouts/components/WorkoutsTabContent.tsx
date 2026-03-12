/**
 * WorkoutsTabContent — Inner content of the Workouts tab, extracted from WorkoutsPage.
 * Contains sub-tabs: Plan | History | Progress (full analytics dashboard).
 * Used inside TrackingPage as one of 3 tracking tabs.
 *
 * Plan tab now shows:
 * - TrainingPlanList (accordion: expandable plan cards with inline DayCards)
 * - CreatePlanDialog (2-step dialog for new plans)
 * - Post-creation choice: manual edit or Buddy help
 */

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Dumbbell } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { BuddyQuickAccess } from '../../../shared/components/BuddyQuickAccess';
import { useTranslation } from '../../../i18n';
// useWorkoutsByDate removed (today tab eliminated)
import { useActivePlan } from '../hooks/useTrainingPlans';
import { usePageBuddySuggestions, type BuddySuggestion } from '../../buddy/hooks/usePageBuddySuggestions';
import { AddWorkoutDialog } from './AddWorkoutDialog';
import { TrainingPlanList } from './TrainingPlanList';
import { PlanWizardProvider, usePlanWizard } from '../context/PlanWizardContext';
import { PlanWizardDialog } from './PlanWizardDialog';
import { PlanEditorDialog } from './PlanEditorDialog';
import { WorkoutHistoryPage } from './WorkoutHistoryPage';
import type { TrainingPlan, TrainingPlanDay } from '../../../types/health';
// Lazy-load analytics dashboard
const ProgressDashboard = lazy(() => import('./ProgressDashboard').then(m => ({ default: m.ProgressDashboard })));
import { today, formatDate } from '../../../lib/utils';

interface WorkoutsTabContentProps {
  showAddDialog: boolean;
  onOpenAddDialog: () => void;
  onCloseAddDialog: () => void;
  /** Switch to a specific sub-tab externally (e.g., "plan" from WorkoutStartDialog U2) */
  forceTab?: 'plan' | 'history' | 'progress' | null;
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
  const queryClient = useQueryClient();
  const [activeSubTab, setActiveSubTab] = useState<'plan' | 'history' | 'progress'>('plan');

  // Apply forceTab from parent (U2: "Plan erstellen" → switch to plan tab)
  useEffect(() => {
    if (forceTab && forceTab !== activeSubTab) {
      setActiveSubTab(forceTab);
      onForceTabApplied?.();
    }
  }, [forceTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const buddyPageId = activeSubTab === 'plan'
    ? 'tracking_training_plan'
    : activeSubTab === 'history'
      ? 'tracking_training_history'
      : 'tracking_training_progress';
  const buddySuggestions = usePageBuddySuggestions(
    buddyPageId,
    language as 'de' | 'en',
  );
  const [selectedDate] = useState(today());

  // Training plan
  const { data: activePlan, isLoading: isPlanLoading } = useActivePlan();

  // Multi-plan state
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // PlanWizard: pending action from buddy chips (consumed inside PlanWizardProvider)
  const [pendingWizardAction, setPendingWizardAction] = useState<'create' | 'edit' | null>(null);

  // Accordion: which plan is expanded (auto-expand active plan)
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Load expanded plan data (with days) for review context

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



  // Intercept buddy chips → handle plan_create
  const handleBuddySuggestionClick = useCallback((suggestion: BuddySuggestion): boolean => {
    if (suggestion.id === 'plan_create') {
      if (activeSubTab !== 'plan') setActiveSubTab('plan');
      setPendingWizardAction('create');
      return true;
    }
    return false;
  }, [activeSubTab]);

  return (
    <PlanWizardProvider>
      <WizardActionBridge
        pendingAction={pendingWizardAction}
        onConsumed={() => setPendingWizardAction(null)}
        plan={activePlan ?? undefined}
      />
      <PlanWizardDialog />
      <>
      {/* Sub-Tab Bar (Plan | History | Progress) */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
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
      </div>

      {/* Buddy Quick Access */}
      <BuddyQuickAccess suggestions={buddySuggestions} onSuggestionClick={handleBuddySuggestionClick} />

      {/* Sub-Tab Content */}
      {activeSubTab === 'plan' ? (
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
      ) : (
        /* Progress Sub-Tab — Full Analytics Dashboard */
        <Suspense fallback={<div className="h-64 bg-gray-50 rounded-xl animate-pulse" />}>
          <ProgressDashboard />
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
