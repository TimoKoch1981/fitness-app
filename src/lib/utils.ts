import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and tailwind-merge.
 * Handles conditional classes and merges conflicting Tailwind classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date to the user's locale.
 */
export function formatDate(date: Date | string, locale = 'de-DE'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Formats a time string (HH:mm) to locale format.
 * Returns the raw string if parsing fails.
 */
export function formatTime(time: string | null | undefined, locale = 'de-DE'): string {
  if (!time) return '--:--';
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return time;
  const d = new Date();
  d.setHours(hours, minutes);
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Returns today's date as ISO string (YYYY-MM-DD).
 */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Generates a UUID v4 (for client-side use before DB insertion).
 */
export function generateId(): string {
  return crypto.randomUUID();
}
