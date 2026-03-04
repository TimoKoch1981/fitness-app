/**
 * useGuidedTour — Hook to manage the guided product tour state.
 *
 * Checks localStorage for tour completion and onboarding-just-completed flag.
 * Provides `shouldShowTour`, `completeTour()`, and `skipTour()`.
 */

import { useState, useCallback, useEffect } from 'react';

const TOUR_COMPLETED_KEY = 'fitbuddy_guided_tour_completed';
const ONBOARDING_JUST_COMPLETED_KEY = 'fitbuddy_onboarding_just_completed';

function isTourCompleted(): boolean {
  try {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
  } catch {
    return false;
  }
}

function didJustCompleteOnboarding(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_JUST_COMPLETED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markOnboardingJustCompleted(): void {
  try {
    localStorage.setItem(ONBOARDING_JUST_COMPLETED_KEY, 'true');
  } catch {
    // localStorage not available
  }
}

function clearOnboardingFlag(): void {
  try {
    localStorage.removeItem(ONBOARDING_JUST_COMPLETED_KEY);
  } catch {
    // localStorage not available
  }
}

function markTourCompleted(): void {
  try {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
  } catch {
    // localStorage not available
  }
}

/** Reset tour state so it can be restarted (e.g. from Profile page or Buddy chat). */
export function resetTourState(): void {
  try {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    localStorage.setItem(ONBOARDING_JUST_COMPLETED_KEY, 'true');
  } catch {
    // localStorage not available
  }
}

export function useGuidedTour() {
  const [shouldShowTour, setShouldShowTour] = useState(false);

  useEffect(() => {
    // Show the tour only if:
    // 1. The tour has not been completed yet
    // 2. The user just came from onboarding
    if (!isTourCompleted() && didJustCompleteOnboarding()) {
      setShouldShowTour(true);
    }
  }, []);

  const completeTour = useCallback(() => {
    markTourCompleted();
    clearOnboardingFlag();
    setShouldShowTour(false);
  }, []);

  const skipTour = useCallback(() => {
    markTourCompleted();
    clearOnboardingFlag();
    setShouldShowTour(false);
  }, []);

  const restartTour = useCallback(() => {
    resetTourState();
    setShouldShowTour(true);
  }, []);

  return { shouldShowTour, completeTour, skipTour, restartTour };
}
