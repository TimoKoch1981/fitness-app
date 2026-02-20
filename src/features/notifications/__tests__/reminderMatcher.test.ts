import { describe, it, expect } from 'vitest';
import { isReminderTimeNow, isReminderDueOnDate, getNextOccurrence } from '../lib/reminderMatcher';
import type { Reminder } from '../../../types/health';

// Helper: create a minimal reminder
function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 'test-1',
    user_id: 'user-1',
    type: 'substance',
    title: 'Test Reminder',
    days_of_week: [0, 1, 2, 3, 4, 5, 6], // Every day
    is_active: true,
    repeat_mode: 'weekly',
    created_at: '2026-02-01T00:00:00Z',
    ...overrides,
  };
}

// Helper: create a Date at a specific time
const at = (h: number, m: number) => {
  const d = new Date(2026, 1, 20); // Feb 20, 2026 (Friday, day=5)
  d.setHours(h, m, 0, 0);
  return d;
};

describe('isReminderTimeNow', () => {
  it('matches exact time within tolerance', () => {
    const reminder = makeReminder({ time: '08:30' });
    expect(isReminderTimeNow(reminder, 2, at(8, 30))).toBe(true);
    expect(isReminderTimeNow(reminder, 2, at(8, 31))).toBe(true);
    expect(isReminderTimeNow(reminder, 2, at(8, 29))).toBe(true);
    expect(isReminderTimeNow(reminder, 2, at(8, 32))).toBe(true);
  });

  it('does NOT match outside tolerance', () => {
    const reminder = makeReminder({ time: '08:30' });
    expect(isReminderTimeNow(reminder, 2, at(8, 33))).toBe(false);
    expect(isReminderTimeNow(reminder, 2, at(8, 27))).toBe(false);
    expect(isReminderTimeNow(reminder, 2, at(9, 0))).toBe(false);
  });

  it('matches morning period at 07:00', () => {
    const reminder = makeReminder({ time: undefined, time_period: 'morning' });
    expect(isReminderTimeNow(reminder, 2, at(7, 0))).toBe(true);
    expect(isReminderTimeNow(reminder, 2, at(7, 1))).toBe(true);
    expect(isReminderTimeNow(reminder, 2, at(6, 58))).toBe(true);
  });

  it('matches noon period at 12:00', () => {
    const reminder = makeReminder({ time: undefined, time_period: 'noon' });
    expect(isReminderTimeNow(reminder, 2, at(12, 0))).toBe(true);
    expect(isReminderTimeNow(reminder, 2, at(12, 2))).toBe(true);
  });

  it('matches evening period at 19:00', () => {
    const reminder = makeReminder({ time: undefined, time_period: 'evening' });
    expect(isReminderTimeNow(reminder, 2, at(19, 0))).toBe(true);
  });

  it('does NOT match period at wrong time', () => {
    const reminder = makeReminder({ time: undefined, time_period: 'morning' });
    expect(isReminderTimeNow(reminder, 2, at(12, 0))).toBe(false);
    expect(isReminderTimeNow(reminder, 2, at(19, 0))).toBe(false);
  });

  it('returns false when no time and no period', () => {
    const reminder = makeReminder({ time: undefined, time_period: undefined });
    expect(isReminderTimeNow(reminder, 2, at(12, 0))).toBe(false);
  });
});

describe('isReminderDueOnDate', () => {
  it('weekly: matches when day is in days_of_week', () => {
    // Feb 20, 2026 is Friday (day=5)
    const reminder = makeReminder({ days_of_week: [5] }); // Friday only
    expect(isReminderDueOnDate(reminder, at(12, 0))).toBe(true);
  });

  it('weekly: does NOT match wrong day', () => {
    const reminder = makeReminder({ days_of_week: [1, 3] }); // Mon, Wed only
    // Friday (day=5) is NOT in the list
    expect(isReminderDueOnDate(reminder, at(12, 0))).toBe(false);
  });

  it('weekly: matches every day', () => {
    const reminder = makeReminder({ days_of_week: [0, 1, 2, 3, 4, 5, 6] });
    expect(isReminderDueOnDate(reminder, at(12, 0))).toBe(true);
  });

  it('interval: matches on correct interval day', () => {
    // Created Feb 1, now Feb 20 = 19 days later
    // interval_days = 7 → 19 % 7 = 5 → NOT a match
    const reminder = makeReminder({
      repeat_mode: 'interval',
      interval_days: 7,
      created_at: '2026-02-01T00:00:00Z',
    });
    expect(isReminderDueOnDate(reminder, at(12, 0))).toBe(false);
  });

  it('interval: matches when exactly on interval', () => {
    // Created Feb 6, now Feb 20 = 14 days later
    // interval_days = 7 → 14 % 7 = 0 → MATCH
    const reminder = makeReminder({
      repeat_mode: 'interval',
      interval_days: 7,
      created_at: '2026-02-06T00:00:00Z',
    });
    expect(isReminderDueOnDate(reminder, at(12, 0))).toBe(true);
  });
});

describe('getNextOccurrence', () => {
  it('returns today if reminder time is in the future today', () => {
    const reminder = makeReminder({ time: '20:00' }); // 8 PM
    const from = at(10, 0); // 10 AM
    const next = getNextOccurrence(reminder, from);
    expect(next).not.toBeNull();
    expect(next!.getHours()).toBe(20);
    expect(next!.getMinutes()).toBe(0);
  });

  it('returns null when no time set', () => {
    const reminder = makeReminder({ time: undefined, time_period: undefined });
    expect(getNextOccurrence(reminder, at(10, 0))).toBeNull();
  });

  it('returns a future date for period-based reminders', () => {
    const reminder = makeReminder({ time: undefined, time_period: 'evening' });
    const from = at(10, 0); // 10 AM — evening (19:00) is still ahead
    const next = getNextOccurrence(reminder, from);
    expect(next).not.toBeNull();
    expect(next!.getHours()).toBe(19);
  });
});
