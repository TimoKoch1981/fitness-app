/**
 * Scale Export Format Parsers — Fitdays, Renpho, Withings, Generic.
 * Each parser detects its format from CSV headers and maps to BodyMeasurement fields.
 */

import type { CsvColumnMapping } from './importTypes';

export interface ScaleFormatParser {
  name: string;
  detect(headers: string[]): boolean;
  getMappings(headers: string[]): CsvColumnMapping[];
}

// ── Fitdays ──────────────────────────────────────────────────────────

const fitdaysParser: ScaleFormatParser = {
  name: 'Fitdays',
  detect(headers) {
    const lower = headers.map(h => h.toLowerCase());
    return lower.some(h => h.includes('body fat rate')) && lower.some(h => h.includes('weight'));
  },
  getMappings(headers) {
    return headers.map(h => {
      const l = h.toLowerCase();
      if (l.includes('time') || l.includes('date')) return { csvColumn: h, targetField: 'date', autoDetected: true };
      if (l === 'weight(kg)' || l === 'weight') return { csvColumn: h, targetField: 'weight_kg', autoDetected: true };
      if (l.includes('body fat rate') || l.includes('body fat(%)')) return { csvColumn: h, targetField: 'body_fat_pct', autoDetected: true };
      if (l.includes('muscle') && l.includes('rate')) return { csvColumn: h, targetField: 'muscle_mass_kg', autoDetected: true };
      if (l.includes('body water') || l.includes('water(%)')) return { csvColumn: h, targetField: 'water_pct', autoDetected: true };
      if (l === 'bmi') return { csvColumn: h, targetField: 'bmi', autoDetected: true };
      return { csvColumn: h, targetField: '', autoDetected: false };
    });
  },
};

// ── Renpho ────────────────────────────────────────────────────────────

const renphoParser: ScaleFormatParser = {
  name: 'Renpho',
  detect(headers) {
    const lower = headers.map(h => h.toLowerCase());
    return lower.some(h => h.includes('time of measurement')) ||
           (lower.some(h => h === 'weight') && lower.some(h => h.includes('skeletal muscle')));
  },
  getMappings(headers) {
    return headers.map(h => {
      const l = h.toLowerCase();
      if (l.includes('time of measurement') || l.includes('date')) return { csvColumn: h, targetField: 'date', autoDetected: true };
      if (l === 'weight' || l === 'weight(kg)') return { csvColumn: h, targetField: 'weight_kg', autoDetected: true };
      if (l.includes('body fat')) return { csvColumn: h, targetField: 'body_fat_pct', autoDetected: true };
      if (l.includes('skeletal muscle')) return { csvColumn: h, targetField: 'muscle_mass_kg', autoDetected: true };
      if (l.includes('body water')) return { csvColumn: h, targetField: 'water_pct', autoDetected: true };
      if (l === 'bmi') return { csvColumn: h, targetField: 'bmi', autoDetected: true };
      return { csvColumn: h, targetField: '', autoDetected: false };
    });
  },
};

// ── Withings ─────────────────────────────────────────────────────────

const withingsParser: ScaleFormatParser = {
  name: 'Withings',
  detect(headers) {
    const lower = headers.map(h => h.toLowerCase());
    return lower.some(h => h.includes('fat mass')) && lower.some(h => h.includes('weight'));
  },
  getMappings(headers) {
    return headers.map(h => {
      const l = h.toLowerCase();
      if (l === 'date') return { csvColumn: h, targetField: 'date', autoDetected: true };
      if (l.includes('weight') && !l.includes('goal')) return { csvColumn: h, targetField: 'weight_kg', autoDetected: true };
      if (l.includes('fat ratio') || l.includes('fat %')) return { csvColumn: h, targetField: 'body_fat_pct', autoDetected: true };
      if (l.includes('fat-free mass') || l.includes('lean mass')) return { csvColumn: h, targetField: 'muscle_mass_kg', autoDetected: true };
      if (l.includes('hydration')) return { csvColumn: h, targetField: 'water_pct', autoDetected: true };
      return { csvColumn: h, targetField: '', autoDetected: false };
    });
  },
};

// ── MyFitnessPal ────────────────────────────────────────────────────

const mfpParser: ScaleFormatParser = {
  name: 'MyFitnessPal',
  detect(headers) {
    const lower = headers.map(h => h.toLowerCase());
    return lower.some(h => h === 'date') &&
           lower.some(h => h === 'meal') &&
           lower.some(h => h === 'calories');
  },
  getMappings(headers) {
    return headers.map(h => {
      const l = h.toLowerCase();
      if (l === 'date') return { csvColumn: h, targetField: 'date', autoDetected: true };
      if (l === 'meal') return { csvColumn: h, targetField: 'name', autoDetected: true };
      if (l === 'calories') return { csvColumn: h, targetField: 'calories', autoDetected: true };
      if (l.includes('protein')) return { csvColumn: h, targetField: 'protein', autoDetected: true };
      if (l.includes('carbohydrate') || l.includes('carbs')) return { csvColumn: h, targetField: 'carbs', autoDetected: true };
      if (l.includes('fat') && !l.includes('saturated')) return { csvColumn: h, targetField: 'fat', autoDetected: true };
      if (l.includes('fiber') || l.includes('fibre')) return { csvColumn: h, targetField: 'fiber', autoDetected: true };
      if (l.includes('sugar')) return { csvColumn: h, targetField: 'sugar', autoDetected: true };
      if (l.includes('sodium')) return { csvColumn: h, targetField: 'sodium', autoDetected: true };
      return { csvColumn: h, targetField: '', autoDetected: false };
    });
  },
};

// ── Format Detection ─────────────────────────────────────────────────

export const SCALE_PARSERS: ScaleFormatParser[] = [
  fitdaysParser,
  renphoParser,
  withingsParser,
  mfpParser,
];

export function detectScaleFormat(headers: string[]): ScaleFormatParser | null {
  for (const parser of SCALE_PARSERS) {
    if (parser.detect(headers)) return parser;
  }
  return null;
}
