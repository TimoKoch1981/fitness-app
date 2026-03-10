/**
 * TrainingPlanList — Compact card list of all training plans.
 *
 * Features:
 * - Active plan highlighted with teal badge
 * - Action buttons: Activate, Duplicate, Delete
 * - Delete confirmation with active plan warning
 * - "Create new plan" button
 * - Empty state with hints
 *
 * Pattern: Hevy-inspired card list (no swipe, desktop-compatible, touch-friendly)
 */

import { useState } from 'react';
import {
  CheckCircle2, Copy, Trash2, Dumbbell,
  Plus, ChevronRight, ChevronDown, Calendar, Layers, Sparkles,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../../i18n';
import {
  useTrainingPlans,
  useActivatePlan,
  useDuplicatePlan,
  useDeleteTrainingPlan,
  usePlanById,
} from '../hooks/useTrainingPlans';
import { useExerciseCatalog } from '../hooks/useExerciseCatalog';
import { DayCard } from './DayCard';
import { PlanEditorDialog } from './PlanEditorDialog';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import type { TrainingPlan, TrainingPlanDay, CatalogExercise, SplitType } from '../../../types/health';

interface TrainingPlanListProps {
  /** Currently selected plan ID (for highlighting in the detail view) */
  selectedPlanId?: string;
  /** Called when user selects a plan to view details */
  onSelectPlan: (plan: TrainingPlan) => void;
  /** Called when user clicks "Create new plan" */
  onCreatePlan: () => void;
  /** Currently expanded plan ID (accordion) */
  expandedPlanId?: string | null;
  /** Called when user clicks to expand/collapse a plan */
  onToggleExpand?: (planId: string) => void;
}

const SPLIT_TYPE_LABELS: Record<SplitType, { de: string; en: string }> = {
  ppl: { de: 'Push/Pull/Legs', en: 'Push/Pull/Legs' },
  upper_lower: { de: 'Upper/Lower', en: 'Upper/Lower' },
  full_body: { de: 'Ganzkörper', en: 'Full Body' },
  custom: { de: 'Custom', en: 'Custom' },
  running: { de: 'Laufplan', en: 'Running' },
  swimming: { de: 'Schwimmen', en: 'Swimming' },
  cycling: { de: 'Radfahren', en: 'Cycling' },
  yoga: { de: 'Yoga', en: 'Yoga' },
  martial_arts: { de: 'Kampfsport', en: 'Martial Arts' },
  mixed: { de: 'Gemischt', en: 'Mixed' },
};

export function TrainingPlanList({ selectedPlanId: _selectedPlanId, onSelectPlan: _onSelectPlan, onCreatePlan, expandedPlanId, onToggleExpand }: TrainingPlanListProps) {
  const { t, language } = useTranslation();
  const isDE = language === 'de';
  const plans = (t as unknown as Record<string, Record<string, string>>).plans;
  const queryClient = useQueryClient();

  const { data: allPlans, isLoading } = useTrainingPlans();
  const activatePlan = useActivatePlan();
  const duplicatePlan = useDuplicatePlan();
  const deletePlan = useDeleteTrainingPlan();

  // Accordion: load days for expanded plan
  const { data: expandedPlanData } = usePlanById(expandedPlanId ?? undefined);
  const { data: catalog } = useExerciseCatalog();

  const [deleteTarget, setDeleteTarget] = useState<TrainingPlan | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [editingDay, setEditingDay] = useState<TrainingPlanDay | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<CatalogExercise | null>(null);

  const toggleDay = (dayId: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      next.has(dayId) ? next.delete(dayId) : next.add(dayId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="animate-pulse space-y-2">
          <div className="h-16 bg-gray-100 rounded-xl" />
          <div className="h-16 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!allPlans || allPlans.length === 0) {
    return (
      <div className="text-center py-8">
        <Dumbbell className="h-10 w-10 mx-auto text-gray-200 mb-2" />
        <p className="text-gray-400 text-sm">{plans?.noPlan ?? 'No plans yet'}</p>
        <button
          onClick={onCreatePlan}
          className="mt-3 flex items-center gap-2 mx-auto px-4 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {plans?.createNew ?? 'Create New Plan'}
        </button>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // Guard against negative diff (server clock slightly ahead)
      if (diffDays <= 0) return isDE ? 'Heute' : 'Today';
      if (diffDays === 1) return isDE ? 'Gestern' : 'Yesterday';
      if (diffDays < 7) return isDE ? `vor ${diffDays} Tagen` : `${diffDays} days ago`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return isDE ? `vor ${weeks} Woche${weeks > 1 ? 'n' : ''}` : `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      }
      return d.toLocaleDateString(isDE ? 'de-DE' : 'en-US', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const handleActivate = async (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await activatePlan.mutateAsync(planId);
    } catch (err) {
      console.error('[TrainingPlanList] Activate failed:', err);
    }
  };

  const handleDuplicate = async (planId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await duplicatePlan.mutateAsync(planId);
    } catch (err) {
      console.error('[TrainingPlanList] Duplicate failed:', err);
    }
  };

  const handleDeleteClick = (plan: TrainingPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(plan);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deletePlan.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error('[TrainingPlanList] Delete failed:', err);
    }
  };

  return (
    <div className="space-y-2">
      {/* Header + Create Button */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-700">
          {plans?.title ?? 'My Plans'}
        </h3>
        <button
          onClick={onCreatePlan}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          {isDE ? 'Neu' : 'New'}
        </button>
      </div>

      {/* Plan Cards (Accordion) */}
      {allPlans.map((plan) => {
        const isActive = plan.is_active;
        const isExpanded = plan.id === expandedPlanId;
        const splitLabel = SPLIT_TYPE_LABELS[plan.split_type]?.[isDE ? 'de' : 'en'] ?? plan.split_type;

        return (
          <div
            key={plan.id}
            className={`rounded-xl shadow-sm overflow-hidden transition-all ${
              isActive
                ? 'bg-white ring-2 ring-teal-300'
                : isExpanded
                  ? 'bg-white ring-1 ring-gray-300'
                  : 'bg-white hover:bg-gray-50'
            }`}
          >
            {/* Plan Header — click to expand/collapse */}
            <div
              onClick={() => onToggleExpand?.(plan.id)}
              className="p-3 cursor-pointer"
            >
              <div className="flex items-start gap-3">
                {/* Plan Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {plan.name}
                    </span>
                    {isActive && (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        <CheckCircle2 className="h-3 w-3" />
                        {plans?.active ?? 'Active'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Layers className="h-3 w-3" />
                      {splitLabel}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {plan.days_per_week}x/{isDE ? 'Wo' : 'wk'}
                    </span>
                    <span className="text-[11px] text-gray-300">
                      {formatDate(plan.created_at)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {!isActive && (
                    <button
                      onClick={(e) => handleActivate(plan.id, e)}
                      disabled={activatePlan.isPending}
                      className="p-1.5 text-gray-300 hover:text-teal-500 transition-colors disabled:opacity-50"
                      title={plans?.activate ?? 'Activate'}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDuplicate(plan.id, e)}
                    disabled={duplicatePlan.isPending}
                    className="p-1.5 text-gray-300 hover:text-indigo-500 transition-colors disabled:opacity-50"
                    title={plans?.duplicate ?? 'Duplicate'}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(plan, e)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                    title={plans?.delete ?? 'Delete'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-teal-400 ml-0.5" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-200 ml-0.5" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded: Day Cards */}
            {isExpanded && expandedPlanData?.days && (
              <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
                {/* Calibration button if needed */}
                {!expandedPlanData.review_config?.calibration_done && (
                  <button
                    className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1 hover:bg-amber-200 transition-colors"
                  >
                    <Sparkles className="h-3 w-3" />
                    {isDE ? 'Kalibrierung starten' : 'Start calibration'}
                  </button>
                )}
                {expandedPlanData.notes && (
                  <p className="text-xs text-gray-400 italic px-1">{expandedPlanData.notes}</p>
                )}
                {expandedPlanData.days.map((day) => (
                  <DayCard
                    key={day.id}
                    day={day}
                    planId={plan.id}
                    isExpanded={expandedDays.has(day.id)}
                    onToggle={() => toggleDay(day.id)}
                    catalog={catalog ?? []}
                    onExerciseClick={setSelectedExercise}
                    onEdit={setEditingDay}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Plan Editor Dialog (opened from DayCard pencil icon) */}
      {editingDay && (
        <PlanEditorDialog
          day={editingDay}
          onClose={() => setEditingDay(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['training_plans'] });
            queryClient.invalidateQueries({ queryKey: ['training_plans', 'active'] });
            if (expandedPlanId) {
              queryClient.invalidateQueries({ queryKey: ['training_plans', 'detail', expandedPlanId] });
            }
            setEditingDay(null);
          }}
        />
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <h3 className="text-base font-semibold text-gray-900">
                {plans?.deleteConfirm ?? 'Really delete plan?'}
              </h3>
            </div>
            <p className="text-sm text-gray-500 mb-1">
              &quot;{deleteTarget.name}&quot;
            </p>
            {deleteTarget.is_active && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1.5 mb-3">
                {plans?.deleteActiveWarning ?? 'This is your active plan.'}
              </p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {plans?.deleteCancel ?? 'Cancel'}
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletePlan.isPending}
                className="flex-1 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deletePlan.isPending ? '...' : (plans?.delete ?? 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
