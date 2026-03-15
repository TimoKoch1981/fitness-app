/**
 * Refeed Reminder Scheduler — Schedules local notifications for refeed days.
 *
 * Reads refeed config from localStorage and schedules notifications
 * the evening before each refeed day (default 20:00).
 *
 * Uses the existing notification bridge for cross-platform support.
 */

import { scheduleNotification, getPermissionState } from '../../notifications/lib/notificationBridge';
import type { NotificationPayload } from '../../notifications/types';

const LS_KEY = 'fitbuddy_refeed_config';
const LS_REMINDER_KEY = 'fitbuddy_refeed_reminder_config';

interface RefeedConfig {
  refeedDays: number[]; // 0=Mon, 6=Sun
  dietBreakStart: string | null;
  dietBreakDuration: number;
}

interface ReminderConfig {
  enabled: boolean;
  time: string; // HH:mm
}

function getRefeedConfig(): RefeedConfig {
  try {
    const s = localStorage.getItem(LS_KEY);
    return s ? JSON.parse(s) : { refeedDays: [], dietBreakStart: null, dietBreakDuration: 14 };
  } catch { return { refeedDays: [], dietBreakStart: null, dietBreakDuration: 14 }; }
}

export function getReminderConfig(): ReminderConfig {
  try {
    const s = localStorage.getItem(LS_REMINDER_KEY);
    return s ? JSON.parse(s) : { enabled: false, time: '20:00' };
  } catch { return { enabled: false, time: '20:00' }; }
}

export function setReminderConfig(config: ReminderConfig): void {
  localStorage.setItem(LS_REMINDER_KEY, JSON.stringify(config));
}

/**
 * Schedule refeed reminders for the next 7 days.
 * Should be called when the refeed calendar config changes.
 */
export async function scheduleRefeedReminders(language: 'de' | 'en'): Promise<number> {
  const reminderCfg = getReminderConfig();
  if (!reminderCfg.enabled) return 0;

  const permState = await getPermissionState();
  if (permState !== 'granted') return 0;

  const refeedCfg = getRefeedConfig();
  if (refeedCfg.refeedDays.length === 0) return 0;

  const [hours, minutes] = reminderCfg.time.split(':').map(Number);
  const now = new Date();
  let scheduled = 0;

  // Schedule for the next 7 days
  for (let i = 1; i <= 7; i++) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + i);
    const dayIdx = (targetDate.getDay() + 6) % 7; // Convert to Mon=0

    if (refeedCfg.refeedDays.includes(dayIdx)) {
      // Schedule notification for the evening before
      const reminderDate = new Date(targetDate);
      reminderDate.setDate(reminderDate.getDate() - 1); // Day before
      reminderDate.setHours(hours, minutes, 0, 0);

      if (reminderDate.getTime() > now.getTime()) {
        const dayName = targetDate.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', { weekday: 'long' });
        const payload: NotificationPayload = {
          id: 9000 + i, // Unique ID range for refeed reminders
          type: 'refeed_reminder',
          title: language === 'de' ? 'Refeed-Tag morgen!' : 'Refeed Day Tomorrow!',
          body: language === 'de'
            ? `Morgen (${dayName}) ist Refeed-Tag. Plane extra Kohlenhydrate ein!`
            : `Tomorrow (${dayName}) is a refeed day. Plan extra carbs!`,
          at: reminderDate,
        };

        await scheduleNotification(payload);
        scheduled++;
      }
    }
  }

  return scheduled;
}
