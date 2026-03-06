/**
 * SetBySetTracker — Focuses on ONE set at a time.
 * Shows target, last-time values, input fields for actual reps/weight.
 * "Set done" button logs the set and optionally triggers rest timer.
 *
 * UX improvements:
 * - Clear progress indicators with completed/current/remaining dots
 * - Prominent current set label
 * - Large, clearly labeled input fields
 * - Info hint explaining the workflow
 */

import { useState, useEffect } from 'react';
import { Check, SkipForward, Info, ArrowRight } from 'lucide-react';
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
  const completedCount = exercise.sets.filter(s => s.completed).length;

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

  const allDone = exercise.sets.every(s => s.completed || s.skipped);

  return (
    <div className="space-y-4">
      {/* Set progress bar */}
      <div className="flex items-center gap-2">
        {exercise.sets.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full h-2 rounded-full transition-all ${
                i === currentSetIndex
                  ? 'bg-teal-500 ring-2 ring-teal-200'
                  : s.completed
                    ? 'bg-teal-400'
                    : s.skipped
                      ? 'bg-gray-300'
                      : 'bg-gray-200'
              }`}
            />
            <span className={`text-[10px] font-medium ${
              i === currentSetIndex ? 'text-teal-600' : s.completed ? 'text-teal-400' : 'text-gray-300'
            }`}>
              {i + 1}
            </span>
          </div>
        ))}
      </div>

      {/* Current Set Label */}
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold">
          <ArrowRight className="h-3.5 w-3.5" />
          {isDE ? 'Satz' : 'Set'} {currentSetIndex + 1} / {totalSets}
          <span className="text-teal-500 font-normal">
            ({completedCount} {isDE ? 'fertig' : 'done'})
          </span>
        </span>
      </div>

      {/* Target */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-5 text-center">
        <p className="text-xs text-teal-500 uppercase tracking-wider mb-1.5 font-medium">
          {isDE ? 'Ziel' : 'Target'}
        </p>
        <p className="text-3xl font-bold text-teal-700">
          {currentSet.target_reps} <span className="text-xl font-semibold">{isDE ? 'Wdh' : 'Reps'}</span>
        </p>
        {currentSet.target_weight_kg != null && (
          <p className="text-xl font-semibold text-teal-600 mt-1">
            @ {currentSet.target_weight_kg} kg
          </p>
        )}
      </div>

      {/* Last Time */}
      {lastSet && lastSet.completed && (
        <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-center">
          <p className="text-xs text-gray-400 mb-0.5 font-medium">{isDE ? 'Letztes Mal' : 'Last Time'}</p>
          <p className="text-sm font-semibold text-gray-600">
            {lastSet.actual_reps} {isDE ? 'Wdh' : 'Reps'}
            {lastSet.actual_weight_kg != null && ` @ ${lastSet.actual_weight_kg} kg`}
          </p>
        </div>
      )}

      {/* Input Fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">
            {isDE ? 'Wiederholungen' : 'Reps'}
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={e => setReps(e.target.value)}
            placeholder={currentSet.target_reps}
            className="w-full px-3 py-3.5 text-center text-xl font-bold border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 bg-white placeholder:text-gray-300 placeholder:font-normal"
          />
          <p className="text-[10px] text-gray-400 mt-1 text-center">
            {isDE ? 'Leer = Ziel übernehmen' : 'Empty = use target'}
          </p>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block font-medium">
            {isDE ? 'Gewicht (kg)' : 'Weight (kg)'}
          </label>
          <input
            type="number"
            inputMode="decimal"
            step="0.5"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder={currentSet.target_weight_kg?.toString() ?? '-'}
            className="w-full px-3 py-3.5 text-center text-xl font-bold border-2 border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-400 bg-white placeholder:text-gray-300 placeholder:font-normal"
          />
          <p className="text-[10px] text-gray-400 mt-1 text-center">
            {isDE ? 'Leer = Ziel übernehmen' : 'Empty = use target'}
          </p>
        </div>
      </div>

      {/* Info hint (only for first set) */}
      {currentSetIndex === 0 && !allDone && (
        <div className="flex items-start gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
          <Info className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-500 leading-relaxed">
            {isDE
              ? 'Trage deine Werte ein und drücke „Satz fertig". Leere Felder übernehmen automatisch den Zielwert.'
              : 'Enter your values and press "Set Done". Empty fields will use the target value automatically.'}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onSkipSet(exerciseIndex, currentSetIndex)}
          className="flex items-center justify-center gap-2 px-5 py-3.5 text-sm text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
        >
          <SkipForward className="h-4 w-4" />
          {isDE ? 'Skip' : 'Skip'}
        </button>
        <button
          onClick={handleDone}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 text-base text-white bg-teal-500 rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors font-semibold shadow-sm"
        >
          <Check className="h-5 w-5" strokeWidth={3} />
          {isDE ? `Satz ${currentSetIndex + 1} fertig` : `Set ${currentSetIndex + 1} Done`}
        </button>
      </div>
    </div>
  );
}
