import { describe, it, expect } from 'vitest';
import { calculateSleepDuration, formatSleepDuration, getSleepQualityKey } from '../useSleep';

describe('calculateSleepDuration', () => {
  it('calculates same-day duration (morning nap)', () => {
    expect(calculateSleepDuration('13:00', '15:00')).toBe(120);
  });

  it('calculates standard overnight sleep', () => {
    expect(calculateSleepDuration('23:00', '07:00')).toBe(480); // 8h
  });

  it('calculates late bedtime past midnight', () => {
    expect(calculateSleepDuration('01:00', '09:00')).toBe(480); // 8h
  });

  it('calculates short sleep', () => {
    expect(calculateSleepDuration('00:30', '05:30')).toBe(300); // 5h
  });

  it('calculates with minutes', () => {
    expect(calculateSleepDuration('22:45', '06:15')).toBe(450); // 7h 30min
  });

  it('handles midnight bedtime', () => {
    expect(calculateSleepDuration('00:00', '08:00')).toBe(480); // 8h
  });

  it('handles midnight wake time (24h sleep edge case)', () => {
    // 23:00 to 23:00 = 0 (same time, same day interpretation)
    expect(calculateSleepDuration('23:00', '23:00')).toBe(0);
  });

  it('handles very early wake time', () => {
    expect(calculateSleepDuration('22:00', '04:00')).toBe(360); // 6h
  });
});

describe('formatSleepDuration', () => {
  it('formats hours only', () => {
    expect(formatSleepDuration(480)).toBe('8h');
  });

  it('formats hours and minutes', () => {
    expect(formatSleepDuration(450)).toBe('7h 30min');
  });

  it('formats minutes only (< 1h)', () => {
    expect(formatSleepDuration(45)).toBe('45min');
  });

  it('formats zero', () => {
    expect(formatSleepDuration(0)).toBe('0min');
  });

  it('formats 1 hour exactly', () => {
    expect(formatSleepDuration(60)).toBe('1h');
  });
});

describe('getSleepQualityKey', () => {
  it('returns correct keys for all quality levels', () => {
    expect(getSleepQualityKey(1)).toBe('veryPoor');
    expect(getSleepQualityKey(2)).toBe('poor');
    expect(getSleepQualityKey(3)).toBe('fair');
    expect(getSleepQualityKey(4)).toBe('good');
    expect(getSleepQualityKey(5)).toBe('veryGood');
  });

  it('returns "fair" for invalid quality', () => {
    expect(getSleepQualityKey(0)).toBe('fair');
    expect(getSleepQualityKey(6)).toBe('fair');
  });
});
