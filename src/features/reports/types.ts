/**
 * Types for the Weekly Report feature.
 *
 * Used by:
 * - useWeeklyReport hook (client-side calculation)
 * - weekly-report edge function (server-side generation)
 * - WeeklyReportPreview component (display)
 */

// === Nutrition Summary ===
export interface NutritionSummary {
  totalMeals: number;
  /** Number of days with at least one meal logged */
  daysTracked: number;
  totalCalories: number;
  avgCaloriesPerDay: number;
  avgProteinPerDay: number;
  avgCarbsPerDay: number;
  avgFatPerDay: number;
}

// === Training Summary ===
export interface TrainingSummary {
  totalWorkouts: number;
  totalDurationMinutes: number;
  totalCaloriesBurned: number;
  /** Number of distinct days with workouts */
  daysWithWorkouts: number;
  /** Average workout duration in minutes */
  avgDurationMinutes: number;
}

// === Body Summary ===
export interface BodySummary {
  /** true if there are at least 2 measurements to compare */
  hasData: boolean;
  /** Weight at start of period */
  startWeight?: number;
  /** Weight at end of period */
  endWeight?: number;
  /** Difference (endWeight - startWeight), negative = weight loss */
  weightChange?: number;
  /** Body fat at start */
  startBodyFat?: number;
  /** Body fat at end */
  endBodyFat?: number;
  /** Difference in body fat % */
  bodyFatChange?: number;
}

// === Sleep Summary ===
export interface SleepSummary {
  /** Number of sleep logs in the period */
  totalLogs: number;
  /** Average sleep duration in minutes */
  avgDurationMinutes: number;
  /** Average sleep quality (1-5) */
  avgQuality: number;
  /** Number of days with sleep data */
  daysTracked: number;
}

// === Streak ===
export interface StreakInfo {
  /** Current consecutive days with activity (meal or workout) */
  currentStreak: number;
}

// === Full Weekly Report ===
export interface WeeklyReportData {
  /** ISO date string of the report range start */
  startDate: string;
  /** ISO date string of the report range end */
  endDate: string;
  nutrition: NutritionSummary;
  training: TrainingSummary;
  body: BodySummary;
  sleep: SleepSummary;
  streak: StreakInfo;
}
