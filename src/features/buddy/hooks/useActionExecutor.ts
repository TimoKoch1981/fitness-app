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
import { useAddRecipe } from '../../recipes/hooks/useAddRecipe';
import { useClearPantry } from '../../pantry/hooks/usePantry';
import { useQueryClient } from '@tanstack/react-query';
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
  /**
   * Execute an array of actions sequentially.
   * Stops at first failure and returns results for all completed actions.
   * Idempotent: duplicate actions within a 60s window are silently skipped.
   */
  executeActions: (actions: ParsedAction[]) => Promise<{
    success: boolean;
    executed: number;
    failed: number;
    error?: string;
  }>;
  /** User dismissed — reject the pending action */
  rejectAction: () => void;
}

// ── Idempotency cache (module-level, persists across renders) ──────────
// Prevents duplicate action execution within a 60s window.
// Keyed by: userId + actionType + JSON-hash of data
const IDEMPOTENCY_WINDOW_MS = 60_000;
const idempotencyCache = new Map<string, number>();

function makeIdempotencyKey(action: ParsedAction, userId?: string): string {
  const dataStr = JSON.stringify(action.data);
  // Simple hash (FNV-1a style) — sufficient for collision-avoidance in a single session
  let hash = 2166136261;
  for (let i = 0; i < dataStr.length; i++) {
    hash ^= dataStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `${userId ?? 'anon'}:${action.type}:${(hash >>> 0).toString(36)}`;
}

function isDuplicate(key: string): boolean {
  const now = Date.now();
  const last = idempotencyCache.get(key);
  if (last && now - last < IDEMPOTENCY_WINDOW_MS) return true;
  // Cleanup stale entries occasionally
  if (idempotencyCache.size > 100) {
    for (const [k, t] of idempotencyCache.entries()) {
      if (now - t > IDEMPOTENCY_WINDOW_MS) idempotencyCache.delete(k);
    }
  }
  return false;
}

function markExecuted(key: string): void {
  idempotencyCache.set(key, Date.now());
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
  const addRecipe = useAddRecipe();
  const clearPantry = useClearPantry();
  const queryClient = useQueryClient();
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
    addRecipe,
    clearPantry,
    invalidatePantry: () => {
      queryClient.invalidateQueries({ queryKey: ['user-pantry'] });
      queryClient.invalidateQueries({ queryKey: ['user-pantry-all'] });
    },
  };

  /**
   * Execute an action via the ActionRegistry.
   * Accepts an action directly (preferred) or falls back to pendingAction state.
   * Returns { success, error } to avoid stale closure issues.
   * Idempotent: duplicate actions within a 60s window are silently skipped (returns success).
   */
  const executeAction = useCallback(async (actionOverride?: ParsedAction): Promise<{ success: boolean; error?: string }> => {
    const actionToExecute = actionOverride ?? pendingAction;
    if (!actionToExecute) return { success: false, error: 'No action to execute' };

    // Idempotency check — prevents double-execution when user / auto-execute collide
    const idempotencyKey = makeIdempotencyKey(actionToExecute, userId);
    if (isDuplicate(idempotencyKey)) {
      console.log('[ActionExecutor] Idempotency skip:', actionToExecute.type);
      setActionStatus('executed');
      setPendingAction(null);
      return { success: true };
    }

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

      markExecuted(idempotencyKey);
      setActionStatus('executed');
      setPendingAction(null);
      return { success: true };
    };

    // First attempt
    try {
      return await attemptExecution(effectiveUserId);
    } catch (error) {
      // Extract readable error message (PostgrestError is a plain object, not Error instance)
      const msg = error instanceof Error
        ? error.message
        : (typeof error === 'object' && error !== null && 'message' in error)
          ? String((error as Record<string, unknown>).message)
          : (typeof error === 'object' && error !== null)
            ? JSON.stringify(error)
            : 'Unknown error';
      const isAuthError = /RLS|row-level|Not authenticated|JWT|no data|policy|denied|expired/i.test(msg);

      if (isAuthError) {
        console.warn('[ActionExecutor] Auth/RLS error, retrying with fresh session:', msg);
        try {
          const refreshedId = await ensureFreshSession();
          return await attemptExecution(refreshedId);
        } catch (retryError) {
          const retryMsg = retryError instanceof Error
            ? retryError.message
            : (typeof retryError === 'object' && retryError !== null && 'message' in retryError)
              ? String((retryError as Record<string, unknown>).message)
              : String(retryError);
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

  /**
   * Execute multiple actions sequentially (e.g. save_training_plan + add_training_day).
   * Stops at first failure. Each action is idempotency-checked individually.
   */
  const executeActions = useCallback(async (actions: ParsedAction[]): Promise<{
    success: boolean;
    executed: number;
    failed: number;
    error?: string;
  }> => {
    if (!actions.length) return { success: true, executed: 0, failed: 0 };

    let executed = 0;
    let failed = 0;
    let lastError: string | undefined;

    for (const action of actions) {
      const result = await executeAction(action);
      if (result.success) {
        executed++;
      } else {
        failed++;
        lastError = result.error;
        // Hard stop on failure — dependent actions (e.g. add_training_day after save_training_plan) won't work
        break;
      }
    }

    return {
      success: failed === 0,
      executed,
      failed,
      error: lastError,
    };
  }, [executeAction]);

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
    executeActions,
    rejectAction,
  };
}
