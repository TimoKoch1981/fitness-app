/**
 * PlanEditorDialog — Inline edit exercises within a training plan day.
 *
 * Features:
 * - Drag & drop reordering (@dnd-kit)
 * - Inline edit: name, sets, reps, weight, notes
 * - Add exercises from ExercisePicker
 * - Remove exercises with swipe or delete button
 * - Save changes to training_plan_days in DB
 */

import { useState, useCallback } from 'react';
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
import { X, Plus, GripVertical, Trash2, Save, ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { supabase } from '../../../lib/supabase';
import { ExercisePicker } from './ExercisePicker';
import type { TrainingPlanDay, PlanExercise, CatalogExercise } from '../../../types/health';

// ── Types ───────────────────────────────────────────────────────────────

interface PlanEditorDialogProps {
  day: TrainingPlanDay;
  onClose: () => void;
  onSaved?: () => void;
}

interface EditablePlanExercise extends PlanExercise {
  _id: string; // Temporary ID for DnD
}

// ── Main Component ──────────────────────────────────────────────────────

export function PlanEditorDialog({ day, onClose, onSaved }: PlanEditorDialogProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const [exercises, setExercises] = useState<EditablePlanExercise[]>(
    day.exercises.map((ex, i) => ({ ...ex, _id: `ex-${i}` }))
  );
  const [dayName, setDayName] = useState(day.name);
  const [dayFocus, setDayFocus] = useState(day.focus ?? '');
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const markChanged = useCallback(() => setHasChanges(true), []);

  // ── DnD Handler ───────────────────────────────────────────────────────

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setExercises((items) => {
      const oldIndex = items.findIndex((i) => i._id === active.id);
      const newIndex = items.findIndex((i) => i._id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
    markChanged();
  };

  // ── Exercise CRUD ─────────────────────────────────────────────────────

  const handleAddFromCatalog = (catalogEx: CatalogExercise) => {
    const newEx: EditablePlanExercise = {
      _id: `ex-${Date.now()}`,
      name: isDE ? catalogEx.name : (catalogEx.name_en ?? catalogEx.name),
      exercise_id: catalogEx.id,
      exercise_type: catalogEx.category,
      sets: 3,
      reps: catalogEx.is_compound ? '8-10' : '10-12',
    };
    setExercises((prev) => [...prev, newEx]);
    setShowPicker(false);
    markChanged();
  };

  const handleRemove = (id: string) => {
    setExercises((prev) => prev.filter((ex) => ex._id !== id));
    markChanged();
  };

  const handleUpdate = (id: string, field: keyof PlanExercise, value: string | number | undefined) => {
    setExercises((prev) =>
      prev.map((ex) => (ex._id === id ? { ...ex, [field]: value } : ex)),
    );
    markChanged();
  };

  const handleMoveUp = (id: string) => {
    setExercises((prev) => {
      const idx = prev.findIndex((e) => e._id === id);
      if (idx <= 0) return prev;
      return arrayMove(prev, idx, idx - 1);
    });
    markChanged();
  };

  const handleMoveDown = (id: string) => {
    setExercises((prev) => {
      const idx = prev.findIndex((e) => e._id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      return arrayMove(prev, idx, idx + 1);
    });
    markChanged();
  };

  // ── Save ──────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      // Remove _id before saving
      const cleanExercises: PlanExercise[] = exercises.map(({ _id, ...rest }) => rest);

      const { error } = await supabase
        .from('training_plan_days')
        .update({
          name: dayName,
          focus: dayFocus || null,
          exercises: cleanExercises,
        })
        .eq('id', day.id);

      if (error) throw error;
      setHasChanges(false);
      onSaved?.();
      onClose();
    } catch (err) {
      console.error('[PlanEditor] Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────

  if (showPicker) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <div className="absolute inset-0 bg-black/30" onClick={() => setShowPicker(false)} />
        <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-hidden flex flex-col">
          <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-4 py-3 flex items-center gap-2 z-10">
            <button onClick={() => setShowPicker(false)} className="p-1 rounded-full hover:bg-gray-100">
              <ChevronLeft className="h-4 w-4 text-gray-400" />
            </button>
            <h3 className="font-semibold text-gray-900 text-sm flex-1">
              {isDE ? 'Übung hinzufügen' : 'Add Exercise'}
            </h3>
          </div>
          <div className="p-4 overflow-y-auto flex-1">
            <ExercisePicker onSelect={handleAddFromCatalog} maxHeight="60vh" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10 flex-shrink-0">
          <h3 className="font-semibold text-gray-900 text-sm">
            {isDE ? 'Plan bearbeiten' : 'Edit Plan'} — {isDE ? 'Tag' : 'Day'} {day.day_number}
          </h3>
          <div className="flex items-center gap-1">
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50"
              >
                <Save className="h-3 w-3" />
                {saving ? '...' : (isDE ? 'Speichern' : 'Save')}
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Day Name + Focus */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">{isDE ? 'Tag-Name' : 'Day Name'}</label>
              <input
                type="text"
                value={dayName}
                onChange={(e) => { setDayName(e.target.value); markChanged(); }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">{isDE ? 'Fokus' : 'Focus'}</label>
              <input
                type="text"
                value={dayFocus}
                onChange={(e) => { setDayFocus(e.target.value); markChanged(); }}
                placeholder={isDE ? 'z.B. Oberkörper' : 'e.g. Upper Body'}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Exercise List */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={exercises.map((e) => e._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5">
                {exercises.map((ex, idx) => (
                  <SortableExerciseRow
                    key={ex._id}
                    exercise={ex}
                    index={idx}
                    total={exercises.length}
                    isDE={isDE}
                    onUpdate={handleUpdate}
                    onRemove={handleRemove}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {exercises.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              {isDE ? 'Noch keine Übungen — füge welche hinzu!' : 'No exercises yet — add some!'}
            </p>
          )}

          {/* Add Exercise Button */}
          <button
            onClick={() => setShowPicker(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {isDE ? 'Übung hinzufügen' : 'Add Exercise'}
          </button>
        </div>

        {/* Footer Save */}
        {hasChanges && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors font-medium disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving
                ? (isDE ? 'Speichere...' : 'Saving...')
                : (isDE ? 'Änderungen speichern' : 'Save Changes')
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sortable Exercise Row ───────────────────────────────────────────────

interface SortableExerciseRowProps {
  exercise: EditablePlanExercise;
  index: number;
  total: number;
  isDE: boolean;
  onUpdate: (id: string, field: keyof PlanExercise, value: string | number | undefined) => void;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

function SortableExerciseRow({ exercise, index, total, isDE, onUpdate, onRemove, onMoveUp, onMoveDown }: SortableExerciseRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise._id });

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
          onClick={(e) => { e.stopPropagation(); onMoveUp(exercise._id); }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={index === 0}
          className="p-0.5 text-gray-300 hover:text-teal-500 transition-colors disabled:opacity-20 disabled:hover:text-gray-300"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <GripVertical className="h-3.5 w-3.5 text-gray-300" />
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown(exercise._id); }}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={index === total - 1}
          className="p-0.5 text-gray-300 hover:text-teal-500 transition-colors disabled:opacity-20 disabled:hover:text-gray-300"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Index */}
      <span className="text-xs text-gray-300 w-4 text-right flex-shrink-0">
        {index + 1}
      </span>

      {/* Exercise name */}
      <input
        type="text"
        value={exercise.name}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onChange={(e) => onUpdate(exercise._id, 'name', e.target.value)}
        className="flex-1 min-w-0 text-sm font-medium text-gray-800 bg-transparent border-none outline-none focus:ring-0 px-1 cursor-text"
        placeholder={isDE ? 'Übungsname' : 'Exercise name'}
      />

      {/* Sets / Reps / Weight — only for strength */}
      {isStrength ? (
        <div className="flex items-center gap-1 flex-shrink-0">
          <input
            type="number"
            inputMode="numeric"
            value={exercise.sets ?? ''}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate(exercise._id, 'sets', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-8 text-xs text-center text-gray-600 bg-white border border-gray-200 rounded px-0.5 py-1 cursor-text"
            placeholder="3"
          />
          <span className="text-xs text-gray-300">×</span>
          <input
            type="text"
            value={exercise.reps ?? ''}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate(exercise._id, 'reps', e.target.value || undefined)}
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
            onChange={(e) => onUpdate(exercise._id, 'weight_kg', e.target.value ? parseFloat(e.target.value) : undefined)}
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
            onChange={(e) => onUpdate(exercise._id, 'duration_minutes', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-10 text-xs text-center text-gray-600 bg-white border border-gray-200 rounded px-0.5 py-1 cursor-text"
            placeholder="min"
          />
          <input
            type="text"
            value={exercise.intensity ?? ''}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => onUpdate(exercise._id, 'intensity', e.target.value || undefined)}
            className="w-14 text-xs text-center text-gray-600 bg-white border border-gray-200 rounded px-0.5 py-1 cursor-text"
            placeholder={isDE ? 'Intensität' : 'Intensity'}
          />
        </div>
      )}

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(exercise._id); }}
        onPointerDown={(e) => e.stopPropagation()}
        className="p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
