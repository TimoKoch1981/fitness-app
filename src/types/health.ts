/**
 * Domain types for all health-related data.
 * Based on reconstructed types from Lovable + architecture decisions.
 * @see docs/TYPEN_REKONSTRUKTION.md
 * @see docs/ARCHITEKTUR.md
 */

// === MEAL TYPES ===
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type DataSource = 'manual' | 'ai' | 'api' | 'barcode' | 'scale' | 'watch' | 'import';

export interface Meal {
  id: string;
  user_id: string;
  date: string; // ISO date YYYY-MM-DD
  name: string;
  type: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  source: DataSource;
  source_ref?: string; // e.g. Open Food Facts barcode
  created_at: string;
}

// === WORKOUT TYPES ===
export type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'hiit' | 'sports' | 'other';

export interface ExerciseSet {
  name: string;
  sets?: number;
  reps?: number;
  weight_kg?: number;
  duration_minutes?: number;
  notes?: string;
}

export interface Workout {
  id: string;
  user_id: string;
  date: string;
  name: string;
  type: WorkoutType;
  duration_minutes?: number;
  calories_burned?: number;
  met_value?: number;
  exercises: ExerciseSet[];
  notes?: string;
  created_at: string;
}

// === BODY MEASUREMENTS ===
export interface BodyMeasurement {
  id: string;
  user_id: string;
  date: string;
  weight_kg?: number;
  body_fat_pct?: number;
  muscle_mass_kg?: number;
  water_pct?: number;
  waist_cm?: number;
  chest_cm?: number;
  arm_cm?: number;
  leg_cm?: number;
  bmi?: number; // calculated
  lean_mass_kg?: number; // calculated
  source: DataSource;
  created_at: string;
}

// === BLOOD PRESSURE ===
export type BPClassification =
  | 'optimal'
  | 'normal'
  | 'high_normal'
  | 'hypertension_1'
  | 'hypertension_2'
  | 'hypertension_3';

export interface BloodPressure {
  id: string;
  user_id: string;
  date: string;
  time: string; // HH:mm
  systolic: number;
  diastolic: number;
  pulse?: number;
  classification?: BPClassification;
  notes?: string;
  created_at: string;
}

// === SUBSTANCES (formerly medications) ===
export type SubstanceCategory = 'trt' | 'ped' | 'medication' | 'supplement' | 'other';
export type SubstanceAdminType = 'injection' | 'oral' | 'transdermal' | 'subcutaneous' | 'other';
export type InjectionSite =
  | 'glute_left' | 'glute_right'
  | 'delt_left' | 'delt_right'
  | 'quad_left' | 'quad_right'
  | 'ventro_glute_left' | 'ventro_glute_right'
  | 'abdomen' | 'other';

export interface Substance {
  id: string;
  user_id: string;
  name: string;
  category?: SubstanceCategory;
  type?: SubstanceAdminType;
  dosage?: string;
  unit?: string;
  frequency?: string;
  ester?: string; // e.g. 'enanthat', 'cypionat', 'propionat'
  half_life_days?: number;
  is_active: boolean;
  start_date?: string;
  notes?: string;
  created_at: string;
}

export interface SubstanceLog {
  id: string;
  user_id: string;
  substance_id: string;
  substance_name?: string; // denormalized for display
  date: string;
  time?: string;
  dosage_taken?: string;
  taken: boolean;
  site?: InjectionSite;
  notes?: string;
  created_at: string;
}

// === TRAINING GOALS ===
export type GoalCategory = 'weight' | 'body_fat' | 'strength' | 'endurance' | 'custom';

export interface TrainingGoal {
  id: string;
  user_id: string;
  title: string;
  category?: GoalCategory;
  target_value?: number;
  current_value?: number;
  unit?: string;
  target_date?: string;
  is_completed: boolean;
  created_at: string;
}

// === REMINDERS ===
export type ReminderType = 'substance' | 'blood_pressure' | 'body_measurement' | 'custom';
export type RepeatMode = 'weekly' | 'interval';
export type TimePeriod = 'morning' | 'noon' | 'evening';

export interface Reminder {
  id: string;
  user_id: string;
  type: ReminderType;
  title: string;
  description?: string;
  time?: string; // HH:mm
  days_of_week: number[]; // 0=Sun, 1=Mon ... 6=Sat
  is_active: boolean;
  substance_id?: string;
  repeat_mode: RepeatMode;
  interval_days?: number;
  time_period?: TimePeriod;
  created_at: string;
}

export interface ReminderLog {
  id: string;
  user_id: string;
  reminder_id: string;
  completed_at: string;
}

// === USER PROFILE ===
export type Gender = 'male' | 'female' | 'other';
export type BMRFormula = 'mifflin' | 'katch' | 'auto';

export interface UserProfile {
  id: string;
  display_name?: string;
  height_cm?: number;
  birth_date?: string;
  gender?: Gender;
  activity_level: number; // PAL factor
  daily_calories_goal: number;
  daily_protein_goal: number;
  daily_water_goal: number;
  preferred_language: 'de' | 'en';
  preferred_bmr_formula: BMRFormula;
  created_at: string;
  updated_at: string;
}

// === PRODUCT DATABASE ===
export type ProductCategory = 'grain' | 'dairy' | 'meat' | 'fish' | 'fruit' | 'vegetable' | 'snack' | 'beverage' | 'supplement' | 'general';

export interface ProductNutrition {
  id: string;
  name: string;
  brand?: string;
  category: ProductCategory;
  barcode?: string;
  serving_size_g: number;
  serving_label?: string;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  fiber_per_serving?: number;
  source?: string;
  source_ref?: string;
}

export interface UserProduct extends ProductNutrition {
  user_id: string;
  aliases: string[];
  is_favorite: boolean;
  use_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// === AGGREGATIONS ===
export interface DailyStats {
  calories: number;
  caloriesGoal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  fat: number;
  water: number;
  waterGoal: number;
}

// === HEALTH CONTEXT (for AI) ===
export interface HealthContext {
  dailyStats: DailyStats;
  recentMeals: Meal[];
  recentWorkouts: Workout[];
  latestBodyMeasurement?: BodyMeasurement;
  recentBloodPressure: BloodPressure[];
  activeSubstances: Substance[];
  recentSubstanceLogs: SubstanceLog[];
  trainingGoals: TrainingGoal[];
  profile?: UserProfile;
  activePlan?: TrainingPlan;
  userProducts?: UserProduct[];
  standardProducts?: ProductNutrition[];
}

// === RECOMMENDATIONS ===
export type RecommendationType = 'calories' | 'protein' | 'workout' | 'hydration' | 'rest' | 'blood_pressure';
export type RecommendationPriority = 'low' | 'medium' | 'high';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: RecommendationPriority;
}

// === TRAINING PLAN ===
export type SplitType = 'ppl' | 'upper_lower' | 'full_body' | 'custom';

export interface PlanExercise {
  name: string;
  sets: number;
  reps: string;         // "8-10" or "12" or "60s"
  weight_kg?: number;
  rest_seconds?: number;
  notes?: string;
}

export interface TrainingPlanDay {
  id: string;
  plan_id: string;
  day_number: number;
  name: string;
  focus?: string;
  exercises: PlanExercise[];
  notes?: string;
  created_at: string;
}

export interface TrainingPlan {
  id: string;
  user_id: string;
  name: string;
  split_type: SplitType;
  days_per_week: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  days?: TrainingPlanDay[]; // eagerly loaded via join
}
