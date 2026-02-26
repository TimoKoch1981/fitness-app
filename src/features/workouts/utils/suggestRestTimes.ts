/**
 * suggestRestTimes — Rule-based rest time recommendations.
 *
 * Based on exercise type, training goal, sets completed, and intensity.
 * Sources: NSCA guidelines, ACSM Position Stand on Resistance Training.
 *
 * Rest periods (seconds):
 * - Strength/Power: 180-300s (3-5 min)
 * - Hypertrophy: 60-120s (1-2 min)
 * - Endurance: 30-60s
 * - Isometric holds: equal to hold time
 * - Compound vs Isolation: compound gets +30s
 */

export interface RestTimeSuggestion {
  restSeconds: number;
  warmupMinutes: number;
  holdSeconds?: number; // for timed exercises
  reason: string;
  reasonEN: string;
}

export type TrainingGoal = 'strength' | 'hypertrophy' | 'endurance' | 'general';
export type ExerciseCategory = 'compound' | 'isolation' | 'cardio' | 'flexibility' | 'isometric';

interface SuggestParams {
  exerciseName: string;
  goal?: TrainingGoal;
  category?: ExerciseCategory;
  setsTotal?: number;
  currentSet?: number;
  weightKg?: number;
  repsTarget?: number;
  previousRestSeconds?: number;
  isTimedExercise?: boolean;
  durationSeconds?: number;
}

// Compound exercise detection (common exercises)
const COMPOUND_PATTERNS = [
  /squat|kniebeuge/i,
  /deadlift|kreuzheben/i,
  /bench\s*press|bankdr/i,
  /overhead\s*press|schulterdr/i,
  /row|rudern/i,
  /pull.?up|klimmz/i,
  /dip/i,
  /clean|reißen|stoßen|umsetzen/i,
  /lunge|ausfallschritt/i,
  /hip\s*thrust/i,
];

const ISOMETRIC_PATTERNS = [
  /plank/i,
  /hold|halten/i,
  /wall\s*sit/i,
  /l.?sit/i,
  /dead\s*hang/i,
  /isometr/i,
];

function detectCategory(name: string): ExerciseCategory {
  if (ISOMETRIC_PATTERNS.some(p => p.test(name))) return 'isometric';
  if (COMPOUND_PATTERNS.some(p => p.test(name))) return 'compound';
  if (/lauf|run|jog|sprint|schwimm|swim|rad|bike|cycling|cardio/i.test(name)) return 'cardio';
  if (/stretch|dehn|yoga|mobil/i.test(name)) return 'flexibility';
  return 'isolation';
}

function detectGoalFromReps(reps?: number): TrainingGoal {
  if (!reps) return 'general';
  if (reps <= 5) return 'strength';
  if (reps <= 12) return 'hypertrophy';
  return 'endurance';
}

export function suggestRestTime(params: SuggestParams): RestTimeSuggestion {
  const {
    exerciseName,
    goal: goalOverride,
    category: categoryOverride,
    repsTarget,
    isTimedExercise,
    durationSeconds,
  } = params;

  const category = categoryOverride ?? detectCategory(exerciseName);
  const goal = goalOverride ?? detectGoalFromReps(repsTarget);

  // Timed/isometric exercises: rest = hold time (min 30s)
  if (isTimedExercise || category === 'isometric') {
    const holdTime = durationSeconds ?? 30;
    const rest = Math.max(holdTime, 30);
    return {
      restSeconds: rest,
      warmupMinutes: 5,
      holdSeconds: holdTime,
      reason: `Pause = Haltezeit (${rest}s) für optimale Erholung`,
      reasonEN: `Rest = hold time (${rest}s) for optimal recovery`,
    };
  }

  // Flexibility/stretching: minimal rest
  if (category === 'flexibility') {
    return {
      restSeconds: 15,
      warmupMinutes: 5,
      reason: 'Kurze Pause zwischen Dehnungen',
      reasonEN: 'Short rest between stretches',
    };
  }

  // Cardio: recovery based
  if (category === 'cardio') {
    return {
      restSeconds: 60,
      warmupMinutes: 10,
      reason: '60s aktive Erholung zwischen Intervallen',
      reasonEN: '60s active recovery between intervals',
    };
  }

  // Strength training: goal-based rest periods
  const isCompound = category === 'compound';
  const compoundBonus = isCompound ? 30 : 0;

  let baseRest: number;
  let reason: string;
  let reasonEN: string;

  switch (goal) {
    case 'strength':
      baseRest = 180 + compoundBonus;
      reason = `Krafttraining: ${baseRest}s Pause${isCompound ? ' (Verbundübung +30s)' : ''}`;
      reasonEN = `Strength: ${baseRest}s rest${isCompound ? ' (compound +30s)' : ''}`;
      break;
    case 'hypertrophy':
      baseRest = 90 + compoundBonus;
      reason = `Muskelaufbau: ${baseRest}s Pause${isCompound ? ' (Verbundübung +30s)' : ''}`;
      reasonEN = `Hypertrophy: ${baseRest}s rest${isCompound ? ' (compound +30s)' : ''}`;
      break;
    case 'endurance':
      baseRest = 45 + compoundBonus;
      reason = `Ausdauer: ${baseRest}s Pause${isCompound ? ' (Verbundübung +30s)' : ''}`;
      reasonEN = `Endurance: ${baseRest}s rest${isCompound ? ' (compound +30s)' : ''}`;
      break;
    default:
      baseRest = 90 + compoundBonus;
      reason = `Standard: ${baseRest}s Pause${isCompound ? ' (Verbundübung +30s)' : ''}`;
      reasonEN = `Standard: ${baseRest}s rest${isCompound ? ' (compound +30s)' : ''}`;
  }

  return {
    restSeconds: baseRest,
    warmupMinutes: isCompound ? 10 : 5,
    reason,
    reasonEN,
  };
}
