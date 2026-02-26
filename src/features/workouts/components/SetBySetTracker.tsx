/**
 * SetBySetTracker — Focuses on ONE set at a time.
 * Shows target, last-time values, input fields for actual reps/weight.
 * "Set done" button logs the set and optionally triggers rest timer.
 */

import { useState, useEffect } from 'react';
import { Check, SkipForward } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { WorkoutExerciseResult } from '../../../types/health';

interface SetBySetTrackerProps {
  exercise: WorkoutExerciseResult;
  exerciseIndex: number;
  currentSetIndex: number;
  lastExercise?: WorkoutExerciseResult;
  onLogSet: (exerciseIdx: number, setIdx: number, reps: number, weightKg?: number, notes?: string) => void;
  onSkipSet: (exerciseIdx: number, setIdx: number) => void;
}

export function SetBySetTracker({
  exercise,
  exerciseIndex,
  currentSetIndex,
  lastExercise,
  onLogSet,
  onSkipSet,
}: SetBySetTrackerProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const currentSet = exercise.sets[currentSetIndex];
  const lastSet = lastExercise?.sets[currentSetIndex];
  const totalSets = exercise.sets.length;

  const [reps, setReps] = useState<string>('');
  const [weight, setWeight] = useState<string>('');

  // Pre-fill weight with target
  useEffect(() => {
    setReps('');
    setWeight(currentSet?.target_weight_kg?.toString() ?? '');
  }, [currentSetIndex, currentSet?.target_weight_kg]);

  if (!currentSet) return null;

  // Parse target reps for default (e.g. "8-10" → use 10)
  const parseTargetReps = (target: string): number => {
    const parts = target.split('-');
    return parseInt(parts[parts.length - 1]) || 10;
  };

  const handleDone = () => {
    const actualReps = reps ? parseInt(reps) : parseTargetReps(currentSet.target_reps);
    const actualWeight = weight ? parseFloat(weight) : currentSet.target_weight_kg;
    onLogSet(exerciseIndex, currentSetIndex, actualReps, actualWeight);
  };

  return (
    <div className="space-y-4">
      {/* Set indicator dots */}
      <div className="flex items-center justify-center gap-2">
        {exercise.sets.map((s, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i === currentSetIndex
                ? 'bg-teal-500 ring-2 ring-teal-200'
                : s.completed
                  ? 'bg-teal-500'
                  : s.skipped
                    ? 'bg-gray-300'
                    : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Set Label */}
      <div className="text-center">
        <span className="text-sm font-medium text-teal-600">
          {isDE ? 'Satz' : 'Set'} {currentSetIndex + 1} / {totalSets}
        </span>
      </div>

      {/* Target */}
      <div className="bg-teal-50 rounded-xl p-4 text-center">
        <p className="text-xs text-teal-600 mb-1">{isDE ? 'Ziel' : 'Target'}</p>
        <p className="text-2xl font-bold text-teal-700">
          {currentSet.target_reps} {isDE ? 'Wdh' : 'Reps'}
        </p>
        {currentSet.target_weight_kg != null && (
          <p className="text-lg font-semibold text-teal-600 mt-0.5">
            @ {currentSet.target_weight_kg} kg
          </p>
        )}
      </div>

      {/* Last Time */}
      {lastSet && lastSet.completed && (
        <div className="bg-gray-50 rounded-lg px-4 py-2 text-center">
          <p className="text-xs text-gray-400 mb-0.5">{isDE ? 'Letztes Mal' : 'Last Time'}</p>
          <p className="text-sm text-gray-600">
            {lastSet.actual_reps} {isDE ? 'Wdh' : 'Reps'}
            {lastSet.actual_weight_kg != null && ` @ ${lastSet.actual_weight_kg} kg`}
          </p>
        </div>
      )}

      {/* Input Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            {isDE ? 'Wiederholungen' : 'Reps'}
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={e => setReps(e.target.value)}
            placeholder={currentSet.target_reps}
            className="w-full px-3 py-3 text-center text-lg font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            {isDE ? 'Gewicht (kg)' : 'Weight (kg)'}
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder={currentSet.target_weight_kg?.toString() ?? '-'}
            className="w-full px-3 py-3 text-center text-lg font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onSkipSet(exerciseIndex, currentSetIndex)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
        >
          <SkipForward className="h-4 w-4" />
          {isDE ? 'Überspringen' : 'Skip'}
        </button>
        <button
          onClick={handleDone}
          className="flex-2 flex items-center justify-center gap-2 py-3 px-6 text-sm text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors font-medium"
        >
          <Check className="h-4 w-4" />
          {isDE ? 'Satz fertig' : 'Set Done'}
        </button>
      </div>
    </div>
  );
}
