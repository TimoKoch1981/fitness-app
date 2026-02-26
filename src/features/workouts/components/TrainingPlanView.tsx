import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Trash2, Dumbbell, Target, Download, FileText, ClipboardList, MessageCircle, Pencil, Share2, Play } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { TrainingPlan, TrainingPlanDay, PlanExercise, CatalogExercise } from '../../../types/health';
import { generateTrainingPlanPDF, generateTrainingLogPDF } from '../utils/generateTrainingPlanPDF';
import { useExerciseCatalog, findExerciseInCatalog } from '../hooks/useExerciseCatalog';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { ShareTrainingPlanDialog } from './ShareTrainingPlanDialog';

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
                    onClick={() => {
                      setIsExporting(true);
                      setShowPdfMenu(false);
                      try {
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
                    onClick={() => {
                      setIsExporting(true);
                      setShowPdfMenu(false);
                      try {
                        generateTrainingLogPDF(plan, undefined, language);
                      } finally {
                        setIsExporting(false);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <ClipboardList className="h-4 w-4 text-orange-500" />
                    {language === 'de' ? 'Logbuch drucken' : 'Print Log'}
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

  const handleStartWorkout = (e: React.MouseEvent) => {
    e.stopPropagation();
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
              className="flex items-center gap-1 px-2.5 py-1 bg-teal-500 text-white text-xs font-medium rounded-lg hover:bg-teal-600 transition-colors"
              title={isDE ? 'Training starten' : 'Start Workout'}
            >
              <Play className="h-3 w-3" />
              {isDE ? 'Start' : 'Start'}
            </span>
          )}
        </div>
      </button>

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
