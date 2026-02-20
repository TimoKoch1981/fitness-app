import type { Reminder } from '../../../types/health';

/**
 * Check if a reminder's scheduled time matches a given time (within tolerance).
 *
 * For time-based reminders: compares HH:mm with tolerance window.
 * For period-based reminders: maps to fixed time windows (morning=07:00, noon=12:00, evening=19:00).
 *
 * @param reminder - The reminder to check
 * @param toleranceMinutes - Tolerance window in minutes (default: 2)
 * @param now - Optional: time to check against (defaults to current time)
 */
export function isReminderTimeNow(
  reminder: Reminder,
  toleranceMinutes = 2,
  now?: Date,
): boolean {
  const date = now ?? new Date();
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  if (reminder.time) {
    // Exact time match (e.g. "08:30")
    const [hours, minutes] = reminder.time.split(':').map(Number);
    const reminderMinutes = (hours ?? 0) * 60 + (minutes ?? 0);
    return Math.abs(currentMinutes - reminderMinutes) <= toleranceMinutes;
  }

  // Period-based: map to fixed notification times
  if (reminder.time_period) {
    const periodMinutes = getPeriodMinutes(reminder.time_period);
    if (periodMinutes === null) return false;
    return Math.abs(currentMinutes - periodMinutes) <= toleranceMinutes;
  }

  // No time and no period — cannot determine
  return false;
}

/**
 * Map a time period to minutes since midnight.
 * Returns the exact minute when notification should fire for this period.
 */
function getPeriodMinutes(period: string): number | null {
  switch (period) {
    case 'morning': return 7 * 60;     // 07:00
    case 'noon':    return 12 * 60;    // 12:00
    case 'evening': return 19 * 60;    // 19:00
    default: return null;
  }
}

/**
 * Check if a reminder is due on a specific date (day-of-week or interval check).
 * This delegates to the existing logic from useReminders, but as a pure function.
 */
export function isReminderDueOnDate(reminder: Reminder, date?: Date): boolean {
  const d = date ?? new Date();

  if (reminder.repeat_mode === 'weekly') {
    const dayOfWeek = d.getDay(); // 0=Sun, 6=Sat
    return (reminder.days_of_week ?? []).includes(dayOfWeek);
  }

  if (reminder.repeat_mode === 'interval' && reminder.interval_days) {
    const created = new Date(reminder.created_at);
    const diffMs = d.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays % reminder.interval_days === 0;
  }

  return false;
}

/**
 * Calculate the next occurrence Date for a reminder from a given date.
 * Used by the scheduler to plan notifications ahead.
 */
export function getNextOccurrence(reminder: Reminder, fromDate?: Date): Date | null {
  if (!reminder.time && !reminder.time_period) return null;

  const from = fromDate ?? new Date();
  const [hours, minutes] = getTimeComponents(reminder);
  if (hours === null || minutes === null) return null;

  // Try today first
  const todayCandidate = new Date(from);
  todayCandidate.setHours(hours, minutes, 0, 0);

  if (todayCandidate > from && isReminderDueOnDate(reminder, todayCandidate)) {
    return todayCandidate;
  }

  // Search up to 7 days ahead
  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const candidate = new Date(from);
    candidate.setDate(candidate.getDate() + dayOffset);
    candidate.setHours(hours, minutes, 0, 0);
    if (isReminderDueOnDate(reminder, candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Extract hours and minutes from a reminder (time or period).
 */
function getTimeComponents(reminder: Reminder): [number | null, number | null] {
  if (reminder.time) {
    const parts = reminder.time.split(':').map(Number);
    return [parts[0] ?? null, parts[1] ?? null];
  }
  if (reminder.time_period) {
    const mins = getPeriodMinutes(reminder.time_period);
    if (mins === null) return [null, null];
    return [Math.floor(mins / 60), mins % 60];
  }
  return [null, null];
}
