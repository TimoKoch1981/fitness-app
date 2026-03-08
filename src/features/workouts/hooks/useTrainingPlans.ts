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
 * Load all training plans (without days) for listing.
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
      // Use provided user_id (avoids auth race), fallback to getUser()
      let userId = input.user_id;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        userId = user.id;
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
    },
  });
}
