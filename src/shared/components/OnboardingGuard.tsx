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
  const {
    data: profile,
    isLoading: profileLoading,
    isFetched: profileFetched,
    isError: profileError,
  } = useProfile();
  const {
    data: latestBody,
    isLoading: bodyLoading,
    isFetched: bodyFetched,
    isError: bodyError,
  } = useLatestBodyMeasurement();
  const location = useLocation();
  const { needsOnboarding } = useOnboarding(profile ?? null, latestBody);

  // v14.10: gate on `isFetched` so we don't bounce users while queries are
  // still pending.
  // v14.13: gate ALSO on `isError`. If the profile fetch transiently fails
  // (network blip, cold-start race, brief 5xx), `isFetched` becomes true but
  // `data` stays undefined. `useOnboarding(undefined)` then reports
  // `needsOnboarding=true` and the guard kicks the user to /onboarding —
  // which is exactly the "Timo gets onboarding every login" symptom.
  // Treat error as "not ready yet" and render nothing; the next render
  // (or a retry) will resolve properly.
  if (authLoading) return null;
  if (!user) return null; // ProtectedRoute upstream handles redirect to /login
  if (profileLoading || bodyLoading) return null;
  if (!profileFetched || !bodyFetched) return null;
  if (profileError || bodyError) return null;

  // Belt-and-suspenders: `profile` should never be `undefined` at this point
  // (isFetched=true + isError=false ⇒ data is either a row or null), but the
  // hook signature allows undefined, so we treat it as "still loading" to
  // avoid a false-positive redirect.
  if (profile === undefined) return null;

  // Redirect to onboarding if profile is incomplete
  // Skip if already on /onboarding (avoid redirect loop)
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
