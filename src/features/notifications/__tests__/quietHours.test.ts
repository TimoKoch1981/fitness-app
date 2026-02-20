import { describe, it, expect } from 'vitest';
import { isInQuietHours, parseTimeToMinutes } from '../lib/quietHours';

describe('parseTimeToMinutes', () => {
  it('parses midnight', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0);
  });

  it('parses noon', () => {
    expect(parseTimeToMinutes('12:00')).toBe(720);
  });

  it('parses evening', () => {
    expect(parseTimeToMinutes('22:30')).toBe(1350);
  });

  it('parses end of day', () => {
    expect(parseTimeToMinutes('23:59')).toBe(1439);
  });
});

describe('isInQuietHours', () => {
  // Helper: create a Date at a specific hour:minute
  const at = (h: number, m: number) => {
    const d = new Date(2026, 1, 20); // Feb 20, 2026
    d.setHours(h, m, 0, 0);
    return d;
  };

  describe('overnight range (22:00 - 07:00)', () => {
    it('23:00 is within quiet hours', () => {
      expect(isInQuietHours('22:00', '07:00', at(23, 0))).toBe(true);
    });

    it('02:00 is within quiet hours', () => {
      expect(isInQuietHours('22:00', '07:00', at(2, 0))).toBe(true);
    });

    it('00:00 (midnight) is within quiet hours', () => {
      expect(isInQuietHours('22:00', '07:00', at(0, 0))).toBe(true);
    });

    it('22:00 (exactly start) is within quiet hours', () => {
      expect(isInQuietHours('22:00', '07:00', at(22, 0))).toBe(true);
    });

    it('06:59 is within quiet hours', () => {
      expect(isInQuietHours('22:00', '07:00', at(6, 59))).toBe(true);
    });

    it('07:00 (exactly end) is NOT within quiet hours', () => {
      expect(isInQuietHours('22:00', '07:00', at(7, 0))).toBe(false);
    });

    it('12:00 (noon) is NOT within quiet hours', () => {
      expect(isInQuietHours('22:00', '07:00', at(12, 0))).toBe(false);
    });

    it('21:59 is NOT within quiet hours', () => {
      expect(isInQuietHours('22:00', '07:00', at(21, 59))).toBe(false);
    });
  });

  describe('same-day range (13:00 - 15:00)', () => {
    it('14:00 is within quiet hours', () => {
      expect(isInQuietHours('13:00', '15:00', at(14, 0))).toBe(true);
    });

    it('13:00 (exactly start) is within quiet hours', () => {
      expect(isInQuietHours('13:00', '15:00', at(13, 0))).toBe(true);
    });

    it('15:00 (exactly end) is NOT within quiet hours', () => {
      expect(isInQuietHours('13:00', '15:00', at(15, 0))).toBe(false);
    });

    it('12:00 is NOT within quiet hours', () => {
      expect(isInQuietHours('13:00', '15:00', at(12, 0))).toBe(false);
    });

    it('16:00 is NOT within quiet hours', () => {
      expect(isInQuietHours('13:00', '15:00', at(16, 0))).toBe(false);
    });
  });
});
