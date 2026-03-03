/**
 * Types for data import (MyFitnessPal CSV and future formats).
 */

/** A single row from a MyFitnessPal CSV export. */
export interface MFPRow {
  Date: string;
  Meal: string;
  Calories: number;
  Fat: number;
  Protein: number;
  Carbs: number;
  Sugar?: number;
  Fiber?: number;
  Sodium?: number;
}

/** Result statistics returned after an import operation. */
export interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  totalRows: number;
}

/** Field mapping configuration for CSV column matching. */
export interface ImportMapping {
  date: string;
  meal: string;
  calories: string;
  fat: string;
  protein: string;
  carbs: string;
  sugar?: string;
  fiber?: string;
  sodium?: string;
}

/** Default MFP column mapping. */
export const DEFAULT_MFP_MAPPING: ImportMapping = {
  date: 'Date',
  meal: 'Meal',
  calories: 'Calories',
  fat: 'Fat (g)',
  protein: 'Protein (g)',
  carbs: 'Carbohydrates (g)',
  sugar: 'Sugar (g)',
  fiber: 'Fiber (g)',
  sodium: 'Sodium (mg)',
};
