import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, Dumbbell, Download, FileText, ClipboardList, MessageCircle, Pencil, Share2, Sparkles, BarChart3 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { TrainingPlan, TrainingPlanDay, CatalogExercise } from '../../../types/health';
// Dynamic import: jsPDF (~800KB) only loaded when user clicks PDF export
const loadTrainingPlanPDF = () => import('../utils/generateTrainingPlanPDF');
import { useExerciseCatalog } from '../hooks/useExerciseCatalog';
import { DayCard } from './DayCard';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { ShareTrainingPlanDialog } from './ShareTrainingPlanDialog';
import { CalibrationWizard } from './CalibrationWizard';
import { usePEDPhaseSync } from '../hooks/usePEDPhaseSync';
import { useMesocycleCheck } from '../hooks/useMesocycleCheck';
import { useAISupervisedOffer } from '../hooks/useAISupervisedOffer';
import { useProfile } from '../../auth/hooks/useProfile';
import { ReviewDialog } from './ReviewDialog';
import { useRecentWorkoutsForPlan } from '../hooks/useRecentWorkoutsForPlan';
// useInProgressWorkout + useAbortDraft moved to DayCard.tsx
import { PlanEditorDialog } from './PlanEditorDialog';

interface TrainingPlanViewProps {
  plan: TrainingPlan | null;
  onDelete?: (planId: string) => void;
  onImportDefault?: () => void;
  isImporting?: boolean;
}

/**
 * Displays the user's active training plan with expandable day cards.
 * Shows an empty state with import/buddy hints when no plan exists.
 */
export function TrainingPlanView({ plan, onDelete, onImportDefault, isImporting }: TrainingPlanViewProps) {
  const { t, language } = useTranslation();
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1])); // First day expanded by default
  const [isExporting, setIsExporting] = useState(false);
  const [showPdfMenu, setShowPdfMenu] = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement>(null);
  const { data: catalog } = useExerciseCatalog();
  const [selectedExercise, setSelectedExercise] = useState<CatalogExercise | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [editingDay, setEditingDay] = useState<TrainingPlanDay | null>(null);

  // PED phase sync (Power+ mode only — auto-adjusts review_config on cycle change)
  usePEDPhaseSync();

  // Mesocycle check — determines if a review is due
  const mesocycleStatus = useMesocycleCheck(plan?.review_config);

  // AI Trainer offer — suggest enabling for non-supervised plans
  const { data: profile } = useProfile();
  const aiOffer = useAISupervisedOffer(plan, profile?.ai_trainer_enabled);
  const [aiOfferDismissed, setAiOfferDismissed] = useState(false);

  // Review Dialog state
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const { data: recentWorkouts } = useRecentWorkoutsForPlan(
    plan?.ai_supervised ? plan?.id : undefined,
  );

  // Invalidate plan data after PlanEditorDialog save (instead of full page reload)
  const queryClient = useQueryClient();
  const onPlanEditorSaved = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['training_plans'] });
    queryClient.invalidateQueries({ queryKey: ['training_plans', 'active'] });
    if (plan?.id) {
      queryClient.invalidateQueries({ queryKey: ['training_plans', 'detail', plan.id] });
    }
  }, [queryClient, plan?.id]);

  // Auto-trigger CalibrationWizard for uncalibrated plans (once per session per plan)
  useEffect(() => {
    if (
      plan &&
      plan.ai_supervised === true &&
      (!plan.review_config || !plan.review_config.calibration_done)
    ) {
      const key = `calibration_shown_${plan.id}`;
      if (!sessionStorage.getItem(key)) {
        setShowCalibration(true);
        sessionStorage.setItem(key, '1');
      }
    }
  }, [plan?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    if (!showPdfMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(e.target as Node)) {
        setShowPdfMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPdfMenu]);

  const toggleDay = (dayNumber: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayNumber)) {
        next.delete(dayNumber);
      } else {
        next.add(dayNumber);
      }
      return next;
    });
  };

  // ── Empty State ──────────────────────────────────────────────────────

  if (!plan) {
    return (
      <div className="text-center py-12">
        <Dumbbell className="h-12 w-12 mx-auto text-gray-200 mb-3" />
        <p className="text-gray-400 text-sm">{t.workouts.noPlan}</p>
        <p className="text-gray-400 text-sm mt-1">{t.workouts.noPlanHint}</p>

        <div className="flex flex-col gap-2 mt-6 max-w-xs mx-auto">
          {onImportDefault && (
            <button
              onClick={onImportDefault}
              disabled={isImporting}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isImporting ? '...' : t.workouts.loadDefault}
            </button>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <MessageCircle className="h-3 w-3" />
            <span>&quot;Erstell mir einen Trainingsplan&quot;</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Plan View ────────────────────────────────────────────────────────

  const splitTypeLabels: Record<string, string> = {
    ppl: 'Push/Pull/Legs',
    upper_lower: 'Upper/Lower',
    full_body: language === 'de' ? 'Ganzkörper' : 'Full Body',
    custom: 'Custom',
    running: language === 'de' ? 'Laufplan' : 'Running Plan',
    swimming: language === 'de' ? 'Schwimmplan' : 'Swimming Plan',
    cycling: language === 'de' ? 'Radfahrplan' : 'Cycling Plan',
    yoga: 'Yoga',
    martial_arts: language === 'de' ? 'Kampfsport' : 'Martial Arts',
    mixed: language === 'de' ? 'Gemischt' : 'Mixed',
  };

  return (
    <div className="space-y-3">
      {/* Plan Header */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{plan.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                {splitTypeLabels[plan.split_type] ?? plan.split_type}
              </span>
              <span className="text-xs text-gray-400">
                {plan.days_per_week}x / {t.reminders.weekly.toLowerCase()}
              </span>
            </div>
            {plan.ai_supervised && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1">
                🤖 {language === 'de' ? 'KI-Trainer aktiv' : 'AI Trainer active'}
                {plan.review_config?.current_week && plan.review_config?.mesocycle_weeks && (
                  <span className="text-indigo-500">
                    · {language === 'de' ? 'Woche' : 'Week'} {plan.review_config.current_week}/{plan.review_config.mesocycle_weeks}
                  </span>
                )}
              </span>
            )}
            {/* Calibration button — show when not yet calibrated */}
            {!plan.review_config?.calibration_done && (
              <button
                onClick={() => setShowCalibration(true)}
                className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 hover:bg-amber-200 transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                {language === 'de' ? 'Kalibrierung starten' : 'Start calibration'}
              </button>
            )}
            {plan.notes && (
              <p className="text-xs text-gray-400 mt-1">{plan.notes}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Edit Plan — opens editor for first day */}
            <button
              onClick={() => {
                const firstDay = plan.days?.[0];
                if (firstDay) setEditingDay(firstDay);
              }}
              className="p-1.5 text-gray-400 hover:text-teal-500 transition-colors"
              title={t.workouts.editPlan}
            >
              <Pencil className="h-4 w-4" />
            </button>
            {/* Share Button */}
            <button
              onClick={() => setShowShareDialog(true)}
              className="p-1.5 text-gray-400 hover:text-teal-500 transition-colors"
              title={t.share.sharePlan}
            >
              <Share2 className="h-4 w-4" />
            </button>
            {/* PDF Dropdown */}
            <div className="relative" ref={pdfMenuRef}>
              <button
                onClick={() => setShowPdfMenu(!showPdfMenu)}
                disabled={isExporting}
                className="p-1.5 text-gray-400 hover:text-teal-500 transition-colors disabled:opacity-50"
                title={language === 'de' ? 'PDF exportieren' : 'Export PDF'}
              >
                <Download className="h-4 w-4" />
              </button>
              {showPdfMenu && (
                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 min-w-[180px]">
                  <button
                    onClick={async () => {
                      setIsExporting(true);
                      setShowPdfMenu(false);
                      try {
                        const { generateTrainingPlanPDF } = await loadTrainingPlanPDF();
                        generateTrainingPlanPDF(plan, language);
                      } finally {
                        setIsExporting(false);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-teal-500" />
                    {language === 'de' ? 'Plan drucken' : 'Print Plan'}
                  </button>
                  <button
                    onClick={async () => {
                      setIsExporting(true);
                      setShowPdfMenu(false);
                      try {
                        const { generateTrainingLogPDF, fetchLastWorkoutsForPlan } = await loadTrainingPlanPDF();
                        // Fetch last workout data per day for Soll/Ist comparison
                        const dayNumbers = (plan.days ?? []).map(d => d.day_number);
                        const lastWorkouts = await fetchLastWorkoutsForPlan(plan.id, dayNumbers);
                        generateTrainingLogPDF(plan, lastWorkouts, language);
                      } catch (err) {
                        console.error('PDF generation failed:', err);
                        // Fallback: generate without last workout data
                        const { generateTrainingLogPDF } = await loadTrainingPlanPDF();
                        generateTrainingLogPDF(plan, undefined, language);
                      } finally {
                        setIsExporting(false);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ClipboardList className="h-4 w-4 text-orange-500" />
                    {language === 'de' ? 'Logbuch drucken (Soll/Ist)' : 'Print Log (Target/Actual)'}
                  </button>
                </div>
              )}
            </div>
            {onDelete && (
              <button
                onClick={() => onDelete(plan.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                title={t.workouts.deletePlan}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mesocycle Review Banner (when review is due) */}
      {mesocycleStatus.hasConfig && mesocycleStatus.reviewDue && plan.ai_supervised && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <BarChart3 className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-indigo-900">
                {language === 'de' ? 'Mesozyklus-Review fällig' : 'Mesocycle Review Due'}
              </h4>
              <p className="text-xs text-indigo-600 mt-0.5">
                {language === 'de'
                  ? `Woche ${mesocycleStatus.currentWeek} von ${mesocycleStatus.totalWeeks} erreicht. Zeit für eine Fortschrittsanalyse.`
                  : `Week ${mesocycleStatus.currentWeek} of ${mesocycleStatus.totalWeeks} reached. Time for a progress review.`}
              </p>
              <button
                onClick={() => setShowReviewDialog(true)}
                className="mt-2 text-xs bg-indigo-500 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-600 transition-colors inline-flex items-center gap-1"
              >
                <BarChart3 className="h-3 w-3" />
                {language === 'de' ? 'Review starten' : 'Start Review'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Trainer Offer Banner (for non-supervised plans) */}
      {aiOffer.shouldOffer && !aiOfferDismissed && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-teal-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-teal-900">
                {language === 'de' ? 'KI-Trainer aktivieren?' : 'Enable AI Trainer?'}
              </h4>
              <p className="text-xs text-teal-600 mt-0.5">
                {language === 'de'
                  ? 'Soll ich diesen Plan als KI-Trainer begleiten? Automatische Gewichtsanpassung, Fortschrittsanalyse und Mesozyklus-Reviews.'
                  : 'Should I coach this plan as AI Trainer? Automatic weight adjustment, progress analysis, and mesocycle reviews.'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => {
                    aiOffer.acceptOffer();
                    setShowCalibration(true);
                  }}
                  disabled={aiOffer.isAccepting}
                  className="text-xs bg-teal-500 text-white px-3 py-1.5 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
                >
                  {language === 'de' ? 'Ja, aktivieren' : 'Yes, enable'}
                </button>
                <button
                  onClick={() => {
                    aiOffer.dismissOffer();
                    setAiOfferDismissed(true);
                  }}
                  className="text-xs text-teal-600 px-3 py-1.5 rounded-lg hover:bg-teal-100 transition-colors"
                >
                  {language === 'de' ? 'Nein, danke' : 'No, thanks'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day Cards */}
      {plan.days?.map((day) => (
        <DayCard
          key={day.id}
          day={day}
          planId={plan.id}
          isExpanded={expandedDays.has(day.day_number)}
          onToggle={() => toggleDay(day.day_number)}
          catalog={catalog ?? []}
          onExerciseClick={setSelectedExercise}
          onEdit={setEditingDay}
          onDelete={() => {/* handled elsewhere */}}
        />
      ))}

      {/* Plan Editor Dialog */}
      {editingDay && (
        <PlanEditorDialog
          day={editingDay}
          onClose={() => setEditingDay(null)}
          onSaved={onPlanEditorSaved}
        />
      )}

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}

      {/* Share Training Plan Dialog */}
      {showShareDialog && (
        <ShareTrainingPlanDialog
          plan={plan}
          onClose={() => setShowShareDialog(false)}
        />
      )}

      {/* Calibration Wizard */}
      {showCalibration && plan && (
        <CalibrationWizard
          plan={plan}
          onComplete={() => setShowCalibration(false)}
          onSkip={() => setShowCalibration(false)}
        />
      )}

      {/* Review Dialog */}
      {showReviewDialog && plan && recentWorkouts && (
        <ReviewDialog
          plan={plan}
          recentWorkouts={recentWorkouts}
          onClose={() => setShowReviewDialog(false)}
        />
      )}
    </div>
  );
}

// DayCard and formatExerciseDetails are now in DayCard.tsx (extracted for reuse)
