/**
 * Reminder Card — compact card for a single reminder.
 *
 * Shows type icon, title, time/period, schedule info,
 * a clear toggle switch (on/off), and delete button.
 * No "completed" checkmark — reminders are purely toggle + config.
 */

import { Trash2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { Reminder } from '../../../types/health';

const TYPE_ICONS: Record<string, string> = {
  substance: '💊',
  blood_pressure: '❤️',
  body_measurement: '⚖️',
  custom: '📌',
};

const PERIOD_ICONS: Record<string, string> = {
  morning: '🌅',
  noon: '☀️',
  evening: '🌙',
};

const DAY_LABELS_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const DAY_LABELS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface Props {
  reminder: Reminder;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  onEdit?: (reminder: Reminder) => void;
}

export function ReminderCard({ reminder, onToggle, onDelete, onEdit }: Props) {
  const { t, language } = useTranslation();
  const dayLabels = language === 'de' ? DAY_LABELS_DE : DAY_LABELS_EN;

  const timeDisplay = reminder.time
    ? reminder.time
    : reminder.time_period
      ? `${PERIOD_ICONS[reminder.time_period] ?? ''} ${t.reminders[reminder.time_period as keyof typeof t.reminders] ?? reminder.time_period}`
      : '';

  return (
    <div
      className={`px-4 py-3 flex items-center gap-3 group transition-all ${
        !reminder.is_active ? 'opacity-50' : ''
      }`}
    >
      {/* Toggle Switch */}
      <button
        onClick={() => onToggle(reminder.id, !reminder.is_active)}
        className="flex-shrink-0"
        title={reminder.is_active
          ? (language === 'de' ? 'Erinnerung deaktivieren' : 'Disable reminder')
          : (language === 'de' ? 'Erinnerung aktivieren' : 'Enable reminder')}
      >
        <div className={`w-10 h-5 rounded-full relative transition-colors ${
          reminder.is_active ? 'bg-teal-500' : 'bg-gray-300'
        }`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
            reminder.is_active ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </div>
      </button>

      {/* Content — clickable to edit */}
      <button
        type="button"
        onClick={() => onEdit?.(reminder)}
        className="flex-1 min-w-0 text-left cursor-pointer hover:bg-gray-50 rounded-lg -m-1 p-1 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{TYPE_ICONS[reminder.type] ?? '📌'}</span>
          <p className={`text-sm font-medium truncate ${
            reminder.is_active ? 'text-gray-900' : 'text-gray-400'
          }`}>
            {reminder.title}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-0.5">
          {timeDisplay && (
            <span className="text-[10px] text-gray-500">{timeDisplay}</span>
          )}

          {/* Weekday dots (only for weekly mode) */}
          {reminder.repeat_mode === 'weekly' && (
            <div className="flex gap-0.5">
              {dayLabels.map((label, i) => (
                <span
                  key={i}
                  title={label}
                  className={`w-3.5 h-3.5 rounded-full text-[8px] font-medium flex items-center justify-center ${
                    reminder.days_of_week.includes(i)
                      ? 'bg-teal-100 text-teal-700'
                      : 'bg-gray-50 text-gray-300'
                  }`}
                >
                  {label.charAt(0)}
                </span>
              ))}
            </div>
          )}

          {/* Interval display */}
          {reminder.repeat_mode === 'interval' && reminder.interval_days && (
            <span className="text-[10px] text-gray-400">
              {language === 'de' ? `alle ${reminder.interval_days} Tage` : `every ${reminder.interval_days} days`}
            </span>
          )}
        </div>

        {reminder.description && (
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{reminder.description}</p>
        )}
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onDelete(reminder.id)}
          className="p-1.5 text-gray-300 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
          title={t.common.delete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
