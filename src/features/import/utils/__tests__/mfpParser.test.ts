import { describe, it, expect } from 'vitest';
import { parseMFPCSV, normaliseDate, mapMealType } from '../mfpParser';

// ── parseMFPCSV() ────────────────────────────────────────────────────────

describe('parseMFPCSV()', () => {
  const CSV_HEADER = 'Date,Meal,Calories,Fat (g),Protein (g),Carbohydrates (g),Sugar (g),Fiber (g),Sodium (mg)';

  it('parses a valid MFP CSV with multiple rows', () => {
    const csv = `${CSV_HEADER}
03/15/2026,Breakfast,450,12,30,55,10,5,400
03/15/2026,Lunch,650,20,45,60,8,7,800`;
    const rows = parseMFPCSV(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0].Date).toBe('2026-03-15');
    expect(rows[0].Meal).toBe('Breakfast');
    expect(rows[0].Calories).toBe(450);
    expect(rows[0].Protein).toBe(30);
    expect(rows[0].Fat).toBe(12);
    expect(rows[0].Carbs).toBe(55);
  });

  it('handles ISO date format (YYYY-MM-DD)', () => {
    const csv = `${CSV_HEADER}
2026-03-15,Breakfast,450,12,30,55,10,5,400`;
    const rows = parseMFPCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].Date).toBe('2026-03-15');
  });

  it('handles German date format (DD.MM.YYYY)', () => {
    const csv = `${CSV_HEADER}
15.03.2026,Breakfast,450,12,30,55,10,5,400`;
    const rows = parseMFPCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].Date).toBe('2026-03-15');
  });

  it('skips empty rows', () => {
    const csv = `${CSV_HEADER}
03/15/2026,Breakfast,450,12,30,55,10,5,400

03/16/2026,Dinner,500,15,35,45,5,3,600
`;
    const rows = parseMFPCSV(csv);
    expect(rows).toHaveLength(2);
  });

  it('skips rows with invalid date', () => {
    const csv = `${CSV_HEADER}
not-a-date,Breakfast,450,12,30,55,10,5,400
03/15/2026,Lunch,650,20,45,60,8,7,800`;
    const rows = parseMFPCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].Meal).toBe('Lunch');
  });

  it('skips rows with non-numeric calories', () => {
    const csv = `${CSV_HEADER}
03/15/2026,Breakfast,N/A,12,30,55,10,5,400
03/15/2026,Lunch,650,20,45,60,8,7,800`;
    const rows = parseMFPCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].Calories).toBe(650);
  });

  it('handles missing optional fields (Sugar, Fiber, Sodium)', () => {
    const csv = `Date,Meal,Calories,Fat (g),Protein (g),Carbohydrates (g)
03/15/2026,Breakfast,450,12,30,55`;
    const rows = parseMFPCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].Sugar).toBeUndefined();
    expect(rows[0].Fiber).toBeUndefined();
    expect(rows[0].Sodium).toBeUndefined();
  });

  it('handles quoted fields with commas', () => {
    const csv = `${CSV_HEADER}
03/15/2026,"Chicken, grilled",450,12,30,55,10,5,400`;
    const rows = parseMFPCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].Meal).toBe('Chicken, grilled');
  });

  it('returns empty array for empty input', () => {
    expect(parseMFPCSV('')).toEqual([]);
  });

  it('returns empty array for header-only input', () => {
    expect(parseMFPCSV(CSV_HEADER)).toEqual([]);
  });

  it('handles Windows line endings (\\r\\n)', () => {
    const csv = `${CSV_HEADER}\r\n03/15/2026,Breakfast,450,12,30,55,10,5,400\r\n`;
    const rows = parseMFPCSV(csv);
    expect(rows).toHaveLength(1);
  });

  it('defaults missing fat/protein/carbs to 0', () => {
    const csv = `Date,Meal,Calories
03/15/2026,Snack,100`;
    const rows = parseMFPCSV(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].Fat).toBe(0);
    expect(rows[0].Protein).toBe(0);
    expect(rows[0].Carbs).toBe(0);
  });
});

// ── normaliseDate() ──────────────────────────────────────────────────────

describe('normaliseDate()', () => {
  it('passes through ISO dates', () => {
    expect(normaliseDate('2026-03-15')).toBe('2026-03-15');
  });

  it('converts US dates (MM/DD/YYYY)', () => {
    expect(normaliseDate('03/15/2026')).toBe('2026-03-15');
  });

  it('converts German dates (DD.MM.YYYY)', () => {
    expect(normaliseDate('15.03.2026')).toBe('2026-03-15');
  });

  it('returns null for empty input', () => {
    expect(normaliseDate('')).toBeNull();
  });

  it('returns null for invalid dates', () => {
    expect(normaliseDate('not-a-date')).toBeNull();
  });

  it('handles DD/MM/YYYY when day > 12', () => {
    // 25/12/2026 — first number > 12, so must be DD/MM/YYYY
    expect(normaliseDate('25/12/2026')).toBe('2026-12-25');
  });
});

// ── mapMealType() ────────────────────────────────────────────────────────

describe('mapMealType()', () => {
  it('maps Breakfast to breakfast', () => {
    expect(mapMealType('Breakfast')).toBe('breakfast');
  });

  it('maps Lunch to lunch', () => {
    expect(mapMealType('Lunch')).toBe('lunch');
  });

  it('maps Dinner to dinner', () => {
    expect(mapMealType('Dinner')).toBe('dinner');
  });

  it('maps Snacks to snack', () => {
    expect(mapMealType('Snacks')).toBe('snack');
  });

  it('maps unknown meal types to snack', () => {
    expect(mapMealType('Unknown Meal')).toBe('snack');
  });

  it('is case-insensitive', () => {
    expect(mapMealType('BREAKFAST')).toBe('breakfast');
    expect(mapMealType('lunch')).toBe('lunch');
  });

  it('maps German meal names', () => {
    expect(mapMealType('Mittagessen')).toBe('lunch');
    expect(mapMealType('Abendessen')).toBe('dinner');
  });
});
