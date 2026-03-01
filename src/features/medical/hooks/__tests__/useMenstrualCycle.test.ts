import { describe, it, expect } from 'vitest';
import {
  getCyclePhaseKey,
  getCyclePhaseEmoji,
  getCyclePhaseColor,
  getFlowIntensityKey,
  getSymptomKey,
  estimateCyclePhase,
  daysBetweenDates,
} from '../useMenstrualCycle';

describe('getCyclePhaseKey', () => {
  it('returns correct key for each phase', () => {
    expect(getCyclePhaseKey('menstruation')).toBe('menstruation');
    expect(getCyclePhaseKey('follicular')).toBe('follicular');
    expect(getCyclePhaseKey('ovulation')).toBe('ovulation');
    expect(getCyclePhaseKey('luteal')).toBe('luteal');
  });
});

describe('getCyclePhaseEmoji', () => {
  it('returns emoji for each phase', () => {
    expect(getCyclePhaseEmoji('menstruation')).toBe('\u{1FA78}');
    expect(getCyclePhaseEmoji('follicular')).toBe('\u{1F331}');
    expect(getCyclePhaseEmoji('ovulation')).toBe('\u{2728}');
    expect(getCyclePhaseEmoji('luteal')).toBe('\u{1F319}');
  });
});

describe('getCyclePhaseColor', () => {
  it('returns correct Tailwind class for each phase', () => {
    expect(getCyclePhaseColor('menstruation')).toBe('text-red-500');
    expect(getCyclePhaseColor('follicular')).toBe('text-green-500');
    expect(getCyclePhaseColor('ovulation')).toBe('text-amber-500');
    expect(getCyclePhaseColor('luteal')).toBe('text-purple-500');
  });
});

describe('getFlowIntensityKey', () => {
  it('returns i18n key for flow intensity', () => {
    expect(getFlowIntensityKey('light')).toBe('flowLight');
    expect(getFlowIntensityKey('normal')).toBe('flowNormal');
    expect(getFlowIntensityKey('heavy')).toBe('flowHeavy');
  });
});

describe('getSymptomKey', () => {
  it('returns i18n key for symptoms', () => {
    expect(getSymptomKey('cramping')).toBe('cramping');
    expect(getSymptomKey('bloating')).toBe('bloating');
    expect(getSymptomKey('mood_changes')).toBe('moodChanges');
    expect(getSymptomKey('fatigue')).toBe('fatigue');
    expect(getSymptomKey('acne')).toBe('acne');
    expect(getSymptomKey('headache')).toBe('headache');
    expect(getSymptomKey('breast_tenderness')).toBe('breastTenderness');
    expect(getSymptomKey('water_retention')).toBe('waterRetention');
  });
});

describe('estimateCyclePhase', () => {
  it('returns menstruation for days 0-4', () => {
    expect(estimateCyclePhase('2026-03-01', 0)).toBe('menstruation');
    expect(estimateCyclePhase('2026-03-01', 3)).toBe('menstruation');
    expect(estimateCyclePhase('2026-03-01', 4)).toBe('menstruation');
  });

  it('returns follicular for days 5-13 (28-day cycle)', () => {
    expect(estimateCyclePhase('2026-03-01', 5)).toBe('follicular');
    expect(estimateCyclePhase('2026-03-01', 10)).toBe('follicular');
    expect(estimateCyclePhase('2026-03-01', 13)).toBe('follicular');
  });

  it('returns ovulation around day 14-15', () => {
    expect(estimateCyclePhase('2026-03-01', 14)).toBe('ovulation');
    expect(estimateCyclePhase('2026-03-01', 15)).toBe('ovulation');
  });

  it('returns luteal for days 16+', () => {
    expect(estimateCyclePhase('2026-03-01', 16)).toBe('luteal');
    expect(estimateCyclePhase('2026-03-01', 25)).toBe('luteal');
  });

  it('wraps around after cycle length', () => {
    // Day 28 → wraps to day 0 → menstruation
    expect(estimateCyclePhase('2026-03-01', 28, 28)).toBe('menstruation');
    // Day 32 → wraps to day 4 → menstruation
    expect(estimateCyclePhase('2026-03-01', 32, 28)).toBe('menstruation');
  });

  it('works with custom cycle length (35 days)', () => {
    // 35-day cycle: follicular extends to ~17, ovulation at ~17-19
    expect(estimateCyclePhase('2026-03-01', 10, 35)).toBe('follicular');
    expect(estimateCyclePhase('2026-03-01', 18, 35)).toBe('ovulation');
    expect(estimateCyclePhase('2026-03-01', 25, 35)).toBe('luteal');
  });
});

describe('daysBetweenDates', () => {
  it('returns 0 for same date', () => {
    expect(daysBetweenDates('2026-03-01', '2026-03-01')).toBe(0);
  });

  it('returns correct days for sequential dates', () => {
    expect(daysBetweenDates('2026-03-01', '2026-03-08')).toBe(7);
    expect(daysBetweenDates('2026-03-01', '2026-03-02')).toBe(1);
  });

  it('handles month boundaries', () => {
    expect(daysBetweenDates('2026-02-28', '2026-03-01')).toBe(1);
  });

  it('returns absolute value regardless of order', () => {
    expect(daysBetweenDates('2026-03-08', '2026-03-01')).toBe(7);
  });
});
