/**
 * Gamification types — Streaks, Badges, and Challenges.
 */

export interface StreakData {
  /** Number of consecutive days with at least one logged activity (up to today). */
  currentStreak: number;
  /** Longest consecutive-day streak ever recorded within the query window. */
  longestStreak: number;
  /** Total number of distinct days with at least one activity. */
  totalActiveDays: number;
  /** Whether the underlying queries are still loading. */
  isLoading: boolean;
  /** UX5 / Phase 5: "5 von 7"-Streak. Active days in the last 7 calendar days. */
  rollingActiveDays7: number;
  /** UX5: Whether the rolling-7 goal is met (default 5 of 7 = "active week"). */
  rollingGoalMet: boolean;
}

export interface Badge {
  /** Stable identifier, e.g. "first_day", "streak_7". */
  id: string;
  /** Emoji icon for display. */
  icon: string;
  /** i18n key for the badge name (e.g. gamification.badge_first_day). */
  nameKey: string;
  /** i18n key for the badge description. */
  descriptionKey: string;
  /** Whether the user has earned this badge. */
  earned: boolean;
  /** Date the badge was earned (undefined if not earned). */
  earnedAt?: string;
}

export type ChallengeType = 'workouts' | 'meals' | 'body' | 'water' | 'any';

export interface WeeklyChallenge {
  /** i18n key for the challenge title. */
  titleKey: string;
  /** Type of activity this challenge tracks. */
  type: ChallengeType;
  /** Target count to complete the challenge. */
  target: number;
  /** Current progress count. */
  current: number;
  /** Whether the challenge is completed. */
  completed: boolean;
}
