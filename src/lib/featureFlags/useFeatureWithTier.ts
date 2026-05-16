/**
 * useFeatureWithTier — Feature-Flag + Plan-Tier-Check kombiniert (Phase 3 / PL4).
 *
 * Liefert nicht nur `enabled: boolean`, sondern auch:
 *  - `reason`: warum nicht? ('flag_off' | 'tier_required')
 *  - `requiredTier`: ab welchem Plan die Funktion verfuegbar ist
 *
 * UI nutzt das fuer Upsell-Hints: "Diese Funktion ist Teil von Pro."
 *
 * Default-Verhalten:
 *  - Flag ohne `minTier` → wie bisher (nur flag.enabled)
 *  - Flag mit `minTier: 'pro'` → enabled NUR wenn user.tier >= 'pro'
 */

import { useFeatureFlags } from './FeatureFlagProvider';
import { useSubscription, type PlanTier } from '../../features/billing/hooks/useSubscription';
import { DEFAULT_FLAGS } from './flags';

const TIER_RANK: Record<PlanTier, number> = { free: 0, pro: 1, elite: 2 };

export type FeatureGateReason = 'ok' | 'flag_off' | 'tier_required';

export interface FeatureGateResult {
  /** True iff the user can use this feature right now. */
  enabled: boolean;
  /** Why not? ('ok' wenn enabled=true) */
  reason: FeatureGateReason;
  /** Minimum tier required (for upsell-UI). */
  requiredTier: PlanTier;
  /** Current user tier. */
  currentTier: PlanTier;
}

export function useFeatureWithTier(flagId: string): FeatureGateResult {
  const { isEnabled } = useFeatureFlags();
  const { tier } = useSubscription();

  const flagDef = DEFAULT_FLAGS[flagId];
  const requiredTier: PlanTier = flagDef?.minTier ?? 'free';
  const flagOn = isEnabled(flagId);

  if (!flagOn) {
    return { enabled: false, reason: 'flag_off', requiredTier, currentTier: tier };
  }

  if (TIER_RANK[tier] < TIER_RANK[requiredTier]) {
    return { enabled: false, reason: 'tier_required', requiredTier, currentTier: tier };
  }

  return { enabled: true, reason: 'ok', requiredTier, currentTier: tier };
}
