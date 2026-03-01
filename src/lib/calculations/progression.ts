/**
 * Progression Analysis — Linear regression, moving averages, plateau detection.
 * All functions are pure math (no React, no side effects).
 */

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
}

export interface PlateauResult {
  isPlateau: boolean;
  durationDays: number;
  averageValue: number;
}

/**
 * Ordinary least squares linear regression.
 * Returns slope (change per unit x), intercept, and R-squared.
 */
export function calculateLinearRegression(
  points: { x: number; y: number }[]
): RegressionResult | null {
  const n = points.length;
  if (n < 2) return null;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, _sumY2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
    _sumY2 += p.y * p.y;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R-squared
  const ssRes = points.reduce((sum, p) => {
    const predicted = slope * p.x + intercept;
    return sum + (p.y - predicted) ** 2;
  }, 0);
  const meanY = sumY / n;
  const ssTot = points.reduce((sum, p) => sum + (p.y - meanY) ** 2, 0);
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  return { slope, intercept, rSquared };
}

/**
 * Predict a value at a given x using regression result.
 */
export function predictValue(regression: RegressionResult, x: number): number {
  return regression.slope * x + regression.intercept;
}

/**
 * Simple moving average with given window size.
 * Returns null for positions where the window is incomplete.
 */
export function calculateMovingAverage(
  values: number[],
  windowSize: number
): (number | null)[] {
  if (windowSize < 1) return values.map(() => null);

  return values.map((_, i) => {
    if (i < windowSize - 1) return null;
    let sum = 0;
    for (let j = i - windowSize + 1; j <= i; j++) {
      sum += values[j];
    }
    return sum / windowSize;
  });
}

/**
 * Detect a plateau: slope near zero for at least minDays.
 * Looks at the most recent data.
 */
export function detectPlateau(
  points: { date: string; value: number }[],
  thresholdPerDay: number = 0.02,
  minDays: number = 14
): PlateauResult {
  if (points.length < 3) {
    return { isPlateau: false, durationDays: 0, averageValue: 0 };
  }

  // Convert to day offsets
  const firstDate = new Date(points[0].date).getTime();
  const numericPoints = points.map(p => ({
    x: (new Date(p.date).getTime() - firstDate) / (1000 * 60 * 60 * 24),
    y: p.value,
  }));

  // Check from the end, progressively including more points
  for (let windowStart = numericPoints.length - 3; windowStart >= 0; windowStart--) {
    const window = numericPoints.slice(windowStart);
    const reg = calculateLinearRegression(window);
    if (!reg) continue;

    const durationDays = window[window.length - 1].x - window[0].x;
    if (Math.abs(reg.slope) > thresholdPerDay) {
      // This window has significant slope — the plateau starts after this
      const plateauPoints = numericPoints.slice(windowStart + 1);
      if (plateauPoints.length < 2) break;
      const pDuration = plateauPoints[plateauPoints.length - 1].x - plateauPoints[0].x;
      if (pDuration >= minDays) {
        const avgValue = plateauPoints.reduce((s, p) => s + p.y, 0) / plateauPoints.length;
        return { isPlateau: true, durationDays: Math.round(pDuration), averageValue: Math.round(avgValue * 10) / 10 };
      }
      break;
    }

    // If entire dataset is flat
    if (windowStart === 0 && durationDays >= minDays) {
      const avgValue = numericPoints.reduce((s, p) => s + p.y, 0) / numericPoints.length;
      return { isPlateau: true, durationDays: Math.round(durationDays), averageValue: Math.round(avgValue * 10) / 10 };
    }
  }

  return { isPlateau: false, durationDays: 0, averageValue: 0 };
}

/**
 * Calculate weekly rate of change from data points.
 */
export function calculateWeeklyRate(
  points: { date: string; value: number }[]
): number | null {
  if (points.length < 2) return null;

  const firstDate = new Date(points[0].date).getTime();
  const numericPoints = points.map(p => ({
    x: (new Date(p.date).getTime() - firstDate) / (1000 * 60 * 60 * 24),
    y: p.value,
  }));

  const reg = calculateLinearRegression(numericPoints);
  if (!reg) return null;

  return Math.round(reg.slope * 7 * 100) / 100; // units per week, 2 decimals
}

/**
 * Estimate days until target value is reached at current rate.
 * Returns null if rate is in the wrong direction or zero.
 */
export function estimateTimeToTarget(
  currentValue: number,
  targetValue: number,
  dailyRate: number
): number | null {
  if (dailyRate === 0) return null;

  const diff = targetValue - currentValue;
  // Rate must be in the right direction
  if ((diff > 0 && dailyRate <= 0) || (diff < 0 && dailyRate >= 0)) return null;

  const days = Math.abs(diff / dailyRate);
  return Math.round(days);
}

/**
 * Calculate the calendar date when a goal will be reached.
 * Returns ISO date string (YYYY-MM-DD) or null if days is null/invalid.
 *
 * @param days - Days until goal (from estimateTimeToTarget)
 * @param fromDate - Reference date, defaults to today
 */
export function calculateGoalDate(
  days: number | null,
  fromDate?: string
): string | null {
  if (days === null || days <= 0) return null;
  const base = fromDate ? new Date(fromDate) : new Date();
  base.setDate(base.getDate() + days);
  return base.toISOString().split('T')[0];
}

/**
 * Format days into a human-readable duration (weeks or months).
 * @returns e.g., "~8 Wochen" / "~8 weeks" or "~3 Monate" / "~3 months"
 */
export function formatDaysAsDuration(
  days: number | null,
  language: 'de' | 'en' = 'de'
): string | null {
  if (days === null || days <= 0) return null;
  const de = language === 'de';

  if (days < 14) {
    return `~${days} ${de ? 'Tage' : 'days'}`;
  }
  if (days < 90) {
    const weeks = Math.round(days / 7);
    return `~${weeks} ${de ? 'Wochen' : 'weeks'}`;
  }
  const months = Math.round(days / 30);
  return `~${months} ${de ? 'Monate' : 'months'}`;
}

/**
 * Convert date-value pairs to regression-ready numeric points.
 * Uses day offsets from the first date.
 */
export function datesToNumericPoints(
  points: { date: string; value: number }[]
): { x: number; y: number }[] {
  if (points.length === 0) return [];
  const firstDate = new Date(points[0].date).getTime();
  return points.map(p => ({
    x: (new Date(p.date).getTime() - firstDate) / (1000 * 60 * 60 * 24),
    y: p.value,
  }));
}
