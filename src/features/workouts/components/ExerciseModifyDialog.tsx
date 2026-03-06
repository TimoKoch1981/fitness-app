/**
 * ExerciseModifyDialog — Modify an exercise during a workout session.
 *
 * Three modes:
 * 1. Menu — Choose between Edit, Skip, Remove
 * 2. Edit — Modify sets (add/remove), weight/reps per set, rest time, duration
 *    with "permanent" or "this session only" toggle
 * 3. Confirm — Confirm permanent removal
 */

import { useState, useCallback } from 'react';
import {
  X, SkipForward, Trash2, AlertTriangle, Edit3, Plus, Minus,
  Save, Clock, Dumbbell,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import type { ExerciseEditPayload } from '../context/ActiveWorkoutContext';
import { supabase } from '../../../lib/supabase';
import type { PlanExercise } from '../../../types/health';

interface ExerciseModifyDialogProps {
  exerciseName: string;
  exerciseIndex: number;
  onClose: () => void;
}

type DialogMode = 'menu' | 'edit' | 'confirm-remove';

interface SetEditRow {
  target_reps: string;
  target_weight_kg: string;
  completed: boolean;
}

export function ExerciseModifyDialog({ exerciseName, exerciseIndex, onClose }: ExerciseModifyDialogProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { state, skipExercise, removeExercise, editExercise } = useActiveWorkout();
  const exercise = state.exercises[exerciseIndex];

  const [mode, setMode] = useState<DialogMode>('menu');
  const [isRemoving, setIsRemoving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit state
  const [editSets, setEditSets] = useState<SetEditRow[]>(() =>
    exercise.sets.map(s => ({
      target_reps: s.target_reps,
      target_weight_kg: s.target_weight_kg?.toString() ?? '',
      completed: s.completed,
    })),
  );
  const [editRest, setEditRest] = useState(exercise.rest_seconds?.toString() ?? '');
  const [editDuration, setEditDuration] = useState(exercise.duration_minutes?.toString() ?? '');
  const [permanent, setPermanent] = useState(false);

  const isTimedExercise = (
    exercise.exercise_type === 'cardio' ||
    exercise.exercise_type === 'flexibility' ||
    (exercise.duration_minutes != null && exercise.duration_minutes > 0 && !exercise.sets[0]?.target_weight_kg)
  );

  // ── Menu actions ──────────────────────────────────────────────────────

  const handleSkipToday = () => {
    skipExercise(exerciseIndex);
    onClose();
  };

  const handleRemovePermanent = async () => {
    setIsRemoving(true);
    try {
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

  // ── Edit actions ──────────────────────────────────────────────────────

  const addSet = useCallback(() => {
    const last = editSets[editSets.length - 1];
    setEditSets(prev => [
      ...prev,
      {
        target_reps: last?.target_reps ?? '10',
        target_weight_kg: last?.target_weight_kg ?? '',
        completed: false,
      },
    ]);
  }, [editSets]);

  const removeLastSet = useCallback(() => {
    if (editSets.length <= 1) return;
    // Don't remove completed sets
    const last = editSets[editSets.length - 1];
    if (last.completed) return;
    setEditSets(prev => prev.slice(0, -1));
  }, [editSets]);

  const updateSet = useCallback((idx: number, field: keyof SetEditRow, value: string) => {
    setEditSets(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }, []);

  const handleSaveEdit = async () => {
    setIsSaving(true);

    // Build payload for context
    const updates: ExerciseEditPayload = {
      numSets: editSets.length,
      setOverrides: editSets.map(s => ({
        target_reps: s.target_reps || undefined,
        target_weight_kg: s.target_weight_kg ? parseFloat(s.target_weight_kg) : undefined,
      })),
    };
    if (editRest) updates.rest_seconds = parseInt(editRest);
    if (editDuration) updates.duration_minutes = parseInt(editDuration);

    // Apply to current session
    editExercise(exerciseIndex, updates);

    // If permanent, also update DB
    if (permanent) {
      try {
        const { data: planDay } = await supabase
          .from('training_plan_days')
          .select('id, exercises')
          .eq('id', state.planDayId)
          .single();

        if (planDay) {
          const planExercises = [...(planDay.exercises as PlanExercise[])];
          const planIdx = exercise.plan_exercise_index;
          if (planIdx != null && planIdx < planExercises.length) {
            const pe = { ...planExercises[planIdx] };
            pe.sets = editSets.length;
            if (editSets[0]?.target_reps) pe.reps = editSets[0].target_reps;
            if (editSets[0]?.target_weight_kg) pe.weight_kg = parseFloat(editSets[0].target_weight_kg);
            if (editRest) pe.rest_seconds = parseInt(editRest);
            if (editDuration) pe.duration_minutes = parseInt(editDuration);
            planExercises[planIdx] = pe;

            await supabase
              .from('training_plan_days')
              .update({ exercises: planExercises })
              .eq('id', state.planDayId);
          }
        }
      } catch (err) {
        console.error('[ExerciseModifyDialog] Permanent save failed:', err);
      }
    }

    setIsSaving(false);
    onClose();
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            {mode !== 'menu' && (
              <button
                onClick={() => setMode('menu')}
                className="text-xs text-teal-500 hover:text-teal-600"
              >
                ← {isDE ? 'Zurück' : 'Back'}
              </button>
            )}
            <h3 className="font-semibold text-gray-900 text-sm truncate">{exerciseName}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* ── Menu Mode ─────────────────────────────────────────────── */}
          {mode === 'menu' && (
            <>
              <button
                onClick={() => setMode('edit')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors"
              >
                <Edit3 className="h-5 w-5 text-teal-500" />
                <div className="text-left">
                  <p className="font-medium">{isDE ? 'Übung bearbeiten' : 'Edit Exercise'}</p>
                  <p className="text-xs text-teal-600">
                    {isDE ? 'Sätze, Gewicht, Wdh, Pause anpassen' : 'Adjust sets, weight, reps, rest'}
                  </p>
                </div>
              </button>

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
                onClick={() => setMode('confirm-remove')}
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
          )}

          {/* ── Edit Mode ─────────────────────────────────────────────── */}
          {mode === 'edit' && (
            <div className="space-y-4">
              {/* Sets */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Dumbbell className="h-4 w-4 text-gray-400" />
                    {isDE ? 'Sätze' : 'Sets'} ({editSets.length})
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={removeLastSet}
                      disabled={editSets.length <= 1 || editSets[editSets.length - 1]?.completed}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-500 disabled:opacity-30 transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={addSet}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-teal-100 text-teal-600 hover:bg-teal-200 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Per-set table */}
                <div className="space-y-1.5">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-2 px-2 text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                    <div className="col-span-2">#</div>
                    <div className="col-span-5">{isDE ? 'Wdh' : 'Reps'}</div>
                    <div className="col-span-5">kg</div>
                  </div>

                  {editSets.map((s, idx) => (
                    <div
                      key={idx}
                      className={`grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded-lg ${
                        s.completed ? 'bg-teal-50 opacity-60' : 'bg-gray-50'
                      }`}
                    >
                      <div className="col-span-2 text-xs font-medium text-gray-500">
                        {idx + 1}
                        {s.completed && <span className="text-teal-500 ml-0.5">✓</span>}
                      </div>
                      <div className="col-span-5">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={s.target_reps}
                          onChange={e => updateSet(idx, 'target_reps', e.target.value)}
                          disabled={s.completed}
                          className="w-full px-2 py-1.5 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 disabled:text-gray-400"
                          placeholder="8-10"
                        />
                      </div>
                      <div className="col-span-5">
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.5"
                          value={s.target_weight_kg}
                          onChange={e => updateSet(idx, 'target_weight_kg', e.target.value)}
                          disabled={s.completed}
                          className="w-full px-2 py-1.5 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-100 disabled:text-gray-400"
                          placeholder="kg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rest Time */}
              {!isTimedExercise && (
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {isDE ? 'Satzpause (Sekunden)' : 'Set Rest (seconds)'}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={editRest}
                    onChange={e => setEditRest(e.target.value)}
                    placeholder={isDE ? 'z.B. 90' : 'e.g. 90'}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Duration (for timed exercises) */}
              {isTimedExercise && (
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-1.5">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {isDE ? 'Dauer (Minuten)' : 'Duration (minutes)'}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={editDuration}
                    onChange={e => setEditDuration(e.target.value)}
                    placeholder={isDE ? 'z.B. 10' : 'e.g. 10'}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {/* Permanent Toggle */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permanent}
                    onChange={e => setPermanent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {isDE ? 'Dauerhaft speichern' : 'Save permanently'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {permanent
                        ? (isDE ? 'Änderungen werden im Trainingsplan gespeichert' : 'Changes will be saved to the training plan')
                        : (isDE ? 'Änderungen gelten nur für dieses Training' : 'Changes apply to this session only')}
                    </p>
                  </div>
                </label>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors font-medium disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving
                  ? '...'
                  : permanent
                    ? (isDE ? 'Dauerhaft speichern' : 'Save Permanently')
                    : (isDE ? 'Für dieses Training übernehmen' : 'Apply for This Session')}
              </button>
            </div>
          )}

          {/* ── Confirm Remove Mode ───────────────────────────────────── */}
          {mode === 'confirm-remove' && (
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
                  onClick={() => setMode('menu')}
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
