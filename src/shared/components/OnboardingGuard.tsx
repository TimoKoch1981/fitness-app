/**
 * OnboardingGuard — Redirects new users to /onboarding if profile is incomplete.
 *
 * Wraps protected routes that should only be accessible after onboarding.
 * Checks useOnboarding() and redirects to /onboarding if needsOnboarding is true.
 * Skips the check if user is already on /onboarding to avoid redirect loops.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { useProfile } from '../../features/auth/hooks/useProfile';
import { useLatestBodyMeasurement } from '../../features/body/hooks/useBodyMeasurements';
import { useOnboarding } from '../../features/buddy/hooks/useOnboarding';
import type { ReactNode } from 'react';

interface OnboardingGuardProps {
  children: ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading, isFetched: profileFetched } = useProfile();
  const { data: latestBody, isLoading: bodyLoading, isFetched: bodyFetched } = useLatestBodyMeasurement();
  const location = useLocation();
  const { needsOnboarding } = useOnboarding(profile ?? null, latestBody);

  // v14.10: stronger gates than before. The previous guard only checked
  // `isLoading` from each query, but with the new `enabled: !authLoading &&
  // !!user` queries report `isLoading: false` BEFORE they've ever run if auth
  // isn't ready yet — so the guard would fire on an empty profile and bounce
  // the user to /onboarding. Now we wait until auth is settled AND both
  // queries have actually fetched at least once.
  if (authLoading) return null;
  if (!user) return null; // ProtectedRoute upstream handles redirect to /login
  if (profileLoading || bodyLoading) return null;
  if (!profileFetched || !bodyFetched) return null;

  // Redirect to onboarding if profile is incomplete
  // Skip if already on /onboarding (avoid redirect loop)
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
