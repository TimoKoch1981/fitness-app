/**
 * Edit Reminder Dialog — modal form for editing an existing reminder.
 *
 * All fields editable: type, title, time, schedule, description.
 * Pre-filled with current reminder values.
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useUpdateReminder } from '../hooks/useReminders';
import { useSubstances } from '../../medical/hooks/useSubstances';
import type { Reminder, ReminderType, RepeatMode, TimePeriod } from '../../../types/health';

interface Props {
  reminder: Reminder | null;
  onClose: () => void;
}

const TYPE_OPTIONS: { type: ReminderType; icon: string; labelKey: string }[] = [
  { type: 'substance', icon: '💊', labelKey: 'substance' },
  { type: 'blood_pressure', icon: '❤️', labelKey: 'bloodPressure' },
  { type: 'body_measurement', icon: '⚖️', labelKey: 'bodyMeasurement' },
  { type: 'custom', icon: '📌', labelKey: 'custom' },
];

const DAY_LABELS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const DAY_LABELS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function EditReminderDialog({ reminder, onClose }: Props) {
  const { t, language } = useTranslation();
  const updateReminder = useUpdateReminder();
  const { data: substances } = useSubstances(true);

  // Form state
  const [type, setType] = useState<ReminderType>('substance');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [time, setTime] = useState('08:00');
  const [timePeriod, setTimePeriod] = useState<TimePeriod | null>(null);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('weekly');
  const [intervalDays, setIntervalDays] = useState('7');
  const [substanceId, setSubstanceId] = useState('');
  const [useTimePeriod, setUseTimePeriod] = useState(false);
  const [error, setError] = useState('');

  // Initialize form from reminder
  useEffect(() => {
    if (!reminder) return;
    setType(reminder.type);
    setTitle(reminder.title);
    setDescription(reminder.description ?? '');
    setTime(reminder.time ?? '08:00');
    setTimePeriod(reminder.time_period ?? null);
    setDaysOfWeek(reminder.days_of_week ?? [0, 1, 2, 3, 4, 5, 6]);
    setRepeatMode(reminder.repeat_mode ?? 'weekly');
    setIntervalDays(String(reminder.interval_days ?? 7));
    setSubstanceId(reminder.substance_id ?? '');
    setUseTimePeriod(!!reminder.time_period && !reminder.time);
  }, [reminder]);

  if (!reminder) return null;

  const dayLabels = language === 'de' ? DAY_LABELS : DAY_LABELS_EN;

  const toggleDay = (day: number) => {
    setDaysOfWeek(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleTypeChange = (newType: ReminderType) => {
    setType(newType);
    if (newType !== 'substance') setSubstanceId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError(language === 'de' ? 'Titel ist erforderlich' : 'Title is required');
      return;
    }

    try {
      await updateReminder.mutateAsync({
        id: reminder.id,
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        time: useTimePeriod ? null : time,
        time_period: useTimePeriod && timePeriod ? timePeriod : null,
        days_of_week: repeatMode === 'weekly' ? daysOfWeek : undefined,
        repeat_mode: repeatMode,
        interval_days: repeatMode === 'interval' ? parseInt(intervalDays) || 7 : null,
        substance_id: type === 'substance' && substanceId ? substanceId : null,
      });
      onClose();
    } catch {
      setError(t.common.saveError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            {language === 'de' ? 'Erinnerung bearbeiten' : 'Edit Reminder'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              {language === 'de' ? 'Typ' : 'Type'}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleTypeChange(opt.type)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-xs ${
                    type === opt.type
                      ? 'border-teal-500 bg-teal-50 text-teal-700 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  {t.reminders[opt.labelKey as keyof typeof t.reminders]}
                </button>
              ))}
            </div>
          </div>

          {/* Substance dropdown (only for substance type) */}
          {type === 'substance' && substances && substances.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {language === 'de' ? 'Substanz' : 'Substance'}
              </label>
              <select
                value={substanceId}
                onChange={e => setSubstanceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
              >
                <option value="">{language === 'de' ? '— Substanz wählen —' : '— Select substance —'}</option>
                {substances.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {language === 'de' ? 'Titel' : 'Title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
            />
          </div>

          {/* Time: exact or period */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">
                {language === 'de' ? 'Uhrzeit' : 'Time'}
              </label>
              <button
                type="button"
                onClick={() => setUseTimePeriod(!useTimePeriod)}
                className="text-[10px] text-teal-600 hover:underline"
              >
                {useTimePeriod
                  ? (language === 'de' ? 'Exakte Uhrzeit' : 'Exact time')
                  : (language === 'de' ? 'Tageszeit wählen' : 'Pick time period')}
              </button>
            </div>

            {useTimePeriod ? (
              <div className="grid grid-cols-3 gap-2">
                {(['morning', 'noon', 'evening'] as TimePeriod[]).map(period => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setTimePeriod(period)}
                    className={`p-2 rounded-lg border-2 text-xs font-medium transition-all ${
                      timePeriod === period
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {period === 'morning' ? '🌅' : period === 'noon' ? '☀️' : '🌙'}{' '}
                    {t.reminders[period as keyof typeof t.reminders]}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
              />
            )}
          </div>

          {/* Repeat mode */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              {language === 'de' ? 'Wiederholung' : 'Repeat'}
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setRepeatMode('weekly')}
                className={`flex-1 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                  repeatMode === 'weekly'
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {t.reminders.weekly}
              </button>
              <button
                type="button"
                onClick={() => setRepeatMode('interval')}
                className={`flex-1 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                  repeatMode === 'interval'
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {t.reminders.interval}
              </button>
            </div>

            {repeatMode === 'weekly' ? (
              <div className="flex gap-1 justify-between">
                {dayLabels.map((label, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleDay(index)}
                    className={`w-9 h-9 rounded-full text-xs font-medium transition-all ${
                      daysOfWeek.includes(index)
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
                <span className="text-xs text-gray-500">
                  {language === 'de' ? 'Alle' : 'Every'}
                </span>
                <input
                  type="number"
                  value={intervalDays}
                  onChange={e => setIntervalDays(e.target.value)}
                  min="1"
                  max="365"
                  className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <span className="text-xs text-gray-500">
                  {language === 'de' ? 'Tage' : 'days'}
                </span>
              </div>
            )}
          </div>

          {/* Description (optional) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {language === 'de' ? 'Beschreibung (optional)' : 'Description (optional)'}
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={language === 'de' ? 'Zusätzliche Hinweise...' : 'Additional notes...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={updateReminder.isPending || !title.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
          >
            {updateReminder.isPending ? t.common.loading : t.common.save}
          </button>
        </form>
      </div>
    </div>
  );
}
