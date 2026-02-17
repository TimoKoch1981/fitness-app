/**
 * Action Executor — bridges ParsedActions to Supabase mutation hooks.
 *
 * When an agent includes an ACTION block in its response, this hook:
 * 1. Holds the pending action in state
 * 2. On user confirmation: calls the appropriate mutation hook
 * 3. Tracks execution status (pending → executing → executed/failed)
 *
 * Special handling for `log_substance`: the LLM returns `substance_name`
 * but the DB needs `substance_id` (UUID). We resolve this via activeSubstances.
 */

import { useState, useCallback } from 'react';
import { useAddMeal } from '../../meals/hooks/useMeals';
import { useAddWorkout } from '../../workouts/hooks/useWorkouts';
import { useAddBodyMeasurement } from '../../body/hooks/useBodyMeasurements';
import { useAddBloodPressure } from '../../medical/hooks/useBloodPressure';
import { useLogSubstance, useSubstances } from '../../medical/hooks/useSubstances';
import type { ParsedAction, ActionStatus } from '../../../lib/ai/actions/types';

interface UseActionExecutorReturn {
  /** Currently pending action awaiting user confirmation */
  pendingAction: ParsedAction | null;
  /** Current lifecycle status */
  actionStatus: ActionStatus;
  /** Error message if execution failed */
  errorMessage: string | null;
  /** Set a new pending action (called after parsing agent response) */
  setPendingAction: (action: ParsedAction | null) => void;
  /** Execute action — optionally pass action directly (avoids state race) */
  executeAction: (action?: ParsedAction) => Promise<{ success: boolean; error?: string }>;
  /** User dismissed — reject the pending action */
  rejectAction: () => void;
}

export function useActionExecutor(): UseActionExecutorReturn {
  const [pendingAction, setPendingAction] = useState<ParsedAction | null>(null);
  const [actionStatus, setActionStatus] = useState<ActionStatus>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize all mutation hooks
  const addMeal = useAddMeal();
  const addWorkout = useAddWorkout();
  const addBodyMeasurement = useAddBodyMeasurement();
  const addBloodPressure = useAddBloodPressure();
  const logSubstance = useLogSubstance();

  // Active substances for name → id resolution
  const { data: activeSubstances } = useSubstances(true);

  /**
   * Execute an action by calling the appropriate mutation.
   * Accepts an action directly (preferred) or falls back to pendingAction state.
   * Returns { success, error } to avoid stale closure issues.
   */
  const executeAction = useCallback(async (actionOverride?: ParsedAction): Promise<{ success: boolean; error?: string }> => {
    const actionToExecute = actionOverride ?? pendingAction;
    if (!actionToExecute) return { success: false, error: 'No action to execute' };

    setActionStatus('executing');
    setErrorMessage(null);

    try {
      const d = actionToExecute.data;

      switch (actionToExecute.type) {
        case 'log_meal': {
          await addMeal.mutateAsync({
            name: d.name as string,
            type: d.type as 'breakfast' | 'lunch' | 'dinner' | 'snack',
            calories: d.calories as number,
            protein: d.protein as number,
            carbs: d.carbs as number,
            fat: d.fat as number,
            fiber: d.fiber as number | undefined,
            date: d.date as string | undefined,
            source: 'ai',
          });
          break;
        }

        case 'log_workout': {
          await addWorkout.mutateAsync({
            name: d.name as string,
            type: d.type as 'strength' | 'cardio' | 'flexibility' | 'hiit' | 'sports' | 'other',
            duration_minutes: d.duration_minutes as number | undefined,
            calories_burned: d.calories_burned as number | undefined,
            met_value: d.met_value as number | undefined,
            exercises: d.exercises as any[] | undefined,
            notes: d.notes as string | undefined,
            date: d.date as string | undefined,
          });
          break;
        }

        case 'log_body': {
          await addBodyMeasurement.mutateAsync({
            weight_kg: d.weight_kg as number | undefined,
            body_fat_pct: d.body_fat_pct as number | undefined,
            muscle_mass_kg: d.muscle_mass_kg as number | undefined,
            water_pct: d.water_pct as number | undefined,
            waist_cm: d.waist_cm as number | undefined,
            chest_cm: d.chest_cm as number | undefined,
            arm_cm: d.arm_cm as number | undefined,
            leg_cm: d.leg_cm as number | undefined,
            date: d.date as string | undefined,
            source: 'ai',
          });
          break;
        }

        case 'log_blood_pressure': {
          await addBloodPressure.mutateAsync({
            systolic: d.systolic as number,
            diastolic: d.diastolic as number,
            pulse: d.pulse as number | undefined,
            date: d.date as string,
            time: d.time as string,
            notes: d.notes as string | undefined,
          });
          break;
        }

        case 'log_substance': {
          // Resolve substance_name → substance_id
          const substanceName = (d.substance_name as string).toLowerCase();
          const match = activeSubstances?.find(
            (s) => s.name.toLowerCase() === substanceName
          );

          if (!match) {
            throw new Error(
              `Substanz "${d.substance_name}" nicht in deiner Liste gefunden. ` +
              `Füge sie zuerst unter Substanzen hinzu.`
            );
          }

          await logSubstance.mutateAsync({
            substance_id: match.id,
            dosage_taken: d.dosage_taken as string | undefined,
            site: d.site as any,
            date: d.date as string | undefined,
            time: d.time as string | undefined,
            notes: d.notes as string | undefined,
          });
          break;
        }

        default: {
          throw new Error(`Unknown action type: ${(actionToExecute as any).type}`);
        }
      }

      setActionStatus('executed');
      setPendingAction(null);
      return { success: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ActionExecutor] Failed:', msg);
      setErrorMessage(msg);
      setActionStatus('failed');
      return { success: false, error: msg };
    }
  }, [pendingAction, activeSubstances, addMeal, addWorkout, addBodyMeasurement, addBloodPressure, logSubstance]);

  /** User dismissed the pending action */
  const rejectAction = useCallback(() => {
    setActionStatus('rejected');
    setPendingAction(null);
    setErrorMessage(null);
  }, []);

  /** Set a new pending action and reset status */
  const handleSetPendingAction = useCallback((action: ParsedAction | null) => {
    setPendingAction(action);
    setActionStatus(action ? 'pending' : 'rejected');
    setErrorMessage(null);
  }, []);

  return {
    pendingAction,
    actionStatus,
    errorMessage,
    setPendingAction: handleSetPendingAction,
    executeAction,
    rejectAction,
  };
}
