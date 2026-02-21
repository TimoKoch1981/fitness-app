import { describe, it, expect } from 'vitest';
import { getLastNDays } from '../useReportData';

// ── getLastNDays ─────────────────────────────────────────────────────

describe('getLastNDays', () => {
  it('returns start and end as ISO date strings (YYYY-MM-DD)', () => {
    const { start, end } = getLastNDays(7);
    expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('end is today', () => {
    const { end } = getLastNDays(7);
    const today = new Date().toISOString().split('T')[0];
    expect(end).toBe(today);
  });

  it('for n=1, start equals end (today only)', () => {
    const { start, end } = getLastNDays(1);
    expect(start).toBe(end);
  });

  it('for n=7, start is 6 days before today', () => {
    const { start, end } = getLastNDays(7);
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(6);
  });

  it('for n=30, span is 29 days', () => {
    const { start, end } = getLastNDays(30);
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBe(29);
  });

  it('start is always <= end', () => {
    for (const n of [1, 7, 14, 30, 90]) {
      const { start, end } = getLastNDays(n);
      expect(new Date(start).getTime()).toBeLessThanOrEqual(new Date(end).getTime());
    }
  });
});
