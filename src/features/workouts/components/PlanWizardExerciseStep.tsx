/**
 * PlanWizardExerciseStep — Step 2 of the PlanWizard.
 *
 * Shows day tabs/panels with exercise lists. Users can add exercises
 * from the ExercisePicker, reorder with DnD, or let Buddy populate them.
 */

import { useState } from 'react';
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
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  GripVertical,
  Trash2,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { usePlanWizard } from '../context/PlanWizardContext';
import { ExercisePicker } from './ExercisePicker';
import { useTranslation } from '../../../i18n';
import type { PlanExercise, CatalogExercise } from '../../../types/health';

export function PlanWizardExerciseStep() {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const {
    days,
    updateDay,
    addExerciseToDay,
    removeExerciseFromDay,
    reorderExerciseInDay,
  } = usePlanWizard();

  const [activeTab, setActiveTab] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const currentDay = days[activeTab];
  if (!currentDay) return null;

  const exerciseIds = currentDay.exercises.map((_, i) => `ex-${activeTab}-${i}`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = exerciseIds.indexOf(active.id as string);
    const newIndex = exerciseIds.indexOf(over.id as string);
    if (oldIndex >= 0 && newIndex >= 0) {
      reorderExerciseInDay(activeTab, oldIndex, newIndex);
    }
  };

  const handleAddFromCatalog = (catalogEx: CatalogExercise) => {
    const newEx: PlanExercise = {
      name: isDE ? catalogEx.name : (catalogEx.name_en ?? catalogEx.name),
      exercise_id: catalogEx.id,
      exercise_type: catalogEx.category,
      sets: 3,
      reps: catalogEx.is_compound ? '8-10' : '10-12',
    };
    addExerciseToDay(activeTab, newEx);
    setShowPicker(false);
  };

  const handleMultiSelectConfirm = (exercises: CatalogExercise[]) => {
    for (const catalogEx of exercises) {
      const newEx: PlanExercise = {
        name: isDE ? catalogEx.name : (catalogEx.name_en ?? catalogEx.name),
        exercise_id: catalogEx.id,
        exercise_type: catalogEx.category,
        sets: 3,
        reps: catalogEx.is_compound ? '8-10' : '10-12',
      };
      addExerciseToDay(activeTab, newEx);
    }
    setShowPicker(false);
  };

  const handleUpdateExercise = (exIndex: number, field: keyof PlanExercise, value: string | number | undefined) => {
    const updated = { ...currentDay.exercises[exIndex], [field]: value };
    const newExercises = [...currentDay.exercises];
    newExercises[exIndex] = updated;
    updateDay(activeTab, { exercises: newExercises });
  };

  if (showPicker) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => setShowPicker(false)} className="p-1 rounded-full hover:bg-gray-100">
            <ChevronLeft className="h-4 w-4 text-gray-400" />
          </button>
          <h4 className="font-semibold text-gray-900 text-sm flex-1">
            {isDE ? 'Übung hinzufügen' : 'Add Exercise'} — {currentDay.name}
          </h4>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ExercisePicker
            onSelect={handleAddFromCatalog}
            multiSelect
            onMultiSelectConfirm={handleMultiSelectConfirm}
            maxHeight="50vh"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Day Count Header */}
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
          {days.length} {isDE ? (days.length === 1 ? 'Trainingstag' : 'Trainingstage') : (days.length === 1 ? 'Training Day' : 'Training Days')}
        </span>
        <span className="text-[10px] text-gray-400">
          {days.map((d, i) => d.name || `${isDE ? 'Tag' : 'Day'} ${i + 1}`).join(' · ')}
        </span>
      </div>

      {/* Day Tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1 flex-shrink-0">
        {days.map((day, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-lg transition-colors ${
              activeTab === i
                ? 'bg-teal-500 text-white font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {day.name || `${isDE ? 'Tag' : 'Day'} ${i + 1}`}
            {day.exercises.length > 0 && (
              <span className="ml-1 text-[10px] opacity-70">({day.exercises.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Day Name + Focus */}
      <div className="grid grid-cols-2 gap-2 mb-3 flex-shrink-0">
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">
            {isDE ? 'Tag-Name' : 'Day Name'}
          </label>
          <input
            type="text"
            value={currentDay.name}
            onChange={(e) => updateDay(activeTab, { name: e.target.value })}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 mb-0.5 block">
            {isDE ? 'Fokus' : 'Focus'}
          </label>
          <input
            type="text"
            value={currentDay.focus}
            onChange={(e) => updateDay(activeTab, { focus: e.target.value })}
            placeholder={isDE ? 'z.B. Oberkörper' : 'e.g. Upper Body'}
            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>
      </div>

      {/* Exercise List with DnD */}
      <div className="flex-1 overflow-y-auto space-y-1.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={exerciseIds} strategy={verticalListSortingStrategy}>
            {currentDay.exercises.map((ex, idx) => (
              <SortableExerciseRow
                key={exerciseIds[idx]}
                id={exerciseIds[idx]}
                exercise={ex}
                index={idx}
                total={currentDay.exercises.length}
                isDE={isDE}
                onUpdate={(field, value) => handleUpdateExercise(idx, field, value)}
                onRemove={() => removeExerciseFromDay(activeTab, idx)}
                onMoveUp={() => { if (idx > 0) reorderExerciseInDay(activeTab, idx, idx - 1); }}
                onMoveDown={() => { if (idx < currentDay.exercises.length - 1) reorderExerciseInDay(activeTab, idx, idx + 1); }}
              />
            ))}
          </SortableContext>
        </DndContext>

        {currentDay.exercises.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            {isDE ? 'Noch keine Übungen — füge welche hinzu!' : 'No exercises yet — add some!'}
          </p>
        )}
      </div>

      {/* Add Exercise Button */}
      <button
        onClick={() => setShowPicker(true)}
        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 text-sm text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors flex-shrink-0"
      >
        <Plus className="h-4 w-4" />
        {isDE ? 'Übung hinzufügen' : 'Add Exercise'}
      </button>
    </div>
  );
}

// ── Sortable Exercise Row ─────────────────────────────────────────────────────

interface SortableExerciseRowProps {
  id: string;
  exercise: PlanExercise;
  index: number;
  total: number;
  isDE: boolean;
  onUpdate: (field: keyof PlanExercise, value: string | number | undefined) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SortableExerciseRow({ id, exercise, index, total, isDE, onUpdate, onRemove, onMoveUp, onMoveDown }: SortableExerciseRowProps) {
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
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const isStrength = !exercise.exercise_type || exercise.exercise_type === 'strength' || exercise.exercise_type === 'functional';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-1.5 bg-gray-50 rounded-lg px-2 py-2 cursor-grab active:cursor-grabbing touch-none ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      {/* Reorder arrows + grip */}
      <div className="flex flex-col items-center flex-shrink-0 -my-1">
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={index === 0}
          className="p-0.5 text-gray-300 hover:text-teal-500 transition-colors disabled:opacity-20"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <GripVertical className="h-3.5 w-3.5 text-gray-300" />
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={index === total - 1}
          className="p-0.5 text-gray-300 hover:text-teal-500 transition-colors disabled:opacity-20"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Index */}
      <span className="text-xs text-gray-300 w-4 text-right flex-shrink-0">{index + 1}</span>

      {/* Exercise name */}
      <input
        type="text"
        value={exercise.name}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => onUpdate('name', e.target.value)}
        className="flex-1 min-w-0 text-sm font-medium text-gray-800 bg-transparent border-none outline-none focus:ring-0 px-1 cursor-text"
        placeholder={isDE ? 'Übungsname' : 'Exercise name'}
      />

      {/* Sets / Reps / Weight */}
      {isStrength ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <input
            type="number"
            inputMode="numeric"
            value={exercise.sets ?? ''}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate('sets', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-8 text-xs text-center text-gray-600 bg-white border border-gray-200 rounded px-0.5 py-1 cursor-text"
            placeholder="3"
          />
          <span className="text-xs text-gray-300">×</span>
          <input
            type="text"
            value={exercise.reps ?? ''}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate('reps', e.target.value || undefined)}
            className="w-10 text-xs text-center text-gray-600 bg-white border border-gray-200 rounded px-0.5 py-1 cursor-text"
            placeholder="8-10"
          />
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={exercise.weight_kg ?? ''}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate('weight_kg', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="w-12 text-xs text-center text-gray-600 bg-white border border-gray-200 rounded px-0.5 py-1 cursor-text"
            placeholder="kg"
          />
        </div>
      ) : (
        <div className="flex items-center gap-1 flex-shrink-0">
          <input
            type="text"
            value={exercise.duration_minutes ?? ''}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate('duration_minutes', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-10 text-xs text-center text-gray-600 bg-white border border-gray-200 rounded px-0.5 py-1 cursor-text"
            placeholder="min"
          />
          <input
            type="text"
            value={exercise.intensity ?? ''}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate('intensity', e.target.value || undefined)}
            className="w-14 text-xs text-center text-gray-600 bg-white border border-gray-200 rounded px-0.5 py-1 cursor-text"
            placeholder={isDE ? 'Intensität' : 'Intensity'}
          />
        </div>
      )}

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
