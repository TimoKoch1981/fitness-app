import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatTime, today, generateId } from '../utils';

// ── cn() ───────────────────────────────────────────────────────────────────

describe('cn()', () => {
  it('merges simple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('merges conflicting tailwind classes (last wins)', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2');
  });

  it('returns empty string for no input', () => {
    expect(cn()).toBe('');
  });

  it('handles arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });
});

// ── formatDate() ───────────────────────────────────────────────────────────

describe('formatDate()', () => {
  it('formats Date object with default DE locale', () => {
    const result = formatDate(new Date('2026-03-15'));
    // DE format: DD.MM.YYYY
    expect(result).toMatch(/15\.03\.2026/);
  });

  it('formats ISO string with default DE locale', () => {
    const result = formatDate('2026-12-25');
    expect(result).toMatch(/25\.12\.2026/);
  });

  it('formats with EN locale', () => {
    const result = formatDate('2026-07-04', 'en-US');
    // US format: MM/DD/YYYY
    expect(result).toMatch(/07\/04\/2026/);
  });

  it('handles Date object input', () => {
    const d = new Date(2026, 0, 1); // Jan 1 2026
    const result = formatDate(d);
    expect(result).toMatch(/01\.01\.2026/);
  });
});

// ── formatTime() ───────────────────────────────────────────────────────────

describe('formatTime()', () => {
  it('formats valid time string', () => {
    const result = formatTime('14:30');
    expect(result).toMatch(/14:30/);
  });

  it('returns fallback for null', () => {
    expect(formatTime(null)).toBe('--:--');
  });

  it('returns fallback for undefined', () => {
    expect(formatTime(undefined)).toBe('--:--');
  });

  it('returns raw string for invalid format', () => {
    expect(formatTime('not-a-time')).toBe('not-a-time');
  });

  it('formats with EN locale', () => {
    const result = formatTime('14:30', 'en-US');
    // EN can show "2:30 PM" or "02:30 PM"
    expect(result).toMatch(/2:30/);
  });

  it('returns fallback for empty string', () => {
    expect(formatTime('')).toBe('--:--');
  });
});

// ── today() ────────────────────────────────────────────────────────────────

describe('today()', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = today();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches current date', () => {
    const expected = new Date().toISOString().split('T')[0];
    expect(today()).toBe(expected);
  });
});

// ── generateId() ───────────────────────────────────────────────────────────

describe('generateId()', () => {
  it('returns a valid UUID v4 format', () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 10 }, () => generateId()));
    expect(ids.size).toBe(10);
  });
});
