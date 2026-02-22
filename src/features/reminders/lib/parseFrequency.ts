/**
 * Parse a frequency string like "1x/Woche", "täglich", "2x/Tag" into reminder config.
 * Used by AddSubstanceDialog (new substances) and MedicalPage (existing substances).
 */
export function parseFrequencyToReminder(
  freq: string
): { repeat_mode: 'weekly' | 'interval'; interval_days?: number; days_of_week?: number[] } | null {
  if (!freq) return null;
  const lower = freq.toLowerCase().trim();

  // Daily patterns
  if (lower === 'täglich' || lower === 'taeglich' || lower === 'daily' || /^\d+x\s*\/\s*tag/i.test(lower)) {
    return { repeat_mode: 'weekly', days_of_week: [0, 1, 2, 3, 4, 5, 6] };
  }

  // Weekly patterns: "1x/Woche", "weekly", "wöchentlich"
  if (lower === 'wöchentlich' || lower === 'woechentlich' || lower === 'weekly' || /^1x\s*\/\s*woche/i.test(lower)) {
    return { repeat_mode: 'interval', interval_days: 7 };
  }

  // Every N days: "alle 3 Tage", "every 3 days"
  const intervalMatch = lower.match(/alle\s+(\d+)\s+tage|every\s+(\d+)\s+days/i);
  if (intervalMatch) {
    const days = parseInt(intervalMatch[1] || intervalMatch[2]);
    return { repeat_mode: 'interval', interval_days: days };
  }

  // 2x/Woche → interval 3-4 days
  const perWeekMatch = lower.match(/^(\d+)x\s*\/\s*woche/i);
  if (perWeekMatch) {
    const times = parseInt(perWeekMatch[1]);
    if (times >= 2) return { repeat_mode: 'interval', interval_days: Math.round(7 / times) };
  }

  // Fallback: has frequency text but can't parse → daily
  return { repeat_mode: 'weekly', days_of_week: [0, 1, 2, 3, 4, 5, 6] };
}
