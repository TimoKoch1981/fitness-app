/**
 * ExerciseModifyDialog — Options to modify an exercise during a session.
 * Temporary (this session only) or permanent (update plan).
 */

import { useState } from 'react';
import { X, SkipForward, Trash2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import { supabase } from '../../../lib/supabase';
import type { PlanExercise } from '../../../types/health';

interface ExerciseModifyDialogProps {
  exerciseName: string;
  exerciseIndex: number;
  onClose: () => void;
}

export function ExerciseModifyDialog({ exerciseName, exerciseIndex, onClose }: ExerciseModifyDialogProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { state, skipExercise, removeExercise } = useActiveWorkout();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleSkipToday = () => {
    skipExercise(exerciseIndex);
    onClose();
  };

  const handleRemovePermanent = async () => {
    setIsRemoving(true);
    try {
      // Update the plan in DB — remove exercise from the day's exercises array
      const { data: planDay } = await supabase
        .from('training_plan_days')
        .select('id, exercises')
        .eq('id', state.planDayId)
        .single();

      if (planDay) {
        const exercises = (planDay.exercises as PlanExercise[]).filter(
          (_, i) => i !== state.exercises[exerciseIndex]?.plan_exercise_index,
        );
        await supabase
          .from('training_plan_days')
          .update({ exercises })
          .eq('id', state.planDayId);
      }

      removeExercise(exerciseIndex, true);
      onClose();
    } catch (err) {
      console.error('[ExerciseModifyDialog] Remove failed:', err);
      setIsRemoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm truncate">{exerciseName}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {!showConfirm ? (
            <>
              <button
                onClick={handleSkipToday}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <SkipForward className="h-5 w-5 text-gray-400" />
                <div className="text-left">
                  <p className="font-medium">{isDE ? 'Heute überspringen' : 'Skip Today'}</p>
                  <p className="text-xs text-gray-400">
                    {isDE ? 'Nur für dieses Training' : 'Only for this session'}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setShowConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-700 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-5 w-5 text-red-400" />
                <div className="text-left">
                  <p className="font-medium">{isDE ? 'Dauerhaft entfernen' : 'Remove Permanently'}</p>
                  <p className="text-xs text-red-400">
                    {isDE ? 'Aus dem Trainingsplan löschen' : 'Delete from training plan'}
                  </p>
                </div>
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-red-700">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>
                  {isDE
                    ? `"${exerciseName}" wird dauerhaft aus deinem Trainingsplan entfernt. Diese Aktion kann nicht rückgängig gemacht werden.`
                    : `"${exerciseName}" will be permanently removed from your training plan. This cannot be undone.`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {isDE ? 'Abbrechen' : 'Cancel'}
                </button>
                <button
                  onClick={handleRemovePermanent}
                  disabled={isRemoving}
                  className="flex-1 py-2.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isRemoving ? '...' : (isDE ? 'Entfernen' : 'Remove')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
