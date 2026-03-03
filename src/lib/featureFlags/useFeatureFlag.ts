/**
 * useFeatureFlag — Hook to check if a specific feature flag is enabled.
 *
 * Usage:
 *   const isEnabled = useFeatureFlag('barcode_scanner');
 */

import { useFeatureFlags } from './FeatureFlagProvider';

export function useFeatureFlag(flagId: string): boolean {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flagId);
}
