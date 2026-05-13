/**
 * ReminderPicker — reusable form section for picking a reminder schedule.
 *
 * Used by both AddReminderDialog (standalone) and AddSubstanceDialog (inline
 * when the user wants to attach a reminder to the new substance).
 *
 * Renders three sub-controls:
 *   1. Time vs. time-of-day toggle (exact HH:MM or morning/noon/evening)
 *   2. Repeat-mode toggle (weekly day-picker vs. every N days)
 *   3. Description (optional free-text field)
 *
 * The parent owns the schedule state; this is a pure controlled component.
 *
 * Use `scheduleToReminderFields()` to convert the schedule into the shape
 * expected by `useAddReminder.mutateAsync()`.
 */

import type { RepeatMode, TimePeriod } from '../../../types/health';

const DAY_LABELS_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const DAY_LABELS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export interface ReminderScheduleValue {
  /** HH:MM (used when `useTimePeriod=false`) */
  time: string;
  /** morning/noon/evening (used when `useTimePeriod=true`) */
  timePeriod: TimePeriod | null;
  /** Toggle between exact time and time-of-day */
  useTimePeriod: boolean;
  /** weekly = pick weekdays, interval = every N days */
  repeatMode: RepeatMode;
  /** 0=Sun … 6=Sat (used when `repeatMode='weekly'`) */
  daysOfWeek: number[];
  /** every N days as string (used when `repeatMode='interval'`) */
  intervalDays: string;
  /** Optional free-text description */
  description: string;
}

/** Sensible default: every day, 08:00, with empty description. */
export const DEFAULT_REMINDER_SCHEDULE: ReminderScheduleValue = {
  time: '08:00',
  timePeriod: null,
  useTimePeriod: false,
  repeatMode: 'weekly',
  daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
  intervalDays: '7',
  description: '',
};

/** Suggest a schedule based on a frequency string (used by AddSubstanceDialog
 *  when a preset/typed frequency is available). Returns DEFAULT_REMINDER_SCHEDULE
 *  if no pattern matches. */
export function suggestScheduleFromFrequency(frequency: string): ReminderScheduleValue {
  if (!frequency) return DEFAULT_REMINDER_SCHEDULE;
  const f = frequency.toLowerCase().trim();

  // "alle 3 Tage" / "every 3 days"
  const intervalMatch = f.match(/(?:alle|every)\s*(\d+)\s*(?:tage?|days?)/);
  if (intervalMatch) {
    return {
      ...DEFAULT_REMINDER_SCHEDULE,
      repeatMode: 'interval',
      intervalDays: intervalMatch[1],
    };
  }

  // "2x/Woche" / "twice a week"
  const weeklyXMatch = f.match(/(\d+)\s*(?:x|mal|times?)\s*(?:\/|pro)\s*(?:woche|week)/);
  if (weeklyXMatch) {
    const times = parseInt(weeklyXMatch[1], 10);
    // 1x/Woche → Donnerstag, 2x/Woche → Mo+Do, 3x → Mo+Mi+Fr, etc.
    const presets: Record<number, number[]> = {
      1: [4],
      2: [1, 4],
      3: [1, 3, 5],
      4: [1, 2, 4, 5],
      5: [1, 2, 3, 4, 5],
      6: [0, 1, 2, 3, 4, 5],
      7: [0, 1, 2, 3, 4, 5, 6],
    };
    return { ...DEFAULT_REMINDER_SCHEDULE, daysOfWeek: presets[times] ?? [0, 1, 2, 3, 4, 5, 6] };
  }

  // "täglich" / "daily" → already the default
  // "EOD" / "jeden zweiten Tag" → interval=2
  if (/eod|jed.*zweite[mn]?\s*tag|every\s*other\s*day/.test(f)) {
    return { ...DEFAULT_REMINDER_SCHEDULE, repeatMode: 'interval', intervalDays: '2' };
  }

  return DEFAULT_REMINDER_SCHEDULE;
}

/**
 * Convert a ReminderScheduleValue into the field shape expected by
 * `useAddReminder.mutateAsync()`. Strips out fields that don't apply
 * (e.g. days_of_week is undefined when in interval mode).
 */
export function scheduleToReminderFields(s: ReminderScheduleValue): {
  time?: string;
  time_period?: TimePeriod;
  repeat_mode: RepeatMode;
  days_of_week?: number[];
  interval_days?: number;
  description?: string;
} {
  return {
    time: s.useTimePeriod ? undefined : s.time,
    time_period: s.useTimePeriod && s.timePeriod ? s.timePeriod : undefined,
    repeat_mode: s.repeatMode,
    days_of_week: s.repeatMode === 'weekly' ? s.daysOfWeek : undefined,
    interval_days: s.repeatMode === 'interval' ? (parseInt(s.intervalDays, 10) || 7) : undefined,
    description: s.description || undefined,
  };
}

// ── Component ──────────────────────────────────────────────────────────

interface ReminderPickerProps {
  value: ReminderScheduleValue;
  onChange: (value: ReminderScheduleValue) => void;
  language: string;
  /** Hide the description field (e.g. when the parent uses its own note field) */
  hideDescription?: boolean;
  /** Compact mode = tighter spacing (for embedded use inside another dialog) */
  compact?: boolean;
}

export function ReminderPicker({ value, onChange, language, hideDescription, compact }: ReminderPickerProps) {
  const isDE = language === 'de';
  const dayLabels = isDE ? DAY_LABELS_DE : DAY_LABELS_EN;
  const spacing = compact ? 'space-y-3' : 'space-y-4';

  const update = (patch: Partial<ReminderScheduleValue>) => onChange({ ...value, ...patch });

  const toggleDay = (day: number) => {
    const next = value.daysOfWeek.includes(day)
      ? value.daysOfWeek.filter(d => d !== day)
      : [...value.daysOfWeek, day].sort();
    update({ daysOfWeek: next });
  };

  return (
    <div className={spacing}>
      {/* Time: exact or period */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-500">
            {isDE ? 'Uhrzeit' : 'Time'}
          </label>
          <button
            type="button"
            onClick={() => update({ useTimePeriod: !value.useTimePeriod })}
            className="text-[10px] text-teal-600 hover:underline"
          >
            {value.useTimePeriod
              ? (isDE ? 'Exakte Uhrzeit' : 'Exact time')
              : (isDE ? 'Tageszeit wählen' : 'Pick time period')}
          </button>
        </div>

        {value.useTimePeriod ? (
          <div className="grid grid-cols-3 gap-2">
            {(['morning', 'noon', 'evening'] as TimePeriod[]).map(period => (
              <button
                key={period}
                type="button"
                onClick={() => update({ timePeriod: period })}
                className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                  value.timePeriod === period
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {period === 'morning' ? '🌅' : period === 'noon' ? '☀️' : '🌙'}{' '}
                {isDE
                  ? (period === 'morning' ? 'Morgens' : period === 'noon' ? 'Mittags' : 'Abends')
                  : (period === 'morning' ? 'Morning' : period === 'noon' ? 'Noon' : 'Evening')}
              </button>
            ))}
          </div>
        ) : (
          <input
            type="time"
            value={value.time}
            onChange={e => update({ time: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
          />
        )}
      </div>

      {/* Repeat mode */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">
          {isDE ? 'Wiederholung' : 'Repeat'}
        </label>
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => update({ repeatMode: 'weekly' })}
            className={`flex-1 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
              value.repeatMode === 'weekly'
                ? 'border-teal-500 bg-teal-50 text-teal-700'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            {isDE ? 'Wöchentlich' : 'Weekly'}
          </button>
          <button
            type="button"
            onClick={() => update({ repeatMode: 'interval' })}
            className={`flex-1 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
              value.repeatMode === 'interval'
                ? 'border-teal-500 bg-teal-50 text-teal-700'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            {isDE ? 'Intervall' : 'Interval'}
          </button>
        </div>

        {value.repeatMode === 'weekly' ? (
          <div className="flex gap-1 justify-between">
            {dayLabels.map((label, index) => (
              <button
                key={index}
                type="button"
                onClick={() => toggleDay(index)}
                className={`w-9 h-9 rounded-full text-xs font-medium transition-all ${
                  value.daysOfWeek.includes(index)
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{isDE ? 'Alle' : 'Every'}</span>
            <input
              type="number"
              value={value.intervalDays}
              onChange={e => update({ intervalDays: e.target.value })}
              min="1"
              max="365"
              className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-teal-500 outline-none"
            />
            <span className="text-xs text-gray-500">{isDE ? 'Tage' : 'days'}</span>
          </div>
        )}
      </div>

      {/* Description (optional) */}
      {!hideDescription && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {isDE ? 'Beschreibung (optional)' : 'Description (optional)'}
          </label>
          <input
            type="text"
            value={value.description}
            onChange={e => update({ description: e.target.value })}
            placeholder={isDE ? 'Zusätzliche Hinweise...' : 'Additional notes...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
          />
        </div>
      )}
    </div>
  );
}
