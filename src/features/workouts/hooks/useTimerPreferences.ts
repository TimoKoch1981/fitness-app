/**
 * useTimerPreferences — Persist timer settings per user in localStorage.
 * Pattern follows notificationPreferences.ts (get/save/clear).
 */

import type { AlertMode } from '../utils/timerAlerts';

// ── Types ────────────────────────────────────────────────────────────────

export type TimerMode = 'countdown' | 'stopwatch';

export interface SectionPreference {
  enabled: boolean;
  defaultSeconds: number;
  mode: TimerMode;
}

export interface TimerPreferences {
  globalEnabled: boolean;
  autoAdvance: boolean;
  alertMode: AlertMode;
  sections: {
    total: SectionPreference;
    exercise: SectionPreference;
    exerciseRest: SectionPreference;
    set: SectionPreference;
    setRest: SectionPreference;
  };
}

// ── Defaults ─────────────────────────────────────────────────────────────

export const DEFAULT_TIMER_PREFERENCES: TimerPreferences = {
  globalEnabled: true,
  autoAdvance: true,
  alertMode: 'both',
  sections: {
    total: { enabled: true, defaultSeconds: 3600, mode: 'stopwatch' },
    exercise: { enabled: true, defaultSeconds: 300, mode: 'stopwatch' },
    exerciseRest: { enabled: false, defaultSeconds: 120, mode: 'countdown' },
    set: { enabled: true, defaultSeconds: 60, mode: 'stopwatch' },
    setRest: { enabled: true, defaultSeconds: 90, mode: 'countdown' },
  },
};

// ── Storage Key ──────────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'fitbuddy-timer-prefs-';

// ── Read ─────────────────────────────────────────────────────────────────

export function getTimerPreferences(userId: string): TimerPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + userId);
    if (!raw) return { ...DEFAULT_TIMER_PREFERENCES };
    const parsed = JSON.parse(raw);

    // Deep merge with defaults (forward-compatible)
    return {
      ...DEFAULT_TIMER_PREFERENCES,
      ...parsed,
      sections: {
        total: { ...DEFAULT_TIMER_PREFERENCES.sections.total, ...(parsed.sections?.total ?? {}) },
        exercise: { ...DEFAULT_TIMER_PREFERENCES.sections.exercise, ...(parsed.sections?.exercise ?? {}) },
        exerciseRest: { ...DEFAULT_TIMER_PREFERENCES.sections.exerciseRest, ...(parsed.sections?.exerciseRest ?? {}) },
        set: { ...DEFAULT_TIMER_PREFERENCES.sections.set, ...(parsed.sections?.set ?? {}) },
        setRest: { ...DEFAULT_TIMER_PREFERENCES.sections.setRest, ...(parsed.sections?.setRest ?? {}) },
      },
    };
  } catch {
    return { ...DEFAULT_TIMER_PREFERENCES };
  }
}

// ── Write ────────────────────────────────────────────────────────────────

export function saveTimerPreferences(userId: string, prefs: TimerPreferences): void {
  localStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(prefs));
}

// ── Clear ────────────────────────────────────────────────────────────────

export function clearTimerPreferences(userId: string): void {
  localStorage.removeItem(STORAGE_KEY_PREFIX + userId);
}
