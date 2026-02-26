/**
 * ExerciseOverviewTracker — Shows ALL sets of an exercise at once.
 * Tabular view with inline-editable rows for reps and weight.
 * Alternative mode to SetBySetTracker.
 */

import { useState } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { WorkoutExerciseResult } from '../../../types/health';

interface ExerciseOverviewTrackerProps {
  exercise: WorkoutExerciseResult;
  exerciseIndex: number;
  lastExercise?: WorkoutExerciseResult;
  onLogSet: (exerciseIdx: number, setIdx: number, reps: number, weightKg?: number) => void;
  onSkipSet: (exerciseIdx: number, setIdx: number) => void;
  onAllDone: () => void;
}

export function ExerciseOverviewTracker(props: ExerciseOverviewTrackerProps) {
  const { exercise, exerciseIndex, lastExercise, onLogSet, onAllDone } = props;
  const { language } = useTranslation();
  const isDE = language === 'de';

  // Local state for inputs (per-set)
  const [inputs, setInputs] = useState<Record<number, { reps: string; weight: string }>>(() => {
    const init: Record<number, { reps: string; weight: string }> = {};
    exercise.sets.forEach((s, i) => {
      init[i] = {
        reps: s.actual_reps?.toString() ?? '',
        weight: s.actual_weight_kg?.toString() ?? s.target_weight_kg?.toString() ?? '',
      };
    });
    return init;
  });

  const updateInput = (setIdx: number, field: 'reps' | 'weight', value: string) => {
    setInputs(prev => ({
      ...prev,
      [setIdx]: { ...prev[setIdx], [field]: value },
    }));
  };

  const handleSetDone = (setIdx: number) => {
    const input = inputs[setIdx];
    const set = exercise.sets[setIdx];
    const reps = input?.reps ? parseInt(input.reps) : parseInt(set.target_reps.split('-').pop() ?? '10');
    const weight = input?.weight ? parseFloat(input.weight) : set.target_weight_kg;
    onLogSet(exerciseIndex, setIdx, reps, weight);
  };

  const allCompleted = exercise.sets.every(s => s.completed || s.skipped);

  return (
    <div className="space-y-3">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-1 px-2 text-xs text-gray-400 font-medium">
        <div className="col-span-1">#</div>
        <div className="col-span-2">{isDE ? 'Ziel' : 'Target'}</div>
        <div className="col-span-2">{isDE ? 'Letzte' : 'Last'}</div>
        <div className="col-span-3">{isDE ? 'Wdh' : 'Reps'}</div>
        <div className="col-span-3">kg</div>
        <div className="col-span-1"></div>
      </div>

      {/* Set Rows */}
      {exercise.sets.map((set, idx) => {
        const lastSet = lastExercise?.sets[idx];
        const input = inputs[idx] ?? { reps: '', weight: '' };
        const isDone = set.completed;
        const isSkipped = set.skipped;

        return (
          <div
            key={idx}
            className={`grid grid-cols-12 gap-1 items-center px-2 py-2 rounded-lg transition-colors ${
              isDone ? 'bg-teal-50' : isSkipped ? 'bg-gray-50 opacity-50' : 'bg-white'
            }`}
          >
            {/* Set Number */}
            <div className="col-span-1 text-sm font-medium text-gray-500">
              {idx + 1}
            </div>

            {/* Target */}
            <div className="col-span-2 text-xs text-gray-500">
              {set.target_reps}
              {set.target_weight_kg != null && (
                <span className="text-teal-600"> @{set.target_weight_kg}</span>
              )}
            </div>

            {/* Last Time */}
            <div className="col-span-2 text-xs text-gray-400">
              {lastSet?.completed
                ? `${lastSet.actual_reps}×${lastSet.actual_weight_kg ?? '-'}`
                : '-'}
            </div>

            {/* Reps Input */}
            <div className="col-span-3">
              <input
                type="number"
                inputMode="numeric"
                value={isDone ? (set.actual_reps?.toString() ?? '') : input.reps}
                onChange={e => updateInput(idx, 'reps', e.target.value)}
                disabled={isDone || isSkipped}
                placeholder={set.target_reps.split('-').pop()}
                className="w-full px-2 py-1.5 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            {/* Weight Input */}
            <div className="col-span-3">
              <input
                type="number"
                inputMode="decimal"
                step="0.5"
                value={isDone ? (set.actual_weight_kg?.toString() ?? '') : input.weight}
                onChange={e => updateInput(idx, 'weight', e.target.value)}
                disabled={isDone || isSkipped}
                placeholder={set.target_weight_kg?.toString() ?? '-'}
                className="w-full px-2 py-1.5 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            {/* Action */}
            <div className="col-span-1 flex justify-center">
              {isDone ? (
                <Check className="h-4 w-4 text-teal-500" />
              ) : isSkipped ? (
                <span className="text-xs text-gray-300">—</span>
              ) : (
                <button
                  onClick={() => handleSetDone(idx)}
                  className="p-1 rounded-full hover:bg-teal-100 transition-colors"
                >
                  <Check className="h-4 w-4 text-gray-400 hover:text-teal-500" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Complete / Next button */}
      {allCompleted ? (
        <button
          onClick={onAllDone}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors font-medium"
        >
          <Check className="h-4 w-4" />
          {isDE ? 'Nächste Übung' : 'Next Exercise'}
        </button>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => {
              // Log all remaining sets with defaults
              exercise.sets.forEach((s, idx) => {
                if (!s.completed && !s.skipped) {
                  handleSetDone(idx);
                }
              });
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 text-sm text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors font-medium"
          >
            <Check className="h-4 w-4" />
            {isDE ? 'Alle Sätze fertig' : 'All Sets Done'}
          </button>
        </div>
      )}
    </div>
  );
}
