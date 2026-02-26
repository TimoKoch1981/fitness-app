/**
 * ActiveWorkoutPage — Main page for a live workout session.
 * Guides the user through warm-up → exercises → summary.
 * Uses ActiveWorkoutContext for state management.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Timer, Play, LayoutList, Clock, CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import { useActivePlan } from '../hooks/useTrainingPlans';
import { useLastWorkoutForDay } from '../hooks/useLastWorkoutForDay';
import { useLatestBodyMeasurement } from '../../body/hooks/useBodyMeasurements';
import { WarmupCard } from './WarmupCard';
import { ExerciseTracker } from './ExerciseTracker';
import { RestTimer } from './RestTimer';
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
    state, startSession, logWarmup, skipWarmup,
    nextExercise, toggleMode, toggleTimer,
    setTimerSeconds, finishSession, clearSession,
  } = useActiveWorkout();

  const { data: latestBody } = useLatestBodyMeasurement();
  const { data: activePlan } = useActivePlan();

  const planId = searchParams.get('planId') ?? '';
  const dayId = searchParams.get('dayId') ?? '';
  const dayNumber = parseInt(searchParams.get('dayNumber') ?? '0');

  const { data: lastWorkout } = useLastWorkoutForDay(planId, dayNumber);

  // Confirm-leave dialog
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  // Elapsed time
  const [elapsed, setElapsed] = useState(0);

  // Start session if not already active
  useEffect(() => {
    if (state.isActive && state.planDayId === dayId) return; // already running
    if (!activePlan?.days) return;

    const planDay = activePlan.days.find(d => d.id === dayId);
    if (!planDay) return;

    const lastResults = lastWorkout?.session_exercises as WorkoutExerciseResult[] | undefined;
    startSession(planDay, planId, lastResults);
  }, [activePlan, dayId, planId, lastWorkout, state.isActive, state.planDayId, startSession]);

  // Elapsed timer
  useEffect(() => {
    if (!state.isActive || !state.startedAt) return;

    const interval = setInterval(() => {
      const ms = Date.now() - new Date(state.startedAt).getTime();
      setElapsed(Math.floor(ms / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isActive, state.startedAt]);

  const elapsedStr = useMemo(() => {
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [elapsed]);

  // Progress
  const totalExercises = state.exercises.length;
  const completedExercises = state.exercises.filter(
    ex => ex.skipped || ex.sets.every(s => s.completed || s.skipped),
  ).length;
  const progressPct = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  const userWeight = latestBody?.weight_kg ?? 80;

  const handleLeave = () => {
    if (state.isActive && state.phase !== 'summary') {
      setShowLeaveDialog(true);
    } else {
      clearSession();
      navigate('/tracking');
    }
  };

  const confirmLeave = () => {
    clearSession();
    navigate('/tracking');
  };

  // No plan/day params or plan loaded without matching day → show message
  if (!state.isActive && !state.startedAt) {
    if (!dayId || !planId || (activePlan && !activePlan.days?.find(d => d.id === dayId))) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-6">
          <p className="text-gray-500 text-center">
            {isDE ? 'Kein Trainingsplan ausgewählt. Starte ein Training über deinen Trainingsplan.' : 'No training plan selected. Start a workout from your training plan.'}
          </p>
          <button
            onClick={() => navigate('/tracking')}
            className="px-6 py-2.5 bg-teal-500 text-white rounded-xl font-medium hover:bg-teal-600 transition-colors"
          >
            {isDE ? 'Zurück zum Tracking' : 'Back to Tracking'}
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
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  {elapsedStr}
                </span>
                <span className="text-xs text-gray-400">
                  {completedExercises}/{totalExercises}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Timer Toggle */}
              <button
                onClick={toggleTimer}
                className={`p-1.5 rounded-full transition-colors ${
                  state.timerEnabled ? 'text-teal-500 bg-teal-50' : 'text-gray-300'
                }`}
                title={isDE ? 'Pause-Timer' : 'Rest Timer'}
              >
                <Timer className="h-4 w-4" />
              </button>
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
          <RestTimer
            seconds={
              // Use per-exercise rest_seconds if available, otherwise global timerSeconds
              state.exercises[state.currentExerciseIndex]?.rest_seconds ?? state.timerSeconds
            }
            onComplete={() => {
              // Stay on same exercise if sets remain, else auto-advance
              const ex = state.exercises[state.currentExerciseIndex];
              const allDone = ex?.sets.every(s => s.completed || s.skipped);
              if (allDone) {
                nextExercise();
              } else {
                // Go back to exercise phase for next set
                // Dispatch is available through context but we use a workaround
                // The SET_PHASE action is handled in the tracker
              }
            }}
            onSkip={() => {
              const ex = state.exercises[state.currentExerciseIndex];
              const allDone = ex?.sets.every(s => s.completed || s.skipped);
              if (allDone) {
                nextExercise();
              }
            }}
            onAdjust={setTimerSeconds}
          />
        )}

        {state.phase === 'summary' && (
          <WorkoutSummary
            weightKg={userWeight}
            onClose={() => {
              clearSession();
              navigate('/tracking');
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
