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

// ── Format Detection ─────────────────────────────────────────────────

export const SCALE_PARSERS: ScaleFormatParser[] = [
  fitdaysParser,
  renphoParser,
  withingsParser,
];

export function detectScaleFormat(headers: string[]): ScaleFormatParser | null {
  for (const parser of SCALE_PARSERS) {
    if (parser.detect(headers)) return parser;
  }
  return null;
}
