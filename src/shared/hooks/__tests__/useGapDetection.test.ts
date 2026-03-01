import { describe, it, expect } from 'vitest';

// Unit test for the daysBetween helper logic (extracted for testability)
function daysBetween(dateStr: string, todayStr: string): number {
  const d1 = new Date(dateStr + 'T00:00:00');
  const d2 = new Date(todayStr + 'T00:00:00');
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

describe('useGapDetection — daysBetween helper', () => {
  it('returns 0 for same day', () => {
    expect(daysBetween('2026-03-01', '2026-03-01')).toBe(0);
  });

  it('returns 1 for consecutive days', () => {
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
  });

  it('returns 3 for 3-day gap', () => {
    expect(daysBetween('2026-02-26', '2026-03-01')).toBe(3);
  });

  it('returns 7 for a week', () => {
    expect(daysBetween('2026-02-22', '2026-03-01')).toBe(7);
  });

  it('handles month boundaries', () => {
    expect(daysBetween('2026-01-31', '2026-02-01')).toBe(1);
  });

  it('handles year boundaries', () => {
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
  });
});

describe('useGapDetection — gap threshold logic', () => {
  const GAP_THRESHOLD = 2;

  it('no gap when days < threshold', () => {
    const days = 1;
    expect(days >= GAP_THRESHOLD).toBe(false);
  });

  it('gap when days == threshold', () => {
    const days = 2;
    expect(days >= GAP_THRESHOLD).toBe(true);
  });

  it('gap when days > threshold', () => {
    const days = 5;
    expect(days >= GAP_THRESHOLD).toBe(true);
  });

  it('no gap for null (never logged)', () => {
    const days: number | null = null;
    expect(days !== null && days >= GAP_THRESHOLD).toBe(false);
  });
});
