/**
 * Reminder Card — compact card for a single reminder.
 *
 * Shows type icon, title, time/period, weekday dots, and action buttons
 * (complete, toggle active, delete).
 */

import { Check, Trash2, Power } from 'lucide-react';
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
  isCompleted: boolean;
  onComplete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

export function ReminderCard({ reminder, isCompleted, onComplete, onToggle, onDelete }: Props) {
  const { t, language } = useTranslation();
  const dayLabels = language === 'de' ? DAY_LABELS_DE : DAY_LABELS_EN;

  const timeDisplay = reminder.time
    ? reminder.time
    : reminder.time_period
      ? `${PERIOD_ICONS[reminder.time_period] ?? ''} ${t.reminders[reminder.time_period as keyof typeof t.reminders] ?? reminder.time_period}`
      : '';

  return (
    <div
      className={`px-4 py-3 flex items-start gap-3 group transition-all ${
        isCompleted ? 'opacity-50' : ''
      } ${!reminder.is_active ? 'opacity-40' : ''}`}
    >
      {/* Complete button */}
      <button
        onClick={() => !isCompleted && onComplete(reminder.id)}
        disabled={isCompleted || !reminder.is_active}
        className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          isCompleted
            ? 'bg-teal-500 border-teal-500 text-white'
            : 'border-gray-300 hover:border-teal-400 text-transparent hover:text-teal-400'
        }`}
      >
        <Check className="h-3.5 w-3.5" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">{TYPE_ICONS[reminder.type] ?? '📌'}</span>
          <p className={`text-sm font-medium text-gray-900 truncate ${isCompleted ? 'line-through' : ''}`}>
            {reminder.title}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1">
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
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={() => onToggle(reminder.id, !reminder.is_active)}
          className={`p-1 rounded transition-colors ${
            reminder.is_active
              ? 'text-gray-300 hover:text-yellow-500'
              : 'text-yellow-500 hover:text-yellow-600'
          }`}
          title={reminder.is_active ? (language === 'de' ? 'Deaktivieren' : 'Deactivate') : (language === 'de' ? 'Aktivieren' : 'Activate')}
        >
          <Power className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(reminder.id)}
          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
          title={t.common.delete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
