import { DEFAULT_NOTIFICATION_PREFERENCES, type NotificationPreferences } from '../types';

const STORAGE_KEY_PREFIX = 'fitbuddy-notification-prefs-';

/**
 * Read notification preferences from localStorage.
 * Returns defaults if nothing stored or data is corrupted.
 */
export function getNotificationPreferences(userId: string): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + userId);
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    const parsed = JSON.parse(raw);
    // Merge with defaults to ensure all fields exist (forward-compatible)
    return {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...parsed,
      types: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.types,
        ...(parsed.types ?? {}),
      },
      quietHours: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.quietHours,
        ...(parsed.quietHours ?? {}),
      },
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

/**
 * Save notification preferences to localStorage.
 */
export function saveNotificationPreferences(
  userId: string,
  prefs: NotificationPreferences,
): void {
  localStorage.setItem(STORAGE_KEY_PREFIX + userId, JSON.stringify(prefs));
}

/**
 * Clear notification preferences from localStorage.
 */
export function clearNotificationPreferences(userId: string): void {
  localStorage.removeItem(STORAGE_KEY_PREFIX + userId);
}
