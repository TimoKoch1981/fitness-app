/**
 * WorkoutSummary — Shown after finishing a workout session.
 * Displays per-exercise results (target vs actual), duration, calories,
 * weight PRs, and a save button.
 */

import { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2, Clock, Flame, Trophy, TrendingUp,
  Save, Trash2, SkipForward,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import { useSaveWorkoutSession } from '../hooks/useSaveWorkoutSession';
import { calculateSessionCalories } from '../utils/calorieCalculation';
import { useCelebrations } from '../../celebrations/CelebrationProvider';

interface WorkoutSummaryProps {
  weightKg: number;
  onClose: () => void;
}

export function WorkoutSummary({ weightKg, onClose }: WorkoutSummaryProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { state, clearSession } = useActiveWorkout();
  const saveSession = useSaveWorkoutSession();
  const { celebrateNewPR, celebrateFirstWorkoutOfWeek } = useCelebrations();
  const [isSaving, setIsSaving] = useState(false);

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
    try {
      await saveSession.mutateAsync({ session: state, weightKg });
      // Celebrate first workout of the week
      celebrateFirstWorkoutOfWeek();
      clearSession();
      onClose();
    } catch (err) {
      console.error('[WorkoutSummary] Save failed:', err);
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    clearSession();
    onClose();
  };

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

      {/* Per-Exercise Results */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">
          {isDE ? 'Übersicht' : 'Overview'}
        </h3>
        {state.exercises.map((ex, i) => {
          if (ex.skipped) {
            return (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
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

          return (
            <div key={i} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  targetMet ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm text-gray-700 truncate">
                  {ex.is_addition && <span className="text-teal-500 mr-1">+</span>}
                  {ex.name}
                </span>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                {completedSets.length}×{avgReps}
                {maxWeight > 0 && ` @ ${maxWeight}kg`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Actions */}
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
            : (isDE ? 'Training speichern' : 'Save Workout')}
        </button>
      </div>
    </div>
  );
}
