/**
 * CSV Parser — handles multiple delimiters, auto-detects columns,
 * and maps to health data types.
 */

import type { CsvColumnMapping, ImportedRow, ImportDataType } from './importTypes';

// ── Delimiter Detection ──────────────────────────────────────────────

const DELIMITERS = [';', ',', '\t', '|'];

export function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] ?? '';
  let best = ',';
  let maxCount = 0;
  for (const d of DELIMITERS) {
    const count = firstLine.split(d).length - 1;
    if (count > maxCount) {
      maxCount = count;
      best = d;
    }
  }
  return best;
}

// ── Parse CSV Text ───────────────────────────────────────────────────

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

export function parseCSV(text: string): ParsedCsv {
  const delimiter = detectDelimiter(text);
  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return { headers: [], rows: [], delimiter };

  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(1).map(line =>
    line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
  );

  return { headers, rows, delimiter };
}

// ── Column Auto-Detection ────────────────────────────────────────────

const COLUMN_MAP: Record<string, string[]> = {
  // Body measurements
  date: ['date', 'datum', 'zeit', 'time', 'time of measurement', 'messung'],
  weight_kg: ['weight', 'gewicht', 'weight(kg)', 'weight (kg)', 'koerpergewicht', 'körpergewicht', 'mass'],
  body_fat_pct: ['body fat', 'koerperfett', 'körperfett', 'body fat(%)', 'fat(%)', 'fat %', 'bmi fat', 'body fat rate(%)'],
  muscle_mass_kg: ['muscle', 'muskelmasse', 'muscle mass', 'muscle mass(kg)', 'skeletal muscle(kg)'],
  water_pct: ['water', 'wasseranteil', 'water(%)', 'body water(%)'],
  bmi: ['bmi'],
  waist_cm: ['waist', 'bauchumfang', 'taille'],
  chest_cm: ['chest', 'brustumfang', 'brust'],
  arm_cm: ['arm', 'armumfang', 'oberarm'],
  leg_cm: ['leg', 'beinumfang', 'oberschenkel'],
  // Meals
  name: ['name', 'mahlzeit', 'meal', 'lebensmittel', 'food'],
  calories: ['calories', 'kalorien', 'kcal', 'energy', 'energie'],
  protein: ['protein', 'eiweiss', 'eiweiß'],
  carbs: ['carbs', 'kohlenhydrate', 'carbohydrates'],
  fat: ['fat', 'fett'],
  // Blood pressure
  systolic: ['systolic', 'sys', 'systolisch'],
  diastolic: ['diastolic', 'dia', 'diastolisch'],
  pulse: ['pulse', 'puls', 'heart rate', 'herzfrequenz'],
};

export function autoDetectColumns(headers: string[]): CsvColumnMapping[] {
  return headers.map(header => {
    const normalized = header.toLowerCase().trim();
    for (const [targetField, aliases] of Object.entries(COLUMN_MAP)) {
      if (aliases.some(alias => normalized.includes(alias))) {
        return { csvColumn: header, targetField, autoDetected: true };
      }
    }
    return { csvColumn: header, targetField: '', autoDetected: false };
  });
}

// ── Detect Data Type ─────────────────────────────────────────────────

export function detectDataType(mappings: CsvColumnMapping[]): ImportDataType {
  const fields = new Set(mappings.map(m => m.targetField));
  if (fields.has('systolic') || fields.has('diastolic')) return 'blood_pressure';
  if (fields.has('calories') || fields.has('protein') || fields.has('name')) return 'meal';
  return 'body';
}

// ── Parse Number (handles comma decimals) ────────────────────────────

export function parseNumber(value: string): number | undefined {
  if (!value || value.trim() === '' || value === '-') return undefined;
  // Replace comma with dot for German decimals
  const cleaned = value.replace(',', '.').replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

// ── Map Rows to ImportedRows ─────────────────────────────────────────

let idCounter = 0;

export function mapToImportedRows(
  headers: string[],
  rows: string[][],
  mappings: CsvColumnMapping[],
  dataType: ImportDataType
): ImportedRow[] {
  return rows.map(row => {
    const values: Record<string, number | string | undefined> = {};
    let date = new Date().toISOString().split('T')[0]; // default today

    for (let i = 0; i < headers.length && i < row.length; i++) {
      const mapping = mappings.find(m => m.csvColumn === headers[i]);
      if (!mapping || !mapping.targetField) continue;

      const rawValue = row[i];
      if (mapping.targetField === 'date') {
        // Try to parse date
        const parsed = parseDate(rawValue);
        if (parsed) date = parsed;
      } else if (mapping.targetField === 'name') {
        values[mapping.targetField] = rawValue;
      } else {
        values[mapping.targetField] = parseNumber(rawValue);
      }
    }

    return {
      id: `import_${++idCounter}_${Date.now()}`,
      type: dataType,
      date,
      values,
      confidence: 1,
      selected: true,
    };
  }).filter(row => {
    // Filter out empty rows
    const hasValues = Object.values(row.values).some(v => v !== undefined && v !== '');
    return hasValues;
  });
}

// ── Date Parsing ─────────────────────────────────────────────────────

function parseDate(value: string): string | null {
  if (!value) return null;
  // ISO format
  const isoMatch = value.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  // German format DD.MM.YYYY
  const deMatch = value.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (deMatch) return `${deMatch[3]}-${deMatch[2].padStart(2, '0')}-${deMatch[1].padStart(2, '0')}`;
  // US format MM/DD/YYYY
  const usMatch = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) return `${usMatch[3]}-${usMatch[1].padStart(2, '0')}-${usMatch[2].padStart(2, '0')}`;
  // Try native Date parse
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return null;
}
