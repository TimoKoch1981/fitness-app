/**
 * ExerciseListBar — Vertical exercise list at the bottom of ActiveWorkoutPage.
 * Shows all exercises in the workout, highlights the current one.
 * Tap to jump to any exercise. Drag & Drop to reorder (mobile-friendly).
 * Shows completion status (done/skipped/current/pending).
 */

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Check, SkipForward, Timer, Dumbbell, GripVertical, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from '../../../i18n';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import { cn } from '../../../lib/utils';
import { detectSupersets, getSupersetLabel } from '../utils/supersetDetector';

// ── Sortable Exercise Item ──────────────────────────────────────────

interface SortableExerciseItemProps {
  id: string;
  idx: number;
  name: string;
  isCurrent: boolean;
  allDone: boolean;
  isSkipped: boolean;
  isCardio: boolean;
  completedSets: number;
  totalSets: number;
  onJump: (idx: number) => void;
  isDE: boolean;
  totalExercises: number;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  /** Superset label and position, if part of a superset */
  supersetInfo?: { label: string; position: 'first' | 'middle' | 'last' | 'only' } | null;
}

function SortableExerciseItem({
  id,
  idx,
  name,
  isCurrent,
  allDone,
  isSkipped,
  isCardio,
  completedSets,
  totalSets,
  onJump,
  totalExercises,
  onMoveUp,
  onMoveDown,
  supersetInfo,
}: SortableExerciseItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-1 pl-1 rounded-lg transition-colors cursor-grab active:cursor-grabbing touch-none',
        isCurrent && 'bg-teal-50 ring-2 ring-teal-400',
        !isCurrent && allDone && 'bg-green-50/50',
        !isCurrent && isSkipped && 'opacity-50',
        isDragging && 'shadow-lg bg-white ring-2 ring-teal-300',
      )}
    >
      {/* Reorder arrows — horizontal, large tap targets */}
      <div className="flex items-center flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(idx); }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={idx === 0}
          className="p-1.5 text-gray-400 hover:text-teal-500 active:bg-teal-50 rounded transition-colors disabled:opacity-20 disabled:hover:text-gray-400"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(idx); }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={idx === totalExercises - 1}
          className="p-1.5 text-gray-400 hover:text-teal-500 active:bg-teal-50 rounded transition-colors disabled:opacity-20 disabled:hover:text-gray-400"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>

      {/* Grip icon — visual drag cue */}
      <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />

      {/* Exercise row — tap to jump (no onPointerDown stopPropagation so DnD works on text area) */}
      <button
        onClick={(e) => { e.stopPropagation(); onJump(idx); }}
        className="flex-1 flex items-center gap-2 py-2 pr-2 text-left min-w-0 cursor-pointer"
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

        {/* Superset badge */}
        {supersetInfo && (
          <span className={cn(
            'text-[9px] font-bold px-1 py-0.5 rounded flex-shrink-0',
            'bg-purple-100 text-purple-700',
            supersetInfo.position === 'first' && 'rounded-b-none',
            supersetInfo.position === 'last' && 'rounded-t-none',
          )}>
            {supersetInfo.label}{supersetInfo.position === 'first' ? '1' : supersetInfo.position === 'last' ? '2' : ''}
          </span>
        )}

        {/* Exercise name */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-xs font-medium truncate',
            isCurrent && 'text-teal-700',
            !isCurrent && allDone && 'text-green-600',
            !isCurrent && isSkipped && 'text-gray-400 line-through',
            !isCurrent && !allDone && !isSkipped && 'text-gray-700',
          )}>
            {name}
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
}

// ── Main Component ──────────────────────────────────────────────────

export function ExerciseListBar() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { state, goToExercise, reorderExercises } = useActiveWorkout();
  const activeRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(true);

  const completedCount = useMemo(
    () => state.exercises.filter(e => e.sets.every(s => s.completed || s.skipped)).length,
    [state.exercises],
  );

  // Detect superset groupings from exercise notes
  const supersetGroups = useMemo(
    () => detectSupersets(state.exercises),
    [state.exercises],
  );

  // Stable exercise IDs for dnd-kit (index-based since exercises don't have unique IDs)
  const exerciseIds = useMemo(
    () => state.exercises.map((_, idx) => `exercise-${idx}`),
    [state.exercises],
  );

  // DnD sensors: pointer (desktop) + touch (mobile) with activation distance to avoid accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleMoveUp = useCallback((idx: number) => {
    if (idx > 0) reorderExercises(idx, idx - 1);
  }, [reorderExercises]);

  const handleMoveDown = useCallback((idx: number) => {
    if (idx < state.exercises.length - 1) reorderExercises(idx, idx + 1);
  }, [reorderExercises, state.exercises.length]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = exerciseIds.indexOf(active.id as string);
    const newIndex = exerciseIds.indexOf(over.id as string);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderExercises(oldIndex, newIndex);
    }
  }, [exerciseIds, reorderExercises]);

  // Auto-scroll to current exercise when expanded
  useEffect(() => {
    if (expanded && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [expanded, state.currentExerciseIndex]);

  if (state.phase === 'summary' || state.phase === 'warmup') return null;

  return (
    <div className="bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      {/* Collapsible Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between"
      >
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
          <ChevronRight className={cn('h-4 w-4 text-teal-500 transition-transform', expanded && 'rotate-90')} />
          {isDE ? 'Übungen' : 'Exercises'}
          <span className="ml-1 text-[11px] text-gray-400 normal-case tracking-normal font-normal">
            — {isDE ? 'tippen zum Wechseln, ziehen zum Sortieren' : 'tap to switch, drag to reorder'}
          </span>
        </span>
        <span className="text-xs font-semibold text-teal-600">
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

      {/* Expanded vertical list with Drag & Drop */}
      {expanded && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={exerciseIds} strategy={verticalListSortingStrategy}>
            <div className="max-h-[40vh] overflow-y-auto px-3 pb-2 space-y-1">
              {state.exercises.map((ex, idx) => {
                const allDone = ex.sets.every(s => s.completed || s.skipped);
                const isSkipped = ex.skipped ?? false;
                const isCurrent = idx === state.currentExerciseIndex;
                const isCardio = ex.exercise_type === 'cardio' || ex.exercise_type === 'flexibility';
                const completedSets = ex.sets.filter(s => s.completed).length;
                const totalSets = ex.sets.length;

                return (
                  <div key={exerciseIds[idx]} ref={isCurrent ? activeRef : undefined}>
                    <SortableExerciseItem
                      id={exerciseIds[idx]}
                      idx={idx}
                      name={ex.name}
                      isCurrent={isCurrent}
                      allDone={allDone}
                      isSkipped={isSkipped}
                      isCardio={isCardio}
                      completedSets={completedSets}
                      totalSets={totalSets}
                      onJump={goToExercise}
                      isDE={isDE}
                      totalExercises={state.exercises.length}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      supersetInfo={getSupersetLabel(supersetGroups, idx)}
                    />
                  </div>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
