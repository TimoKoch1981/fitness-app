/**
 * Zod validation schemas for all action types.
 *
 * Validates LLM-generated JSON before it reaches the database.
 * Applies sensible defaults (date → today, source → 'ai') and
 * infers meal type from current time when not specified.
 */

import { z } from 'zod';
import type { ActionType } from './types';

// ── Helpers ─────────────────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function nowTime(): string {
  return new Date().toTimeString().slice(0, 5); // HH:MM
}

/** Infer meal type from current hour if not provided by LLM */
function inferMealType(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const hour = new Date().getHours();
  if (hour < 10) return 'breakfast';
  if (hour < 14) return 'lunch';
  if (hour < 17) return 'snack';
  return 'dinner';
}

// ── Schemas ─────────────────────────────────────────────────────────────

const LogMealSchema = z.object({
  date: z.string().default(today),
  name: z.string().min(1),
  type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).default(inferMealType),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative().optional(),
  source: z.literal('ai').default('ai'),
});

const ExerciseSetSchema = z.object({
  name: z.string().min(1),
  sets: z.number().positive().optional(),
  reps: z.number().positive().optional(),
  weight_kg: z.number().nonnegative().optional(),
  duration_minutes: z.number().positive().optional(),
  notes: z.string().optional(),
});

const LogWorkoutSchema = z.object({
  date: z.string().default(today),
  name: z.string().min(1),
  type: z.enum(['strength', 'cardio', 'flexibility', 'hiit', 'sports', 'other']).default('strength'),
  duration_minutes: z.number().positive().optional(),
  calories_burned: z.number().nonnegative().optional(),
  met_value: z.number().positive().optional(),
  exercises: z.array(ExerciseSetSchema).default([]),
  notes: z.string().optional(),
});

const LogBodySchema = z.object({
  date: z.string().default(today),
  weight_kg: z.number().positive().optional(),
  body_fat_pct: z.number().min(1).max(60).optional(),
  muscle_mass_kg: z.number().positive().optional(),
  water_pct: z.number().min(20).max(80).optional(),
  waist_cm: z.number().positive().optional(),
  chest_cm: z.number().positive().optional(),
  arm_cm: z.number().positive().optional(),
  leg_cm: z.number().positive().optional(),
  source: z.literal('ai').default('ai'),
}).refine(
  (data) => {
    // At least one measurement must be present
    return data.weight_kg != null ||
      data.body_fat_pct != null ||
      data.muscle_mass_kg != null ||
      data.waist_cm != null;
  },
  { message: 'At least one body measurement must be provided' }
);

const LogBloodPressureSchema = z.object({
  date: z.string().default(today),
  time: z.string().default(nowTime),
  systolic: z.number().int().min(60).max(300),
  diastolic: z.number().int().min(30).max(200),
  pulse: z.number().int().min(30).max(250).optional(),
  notes: z.string().optional(),
});

const LogSubstanceSchema = z.object({
  substance_name: z.string().min(1),
  date: z.string().default(today),
  time: z.string().default(nowTime),
  dosage_taken: z.string().optional(),
  site: z.enum([
    'glute_left', 'glute_right',
    'delt_left', 'delt_right',
    'quad_left', 'quad_right',
    'ventro_glute_left', 'ventro_glute_right',
    'abdomen', 'other',
  ]).optional(),
  notes: z.string().optional(),
});

const PlanExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.number().positive(),
  reps: z.string().min(1),
  weight_kg: z.number().nonnegative().optional(),
  rest_seconds: z.number().positive().optional(),
  notes: z.string().optional(),
});

const PlanDaySchema = z.object({
  day_number: z.number().int().min(1).max(7),
  name: z.string().min(1),
  focus: z.string().optional(),
  exercises: z.array(PlanExerciseSchema).min(1),
  notes: z.string().optional(),
});

const SaveTrainingPlanSchema = z.object({
  name: z.string().min(1),
  split_type: z.enum(['ppl', 'upper_lower', 'full_body', 'custom']).default('custom'),
  days_per_week: z.number().int().min(1).max(7),
  notes: z.string().optional(),
  days: z.array(PlanDaySchema).min(1),
});

const SaveProductSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  category: z.enum([
    'grain', 'dairy', 'meat', 'fish', 'fruit', 'vegetable',
    'snack', 'beverage', 'supplement', 'general',
  ]).default('general'),
  serving_size_g: z.number().positive(),
  serving_label: z.string().optional(),
  calories_per_serving: z.number().nonnegative(),
  protein_per_serving: z.number().nonnegative(),
  carbs_per_serving: z.number().nonnegative(),
  fat_per_serving: z.number().nonnegative(),
  fiber_per_serving: z.number().nonnegative().optional(),
  aliases: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

// ── Schema Registry ─────────────────────────────────────────────────────

const SCHEMA_MAP: Record<ActionType, z.ZodSchema> = {
  log_meal: LogMealSchema,
  log_workout: LogWorkoutSchema,
  log_body: LogBodySchema,
  log_blood_pressure: LogBloodPressureSchema,
  log_substance: LogSubstanceSchema,
  save_training_plan: SaveTrainingPlanSchema,
  save_product: SaveProductSchema,
};

// ── Public API ──────────────────────────────────────────────────────────

export interface ValidationResult {
  success: boolean;
  data: Record<string, unknown>;
  errors?: string[];
}

/**
 * Validate and transform action data using the appropriate Zod schema.
 * Returns cleaned data with defaults applied, or errors if invalid.
 */
export function validateAction(type: ActionType, data: unknown): ValidationResult {
  const schema = SCHEMA_MAP[type];
  if (!schema) {
    return { success: false, data: {}, errors: [`Unknown action type: ${type}`] };
  }

  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data as Record<string, unknown> };
  }

  const errors = result.error.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`
  );
  return { success: false, data: data as Record<string, unknown>, errors };
}
