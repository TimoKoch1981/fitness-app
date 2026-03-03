/**
 * useBadges — Evaluates badge conditions and returns earned badges.
 *
 * Uses streak data and activity counts from useStreaks to determine
 * which of the 12 badges the user has earned.
 */

import { useMemo } from 'react';
import { useStreaks, useActivityCounts } from './useStreaks';
import type { Badge } from '../types';

/** Badge definition with its earning condition. */
interface BadgeDefinition {
  id: string;
  icon: string;
  nameKey: string;
  descriptionKey: string;
  /** Returns true if the badge is earned given the activity stats. */
  condition: (stats: BadgeStats) => boolean;
}

export interface BadgeStats {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  totalMealDays: number;
  totalWorkouts: number;
  totalBodyMeasurements: number;
}

/** All 12 badge definitions. Exported for testing. */
export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_day',
    icon: '\u{1F525}', // fire
    nameKey: 'gamification.badge_first_day',
    descriptionKey: 'gamification.badge_first_day_desc',
    condition: (s) => s.totalActiveDays >= 1,
  },
  {
    id: 'streak_3',
    icon: '\u{1F525}', // fire
    nameKey: 'gamification.badge_streak_3',
    descriptionKey: 'gamification.badge_streak_3_desc',
    condition: (s) => s.longestStreak >= 3,
  },
  {
    id: 'streak_7',
    icon: '\u{1F525}', // fire
    nameKey: 'gamification.badge_streak_7',
    descriptionKey: 'gamification.badge_streak_7_desc',
    condition: (s) => s.longestStreak >= 7,
  },
  {
    id: 'streak_30',
    icon: '\u{1F525}', // fire
    nameKey: 'gamification.badge_streak_30',
    descriptionKey: 'gamification.badge_streak_30_desc',
    condition: (s) => s.longestStreak >= 30,
  },
  {
    id: 'first_workout',
    icon: '\u{1F4AA}', // flexed biceps
    nameKey: 'gamification.badge_first_workout',
    descriptionKey: 'gamification.badge_first_workout_desc',
    condition: (s) => s.totalWorkouts >= 1,
  },
  {
    id: 'workouts_10',
    icon: '\u{1F4AA}', // flexed biceps
    nameKey: 'gamification.badge_workouts_10',
    descriptionKey: 'gamification.badge_workouts_10_desc',
    condition: (s) => s.totalWorkouts >= 10,
  },
  {
    id: 'workouts_50',
    icon: '\u{1F4AA}', // flexed biceps
    nameKey: 'gamification.badge_workouts_50',
    descriptionKey: 'gamification.badge_workouts_50_desc',
    condition: (s) => s.totalWorkouts >= 50,
  },
  {
    id: 'meal_7',
    icon: '\u{1F957}', // salad
    nameKey: 'gamification.badge_meal_7',
    descriptionKey: 'gamification.badge_meal_7_desc',
    condition: (s) => s.totalMealDays >= 7,
  },
  {
    id: 'meal_30',
    icon: '\u{1F957}', // salad
    nameKey: 'gamification.badge_meal_30',
    descriptionKey: 'gamification.badge_meal_30_desc',
    condition: (s) => s.totalMealDays >= 30,
  },
  {
    id: 'body_10',
    icon: '\u{2696}\u{FE0F}', // scales
    nameKey: 'gamification.badge_body_10',
    descriptionKey: 'gamification.badge_body_10_desc',
    condition: (s) => s.totalBodyMeasurements >= 10,
  },
  {
    id: 'photos_5',
    icon: '\u{1F4F8}', // camera
    nameKey: 'gamification.badge_photos_5',
    descriptionKey: 'gamification.badge_photos_5_desc',
    // Progress photos are not tracked in the current DB, so this badge is
    // always locked for now. Set to false until the photos table exists.
    condition: () => false,
  },
  {
    id: 'champion',
    icon: '\u{1F3C6}', // trophy
    nameKey: 'gamification.badge_champion',
    descriptionKey: 'gamification.badge_champion_desc',
    condition: (s) => s.totalActiveDays >= 100,
  },
];

/**
 * Pure function that evaluates badges given stats.
 * Exported for testing (no hooks dependency).
 */
export function evaluateBadges(stats: BadgeStats): Badge[] {
  return BADGE_DEFINITIONS.map((def) => ({
    id: def.id,
    icon: def.icon,
    nameKey: def.nameKey,
    descriptionKey: def.descriptionKey,
    earned: def.condition(stats),
    earnedAt: def.condition(stats) ? undefined : undefined, // would require DB tracking
  }));
}

/**
 * Main hook: returns all badges with earned status.
 */
export function useBadges() {
  const { currentStreak, longestStreak, totalActiveDays, isLoading: streakLoading } = useStreaks();
  const { totalMealDays, totalWorkouts, totalBodyMeasurements, isLoading: countsLoading } = useActivityCounts();

  const isLoading = streakLoading || countsLoading;

  const badges = useMemo(() => {
    if (isLoading) {
      return BADGE_DEFINITIONS.map((def) => ({
        id: def.id,
        icon: def.icon,
        nameKey: def.nameKey,
        descriptionKey: def.descriptionKey,
        earned: false,
      }));
    }

    const stats: BadgeStats = {
      currentStreak,
      longestStreak,
      totalActiveDays,
      totalMealDays,
      totalWorkouts,
      totalBodyMeasurements,
    };

    return evaluateBadges(stats);
  }, [isLoading, currentStreak, longestStreak, totalActiveDays, totalMealDays, totalWorkouts, totalBodyMeasurements]);

  const earnedCount = badges.filter((b) => b.earned).length;

  return { badges, earnedCount, totalBadges: BADGE_DEFINITIONS.length, isLoading };
}
