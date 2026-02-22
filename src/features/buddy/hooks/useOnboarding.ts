/**
 * Onboarding Hook — detects new users and manages onboarding state.
 *
 * A user is considered "new" when their profile lacks essential data
 * (height, birth_date, gender). The onboarding flow is entirely
 * conversational — the Buddy asks questions and saves via actions.
 *
 * State:
 * - needsOnboarding: true when profile is incomplete
 * - onboardingComplete: true after user has provided enough data
 * - onboardingGreeting: the first message the buddy should show
 */

import { useMemo } from 'react';
import type { UserProfile, BodyMeasurement } from '../../../types/health';

export interface OnboardingState {
  /** Whether the user needs onboarding (incomplete profile) */
  needsOnboarding: boolean;
  /** Whether onboarding is complete (profile has enough data) */
  onboardingComplete: boolean;
  /** Specific missing fields for context */
  missingFields: string[];
}

/**
 * Check if a user needs conversational onboarding.
 *
 * Criteria for "needs onboarding":
 * - No height set (height_cm is null or 0)
 * - No birth date / birth year
 * - No gender set
 *
 * If ANY of these are missing, the buddy enters onboarding mode.
 */
export function useOnboarding(
  profile: UserProfile | null | undefined,
  latestBody?: BodyMeasurement | null,
): OnboardingState {
  return useMemo(() => {
    // No profile at all = definitely needs onboarding
    if (!profile) {
      return {
        needsOnboarding: true,
        onboardingComplete: false,
        missingFields: ['height', 'birth_date', 'gender', 'weight'],
      };
    }

    const missing: string[] = [];

    if (!profile.height_cm || profile.height_cm === 0) {
      missing.push('height');
    }

    if (!profile.birth_date) {
      missing.push('birth_date');
    }

    if (!profile.gender) {
      missing.push('gender');
    }

    // Weight is needed for BMR/BMI/goal calculations
    if (!latestBody?.weight_kg) {
      missing.push('weight');
    }

    return {
      needsOnboarding: missing.length > 0,
      onboardingComplete: missing.length === 0,
      missingFields: missing,
    };
  }, [profile, latestBody]);
}
