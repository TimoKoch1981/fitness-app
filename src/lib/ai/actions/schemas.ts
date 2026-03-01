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
function inferMealType(): 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'snack' {
  const hour = new Date().getHours();
  if (hour < 10) return 'breakfast';
  if (hour < 12) return 'morning_snack';
  if (hour < 14) return 'lunch';
  if (hour < 17) return 'afternoon_snack';
  if (hour < 21) return 'dinner';
  return 'snack';
}

// ── Schemas ─────────────────────────────────────────────────────────────

const LogMealSchema = z.object({
  date: z.string().default(today),
  name: z.string().min(1),
  type: z.enum(['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'snack']).default(inferMealType),
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
  // Strength fields (optional — backwards compatible, was required)
  sets: z.number().positive().optional(),
  reps: z.string().min(1).optional(),
  weight_kg: z.number().nonnegative().optional(),
  rest_seconds: z.number().positive().optional(),
  // Endurance fields
  duration_minutes: z.number().positive().optional(),
  distance_km: z.number().positive().optional(),
  pace: z.string().optional(),
  intensity: z.string().optional(),
  // Common
  exercise_type: z.enum(['strength', 'cardio', 'flexibility', 'functional', 'other']).optional(),
  exercise_id: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    const hasStrength = data.sets != null || data.reps != null;
    const hasEndurance = data.duration_minutes != null || data.distance_km != null;
    return hasStrength || hasEndurance;
  },
  { message: 'Exercise must have either sets/reps (strength) or duration/distance (endurance)' },
);

const PlanDaySchema = z.object({
  day_number: z.number().int().min(1).max(7),
  name: z.string().min(1),
  focus: z.string().optional(),
  exercises: z.array(PlanExerciseSchema).min(1),
  notes: z.string().optional(),
});

const SaveTrainingPlanSchema = z.object({
  name: z.string().min(1),
  split_type: z.enum([
    'ppl', 'upper_lower', 'full_body', 'custom',
    'running', 'swimming', 'cycling', 'yoga', 'martial_arts', 'mixed',
  ]).default('custom'),
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

const AddSubstanceSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['trt', 'ped', 'medication', 'supplement', 'other']).default('other'),
  type: z.enum(['injection', 'oral', 'transdermal', 'subcutaneous', 'other']).default('other'),
  dosage: z.string().optional(),
  unit: z.string().optional(),
  frequency: z.string().optional(),
  ester: z.string().optional(),
  half_life_days: z.number().positive().optional(),
  notes: z.string().optional(),
});

const AddReminderSchema = z.object({
  title: z.string().min(1),
  // LLMs sometimes send "supplement", "medication" etc. — coerce to valid ReminderType
  type: z.string().default('custom').transform((val): 'substance' | 'blood_pressure' | 'body_measurement' | 'custom' => {
    if (['substance', 'supplement', 'medication', 'trt', 'ped'].includes(val)) return 'substance';
    if (['blood_pressure', 'bp'].includes(val)) return 'blood_pressure';
    if (['body_measurement', 'body', 'weight'].includes(val)) return 'body_measurement';
    return 'custom';
  }),
  time_period: z.enum(['morning', 'noon', 'evening']).optional(),
  time: z.string().optional(),
  // LLMs sometimes send "daily" — treat as "weekly" with all 7 days
  repeat_mode: z.string().default('weekly').transform((val): 'weekly' | 'interval' => {
    if (val === 'interval') return 'interval';
    return 'weekly'; // "daily", "weekly", or anything else → weekly
  }),
  days_of_week: z.array(z.number().min(0).max(6)).optional(),
  interval_days: z.number().positive().optional(),
  substance_name: z.string().optional(),
  description: z.string().optional(),
}).transform((data) => ({
  ...data,
  // If repeat_mode is "weekly" and no days_of_week specified, default to every day
  days_of_week: data.days_of_week ?? [0, 1, 2, 3, 4, 5, 6],
}));

const UpdateProfileSchema = z.object({
  height_cm: z.number().min(50).max(250).optional(),
  birth_year: z.number().min(1920).max(2020).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  activity_level: z.number().min(1.0).max(2.5).optional(),
  display_name: z.string().min(1).optional(),
  daily_calories_goal: z.number().positive().optional(),
  daily_protein_goal: z.number().positive().optional(),
}).refine(
  (data) => {
    // At least one field must be present
    return Object.values(data).some(v => v != null);
  },
  { message: 'At least one profile field must be provided' }
);

const UpdateEquipmentSchema = z.object({
  equipment_names: z.array(z.string().min(1)).min(1),
  gym_profile_name: z.string().optional(),
});

const SearchProductSchema = z.object({
  query: z.string().min(1),
  portion_g: z.number().positive().optional(),
  meal_type: z.enum(['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'snack']).optional(),
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
  add_substance: AddSubstanceSchema,
  add_reminder: AddReminderSchema,
  update_profile: UpdateProfileSchema,
  update_equipment: UpdateEquipmentSchema,
  search_product: SearchProductSchema,
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
