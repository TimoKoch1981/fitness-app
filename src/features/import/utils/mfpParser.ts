/**
 * MyFitnessPal CSV parser.
 *
 * Handles MFP export format (comma-separated with header row).
 * Pure functions — no side effects, easy to test.
 */

import type { MFPRow } from '../types';
import type { MealType } from '../../../types/health';

// ── CSV Parsing ─────────────────────────────────────────────────────────────

/**
 * Parse a raw CSV text string into an array of MFPRow objects.
 *
 * - Skips empty rows and rows that produce no valid data.
 * - Handles quoted fields (e.g. `"Chicken, grilled"`).
 * - Tolerates both `\r\n` and `\n` line endings.
 */
export function parseMFPCSV(csvText: string): MFPRow[] {
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.trim());

  // Detect column indices (case-insensitive partial match)
  const idx = resolveColumnIndices(headers);
  if (idx.date === -1 || idx.calories === -1) return [];

  const results: MFPRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCSVLine(line);
    const row = buildRow(cols, idx);
    if (row) results.push(row);
  }

  return results;
}

// ── Date Normalisation ──────────────────────────────────────────────────────

/**
 * Normalise a date string to ISO `YYYY-MM-DD`.
 *
 * Supported input formats:
 * - `YYYY-MM-DD` (ISO, pass-through)
 * - `MM/DD/YYYY` (US format, MFP default)
 * - `DD.MM.YYYY` (DE format)
 * - `DD/MM/YYYY` (EU format — ambiguous, treated as DD/MM when day > 12)
 */
export function normaliseDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return isValidDate(trimmed) ? trimmed : null;
  }

  // DD.MM.YYYY (German)
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('.');
    const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    return isValidDate(iso) ? iso : null;
  }

  // MM/DD/YYYY (US, MFP default)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [a, b, y] = trimmed.split('/');
    // If first number > 12, it must be DD/MM/YYYY
    const aNum = parseInt(a, 10);
    if (aNum > 12) {
      const iso = `${y}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
      return isValidDate(iso) ? iso : null;
    }
    // Default: MM/DD/YYYY
    const iso = `${y}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
    return isValidDate(iso) ? iso : null;
  }

  return null;
}

// ── Meal Name Mapping ───────────────────────────────────────────────────────

const MEAL_MAP: Record<string, MealType> = {
  breakfast: 'breakfast',
  'morning snack': 'morning_snack',
  lunch: 'lunch',
  'afternoon snack': 'afternoon_snack',
  dinner: 'dinner',
  snack: 'snack',
  snacks: 'snack',
  // German equivalents
  'frühstück': 'breakfast',
  'fruehstueck': 'breakfast',
  mittagessen: 'lunch',
  abendessen: 'dinner',
};

/**
 * Map a MFP meal name to a FitBuddy MealType.
 * Falls back to 'snack' for unrecognised names.
 */
export function mapMealType(mfpMeal: string): MealType {
  const key = mfpMeal.trim().toLowerCase();
  return MEAL_MAP[key] ?? 'snack';
}

// ── Internal Helpers ────────────────────────────────────────────────────────

/** Parse a single CSV line, respecting quoted fields. */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

interface ColumnIndices {
  date: number;
  meal: number;
  calories: number;
  fat: number;
  protein: number;
  carbs: number;
  sugar: number;
  fiber: number;
  sodium: number;
}

/** Resolve column indices by matching header names (case-insensitive). */
function resolveColumnIndices(headers: string[]): ColumnIndices {
  const find = (patterns: string[]): number =>
    headers.findIndex((h) =>
      patterns.some((p) => h.toLowerCase().includes(p.toLowerCase())),
    );

  return {
    date: find(['Date']),
    meal: find(['Meal']),
    calories: find(['Calories', 'Kalorien', 'Energy']),
    fat: find(['Fat', 'Fett']),
    protein: find(['Protein', 'Eiweiß', 'Eiweiss']),
    carbs: find(['Carb', 'Kohlenhydrat']),
    sugar: find(['Sugar', 'Zucker']),
    fiber: find(['Fiber', 'Fibre', 'Ballaststoff']),
    sodium: find(['Sodium', 'Natrium']),
  };
}

/** Build a MFPRow from a parsed CSV line. Returns null if date or calories are invalid. */
function buildRow(cols: string[], idx: ColumnIndices): MFPRow | null {
  const rawDate = cols[idx.date] ?? '';
  const date = normaliseDate(rawDate);
  if (!date) return null;

  const calories = safeNumber(cols[idx.calories]);
  if (calories === null) return null;

  return {
    Date: date,
    Meal: idx.meal >= 0 ? (cols[idx.meal] ?? 'Snack') : 'Snack',
    Calories: calories,
    Fat: safeNumber(cols[idx.fat]) ?? 0,
    Protein: safeNumber(cols[idx.protein]) ?? 0,
    Carbs: safeNumber(cols[idx.carbs]) ?? 0,
    Sugar: idx.sugar >= 0 ? safeNumber(cols[idx.sugar]) ?? undefined : undefined,
    Fiber: idx.fiber >= 0 ? safeNumber(cols[idx.fiber]) ?? undefined : undefined,
    Sodium: idx.sodium >= 0 ? safeNumber(cols[idx.sodium]) ?? undefined : undefined,
  };
}

/** Parse a string to a number, returning null for non-numeric / NaN values. */
function safeNumber(val: string | undefined): number | null {
  if (val === undefined || val === '') return null;
  const n = Number(val.replace(/,/g, '.'));
  return isNaN(n) ? null : n;
}

/** Validate an ISO date string. */
function isValidDate(iso: string): boolean {
  const d = new Date(iso + 'T00:00:00');
  return !isNaN(d.getTime());
}
