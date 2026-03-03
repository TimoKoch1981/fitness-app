/**
 * Feature flag type definitions.
 */

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
}

export type FeatureFlagConfig = Record<string, FeatureFlag>;
