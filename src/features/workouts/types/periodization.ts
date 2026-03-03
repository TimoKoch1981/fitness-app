/**
 * Types for training periodization visualization.
 * Used by usePeriodization hook and PeriodizationView component.
 */

/** Volume data for a single muscle group within a week */
export interface MuscleGroupVolume {
  /** Muscle group name (e.g. 'Brust', 'Ruecken', 'Beine') */
  muscleGroup: string;
  /** Total volume (sets x reps x weight_kg) */
  volume: number;
  /** Number of sets targeting this muscle group */
  sets: number;
}

/** Periodization phase classification */
export type PeriodizationPhase = 'accumulation' | 'intensification' | 'deload' | 'unknown';

/** Aggregated data for a single training week */
export interface WeekData {
  /** ISO week label, e.g. "KW 10" */
  weekLabel: string;
  /** ISO week number */
  weekNumber: number;
  /** Start date of the week (ISO string, Monday) */
  startDate: string;
  /** Total volume across all exercises (sets x reps x weight) */
  totalVolume: number;
  /** Total number of sets performed */
  totalSets: number;
  /** Average intensity (avg weight used, as rough proxy) */
  avgIntensity: number;
  /** Number of workouts in this week */
  workoutCount: number;
  /** Volume breakdown by muscle group */
  muscleGroupBreakdown: MuscleGroupVolume[];
  /** Detected phase for this week */
  phase: PeriodizationPhase;
}

/** Return type for the usePeriodization hook */
export interface PeriodizationData {
  /** Weekly data for the periodization chart */
  weeks: WeekData[];
  /** Average weekly volume across all weeks */
  avgWeeklyVolume: number;
  /** Whether data is still loading */
  isLoading: boolean;
}
