/**
 * useSubscription — Plan-Tier-Status fuer aktuellen User.
 *
 * Datenfluss:
 *   Stripe-Webhook → subscriptions table → dieser Hook → Feature-Gating
 *
 * Free-Tier: User ohne aktive subscription oder mit status != active/trialing.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../app/providers/AuthProvider';

export type PlanTier = 'free' | 'pro' | 'elite';

export interface Subscription {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  plan_tier: PlanTier;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
}

export interface SubscriptionState {
  tier: PlanTier;
  isActive: boolean;
  isTrialing: boolean;
  willCancel: boolean;
  subscription: Subscription | null;
  isLoading: boolean;
}

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<Subscription | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.warn('[useSubscription] fetch error:', error);
        return null;
      }
      return data as Subscription | null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 min — subscription changes are rare
  });

  const sub = data ?? null;
  const isActiveStatus = sub?.status === 'active' || sub?.status === 'trialing';

  return {
    tier: isActiveStatus ? (sub?.plan_tier ?? 'free') : 'free',
    isActive: isActiveStatus,
    isTrialing: sub?.status === 'trialing',
    willCancel: sub?.cancel_at_period_end ?? false,
    subscription: sub,
    isLoading,
  };
}

/**
 * Helper: check if a feature is enabled for the user's tier.
 *
 * Beispiel:
 *   const { canUse } = useTierFeatures();
 *   if (canUse('ai_unlimited_chats')) { ... }
 */
export type TierFeatureKey =
  | 'ai_unlimited_chats'    // pro+
  | 'export_pdf'            // pro+
  | 'multi_device_sync'     // pro+
  | 'priority_support'      // elite
  | 'beta_features';        // elite

const FEATURE_TIER_MIN: Record<TierFeatureKey, PlanTier> = {
  ai_unlimited_chats: 'pro',
  export_pdf: 'pro',
  multi_device_sync: 'pro',
  priority_support: 'elite',
  beta_features: 'elite',
};

const TIER_RANK: Record<PlanTier, number> = { free: 0, pro: 1, elite: 2 };

export function useTierFeatures() {
  const { tier } = useSubscription();
  return {
    tier,
    canUse(feature: TierFeatureKey): boolean {
      return TIER_RANK[tier] >= TIER_RANK[FEATURE_TIER_MIN[feature]];
    },
    requiredTier(feature: TierFeatureKey): PlanTier {
      return FEATURE_TIER_MIN[feature];
    },
  };
}
