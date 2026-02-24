import { describe, it, expect } from 'vitest';
import {
  detectDelimiter,
  parseCSV,
  autoDetectColumns,
  detectDataType,
  parseNumber,
  mapToImportedRows,
} from '../csvParser';

describe('detectDelimiter', () => {
  it('detects comma', () => {
    expect(detectDelimiter('a,b,c\n1,2,3')).toBe(',');
  });

  it('detects semicolon (German Excel)', () => {
    expect(detectDelimiter('Datum;Gewicht;KFA\n01.01.2026;85,5;18,2')).toBe(';');
  });

  it('detects tab', () => {
    expect(detectDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t');
  });

  it('defaults to comma for ambiguous input', () => {
    expect(detectDelimiter('hello')).toBe(',');
  });
});

describe('parseCSV', () => {
  it('parses comma-delimited CSV', () => {
    const result = parseCSV('Name,Calories,Protein\nChicken,200,40\nRice,300,5');
    expect(result.headers).toEqual(['Name', 'Calories', 'Protein']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual(['Chicken', '200', '40']);
  });

  it('parses semicolon-delimited CSV', () => {
    const result = parseCSV('Datum;Gewicht\n01.01.2026;85,5');
    expect(result.headers).toEqual(['Datum', 'Gewicht']);
    expect(result.rows[0]).toEqual(['01.01.2026', '85,5']);
  });

  it('strips quotes', () => {
    const result = parseCSV('"Name","Value"\n"Test","123"');
    expect(result.headers).toEqual(['Name', 'Value']);
    expect(result.rows[0]).toEqual(['Test', '123']);
  });

  it('returns empty for single-line input', () => {
    const result = parseCSV('just a header');
    expect(result.rows).toHaveLength(0);
  });

  it('handles empty lines', () => {
    const result = parseCSV('a,b\n1,2\n\n3,4\n');
    expect(result.rows).toHaveLength(2);
  });
});

describe('autoDetectColumns', () => {
  it('detects body measurement columns', () => {
    const mappings = autoDetectColumns(['Date', 'Weight(kg)', 'Body Fat(%)', 'BMI']);
    expect(mappings.find(m => m.csvColumn === 'Date')?.targetField).toBe('date');
    expect(mappings.find(m => m.csvColumn === 'Weight(kg)')?.targetField).toBe('weight_kg');
    expect(mappings.find(m => m.csvColumn === 'Body Fat(%)')?.targetField).toBe('body_fat_pct');
    expect(mappings.find(m => m.csvColumn === 'BMI')?.targetField).toBe('bmi');
  });

  it('detects German column names', () => {
    const mappings = autoDetectColumns(['Datum', 'Gewicht', 'Koerperfett', 'Bauchumfang']);
    expect(mappings.find(m => m.csvColumn === 'Datum')?.targetField).toBe('date');
    expect(mappings.find(m => m.csvColumn === 'Gewicht')?.targetField).toBe('weight_kg');
    expect(mappings.find(m => m.csvColumn === 'Bauchumfang')?.targetField).toBe('waist_cm');
  });

  it('detects meal columns', () => {
    const mappings = autoDetectColumns(['Name', 'Calories', 'Protein', 'Carbs', 'Fat']);
    expect(mappings.find(m => m.csvColumn === 'Calories')?.targetField).toBe('calories');
    expect(mappings.find(m => m.csvColumn === 'Protein')?.targetField).toBe('protein');
  });

  it('detects blood pressure columns', () => {
    const mappings = autoDetectColumns(['Date', 'Systolic', 'Diastolic', 'Pulse']);
    expect(mappings.find(m => m.csvColumn === 'Systolic')?.targetField).toBe('systolic');
    expect(mappings.find(m => m.csvColumn === 'Diastolic')?.targetField).toBe('diastolic');
  });

  it('leaves unknown columns unmapped', () => {
    const mappings = autoDetectColumns(['Unknown_Column']);
    expect(mappings[0].targetField).toBe('');
    expect(mappings[0].autoDetected).toBe(false);
  });
});

describe('detectDataType', () => {
  it('detects body measurements', () => {
    const mappings = [
      { csvColumn: 'Date', targetField: 'date', autoDetected: true },
      { csvColumn: 'Weight', targetField: 'weight_kg', autoDetected: true },
    ];
    expect(detectDataType(mappings)).toBe('body');
  });

  it('detects meals', () => {
    const mappings = [
      { csvColumn: 'Name', targetField: 'name', autoDetected: true },
      { csvColumn: 'Calories', targetField: 'calories', autoDetected: true },
    ];
    expect(detectDataType(mappings)).toBe('meal');
  });

  it('detects blood pressure', () => {
    const mappings = [
      { csvColumn: 'Sys', targetField: 'systolic', autoDetected: true },
      { csvColumn: 'Dia', targetField: 'diastolic', autoDetected: true },
    ];
    expect(detectDataType(mappings)).toBe('blood_pressure');
  });
});

describe('parseNumber', () => {
  it('parses integers', () => {
    expect(parseNumber('42')).toBe(42);
  });

  it('parses dot decimals', () => {
    expect(parseNumber('85.5')).toBe(85.5);
  });

  it('parses comma decimals (German)', () => {
    expect(parseNumber('85,5')).toBe(85.5);
  });

  it('returns undefined for empty', () => {
    expect(parseNumber('')).toBeUndefined();
    expect(parseNumber('-')).toBeUndefined();
  });

  it('strips units', () => {
    expect(parseNumber('85.5kg')).toBe(85.5);
  });
});

describe('mapToImportedRows', () => {
  it('maps body measurement CSV', () => {
    const headers = ['Date', 'Weight'];
    const rows = [['2026-01-01', '85.5'], ['2026-01-08', '84.2']];
    const mappings = [
      { csvColumn: 'Date', targetField: 'date', autoDetected: true },
      { csvColumn: 'Weight', targetField: 'weight_kg', autoDetected: true },
    ];
    const result = mapToImportedRows(headers, rows, mappings, 'body');
    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-01-01');
    expect(result[0].values.weight_kg).toBe(85.5);
    expect(result[0].type).toBe('body');
    expect(result[0].selected).toBe(true);
  });

  it('filters out empty rows', () => {
    const headers = ['Date', 'Weight'];
    const rows = [['2026-01-01', ''], ['2026-01-08', '84.2']];
    const mappings = [
      { csvColumn: 'Date', targetField: 'date', autoDetected: true },
      { csvColumn: 'Weight', targetField: 'weight_kg', autoDetected: true },
    ];
    const result = mapToImportedRows(headers, rows, mappings, 'body');
    expect(result).toHaveLength(1);
  });

  it('parses German dates', () => {
    const headers = ['Datum', 'Gewicht'];
    const rows = [['15.03.2026', '85,5']];
    const mappings = [
      { csvColumn: 'Datum', targetField: 'date', autoDetected: true },
      { csvColumn: 'Gewicht', targetField: 'weight_kg', autoDetected: true },
    ];
    const result = mapToImportedRows(headers, rows, mappings, 'body');
    expect(result[0].date).toBe('2026-03-15');
    expect(result[0].values.weight_kg).toBe(85.5);
  });
});
