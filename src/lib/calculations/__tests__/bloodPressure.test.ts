import { describe, it, expect } from 'vitest';
import { classifyBloodPressure, detectBPTrend } from '../bloodPressure';

describe('classifyBloodPressure', () => {
  it('classifies optimal (< 120/80)', () => {
    const result = classifyBloodPressure(115, 75);
    expect(result.classification).toBe('optimal');
    expect(result.color).toBe('green');
    expect(result.severity).toBe(0);
  });

  it('classifies normal (120-129 / 80-84)', () => {
    expect(classifyBloodPressure(125, 82).classification).toBe('normal');
  });

  it('classifies high-normal (130-139 / 85-89)', () => {
    expect(classifyBloodPressure(135, 87).classification).toBe('high_normal');
  });

  it('classifies hypertension grade 1 (140-159 / 90-99)', () => {
    const result = classifyBloodPressure(145, 92);
    expect(result.classification).toBe('hypertension_1');
    expect(result.color).toBe('orange');
  });

  it('classifies hypertension grade 2 (160-179 / 100-109)', () => {
    const result = classifyBloodPressure(165, 105);
    expect(result.classification).toBe('hypertension_2');
    expect(result.color).toBe('red');
  });

  it('classifies hypertension grade 3 (>= 180 / >= 110)', () => {
    const result = classifyBloodPressure(185, 115);
    expect(result.classification).toBe('hypertension_3');
    expect(result.severity).toBe(5);
  });

  // Boundary tests
  it('boundary: 119/79 = optimal', () => {
    expect(classifyBloodPressure(119, 79).classification).toBe('optimal');
  });

  it('boundary: 120/80 = normal', () => {
    expect(classifyBloodPressure(120, 80).classification).toBe('normal');
  });

  it('boundary: 130/85 = high_normal', () => {
    expect(classifyBloodPressure(130, 85).classification).toBe('high_normal');
  });

  it('boundary: 140/90 = hypertension_1', () => {
    expect(classifyBloodPressure(140, 90).classification).toBe('hypertension_1');
  });

  it('boundary: 160/100 = hypertension_2', () => {
    expect(classifyBloodPressure(160, 100).classification).toBe('hypertension_2');
  });

  it('boundary: 180/110 = hypertension_3', () => {
    expect(classifyBloodPressure(180, 110).classification).toBe('hypertension_3');
  });

  // Higher classification wins
  it('uses higher classification when systolic/diastolic differ', () => {
    // Systolic = hypertension_1 (145), diastolic = optimal (70)
    const result = classifyBloodPressure(145, 70);
    expect(result.classification).toBe('hypertension_1');
  });

  it('uses diastolic when it is more severe', () => {
    // Systolic = normal (125), diastolic = hypertension_1 (95)
    const result = classifyBloodPressure(125, 95);
    expect(result.classification).toBe('hypertension_1');
  });
});

describe('detectBPTrend', () => {
  it('returns rising=false with fewer than minReadings', () => {
    const result = detectBPTrend([
      { systolic: 120, diastolic: 80, date: '2026-01-01' },
    ], 3);
    expect(result.rising).toBe(false);
    expect(result.avgSystolic).toBe(0);
  });

  it('detects rising trend when all readings increase', () => {
    const result = detectBPTrend([
      { systolic: 120, diastolic: 80, date: '2026-01-01' },
      { systolic: 130, diastolic: 85, date: '2026-01-02' },
      { systolic: 140, diastolic: 90, date: '2026-01-03' },
    ], 3);
    expect(result.rising).toBe(true);
  });

  it('does not detect rising when readings are stable', () => {
    const result = detectBPTrend([
      { systolic: 120, diastolic: 80, date: '2026-01-01' },
      { systolic: 120, diastolic: 80, date: '2026-01-02' },
      { systolic: 120, diastolic: 80, date: '2026-01-03' },
    ], 3);
    expect(result.rising).toBe(false);
  });

  it('does not detect rising when readings decrease', () => {
    const result = detectBPTrend([
      { systolic: 140, diastolic: 90, date: '2026-01-01' },
      { systolic: 130, diastolic: 85, date: '2026-01-02' },
      { systolic: 120, diastolic: 80, date: '2026-01-03' },
    ], 3);
    expect(result.rising).toBe(false);
  });

  it('calculates correct averages', () => {
    const result = detectBPTrend([
      { systolic: 120, diastolic: 80, date: '2026-01-01' },
      { systolic: 130, diastolic: 85, date: '2026-01-02' },
      { systolic: 140, diastolic: 90, date: '2026-01-03' },
    ], 3);
    expect(result.avgSystolic).toBe(130); // (120+130+140)/3
    expect(result.avgDiastolic).toBe(85); // (80+85+90)/3
  });

  it('sorts by date before analyzing', () => {
    // Out-of-order dates
    const result = detectBPTrend([
      { systolic: 140, diastolic: 90, date: '2026-01-03' },
      { systolic: 120, diastolic: 80, date: '2026-01-01' },
      { systolic: 130, diastolic: 85, date: '2026-01-02' },
    ], 3);
    expect(result.rising).toBe(true);
  });

  it('detects rising from diastolic only', () => {
    const result = detectBPTrend([
      { systolic: 120, diastolic: 80, date: '2026-01-01' },
      { systolic: 120, diastolic: 85, date: '2026-01-02' },
      { systolic: 120, diastolic: 90, date: '2026-01-03' },
    ], 3);
    expect(result.rising).toBe(true);
  });
});
