/**
 * Tests for useTimerPreferences — localStorage timer prefs.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTimerPreferences,
  saveTimerPreferences,
  clearTimerPreferences,
  DEFAULT_TIMER_PREFERENCES,
} from '../useTimerPreferences';

const TEST_USER_ID = 'test-user-123';

describe('useTimerPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when nothing stored', () => {
    const prefs = getTimerPreferences(TEST_USER_ID);
    expect(prefs).toEqual(DEFAULT_TIMER_PREFERENCES);
  });

  it('saves and reads preferences', () => {
    const custom = {
      ...DEFAULT_TIMER_PREFERENCES,
      autoAdvance: false,
      alertMode: 'sound' as const,
    };

    saveTimerPreferences(TEST_USER_ID, custom);
    const loaded = getTimerPreferences(TEST_USER_ID);

    expect(loaded.autoAdvance).toBe(false);
    expect(loaded.alertMode).toBe('sound');
  });

  it('clears preferences', () => {
    saveTimerPreferences(TEST_USER_ID, {
      ...DEFAULT_TIMER_PREFERENCES,
      autoAdvance: false,
    });

    clearTimerPreferences(TEST_USER_ID);
    const loaded = getTimerPreferences(TEST_USER_ID);

    expect(loaded.autoAdvance).toBe(true); // back to default
  });

  it('deep-merges sections with defaults', () => {
    // Store partial sections
    localStorage.setItem(
      `fitbuddy-timer-prefs-${TEST_USER_ID}`,
      JSON.stringify({
        sections: {
          total: { enabled: false },
          // Other sections missing — should use defaults
        },
      }),
    );

    const loaded = getTimerPreferences(TEST_USER_ID);

    expect(loaded.sections.total.enabled).toBe(false);
    expect(loaded.sections.total.mode).toBe('stopwatch'); // from default
    expect(loaded.sections.setRest.enabled).toBe(true); // from default
    expect(loaded.sections.setRest.defaultSeconds).toBe(90); // from default
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(
      `fitbuddy-timer-prefs-${TEST_USER_ID}`,
      'not-valid-json{{{',
    );

    const loaded = getTimerPreferences(TEST_USER_ID);
    expect(loaded).toEqual(DEFAULT_TIMER_PREFERENCES);
  });

  it('separates preferences per user', () => {
    saveTimerPreferences('user-a', {
      ...DEFAULT_TIMER_PREFERENCES,
      autoAdvance: false,
    });
    saveTimerPreferences('user-b', {
      ...DEFAULT_TIMER_PREFERENCES,
      alertMode: 'none',
    });

    expect(getTimerPreferences('user-a').autoAdvance).toBe(false);
    expect(getTimerPreferences('user-a').alertMode).toBe('both'); // default

    expect(getTimerPreferences('user-b').autoAdvance).toBe(true); // default
    expect(getTimerPreferences('user-b').alertMode).toBe('none');
  });
});
