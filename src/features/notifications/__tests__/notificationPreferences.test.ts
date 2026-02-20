import { describe, it, expect, beforeEach } from 'vitest';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  clearNotificationPreferences,
} from '../lib/notificationPreferences';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../types';

const TEST_USER = 'test-user-123';

describe('notificationPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when no stored value', () => {
    const prefs = getNotificationPreferences(TEST_USER);
    expect(prefs).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it('saves and reads back preferences', () => {
    const custom = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      enabled: true,
      dailySummaryTime: '20:00',
    };
    saveNotificationPreferences(TEST_USER, custom);
    const loaded = getNotificationPreferences(TEST_USER);
    expect(loaded.enabled).toBe(true);
    expect(loaded.dailySummaryTime).toBe('20:00');
  });

  it('merges partial saved data with defaults', () => {
    // Simulate an older version that only stored { enabled: true }
    localStorage.setItem(
      'fitbuddy-notification-prefs-' + TEST_USER,
      JSON.stringify({ enabled: true }),
    );
    const prefs = getNotificationPreferences(TEST_USER);
    expect(prefs.enabled).toBe(true);
    // Should still have all default types
    expect(prefs.types.substance).toBe(true);
    expect(prefs.types.daily_summary).toBe(true);
    // Should still have default quiet hours
    expect(prefs.quietHours.start).toBe('22:00');
    expect(prefs.quietHours.end).toBe('07:00');
  });

  it('handles corrupted JSON gracefully', () => {
    localStorage.setItem(
      'fitbuddy-notification-prefs-' + TEST_USER,
      'NOT_VALID_JSON!!!',
    );
    const prefs = getNotificationPreferences(TEST_USER);
    expect(prefs).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it('clears preferences', () => {
    saveNotificationPreferences(TEST_USER, {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      enabled: true,
    });
    clearNotificationPreferences(TEST_USER);
    const prefs = getNotificationPreferences(TEST_USER);
    expect(prefs.enabled).toBe(false); // Back to default
  });

  it('isolates preferences per user', () => {
    saveNotificationPreferences('user-A', {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      enabled: true,
    });
    saveNotificationPreferences('user-B', {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      enabled: false,
    });
    expect(getNotificationPreferences('user-A').enabled).toBe(true);
    expect(getNotificationPreferences('user-B').enabled).toBe(false);
  });

  it('preserves type toggles on save', () => {
    const custom = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      types: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.types,
        substance: false,
        daily_summary: false,
      },
    };
    saveNotificationPreferences(TEST_USER, custom);
    const loaded = getNotificationPreferences(TEST_USER);
    expect(loaded.types.substance).toBe(false);
    expect(loaded.types.daily_summary).toBe(false);
    expect(loaded.types.blood_pressure).toBe(true); // Unchanged
  });
});
