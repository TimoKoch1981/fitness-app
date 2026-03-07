/**
 * usePEDPhaseSync — Synchronizes ReviewConfig with PED cycle phase changes.
 *
 * When the user's cycle_status changes (blast → cruise → pct → off),
 * the review_config (mesocycle_weeks, deload_week) should auto-adjust
 * to match the new training requirements.
 *
 * Only active for Power+ mode plans with ai_supervised=true.
 * Concept: KONZEPT_KI_TRAINER.md Block C, PED-Phasen-Sync
 */

import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useProfile } from '../../auth/hooks/useProfile';
import { useActivePlan } from './useTrainingPlans';
import { getSmartPreset } from './useCalibration';
import type { ReviewConfig } from '../../../types/health';

/**
 * Hook that monitors cycle_status changes and syncs review_config accordingly.
 * Should be mounted on TrainingPage or TrainingPlanView.
 */
export function usePEDPhaseSync() {
  const { data: profile } = useProfile();
  const { data: activePlan } = useActivePlan();
  const queryClient = useQueryClient();
  const lastSyncedPhase = useRef<string | null>(null);

  const syncMutation = useMutation({
    mutationFn: async ({ planId, updatedConfig }: { planId: string; updatedConfig: Partial<ReviewConfig> }) => {
      // Read current review_config first
      const { data: plan, error: readError } = await supabase
        .from('training_plans')
        .select('review_config')
        .eq('id', planId)
        .single();

      if (readError || !plan) throw readError ?? new Error('Plan not found');

      const currentConfig = (plan.review_config ?? {}) as Partial<ReviewConfig>;
      const mergedConfig: Partial<ReviewConfig> = {
        ...currentConfig,
        ...updatedConfig,
        // Reset mesocycle on phase change
        current_week: 1,
        mesocycle_start: new Date().toISOString().split('T')[0],
      };

      const { error } = await supabase
        .from('training_plans')
        .update({ review_config: mergedConfig })
        .eq('id', planId);

      if (error) throw error;
      return mergedConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training_plans'] });
    },
  });

  useEffect(() => {
    if (!profile || !activePlan) return;

    // Only for Power+ mode, ai_supervised plans
    if (profile.training_mode !== 'power_plus') return;
    if (!activePlan.ai_supervised) return;

    const currentPhase = profile.cycle_status;
    if (!currentPhase) return;

    // Don't sync if phase hasn't changed
    if (lastSyncedPhase.current === currentPhase) return;

    // First mount: just record the current phase, don't sync
    if (lastSyncedPhase.current === null) {
      lastSyncedPhase.current = currentPhase;
      return;
    }

    // Phase changed! Calculate new preset
    const experienceLevel = activePlan.review_config?.experience_level ?? 'intermediate';
    const newPreset = getSmartPreset(experienceLevel, 'power_plus', currentPhase);

    const currentConfig = activePlan.review_config;
    const needsUpdate =
      currentConfig?.mesocycle_weeks !== newPreset.mesocycle_weeks ||
      currentConfig?.deload_week !== newPreset.deload_week;

    if (needsUpdate) {
      syncMutation.mutate({
        planId: activePlan.id,
        updatedConfig: {
          mesocycle_weeks: newPreset.mesocycle_weeks,
          deload_week: newPreset.deload_week,
        },
      });
    }

    lastSyncedPhase.current = currentPhase;
  }, [profile?.cycle_status, activePlan?.id, activePlan?.ai_supervised]);

  return {
    isSyncing: syncMutation.isPending,
    lastSyncedPhase: lastSyncedPhase.current,
  };
}
