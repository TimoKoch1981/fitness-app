/**
 * AddExerciseDialog — Add an exercise to the current workout session.
 *
 * Uses the shared ExercisePicker for browsing/searching the catalog,
 * then a config step for sets/reps/weight.
 * Option: just this session or permanently add to plan.
 */

import { useState, useCallback } from 'react';
import { X, Plus, ChevronLeft, ListChecks } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import { ExercisePicker } from './ExercisePicker';
import { supabase } from '../../../lib/supabase';
import { ISOMETRIC_PATTERNS } from '../utils/suggestRestTimes';
import type { WorkoutExerciseResult, PlanExercise, CatalogExercise } from '../../../types/health';

/**
 * B36 (2026-05-22): Free-Workout regression of the B23-Fix.
 *
 * Mirror of the buildExercisesFromPlan priority chain — Strength exercises
 * added to a free workout must land with target_weight_kg=0 (not undefined),
 * otherwise the tracker's noWeight check (`every(s => s.target_weight_kg == null)`)
 * trips and the kg-column disappears. Cardio / Flexibility / Isometric stays
 * undefined on purpose.
 */
function initialTargetWeightKg(
  category: string | undefined,
  name: string,
  explicitWeight?: number,
): number | undefined {
  if (explicitWeight != null) return explicitWeight;
  const isCardioOrFlex = category === 'cardio' || category === 'flexibility';
  const isIsometric = ISOMETRIC_PATTERNS.some((p) => p.test(name));
  if (isCardioOrFlex || isIsometric) return undefined;
  return 0;
}

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
  const [multiSelectMode, setMultiSelectMode] = useState(false);

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

  /** Multi-select: add all selected exercises with default configs (3 sets, 10 reps) */
  const handleMultiAdd = useCallback((exercises: CatalogExercise[]) => {
    exercises.forEach((ex, offset) => {
      const name = isDE ? ex.name : (ex.name_en ?? ex.name);
      const targetWeightKg = initialTargetWeightKg(ex.category, name);
      const exercise: WorkoutExerciseResult = {
        name,
        exercise_id: ex.id,
        exercise_type: ex.category as any ?? 'strength',
        plan_exercise_index: state.exercises.length + offset,
        sets: Array.from({ length: 3 }, (_, i) => ({
          set_number: i + 1,
          target_reps: '10',
          target_weight_kg: targetWeightKg,
          completed: false,
        })),
        is_addition: true,
      };
      addExercise(exercise, false);
    });
    onClose();
  }, [isDE, state.exercises.length, addExercise, onClose]);

  const handleAdd = async () => {
    const numSets = Math.max(1, parseInt(sets) || 3);
    const explicitWeight = weight ? parseFloat(weight) : undefined;
    const targetWeightKg = initialTargetWeightKg(selected?.category, customName, explicitWeight);
    const exercise: WorkoutExerciseResult = {
      name: customName,
      exercise_id: selected?.id,
      exercise_type: selected?.category as any ?? 'strength',
      plan_exercise_index: state.exercises.length,
      sets: Array.from({ length: numSets }, (_, i) => ({
        set_number: i + 1,
        target_reps: reps || '10',
        target_weight_kg: targetWeightKg,
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
          // B35: A free-workout add with no weight entered AND a strength
          // category that isn't isometric is the user saying "I do this with
          // bodyweight". Persist the flag so the tracker hides the kg column
          // when the plan is started later.
          const explicitWeight = weight ? parseFloat(weight) : undefined;
          const isIsometric = ISOMETRIC_PATTERNS.some((p) => p.test(customName));
          const isCardioOrFlex = selected?.category === 'cardio' || selected?.category === 'flexibility';
          const planExercise: PlanExercise = {
            name: customName,
            exercise_id: selected?.id,
            exercise_type: selected?.category as any ?? 'strength',
            sets: numSets,
            reps: reps || '10',
            weight_kg: explicitWeight,
            is_bodyweight: explicitWeight == null && !isIsometric && !isCardioOrFlex ? true : undefined,
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
              ? (multiSelectMode
                  ? (isDE ? 'Mehrere auswählen' : 'Select Multiple')
                  : (isDE ? 'Übung auswählen' : 'Select Exercise'))
              : (isDE ? 'Übung konfigurieren' : 'Configure Exercise')
            }
          </h3>
          {step === 'search' && (
            <button
              onClick={() => setMultiSelectMode(!multiSelectMode)}
              className={`p-1.5 rounded-lg transition-colors mr-1 ${
                multiSelectMode ? 'bg-theme-surface-2 text-theme-primary' : 'text-gray-400 hover:bg-gray-100'
              }`}
              title={isDE ? 'Mehrfachauswahl' : 'Multi-select'}
            >
              <ListChecks className="h-4 w-4" />
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {step === 'search' ? (
            <div className="space-y-3">
              {/* Exercise Picker with filters (supports multi-select) */}
              <ExercisePicker
                onSelect={handleSelect}
                multiSelect={multiSelectMode}
                onMultiSelectConfirm={handleMultiAdd}
                maxHeight="50vh"
              />

              {/* Custom exercise button */}
              <button
                onClick={handleCustom}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-theme-primary bg-theme-surface-2 rounded-lg hover:bg-theme-surface-2 transition-colors"
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
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary"
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
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-theme-surface-2 text-theme-primary font-medium"
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
                    <span className="text-[10px] text-theme-primary font-medium">
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
                    className="w-full px-3 py-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-theme-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">{isDE ? 'Wdh' : 'Reps'}</label>
                  <input
                    type="text"
                    value={reps}
                    onChange={e => setReps(e.target.value)}
                    placeholder="8-10"
                    className="w-full px-3 py-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-theme-primary"
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
                    className="w-full px-3 py-2 text-sm text-center border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-theme-primary"
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
                    className="w-4 h-4 rounded border-gray-300 text-theme-primary focus:ring-theme-primary"
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
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-white bg-theme-primary rounded-xl hover:bg-theme-primary-2 transition-colors font-medium disabled:opacity-50"
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
