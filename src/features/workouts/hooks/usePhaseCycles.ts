/**
 * Hooks for training phase cycles (CRUD + auto-advance logic).
 * Pattern: TanStack Query + Supabase, identical to other hooks.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useUpdateProfile } from '../../auth/hooks/useProfile';
import type { TrainingPhaseCycle, CyclePhaseEntry } from '../types/phaseCycle';

const QUERY_KEY = 'training_phase_cycles';

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** Fetch all phase cycles for the current user */
export function usePhaseCycles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('training_phase_cycles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as TrainingPhaseCycle[];
    },
    enabled: !!user,
  });
}

/** Get the active cycle (if any) */
export function useActivePhaseCycle() {
  const { data: cycles, ...rest } = usePhaseCycles();
  const activeCycle = cycles?.find((c) => c.is_active) ?? null;
  return { data: activeCycle, ...rest };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export function useCreatePhaseCycle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      phases: CyclePhaseEntry[];
      auto_repeat: boolean;
      template_name?: string;
      activate?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // If activating, deactivate any existing active cycle first
      if (input.activate) {
        await supabase
          .from('training_phase_cycles')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('is_active', true);
      }

      const { data, error } = await supabase
        .from('training_phase_cycles')
        .insert({
          user_id: user.id,
          name: input.name,
          phases: input.phases,
          auto_repeat: input.auto_repeat,
          is_active: input.activate ?? false,
          current_phase_index: 0,
          template_name: input.template_name ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TrainingPhaseCycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export function useUpdatePhaseCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      phases?: CyclePhaseEntry[];
      auto_repeat?: boolean;
      current_phase_index?: number;
    }) => {
      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name;
      if (input.phases !== undefined) updates.phases = input.phases;
      if (input.auto_repeat !== undefined) updates.auto_repeat = input.auto_repeat;
      if (input.current_phase_index !== undefined) updates.current_phase_index = input.current_phase_index;

      const { data, error } = await supabase
        .from('training_phase_cycles')
        .update(updates)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data as TrainingPhaseCycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ---------------------------------------------------------------------------
// Activate / Deactivate
// ---------------------------------------------------------------------------

export function useActivatePhaseCycle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();

  return useMutation({
    mutationFn: async (cycleId: string) => {
      if (!user) throw new Error('Not authenticated');

      // Deactivate all
      await supabase
        .from('training_phase_cycles')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Activate selected
      const { data, error } = await supabase
        .from('training_phase_cycles')
        .update({ is_active: true, current_phase_index: 0 })
        .eq('id', cycleId)
        .select()
        .single();

      if (error) throw error;

      const cycle = data as TrainingPhaseCycle;

      // Set the first phase on the user profile
      if (cycle.phases.length > 0) {
        const firstPhase = cycle.phases[0];
        await updateProfile.mutateAsync({
          current_phase: firstPhase.phase,
          phase_started_at: new Date().toISOString(),
          phase_target_weeks: firstPhase.weeks || undefined,
        });
      }

      return cycle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

export function useDeactivatePhaseCycle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      await supabase
        .from('training_phase_cycles')
        .update({ is_active: false })
        .eq('user_id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ---------------------------------------------------------------------------
// Advance to next phase
// ---------------------------------------------------------------------------

export function useAdvancePhase() {
  const queryClient = useQueryClient();
  const updateProfile = useUpdateProfile();

  return useMutation({
    mutationFn: async (cycle: TrainingPhaseCycle) => {
      const nextIndex = cycle.current_phase_index + 1;

      // Check if we've reached the end
      if (nextIndex >= cycle.phases.length) {
        if (cycle.auto_repeat) {
          // Loop back to start
          const { error } = await supabase
            .from('training_phase_cycles')
            .update({ current_phase_index: 0 })
            .eq('id', cycle.id);
          if (error) throw error;

          const firstPhase = cycle.phases[0];
          await updateProfile.mutateAsync({
            current_phase: firstPhase.phase,
            phase_started_at: new Date().toISOString(),
            phase_target_weeks: firstPhase.weeks || undefined,
          });
          return { looped: true, phaseIndex: 0 };
        } else {
          // Cycle complete — deactivate
          const { error } = await supabase
            .from('training_phase_cycles')
            .update({ is_active: false })
            .eq('id', cycle.id);
          if (error) throw error;
          return { completed: true, phaseIndex: nextIndex };
        }
      }

      // Normal advance
      const { error } = await supabase
        .from('training_phase_cycles')
        .update({ current_phase_index: nextIndex })
        .eq('id', cycle.id);
      if (error) throw error;

      const nextPhase = cycle.phases[nextIndex];
      await updateProfile.mutateAsync({
        current_phase: nextPhase.phase,
        phase_started_at: new Date().toISOString(),
        phase_target_weeks: nextPhase.weeks || undefined,
      });

      return { phaseIndex: nextIndex };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

export function useDeletePhaseCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('training_phase_cycles')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
