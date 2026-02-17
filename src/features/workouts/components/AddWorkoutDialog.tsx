import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddWorkout } from '../hooks/useWorkouts';
import { today } from '../../../lib/utils';
import type { WorkoutType, ExerciseSet } from '../../../types/health';

interface AddWorkoutDialogProps {
  open: boolean;
  onClose: () => void;
  date?: string;
}

export function AddWorkoutDialog({ open, onClose, date }: AddWorkoutDialogProps) {
  const { t } = useTranslation();
  const addWorkout = useAddWorkout();

  const [name, setName] = useState('');
  const [type, setType] = useState<WorkoutType>('strength');
  const [duration, setDuration] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<ExerciseSet[]>([]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await addWorkout.mutateAsync({
      date: date ?? today(),
      name,
      type,
      duration_minutes: duration ? parseInt(duration) : undefined,
      calories_burned: caloriesBurned ? parseInt(caloriesBurned) : undefined,
      exercises: exercises.filter((ex) => ex.name.trim() !== ''),
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
  };

  const workoutTypes: { value: WorkoutType; label: string; emoji: string }[] = [
    { value: 'strength', label: t.workouts.strength, emoji: '🏋️' },
    { value: 'cardio', label: t.workouts.cardio, emoji: '🏃' },
    { value: 'hiit', label: t.workouts.hiit, emoji: '⚡' },
    { value: 'flexibility', label: t.workouts.flexibility, emoji: '🧘' },
    { value: 'sports', label: t.workouts.sports, emoji: '⚽' },
    { value: 'other', label: t.workouts.other, emoji: '🔥' },
  ];

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: undefined, reps: undefined, weight_kg: undefined }]);
  };

  const updateExercise = (index: number, field: keyof ExerciseSet, value: string) => {
    const updated = [...exercises];
    if (field === 'name') {
      updated[index] = { ...updated[index], name: value };
    } else {
      updated[index] = { ...updated[index], [field]: value ? parseFloat(value) : undefined };
    }
    setExercises(updated);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between px-4 py-3 border-b z-10">
          <h2 className="text-lg font-semibold text-gray-900">{t.workouts.addWorkout}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
              {t.meals.name}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'strength' ? 'Push Day' : 'Workout'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
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
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                min="0"
              />
            </div>
          </div>

          {/* Exercises (for strength) */}
          {type === 'strength' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  {t.workouts.exercises}
                </label>
                <button
                  type="button"
                  onClick={addExercise}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
                >
                  <Plus className="h-3 w-3" />
                  {t.common.add}
                </button>
              </div>
              {exercises.length > 0 && (
                <div className="space-y-2">
                  {exercises.map((ex, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) => updateExercise(idx, 'name', e.target.value)}
                        placeholder="Bench Press"
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                      />
                      <input
                        type="number"
                        value={ex.sets ?? ''}
                        onChange={(e) => updateExercise(idx, 'sets', e.target.value)}
                        placeholder={t.workouts.sets}
                        className="w-14 px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-center focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        min="1"
                      />
                      <input
                        type="number"
                        value={ex.reps ?? ''}
                        onChange={(e) => updateExercise(idx, 'reps', e.target.value)}
                        placeholder={t.workouts.reps}
                        className="w-14 px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-center focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        min="1"
                      />
                      <input
                        type="number"
                        value={ex.weight_kg ?? ''}
                        onChange={(e) => updateExercise(idx, 'weight_kg', e.target.value)}
                        placeholder={t.workouts.kg}
                        className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-xs text-center focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        min="0"
                        step="0.5"
                      />
                      <button
                        type="button"
                        onClick={() => removeExercise(idx)}
                        className="p-1.5 text-gray-300 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t.common.notes}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm resize-none"
              rows={2}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={addWorkout.isPending || !name}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
          >
            {addWorkout.isPending ? t.common.loading : t.common.save}
          </button>
        </form>
      </div>
    </div>
  );
}
