/**
 * Action Executor — bridges ParsedActions to Supabase mutation hooks.
 *
 * Uses the ActionRegistry (Phase 1) to look up and execute actions.
 * All 17 action types are registered via registerDefaultActions() at app startup.
 *
 * The hook still initializes mutation hooks (React hook rules) and passes them
 * as MutationMap in the ExecutionContext to the registry's execute function.
 *
 * @see lib/ai/actions/registry.ts — ActionDescriptor, ExecutionContext
 * @see lib/ai/actions/registerDefaults.ts — 17 action registrations
 * @see docs/KONZEPT_ACTION_REGISTRY.md — Architecture concept
 */

import { useState, useCallback } from 'react';
import { useAddMeal } from '../../meals/hooks/useMeals';
import { useAddWorkout } from '../../workouts/hooks/useWorkouts';
import { useAddBodyMeasurement } from '../../body/hooks/useBodyMeasurements';
import { useAddBloodPressure } from '../../medical/hooks/useBloodPressure';
import { useAddBloodWork } from '../../medical/hooks/useBloodWork';
import { useAddSubstance, useLogSubstance, useSubstances } from '../../medical/hooks/useSubstances';
import { useAddTrainingPlan, useAddTrainingPlanDay, useModifyTrainingPlanDay, useRemoveTrainingPlanDay } from '../../workouts/hooks/useTrainingPlans';
import { useAddUserProduct } from '../../meals/hooks/useProducts';
import { useAddReminder } from '../../reminders/hooks/useReminders';
import { useUpdateProfile } from '../../auth/hooks/useProfile';
import { useEquipmentCatalog, useSetUserEquipment } from '../../equipment/hooks/useEquipment';
import { ensureFreshSession } from '../../../lib/refreshSession';
import { actionRegistry } from '../../../lib/ai/actions/registry';
import type { MutationMap } from '../../../lib/ai/actions/registry';
import type { ParsedAction, ActionStatus } from '../../../lib/ai/actions/types';

// ── Types ────────────────────────────────────────────────────────────────

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

// ── Hook ─────────────────────────────────────────────────────────────────

export function useActionExecutor(userId?: string): UseActionExecutorReturn {
  const [pendingAction, setPendingAction] = useState<ParsedAction | null>(null);
  const [actionStatus, setActionStatus] = useState<ActionStatus>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize all mutation hooks (React hook rules — must be called unconditionally)
  const addMeal = useAddMeal();
  const addWorkout = useAddWorkout();
  const addBodyMeasurement = useAddBodyMeasurement();
  const addBloodPressure = useAddBloodPressure();
  const addBloodWork = useAddBloodWork();
  const logSubstance = useLogSubstance();
  const addTrainingPlan = useAddTrainingPlan();
  const addTrainingPlanDay = useAddTrainingPlanDay();
  const modifyTrainingPlanDay = useModifyTrainingPlanDay();
  const removeTrainingPlanDay = useRemoveTrainingPlanDay();
  const addUserProduct = useAddUserProduct();
  const addSubstance = useAddSubstance();
  const addReminder = useAddReminder();
  const updateProfile = useUpdateProfile();
  const setUserEquipment = useSetUserEquipment();
  const { data: equipmentCatalog } = useEquipmentCatalog();

  // Active substances for name → id resolution
  const { data: activeSubstances } = useSubstances(true);

  // Build MutationMap for ExecutionContext
  const mutations: MutationMap = {
    addMeal,
    addWorkout,
    addBodyMeasurement,
    addBloodPressure,
    addBloodWork,
    logSubstance,
    addTrainingPlan,
    addTrainingPlanDay,
    modifyTrainingPlanDay,
    removeTrainingPlanDay,
    addUserProduct,
    addSubstance,
    addReminder,
    updateProfile,
    setUserEquipment,
  };

  /**
   * Execute an action via the ActionRegistry.
   * Accepts an action directly (preferred) or falls back to pendingAction state.
   * Returns { success, error } to avoid stale closure issues.
   */
  const executeAction = useCallback(async (actionOverride?: ParsedAction): Promise<{ success: boolean; error?: string }> => {
    const actionToExecute = actionOverride ?? pendingAction;
    if (!actionToExecute) return { success: false, error: 'No action to execute' };

    setActionStatus('executing');
    setErrorMessage(null);

    // Ensure fresh auth session before executing any mutation
    let effectiveUserId = userId;
    try {
      effectiveUserId = await ensureFreshSession();
    } catch (err) {
      console.warn('[ActionExecutor] Session refresh failed, trying with existing userId:', err);
    }

    const attemptExecution = async (uid: string | undefined): Promise<{ success: boolean; error?: string }> => {
      // Look up action descriptor from registry
      const descriptor = actionRegistry.get(actionToExecute.type);
      if (!descriptor) {
        throw new Error(`Unknown action type: ${actionToExecute.type}`);
      }

      // Execute via registry (schema + display + execute all in one place)
      await descriptor.execute(actionToExecute.data as Record<string, unknown>, {
        userId: uid,
        mutations,
        activeSubstances: activeSubstances ?? undefined,
        equipmentCatalog: equipmentCatalog ?? undefined,
      });

      setActionStatus('executed');
      setPendingAction(null);
      return { success: true };
    };

    // First attempt
    try {
      return await attemptExecution(effectiveUserId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : (typeof error === 'object' && error !== null ? JSON.stringify(error) : 'Unknown error');
      const isAuthError = /RLS|row-level|Not authenticated|JWT|no data|policy|denied|expired/i.test(msg);

      if (isAuthError) {
        console.warn('[ActionExecutor] Auth/RLS error, retrying with fresh session:', msg);
        try {
          const refreshedId = await ensureFreshSession();
          return await attemptExecution(refreshedId);
        } catch (retryError) {
          const retryMsg = retryError instanceof Error ? retryError.message : String(retryError);
          console.error('[ActionExecutor] Retry also failed:', retryMsg);
          setErrorMessage(retryMsg);
          setActionStatus('failed');
          return { success: false, error: retryMsg };
        }
      }

      console.error('[ActionExecutor] Failed:', msg, error);
      setErrorMessage(msg);
      setActionStatus('failed');
      return { success: false, error: msg };
    }
  }, [pendingAction, activeSubstances, userId, mutations, equipmentCatalog]);

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
