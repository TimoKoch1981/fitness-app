/**
 * Action Executor — bridges ParsedActions to Supabase mutation hooks.
 *
 * When an agent includes ACTION blocks in its response, this hook:
 * 1. Holds pending actions in state
 * 2. Executes each action via the appropriate mutation hook
 * 3. Tracks execution status (pending → executing → executed/failed)
 *
 * Special handling for `log_substance`: the LLM returns `substance_name`
 * but the DB needs `substance_id` (UUID). We resolve this via fuzzy matching
 * against activeSubstances (case-insensitive, partial match, levenshtein distance).
 */

import { useState, useCallback } from 'react';
import { useAddMeal } from '../../meals/hooks/useMeals';
import { useAddWorkout } from '../../workouts/hooks/useWorkouts';
import { useAddBodyMeasurement } from '../../body/hooks/useBodyMeasurements';
import { useAddBloodPressure } from '../../medical/hooks/useBloodPressure';
import { useLogSubstance, useSubstances } from '../../medical/hooks/useSubstances';
import { useAddTrainingPlan } from '../../workouts/hooks/useTrainingPlans';
import { useAddUserProduct } from '../../meals/hooks/useProducts';
import type { ParsedAction, ActionStatus } from '../../../lib/ai/actions/types';
import type { SplitType, PlanExercise, InjectionSite, ProductCategory } from '../../../types/health';

// ── Fuzzy Matching Helpers ────────────────────────────────────────────

/**
 * Simple Levenshtein distance between two strings.
 * Used for fuzzy substance name matching.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Fuzzy match a substance name against the active substances list.
 * Matching strategy (in priority order):
 * 1. Exact match (case-insensitive)
 * 2. One name contains the other (partial match)
 * 3. Levenshtein distance ≤ 3 (typo tolerance)
 *
 * Returns the best matching substance or null.
 */
function fuzzyMatchSubstance(
  searchName: string,
  substances: Array<{ id: string; name: string }>,
): { id: string; name: string } | null {
  const search = searchName.toLowerCase().trim();

  // 1. Exact match
  const exact = substances.find(s => s.name.toLowerCase() === search);
  if (exact) return exact;

  // 2. Partial match (search contains substance name or vice versa)
  const partial = substances.find(s => {
    const name = s.name.toLowerCase();
    return name.includes(search) || search.includes(name);
  });
  if (partial) return partial;

  // 3. Levenshtein distance (typo tolerance)
  let bestMatch: { id: string; name: string } | null = null;
  let bestDistance = Infinity;
  for (const s of substances) {
    const dist = levenshtein(search, s.name.toLowerCase());
    // Allow distance proportional to name length, but max 3
    const threshold = Math.min(3, Math.floor(s.name.length * 0.3));
    if (dist <= threshold && dist < bestDistance) {
      bestDistance = dist;
      bestMatch = s;
    }
  }

  return bestMatch;
}

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

export function useActionExecutor(userId?: string): UseActionExecutorReturn {
  const [pendingAction, setPendingAction] = useState<ParsedAction | null>(null);
  const [actionStatus, setActionStatus] = useState<ActionStatus>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize all mutation hooks
  const addMeal = useAddMeal();
  const addWorkout = useAddWorkout();
  const addBodyMeasurement = useAddBodyMeasurement();
  const addBloodPressure = useAddBloodPressure();
  const logSubstance = useLogSubstance();
  const addTrainingPlan = useAddTrainingPlan();
  const addUserProduct = useAddUserProduct();

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
            user_id: userId,
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
            exercises: d.exercises as Array<{ name: string; sets?: number; reps?: number; weight_kg?: number }> | undefined,
            notes: d.notes as string | undefined,
            date: d.date as string | undefined,
            user_id: userId,
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
            user_id: userId,
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
            user_id: userId,
          });
          break;
        }

        case 'log_substance': {
          // Resolve substance_name → substance_id (fuzzy matching)
          const match = activeSubstances
            ? fuzzyMatchSubstance(d.substance_name as string, activeSubstances)
            : null;

          if (!match) {
            throw new Error(
              `Substance "${d.substance_name}" not found / Substanz "${d.substance_name}" nicht gefunden. ` +
              `Add it first under Substances / Zuerst unter Substanzen hinzufügen.`
            );
          }

          await logSubstance.mutateAsync({
            substance_id: match.id,
            dosage_taken: d.dosage_taken as string | undefined,
            site: d.site as InjectionSite | undefined,
            date: d.date as string | undefined,
            time: d.time as string | undefined,
            notes: d.notes as string | undefined,
            user_id: userId,
          });
          break;
        }

        case 'save_training_plan': {
          await addTrainingPlan.mutateAsync({
            name: d.name as string,
            split_type: (d.split_type as SplitType) ?? 'custom',
            days_per_week: d.days_per_week as number,
            notes: d.notes as string | undefined,
            days: (d.days as Array<{ day_number: number; name: string; focus?: string; exercises: PlanExercise[]; notes?: string }>).map((day) => ({
              day_number: day.day_number as number,
              name: day.name as string,
              focus: day.focus as string | undefined,
              exercises: day.exercises as PlanExercise[],
              notes: day.notes as string | undefined,
            })),
            user_id: userId,
          });
          break;
        }

        case 'save_product': {
          await addUserProduct.mutateAsync({
            name: d.name as string,
            brand: d.brand as string | undefined,
            category: (d.category as ProductCategory) ?? 'general',
            serving_size_g: d.serving_size_g as number,
            serving_label: d.serving_label as string | undefined,
            calories_per_serving: d.calories_per_serving as number,
            protein_per_serving: d.protein_per_serving as number,
            carbs_per_serving: d.carbs_per_serving as number,
            fat_per_serving: d.fat_per_serving as number,
            fiber_per_serving: d.fiber_per_serving as number | undefined,
            aliases: d.aliases as string[] | undefined,
            notes: d.notes as string | undefined,
            user_id: userId,
          });
          break;
        }

        default: {
          throw new Error(`Unknown action type: ${(actionToExecute as { type: string }).type}`);
        }
      }

      setActionStatus('executed');
      setPendingAction(null);
      return { success: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : (typeof error === 'object' && error !== null ? JSON.stringify(error) : 'Unknown error');
      console.error('[ActionExecutor] Failed:', msg, error);
      setErrorMessage(msg);
      setActionStatus('failed');
      return { success: false, error: msg };
    }
  }, [pendingAction, activeSubstances, userId, addMeal, addWorkout, addBodyMeasurement, addBloodPressure, logSubstance, addTrainingPlan, addUserProduct]);

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
