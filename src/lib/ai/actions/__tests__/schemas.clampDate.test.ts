/**
 * Tests for clampDate — the date-guard introduced as P0-3 to kill the
 * v13.9 LLM-date-hallucination bug class structurally.
 *
 * Strategy: silent-clamp (NOT reject). Bad dates fall back to today;
 * the save still works.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { clampDate } from '../schemas';
import { validateAction } from '../schemas';

// Anchor system time so we can predict "today" deterministically.
const FAKE_NOW = new Date('2026-05-12T14:00:00Z');
const TODAY_ISO = '2026-05-12';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: false });
  vi.setSystemTime(FAKE_NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('clampDate', () => {
  // ── Happy path ──
  it('passes a well-formed today ISO date through unchanged', () => {
    expect(clampDate('2026-05-12')).toBe('2026-05-12');
  });

  it('passes a recent past date through unchanged (within 365d)', () => {
    expect(clampDate('2026-01-15')).toBe('2026-01-15');
  });

  it('passes a near-future date through unchanged (within 30d)', () => {
    expect(clampDate('2026-05-20')).toBe('2026-05-20');
  });

  it('strips an ISO timestamp down to YYYY-MM-DD', () => {
    expect(clampDate('2026-05-12T08:30:00Z')).toBe('2026-05-12');
  });

  it('trims whitespace before parsing', () => {
    expect(clampDate('  2026-05-12  ')).toBe('2026-05-12');
  });

  // ── The actual v13.9 bug ──
  it('clamps the gpt-4o-mini training-cutoff date to today (v13.9 root case)', () => {
    expect(clampDate('2023-10-04')).toBe(TODAY_ISO);
  });

  it('clamps any pre-2024 date to today', () => {
    expect(clampDate('2020-01-01')).toBe(TODAY_ISO);
    expect(clampDate('1999-12-31')).toBe(TODAY_ISO);
    expect(clampDate('2023-12-31')).toBe(TODAY_ISO);
  });

  // ── Far-future hallucinations ──
  it('clamps dates more than 30 days in the future to today', () => {
    expect(clampDate('2027-01-01')).toBe(TODAY_ISO);
    expect(clampDate('2030-06-15')).toBe(TODAY_ISO);
  });

  // ── Far-past hallucinations ──
  it('clamps dates more than 365 days in the past to today', () => {
    expect(clampDate('2025-04-01')).toBe(TODAY_ISO); // >365d ago
    expect(clampDate('2024-01-01')).toBe(TODAY_ISO); // >365d ago
  });

  // ── Malformed input ──
  it('returns today for empty / null / undefined input', () => {
    expect(clampDate(null)).toBe(TODAY_ISO);
    expect(clampDate(undefined)).toBe(TODAY_ISO);
    expect(clampDate('')).toBe(TODAY_ISO);
  });

  it('returns today for non-string input', () => {
    expect(clampDate(20260512)).toBe(TODAY_ISO);
    expect(clampDate({ year: 2026 })).toBe(TODAY_ISO);
    expect(clampDate(['2026-05-12'])).toBe(TODAY_ISO);
  });

  it('returns today for non-ISO-shaped strings', () => {
    expect(clampDate('today')).toBe(TODAY_ISO);
    expect(clampDate('12.05.2026')).toBe(TODAY_ISO);
    expect(clampDate('May 12, 2026')).toBe(TODAY_ISO);
    expect(clampDate('2026/05/12')).toBe(TODAY_ISO);
  });

  it('returns today for impossible ISO-shaped dates', () => {
    // matches the regex but unparseable (month 13)
    expect(clampDate('2026-13-01')).toBe(TODAY_ISO);
  });
});

// ── Integration with validateAction (the actual production path) ──

describe('validateAction with date guard', () => {
  it('log_meal: replaces LLM hallucinated date with today', () => {
    const result = validateAction('log_meal', {
      date: '2023-10-04', // <- the exact v13.9 hallucination
      name: 'Skyr mit Banane',
      calories: 350,
      protein: 30,
      carbs: 45,
      fat: 4,
    });
    expect(result.success).toBe(true);
    expect(result.data.date).toBe(TODAY_ISO);
  });

  it('log_meal: preserves a legitimate backdated meal (yesterday)', () => {
    const result = validateAction('log_meal', {
      date: '2026-05-11', // yesterday
      name: 'Pizza',
      calories: 800,
      protein: 30,
      carbs: 90,
      fat: 25,
    });
    expect(result.success).toBe(true);
    expect(result.data.date).toBe('2026-05-11');
  });

  it('log_meal: uses today when date is omitted', () => {
    const result = validateAction('log_meal', {
      name: 'Apple',
      calories: 80,
      protein: 0,
      carbs: 20,
      fat: 0,
    });
    expect(result.success).toBe(true);
    expect(result.data.date).toBe(TODAY_ISO);
  });

  it('log_workout: clamps far-past date to today', () => {
    const result = validateAction('log_workout', {
      date: '2020-01-01',
      name: 'Push Day',
      type: 'strength',
    });
    expect(result.success).toBe(true);
    expect(result.data.date).toBe(TODAY_ISO);
  });

  it('log_blood_pressure: clamps hallucinated date, keeps other fields', () => {
    const result = validateAction('log_blood_pressure', {
      date: '2023-10-04',
      systolic: 130,
      diastolic: 85,
      pulse: 70,
    });
    expect(result.success).toBe(true);
    expect(result.data.date).toBe(TODAY_ISO);
    expect(result.data.systolic).toBe(130);
  });

  it('log_substance: clamps hallucinated date', () => {
    const result = validateAction('log_substance', {
      substance_name: 'Testosteron Enantat',
      date: '2023-10-04',
      dosage_taken: '250mg',
    });
    expect(result.success).toBe(true);
    expect(result.data.date).toBe(TODAY_ISO);
  });

  it('log_body: clamps hallucinated date', () => {
    const result = validateAction('log_body', {
      date: '2023-10-04',
      weight_kg: 87.5,
    });
    expect(result.success).toBe(true);
    expect(result.data.date).toBe(TODAY_ISO);
  });

  it('log_blood_work: clamps hallucinated date', () => {
    const result = validateAction('log_blood_work', {
      date: '2023-10-04',
      hemoglobin: 15.2,
    });
    expect(result.success).toBe(true);
    expect(result.data.date).toBe(TODAY_ISO);
  });
});
