/**
 * OnboardingGuard — Redirects new users to /onboarding if profile is incomplete.
 *
 * Wraps protected routes that should only be accessible after onboarding.
 * Checks useOnboarding() and redirects to /onboarding if needsOnboarding is true.
 * Skips the check if user is already on /onboarding to avoid redirect loops.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useProfile } from '../../features/auth/hooks/useProfile';
import { useLatestBodyMeasurement } from '../../features/body/hooks/useBodyMeasurements';
import { useOnboarding } from '../../features/buddy/hooks/useOnboarding';
import type { ReactNode } from 'react';

interface OnboardingGuardProps {
  children: ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: latestBody, isLoading: bodyLoading } = useLatestBodyMeasurement();
  const location = useLocation();
  const { needsOnboarding } = useOnboarding(profile ?? null, latestBody);

  // Don't redirect while data is loading
  if (profileLoading || bodyLoading) return null;

  // Redirect to onboarding if profile is incomplete
  // Skip if already on /onboarding (avoid redirect loop)
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
