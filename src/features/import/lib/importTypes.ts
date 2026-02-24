/**
 * Shared types for the data import feature.
 */

export type ImportMode = 'csv' | 'email' | 'image';
export type ImportDataType = 'meal' | 'body' | 'blood_pressure';
export type ImportStep = 'mode_select' | 'input' | 'analyzing' | 'mapping' | 'review' | 'saving' | 'done' | 'error';

export interface ImportedRow {
  id: string;
  type: ImportDataType;
  date: string;
  values: Record<string, number | string | undefined>;
  confidence?: number;
  selected: boolean; // user can deselect rows
}

export interface CsvColumnMapping {
  csvColumn: string;
  targetField: string;
  autoDetected: boolean;
}
