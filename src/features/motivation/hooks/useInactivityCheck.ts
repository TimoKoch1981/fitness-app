/**
 * useInactivityCheck — Detects user inactivity (no meals or workouts for 3+ days)
 * and provides a motivational message for re-engagement.
 *
 * Builds on the existing useGapDetection hook but with a higher threshold
 * and integrated motivation message selection.
 */

import { useState, useCallback, useMemo } from 'react';
import { useGapDetection } from '../../../shared/hooks/useGapDetection';
import { pickMotivationMessage, getTierKey } from '../utils/motivationMessages';
import type { MotivationMessage } from '../utils/motivationMessages';

const INACTIVITY_THRESHOLD = 3;
const DISMISS_STORAGE_KEY = 'fitbuddy_motivation_dismissed';

/**
 * Checks whether the dismiss timestamp is still valid (same calendar day).
 */
function isDismissedToday(): boolean {
  try {
    const stored = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!stored) return false;
    const dismissedDate = new Date(stored).toISOString().split('T')[0];
    const todayDate = new Date().toISOString().split('T')[0];
    return dismissedDate === todayDate;
  } catch {
    return false;
  }
}

export interface InactivityCheckResult {
  /** Number of days since the user last logged any activity (meal or workout) */
  daysSinceLastActivity: number | null;
  /** Whether the user is considered inactive (>= 3 days) */
  isInactive: boolean;
  /** Motivation message to show (null when not inactive or dismissed) */
  motivationMessage: MotivationMessage | null;
  /** Current tier for styling: 'gentle' | 'supportive' | 'reengagement' */
  tier: 'gentle' | 'supportive' | 'reengagement' | null;
  /** Dismiss the motivation banner (saves to localStorage, reappears next day) */
  dismissMotivation: () => void;
  /** Whether the banner is currently dismissed */
  isDismissed: boolean;
  /** Whether data is still loading */
  isLoading: boolean;
}

/**
 * Pure helper to calculate days since last activity from gap detection data.
 */
export function calculateDaysSinceLastActivity(
  mealGapDays: number | null,
  workoutGapDays: number | null
): number | null {
  if (mealGapDays === null && workoutGapDays === null) return null;
  if (mealGapDays === null) return workoutGapDays;
  if (workoutGapDays === null) return mealGapDays;
  return Math.min(mealGapDays, workoutGapDays);
}

export function useInactivityCheck(): InactivityCheckResult {
  const { mealGapDays, workoutGapDays, isLoading } = useGapDetection(INACTIVITY_THRESHOLD);
  const [dismissed, setDismissed] = useState(() => isDismissedToday());

  const daysSinceLastActivity = useMemo(
    () => calculateDaysSinceLastActivity(mealGapDays, workoutGapDays),
    [mealGapDays, workoutGapDays]
  );

  const isInactive = daysSinceLastActivity !== null && daysSinceLastActivity >= INACTIVITY_THRESHOLD;

  const motivationMessage = useMemo(() => {
    if (!isInactive || dismissed) return null;
    return pickMotivationMessage(daysSinceLastActivity!);
  }, [isInactive, dismissed, daysSinceLastActivity]);

  const tier = useMemo(() => {
    if (!isInactive) return null;
    return getTierKey(daysSinceLastActivity!);
  }, [isInactive, daysSinceLastActivity]);

  const dismissMotivation = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, new Date().toISOString());
    } catch {
      // localStorage may be unavailable
    }
    setDismissed(true);
  }, []);

  return {
    daysSinceLastActivity,
    isInactive,
    motivationMessage,
    tier,
    dismissMotivation,
    isDismissed: dismissed,
    isLoading,
  };
}
