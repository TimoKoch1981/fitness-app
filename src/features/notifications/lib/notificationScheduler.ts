/**
 * Notification Scheduler — plans notifications for the next 24 hours.
 *
 * Called once on app start and whenever preferences or reminders change.
 * Cancels all pending notifications and re-schedules from scratch.
 *
 * Strategy:
 * 1. Cancel all existing scheduled notifications
 * 2. For each active reminder due today: schedule at the reminder's time
 * 3. For daily summary: schedule at the configured summary time
 * 4. On native: OS handles delivery even if app is closed
 * 5. On web: only works while app tab is open (setTimeout fallback)
 */
import type { Reminder } from '../../../types/health';
import type { NotificationPreferences, NotificationPayload } from '../types';
import { cancelAllPending, scheduleMultiple } from './notificationBridge';
import { isInQuietHours } from './quietHours';
import { isReminderDueOnDate, getNextOccurrence } from './reminderMatcher';
import { buildDailySummaryBody } from './dailySummary';

/** Maximum notifications to schedule at once (Android limit is 500, iOS ~64) */
const MAX_SCHEDULED = 50;

/** Generate a stable numeric ID from a string (for Capacitor notification IDs) */
function hashStringToId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Schedule all notifications for the next period.
 * This is the main entry point called by the React hook.
 */
export async function scheduleAllNotifications(
  reminders: Reminder[],
  completedReminderIds: Set<string>,
  prefs: NotificationPreferences,
  userId: string,
  language: 'de' | 'en',
): Promise<number> {
  // Cancel everything first (clean slate)
  await cancelAllPending();

  if (!prefs.enabled) return 0;

  const payloads: NotificationPayload[] = [];
  const now = new Date();

  // ── Reminder Notifications ────────────────────────────────────────────

  for (const reminder of reminders) {
    if (!reminder.is_active) continue;
    if (!prefs.types[reminder.type]) continue;
    if (completedReminderIds.has(reminder.id)) continue;

    // Find the next occurrence
    const nextTime = getNextOccurrence(reminder, now);
    if (!nextTime) continue;

    // Check quiet hours
    if (prefs.quietHours.enabled && isInQuietHours(prefs.quietHours.start, prefs.quietHours.end, nextTime)) {
      continue;
    }

    payloads.push({
      id: hashStringToId(`reminder-${reminder.id}-${nextTime.toISOString()}`),
      type: reminder.type,
      title: reminder.title,
      body: reminder.description ?? (language === 'de' ? 'Erinnerung faellig' : 'Reminder due'),
      at: nextTime,
    });

    if (payloads.length >= MAX_SCHEDULED) break;
  }

  // ── Daily Summary Notification ────────────────────────────────────────

  if (prefs.types.daily_summary) {
    const [sumH, sumM] = prefs.dailySummaryTime.split(':').map(Number);
    const summaryTime = new Date(now);
    summaryTime.setHours(sumH ?? 21, sumM ?? 0, 0, 0);

    // Only schedule if summary time is in the future today
    if (summaryTime > now) {
      const isQuiet = prefs.quietHours.enabled &&
        isInQuietHours(prefs.quietHours.start, prefs.quietHours.end, summaryTime);

      if (!isQuiet) {
        // Build summary text
        const summaryBody = await buildDailySummaryBody(userId, language);

        payloads.push({
          id: hashStringToId(`daily-summary-${summaryTime.toISOString()}`),
          type: 'daily_summary',
          title: language === 'de' ? 'Dein Tagesbericht' : 'Your Daily Report',
          body: summaryBody,
          at: summaryTime,
        });
      }
    }
  }

  // ── Schedule all at once ──────────────────────────────────────────────

  if (payloads.length > 0) {
    await scheduleMultiple(payloads);
  }

  return payloads.length;
}

/**
 * Quick check: are there any reminders due right now that should trigger?
 * Used for immediate foreground notifications (web fallback).
 */
export function getRemindersdueDueNow(
  reminders: Reminder[],
  completedIds: Set<string>,
  prefs: NotificationPreferences,
): Reminder[] {
  if (!prefs.enabled) return [];

  const now = new Date();

  if (prefs.quietHours.enabled && isInQuietHours(prefs.quietHours.start, prefs.quietHours.end, now)) {
    return [];
  }

  return reminders.filter((r) => {
    if (!r.is_active) return false;
    if (!prefs.types[r.type]) return false;
    if (completedIds.has(r.id)) return false;
    if (!isReminderDueOnDate(r, now)) return false;
    return true;
  });
}
