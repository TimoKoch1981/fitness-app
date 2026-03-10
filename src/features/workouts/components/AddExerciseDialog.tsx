/**
 * AddExerciseDialog — Add an exercise to the current workout session.
 *
 * Uses the shared ExercisePicker for browsing/searching the catalog,
 * then a config step for sets/reps/weight.
 * Option: just this session or permanently add to plan.
 */

import { useState } from 'react';
import { X, Plus, ChevronLeft } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import { ExercisePicker } from './ExercisePicker';
import { supabase } from '../../../lib/supabase';
import type { WorkoutExerciseResult, PlanExercise, CatalogExercise } from '../../../types/health';

interface AddExerciseDialogProps {
  onClose: () => void;
}

export function AddExerciseDialog({ onClose }: AddExerciseDialogProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { state, addExercise } = useActiveWorkout();

  const [customName, setCustomName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');
  const [weight, setWeight] = useState('');
  const [permanent, setPermanent] = useState(false);
  const [selected, setSelected] = useState<CatalogExercise | null>(null);
  const [step, setStep] = useState<'search' | 'config'>('search');

  const handleSelect = (ex: CatalogExercise) => {
    setSelected(ex);
    setCustomName(isDE ? ex.name : (ex.name_en ?? ex.name));
    setStep('config');
  };

  const handleCustom = () => {
    setSelected(null);
    setCustomName(isDE ? 'Neue Übung' : 'New Exercise');
    setStep('config');
  };

  const handleAdd = async () => {
    const numSets = Math.max(1, parseInt(sets) || 3);
    const exercise: WorkoutExerciseResult = {
      name: customName,
      exercise_id: selected?.id,
      exercise_type: selected?.category as any ?? 'strength',
      plan_exercise_index: state.exercises.length,
      sets: Array.from({ length: numSets }, (_, i) => ({
        set_number: i + 1,
        target_reps: reps || '10',
        target_weight_kg: weight ? parseFloat(weight) : undefined,
        completed: false,
      })),
      is_addition: true,
    };

    addExercise(exercise, permanent);

    // If permanent, also add to the plan in DB
    if (permanent) {
      try {
        const { data: planDay } = await supabase
          .from('training_plan_days')
          .select('id, exercises')
          .eq('id', state.planDayId)
          .single();

        if (planDay) {
          const planExercise: PlanExercise = {
            name: customName,
            exercise_id: selected?.id,
            exercise_type: selected?.category as any ?? 'strength',
            sets: numSets,
            reps: reps || '10',
            weight_kg: weight ? parseFloat(weight) : undefined,
          };
          const exercises = [...(planDay.exercises as PlanExercise[]), planExercise];
          await supabase
            .from('training_plan_days')
            .update({ exercises })
            .eq('id', state.planDayId);
        }
      } catch (err) {
        console.error('[AddExerciseDialog] Permanent add failed:', err);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10 flex-shrink-0">
          {step === 'config' && (
            <button
              onClick={() => setStep('search')}
              className="p-1 rounded-full hover:bg-gray-100 mr-1"
            >
              <ChevronLeft className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <h3 className="font-semibold text-gray-900 text-sm flex-1">
            {step === 'search'
              ? (isDE ? 'Übung auswählen' : 'Select Exercise')
              : (isDE ? 'Übung konfigurieren' : 'Configure Exercise')
            }
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {step === 'search' ? (
            <div className="space-y-3">
              {/* Exercise Picker with filters */}
              <ExercisePicker
                onSelect={handleSelect}
                maxHeight="50vh"
              />

              {/* Custom exercise button */}
              <button
                onClick={handleCustom}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
              >
                <Plus className="h-4 w-4" />
                {isDE ? 'Eigene Übung eingeben' : 'Enter Custom Exercise'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">{isDE ? 'Übungsname' : 'Exercise Name'}</label>
                <input
                  type="text"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Selected exercise info */}
              {selected && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                  {selected.primary_muscles?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selected.primary_muscles.map((m) => (
                        <span
                          key={m}
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium"
                        >
                          {m}
                        </span>
                      ))}
                      {selected.secondary_muscles?.map((m) => (
                        <span
                          key={m}
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                  {selected.is_compound && (
                    <span className="text-[10px] text-teal-600 font-medium">
                      Compound · {selected.equipment_needed?.join(', ') || (isDE ? 'Körpergewicht' : 'Bodyweight')}
                    </span>
                  )}
                </div>
              )}

              {/* Sets / Reps / Weight */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{isDE ? 'Sätze' : 'Sets'}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={sets}
                    onChange={e => setSets(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{isDE ? 'Wdh' : 'Reps'}</label>
                  <input
                    type="text"
                    value={reps}
                    onChange={e => setReps(e.target.value)}
                    placeholder="8-10"
                    className="w-full px-3 py-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">kg</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder="-"
                    className="w-full px-3 py-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Permanent toggle — only when a plan-based session is active */}
              {state.planDayId && (
                <label className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    checked={permanent}
                    onChange={e => setPermanent(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                  />
                  <span className="text-sm text-gray-700">
                    {isDE ? 'Dauerhaft zum Plan hinzufügen' : 'Add permanently to plan'}
                  </span>
                </label>
              )}

              {/* Add Button */}
              <button
                onClick={handleAdd}
                disabled={!customName.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors font-medium disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {isDE ? 'Übung hinzufügen' : 'Add Exercise'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
