/**
 * WorkoutSummary — Shown after finishing a workout session.
 * Displays per-exercise results (target vs actual), duration, calories,
 * weight PRs, and a save button.
 *
 * Features:
 * - Inline editing of reps/weight per set (tap exercise row to expand)
 * - Visible error feedback on save failure
 * - "Speichern & Beenden" (Save & Exit) button
 * - Auto-progression: updates plan weights when user went higher
 * - Saves session_exercises for "last time" display in next session
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CheckCircle2, Clock, Flame, Trophy, TrendingUp,
  Save, Trash2, SkipForward, ChevronDown, ChevronUp,
  AlertCircle, Edit3, X,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import { useSaveWorkoutSession } from '../hooks/useSaveWorkoutSession';
import { calculateSessionCalories } from '../utils/calorieCalculation';
import { useCelebrations } from '../../celebrations/CelebrationProvider';
import { PostSessionFeedback } from './PostSessionFeedback';
import { useProfile } from '../../auth/hooks/useProfile';

interface WorkoutSummaryProps {
  weightKg: number;
  onClose: () => void;
}

export function WorkoutSummary({ weightKg, onClose }: WorkoutSummaryProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { state, dispatch, clearSession } = useActiveWorkout();
  const saveSession = useSaveWorkoutSession();
  const { celebrateNewPR, celebrateFirstWorkoutOfWeek } = useCelebrations();
  const { data: profile } = useProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [savedWorkoutId, setSavedWorkoutId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    const startTime = new Date(state.startedAt).getTime();
    const endTime = Date.now();
    const durationMin = Math.round((endTime - startTime) / 60000);

    const completed = state.exercises.filter(ex => !ex.skipped);
    const skipped = state.exercises.filter(ex => ex.skipped);
    const additions = state.exercises.filter(ex => ex.is_addition);

    const totalSets = completed.reduce(
      (sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0,
    );

    const calories = calculateSessionCalories(state.exercises, state.warmup, weightKg, durationMin);

    // Find PRs (weight increases vs target)
    const prs: { name: string; weight: number; targetWeight: number }[] = [];
    for (const ex of completed) {
      for (const set of ex.sets) {
        if (set.completed && set.actual_weight_kg != null && set.target_weight_kg != null) {
          if (set.actual_weight_kg > set.target_weight_kg) {
            const existing = prs.find(p => p.name === ex.name);
            if (!existing || set.actual_weight_kg > existing.weight) {
              const idx = prs.findIndex(p => p.name === ex.name);
              const pr = { name: ex.name, weight: set.actual_weight_kg, targetWeight: set.target_weight_kg };
              if (idx >= 0) prs[idx] = pr; else prs.push(pr);
            }
          }
        }
      }
    }

    return { durationMin, completed, skipped, additions, totalSets, calories, prs };
  }, [state, weightKg]);

  // Trigger celebrations for PRs when summary is shown
  useEffect(() => {
    if (stats.prs.length > 0) {
      for (const pr of stats.prs) {
        celebrateNewPR(pr.name, pr.weight, pr.targetWeight);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only once on mount

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const workout = await saveSession.mutateAsync({ session: state, weightKg });
      celebrateFirstWorkoutOfWeek();

      // Show post-session feedback if ai_trainer_enabled
      if (profile?.ai_trainer_enabled && workout?.id) {
        setSavedWorkoutId(workout.id);
        setShowFeedback(true);
        return; // Don't close yet — show feedback first
      }

      clearSession();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[WorkoutSummary] Save failed:', err);
      setSaveError(msg);
      setIsSaving(false);
    }
  };

  const handleFeedbackComplete = () => {
    clearSession();
    onClose();
  };

  const handleDiscard = () => {
    clearSession();
    onClose();
  };

  // Inline editing: update a set's actual values
  const updateSetValue = useCallback((exIdx: number, setIdx: number, field: 'reps' | 'weight', value: string) => {
    const exercises = [...state.exercises];
    const ex = { ...exercises[exIdx] };
    const sets = [...ex.sets];
    const set = { ...sets[setIdx] };

    if (field === 'reps') {
      set.actual_reps = value ? parseInt(value) : undefined;
    } else {
      set.actual_weight_kg = value ? parseFloat(value) : undefined;
    }

    sets[setIdx] = set;
    ex.sets = sets;
    exercises[exIdx] = ex;

    dispatch({ type: 'REPLACE_EXERCISES', exercises });
  }, [state.exercises, dispatch]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-gray-900">
          {isDE ? 'Training abgeschlossen!' : 'Workout Complete!'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">{state.planDayName}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl shadow-sm p-3 text-center">
          <Clock className="h-5 w-5 text-teal-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{stats.durationMin}</p>
          <p className="text-xs text-gray-400">Min</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 text-center">
          <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{stats.calories}</p>
          <p className="text-xs text-gray-400">kcal</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 text-center">
          <TrendingUp className="h-5 w-5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{stats.totalSets}</p>
          <p className="text-xs text-gray-400">{isDE ? 'Sätze' : 'Sets'}</p>
        </div>
      </div>

      {/* Warmup */}
      {state.warmup && (
        <div className="bg-orange-50 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-orange-700">
              {isDE ? 'Aufwärmen' : 'Warm-up'}
            </p>
            <p className="text-xs text-orange-600">{state.warmup.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-orange-700">{state.warmup.duration_minutes} Min</p>
            <p className="text-xs text-orange-600">{state.warmup.calories_burned} kcal</p>
          </div>
        </div>
      )}

      {/* PRs */}
      {stats.prs.length > 0 && (
        <div className="bg-yellow-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-700">
              {isDE ? 'Neue Bestleistungen!' : 'New Personal Records!'}
            </span>
          </div>
          {stats.prs.map((pr, i) => (
            <p key={i} className="text-sm text-yellow-700">
              {pr.name}: {pr.targetWeight}kg → <strong>{pr.weight}kg</strong> (+{pr.weight - pr.targetWeight}kg)
            </p>
          ))}
        </div>
      )}

      {/* Per-Exercise Results — tap to expand & edit */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {isDE ? 'Übersicht' : 'Overview'}
          </h3>
          <span className="text-[10px] text-gray-400">
            {isDE ? 'Antippen zum Bearbeiten' : 'Tap to edit'}
          </span>
        </div>
        {state.exercises.map((ex, exIdx) => {
          if (ex.skipped) {
            return (
              <div key={exIdx} className="flex items-center gap-2 text-sm text-gray-300 py-1">
                <SkipForward className="h-3 w-3" />
                <span className="line-through">{ex.name}</span>
                <span className="text-xs">({isDE ? 'übersprungen' : 'skipped'})</span>
              </div>
            );
          }

          const completedSets = ex.sets.filter(s => s.completed);
          const avgReps = completedSets.length > 0
            ? Math.round(completedSets.reduce((s, set) => s + (set.actual_reps ?? 0), 0) / completedSets.length)
            : 0;
          const maxWeight = completedSets.length > 0
            ? Math.max(...completedSets.map(s => s.actual_weight_kg ?? 0))
            : 0;

          const targetMet = completedSets.every(s => {
            const targetMin = parseInt(s.target_reps.split('-')[0]) || 0;
            return (s.actual_reps ?? 0) >= targetMin;
          });

          const isExpanded = expandedExercise === exIdx;

          return (
            <div key={exIdx} className="border border-gray-100 rounded-lg overflow-hidden">
              {/* Exercise Row — clickable to expand */}
              <button
                onClick={() => setExpandedExercise(isExpanded ? null : exIdx)}
                className="w-full flex items-center justify-between py-2.5 px-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    targetMet ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-gray-700 truncate">
                    {ex.is_addition && <span className="text-teal-500 mr-1">+</span>}
                    {ex.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs text-gray-400">
                    {completedSets.length}×{avgReps}
                    {maxWeight > 0 && ` @ ${maxWeight}kg`}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded: editable set rows */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 space-y-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Edit3 className="h-3 w-3 text-teal-500" />
                    <span className="text-[10px] text-teal-600 font-medium">
                      {isDE ? 'Werte korrigieren (Wdh / kg):' : 'Correct values (reps / kg):'}
                    </span>
                  </div>
                  {ex.sets.map((set, setIdx) => (
                    <div key={setIdx} className="flex items-center gap-2">
                      <span className={`text-xs font-medium w-14 ${
                        set.completed ? 'text-teal-600' : set.skipped ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {isDE ? 'Satz' : 'Set'} {setIdx + 1}
                      </span>
                      {set.completed ? (
                        <>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={set.actual_reps ?? ''}
                            onChange={e => updateSetValue(exIdx, setIdx, 'reps', e.target.value)}
                            className="w-16 px-2 py-1.5 text-sm text-center rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder={isDE ? 'Wdh' : 'Reps'}
                          />
                          <span className="text-xs text-gray-400">×</span>
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.5"
                            value={set.actual_weight_kg ?? ''}
                            onChange={e => updateSetValue(exIdx, setIdx, 'weight', e.target.value)}
                            className="w-20 px-2 py-1.5 text-sm text-center rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="kg"
                          />
                          <span className="text-[10px] text-gray-400">kg</span>
                        </>
                      ) : set.skipped ? (
                        <span className="text-xs text-gray-400 italic">
                          {isDE ? 'übersprungen' : 'skipped'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error feedback */}
      {saveError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-700">
              {isDE ? 'Speichern fehlgeschlagen' : 'Save failed'}
            </p>
            <p className="text-xs text-red-600 mt-0.5 break-words">{saveError}</p>
          </div>
          <button
            onClick={() => setSaveError(null)}
            className="text-red-400 hover:text-red-600 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Post-Session Feedback (shown after save, if KI-Trainer enabled) */}
      {showFeedback && savedWorkoutId && (
        <PostSessionFeedback
          workoutId={savedWorkoutId}
          completionRate={
            state.exercises.length > 0
              ? state.exercises.filter(ex => !ex.skipped).length / state.exercises.length
              : 1
          }
          exercisesSkipped={state.exercises.filter(ex => ex.skipped).map(ex => ex.name)}
          onComplete={handleFeedbackComplete}
          onSkip={handleFeedbackComplete}
        />
      )}

      {/* Actions (hidden when feedback is showing) */}
      {!showFeedback && (
        <div className="flex gap-2 pb-8">
          <button
            onClick={handleDiscard}
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            {isDE ? 'Verwerfen' : 'Discard'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors font-medium disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving
              ? (isDE ? 'Speichern...' : 'Saving...')
              : (isDE ? 'Speichern & Beenden' : 'Save & Exit')}
          </button>
        </div>
      )}
    </div>
  );
}
