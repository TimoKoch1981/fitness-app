/**
 * Add Reminder Dialog — modal form for creating new reminders.
 *
 * Supports 5 types: substance, meal_logging, blood_pressure, body_measurement, custom.
 * Schedule UI is delegated to the shared ReminderPicker component (also used by
 * AddSubstanceDialog so both flows have identical flexibility).
 *
 * Substance-typed reminders REQUIRE a substance_id selection (v14.12 / Issue #3):
 * a "Substanz einnehmen" reminder without a linked substance has no log target.
 * If the user has no active substances, we surface a clear hint instead of
 * letting them save a dangling reminder.
 */

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddReminder } from '../hooks/useReminders';
import { useSubstances } from '../../medical/hooks/useSubstances';
import {
  ReminderPicker,
  DEFAULT_REMINDER_SCHEDULE,
  scheduleToReminderFields,
  type ReminderScheduleValue,
} from './ReminderPicker';
import type { ReminderType } from '../../../types/health';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional: pre-select a substance (used when chaining from AddSubstanceDialog) */
  initialSubstanceId?: string;
}

const TYPE_OPTIONS: { type: ReminderType; icon: string; labelKey: string }[] = [
  { type: 'substance', icon: '💊', labelKey: 'substance' },
  { type: 'meal_logging', icon: '🍽️', labelKey: 'mealLogging' },
  { type: 'blood_pressure', icon: '❤️', labelKey: 'bloodPressure' },
  { type: 'body_measurement', icon: '⚖️', labelKey: 'bodyMeasurement' },
  { type: 'custom', icon: '📌', labelKey: 'custom' },
];

const DEFAULT_TITLES: Record<ReminderType, { de: string; en: string }> = {
  substance: { de: 'Substanz einnehmen', en: 'Take substance' },
  meal_logging: { de: 'Mahlzeit loggen', en: 'Log meal' },
  blood_pressure: { de: 'Blutdruck messen', en: 'Measure blood pressure' },
  body_measurement: { de: 'Körperwerte messen', en: 'Measure body stats' },
  custom: { de: '', en: '' },
};

export function AddReminderDialog({ open, onClose, initialSubstanceId }: Props) {
  const { t, language } = useTranslation();
  const addReminder = useAddReminder();
  const { data: substances } = useSubstances(true);

  // Form state
  const [type, setType] = useState<ReminderType>(initialSubstanceId ? 'substance' : 'substance');
  const [title, setTitle] = useState('');
  const [substanceId, setSubstanceId] = useState(initialSubstanceId ?? '');
  const [schedule, setSchedule] = useState<ReminderScheduleValue>(DEFAULT_REMINDER_SCHEDULE);
  const [error, setError] = useState('');

  if (!open) return null;

  const lang = language === 'de' ? 'de' : 'en';
  const effectiveTitle = title || DEFAULT_TITLES[type][lang];

  const hasActiveSubstances = !!substances && substances.length > 0;
  const substanceRequired = type === 'substance';
  const substanceMissing = substanceRequired && !substanceId;
  const noSubstancesAvailable = substanceRequired && !hasActiveSubstances;
  const submitDisabled = addReminder.isPending
    || !effectiveTitle
    || substanceMissing
    || noSubstancesAvailable;

  const handleTypeChange = (newType: ReminderType) => {
    setType(newType);
    setTitle('');
    if (newType !== 'substance') setSubstanceId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Hard guard: substance-typed reminders need a substance_id (Issue #3)
    if (substanceMissing) {
      setError(language === 'de'
        ? 'Bitte wähle eine Substanz aus, an die die Erinnerung gekoppelt sein soll.'
        : 'Please select a substance to link this reminder to.');
      return;
    }

    try {
      const scheduleFields = scheduleToReminderFields(schedule);
      await addReminder.mutateAsync({
        type,
        title: effectiveTitle,
        ...scheduleFields,
        substance_id: type === 'substance' && substanceId ? substanceId : undefined,
      });

      // Reset
      setType('substance');
      setTitle('');
      setSubstanceId('');
      setSchedule(DEFAULT_REMINDER_SCHEDULE);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[AddReminderDialog] submit failed:', err);
      setError(`${t.common.saveError}${msg ? ` (${msg.slice(0, 120)})` : ''}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-900">{t.reminders.addReminder}</h2>
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
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => handleTypeChange(opt.type)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-xs ${
                    type === opt.type
                      ? 'border-theme-primary bg-theme-surface-2 text-theme-primary font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  {t.reminders[opt.labelKey as keyof typeof t.reminders]}
                </button>
              ))}
            </div>
          </div>

          {/* Substance dropdown — REQUIRED for type='substance' (Issue #3) */}
          {type === 'substance' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {language === 'de' ? 'Substanz *' : 'Substance *'}
              </label>
              {hasActiveSubstances ? (
                <select
                  value={substanceId}
                  onChange={e => setSubstanceId(e.target.value)}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary outline-none text-sm ${
                    substanceMissing && error ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">{language === 'de' ? '— Substanz wählen —' : '— Select substance —'}</option>
                  {substances!.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {language === 'de'
                      ? 'Du hast noch keine aktiven Substanzen. Lege erst eine Substanz an, bevor du eine Substanz-Erinnerung erstellst.'
                      : 'You have no active substances yet. Add a substance first before creating a substance reminder.'}
                  </span>
                </div>
              )}
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
              placeholder={DEFAULT_TITLES[type][lang]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-primary focus:border-theme-primary outline-none text-sm"
            />
          </div>

          {/* Shared schedule picker (time / repeat / description) */}
          <ReminderPicker
            value={schedule}
            onChange={setSchedule}
            language={language}
          />

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitDisabled}
            className="w-full py-2.5 bg-gradient-to-r bg-theme-primary text-white font-medium rounded-lg hover:bg-theme-primary-2 disabled:opacity-50 transition-all"
          >
            {addReminder.isPending ? t.common.loading : t.common.save}
          </button>
        </form>
      </div>
    </div>
  );
}
