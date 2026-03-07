/**
 * useAISupervisedOffer — Buddy-Nachfrage: KI-Trainer Angebot
 *
 * Prueft ob dem User angeboten werden soll, den Plan als KI-Trainer zu begleiten.
 * Bedingungen:
 * - Plan existiert und ist NICHT ai_supervised
 * - Profil hat ai_trainer_enabled === true
 * - Noch nicht abgelehnt (localStorage Flag pro Plan)
 *
 * Konzept: KONZEPT_KI_TRAINER.md Block D, Buddy-Nachfrage
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { TrainingPlan } from '../../../types/health';

const OFFER_DISMISSED_PREFIX = 'fitbuddy_ai_offer_dismissed_';

interface AISupervisedOfferResult {
  /** Whether to show the AI trainer offer banner */
  shouldOffer: boolean;
  /** Accept the offer: set ai_supervised=true on the plan */
  acceptOffer: () => void;
  /** Dismiss the offer: set localStorage flag */
  dismissOffer: () => void;
  /** Whether the accept mutation is pending */
  isAccepting: boolean;
}

export function useAISupervisedOffer(
  plan: TrainingPlan | null | undefined,
  aiTrainerEnabled: boolean | undefined,
): AISupervisedOfferResult {
  const queryClient = useQueryClient();

  const shouldOffer = useMemo(() => {
    if (!plan) return false;
    // Already supervised
    if (plan.ai_supervised) return false;
    // User hasn't enabled AI trainer in profile
    if (!aiTrainerEnabled) return false;
    // Already dismissed for this plan
    const dismissed = localStorage.getItem(`${OFFER_DISMISSED_PREFIX}${plan.id}`);
    if (dismissed) return false;
    return true;
  }, [plan?.id, plan?.ai_supervised, aiTrainerEnabled]);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!plan) throw new Error('No plan');
      const { error } = await supabase
        .from('training_plans')
        .update({ ai_supervised: true })
        .eq('id', plan.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training_plans'] });
    },
  });

  const dismissOffer = () => {
    if (plan) {
      localStorage.setItem(`${OFFER_DISMISSED_PREFIX}${plan.id}`, 'true');
    }
  };

  return {
    shouldOffer,
    acceptOffer: () => acceptMutation.mutate(),
    dismissOffer,
    isAccepting: acceptMutation.isPending,
  };
}
