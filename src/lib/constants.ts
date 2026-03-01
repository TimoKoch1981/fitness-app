/**
 * Application-wide constants and default values.
 * All health-related defaults are based on scientific references.
 * @see docs/WISSENSCHAFTLICHE_GRUNDLAGEN.md
 */

// === DEFAULT DAILY GOALS ===
export const DEFAULT_CALORIES_GOAL = 2000;
export const DEFAULT_PROTEIN_GOAL = 150; // grams
export const DEFAULT_WATER_GOAL = 8; // glasses (250ml each = 2L)
export const DEFAULT_CARBS_GOAL = 250; // grams
export const DEFAULT_FAT_GOAL = 65; // grams

// === BREASTFEEDING / LACTATION (Dewey 2003, PMID:14506247) ===
/** Average additional energy cost of exclusive breastfeeding in kcal/day */
export const BREASTFEEDING_CALORIE_BOOST = 400; // 300-500 range, midpoint used

// === PAL FACTORS (WHO/FAO/UNU 2004) ===
export const PAL_FACTORS = {
  bedridden: 1.2,
  sedentary: 1.4,
  lightly_active: 1.55,
  moderately_active: 1.7,
  very_active: 1.9,
  extremely_active: 2.2,
} as const;

export const DEFAULT_PAL = PAL_FACTORS.lightly_active;

// === MEAL TYPES ===
export const MEAL_TYPES = ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'snack'] as const;

// === WORKOUT TYPES ===
export const WORKOUT_TYPES = [
  'strength',
  'cardio',
  'flexibility',
  'hiit',
  'sports',
  'other',
] as const;

// === SUBSTANCE CATEGORIES ===
export const SUBSTANCE_CATEGORIES = [
  'trt',
  'ped',
  'medication',
  'supplement',
  'other',
] as const;

// === SUBSTANCE ADMINISTRATION TYPES ===
export const SUBSTANCE_TYPES = [
  'injection',
  'oral',
  'transdermal',
  'subcutaneous',
  'other',
] as const;

// === INJECTION SITES ===
export const INJECTION_SITES = [
  'glute_left',
  'glute_right',
  'delt_left',
  'delt_right',
  'quad_left',
  'quad_right',
  'ventro_glute_left',
  'ventro_glute_right',
  'abdomen',
  'other',
] as const;

// === BLOOD PRESSURE CLASSIFICATION (ESC/ESH 2023) ===
export const BP_CLASSIFICATIONS = {
  optimal: { systolicMax: 119, diastolicMax: 79, color: 'green', severity: 0 },
  normal: { systolicMax: 129, diastolicMax: 84, color: 'green', severity: 1 },
  high_normal: { systolicMax: 139, diastolicMax: 89, color: 'yellow', severity: 2 },
  hypertension_1: { systolicMax: 159, diastolicMax: 99, color: 'orange', severity: 3 },
  hypertension_2: { systolicMax: 179, diastolicMax: 109, color: 'red', severity: 4 },
  hypertension_3: { systolicMax: Infinity, diastolicMax: Infinity, color: 'red', severity: 5 },
} as const;

// === REMINDER TYPES ===
export const REMINDER_TYPES = [
  'substance',
  'blood_pressure',
  'body_measurement',
  'custom',
] as const;

// === PRODUCT CATEGORIES ===
export const PRODUCT_CATEGORIES = [
  'grain',
  'dairy',
  'meat',
  'fish',
  'fruit',
  'vegetable',
  'snack',
  'beverage',
  'supplement',
  'general',
] as const;

// === DATA SOURCES ===
export const DATA_SOURCES = [
  'manual',
  'ai',
  'api',
  'barcode',
  'scale',
  'watch',
  'import',
] as const;

// === API URLs ===
export const OPEN_FOOD_FACTS_API = 'https://world.openfoodfacts.org/api/v2';
export const USDA_FDC_API = 'https://api.nal.usda.gov/fdc/v1';

// === APP INFO ===
export const APP_NAME = 'FitBuddy';
export const APP_VERSION = '0.1.0';
export const APP_DESCRIPTION = 'Dein persoenlicher Fitness & Health Companion';
