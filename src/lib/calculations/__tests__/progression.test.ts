import { describe, it, expect } from 'vitest';
import {
  calculateLinearRegression,
  predictValue,
  calculateMovingAverage,
  detectPlateau,
  calculateWeeklyRate,
  estimateTimeToTarget,
  datesToNumericPoints,
} from '../progression';

describe('calculateLinearRegression', () => {
  it('returns null for fewer than 2 points', () => {
    expect(calculateLinearRegression([])).toBeNull();
    expect(calculateLinearRegression([{ x: 0, y: 5 }])).toBeNull();
  });

  it('computes correct slope and intercept for a perfect line', () => {
    // y = 2x + 1
    const points = [
      { x: 0, y: 1 },
      { x: 1, y: 3 },
      { x: 2, y: 5 },
      { x: 3, y: 7 },
    ];
    const result = calculateLinearRegression(points)!;
    expect(result.slope).toBeCloseTo(2, 5);
    expect(result.intercept).toBeCloseTo(1, 5);
    expect(result.rSquared).toBeCloseTo(1, 5);
  });

  it('handles negative slope (weight loss)', () => {
    // y = -0.5x + 90
    const points = [
      { x: 0, y: 90 },
      { x: 7, y: 86.5 },
      { x: 14, y: 83 },
      { x: 21, y: 79.5 },
    ];
    const result = calculateLinearRegression(points)!;
    expect(result.slope).toBeCloseTo(-0.5, 1);
    expect(result.intercept).toBeCloseTo(90, 1);
    expect(result.rSquared).toBeCloseTo(1, 3);
  });

  it('handles noisy data (R-squared < 1)', () => {
    const points = [
      { x: 0, y: 90 },
      { x: 7, y: 89 },
      { x: 14, y: 91 },
      { x: 21, y: 88 },
      { x: 28, y: 87 },
    ];
    const result = calculateLinearRegression(points)!;
    expect(result.slope).toBeLessThan(0); // general downtrend
    expect(result.rSquared).toBeLessThan(1);
    expect(result.rSquared).toBeGreaterThan(0);
  });

  it('handles all same y values', () => {
    const points = [
      { x: 0, y: 85 },
      { x: 7, y: 85 },
      { x: 14, y: 85 },
    ];
    const result = calculateLinearRegression(points)!;
    expect(result.slope).toBeCloseTo(0, 5);
    expect(result.rSquared).toBe(1); // perfect fit for constant
  });
});

describe('predictValue', () => {
  it('predicts correctly', () => {
    const reg = { slope: -0.5, intercept: 90, rSquared: 1 };
    expect(predictValue(reg, 0)).toBe(90);
    expect(predictValue(reg, 14)).toBe(83);
    expect(predictValue(reg, 30)).toBe(75);
  });
});

describe('calculateMovingAverage', () => {
  it('returns all nulls for empty array', () => {
    expect(calculateMovingAverage([], 3)).toEqual([]);
  });

  it('returns nulls for incomplete windows', () => {
    const result = calculateMovingAverage([1, 2, 3, 4, 5], 3);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBeCloseTo(2, 5);
    expect(result[3]).toBeCloseTo(3, 5);
    expect(result[4]).toBeCloseTo(4, 5);
  });

  it('handles window size 1', () => {
    const values = [10, 20, 30];
    const result = calculateMovingAverage(values, 1);
    expect(result).toEqual([10, 20, 30]);
  });

  it('handles window size equal to array length', () => {
    const values = [10, 20, 30];
    const result = calculateMovingAverage(values, 3);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBeCloseTo(20, 5);
  });
});

describe('detectPlateau', () => {
  it('detects no plateau with insufficient data', () => {
    const result = detectPlateau([
      { date: '2026-01-01', value: 90 },
      { date: '2026-01-02', value: 89 },
    ]);
    expect(result.isPlateau).toBe(false);
  });

  it('detects a plateau when values are constant', () => {
    const points = [];
    for (let i = 0; i < 20; i++) {
      const date = new Date(2026, 0, 1 + i).toISOString().split('T')[0];
      points.push({ date, value: 85 + (Math.random() * 0.02 - 0.01) });
    }
    const result = detectPlateau(points, 0.02, 14);
    expect(result.isPlateau).toBe(true);
    expect(result.durationDays).toBeGreaterThanOrEqual(14);
    expect(result.averageValue).toBeCloseTo(85, 0);
  });

  it('detects no plateau when values are declining', () => {
    const points = [];
    for (let i = 0; i < 20; i++) {
      const date = new Date(2026, 0, 1 + i).toISOString().split('T')[0];
      points.push({ date, value: 90 - i * 0.3 });
    }
    const result = detectPlateau(points, 0.02, 14);
    expect(result.isPlateau).toBe(false);
  });
});

describe('calculateWeeklyRate', () => {
  it('returns null for insufficient data', () => {
    expect(calculateWeeklyRate([])).toBeNull();
    expect(calculateWeeklyRate([{ date: '2026-01-01', value: 90 }])).toBeNull();
  });

  it('calculates correct weekly rate for weight loss', () => {
    const points = [
      { date: '2026-01-01', value: 90 },
      { date: '2026-01-08', value: 89 },
      { date: '2026-01-15', value: 88 },
      { date: '2026-01-22', value: 87 },
    ];
    const rate = calculateWeeklyRate(points)!;
    expect(rate).toBeCloseTo(-1, 1); // -1 kg/week
  });

  it('calculates correct weekly rate for weight gain', () => {
    const points = [
      { date: '2026-01-01', value: 80 },
      { date: '2026-01-15', value: 81 },
      { date: '2026-01-29', value: 82 },
    ];
    const rate = calculateWeeklyRate(points)!;
    expect(rate).toBeCloseTo(0.5, 1); // +0.5 kg/week
  });
});

describe('estimateTimeToTarget', () => {
  it('returns null for zero rate', () => {
    expect(estimateTimeToTarget(90, 80, 0)).toBeNull();
  });

  it('returns null for wrong direction (gaining when need to lose)', () => {
    expect(estimateTimeToTarget(90, 80, 0.1)).toBeNull(); // gaining, need to lose
  });

  it('returns null for wrong direction (losing when need to gain)', () => {
    expect(estimateTimeToTarget(70, 80, -0.1)).toBeNull(); // losing, need to gain
  });

  it('estimates correctly for weight loss', () => {
    // 90 -> 80, losing 0.5/day = 20 days
    const days = estimateTimeToTarget(90, 80, -0.5)!;
    expect(days).toBe(20);
  });

  it('estimates correctly for weight gain', () => {
    // 70 -> 80, gaining 0.2/day = 50 days
    const days = estimateTimeToTarget(70, 80, 0.2)!;
    expect(days).toBe(50);
  });
});

describe('datesToNumericPoints', () => {
  it('returns empty for empty input', () => {
    expect(datesToNumericPoints([])).toEqual([]);
  });

  it('converts dates to day offsets', () => {
    const points = [
      { date: '2026-01-01', value: 90 },
      { date: '2026-01-08', value: 89 },
      { date: '2026-01-15', value: 88 },
    ];
    const numeric = datesToNumericPoints(points);
    expect(numeric[0].x).toBe(0);
    expect(numeric[1].x).toBe(7);
    expect(numeric[2].x).toBe(14);
    expect(numeric[0].y).toBe(90);
    expect(numeric[1].y).toBe(89);
    expect(numeric[2].y).toBe(88);
  });
});
