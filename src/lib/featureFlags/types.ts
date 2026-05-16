/**
 * Feature flag type definitions.
 */

import type { PlanTier } from '../../features/billing/hooks/useSubscription';

export interface FeatureFlag {
  /** Unique identifier for the flag */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what the flag controls */
  description: string;
  /** Whether the feature is enabled */
  enabled: boolean;
  /** Optional: enable only for specific user IDs */
  enabledForUsers?: string[];
  /** Optional: percentage rollout (0-100) */
  percentage?: number;
  /**
   * Phase 3 / PL4: minimum plan tier required to use this feature.
   * Default 'free' = available to everyone. 'pro' = requires Pro subscription.
   * Free-Tier-Users see an upsell-hint when trying to use 'pro'+ features.
   */
  minTier?: PlanTier;
}

export type FeatureFlagConfig = Record<string, FeatureFlag>;
