import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../../app/providers/AuthProvider';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from '../lib/notificationPreferences';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
  type NotificationType,
} from '../types';

/**
 * Hook to read and update notification preferences from localStorage.
 *
 * Re-reads when user changes. Provides granular update functions.
 */
export function useNotificationPreferences() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );

  // Load preferences when user is available
  useEffect(() => {
    if (user) {
      setPrefs(getNotificationPreferences(user.id));
    }
  }, [user]);

  /** Update any subset of preferences */
  const update = useCallback(
    (partial: Partial<NotificationPreferences>) => {
      if (!user) return;
      const next = { ...prefs, ...partial };
      saveNotificationPreferences(user.id, next);
      setPrefs(next);
    },
    [user, prefs],
  );

  /** Toggle a specific notification type */
  const toggleType = useCallback(
    (type: NotificationType) => {
      if (!user) return;
      const next: NotificationPreferences = {
        ...prefs,
        types: {
          ...prefs.types,
          [type]: !prefs.types[type],
        },
      };
      saveNotificationPreferences(user.id, next);
      setPrefs(next);
    },
    [user, prefs],
  );

  /** Toggle the master switch */
  const toggleEnabled = useCallback(() => {
    update({ enabled: !prefs.enabled });
  }, [update, prefs.enabled]);

  /** Toggle quiet hours */
  const toggleQuietHours = useCallback(() => {
    update({
      quietHours: { ...prefs.quietHours, enabled: !prefs.quietHours.enabled },
    });
  }, [update, prefs.quietHours]);

  /** Set daily summary time */
  const setDailySummaryTime = useCallback(
    (time: string) => {
      update({ dailySummaryTime: time });
    },
    [update],
  );

  /** Set quiet hours start/end */
  const setQuietHoursRange = useCallback(
    (start: string, end: string) => {
      update({
        quietHours: { ...prefs.quietHours, start, end },
      });
    },
    [update, prefs.quietHours],
  );

  return {
    prefs,
    update,
    toggleEnabled,
    toggleType,
    toggleQuietHours,
    setDailySummaryTime,
    setQuietHoursRange,
  };
}
