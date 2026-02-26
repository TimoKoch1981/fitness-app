import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddBloodPressure } from '../hooks/useBloodPressure';
import { classifyBloodPressure } from '../../../lib/calculations';
import { today } from '../../../lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddBloodPressureDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const addBP = useAddBloodPressure();

  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [pulse, setPulse] = useState('72');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const sys = parseInt(systolic) || 0;
  const dia = parseInt(diastolic) || 0;
  const preview = sys > 0 && dia > 0
    ? classifyBloodPressure(sys, dia)
    : null;

  const classLabel = preview
    ? t.medical[`bp_${preview.classification}` as keyof typeof t.medical] ?? preview.classification
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    try {
      await addBP.mutateAsync({
        date: today(),
        time,
        systolic: sys,
        diastolic: dia,
        pulse: parseInt(pulse) || undefined,
        notes: notes || undefined,
      });

      setSystolic('120');
      setDiastolic('80');
      setPulse('72');
      setNotes('');
      onClose();
    } catch {
      setError(t.common.saveError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{t.medical.addBP}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.medical.systolic} ({t.medical.mmHg})
              </label>
              <input
                type="number"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                placeholder="120"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-center"
                required
                min="50"
                max="300"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.medical.diastolic} ({t.medical.mmHg})
              </label>
              <input
                type="number"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                placeholder="80"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-center"
                required
                min="30"
                max="200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.medical.pulse} ({t.medical.bpm})
              </label>
              <input
                type="number"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                placeholder="72"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm text-center"
                min="30"
                max="250"
              />
            </div>
          </div>

          {/* Live Classification Preview */}
          {preview && (
            <div className={`p-3 rounded-lg text-center text-sm font-medium ${
              preview.color === 'green' ? 'bg-green-50 text-green-700' :
              preview.color === 'yellow' ? 'bg-yellow-50 text-yellow-700' :
              preview.color === 'orange' ? 'bg-orange-50 text-orange-700' :
              'bg-red-50 text-red-700'
            }`}>
              {sys}/{dia} {t.medical.mmHg} — {classLabel}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t.common.notes}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={addBP.isPending || !systolic || !diastolic}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
          >
            {addBP.isPending ? t.common.loading : t.common.save}
          </button>
        </form>
      </div>
    </div>
  );
}
