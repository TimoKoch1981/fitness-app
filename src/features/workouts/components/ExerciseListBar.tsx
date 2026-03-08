/**
 * ExerciseListBar — Vertical exercise list at the bottom of ActiveWorkoutPage.
 * Shows all exercises in the workout, highlights the current one.
 * Tap to jump to any exercise. Up/Down arrows to reorder (mobile-friendly).
 * Shows completion status (done/skipped/current/pending).
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { Check, SkipForward, Timer, Dumbbell, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import { cn } from '../../../lib/utils';

export function ExerciseListBar() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { state, goToExercise, reorderExercises } = useActiveWorkout();
  const activeRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  const completedCount = useMemo(
    () => state.exercises.filter(e => e.sets.every(s => s.completed || s.skipped)).length,
    [state.exercises],
  );

  // Auto-scroll to current exercise when expanded
  useEffect(() => {
    if (expanded && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [expanded, state.currentExerciseIndex]);

  if (state.phase === 'summary' || state.phase === 'warmup') return null;

  const handleMoveUp = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (idx > 0) reorderExercises(idx, idx - 1);
  };

  const handleMoveDown = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (idx < state.exercises.length - 1) reorderExercises(idx, idx + 1);
  };

  return (
    <div className="bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      {/* Collapsible Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between"
      >
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
          {isDE ? 'Übungen' : 'Exercises'}
          <span className="ml-1 text-gray-300 normal-case tracking-normal">
            — {isDE ? 'tippen zum Wechseln, Pfeile zum Sortieren' : 'tap to switch, arrows to reorder'}
          </span>
        </span>
        <span className="text-[10px] text-gray-400">
          {completedCount}/{state.exercises.length}
        </span>
      </button>

      {/* Compact row (always visible) — shows current exercise + neighbors */}
      {!expanded && (
        <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {state.exercises.map((ex, idx) => {
            const allDone = ex.sets.every(s => s.completed || s.skipped);
            const isCurrent = idx === state.currentExerciseIndex;
            const completedSets = ex.sets.filter(s => s.completed).length;
            return (
              <button
                key={idx}
                onClick={() => goToExercise(idx)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all',
                  isCurrent && 'bg-teal-500 text-white shadow-md',
                  !isCurrent && allDone && 'bg-green-50 text-green-600',
                  !isCurrent && ex.skipped && 'bg-gray-50 text-gray-400 line-through',
                  !isCurrent && !allDone && !ex.skipped && 'bg-gray-50 text-gray-600',
                )}
              >
                {allDone && !isCurrent ? <Check className="h-3 w-3" /> : <Dumbbell className="h-3 w-3" />}
                <span className="max-w-[80px] truncate">{ex.name}</span>
                {!allDone && !ex.skipped && ex.sets.length > 1 && (
                  <span className={cn('text-[9px]', isCurrent ? 'text-teal-100' : 'text-gray-400')}>
                    {completedSets}/{ex.sets.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Expanded vertical list with reorder arrows */}
      {expanded && (
        <div className="max-h-[40vh] overflow-y-auto px-3 pb-2 space-y-1">
          {state.exercises.map((ex, idx) => {
            const allDone = ex.sets.every(s => s.completed || s.skipped);
            const isSkipped = ex.skipped;
            const isCurrent = idx === state.currentExerciseIndex;
            const isCardio = ex.exercise_type === 'cardio' || ex.exercise_type === 'flexibility';
            const completedSets = ex.sets.filter(s => s.completed).length;
            const totalSets = ex.sets.length;

            return (
              <div
                key={idx}
                ref={isCurrent ? activeRef : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg transition-all',
                  isCurrent && 'bg-teal-50 ring-2 ring-teal-400',
                  !isCurrent && allDone && 'bg-green-50/50',
                  !isCurrent && isSkipped && 'opacity-50',
                )}
              >
                {/* Reorder arrows */}
                <div className="flex flex-col flex-shrink-0">
                  <button
                    onClick={(e) => handleMoveUp(idx, e)}
                    disabled={idx === 0}
                    className="p-0.5 text-gray-300 hover:text-teal-500 disabled:opacity-20 disabled:hover:text-gray-300 transition-colors"
                    title={isDE ? 'Nach oben' : 'Move up'}
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleMoveDown(idx, e)}
                    disabled={idx === state.exercises.length - 1}
                    className="p-0.5 text-gray-300 hover:text-teal-500 disabled:opacity-20 disabled:hover:text-gray-300 transition-colors"
                    title={isDE ? 'Nach unten' : 'Move down'}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Exercise row — tap to jump */}
                <button
                  onClick={() => goToExercise(idx)}
                  className="flex-1 flex items-center gap-2 py-2 pr-2 text-left min-w-0"
                >
                  {/* Status icon */}
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                    isCurrent && 'bg-teal-500 text-white',
                    !isCurrent && allDone && 'bg-green-100 text-green-600',
                    !isCurrent && isSkipped && 'bg-gray-100 text-gray-400',
                    !isCurrent && !allDone && !isSkipped && 'bg-gray-100 text-gray-500',
                  )}>
                    {allDone && !isCurrent ? (
                      <Check className="h-3 w-3" />
                    ) : isSkipped && !isCurrent ? (
                      <SkipForward className="h-3 w-3" />
                    ) : isCardio ? (
                      <Timer className="h-3 w-3" />
                    ) : (
                      <span className="text-[10px] font-bold">{idx + 1}</span>
                    )}
                  </div>

                  {/* Exercise name */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-xs font-medium truncate',
                      isCurrent && 'text-teal-700',
                      !isCurrent && allDone && 'text-green-600',
                      !isCurrent && isSkipped && 'text-gray-400 line-through',
                      !isCurrent && !allDone && !isSkipped && 'text-gray-700',
                    )}>
                      {ex.name}
                    </p>
                  </div>

                  {/* Set progress */}
                  <span className={cn(
                    'text-[10px] flex-shrink-0',
                    isCurrent ? 'text-teal-500 font-semibold' : 'text-gray-400',
                  )}>
                    {completedSets}/{totalSets}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
