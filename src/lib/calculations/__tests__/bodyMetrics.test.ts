/**
 * Body Metrics Tests — BMI classification, FFMI calculation & classification.
 */
import { describe, it, expect } from 'vitest';
import { classifyBMI, calculateFFMI, classifyFFMI } from '../bodyMetrics';

// ── BMI Classification ────────────────────────────────────────────────

describe('classifyBMI', () => {
  it('classifies BMI < 18.5 as underweight', () => {
    expect(classifyBMI(17.0).category).toBe('underweight');
    expect(classifyBMI(18.4).category).toBe('underweight');
  });

  it('classifies BMI 18.5-24.9 as normal', () => {
    expect(classifyBMI(18.5).category).toBe('normal');
    expect(classifyBMI(22.0).category).toBe('normal');
    expect(classifyBMI(24.9).category).toBe('normal');
  });

  it('classifies BMI 25-29.9 as overweight', () => {
    expect(classifyBMI(25.0).category).toBe('overweight');
    expect(classifyBMI(27.5).category).toBe('overweight');
    expect(classifyBMI(29.9).category).toBe('overweight');
  });

  it('classifies BMI 30-34.9 as obese_1', () => {
    expect(classifyBMI(30.0).category).toBe('obese_1');
    expect(classifyBMI(34.9).category).toBe('obese_1');
  });

  it('classifies BMI 35-39.9 as obese_2', () => {
    expect(classifyBMI(35.0).category).toBe('obese_2');
    expect(classifyBMI(39.9).category).toBe('obese_2');
  });

  it('classifies BMI >= 40 as obese_3', () => {
    expect(classifyBMI(40.0).category).toBe('obese_3');
    expect(classifyBMI(50.0).category).toBe('obese_3');
  });

  it('returns color properties for each classification', () => {
    const normal = classifyBMI(22);
    expect(normal.color).toContain('bg-');
    expect(normal.textColor).toContain('text-');
    expect(normal.label_de).toBeTruthy();
    expect(normal.label_en).toBeTruthy();
  });
});

// ── FFMI Calculation ──────────────────────────────────────────────────

describe('calculateFFMI', () => {
  it('calculates FFMI correctly for 180cm, 73.8kg lean mass', () => {
    // 73.8 / (1.80²) = 73.8 / 3.24 = 22.78
    const result = calculateFFMI(73.8, 180);
    expect(result.ffmi).toBeCloseTo(22.8, 0);
    // normalized: 22.78 + 6.1 * (1.80 - 1.80) = 22.78
    expect(result.normalizedFFMI).toBeCloseTo(22.8, 0);
  });

  it('adjusts normalizedFFMI for shorter height', () => {
    // At 170cm, normalizedFFMI should be higher than raw FFMI
    const result = calculateFFMI(60, 170);
    expect(result.normalizedFFMI).toBeGreaterThan(result.ffmi);
  });

  it('adjusts normalizedFFMI for taller height', () => {
    // At 190cm, normalizedFFMI should be lower than raw FFMI
    const result = calculateFFMI(80, 190);
    expect(result.normalizedFFMI).toBeLessThan(result.ffmi);
  });

  it('returns rounded values to 1 decimal', () => {
    const result = calculateFFMI(73.8, 182);
    expect(result.ffmi.toString()).toMatch(/^\d+\.\d$/);
  });
});

// ── FFMI Classification (Male) ────────────────────────────────────────

describe('classifyFFMI — male', () => {
  it('classifies < 18 as below_average', () => {
    expect(classifyFFMI(17.5, 'male').category).toBe('below_average');
  });

  it('classifies 18-20 as average', () => {
    expect(classifyFFMI(19.0, 'male').category).toBe('average');
  });

  it('classifies 20-22 as above_average', () => {
    expect(classifyFFMI(21.0, 'male').category).toBe('above_average');
  });

  it('classifies 22-25 as excellent', () => {
    expect(classifyFFMI(23.5, 'male').category).toBe('excellent');
  });

  it('classifies 25-26 as superior', () => {
    expect(classifyFFMI(25.5, 'male').category).toBe('superior');
  });

  it('classifies > 26 as suspicious (above natural limit)', () => {
    expect(classifyFFMI(27.0, 'male').category).toBe('suspicious');
  });
});

// ── FFMI Classification (Female) ──────────────────────────────────────

describe('classifyFFMI — female', () => {
  it('classifies < 14 as below_average', () => {
    expect(classifyFFMI(13.0, 'female').category).toBe('below_average');
  });

  it('classifies 14-16.5 as average', () => {
    expect(classifyFFMI(15.0, 'female').category).toBe('average');
  });

  it('classifies 16.5-18 as above_average', () => {
    expect(classifyFFMI(17.0, 'female').category).toBe('above_average');
  });

  it('classifies 18-20 as excellent', () => {
    expect(classifyFFMI(19.0, 'female').category).toBe('excellent');
  });

  it('classifies >= 20 as superior', () => {
    expect(classifyFFMI(21.0, 'female').category).toBe('superior');
  });
});
