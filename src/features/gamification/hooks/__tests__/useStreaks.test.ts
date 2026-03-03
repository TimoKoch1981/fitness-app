import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { computeStreaks } from '../useStreaks';

// ── Helper: generate date strings ────────────────────────────────────

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

// ── computeStreaks pure function tests ───────────────────────────────

describe('computeStreaks — empty data', () => {
  it('returns all zeros for empty array', () => {
    const result = computeStreaks([]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.totalActiveDays).toBe(0);
  });
});

describe('computeStreaks — single day', () => {
  it('returns streak of 1 if the only day is today', () => {
    const result = computeStreaks([dateStr(0)]);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.totalActiveDays).toBe(1);
  });

  it('returns streak of 1 if the only day is yesterday', () => {
    const result = computeStreaks([dateStr(1)]);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.totalActiveDays).toBe(1);
  });

  it('returns current streak of 0 if the only day is 2 days ago', () => {
    const result = computeStreaks([dateStr(2)]);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(1);
    expect(result.totalActiveDays).toBe(1);
  });
});

describe('computeStreaks — consecutive days', () => {
  it('calculates a 3-day streak ending today', () => {
    const dates = [dateStr(2), dateStr(1), dateStr(0)];
    const result = computeStreaks(dates);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.totalActiveDays).toBe(3);
  });

  it('calculates a 5-day streak ending yesterday', () => {
    const dates = [dateStr(5), dateStr(4), dateStr(3), dateStr(2), dateStr(1)];
    const result = computeStreaks(dates);
    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(5);
    expect(result.totalActiveDays).toBe(5);
  });

  it('calculates a 7-day streak ending today', () => {
    const dates = Array.from({ length: 7 }, (_, i) => dateStr(6 - i));
    const result = computeStreaks(dates);
    expect(result.currentStreak).toBe(7);
    expect(result.longestStreak).toBe(7);
    expect(result.totalActiveDays).toBe(7);
  });
});

describe('computeStreaks — gaps', () => {
  it('handles a gap: 2-day streak ending today, after a gap', () => {
    // days: 5, 4 (gap at 3), 1, 0
    const dates = [dateStr(5), dateStr(4), dateStr(1), dateStr(0)];
    const result = computeStreaks(dates);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
    expect(result.totalActiveDays).toBe(4);
  });

  it('longest streak is historical, current streak is shorter', () => {
    // Historical: 10, 9, 8, 7, 6 (5-day streak)
    // Gap at 5, 4, 3
    // Current: 1, 0 (2-day streak)
    const dates = [
      dateStr(10), dateStr(9), dateStr(8), dateStr(7), dateStr(6),
      dateStr(1), dateStr(0),
    ];
    const result = computeStreaks(dates);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(5);
    expect(result.totalActiveDays).toBe(7);
  });

  it('current streak is 0 when last activity was 3 days ago', () => {
    const dates = [dateStr(5), dateStr(4), dateStr(3)];
    const result = computeStreaks(dates);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(3);
    expect(result.totalActiveDays).toBe(3);
  });
});

describe('computeStreaks — deduplication', () => {
  it('deduplicates same date appearing multiple times', () => {
    const today = dateStr(0);
    const yesterday = dateStr(1);
    const dates = [today, today, today, yesterday, yesterday];
    const result = computeStreaks(dates);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
    expect(result.totalActiveDays).toBe(2);
  });

  it('handles many duplicates across multiple days', () => {
    const dates = [
      dateStr(2), dateStr(2), dateStr(2),
      dateStr(1), dateStr(1),
      dateStr(0), dateStr(0), dateStr(0), dateStr(0),
    ];
    const result = computeStreaks(dates);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.totalActiveDays).toBe(3);
  });
});

describe('computeStreaks — unsorted input', () => {
  it('correctly handles unsorted dates', () => {
    const dates = [dateStr(0), dateStr(2), dateStr(1)];
    const result = computeStreaks(dates);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.totalActiveDays).toBe(3);
  });
});

describe('computeStreaks — large data', () => {
  it('handles 30-day streak', () => {
    const dates = Array.from({ length: 30 }, (_, i) => dateStr(29 - i));
    const result = computeStreaks(dates);
    expect(result.currentStreak).toBe(30);
    expect(result.longestStreak).toBe(30);
    expect(result.totalActiveDays).toBe(30);
  });

  it('handles 90 days of scattered data', () => {
    // Active every other day for 90 days
    const dates = Array.from({ length: 45 }, (_, i) => dateStr(i * 2));
    const result = computeStreaks(dates);
    // Every other day means no consecutive days
    expect(result.currentStreak).toBe(1); // Today is in the list (day 0)
    expect(result.longestStreak).toBe(1);
    expect(result.totalActiveDays).toBe(45);
  });
});
