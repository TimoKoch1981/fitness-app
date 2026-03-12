import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { TrainingPlan, TrainingPlanDay, SplitType, PlanExercise, ReviewConfig } from '../../../types/health';

const PLANS_KEY = 'training_plans';

// ── Queries ─────────────────────────────────────────────────────────────

/**
 * Load the user's active training plan with all days (JOIN).
 * Returns null if no active plan exists.
 */
export function useActivePlan() {
  return useQuery({
    queryKey: [PLANS_KEY, 'active'],
    queryFn: async (): Promise<TrainingPlan | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('training_plans')
        .select('*, training_plan_days(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Map nested days and sort by day_number, strip raw join field
      const { training_plan_days, ...rest } = data as Record<string, unknown>;
      const plan: TrainingPlan = {
        ...(rest as Omit<TrainingPlan, 'days'>),
        days: (training_plan_days as TrainingPlanDay[] ?? [])
          .sort((a, b) => a.day_number - b.day_number),
      };
      return plan;
    },
  });
}

/**
 * Load a specific training plan by ID with all days (JOIN).
 * Used when viewing a non-active plan from the plan list.
 */
export function usePlanById(planId: string | undefined) {
  return useQuery({
    queryKey: [PLANS_KEY, 'detail', planId],
    queryFn: async (): Promise<TrainingPlan | null> => {
      if (!planId) return null;

      const { data, error } = await supabase
        .from('training_plans')
        .select('*, training_plan_days(*)')
        .eq('id', planId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const { training_plan_days, ...rest } = data as Record<string, unknown>;
      const plan: TrainingPlan = {
        ...(rest as Omit<TrainingPlan, 'days'>),
        days: (training_plan_days as TrainingPlanDay[] ?? [])
          .sort((a, b) => a.day_number - b.day_number),
      };
      return plan;
    },
    enabled: !!planId,
  });
}

/**
 * Load all training plans (without days) for listing.
 * Sorted: active plan first, then by creation date (newest first).
 */
export function useTrainingPlans() {
  return useQuery({
    queryKey: [PLANS_KEY],
    queryFn: async (): Promise<TrainingPlan[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Mutations ───────────────────────────────────────────────────────────

export interface AddTrainingPlanInput {
  name: string;
  split_type: SplitType;
  days_per_week: number;
  notes?: string;
  days: {
    day_number: number;
    name: string;
    focus?: string;
    exercises: PlanExercise[];
    notes?: string;
  }[];
  /** Optional: pass user_id directly to avoid auth race conditions */
  user_id?: string;
}

/**
 * Add a new training plan (3-step: deactivate old → insert plan → insert days).
 */
export function useAddTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddTrainingPlanInput) => {
      // Use provided user_id, or refresh session to get a fresh one
      let userId = input.user_id;
      if (!userId) {
        const { ensureFreshSession } = await import('../../../lib/refreshSession');
        userId = await ensureFreshSession();
      }

      console.log(`[TrainingPlan] Saving plan "${input.name}" with ${input.days.length} days for user ${userId}`);

      // Step 1: Deactivate all existing plans
      const { error: deactivateError } = await supabase
        .from('training_plans')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (deactivateError) {
        console.warn('[TrainingPlan] Deactivate old plans warning:', deactivateError);
        // Non-fatal: continue even if no old plans exist
      }

      // Step 2: Insert the new plan
      const { data: plan, error: planError } = await supabase
        .from('training_plans')
        .insert({
          user_id: userId,
          name: input.name,
          split_type: input.split_type,
          days_per_week: input.days_per_week,
          is_active: true,
          notes: input.notes,
        })
        .select()
        .single();

      if (planError) {
        console.error('[TrainingPlan] ❌ Insert plan failed:', planError);
        throw planError;
      }

      if (!plan || !plan.id) {
        console.error('[TrainingPlan] ❌ Insert returned no data — possible RLS rejection');
        throw new Error('Plan wurde nicht gespeichert. Bitte neu einloggen.');
      }

      console.log(`[TrainingPlan] Plan inserted with ID ${plan.id}, inserting ${input.days.length} days...`);

      // Step 3: Insert all days (bulk)
      const dayRows = input.days.map((day) => ({
        plan_id: plan.id,
        day_number: day.day_number,
        name: day.name,
        focus: day.focus,
        exercises: day.exercises,
        notes: day.notes,
      }));

      const { data: insertedDays, error: daysError } = await supabase
        .from('training_plan_days')
        .insert(dayRows)
        .select();

      if (daysError) {
        console.error('[TrainingPlan] ❌ Insert days failed:', daysError);
        throw daysError;
      }

      console.log(`[TrainingPlan] ✅ Plan "${input.name}" saved with ID ${plan.id}, ${insertedDays?.length ?? 0} days inserted`);
      return plan as TrainingPlan;
    },
    onSuccess: () => {
      // Explicitly invalidate both the list AND the active plan query
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY, 'active'] });
    },
  });
}

// ── Calibration Mutation ─────────────────────────────────────────────────

export interface CalibrationSaveInput {
  planId: string;
  ai_supervised: boolean;
  review_config: ReviewConfig;
  dayUpdates: {
    dayId: string;
    exercises: PlanExercise[];
  }[];
}

/**
 * Update a training plan with calibration data (ai_supervised, review_config, exercise weights).
 * Called by CalibrationWizard after the 3-screen flow.
 */
export function useUpdateTrainingPlanCalibration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CalibrationSaveInput) => {
      console.log(`[CalibrationWizard] Saving calibration for plan ${input.planId}`);

      // Step 1: Update training_plans row (ai_supervised + review_config)
      const { error: planError } = await supabase
        .from('training_plans')
        .update({
          ai_supervised: input.ai_supervised,
          review_config: input.review_config,
        })
        .eq('id', input.planId);

      if (planError) {
        console.error('[CalibrationWizard] Update plan failed:', planError);
        throw planError;
      }

      // Step 2: Update each day's exercises with calibrated weights
      for (const day of input.dayUpdates) {
        const { error: dayError } = await supabase
          .from('training_plan_days')
          .update({ exercises: day.exercises })
          .eq('id', day.dayId);

        if (dayError) {
          console.error(`[CalibrationWizard] Update day ${day.dayId} failed:`, dayError);
          throw dayError;
        }
      }

      console.log('[CalibrationWizard] ✅ Calibration saved successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY, 'active'] });
    },
  });
}

// ── Update Plan Metadata ──────────────────────────────────────────────

export interface UpdateTrainingPlanInput {
  id: string;
  name?: string;
  split_type?: SplitType;
  days_per_week?: number;
  notes?: string;
}

/**
 * Update a training plan's metadata (name, split_type, days_per_week, notes).
 * Used by EditPlanMetaDialog.
 */
export function useUpdateTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTrainingPlanInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { id, ...fields } = input;
      const { error } = await supabase
        .from('training_plans')
        .update(fields)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('[TrainingPlan] Update metadata failed:', error);
        throw error;
      }

      console.log(`[TrainingPlan] ✅ Plan ${id} metadata updated`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY, 'active'] });
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY, 'detail', variables.id] });
    },
  });
}

/**
 * Delete a training plan (cascade deletes days via FK).
 */
export function useDeleteTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('training_plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY, 'active'] });
    },
  });
}

// ── Activate Plan Mutation ──────────────────────────────────────────────

/**
 * Activate a training plan (deactivate all others → activate the chosen one).
 */
export function useActivatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Step 1: Deactivate all plans
      const { error: deactivateError } = await supabase
        .from('training_plans')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (deactivateError) {
        console.warn('[TrainingPlan] Deactivate warning:', deactivateError);
      }

      // Step 2: Activate the chosen plan
      const { error: activateError } = await supabase
        .from('training_plans')
        .update({ is_active: true })
        .eq('id', planId);

      if (activateError) {
        console.error('[TrainingPlan] Activate failed:', activateError);
        throw activateError;
      }

      console.log(`[TrainingPlan] ✅ Plan ${planId} activated`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY, 'active'] });
    },
  });
}

// ── Duplicate Plan Mutation ─────────────────────────────────────────────

/**
 * Duplicate a training plan (plan + all days). Does NOT activate the copy.
 */
export function useDuplicatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Step 1: Load the source plan
      const { data: sourcePlan, error: planError } = await supabase
        .from('training_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !sourcePlan) {
        throw planError ?? new Error('Plan not found');
      }

      // Step 2: Load the source days
      const { data: sourceDays, error: daysError } = await supabase
        .from('training_plan_days')
        .select('*')
        .eq('plan_id', planId)
        .order('day_number', { ascending: true });

      if (daysError) throw daysError;

      // Step 3: Insert the copy (not active)
      const { data: newPlan, error: insertError } = await supabase
        .from('training_plans')
        .insert({
          user_id: user.id,
          name: `Kopie von ${sourcePlan.name}`,
          split_type: sourcePlan.split_type,
          days_per_week: sourcePlan.days_per_week,
          is_active: false,
          notes: sourcePlan.notes,
        })
        .select()
        .single();

      if (insertError || !newPlan) {
        throw insertError ?? new Error('Failed to create plan copy');
      }

      // Step 4: Duplicate all days
      if (sourceDays && sourceDays.length > 0) {
        const dayRows = sourceDays.map((day) => ({
          plan_id: newPlan.id,
          day_number: day.day_number,
          name: day.name,
          focus: day.focus,
          exercises: day.exercises,
          notes: day.notes,
        }));

        const { error: dayInsertError } = await supabase
          .from('training_plan_days')
          .insert(dayRows);

        if (dayInsertError) {
          console.error('[TrainingPlan] Duplicate days failed:', dayInsertError);
          throw dayInsertError;
        }
      }

      console.log(`[TrainingPlan] ✅ Plan duplicated: "${newPlan.name}" (${newPlan.id})`);
      return newPlan as TrainingPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY] });
    },
  });
}


// ── Add Training Day to Active Plan ──────────────────────────────────

export interface AddTrainingPlanDayInput {
  day_number: number;
  name: string;
  focus?: string;
  exercises: PlanExercise[];
  notes?: string;
  /** Optional: pass user_id directly to avoid auth race conditions */
  user_id?: string;
}

/**
 * Add a single training day to the currently active plan.
 * Finds the active plan, inserts the day, and updates days_per_week.
 */
export function useAddTrainingPlanDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddTrainingPlanDayInput) => {
      // Resolve user
      let userId = input.user_id;
      if (!userId) {
        const { ensureFreshSession } = await import('../../../lib/refreshSession');
        userId = await ensureFreshSession();
      }

      // Step 1: Find the active plan
      const { data: activePlan, error: planError } = await supabase
        .from('training_plans')
        .select('id, days_per_week')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planError) throw planError;
      if (!activePlan) throw new Error('Kein aktiver Trainingsplan gefunden / No active training plan found');

      console.log(`[TrainingPlan] Adding day "${input.name}" to plan ${activePlan.id}`);

      // Step 2: Insert the new day
      const { error: dayError } = await supabase
        .from('training_plan_days')
        .insert({
          plan_id: activePlan.id,
          day_number: input.day_number,
          name: input.name,
          focus: input.focus,
          exercises: input.exercises,
          notes: input.notes,
        });

      if (dayError) {
        console.error('[TrainingPlan] Insert day failed:', dayError);
        throw dayError;
      }

      // Step 3: Update days_per_week on the plan
      const newDaysPerWeek = Math.max(activePlan.days_per_week ?? 0, input.day_number);
      const { error: updateError } = await supabase
        .from('training_plans')
        .update({ days_per_week: newDaysPerWeek })
        .eq('id', activePlan.id);

      if (updateError) {
        console.warn('[TrainingPlan] Update days_per_week warning:', updateError);
      }

      console.log(`[TrainingPlan] ✅ Day "${input.name}" added to plan ${activePlan.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY, 'active'] });
    },
  });
}


// ── Modify Training Day Exercises ────────────────────────────────────

export interface ModifyTrainingPlanDayInput {
  day_number: number;
  name?: string;
  focus?: string;
  exercises: PlanExercise[];
  notes?: string;
  user_id?: string;
}

/**
 * Modify a specific training day's exercises in the active plan.
 * Finds the day by day_number, updates its exercises (and optionally name/focus).
 */
export function useModifyTrainingPlanDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ModifyTrainingPlanDayInput) => {
      let userId = input.user_id;
      if (!userId) {
        const { ensureFreshSession } = await import('../../../lib/refreshSession');
        userId = await ensureFreshSession();
      }

      // Step 1: Find the active plan
      const { data: activePlan, error: planError } = await supabase
        .from('training_plans')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planError) throw planError;
      if (!activePlan) throw new Error('Kein aktiver Trainingsplan gefunden / No active training plan found');

      // Step 2: Find the day by day_number
      const { data: day, error: dayFindError } = await supabase
        .from('training_plan_days')
        .select('id')
        .eq('plan_id', activePlan.id)
        .eq('day_number', input.day_number)
        .maybeSingle();

      if (dayFindError) throw dayFindError;
      if (!day) throw new Error('Trainingstag ' + input.day_number + ' nicht gefunden / Training day ' + input.day_number + ' not found');

      // Step 3: Update the day
      const updateFields: Record<string, unknown> = { exercises: input.exercises };
      if (input.name) updateFields.name = input.name;
      if (input.focus) updateFields.focus = input.focus;
      if (input.notes !== undefined) updateFields.notes = input.notes;

      const { error: updateError } = await supabase
        .from('training_plan_days')
        .update(updateFields)
        .eq('id', day.id);

      if (updateError) {
        console.error('[TrainingPlan] Modify day failed:', updateError);
        throw updateError;
      }

      console.log('[TrainingPlan] Day ' + input.day_number + ' modified in plan ' + activePlan.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY, 'active'] });
    },
  });
}

// ── Remove Training Day from Active Plan ─────────────────────────────

export interface RemoveTrainingPlanDayInput {
  day_number: number;
  user_id?: string;
}

/**
 * Remove a specific training day from the active plan by day_number.
 */
export function useRemoveTrainingPlanDay() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RemoveTrainingPlanDayInput) => {
      let userId = input.user_id;
      if (!userId) {
        const { ensureFreshSession } = await import('../../../lib/refreshSession');
        userId = await ensureFreshSession();
      }

      // Step 1: Find the active plan
      const { data: activePlan, error: planError } = await supabase
        .from('training_plans')
        .select('id, days_per_week')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planError) throw planError;
      if (!activePlan) throw new Error('Kein aktiver Trainingsplan gefunden / No active training plan found');

      // Step 2: Find and delete the day
      const { data: day, error: dayFindError } = await supabase
        .from('training_plan_days')
        .select('id')
        .eq('plan_id', activePlan.id)
        .eq('day_number', input.day_number)
        .maybeSingle();

      if (dayFindError) throw dayFindError;
      if (!day) throw new Error('Trainingstag ' + input.day_number + ' nicht gefunden / Training day ' + input.day_number + ' not found');

      const { error: deleteError } = await supabase
        .from('training_plan_days')
        .delete()
        .eq('id', day.id);

      if (deleteError) {
        console.error('[TrainingPlan] Remove day failed:', deleteError);
        throw deleteError;
      }

      // Step 3: Decrement days_per_week
      if (activePlan.days_per_week > 1) {
        await supabase
          .from('training_plans')
          .update({ days_per_week: activePlan.days_per_week - 1 })
          .eq('id', activePlan.id);
      }

      console.log('[TrainingPlan] Day ' + input.day_number + ' removed from plan ' + activePlan.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY, 'active'] });
    },
  });
}

/**
 * useDeleteTrainingPlanDay — Delete a single training day from a plan.
 */
export function useDeleteTrainingPlanDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dayId: string) => {
      const { error } = await supabase
        .from('training_plan_days')
        .delete()
        .eq('id', dayId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY] });
    },
  });
}
