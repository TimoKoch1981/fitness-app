/**
 * DayCard — Expandable card for a training plan day.
 * Shows day header with expand/collapse, exercises list, start/resume workout buttons.
 * Extracted from TrainingPlanView for reuse in accordion plan list.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Play, Target, Pencil, RotateCcw } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { TrainingPlanDay, PlanExercise, CatalogExercise } from '../../../types/health';
import { findExerciseInCatalog } from '../hooks/useExerciseCatalog';
import { useInProgressWorkout, useAbortDraft } from '../hooks/useDraftWorkout';

// ── Exercise Format Helper ─────────────────────────────────────────────

/**
 * Format exercise details based on type (strength vs endurance vs flexibility).
 * - Strength: 4×8-10 @ 80kg
 * - Endurance: 30 Min · 4 km · @ 5:30 min/km · (Zone 2)
 * - Flexibility: 10 Min · (moderat)
 * - Fallback: uses heuristic (has duration but no sets → endurance)
 */
export function formatExerciseDetails(ex: PlanExercise): React.ReactNode {
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

export interface DayCardProps {
  day: TrainingPlanDay;
  planId: string;
  isExpanded: boolean;
  onToggle: () => void;
  catalog: CatalogExercise[];
  onExerciseClick: (exercise: CatalogExercise) => void;
  onEdit: (day: TrainingPlanDay) => void;
}

export function DayCard({ day, planId, isExpanded, onToggle, catalog, onExerciseClick, onEdit }: DayCardProps) {
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
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onEdit(day); }}
            className="p-1 text-gray-300 hover:text-teal-500 transition-colors"
            title={isDE ? 'Tag bearbeiten' : 'Edit day'}
          >
            <Pencil className="h-3.5 w-3.5" />
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
