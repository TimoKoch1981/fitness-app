import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { TrainingPlan, TrainingPlanDay, SplitType, PlanExercise } from '../../../types/health';

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
}

/**
 * Add a new training plan (3-step: deactivate old → insert plan → insert days).
 */
export function useAddTrainingPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddTrainingPlanInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Step 1: Deactivate all existing plans
      await supabase
        .from('training_plans')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Step 2: Insert the new plan
      const { data: plan, error: planError } = await supabase
        .from('training_plans')
        .insert({
          user_id: user.id,
          name: input.name,
          split_type: input.split_type,
          days_per_week: input.days_per_week,
          is_active: true,
          notes: input.notes,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Step 3: Insert all days (bulk)
      const dayRows = input.days.map((day) => ({
        plan_id: plan.id,
        day_number: day.day_number,
        name: day.name,
        focus: day.focus,
        exercises: day.exercises,
        notes: day.notes,
      }));

      const { error: daysError } = await supabase
        .from('training_plan_days')
        .insert(dayRows);

      if (daysError) throw daysError;

      return plan as TrainingPlan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PLANS_KEY] });
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
