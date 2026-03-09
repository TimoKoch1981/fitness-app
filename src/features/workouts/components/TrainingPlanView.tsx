import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Trash2, Dumbbell, Target, Download, FileText, ClipboardList, MessageCircle, Pencil, Share2, Play, Sparkles, BarChart3, RotateCcw } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { TrainingPlan, TrainingPlanDay, PlanExercise, CatalogExercise } from '../../../types/health';
// Dynamic import: jsPDF (~800KB) only loaded when user clicks PDF export
const loadTrainingPlanPDF = () => import('../utils/generateTrainingPlanPDF');
import { useExerciseCatalog, findExerciseInCatalog } from '../hooks/useExerciseCatalog';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { ShareTrainingPlanDialog } from './ShareTrainingPlanDialog';
import { CalibrationWizard } from './CalibrationWizard';
import { usePEDPhaseSync } from '../hooks/usePEDPhaseSync';
import { useMesocycleCheck } from '../hooks/useMesocycleCheck';
import { useAISupervisedOffer } from '../hooks/useAISupervisedOffer';
import { useProfile } from '../../auth/hooks/useProfile';
import { ReviewDialog } from './ReviewDialog';
import { useRecentWorkoutsForPlan } from '../hooks/useRecentWorkoutsForPlan';
import { useInProgressWorkout, useAbortDraft } from '../hooks/useDraftWorkout';

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
  const navigate = useNavigate();
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1])); // First day expanded by default
  const [isExporting, setIsExporting] = useState(false);
  const [showPdfMenu, setShowPdfMenu] = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement>(null);
  const { data: catalog } = useExerciseCatalog();
  const [selectedExercise, setSelectedExercise] = useState<CatalogExercise | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);

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

  // Auto-trigger CalibrationWizard for uncalibrated plans
  useEffect(() => {
    if (
      plan &&
      plan.ai_supervised === true &&
      (!plan.review_config || !plan.review_config.calibration_done)
    ) {
      setShowCalibration(true);
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
            {/* Edit via Buddy */}
            <button
              onClick={() => navigate('/buddy', { state: { autoMessage: t.workouts.editViaBuddyAuto } })}
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
        />
      ))}

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

// ── Exercise Format Helper ─────────────────────────────────────────────

/**
 * Format exercise details based on type (strength vs endurance vs flexibility).
 * - Strength: 4×8-10 @ 80kg
 * - Endurance: 30 Min · 4 km · @ 5:30 min/km · (Zone 2)
 * - Flexibility: 10 Min · (moderat)
 * - Fallback: uses heuristic (has duration but no sets → endurance)
 */
function formatExerciseDetails(ex: PlanExercise): React.ReactNode {
  const isEndurance =
    ex.exercise_type === 'cardio' ||
    (ex.duration_minutes != null && ex.sets == null && ex.reps == null);

  const isFlexibility =
    ex.exercise_type === 'flexibility' ||
    (ex.duration_minutes != null && ex.intensity != null && ex.sets == null && ex.distance_km == null);

  if (isEndurance || isFlexibility) {
    const parts: string[] = [];
    if (ex.duration_minutes != null) parts.push(`${ex.duration_minutes} Min`);
    if (ex.distance_km != null) parts.push(`${ex.distance_km} km`);
    if (ex.pace) parts.push(`@ ${ex.pace}`);
    if (ex.intensity) parts.push(`(${ex.intensity})`);
    return <>{parts.join(' · ')}</>;
  }

  // Strength format (default)
  return (
    <>
      {ex.sets != null && ex.reps != null ? `${ex.sets}×${ex.reps}` : ''}
      {ex.weight_kg != null && (
        <span className="text-teal-600 ml-1">@ {ex.weight_kg}kg</span>
      )}
    </>
  );
}

// ── Day Card Component ─────────────────────────────────────────────────

interface DayCardProps {
  day: TrainingPlanDay;
  planId: string;
  isExpanded: boolean;
  onToggle: () => void;
  catalog: CatalogExercise[];
  onExerciseClick: (exercise: CatalogExercise) => void;
}

function DayCard({ day, planId, isExpanded, onToggle, catalog, onExerciseClick }: DayCardProps) {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const isDE = language === 'de';
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  // Check for in-progress (resumable) workout for this day
  const { data: inProgressWorkout } = useInProgressWorkout(day.id);
  const abortDraft = useAbortDraft();

  const handleStartWorkout = (e: React.MouseEvent) => {
    e.stopPropagation();
    // If there's an in-progress workout, show resume dialog
    if (inProgressWorkout) {
      setShowResumeDialog(true);
      return;
    }
    navigate(`/workout/active?planId=${planId}&dayId=${day.id}&dayNumber=${day.day_number}`);
  };

  const handleResume = () => {
    setShowResumeDialog(false);
    navigate(`/workout/active?planId=${planId}&dayId=${day.id}&dayNumber=${day.day_number}&resume=1`);
  };

  const handleStartFresh = async () => {
    setShowResumeDialog(false);
    if (inProgressWorkout) {
      try {
        await abortDraft.mutateAsync(inProgressWorkout.id);
      } catch { /* ignore */ }
    }
    navigate(`/workout/active?planId=${planId}&dayId=${day.id}&dayNumber=${day.day_number}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Day Header — clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-teal-600">
              {t.workouts.dayLabel} {day.day_number}
            </span>
            <span className="font-medium text-gray-900 truncate">{day.name}</span>
            {/* Resume Badge */}
            {inProgressWorkout && (
              <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium animate-pulse">
                {isDE ? 'Pausiert' : 'Paused'}
              </span>
            )}
          </div>
          {day.focus && (
            <div className="flex items-center gap-1 mt-0.5">
              <Target className="h-3 w-3 text-gray-300" />
              <span className="text-xs text-gray-400">{day.focus}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-300">
            {day.exercises.length} {t.workouts.exercises.toLowerCase()}
          </span>
          {day.exercises.length > 0 && (
            <span
              role="button"
              onClick={handleStartWorkout}
              className={`flex items-center gap-1 px-2.5 py-1 text-white text-xs font-medium rounded-lg transition-colors ${
                inProgressWorkout
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-teal-500 hover:bg-teal-600'
              }`}
              title={inProgressWorkout
                ? (isDE ? 'Training fortsetzen' : 'Resume Workout')
                : (isDE ? 'Training starten' : 'Start Workout')}
            >
              {inProgressWorkout ? (
                <><RotateCcw className="h-3 w-3" /> {isDE ? 'Fortsetzen' : 'Resume'}</>
              ) : (
                <><Play className="h-3 w-3" /> {isDE ? 'Start' : 'Start'}</>
              )}
            </span>
          )}
        </div>
      </button>

      {/* Resume Dialog */}
      {showResumeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setShowResumeDialog(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                {isDE ? 'Training fortsetzen?' : 'Resume Workout?'}
              </h3>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              {isDE
                ? 'Es gibt ein unterbrochenes Training für diesen Tag. Möchtest du dort weitermachen oder neu starten?'
                : 'There is a paused workout for this day. Would you like to continue where you left off or start fresh?'}
            </p>
            <div className="space-y-2">
              <button
                onClick={handleResume}
                className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white font-medium rounded-xl hover:bg-orange-600 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                {isDE ? 'Fortsetzen' : 'Resume'}
              </button>
              <button
                onClick={handleStartFresh}
                className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {isDE ? 'Neu starten (altes Training verwerfen)' : 'Start fresh (discard old workout)'}
              </button>
              <button
                onClick={() => setShowResumeDialog(false)}
                className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-500 transition-colors"
              >
                {isDE ? 'Abbrechen' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercises — expandable */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="border-t border-gray-100 pt-3 space-y-2">
            {day.exercises.map((ex, idx) => {
              const catalogEntry = findExerciseInCatalog(ex.name, catalog);
              return (
                <div key={idx} className="flex items-baseline gap-2 text-sm">
                  <span className="text-gray-300 text-xs w-5 text-right flex-shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    {catalogEntry ? (
                      <button
                        onClick={() => onExerciseClick(catalogEntry)}
                        className="text-gray-700 font-medium underline decoration-dotted decoration-teal-400 underline-offset-2 hover:text-teal-600 transition-colors text-left"
                      >
                        {ex.name}
                      </button>
                    ) : (
                      <span className="text-gray-700 font-medium">{ex.name}</span>
                    )}
                    <span className="text-gray-400 ml-2">
                      {formatExerciseDetails(ex)}
                    </span>
                    {ex.notes && (
                      <span className="text-gray-300 ml-2 text-xs">({ex.notes})</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {day.notes && (
            <p className="text-xs text-gray-400 mt-2 italic">{day.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
