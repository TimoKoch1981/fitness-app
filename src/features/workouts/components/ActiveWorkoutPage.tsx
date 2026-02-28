/**
 * ActiveWorkoutPage — Main page for a live workout session.
 * Guides the user through warm-up → exercises → summary.
 * Uses ActiveWorkoutContext for state management.
 * Integrates the multi-section WorkoutTimerPanel (v11.0).
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Play, LayoutList, CheckCircle2, SkipForward,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import { useActivePlan } from '../hooks/useTrainingPlans';
import { useLastWorkoutForDay } from '../hooks/useLastWorkoutForDay';
import { useLatestBodyMeasurement } from '../../body/hooks/useBodyMeasurements';
import { useWorkoutTimers } from '../hooks/useWorkoutTimers';
import { WarmupCard } from './WarmupCard';
import { ExerciseTracker } from './ExerciseTracker';
import { WorkoutTimerPanel } from './WorkoutTimerPanel';
import { WorkoutSummary } from './WorkoutSummary';
import { WorkoutMusicPlayer } from './WorkoutMusicPlayer';
import { WorkoutVoiceControl } from './WorkoutVoiceControl';
import type { WorkoutExerciseResult } from '../../../types/health';

export function ActiveWorkoutPage() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    state, dispatch,
    startSession, logWarmup, skipWarmup,
    nextExercise, toggleMode,
    finishSession, clearSession,
  } = useActiveWorkout();

  const { data: latestBody } = useLatestBodyMeasurement();
  const { data: activePlan } = useActivePlan();

  const planId = searchParams.get('planId') ?? '';
  const dayId = searchParams.get('dayId') ?? '';
  const dayNumber = parseInt(searchParams.get('dayNumber') ?? '0');

  const { data: lastWorkout } = useLastWorkoutForDay(planId, dayNumber);

  // ── Multi-Timer Hook ────────────────────────────────────────────────────
  const timers = useWorkoutTimers();

  // Confirm-leave dialog
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Track previous phase + exercise index for auto-timer transitions
  const prevPhaseRef = useRef(state.phase);
  const prevExerciseIdxRef = useRef(state.currentExerciseIndex);
  const prevSetIdxRef = useRef(state.currentSetIndex);

  // Start session if not already active
  useEffect(() => {
    if (state.isActive && state.planDayId === dayId) return; // already running
    if (!activePlan?.days) return;

    const planDay = activePlan.days.find(d => d.id === dayId);
    if (!planDay) return;

    const lastResults = lastWorkout?.session_exercises as WorkoutExerciseResult[] | undefined;
    startSession(planDay, planId, lastResults);
  }, [activePlan, dayId, planId, lastWorkout, state.isActive, state.planDayId, startSession]);

  // ── Start total timer when session becomes active ──────────────────────
  useEffect(() => {
    if (state.isActive && state.phase !== 'summary') {
      timers.startSection('total');
    } else {
      timers.pauseSection('total');
    }
  }, [state.isActive, state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-timer transitions on phase / exercise / set changes ───────────
  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    const prevExIdx = prevExerciseIdxRef.current;
    const prevSetIdx = prevSetIdxRef.current;

    // Exercise changed → reset exercise timer
    if (state.currentExerciseIndex !== prevExIdx && state.phase === 'exercise') {
      const restSec = state.exercises[state.currentExerciseIndex]?.rest_seconds;
      timers.startExerciseTimer(restSec);
    }

    // Phase changed to 'rest' → start set rest timer
    if (state.phase === 'rest' && prevPhase !== 'rest') {
      const ex = state.exercises[state.currentExerciseIndex];
      const restSec = ex?.rest_seconds ?? state.timerSeconds;
      timers.startSetRest(restSec);
    }

    // Phase changed to 'exercise' from 'rest' → start set timer
    if (state.phase === 'exercise' && prevPhase === 'rest') {
      timers.startSetTimer();
    }

    // Phase changed to 'exercise' from 'warmup' → start exercise + set timer
    if (state.phase === 'exercise' && prevPhase === 'warmup') {
      timers.startExerciseTimer();
      timers.startSetTimer();
    }

    // Set changed within same exercise → start set timer
    if (
      state.currentSetIndex !== prevSetIdx &&
      state.currentExerciseIndex === prevExIdx &&
      state.phase === 'exercise'
    ) {
      timers.startSetTimer();
    }

    prevPhaseRef.current = state.phase;
    prevExerciseIdxRef.current = state.currentExerciseIndex;
    prevSetIdxRef.current = state.currentSetIndex;
  }, [state.phase, state.currentExerciseIndex, state.currentSetIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-advance: when setRest countdown finishes → return to exercise ─
  useEffect(() => {
    const setRest = timers.state.sections.setRest;
    if (
      setRest.mode === 'countdown' &&
      setRest.enabled &&
      !setRest.isRunning &&
      setRest.elapsedSeconds >= setRest.targetSeconds &&
      setRest.elapsedSeconds > 0 &&
      state.phase === 'rest' &&
      timers.state.autoAdvance
    ) {
      // Check if all sets are done → next exercise, else → back to exercise phase
      const ex = state.exercises[state.currentExerciseIndex];
      const allDone = ex?.sets.every(s => s.completed || s.skipped);
      if (allDone) {
        nextExercise();
      } else {
        dispatch({ type: 'SET_PHASE', phase: 'exercise' });
      }
    }
  }, [timers.state.sections.setRest, timers.state.autoAdvance, state.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Progress
  const totalExercises = state.exercises.length;
  const completedExercises = state.exercises.filter(
    ex => ex.skipped || ex.sets.every(s => s.completed || s.skipped),
  ).length;
  const progressPct = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  const userWeight = latestBody?.weight_kg ?? 80;

  const handleLeave = useCallback(() => {
    if (state.isActive && state.phase !== 'summary') {
      setShowLeaveDialog(true);
    } else {
      clearSession();
      navigate('/training');
    }
  }, [state.isActive, state.phase, clearSession, navigate]);

  const confirmLeave = useCallback(() => {
    clearSession();
    navigate('/training');
  }, [clearSession, navigate]);

  const handleSkipRest = useCallback(() => {
    const ex = state.exercises[state.currentExerciseIndex];
    const allDone = ex?.sets.every(s => s.completed || s.skipped);
    timers.resetSection('setRest');
    if (allDone) {
      nextExercise();
    } else {
      dispatch({ type: 'SET_PHASE', phase: 'exercise' });
    }
  }, [state.exercises, state.currentExerciseIndex, timers, nextExercise, dispatch]);

  // Elapsed time from total timer
  const totalElapsed = timers.state.sections.total.elapsedSeconds;
  const elapsedStr = useMemo(() => {
    const m = Math.floor(totalElapsed / 60);
    const s = totalElapsed % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [totalElapsed]);

  // Rest countdown remaining
  const setRestSection = timers.state.sections.setRest;
  const restRemaining = Math.max(0, setRestSection.targetSeconds - setRestSection.elapsedSeconds);
  const restMin = Math.floor(restRemaining / 60);
  const restSec = restRemaining % 60;
  const restStr = `${restMin}:${restSec.toString().padStart(2, '0')}`;
  const restProgress = setRestSection.targetSeconds > 0
    ? (setRestSection.elapsedSeconds / setRestSection.targetSeconds) * 100
    : 100;

  // No plan/day params or plan loaded without matching day → show message
  if (!state.isActive && !state.startedAt) {
    if (!dayId || !planId || (activePlan && !activePlan.days?.find(d => d.id === dayId))) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6">
          <p className="text-gray-500 text-center">
            {isDE ? 'Kein Trainingsplan ausgewählt. Starte ein Training über deinen Trainingsplan.' : 'No training plan selected. Start a workout from your training plan.'}
          </p>
          <button
            onClick={() => navigate('/training')}
            className="px-6 py-2.5 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors"
          >
            {isDE ? 'Zurück zum Training' : 'Back to Training'}
          </button>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-30">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={handleLeave} className="p-1 -ml-1">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="text-center flex-1 mx-4">
              <h1 className="text-sm font-semibold text-gray-900 truncate">
                {state.planDayName}
              </h1>
              <div className="flex items-center justify-center gap-3 mt-0.5">
                <span className="text-xs text-gray-400 font-mono tabular-nums">
                  {elapsedStr}
                </span>
                <span className="text-xs text-gray-400">
                  {completedExercises}/{totalExercises}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Mode Toggle */}
              <button
                onClick={toggleMode}
                className="p-1.5 text-gray-400 hover:text-teal-500 transition-colors"
                title={state.mode === 'set-by-set'
                  ? (isDE ? 'Übungsansicht' : 'Exercise View')
                  : (isDE ? 'Satz-für-Satz' : 'Set by Set')}
              >
                {state.mode === 'set-by-set'
                  ? <LayoutList className="h-4 w-4" />
                  : <Play className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Timer Panel (inline, below header) */}
        {state.phase !== 'summary' && state.phase !== 'warmup' && (
          <div className="px-4 pb-3">
            <WorkoutTimerPanel
              state={timers.state}
              onToggleSectionEnabled={timers.toggleSectionEnabled}
              onSetTarget={timers.setTarget}
              onToggleGlobal={timers.toggleGlobal}
              onToggleAutoAdvance={timers.toggleAutoAdvance}
              onSetAlertMode={timers.setAlertMode}
            />
          </div>
        )}
      </div>

      {/* Content based on phase */}
      <div className="px-4 pt-4">
        {state.phase === 'warmup' && (
          <WarmupCard
            weightKg={userWeight}
            onSave={logWarmup}
            onSkip={skipWarmup}
          />
        )}

        {state.phase === 'exercise' && (
          <ExerciseTracker
            lastWorkout={lastWorkout}
          />
        )}

        {state.phase === 'rest' && (
          <div className="flex flex-col items-center py-8">
            {/* Compact rest countdown (replaces old circular RestTimer) */}
            <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-xs shadow-lg text-center">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">
                {isDE ? 'Satzpause' : 'Set Rest'}
              </p>

              {/* Large countdown display */}
              <div className="text-5xl font-bold font-mono tabular-nums text-teal-400 mb-4">
                {restStr}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mb-5">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${Math.min(100, restProgress)}%` }}
                />
              </div>

              {/* Skip button */}
              <button
                onClick={handleSkipRest}
                className="flex items-center justify-center gap-2 mx-auto px-6 py-2.5 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors text-sm font-medium"
              >
                <SkipForward className="h-4 w-4" />
                {isDE ? 'Überspringen' : 'Skip'}
              </button>

              {/* Auto-advance indicator */}
              {timers.state.autoAdvance && (
                <p className="text-[10px] text-gray-500 mt-3">
                  {isDE ? 'Automatisch weiter nach Ablauf' : 'Auto-advance when done'}
                </p>
              )}
            </div>
          </div>
        )}

        {state.phase === 'summary' && (
          <WorkoutSummary
            weightKg={userWeight}
            onClose={() => {
              clearSession();
              navigate('/training');
            }}
          />
        )}
      </div>

      {/* Floating Controls: Voice + Music */}
      {state.phase !== 'summary' && (
        <div className="fixed bottom-24 right-4 z-20 flex flex-col items-end gap-3">
          <WorkoutVoiceControl />
          <WorkoutMusicPlayer />
        </div>
      )}

      {/* Floating Finish Button (during exercise phase) */}
      {(state.phase === 'exercise' || state.phase === 'rest') && (
        <div className="fixed bottom-6 left-4 right-4 z-20">
          <button
            onClick={finishSession}
            className="w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white font-medium rounded-xl shadow-lg hover:bg-green-600 transition-colors"
          >
            <CheckCircle2 className="h-5 w-5" />
            {isDE ? 'Training beenden' : 'Finish Workout'}
          </button>
        </div>
      )}

      {/* Leave Confirmation Dialog */}
      {showLeaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowLeaveDialog(false)} />
          <div className="relative bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold text-gray-900">
              {isDE ? 'Training abbrechen?' : 'Cancel Workout?'}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              {isDE
                ? 'Dein Fortschritt geht verloren. Möchtest du wirklich abbrechen?'
                : 'Your progress will be lost. Are you sure you want to leave?'}
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowLeaveDialog(false)}
                className="flex-1 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {isDE ? 'Weitermachen' : 'Continue'}
              </button>
              <button
                onClick={confirmLeave}
                className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {isDE ? 'Abbrechen' : 'Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
