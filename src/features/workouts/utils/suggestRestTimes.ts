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
export const COMPOUND_PATTERNS = [
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

export const ISOMETRIC_PATTERNS = [
  /plank/i,
  /hold|halten/i,
  /wall\s*sit/i,
  /l.?sit/i,
  /dead\s*hang/i,
  /isometr/i,
];

// Mind-Body exercise patterns
export const MIND_BODY_PATTERNS = [
  /yoga|asana|krieger|warrior|kobra|cobra|herabschau|downward.*dog|sonnengruß|sun.*salut/i,
  /tai\s*chi|qigong|qi\s*gong|yang\s*\d+|wildpferd|kranich|peitsche|wolken/i,
  /tibeter|tibetan|drehung.*spinning|tischplatte.*tabletop|zwei.*hunde/i,
];

export function detectCategory(name: string): ExerciseCategory {
  if (ISOMETRIC_PATTERNS.some(p => p.test(name))) return 'isometric';
  if (COMPOUND_PATTERNS.some(p => p.test(name))) return 'compound';
  if (/lauf|run|jog|sprint|schwimm|swim|rad|bike|cycling|cardio/i.test(name)) return 'cardio';
  if (MIND_BODY_PATTERNS.some(p => p.test(name))) return 'flexibility';
  if (/stretch|dehn|yoga|mobil/i.test(name)) return 'flexibility';
  return 'isolation';
}

function detectGoalFromReps(reps?: number): TrainingGoal {
  if (!reps) return 'general';
  if (reps <= 5) return 'strength';
  if (reps <= 12) return 'hypertrophy';
  return 'endurance';
}

// ── Rep recommendations (B48, 2026-06-04) ────────────────────────────────
//
// Before B48 the deterministic default reps came purely from EQUIPMENT
// (barbell 6-8, dumbbell/cable/machine flat 10-12, band 12-15), so a heavy
// compound and a light isolation got near-identical rep targets — the user
// reported "alles wird gleich behandelt". This function derives a rep range
// from the TRAINING GOAL × MOVEMENT ROLE, the same two axes the rest-time
// recommendation already uses. Sources: ACSM Position Stand 2009, Schoenfeld
// 2017 (hypertrophy dose-response), NSCA Essentials Ch.17.

export interface RepSuggestion {
  /** Rep-range string, e.g. "6-10" */
  reps: string;
  goal: TrainingGoal;
  reason: string;
  reasonEN: string;
}

/** Rep-range table: goal × movement role. */
const REP_TABLE: Record<TrainingGoal, { compound: string; isolation: string }> = {
  strength:    { compound: '3-5',   isolation: '6-8'   },
  hypertrophy: { compound: '6-10',  isolation: '10-15' },
  endurance:   { compound: '12-15', isolation: '15-20' },
  // general = sensible default that still differentiates compound vs isolation
  general:     { compound: '6-10',  isolation: '10-12' },
};

/**
 * Map the user's current training phase to a rep-scheme goal.
 *
 * Keys on the REAL TrainingPhase union (types/health.ts:268) — the only
 * writer is PowerModeSetupWizard which emits exactly these six values:
 *   'bulk' | 'cut' | 'maintenance' | 'peak_week' | 'reverse_diet' | 'off_season'.
 * (B48 review 2026-06-04: an earlier version keyed on invented aliases like
 * 'lean_bulk'/'massephase' that the app never produces, leaving off_season +
 * reverse_diet silently at 'general' and mapping peak_week to a max-strength
 * scheme — wrong for a competition taper.)
 *
 * - bulk / off_season → hypertrophy (both are muscle-building blocks)
 * - cut               → hypertrophy (keep reps moderate-high to retain muscle)
 * - maintenance / reverse_diet → general
 * - peak_week         → general (taper/deload, NOT a 3-5 rep strength block)
 */
export function goalFromPhase(phase?: string | null): TrainingGoal {
  switch ((phase ?? '').toLowerCase()) {
    case 'bulk':
    case 'off_season':
    case 'cut':
      return 'hypertrophy';
    case 'maintenance':
    case 'reverse_diet':
    case 'peak_week':
      return 'general';
    default:
      return 'general';
  }
}

/**
 * Recommend a rep range from goal + movement role.
 * Isometric / cardio / flexibility are duration-based and handled by callers;
 * if such a category slips in we fall back to the isolation column.
 */
export function suggestReps(params: {
  category?: ExerciseCategory;
  exerciseName?: string;
  goal?: TrainingGoal;
  isCompound?: boolean;
}): RepSuggestion {
  const category = params.category
    ?? (params.exerciseName ? detectCategory(params.exerciseName) : 'isolation');
  const isCompound = params.isCompound ?? category === 'compound';
  const goal = params.goal ?? 'general';

  const reps = isCompound ? REP_TABLE[goal].compound : REP_TABLE[goal].isolation;
  const role = isCompound ? 'Verbundübung' : 'Isolationsübung';
  const roleEN = isCompound ? 'compound' : 'isolation';
  const goalDE: Record<TrainingGoal, string> = {
    strength: 'Maximalkraft', hypertrophy: 'Muskelaufbau',
    endurance: 'Kraftausdauer', general: 'Allround',
  };
  const goalENm: Record<TrainingGoal, string> = {
    strength: 'strength', hypertrophy: 'hypertrophy',
    endurance: 'endurance', general: 'general',
  };

  return {
    reps,
    goal,
    reason: `${goalDE[goal]} · ${role}: ${reps} Wdh`,
    reasonEN: `${goalENm[goal]} · ${roleEN}: ${reps} reps`,
  };
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
