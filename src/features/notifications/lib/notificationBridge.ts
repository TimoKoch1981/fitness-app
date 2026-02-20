/**
 * Notification Bridge — abstracts Capacitor Native vs. Web Notification API.
 *
 * On native (Android/iOS via Capacitor): Uses @capacitor/local-notifications
 * On web (browser dev): Uses the Notification API as fallback
 */
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { NotificationPayload } from '../types';
import { NOTIFICATION_ROUTES } from '../types';

// ── Permission ──────────────────────────────────────────────────────────────

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

/**
 * Check current notification permission state.
 */
export async function getPermissionState(): Promise<PermissionState> {
  if (Capacitor.isNativePlatform()) {
    const result = await LocalNotifications.checkPermissions();
    return result.display as PermissionState;
  }

  if (!('Notification' in window)) return 'unsupported';
  const perm = Notification.permission;
  if (perm === 'granted') return 'granted';
  if (perm === 'denied') return 'denied';
  return 'prompt';
}

/**
 * Request notification permission from the user.
 */
export async function requestPermission(): Promise<PermissionState> {
  if (Capacitor.isNativePlatform()) {
    const result = await LocalNotifications.requestPermissions();
    return result.display as PermissionState;
  }

  if (!('Notification' in window)) return 'unsupported';
  const result = await Notification.requestPermission();
  if (result === 'granted') return 'granted';
  if (result === 'denied') return 'denied';
  return 'prompt';
}

/**
 * Check if notifications are supported on this platform.
 */
export function isSupported(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  return 'Notification' in window;
}

// ── Schedule / Cancel ───────────────────────────────────────────────────────

/**
 * Schedule a local notification at a specific time.
 *
 * Native: Uses Capacitor LocalNotifications.schedule()
 * Web: Uses setTimeout + Notification API (only works while app is open)
 */
export async function scheduleNotification(payload: NotificationPayload): Promise<void> {
  const route = payload.route ?? NOTIFICATION_ROUTES[payload.type] ?? '/dashboard';

  if (Capacitor.isNativePlatform()) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: payload.id,
          title: payload.title,
          body: payload.body,
          schedule: { at: payload.at },
          extra: { route, type: payload.type },
        },
      ],
    });
    return;
  }

  // Web fallback: setTimeout for development testing
  const delay = payload.at.getTime() - Date.now();
  if (delay > 0 && delay < 86_400_000) {
    // Only schedule if within 24 hours (avoid memory leaks)
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.body,
          tag: `fitbuddy-${payload.type}-${payload.id}`,
          icon: '/icons/icon-192.png',
        });
      }
    }, delay);
  }
}

/**
 * Schedule multiple notifications at once.
 */
export async function scheduleMultiple(payloads: NotificationPayload[]): Promise<void> {
  if (Capacitor.isNativePlatform() && payloads.length > 0) {
    await LocalNotifications.schedule({
      notifications: payloads.map((p) => ({
        id: p.id,
        title: p.title,
        body: p.body,
        schedule: { at: p.at },
        extra: {
          route: p.route ?? NOTIFICATION_ROUTES[p.type] ?? '/dashboard',
          type: p.type,
        },
      })),
    });
    return;
  }

  // Web: schedule individually
  for (const payload of payloads) {
    await scheduleNotification(payload);
  }
}

/**
 * Cancel all pending notifications.
 */
export async function cancelAllPending(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }
  }
  // Web: no way to cancel setTimeout-based notifications
}

/**
 * Register a listener for notification clicks (native only).
 * Returns a cleanup function.
 */
export function onNotificationClick(
  handler: (route: string) => void,
): (() => void) | null {
  if (!Capacitor.isNativePlatform()) return null;

  const listener = LocalNotifications.addListener(
    'localNotificationActionPerformed',
    (action) => {
      const route = action.notification.extra?.route ?? '/dashboard';
      handler(route);
    },
  );

  return () => {
    listener.then((l) => l.remove());
  };
}
