/**
 * suggestExerciseDefaults — Smart starting values for exercises.
 *
 * When a user starts a workout and the plan has no explicit weight/reps,
 * this provides sensible defaults based on exercise catalog metadata.
 *
 * Priority chain (caller handles):
 * 1. Plan value (PlanExercise.weight_kg/reps)
 * 2. Cross-plan previous (user's last actual values)
 * 3. Smart defaults (THIS function)
 * 4. Fallback (undefined/10)
 */

import type { CatalogExercise } from '../../../types/health';
import { ISOMETRIC_PATTERNS } from './suggestRestTimes';

export interface ExerciseDefaults {
  /** Suggested weight. undefined = no weight (isometric). 0 = bodyweight. */
  weight_kg: number | undefined;
  /** Suggested reps string (e.g. "10", "8-12") */
  reps: string;
  /** Whether exercise is isometric (duration-based, no weight) */
  isIsometric: boolean;
  /** Hold duration in seconds (only for isometric) */
  holdSeconds?: number;
  /** Whether this is a Mind-Body exercise (Yoga, Tai Chi, Five Tibetans) */
  isMindBody?: boolean;
}

// Bodyweight exercise patterns (no external weight needed)
const BODYWEIGHT_PATTERNS = [
  /push.?up|liegest/i,
  /pull.?up|klimmz/i,
  /chin.?up/i,
  /dip/i,
  /burpee/i,
  /mountain\s*climber/i,
  /pistol\s*squat/i,
  /muscle.?up/i,
  /pike\s*push/i,
  /handstand/i,
  /body\s*weight\s*squat|air\s*squat/i,
  /negative\s*klimmz|negative\s*pull/i,
  /reverse\s*hyperext/i,
];

// Equipment detection patterns (German + English)
const EQUIPMENT = {
  barbell: /langhantel|barbell|olymp/i,
  dumbbell: /kurzhantel|dumbbell|kh\b/i,
  cable: /kabelzug|cable|kabel(?!.*crunch)/i,
  machine: /maschine|machine|beinstreck|beinbeug|beinpress|lat\s*pull|latzug|butterfly|pec\s*deck|hack\s*squat|smith/i,
  kettlebell: /kettlebell|kb\b/i,
  band: /band|resistance\s*band|theraband/i,
  trap_bar: /trap.?bar|hex.?bar/i,
};

function isBodyweight(name: string, catalogEntry?: CatalogExercise): boolean {
  if (BODYWEIGHT_PATTERNS.some(p => p.test(name))) return true;
  // Catalog: no equipment and strength/functional category
  if (catalogEntry) {
    const eq = catalogEntry.equipment_needed;
    const noEquipment = !eq || eq.length === 0 || (eq.length === 1 && eq[0] === '');
    const isStrength = catalogEntry.category === 'strength' || catalogEntry.category === 'functional';
    if (noEquipment && isStrength) return true;
  }
  return false;
}

function difficultyMultiplier(difficulty?: string): number {
  switch (difficulty) {
    case 'beginner': return 1.0;
    case 'intermediate': return 1.5;
    case 'advanced': return 2.0;
    default: return 1.0;
  }
}

function isLegsRegion(bodyRegion?: string): boolean {
  return bodyRegion === 'legs' || bodyRegion === 'full_body';
}

export function suggestExerciseDefaults(
  exerciseName: string,
  catalogEntry?: CatalogExercise,
): ExerciseDefaults {
  // 0. Mind-Body detection (Yoga, Tai Chi, Five Tibetans)
  const sub = catalogEntry?.subcategory;
  if (sub) {
    // Five Tibetans: use reps (5→21), no weight
    if (sub === 'five_tibetans') {
      return { weight_kg: undefined, reps: '7', isIsometric: false, isMindBody: true };
    }
    // Tai Chi forms: duration-based, no reps/weight
    if (sub.startsWith('tai_chi')) {
      return { weight_kg: undefined, reps: '1', isIsometric: false, holdSeconds: 0, isMindBody: true };
    }
    // Yoga poses: hold-duration-based
    if (sub.startsWith('yoga')) {
      const hold = catalogEntry?.hold_duration_seconds ?? 30;
      return { weight_kg: undefined, reps: '1', isIsometric: true, holdSeconds: hold, isMindBody: true };
    }
  }

  // 1. Isometric detection (Plank, Dead Hang, Wall Sit, L-Sit, Hold)
  const isIso = ISOMETRIC_PATTERNS.some(p => p.test(exerciseName));
  if (isIso) {
    // Dead Hang is harder — shorter default hold
    const isDeadHang = /dead\s*hang/i.test(exerciseName);
    const holdSec = isDeadHang ? 20 : 30;
    return { weight_kg: undefined, reps: '1', isIsometric: true, holdSeconds: holdSec };
  }

  // 2. Bodyweight exercises (Dips, Pull-Ups, Push-Ups, etc.)
  if (isBodyweight(exerciseName, catalogEntry)) {
    // Pull-ups are harder → fewer reps
    const isPullUp = /pull.?up|klimmz|chin.?up|muscle.?up|negative/i.test(exerciseName);
    return {
      weight_kg: 0,
      reps: isPullUp ? '5-8' : '8-12',
      isIsometric: false,
    };
  }

  // 3. Equipment-based defaults
  const diff = catalogEntry?.difficulty ?? 'beginner';
  const mult = difficultyMultiplier(diff);
  const legs = isLegsRegion(catalogEntry?.body_region);
  const isCompound = catalogEntry?.is_compound ?? false;

  // Trap Bar (special — heavier than regular barbell)
  if (EQUIPMENT.trap_bar.test(exerciseName)) {
    return { weight_kg: Math.round(30 * mult), reps: isCompound ? '6-8' : '8-10', isIsometric: false };
  }

  // Barbell
  if (EQUIPMENT.barbell.test(exerciseName) || (catalogEntry?.equipment_needed?.some(e => EQUIPMENT.barbell.test(e)))) {
    const base = isCompound ? (legs ? 30 : 20) : 15;
    return { weight_kg: Math.round(base * mult), reps: isCompound ? '6-8' : '8-10', isIsometric: false };
  }

  // Dumbbell
  if (EQUIPMENT.dumbbell.test(exerciseName) || (catalogEntry?.equipment_needed?.some(e => EQUIPMENT.dumbbell.test(e)))) {
    const base = legs ? 10 : 6;
    return { weight_kg: Math.round(base * mult), reps: '10-12', isIsometric: false };
  }

  // Cable
  if (EQUIPMENT.cable.test(exerciseName) || (catalogEntry?.equipment_needed?.some(e => EQUIPMENT.cable.test(e)))) {
    const base = legs ? 15 : 10;
    return { weight_kg: Math.round(base * mult), reps: '10-12', isIsometric: false };
  }

  // Machine
  if (EQUIPMENT.machine.test(exerciseName) || (catalogEntry?.equipment_needed?.some(e => EQUIPMENT.machine.test(e)))) {
    const base = legs ? 30 : 20;
    return { weight_kg: Math.round(base * mult), reps: '10-12', isIsometric: false };
  }

  // Kettlebell
  if (EQUIPMENT.kettlebell.test(exerciseName) || (catalogEntry?.equipment_needed?.some(e => EQUIPMENT.kettlebell.test(e)))) {
    return { weight_kg: Math.round(12 * mult), reps: '10-12', isIsometric: false };
  }

  // Band (no weight tracking)
  if (EQUIPMENT.band.test(exerciseName) || (catalogEntry?.equipment_needed?.some(e => EQUIPMENT.band.test(e)))) {
    return { weight_kg: undefined, reps: '12-15', isIsometric: false };
  }

  // 4. Fallback — unknown equipment, use catalog hints
  if (catalogEntry) {
    // Has any equipment → probably needs weight
    if (catalogEntry.equipment_needed && catalogEntry.equipment_needed.length > 0 && catalogEntry.equipment_needed[0] !== '') {
      const base = legs ? 15 : 10;
      return { weight_kg: Math.round(base * mult), reps: '10-12', isIsometric: false };
    }
  }

  // 5. Ultimate fallback — no info
  return { weight_kg: undefined, reps: '10', isIsometric: false };
}
