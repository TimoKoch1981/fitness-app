/**
 * Hook for accessing gender-based feature visibility flags.
 * Controls which features are shown based on the user's gender:
 * - female: Menstrual cycle tracker, symptom tracker, breastfeeding, RED-S
 * - male: Prostate markers (PSA >40), male testosterone reference ranges
 * - other: ALL features visible — user selects what's relevant
 *
 * Pattern: Same as useTrainingMode() — returns feature flags from profile.
 *
 * @version 1.0.0
 */

import { useProfile } from '../../features/auth/hooks/useProfile';
import type { Gender } from '../../types/health';

export interface GenderFeatureFlags {
  /** Current gender setting (undefined = not set yet) */
  gender: Gender | undefined;

  /** Whether gender has been set in the profile */
  isGenderSet: boolean;

  // === Female-specific features ===
  /** Show menstrual cycle tracker (Follicular/Luteal/Menstruation phases) */
  showCycleTracker: boolean;
  /** Show symptom tracker (hot flashes, mood, perimenopause) */
  showSymptomTracker: boolean;
  /** Show RED-S warning for aggressive caloric deficits in women */
  showREDSWarning: boolean;
  /** Show breastfeeding TDEE adjustment toggle (+300-500 kcal) */
  showBreastfeedingToggle: boolean;
  /** Show diastasis recti option in health restrictions */
  showDiastasisRecti: boolean;

  // === Male-specific features ===
  /** Show prostate markers (PSA) — relevant for men >40 */
  showProstateMarkers: boolean;
  /** Use male testosterone reference ranges */
  useMaleTestosteroneRef: boolean;

  // === Convenience booleans ===
  /** Is female (or other with all features) */
  isFemaleOrOther: boolean;
  /** Is male (or other with all features) */
  isMaleOrOther: boolean;
}

export function useGenderFeatures(): GenderFeatureFlags {
  const { data: profile } = useProfile();

  const gender = profile?.gender;
  const isGenderSet = gender !== undefined && gender !== null;

  const isFemale = gender === 'female';
  const isMale = gender === 'male';
  const isOther = gender === 'other';

  // 'other' gets ALL features — user decides what's relevant
  const isFemaleOrOther = isFemale || isOther;
  const isMaleOrOther = isMale || isOther;

  // Calculate age for prostate marker visibility (>40)
  let age: number | null = null;
  if (profile?.birth_date) {
    const birth = new Date(profile.birth_date);
    const today = new Date();
    age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
  }

  return {
    gender,
    isGenderSet,

    // Female features — visible for female + other
    showCycleTracker: isFemaleOrOther,
    showSymptomTracker: isFemaleOrOther,
    showREDSWarning: isFemaleOrOther,
    showBreastfeedingToggle: isFemale, // Only biological female (not 'other')
    showDiastasisRecti: isFemaleOrOther,

    // Male features — visible for male + other (PSA only >40)
    showProstateMarkers: isMaleOrOther && (age === null || age >= 40),
    useMaleTestosteroneRef: isMaleOrOther,

    // Convenience
    isFemaleOrOther,
    isMaleOrOther,
  };
}
