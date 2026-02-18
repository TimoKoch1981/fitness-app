import { describe, it, expect } from 'vitest';
import {
  calculateTDEE_PAL,
  calculateTDEE_MET,
  calculateActivityCalories,
  getPALDescription,
} from '../tdee';

describe('calculateTDEE_PAL', () => {
  it('calculates TDEE with sedentary PAL (1.4)', () => {
    // 1800 * 1.4 = 2520
    expect(calculateTDEE_PAL(1800, 1.4)).toBe(2520);
  });

  it('calculates TDEE with moderately active PAL (1.7)', () => {
    // 1800 * 1.7 = 3060
    expect(calculateTDEE_PAL(1800, 1.7)).toBe(3060);
  });

  it('calculates TDEE with default PAL (1.55)', () => {
    // 1730 * 1.55 = 2681.5 → 2682 (rounded)
    expect(calculateTDEE_PAL(1730, 1.55)).toBe(2682);
  });

  it('returns higher TDEE for higher PAL', () => {
    const sedentary = calculateTDEE_PAL(1800, 1.4);
    const active = calculateTDEE_PAL(1800, 1.9);
    expect(active).toBeGreaterThan(sedentary);
  });
});

describe('calculateTDEE_MET', () => {
  it('calculates TDEE with single activity', () => {
    // BMR=1800, 80kg, running (MET=8) for 60min
    // Activity = 8 * 80 * 1.0 = 640
    // TDEE = 1800 + 640 = 2440
    expect(calculateTDEE_MET(1800, 80, [
      { met: 8, duration_minutes: 60 },
    ])).toBe(2440);
  });

  it('calculates TDEE with multiple activities', () => {
    // BMR=1800, 80kg
    // Walking (MET=3.5) for 30min: 3.5 * 80 * 0.5 = 140
    // Cycling (MET=6) for 45min: 6 * 80 * 0.75 = 360
    // Total activity = 500
    // TDEE = 1800 + 500 = 2300
    expect(calculateTDEE_MET(1800, 80, [
      { met: 3.5, duration_minutes: 30 },
      { met: 6, duration_minutes: 45 },
    ])).toBe(2300);
  });

  it('returns BMR when no activities', () => {
    expect(calculateTDEE_MET(1800, 80, [])).toBe(1800);
  });
});

describe('calculateActivityCalories', () => {
  it('calculates calories for running (MET=8, 80kg, 60min)', () => {
    // 8 * 80 * 1.0 = 640
    expect(calculateActivityCalories(8, 80, 60)).toBe(640);
  });

  it('calculates calories for walking (MET=3.5, 70kg, 30min)', () => {
    // 3.5 * 70 * 0.5 = 122.5 → 123
    expect(calculateActivityCalories(3.5, 70, 30)).toBe(123);
  });

  it('returns 0 for 0 duration', () => {
    expect(calculateActivityCalories(8, 80, 0)).toBe(0);
  });
});

describe('getPALDescription', () => {
  it('returns bedridden for very low PAL', () => {
    expect(getPALDescription(1.1)).toBe('bedridden');
  });

  it('returns sedentary for PAL 1.3', () => {
    expect(getPALDescription(1.3)).toBe('sedentary');
  });

  it('returns lightly_active for PAL 1.5', () => {
    expect(getPALDescription(1.5)).toBe('lightly_active');
  });

  it('returns moderately_active for PAL 1.65', () => {
    expect(getPALDescription(1.65)).toBe('moderately_active');
  });

  it('returns very_active for PAL 1.85', () => {
    expect(getPALDescription(1.85)).toBe('very_active');
  });

  it('returns extremely_active for PAL 2.3', () => {
    expect(getPALDescription(2.3)).toBe('extremely_active');
  });
});
