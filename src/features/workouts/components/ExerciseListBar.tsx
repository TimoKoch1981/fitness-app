/**
 * ExerciseListBar — Scrollable horizontal exercise list at the bottom of ActiveWorkoutPage.
 * Shows all exercises in the workout, highlights the current one.
 * Tap to jump to any exercise. Drag & Drop to reorder exercises.
 * Shows completion status (done/skipped/current/pending).
 */

import { useRef, useEffect, useMemo, useCallback } from 'react';
import { Check, SkipForward, Timer, Dumbbell } from 'lucide-react';
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
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from '../../../i18n';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import { cn } from '../../../lib/utils';
import type { WorkoutExerciseResult } from '../../../types/health';

// ── Sortable Exercise Chip ─────────────────────────────────────────────

interface SortableChipProps {
  exercise: WorkoutExerciseResult;
  idx: number;
  sortId: string;
  isCurrent: boolean;
  activeRef: React.RefObject<HTMLButtonElement | null>;
  onJump: (idx: number) => void;
}

function SortableExerciseChip({ exercise: ex, idx, sortId, isCurrent, activeRef, onJump }: SortableChipProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortId });

  const allDone = ex.sets.every(s => s.completed || s.skipped);
  const isSkipped = ex.skipped;
  const isCardio = ex.exercise_type === 'cardio' || ex.exercise_type === 'flexibility';
  const completedSets = ex.sets.filter(s => s.completed).length;
  const totalSets = ex.sets.length;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  // The entire chip is the drag handle AND click target.
  // PointerSensor (distance: 8) and TouchSensor (delay: 250ms) differentiate
  // tap (→ jump to exercise) from drag (→ reorder).
  // onPointerUp fires for taps (sensor didn't activate); for drag the sensor
  // captures the pointer so onPointerUp doesn't fire.
  const handleTap = useCallback((e: React.PointerEvent) => {
    // Only handle primary button taps that are NOT drags
    if (isDragging) return;
    e.preventDefault();
    onJump(idx);
  }, [isDragging, onJump, idx]);

  return (
    <button
      ref={(node) => {
        setNodeRef(node);
        if (isCurrent && activeRef) {
          (activeRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }
      }}
      style={style}
      {...attributes}
      {...listeners}
      onPointerUp={handleTap}
      className={cn(
        'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
        'touch-none select-none cursor-grab active:cursor-grabbing',
        isCurrent && 'bg-teal-500 text-white shadow-md scale-105',
        !isCurrent && allDone && 'bg-green-50 text-green-600 border border-green-200',
        !isCurrent && isSkipped && 'bg-gray-50 text-gray-400 line-through',
        !isCurrent && !allDone && !isSkipped && 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-teal-300 hover:text-teal-600',
        isDragging && 'ring-2 ring-teal-400 shadow-lg',
      )}
    >
      {/* Status icon */}
      {allDone && !isCurrent ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : isSkipped && !isCurrent ? (
        <SkipForward className="h-3 w-3" />
      ) : isCardio ? (
        <Timer className="h-3 w-3" />
      ) : (
        <Dumbbell className="h-3 w-3" />
      )}

      {/* Exercise name (truncated) */}
      <span className="max-w-[100px] truncate">
        {ex.name}
      </span>

      {/* Set progress (only for strength exercises not yet done) */}
      {!isCardio && !allDone && !isSkipped && totalSets > 1 && (
        <span className={cn(
          'text-[9px] ml-0.5',
          isCurrent ? 'text-teal-100' : 'text-gray-400',
        )}>
          {completedSets}/{totalSets}
        </span>
      )}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export function ExerciseListBar() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { state, goToExercise, reorderExercises } = useActiveWorkout();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // DnD sensors — pointer (mouse) + touch with activation constraints
  // Higher thresholds so short taps are reliably detected as "jump" not "drag".
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
  );

  // Stable sortable IDs based on exercise name + original index
  // This ensures IDs survive reorders (not just positional indices)
  const sortableIds = useMemo(
    () => state.exercises.map((ex, i) => `ex-${ex.plan_exercise_index}-${i}-${ex.name}`),
    [state.exercises],
  );

  // Auto-scroll to current exercise
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [state.currentExerciseIndex]);

  if (state.phase === 'summary' || state.phase === 'warmup') return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = sortableIds.indexOf(active.id as string);
    const toIndex = sortableIds.indexOf(over.id as string);

    if (fromIndex !== -1 && toIndex !== -1) {
      reorderExercises(fromIndex, toIndex);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="px-3 pt-2 pb-1 flex items-center justify-between">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          {isDE ? 'Übungen' : 'Exercises'}
          <span className="ml-1 text-gray-300 normal-case tracking-normal">
            — {isDE ? 'halten & ziehen zum Umsortieren' : 'hold & drag to reorder'}
          </span>
        </span>
        <span className="text-[10px] text-gray-400">
          {state.exercises.filter(e => e.sets.every(s => s.completed || s.skipped)).length}/{state.exercises.length}
        </span>
      </div>

      {/* Scrollable exercise chips with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortableIds}
          strategy={horizontalListSortingStrategy}
        >
          <div
            ref={scrollRef}
            className="flex gap-1 overflow-x-auto px-3 pb-2 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {state.exercises.map((ex, idx) => (
              <SortableExerciseChip
                key={sortableIds[idx]}
                sortId={sortableIds[idx]}
                exercise={ex}
                idx={idx}
                isCurrent={idx === state.currentExerciseIndex}
                activeRef={activeRef}
                onJump={goToExercise}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
