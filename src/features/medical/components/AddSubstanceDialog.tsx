import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddSubstance } from '../hooks/useSubstances';
import { SUBSTANCE_CATEGORIES, SUBSTANCE_TYPES } from '../../../lib/constants';
import type { SubstanceCategory, SubstanceAdminType } from '../../../types/health';

interface AddSubstanceDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddSubstanceDialog({ open, onClose }: AddSubstanceDialogProps) {
  const { t } = useTranslation();
  const addSubstance = useAddSubstance();

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
      await addSubstance.mutateAsync({
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

          {/* Dosage + Unit + Frequency */}
          <div className="grid grid-cols-3 gap-3">
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
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.medical.frequency}
              </label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                placeholder="1x/Woche"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
              />
            </div>
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
