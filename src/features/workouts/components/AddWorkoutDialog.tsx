/**
 * AddWorkoutDialog — Add a manual workout (quick-log).
 *
 * v2: Uses ExercisePicker for catalog-backed exercise selection,
 * shows exercise details (muscles, compound badge), inline sets/reps/weight,
 * works for ALL workout types (not just strength).
 */

import { useState, useCallback } from 'react';
import { X, Plus, Trash2, ChevronLeft, Dumbbell } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddWorkout } from '../hooks/useWorkouts';
import { ExercisePicker } from './ExercisePicker';
import { getMuscleName } from '../utils/muscleNames';
import { today } from '../../../lib/utils';
import type { WorkoutType, ExerciseSet, CatalogExercise } from '../../../types/health';

interface AddWorkoutDialogProps {
  open: boolean;
  onClose: () => void;
  date?: string;
}

interface SelectedExercise extends ExerciseSet {
  _id: string;
  catalog?: CatalogExercise;
}

export function AddWorkoutDialog({ open, onClose, date }: AddWorkoutDialogProps) {
  const { t, language } = useTranslation();
  const isDE = language === 'de';
  const addWorkout = useAddWorkout();

  const [name, setName] = useState('');
  const [type, setType] = useState<WorkoutType>('strength');
  const [duration, setDuration] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<SelectedExercise[]>([]);
  const [error, setError] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setError('');

    try {
      // Strip internal fields before saving
      const cleanExercises: ExerciseSet[] = exercises
        .filter((ex) => ex.name.trim() !== '')
        .map(({ _id, catalog, ...rest }) => rest);

      await addWorkout.mutateAsync({
        date: date ?? today(),
        name,
        type,
        duration_minutes: duration ? parseInt(duration) : undefined,
        calories_burned: caloriesBurned ? parseInt(caloriesBurned) : undefined,
        exercises: cleanExercises,
        notes: notes || undefined,
      });

      // Reset and close
      setName('');
      setType('strength');
      setDuration('');
      setCaloriesBurned('');
      setNotes('');
      setExercises([]);
      onClose();
    } catch {
      setError(t.common.saveError);
    }
  };

  const workoutTypes: { value: WorkoutType; label: string; emoji: string }[] = [
    { value: 'strength', label: t.workouts.strength, emoji: '🏋️' },
    { value: 'cardio', label: t.workouts.cardio, emoji: '🏃' },
    { value: 'hiit', label: t.workouts.hiit, emoji: '⚡' },
    { value: 'flexibility', label: t.workouts.flexibility, emoji: '🧘' },
    { value: 'sports', label: t.workouts.sports, emoji: '⚽' },
    { value: 'other', label: t.workouts.other, emoji: '🔥' },
  ];

  // ── Exercise Management ──────────────────────────────────────────

  const handleSelectFromCatalog = useCallback((catalogEx: CatalogExercise) => {
    const displayName = isDE ? catalogEx.name : (catalogEx.name_en ?? catalogEx.name);
    const isStrengthType = catalogEx.category === 'strength' || catalogEx.category === 'functional';

    const newEx: SelectedExercise = {
      _id: `ex-${Date.now()}`,
      name: displayName,
      catalog: catalogEx,
      sets: isStrengthType ? 3 : undefined,
      reps: isStrengthType ? (catalogEx.is_compound ? 8 : 12) : undefined,
      duration_minutes: !isStrengthType ? 10 : undefined,
    };

    setExercises((prev) => [...prev, newEx]);
    setShowPicker(false);

    // Auto-set workout name if empty
    if (!name) {
      setName(displayName);
    }
  }, [isDE, name]);

  const handleAddCustom = useCallback(() => {
    const newEx: SelectedExercise = {
      _id: `ex-${Date.now()}`,
      name: '',
      sets: 3,
      reps: 10,
    };
    setExercises((prev) => [...prev, newEx]);
    setShowPicker(false);
  }, []);

  const updateExercise = (id: string, field: keyof ExerciseSet, value: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex._id !== id) return ex;
        if (field === 'name' || field === 'notes') {
          return { ...ex, [field]: value };
        }
        return { ...ex, [field]: value ? parseFloat(value) : undefined };
      }),
    );
  };

  const removeExercise = (id: string) => {
    setExercises((prev) => prev.filter((ex) => ex._id !== id));
  };

  // ── ExercisePicker Sub-View ──────────────────────────────────────

  if (showPicker) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowPicker(false)} />
        <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-xl">
          {/* Header */}
          <div className="sticky top-0 bg-white rounded-t-2xl flex items-center gap-2 px-4 py-3 border-b z-10 flex-shrink-0">
            <button onClick={() => setShowPicker(false)} className="p-1 rounded-full hover:bg-gray-100">
              <ChevronLeft className="h-4 w-4 text-gray-400" />
            </button>
            <h3 className="font-semibold text-gray-900 text-sm flex-1">
              {isDE ? 'Übung auswählen' : 'Select Exercise'}
            </h3>
          </div>

          {/* Picker */}
          <div className="p-4 overflow-y-auto flex-1">
            <ExercisePicker onSelect={handleSelectFromCatalog} maxHeight="55vh" />

            {/* Custom exercise button */}
            <button
              onClick={handleAddCustom}
              className="w-full flex items-center gap-2 px-3 py-2.5 mt-3 text-sm text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {isDE ? 'Eigene Übung eingeben' : 'Enter Custom Exercise'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Dialog ──────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col shadow-xl">
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between px-4 py-3 border-b z-10 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{t.workouts.addWorkout}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Buddy Hint */}
          <p className="text-[11px] text-teal-600 bg-teal-50 rounded-lg px-3 py-2 text-center">
            💡 {isDE
              ? 'Tipp: Sag dem Buddy einfach was du trainiert hast — er loggt es automatisch!'
              : 'Tip: Just tell the Buddy what you trained — it logs automatically!'}
          </p>

          {/* Workout Type Selector */}
          <div className="grid grid-cols-3 gap-2">
            {workoutTypes.map((wt) => (
              <button
                key={wt.value}
                type="button"
                onClick={() => setType(wt.value)}
                className={`py-2 px-2 rounded-lg text-xs font-medium transition-colors ${
                  type === wt.value
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="block text-base mb-0.5">{wt.emoji}</span>
                {wt.label}
              </button>
            ))}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isDE ? 'Bezeichnung' : 'Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'strength' ? 'Push Day' : (type === 'cardio' ? 'Laufen' : 'Workout')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
              required
              autoFocus
            />
          </div>

          {/* Duration & Calories */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.workouts.duration} ({t.workouts.minutes})
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="60"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.workouts.caloriesBurned}
              </label>
              <input
                type="number"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                placeholder={isDE ? 'optional' : 'optional'}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                min="0"
              />
            </div>
          </div>

          {/* Exercises Section — ALL workout types */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Dumbbell className="h-4 w-4 text-teal-500" />
                {t.workouts.exercises}
              </label>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                {isDE ? 'Hinzufügen' : 'Add'}
              </button>
            </div>

            {exercises.length > 0 ? (
              <div className="space-y-2">
                {exercises.map((ex) => (
                  <ExerciseRow
                    key={ex._id}
                    exercise={ex}
                    isDE={isDE}
                    onUpdate={updateExercise}
                    onRemove={removeExercise}
                  />
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-teal-300 hover:text-teal-500 transition-colors"
              >
                {isDE ? 'Übungen aus Katalog wählen...' : 'Choose exercises from catalog...'}
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t.common.notes}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm resize-none"
              rows={2}
              placeholder={isDE ? 'Optional...' : 'Optional...'}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={addWorkout.isPending || !name}
            className="w-full py-3 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 disabled:opacity-50 transition-colors"
          >
            {addWorkout.isPending
              ? (isDE ? 'Speichere...' : 'Saving...')
              : (isDE ? 'Training speichern' : 'Save Workout')
            }
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Exercise Row ───────────────────────────────────────────────────

interface ExerciseRowProps {
  exercise: SelectedExercise;
  isDE: boolean;
  onUpdate: (id: string, field: keyof ExerciseSet, value: string) => void;
  onRemove: (id: string) => void;
}

function ExerciseRow({ exercise, isDE, onUpdate, onRemove }: ExerciseRowProps) {
  const lang = isDE ? 'de' : 'en';
  const hasCatalog = !!exercise.catalog;
  const isStrength =
    !exercise.catalog?.category ||
    exercise.catalog?.category === 'strength' ||
    exercise.catalog?.category === 'functional';

  return (
    <div className="bg-gray-50 rounded-lg p-2.5 space-y-1.5">
      {/* Name row */}
      <div className="flex items-center gap-2">
        {hasCatalog ? (
          <p className="flex-1 text-sm font-medium text-gray-800 truncate">
            {exercise.name}
          </p>
        ) : (
          <input
            type="text"
            value={exercise.name}
            onChange={(e) => onUpdate(exercise._id, 'name', e.target.value)}
            placeholder={isDE ? 'Übungsname' : 'Exercise name'}
            className="flex-1 text-sm font-medium text-gray-800 bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        )}
        <button
          type="button"
          onClick={() => onRemove(exercise._id)}
          className="p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Muscle badges from catalog */}
      {hasCatalog && exercise.catalog!.primary_muscles?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {exercise.catalog!.primary_muscles.slice(0, 3).map((m) => (
            <span
              key={m}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium"
            >
              {getMuscleName(m, lang)}
            </span>
          ))}
          {exercise.catalog!.is_compound && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
              Compound
            </span>
          )}
        </div>
      )}

      {/* Sets / Reps / Weight OR Duration fields */}
      {isStrength || !hasCatalog ? (
        <div className="flex items-center gap-1.5">
          <div className="flex-1">
            <label className="text-[10px] text-gray-400">{isDE ? 'Sätze' : 'Sets'}</label>
            <input
              type="number"
              inputMode="numeric"
              value={exercise.sets ?? ''}
              onChange={(e) => onUpdate(exercise._id, 'sets', e.target.value)}
              className="w-full text-xs text-center text-gray-600 bg-white border border-gray-200 rounded px-1 py-1"
              placeholder="3"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-gray-400">{isDE ? 'Wdh' : 'Reps'}</label>
            <input
              type="number"
              inputMode="numeric"
              value={exercise.reps ?? ''}
              onChange={(e) => onUpdate(exercise._id, 'reps', e.target.value)}
              className="w-full text-xs text-center text-gray-600 bg-white border border-gray-200 rounded px-1 py-1"
              placeholder="10"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-gray-400">kg</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.5"
              value={exercise.weight_kg ?? ''}
              onChange={(e) => onUpdate(exercise._id, 'weight_kg', e.target.value)}
              className="w-full text-xs text-center text-gray-600 bg-white border border-gray-200 rounded px-1 py-1"
              placeholder="—"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <div className="flex-1">
            <label className="text-[10px] text-gray-400">{isDE ? 'Dauer (min)' : 'Duration (min)'}</label>
            <input
              type="number"
              inputMode="numeric"
              value={exercise.duration_minutes ?? ''}
              onChange={(e) => onUpdate(exercise._id, 'duration_minutes', e.target.value)}
              className="w-full text-xs text-center text-gray-600 bg-white border border-gray-200 rounded px-1 py-1"
              placeholder="10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
