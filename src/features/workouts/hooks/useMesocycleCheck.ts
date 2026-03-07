/**
 * useMesocycleCheck — Checks if a Mesocycle Review is due.
 *
 * Calculates the current week within the mesocycle and determines
 * if a review is due based on mesocycle_weeks from review_config.
 *
 * Concept: KONZEPT_KI_TRAINER.md Block C, Mesozyklus-Review
 */

import { useMemo } from 'react';
import type { ReviewConfig } from '../../../types/health';

interface MesocycleCheckResult {
  /** Whether a review is due (current_week >= mesocycle_weeks) */
  reviewDue: boolean;
  /** Current week within the mesocycle (1-based) */
  currentWeek: number;
  /** Total mesocycle length in weeks */
  totalWeeks: number;
  /** Days until the next scheduled review (negative if overdue) */
  daysUntilReview: number;
  /** Whether the plan has review config */
  hasConfig: boolean;
}

/**
 * Check if a Mesocycle Review is due based on the plan's review_config.
 *
 * @param reviewConfig - The review_config from the active training plan
 * @returns MesocycleCheckResult with review status
 */
export function useMesocycleCheck(
  reviewConfig: ReviewConfig | undefined | null,
): MesocycleCheckResult {
  return useMemo(() => {
    if (!reviewConfig) {
      return {
        reviewDue: false,
        currentWeek: 0,
        totalWeeks: 0,
        daysUntilReview: 999,
        hasConfig: false,
      };
    }

    const totalWeeks = reviewConfig.mesocycle_weeks || 4;
    const startDate = reviewConfig.mesocycle_start
      ? new Date(reviewConfig.mesocycle_start)
      : null;

    if (!startDate) {
      return {
        reviewDue: false,
        currentWeek: reviewConfig.current_week || 1,
        totalWeeks,
        daysUntilReview: 999,
        hasConfig: true,
      };
    }

    // Calculate current week based on mesocycle_start
    const now = new Date();
    const daysSinceStart = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const currentWeek = Math.max(1, Math.floor(daysSinceStart / 7) + 1);

    // Days until review (mesocycle_weeks × 7 - daysSinceStart)
    const totalDays = totalWeeks * 7;
    const daysUntilReview = totalDays - daysSinceStart;

    // Review is due when current_week >= mesocycle_weeks
    const reviewDue = currentWeek >= totalWeeks;

    return {
      reviewDue,
      currentWeek: Math.min(currentWeek, totalWeeks + 1), // Cap at totalWeeks+1 for display
      totalWeeks,
      daysUntilReview,
      hasConfig: true,
    };
  }, [
    reviewConfig?.mesocycle_weeks,
    reviewConfig?.mesocycle_start,
    reviewConfig?.current_week,
  ]);
}
