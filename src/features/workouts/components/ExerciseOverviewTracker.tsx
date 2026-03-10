/**
 * ExerciseOverviewTracker — Shows ALL sets of an exercise at once.
 * Tabular view with inline-editable rows for reps and weight.
 *
 * UX:
 * - Current set highlighted with teal border/glow
 * - Completed sets show actual values prominently
 * - Empty fields require explicit confirmation or skip
 * - Info hint explains workflow
 * - "Alle Sätze fertig" validates that all inputs are filled
 */

import { useState, useMemo, useCallback } from 'react';
import { Check, ChevronRight, Info, SkipForward, AlertCircle, Lock } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import type { WorkoutExerciseResult, SetTag } from '../../../types/health';

/** Tag display: letter + color */
const TAG_CONFIG: Record<SetTag, { letter: string; bg: string; text: string }> = {
  normal: { letter: '', bg: '', text: '' },
  warmup: { letter: 'W', bg: 'bg-amber-100', text: 'text-amber-700' },
  drop: { letter: 'D', bg: 'bg-purple-100', text: 'text-purple-700' },
  failure: { letter: 'F', bg: 'bg-red-100', text: 'text-red-700' },
};
const TAG_CYCLE: SetTag[] = ['normal', 'warmup', 'drop', 'failure'];

interface ExerciseOverviewTrackerProps {
  exercise: WorkoutExerciseResult;
  exerciseIndex: number;
  lastExercise?: WorkoutExerciseResult;
  onLogSet: (exerciseIdx: number, setIdx: number, reps: number, weightKg?: number) => void;
  onSkipSet: (exerciseIdx: number, setIdx: number) => void;
  onAllDone: () => void;
}

export function ExerciseOverviewTracker(props: ExerciseOverviewTrackerProps) {
  const { exercise, exerciseIndex, lastExercise, onLogSet, onSkipSet, onAllDone } = props;
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { state: workoutState, setTag } = useActiveWorkout();
  const setReady = workoutState.setReady;

  /** Cycle set tag: normal → warmup → drop → failure → normal */
  const cycleTag = useCallback((setIdx: number) => {
    const currentTag = exercise.sets[setIdx]?.set_tag ?? 'normal';
    const nextIdx = (TAG_CYCLE.indexOf(currentTag) + 1) % TAG_CYCLE.length;
    setTag(exerciseIndex, setIdx, TAG_CYCLE[nextIdx]);
  }, [exercise.sets, exerciseIndex, setTag]);

  // Local state for inputs (per-set) — auto-fill: actual > target > PREVIOUS > empty
  const [inputs, setInputs] = useState<Record<number, { reps: string; weight: string }>>(() => {
    const init: Record<number, { reps: string; weight: string }> = {};
    exercise.sets.forEach((s, i) => {
      const prevSet = lastExercise?.sets[i];
      init[i] = {
        reps: s.actual_reps?.toString() ?? '',
        weight: s.actual_weight_kg?.toString()
          ?? s.target_weight_kg?.toString()
          ?? prevSet?.actual_weight_kg?.toString()
          ?? '',
      };
    });
    return init;
  });

  // Track which sets have empty field warnings
  const [emptyWarnings, setEmptyWarnings] = useState<Set<number>>(new Set());

  // Find the first incomplete set (the "current" one)
  const nextSetIndex = useMemo(
    () => exercise.sets.findIndex(s => !s.completed && !s.skipped),
    [exercise.sets],
  );

  const updateInput = (setIdx: number, field: 'reps' | 'weight', value: string) => {
    setInputs(prev => ({
      ...prev,
      [setIdx]: { ...prev[setIdx], [field]: value },
    }));
    // Clear warning when user types
    if (emptyWarnings.has(setIdx)) {
      setEmptyWarnings(prev => {
        const next = new Set(prev);
        next.delete(setIdx);
        return next;
      });
    }
  };

  const handleSetDone = (setIdx: number) => {
    const input = inputs[setIdx];
    const set = exercise.sets[setIdx];

    // Check if reps field is empty — warn the user
    if (!input?.reps?.trim()) {
      setEmptyWarnings(prev => new Set(prev).add(setIdx));
      // Still allow confirmation but with target defaults
    }

    const reps = input?.reps ? parseInt(input.reps) : parseInt(set.target_reps.split('-').pop() ?? '10');
    const weight = input?.weight ? parseFloat(input.weight) : set.target_weight_kg;
    onLogSet(exerciseIndex, setIdx, reps, weight);

    // Clear warning after confirming
    setEmptyWarnings(prev => {
      const next = new Set(prev);
      next.delete(setIdx);
      return next;
    });
  };

  const handleSkipSet = (setIdx: number) => {
    onSkipSet(exerciseIndex, setIdx);
    setEmptyWarnings(prev => {
      const next = new Set(prev);
      next.delete(setIdx);
      return next;
    });
  };

  const allCompleted = exercise.sets.every(s => s.completed || s.skipped);
  const completedCount = exercise.sets.filter(s => s.completed).length;
  const skippedCount = exercise.sets.filter(s => s.skipped).length;

  return (
    <div className="space-y-3">
      {/* Info hint */}
      {!allCompleted && (
        <div className={`flex items-start gap-2 px-3 py-2 rounded-lg ${
          setReady
            ? 'bg-blue-50 border border-blue-100'
            : 'bg-amber-50 border border-amber-100'
        }`}>
          {setReady ? (
            <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
          ) : (
            <Lock className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          )}
          <p className={`text-xs leading-relaxed ${setReady ? 'text-blue-600' : 'text-amber-600'}`}>
            {setReady
              ? (isDE
                  ? `Satz ${nextSetIndex + 1} läuft — trage Wdh und kg ein, dann bestätige mit ✓`
                  : `Set ${nextSetIndex + 1} active — enter reps and weight, then confirm with ✓`)
              : (isDE
                  ? `Drücke oben „Satz ${nextSetIndex + 1} starten" um den Satz zu beginnen`
                  : `Press "Start Set ${nextSetIndex + 1}" above to begin the set`)}
          </p>
        </div>
      )}

      {/* Progress indicator */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-gray-400">
          {isDE ? 'Fortschritt' : 'Progress'}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {exercise.sets.map((s, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  s.completed
                    ? 'bg-teal-500'
                    : s.skipped
                      ? 'bg-gray-300'
                      : i === nextSetIndex
                        ? 'bg-teal-300 ring-2 ring-teal-200 animate-pulse'
                        : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-teal-600">
            {completedCount}/{exercise.sets.length}
            {skippedCount > 0 && (
              <span className="text-gray-400 ml-1">({skippedCount} {isDE ? 'übersp.' : 'skip'})</span>
            )}
          </span>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-1 px-3 text-xs text-gray-400 font-medium border-b border-gray-100 pb-2">
        <div className="col-span-1">#</div>
        <div className="col-span-2">{isDE ? 'Ziel' : 'Target'}</div>
        <div className="col-span-2">{isDE ? 'Vorh.' : 'Prev'}</div>
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
        const isCurrent = idx === nextSetIndex;
        const isFuture = !isDone && !isSkipped && !isCurrent;
        const hasWarning = emptyWarnings.has(idx);
        // Current set inputs are locked until user presses "Satz starten"
        const isLocked = isCurrent && !setReady;
        const isInputDisabled = isSkipped || isLocked || isFuture;

        return (
          <div key={idx} className="space-y-0">
            <div
              className={`grid grid-cols-12 gap-1 items-center px-3 py-2.5 rounded-xl transition-all ${
                isDone
                  ? 'bg-teal-50 border border-teal-200'
                  : isSkipped
                    ? 'bg-gray-50 opacity-40'
                    : isCurrent
                      ? 'bg-teal-50 border-2 border-teal-400 shadow-md shadow-teal-100'
                      : hasWarning
                        ? 'bg-amber-50 border-2 border-amber-300'
                        : 'bg-gray-50/50'
              }`}
            >
              {/* Set Number / Tag (tap to cycle: normal → W → D → F) */}
              <div className="col-span-1">
                {isDone ? (
                  <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </div>
                ) : (() => {
                  const tag = set.set_tag ?? 'normal';
                  const config = TAG_CONFIG[tag];
                  return (
                    <button
                      onClick={() => cycleTag(idx)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        tag !== 'normal'
                          ? `${config.bg} ${config.text}`
                          : isCurrent
                            ? 'text-teal-600 bg-teal-50'
                            : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={isDE ? 'Tippen: Satz-Typ ändern (W/D/F)' : 'Tap: change set type (W/D/F)'}
                    >
                      {tag !== 'normal' ? config.letter : idx + 1}
                    </button>
                  );
                })()}
              </div>

              {/* Target */}
              <div className={`col-span-2 text-xs ${isCurrent ? 'text-teal-700 font-semibold' : isDone ? 'text-gray-400 line-through' : 'text-gray-500'}`}>
                {set.target_reps}{set.target_reps != null && <span className="text-[10px] opacity-70"> {isDE ? 'Wdh' : 'reps'}</span>}
                {set.target_weight_kg != null && (
                  <span className={isCurrent ? 'text-teal-600' : 'text-gray-400'}> @{set.target_weight_kg}<span className="text-[10px] opacity-70"> kg</span></span>
                )}
              </div>

              {/* Last Time */}
              <div className="col-span-2 text-xs text-gray-400">
                {lastSet?.completed
                  ? <>{lastSet.actual_reps}×{lastSet.actual_weight_kg ?? '-'}<span className="text-[10px] opacity-70"> kg</span></>
                  : '-'}
              </div>

              {/* Reps Input / Completed Value */}
              <div className="col-span-3">
                {isDone ? (
                  <div className="w-full px-2 py-2 text-sm text-center rounded-lg bg-teal-100 text-teal-700 font-bold">
                    {set.actual_reps}
                  </div>
                ) : (
                  <input
                    type="number"
                    inputMode="numeric"
                    value={input.reps}
                    onChange={e => updateInput(idx, 'reps', e.target.value)}
                    disabled={isInputDisabled}
                    placeholder={set.target_reps.split('-').pop()}
                    className={`w-full px-2 py-2 text-sm text-center rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:text-gray-400 disabled:bg-gray-100 transition-all ${
                      isCurrent && setReady
                        ? 'border-2 border-teal-300 bg-white font-semibold text-gray-900'
                        : isLocked
                          ? 'border border-gray-200 bg-gray-100 text-gray-400'
                          : hasWarning
                            ? 'border-2 border-amber-400 bg-white text-gray-900'
                            : isFuture
                              ? 'border border-gray-200 bg-gray-50 text-gray-500'
                              : 'border border-gray-200 bg-gray-50'
                    }`}
                  />
                )}
              </div>

              {/* Weight Input / Completed Value */}
              <div className="col-span-3">
                {isDone ? (
                  <div className="w-full px-2 py-2 text-sm text-center rounded-lg bg-teal-100 text-teal-700 font-bold">
                    {set.actual_weight_kg ?? '-'}
                  </div>
                ) : (
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={input.weight}
                    onChange={e => updateInput(idx, 'weight', e.target.value)}
                    disabled={isInputDisabled}
                    placeholder={set.target_weight_kg?.toString() ?? '-'}
                    className={`w-full px-2 py-2 text-sm text-center rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:text-gray-400 disabled:bg-gray-100 transition-all ${
                      isCurrent && setReady
                        ? 'border-2 border-teal-300 bg-white font-semibold text-gray-900'
                        : isLocked
                          ? 'border border-gray-200 bg-gray-100 text-gray-400'
                          : hasWarning
                            ? 'border-2 border-amber-400 bg-white text-gray-900'
                          : isFuture
                            ? 'border border-gray-200 bg-gray-50 text-gray-500'
                            : 'border border-gray-200 bg-gray-50'
                    }`}
                  />
                )}
              </div>

              {/* Action Button */}
              <div className="col-span-1 flex justify-center">
                {isDone ? (
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center" title={`${set.actual_reps} × ${set.actual_weight_kg ?? '-'} kg`}>
                    <Check className="h-4 w-4 text-teal-500" />
                  </div>
                ) : isSkipped ? (
                  <span className="text-xs text-gray-300">—</span>
                ) : isCurrent && isLocked ? (
                  <div
                    className="w-10 h-10 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center cursor-not-allowed"
                    title={isDE ? 'Starte den Satz zuerst' : 'Start the set first'}
                  >
                    <Lock className="h-4 w-4" />
                  </div>
                ) : isCurrent ? (
                  <button
                    onClick={() => handleSetDone(idx)}
                    className="w-10 h-10 rounded-full bg-teal-500 text-white flex items-center justify-center hover:bg-teal-600 active:bg-teal-700 transition-colors shadow-md"
                    title={isDE ? 'Satz bestätigen' : 'Confirm set'}
                  >
                    <Check className="h-5 w-5" strokeWidth={3} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSetDone(idx)}
                    className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center hover:bg-teal-100 hover:text-teal-500 transition-colors"
                    title={isDE ? 'Satz bestätigen' : 'Confirm set'}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Empty field warning + Skip option */}
            {hasWarning && !isDone && !isSkipped && (
              <div className="flex items-center justify-between px-3 py-1.5 bg-amber-50 border border-t-0 border-amber-200 rounded-b-lg -mt-1">
                <div className="flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {isDE ? 'Wdh-Feld leer — Zielwert wird übernommen' : 'Reps empty — target value will be used'}
                </div>
                <button
                  onClick={() => handleSkipSet(idx)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-0.5 rounded"
                >
                  <SkipForward className="h-3 w-3" />
                  {isDE ? 'Skip' : 'Skip'}
                </button>
              </div>
            )}

            {/* Skip button for current set */}
            {isCurrent && !isDone && !isSkipped && !hasWarning && (
              <div className="flex justify-end px-3 pt-1">
                <button
                  onClick={() => handleSkipSet(idx)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-400 transition-colors"
                >
                  <SkipForward className="h-3 w-3" />
                  {isDE ? 'Satz überspringen' : 'Skip set'}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Complete / Next button */}
      {allCompleted ? (
        <div className="space-y-2 pt-2">
          {/* Summary of completed sets */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3">
            <p className="text-xs font-medium text-teal-700 mb-2">
              {isDE ? 'Zusammenfassung:' : 'Summary:'}
            </p>
            <div className="space-y-1">
              {exercise.sets.map((set, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className={`font-medium ${set.completed ? 'text-teal-600' : 'text-gray-400'}`}>
                    {isDE ? 'Satz' : 'Set'} {idx + 1}:
                  </span>
                  {set.completed ? (
                    <span className="text-teal-700 font-semibold">
                      {set.actual_reps} {isDE ? 'Wdh' : 'Reps'}
                      {set.actual_weight_kg != null && ` @ ${set.actual_weight_kg} kg`}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">{isDE ? 'übersprungen' : 'skipped'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={onAllDone}
            className="w-full flex items-center justify-center gap-2 py-3.5 text-sm text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors font-medium shadow-sm"
          >
            <ChevronRight className="h-4 w-4" />
            {isDE ? 'Nächste Übung' : 'Next Exercise'}
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!setReady) return;
              // Log all remaining sets with defaults
              exercise.sets.forEach((s, idx) => {
                if (!s.completed && !s.skipped) {
                  handleSetDone(idx);
                }
              });
            }}
            disabled={!setReady}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm rounded-xl transition-colors font-medium ${
              setReady
                ? 'text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100'
                : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
            }`}
          >
            {setReady ? (
              <Check className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {isDE ? 'Alle Sätze fertig' : 'All Sets Done'}
          </button>
        </div>
      )}
    </div>
  );
}
