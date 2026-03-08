/**
 * useDraftWorkout — Periodic draft saving & resume detection for workouts.
 *
 * Saves in-progress workout state to the DB every ~60s so interrupted
 * sessions can be resumed. Provides hooks for checking if a draft exists
 * for a given plan day.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { today } from '../../../lib/utils';
import type { Workout } from '../../../types/health';
import type { ActiveWorkoutState } from '../context/ActiveWorkoutContext';

const DRAFT_KEY = 'workouts_draft';

/**
 * Check if there's an in-progress workout for a specific plan day.
 * Used to show "Resume" button on plan day cards.
 */
export function useInProgressWorkout(planDayId: string | undefined) {
  return useQuery({
    queryKey: [DRAFT_KEY, planDayId],
    enabled: !!planDayId,
    staleTime: 30_000, // 30s cache
    queryFn: async (): Promise<Workout | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_day_id', planDayId!)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return (data as Workout) ?? null;
    },
  });
}

/**
 * Check if there's ANY in-progress workout for the current user.
 * Used to show a global "Resume" hint on the training page.
 */
export function useAnyInProgressWorkout() {
  return useQuery({
    queryKey: [DRAFT_KEY, 'any'],
    staleTime: 30_000,
    queryFn: async (): Promise<Workout | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return (data as Workout) ?? null;
    },
  });
}

/**
 * Save or update an in-progress workout draft.
 * Fire-and-forget — used periodically during active session.
 */
export function useSaveDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      session: ActiveWorkoutState;
      userId: string;
    }) => {
      const { session, userId } = input;
      if (!session.planDayId) return; // Can't draft without plan day

      // Check if draft already exists
      const { data: existing } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', userId)
        .eq('plan_day_id', session.planDayId)
        .eq('status', 'in_progress')
        .maybeSingle();

      const workoutData = {
        session_exercises: session.exercises,
        warmup: session.warmup,
      };

      if (existing) {
        // Update existing draft
        await supabase
          .from('workouts')
          .update(workoutData)
          .eq('id', existing.id);
      } else {
        // Create new draft
        await supabase
          .from('workouts')
          .insert({
            user_id: userId,
            date: today(),
            name: session.planDayName || 'Workout',
            type: 'strength',
            plan_id: session.planId || null,
            plan_day_id: session.planDayId,
            plan_day_number: session.planDayNumber ?? 0,
            session_exercises: session.exercises,
            warmup: session.warmup,
            started_at: session.startedAt,
            status: 'in_progress',
          });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRAFT_KEY] });
    },
  });
}

/**
 * Mark a draft as aborted (user chose "Start Fresh").
 */
export function useAbortDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workoutId: string) => {
      await supabase
        .from('workouts')
        .update({ status: 'aborted', finished_at: new Date().toISOString() })
        .eq('id', workoutId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRAFT_KEY] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

/**
 * Complete a draft — upgrade in_progress → completed.
 * Used by useSaveWorkoutSession when draft exists.
 */
export function useCompleteDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      workoutId: string;
      data: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('workouts')
        .update({ ...input.data, status: 'completed' })
        .eq('id', input.workoutId)
        .select()
        .single();

      if (error) throw error;
      return data as Workout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [DRAFT_KEY] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout_history'] });
    },
  });
}
