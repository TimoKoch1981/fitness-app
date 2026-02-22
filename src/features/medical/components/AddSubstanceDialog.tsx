import { useState } from 'react';
import { X, Bell } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddSubstance } from '../hooks/useSubstances';
import { useAddReminder } from '../../reminders/hooks/useReminders';
import { SUBSTANCE_CATEGORIES, SUBSTANCE_TYPES } from '../../../lib/constants';
import { parseFrequencyToReminder } from '../../reminders/lib/parseFrequency';
import type { SubstanceCategory, SubstanceAdminType } from '../../../types/health';

interface AddSubstanceDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddSubstanceDialog({ open, onClose }: AddSubstanceDialogProps) {
  const { t, language } = useTranslation();
  const addSubstance = useAddSubstance();
  const addReminder = useAddReminder();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<SubstanceCategory>('supplement');
  const [adminType, setAdminType] = useState<SubstanceAdminType>('oral');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('mg');
  const [frequency, setFrequency] = useState('');
  const [ester, setEster] = useState('');
  const [halfLife, setHalfLife] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setError('');

    try {
      const substance = await addSubstance.mutateAsync({
        name,
        category,
        type: adminType,
        dosage: dosage || undefined,
        unit: unit || undefined,
        frequency: frequency || undefined,
        ester: ester || undefined,
        half_life_days: halfLife ? parseFloat(halfLife) : undefined,
        notes: notes || undefined,
      });

      // Auto-create linked reminder if frequency is set
      if (frequency && substance?.id) {
        const reminderConfig = parseFrequencyToReminder(frequency);
        if (reminderConfig) {
          try {
            const title = language === 'de'
              ? `${name} einnehmen`
              : `Take ${name}`;
            await addReminder.mutateAsync({
              type: 'substance',
              title,
              substance_id: substance.id,
              time_period: 'morning',
              ...reminderConfig,
            });
          } catch {
            // Non-critical: substance was saved, reminder failed silently
          }
        }
      }

      // Reset and close
      setName('');
      setCategory('supplement');
      setAdminType('oral');
      setDosage('');
      setUnit('mg');
      setFrequency('');
      setEster('');
      setHalfLife('');
      setNotes('');
      onClose();
    } catch {
      setError(t.common.saveError);
    }
  };

  const categoryLabels: Record<string, string> = {
    trt: t.medical.cat_trt,
    ped: t.medical.cat_ped,
    medication: t.medical.cat_medication,
    supplement: t.medical.cat_supplement,
    other: t.medical.cat_other,
  };

  const adminTypeLabels: Record<string, string> = {
    injection: t.medical.injection,
    oral: t.medical.oral,
    transdermal: t.medical.transdermal,
    subcutaneous: t.medical.subcutaneous,
    other: t.medical.cat_other,
  };

  // Show ester/half-life only for injection-based substances (typically TRT/PED)
  const showEsterFields = adminType === 'injection' || adminType === 'subcutaneous';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between px-4 py-3 border-b z-10">
          <h2 className="text-lg font-semibold text-gray-900">{t.medical.addSubstance}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Category Selector */}
          <div className="flex flex-wrap gap-2">
            {SUBSTANCE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                  category === cat
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.meals.name}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={category === 'trt' ? 'Testosteron Enantat' : 'Substanz-Name'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
              required
              autoFocus
            />
          </div>

          {/* Admin Type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              {t.medical.category}
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBSTANCE_TYPES.map((at) => (
                <button
                  key={at}
                  type="button"
                  onClick={() => setAdminType(at)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                    adminType === at
                      ? 'bg-teal-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {adminTypeLabels[at]}
                </button>
              ))}
            </div>
          </div>

          {/* Dosage + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.medical.dosage}
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="250"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm bg-white"
              >
                <option value="mg">mg</option>
                <option value="ml">ml</option>
                <option value="mcg">mcg</option>
                <option value="IU">IU</option>
                <option value="g">g</option>
              </select>
            </div>
          </div>

          {/* Frequency — prominent with quick-select buttons */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-teal-500" />
              <label className="text-sm font-medium text-gray-700">
                {language === 'de' ? 'Einnahme-Rhythmus' : 'Frequency'}
              </label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: language === 'de' ? 'Täglich' : 'Daily', value: 'täglich' },
                { label: '1x/Woche', value: '1x/Woche' },
                { label: '2x/Woche', value: '2x/Woche' },
                { label: language === 'de' ? 'Alle 3 Tage' : 'Every 3 days', value: 'alle 3 Tage' },
                { label: language === 'de' ? 'Alle 14 Tage' : 'Every 14 days', value: 'alle 14 Tage' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrequency(frequency === opt.value ? '' : opt.value)}
                  className={`py-1 px-2.5 rounded-lg text-xs font-medium transition-all ${
                    frequency === opt.value
                      ? 'bg-teal-500 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-teal-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              placeholder={language === 'de' ? 'Oder eigenen Rhythmus eingeben...' : 'Or enter custom frequency...'}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-xs bg-white"
            />
            {frequency && (
              <p className="text-[10px] text-teal-600 flex items-center gap-1">
                <Bell className="h-3 w-3" />
                {language === 'de' ? 'Erinnerung wird automatisch angelegt' : 'Reminder will be created automatically'}
              </p>
            )}
          </div>

          {/* Ester + Half-Life (for injections) */}
          {showEsterFields && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.medical.ester}
                </label>
                <input
                  type="text"
                  value={ester}
                  onChange={(e) => setEster(e.target.value)}
                  placeholder="Enantat"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {t.medical.halfLife} ({t.medical.days})
                </label>
                <input
                  type="number"
                  value={halfLife}
                  onChange={(e) => setHalfLife(e.target.value)}
                  placeholder="4.5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                  min="0.1"
                  step="0.1"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t.common.notes}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm resize-none"
              rows={2}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={addSubstance.isPending || !name}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
          >
            {addSubstance.isPending ? t.common.loading : t.common.save}
          </button>
        </form>
      </div>
    </div>
  );
}
