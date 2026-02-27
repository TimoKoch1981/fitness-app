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

// === LIVE WORKOUT SESSION TYPES ===

/** Per-set result tracked during a live workout session */
export interface SetResult {
  set_number: number;
  target_reps: string;        // from plan, e.g. "8-10"
  target_weight_kg?: number;  // from plan
  actual_reps?: number;       // what the user actually did
  actual_weight_kg?: number;  // what the user actually used
  completed: boolean;
  skipped?: boolean;
  notes?: string;
}

/** Detailed per-exercise result from a live session */
export interface WorkoutExerciseResult {
  name: string;
  exercise_id?: string;        // FK to exercise_catalog
  exercise_type?: ExerciseCategory;
  plan_exercise_index: number; // position in the plan day
  sets: SetResult[];
  // endurance fields
  duration_minutes?: number;
  distance_km?: number;
  pace?: string;
  intensity?: string;
  // timer / rest
  rest_seconds?: number;       // per-exercise rest time (from plan or user-adjusted)
  // meta
  skipped?: boolean;
  is_addition?: boolean;       // user-added exercise (not in plan)
  notes?: string;
}

/** Cardio warm-up result */
export interface WarmupResult {
  description: string;       // free text: "10 Min Laufband, Zone 2"
  duration_minutes: number;
  calories_burned: number;   // MET-based calculation
  met_value?: number;
}

/** Tracking mode for the active workout session */
export type WorkoutTrackingMode = 'set-by-set' | 'exercise';

/** Session phase */
export type WorkoutSessionPhase = 'warmup' | 'exercise' | 'rest' | 'summary';

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
  // Live session fields
  plan_id?: string;
  plan_day_id?: string;
  plan_day_number?: number;
  session_exercises?: WorkoutExerciseResult[];
  warmup?: WarmupResult;
  started_at?: string;
  finished_at?: string;
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
export type TrainingMode = 'standard' | 'power' | 'power_plus';
export type TrainingPhase = 'bulk' | 'cut' | 'maintenance' | 'peak_week' | 'reverse_diet' | 'off_season';
export type CycleStatus = 'natural' | 'blast' | 'cruise' | 'pct' | 'off';

export type PrimaryGoal = 'muscle_gain' | 'fat_loss' | 'health' | 'performance' | 'body_recomp';

export interface PersonalGoals {
  primary_goal?: PrimaryGoal;
  target_weight_kg?: number;
  target_body_fat_pct?: number;
  target_date?: string;          // ISO date: "2026-12-31"
  notes?: string;                // Freitext, z.B. "Sixpack bis Sommer"
}

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
  personal_goals?: PersonalGoals;
  avatar_url?: string;
  is_admin?: boolean;
  disclaimer_accepted_at?: string;
  // Training Mode (Power/Power+)
  training_mode?: TrainingMode;
  show_date?: string;
  show_federation?: string;
  current_phase?: TrainingPhase;
  cycle_status?: CycleStatus;
  cycle_start_date?: string;
  cycle_planned_weeks?: number;
  power_plus_accepted_at?: string;
  created_at: string;
  updated_at: string;
}

// === BLOOD WORK (Power+ Modus) ===
export interface BloodWork {
  id: string;
  user_id: string;
  date: string;
  // Hormone
  testosterone_total?: number;   // ng/dL
  testosterone_free?: number;    // pg/mL
  estradiol?: number;            // pg/mL
  lh?: number;                   // mIU/mL
  fsh?: number;                  // mIU/mL
  shbg?: number;                 // nmol/L
  prolactin?: number;            // ng/mL
  // Blutbild
  hematocrit?: number;           // %
  hemoglobin?: number;           // g/dL
  // Lipide
  hdl?: number;                  // mg/dL
  ldl?: number;                  // mg/dL
  triglycerides?: number;        // mg/dL
  total_cholesterol?: number;    // mg/dL
  // Leber
  ast?: number;                  // U/L (GOT)
  alt?: number;                  // U/L (GPT)
  ggt?: number;                  // U/L
  // Niere
  creatinine?: number;           // mg/dL
  egfr?: number;                 // mL/min/1.73m2
  // Schilddruese
  tsh?: number;                  // mIU/L
  // Sonstige
  psa?: number;                  // ng/mL
  hba1c?: number;                // %
  vitamin_d?: number;            // ng/mL
  ferritin?: number;             // ng/mL
  notes?: string;
  created_at: string;
}

// === AI USAGE LOG ===
export interface AiUsageLog {
  id: string;
  user_id: string;
  agent_type: string;
  model: string;
  tokens_input: number;
  tokens_output: number;
  tokens_total: number;
  estimated_cost_usd: number;
  duration_ms?: number;
  created_at: string;
}

// === ADMIN STATS ===
export interface AdminUserStat {
  user_id: string;
  display_name?: string;
  email?: string;
  registered_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  meal_count: number;
  workout_count: number;
  body_count: number;
  last_meal_at?: string;
  last_workout_at?: string;
}

export interface AdminUsageStat {
  day: string;
  agent_type: string;
  model: string;
  call_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_cost_usd: number;
  avg_duration_ms: number;
  unique_users: number;
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

// === DAILY CHECK-IN ===
export interface DailyCheckin {
  id: string;
  user_id: string;
  date: string;
  energy_level?: number; // 1-5
  sleep_quality?: number; // 1-5
  mood?: number; // 1-5
  stress_level?: number; // 1-5
  pain_areas: string[];
  illness: boolean;
  notes?: string;
  created_at: string;
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
  availableEquipment?: Equipment[];
  dailyCheckin?: DailyCheckin;
  /** When true, agents prepend onboarding instructions to their system prompt */
  onboardingMode?: boolean;
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

// === EXERCISE CATALOG ===
export interface CatalogExercise {
  id: string;
  name: string;
  name_en?: string;
  aliases: string[];
  category: ExerciseCategory;
  muscle_groups: string[];
  description?: string;
  description_en?: string;
  video_url_de?: string;
  video_url_en?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment_needed: string[];
  is_compound: boolean;
  created_at: string;
}

// === EQUIPMENT ===
export type EquipmentCategory = 'machine' | 'cable' | 'free_weight' | 'bodyweight' | 'cardio' | 'other';

export interface Equipment {
  id: string;
  name: string;
  name_en?: string;
  category: EquipmentCategory;
  muscle_groups: string[];
  description?: string;
  icon?: string;
  is_default: boolean;
  created_at: string;
}

export interface GymProfile {
  id: string;
  name: string;
  description?: string;
  equipment_ids: string[];
  is_template: boolean;
  created_by?: string;
  created_at: string;
}

export interface UserEquipment {
  id: string;
  user_id: string;
  gym_profile_id?: string;
  equipment_ids: string[];
  custom_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// === TRAINING PLAN ===
export type ExerciseCategory = 'strength' | 'cardio' | 'flexibility' | 'functional' | 'other';

export type SplitType =
  | 'ppl' | 'upper_lower' | 'full_body' | 'custom'
  | 'running' | 'swimming' | 'cycling' | 'yoga' | 'martial_arts' | 'mixed';

export interface PlanExercise {
  name: string;
  // Strength fields (optional — backwards compatible, was required)
  sets?: number;
  reps?: string;              // "8-10" or "12" or "60s"
  weight_kg?: number;
  rest_seconds?: number;
  // Endurance fields
  duration_minutes?: number;
  distance_km?: number;
  pace?: string;              // e.g. "5:30 min/km"
  intensity?: string;         // e.g. "Zone 2", "moderat", "80% HRmax"
  // Common
  exercise_type?: ExerciseCategory;
  exercise_id?: string;       // optional FK to exercise_catalog
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
