/**
 * FeatureGate — Conditional rendering based on feature flags.
 *
 * Usage:
 *   <FeatureGate flag="barcode_scanner">
 *     <BarcodeScanner />
 *   </FeatureGate>
 *
 *   <FeatureGate flag="social_features" fallback={<ComingSoon />}>
 *     <SocialFeed />
 *   </FeatureGate>
 */

import type { ReactNode } from 'react';
import { useFeatureFlag } from './useFeatureFlag';

interface FeatureGateProps {
  /** The feature flag ID to check */
  flag: string;
  /** Content to render when the flag is enabled */
  children: ReactNode;
  /** Optional fallback when the flag is disabled */
  fallback?: ReactNode;
}

export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const isEnabled = useFeatureFlag(flag);
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}
