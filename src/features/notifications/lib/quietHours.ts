/**
 * Check if a given time (or current time) falls within a quiet hours range.
 *
 * Handles overnight ranges correctly (e.g. 22:00 - 07:00).
 *
 * @param start - Quiet hours start (HH:mm)
 * @param end - Quiet hours end (HH:mm)
 * @param now - Optional: time to check (defaults to current time)
 * @returns true if the time is within quiet hours
 */
export function isInQuietHours(start: string, end: string, now?: Date): boolean {
  const date = now ?? new Date();
  const currentMinutes = date.getHours() * 60 + date.getMinutes();

  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  // Handle overnight range (e.g. 22:00 - 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  // Same-day range (e.g. 13:00 - 15:00)
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Parse a time string (HH:mm) to minutes since midnight.
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}
