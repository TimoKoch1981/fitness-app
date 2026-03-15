/**
 * Training-Nutrition-Sync — Auto-generates carb cycling pattern from training plan.
 *
 * Maps training plan days to DayType (high/moderate/low/rest) based on:
 * - Day focus/name keywords (legs, back → high; arms, abs → moderate)
 * - Number of exercises and expected volume
 * - Rest days = low carb
 *
 * F15: Bodybuilder-Modus
 */

import type { TrainingPlan, TrainingPlanDay } from '../../../types/health';
import type { DayType } from './phaseMacroCalculator';

export interface WeekDayNutrition {
  dayOfWeek: number; // 0=Mon, 1=Tue, ..., 6=Sun
  dayType: DayType;
  trainingDayName?: string;
  reason: { de: string; en: string };
}

/**
 * High-intensity keywords in day names/focus → High Carb
 */
const HIGH_INTENSITY_KEYWORDS = [
  'beine', 'legs', 'leg', 'squat', 'rücken', 'ruecken', 'back',
  'ganzkörper', 'ganzkoerper', 'full body', 'fullbody',
  'push/pull', 'push pull', 'oberkörper', 'oberkoerper', 'upper',
];

/**
 * Moderate-intensity keywords → Moderate Carb
 */
const MODERATE_INTENSITY_KEYWORDS = [
  'arme', 'arms', 'bizeps', 'trizeps', 'biceps', 'triceps',
  'schultern', 'shoulders', 'brust', 'chest',
  'core', 'bauch', 'abs', 'cardio',
];

function classifyTrainingDay(day: TrainingPlanDay): DayType {
  const text = `${day.name} ${day.focus ?? ''}`.toLowerCase();
  const exerciseCount = day.exercises?.length ?? 0;

  // Check for high-intensity
  if (HIGH_INTENSITY_KEYWORDS.some((kw) => text.includes(kw))) {
    return 'high';
  }

  // High exercise count suggests higher volume → high carb
  if (exerciseCount >= 6) {
    return 'high';
  }

  // Check for moderate-intensity
  if (MODERATE_INTENSITY_KEYWORDS.some((kw) => text.includes(kw))) {
    return 'moderate';
  }

  // Default training day → moderate
  return exerciseCount > 0 ? 'moderate' : 'rest';
}

/**
 * Generate a 7-day carb cycling pattern from a training plan.
 * Assumes the training plan days map to weekdays starting from Monday.
 */
export function generateSyncedWeekPattern(plan: TrainingPlan): WeekDayNutrition[] {
  const days = plan.days ?? [];
  const daysPerWeek = plan.days_per_week ?? days.length;

  // Build a map of which weekdays have training
  const result: WeekDayNutrition[] = [];

  for (let dow = 0; dow < 7; dow++) {
    // Map day_number to weekday (day_number 1 → Monday=0, etc.)
    const trainingDay = days.find((d) => d.day_number - 1 === dow % Math.max(daysPerWeek, 1));

    if (trainingDay && dow < daysPerWeek) {
      const dayType = classifyTrainingDay(trainingDay);
      result.push({
        dayOfWeek: dow,
        dayType,
        trainingDayName: trainingDay.name,
        reason: dayType === 'high'
          ? { de: `${trainingDay.name} — hohe Intensität`, en: `${trainingDay.name} — high intensity` }
          : { de: `${trainingDay.name} — moderate Intensität`, en: `${trainingDay.name} — moderate intensity` },
      });
    } else {
      result.push({
        dayOfWeek: dow,
        dayType: dow === 6 ? 'rest' : 'low', // Sunday rest, other off-days low
        reason: dow === 6
          ? { de: 'Ruhetag', en: 'Rest day' }
          : { de: 'Trainingsfreier Tag', en: 'Rest day' },
      });
    }
  }

  return result;
}

/**
 * Extract DayType[] (Mon-Sun) pattern for MacroCyclingPlanner.
 */
export function generateSyncedDayTypePattern(plan: TrainingPlan): DayType[] {
  return generateSyncedWeekPattern(plan).map((d) => d.dayType);
}

/**
 * Get today's training-nutrition info based on the active training plan.
 */
export function getTodayTrainingNutrition(plan: TrainingPlan): WeekDayNutrition | null {
  const today = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const mondayBased = today === 0 ? 6 : today - 1; // Convert to 0=Mon
  const week = generateSyncedWeekPattern(plan);
  return week[mondayBased] ?? null;
}
