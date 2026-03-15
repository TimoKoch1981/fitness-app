/**
 * ExerciseTracker — Wrapper component that manages the current exercise display.
 * Delegates to SetBySetTracker or ExerciseOverviewTracker based on mode.
 * Shows exercise name, info button, navigation, and modify options.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, SkipForward, Video,
  MoreVertical, Trash2, Plus, Info, Clock, Play,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import { useExerciseCatalog, findExerciseInCatalog } from '../hooks/useExerciseCatalog';
import { SetBySetTracker } from './SetBySetTracker';
import { ExerciseOverviewTracker } from './ExerciseOverviewTracker';
import { ExerciseTimer } from './ExerciseTimer';
import { ExerciseVideoModal } from './ExerciseVideoModal';
import { ExerciseModifyDialog } from './ExerciseModifyDialog';
import { AddExerciseDialog } from './AddExerciseDialog';
import { RIRFeedbackDialog } from './RIRFeedbackDialog';
import { suggestRestTime, ISOMETRIC_PATTERNS } from '../utils/suggestRestTimes';
import { useIsFirstSessionForPlan } from '../hooks/useIsFirstSessionForPlan';
import { useLastExerciseData } from '../hooks/useLastExerciseData';
import { useExercisePR } from '../hooks/useExercisePR';

export function ExerciseTracker() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const {
    state, logSet, skipSet, nextExercise, prevExercise,
    skipExercise, goToExercise, markSetReady, editExercise,
  } = useActiveWorkout();

  const { data: catalog } = useExerciseCatalog();
  const [showVideo, setShowVideo] = useState(false);
  const [showModify, setShowModify] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // RIR Feedback state
  const [rirDismissed, setRirDismissed] = useState<Set<number>>(() => new Set());
  const [showRIRDialog, setShowRIRDialog] = useState(false);

  // Check if this is the first session for this plan (RIR only in first session)
  const { data: firstSessionData } = useIsFirstSessionForPlan(state.planId);
  const isFirstSession = firstSessionData?.isFirstSession ?? false;

  // RIR dialog should show when: first session + strength exercise with weight + first set just completed + not dismissed
  const shouldShowRIR = useCallback((exIdx: number) => {
    if (!isFirstSession) return false;
    if (rirDismissed.has(exIdx)) return false;
    const ex = state.exercises[exIdx];
    if (!ex || ex.skipped) return false;
    // Only for strength exercises with weight
    if (!ex.sets[0]?.target_weight_kg) return false;
    // Show after first set is completed
    const firstSet = ex.sets[0];
    return firstSet.completed === true;
  }, [isFirstSession, rirDismissed, state.exercises]);

  const exercise = state.exercises[state.currentExerciseIndex];

  // AI rest time suggestion (must be before early return to satisfy rules-of-hooks)
  const restSuggestion = useMemo(() => {
    if (!exercise) return { restSeconds: 90, warmupMinutes: 5, reason: '', reasonEN: '' };
    return suggestRestTime({
      exerciseName: exercise.name,
      repsTarget: exercise.sets[0]?.target_reps ? Number(exercise.sets[0].target_reps) : undefined,
      durationSeconds: exercise.duration_minutes ? exercise.duration_minutes * 60 : undefined,
      isTimedExercise: exercise.exercise_type === 'flexibility' ||
        (exercise.duration_minutes != null && exercise.duration_minutes > 0 && !exercise.sets[0]?.target_weight_kg),
    });
  }, [exercise]);

  // Cross-plan PREVIOUS data (matches by exercise_id or name, not plan_exercise_index)
  const { data: lastExData } = useLastExerciseData(exercise?.name, exercise?.exercise_id);

  // PR detection — zero extra fetches (uses shared query)
  const prData = useExercisePR(exercise?.name, exercise?.exercise_id);

  if (!exercise) return null;

  const lastExercise = lastExData?.exercise;

  const catalogEntry = catalog ? findExerciseInCatalog(exercise.name, catalog) : null;
  const hasVideo = catalogEntry && (catalogEntry.video_url_de || catalogEntry.video_url_en);

  const allSetsComplete = exercise.sets.every(s => s.completed || s.skipped);

  // Use AI suggestion if no explicit rest_seconds on exercise
  const effectiveRestSeconds = exercise.rest_seconds ?? restSuggestion.restSeconds;

  // Detect exercise categories for adaptive UI (Phase D.2)
  const isCardio = exercise.exercise_type === 'cardio';
  // Isometric detection (Plank, Dead Hang, Wall Sit, L-Sit)
  const isIsometric = ISOMETRIC_PATTERNS.some(p => p.test(exercise.name));
  // Timed exercises use ExerciseTimer (flexibility, isometric holds; cardio uses set trackers with Duration+Distance)
  const isTimedExercise = (
    exercise.exercise_type === 'flexibility' ||
    isIsometric ||
    (!isCardio && exercise.duration_minutes != null && exercise.duration_minutes > 0 && !exercise.sets[0]?.target_weight_kg)
  );

  const handleLogSetAndAdvance = (exIdx: number, setIdx: number, reps: number, weightKg?: number, notes?: string, durationMinutes?: number, distanceKm?: number) => {
    logSet(exIdx, setIdx, reps, weightKg, notes, durationMinutes, distanceKm);

    // RIR feedback: After first set (setIdx===0) → show dialog if conditions met
    if (setIdx === 0 && shouldShowRIR(exIdx)) {
      setShowRIRDialog(true);
    }
  };

  const handleRIRAdjust = (newWeight: number) => {
    const exIdx = state.currentExerciseIndex;
    const ex = state.exercises[exIdx];
    if (!ex) return;

    // Build setOverrides: update target_weight_kg for all non-completed sets
    const overrides = ex.sets.map((s) => ({
      target_weight_kg: s.completed ? (s.actual_weight_kg ?? s.target_weight_kg) : newWeight,
      target_reps: s.target_reps,
    }));
    editExercise(exIdx, { setOverrides: overrides });

    setRirDismissed(prev => new Set(prev).add(exIdx));
    setShowRIRDialog(false);
  };

  const handleRIRDismiss = () => {
    setRirDismissed(prev => new Set(prev).add(state.currentExerciseIndex));
    setShowRIRDialog(false);
  };

  const handleTimedComplete = (actualSeconds: number) => {
    // Mark all sets as completed for timed exercises
    exercise.sets.forEach((_, idx) => {
      if (!exercise.sets[idx].completed) {
        logSet(state.currentExerciseIndex, idx, 1, undefined, `${actualSeconds}s`);
      }
    });
    nextExercise();
  };

  const handleTimedSkip = () => {
    skipExercise(state.currentExerciseIndex);
  };

  return (
    <div className="space-y-4">
      {/* Exercise Header */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{exercise.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isDE ? 'Übung' : 'Exercise'} {state.currentExerciseIndex + 1} / {state.exercises.length}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {/* Video Button */}
            {hasVideo && (
              <button
                onClick={() => setShowVideo(true)}
                className="p-1.5 text-red-400 hover:text-red-500 transition-colors"
                title={isDE ? 'Video-Anleitung' : 'Video Guide'}
              >
                <Video className="h-5 w-5" />
              </button>
            )}
            {/* Info (catalog) */}
            {catalogEntry && !hasVideo && (
              <button
                onClick={() => setShowVideo(true)}
                className="p-1.5 text-gray-400 hover:text-teal-500 transition-colors"
              >
                <Info className="h-5 w-5" />
              </button>
            )}
            {/* More menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-gray-400 hover:text-gray-500 transition-colors"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20 min-w-[180px]">
                  <button
                    onClick={() => { setShowMenu(false); skipExercise(state.currentExerciseIndex); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <SkipForward className="h-4 w-4 text-gray-400" />
                    {isDE ? 'Übung überspringen' : 'Skip Exercise'}
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); setShowModify(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Trash2 className="h-4 w-4 text-gray-400" />
                    {isDE ? 'Übung ändern/entfernen' : 'Modify/Remove'}
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); setShowAdd(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 text-gray-400" />
                    {isDE ? 'Übung hinzufügen' : 'Add Exercise'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exercise info hint — adaptive for cardio vs strength */}
        {isCardio ? (
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
            <span>{exercise.sets.length} {exercise.sets.length === 1 ? (isDE ? 'Intervall' : 'Interval') : (isDE ? 'Intervalle' : 'Intervals')}</span>
            {exercise.duration_minutes != null && (
              <span>{exercise.duration_minutes} Min</span>
            )}
            {exercise.distance_km != null && (
              <span>{exercise.distance_km} km</span>
            )}
            {exercise.pace && <span>{exercise.pace}</span>}
          </div>
        ) : exercise.sets[0]?.target_weight_kg != null && (
          <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
            <span>{exercise.sets.length} {isDE ? 'Sätze' : 'Sets'}</span>
            <span>{exercise.sets[0].target_reps} {isDE ? 'Wdh' : 'Reps'}</span>
            {exercise.sets[0].target_weight_kg && (
              <span>{exercise.sets[0].target_weight_kg} kg</span>
            )}
          </div>
        )}

        {/* AI Rest Time Suggestion Badge */}
        {!isTimedExercise && (
          <div className="mt-2 flex items-center gap-2 px-2.5 py-1.5 bg-teal-50 border border-teal-100 rounded-lg">
            <Clock className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-teal-700">
                {isDE ? 'Empfohlene Pause' : 'Suggested Rest'}: {effectiveRestSeconds}s
              </span>
              <p className="text-[10px] text-teal-500 leading-tight mt-0.5 truncate">
                {isDE ? restSuggestion.reason : restSuggestion.reasonEN}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* "Satz starten" Button — shown when user hasn't started set timer yet */}
      {/* Industry standard: users need time to set up equipment, adjust weights etc. */}
      {!isTimedExercise && !state.setReady && !allSetsComplete && (
        <button
          onClick={markSetReady}
          className="w-full flex items-center justify-center gap-3 py-4 bg-teal-500 text-white rounded-xl shadow-md hover:bg-teal-600 active:bg-teal-700 transition-colors font-semibold text-base"
        >
          <Play className="h-5 w-5" />
          {isDE
            ? `Satz ${state.currentSetIndex + 1} starten`
            : `Start Set ${state.currentSetIndex + 1}`
          }
        </button>
      )}

      {/* Tracker Content (based on mode and exercise type) */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        {isTimedExercise ? (
          <ExerciseTimer
            durationSeconds={(exercise.duration_minutes ?? 1) * 60}
            exerciseName={exercise.name}
            onComplete={handleTimedComplete}
            onSkip={handleTimedSkip}
          />
        ) : state.mode === 'set-by-set' ? (
          <SetBySetTracker
            exercise={exercise}
            exerciseIndex={state.currentExerciseIndex}
            currentSetIndex={state.currentSetIndex}
            lastExercise={lastExercise}
            onLogSet={handleLogSetAndAdvance}
            onSkipSet={skipSet}
            maxWeight={prData.maxWeight}
          />
        ) : (
          <ExerciseOverviewTracker
            exercise={exercise}
            exerciseIndex={state.currentExerciseIndex}
            lastExercise={lastExercise}
            onLogSet={logSet}
            onSkipSet={skipSet}
            onAllDone={nextExercise}
            maxWeight={prData.maxWeight}
          />
        )}
      </div>

      {/* Navigation (visible in set-by-set when all sets done) */}
      {state.mode === 'set-by-set' && allSetsComplete && (
        <div className="flex gap-2">
          {state.currentExerciseIndex > 0 && (
            <button
              onClick={prevExercise}
              className="flex items-center gap-1 px-4 py-2.5 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {isDE ? 'Zurück' : 'Back'}
            </button>
          )}
          <button
            onClick={nextExercise}
            className="flex-1 flex items-center justify-center gap-1 py-2.5 text-sm text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors font-medium"
          >
            {state.currentExerciseIndex < state.exercises.length - 1
              ? (isDE ? 'Nächste Übung' : 'Next Exercise')
              : (isDE ? 'Zusammenfassung' : 'Summary')}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Exercise Navigation Dots */}
      <div className="flex items-center justify-center gap-1.5 py-2">
        {state.exercises.map((ex, i) => (
          <button
            key={i}
            onClick={() => goToExercise(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === state.currentExerciseIndex
                ? 'bg-teal-500 w-4'
                : ex.skipped
                  ? 'bg-gray-300'
                  : ex.sets.every(s => s.completed || s.skipped)
                    ? 'bg-teal-400'
                    : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Video Modal */}
      {showVideo && catalogEntry && (
        <ExerciseVideoModal
          exercise={catalogEntry}
          onClose={() => setShowVideo(false)}
        />
      )}

      {/* Modify Dialog */}
      {showModify && (
        <ExerciseModifyDialog
          exerciseName={exercise.name}
          exerciseIndex={state.currentExerciseIndex}
          onClose={() => setShowModify(false)}
        />
      )}

      {/* Add Exercise Dialog */}
      {showAdd && (
        <AddExerciseDialog onClose={() => setShowAdd(false)} />
      )}

      {/* RIR Feedback Dialog (first session only, after first set) */}
      {showRIRDialog && exercise.sets[0]?.target_weight_kg != null && (
        <RIRFeedbackDialog
          exerciseName={exercise.name}
          currentWeight={exercise.sets[0].actual_weight_kg ?? exercise.sets[0].target_weight_kg}
          onAdjust={handleRIRAdjust}
          onDismiss={handleRIRDismiss}
        />
      )}
    </div>
  );
}
