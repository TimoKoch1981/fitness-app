import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddBodyMeasurement } from '../hooks/useBodyMeasurements';
import { today } from '../../../lib/utils';

interface AddBodyMeasurementDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AddBodyMeasurementDialog({ open, onClose }: AddBodyMeasurementDialogProps) {
  const { t } = useTranslation();
  const addMeasurement = useAddBodyMeasurement();

  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [waterPct, setWaterPct] = useState('');
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [arm, setArm] = useState('');
  const [leg, setLeg] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight && !bodyFat && !waist) return; // Need at least one value

    setError('');

    try {
      await addMeasurement.mutateAsync({
        date: today(),
        weight_kg: weight ? parseFloat(weight) : undefined,
        body_fat_pct: bodyFat ? parseFloat(bodyFat) : undefined,
        muscle_mass_kg: muscleMass ? parseFloat(muscleMass) : undefined,
        water_pct: waterPct ? parseFloat(waterPct) : undefined,
        waist_cm: waist ? parseFloat(waist) : undefined,
        chest_cm: chest ? parseFloat(chest) : undefined,
        arm_cm: arm ? parseFloat(arm) : undefined,
        leg_cm: leg ? parseFloat(leg) : undefined,
        source: 'manual',
      });

      // Reset and close
      setWeight('');
      setBodyFat('');
      setMuscleMass('');
      setWaterPct('');
      setWaist('');
      setChest('');
      setArm('');
      setLeg('');
      onClose();
    } catch {
      setError(t.common.saveError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between px-4 py-3 border-b z-10">
          <h2 className="text-lg font-semibold text-gray-900">{t.body.addMeasurement}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Primary: Weight + Body Fat */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.body.weight} ({t.body.kg})
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="85.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                min="30"
                max="300"
                step="0.1"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.body.bodyFat} ({t.body.percent})
              </label>
              <input
                type="number"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                placeholder="15.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                min="3"
                max="60"
                step="0.1"
              />
            </div>
          </div>

          {/* Secondary: Muscle Mass + Water */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.body.muscleMass} ({t.body.kg})
              </label>
              <input
                type="number"
                value={muscleMass}
                onChange={(e) => setMuscleMass(e.target.value)}
                placeholder="40.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                min="10"
                max="100"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.body.waterPct} ({t.body.percent})
              </label>
              <input
                type="number"
                value={waterPct}
                onChange={(e) => setWaterPct(e.target.value)}
                placeholder="55.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                min="30"
                max="80"
                step="0.1"
              />
            </div>
          </div>

          {/* Circumferences */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              {t.body.waist} / {t.body.chest} / {t.body.arm} / {t.body.leg}
            </p>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <input
                  type="number"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  placeholder={t.body.waist}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-xs text-center"
                  min="40"
                  max="200"
                  step="0.5"
                />
                <p className="text-[10px] text-gray-400 text-center mt-0.5">{t.body.cm}</p>
              </div>
              <div>
                <input
                  type="number"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                  placeholder={t.body.chest}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-xs text-center"
                  min="50"
                  max="200"
                  step="0.5"
                />
                <p className="text-[10px] text-gray-400 text-center mt-0.5">{t.body.cm}</p>
              </div>
              <div>
                <input
                  type="number"
                  value={arm}
                  onChange={(e) => setArm(e.target.value)}
                  placeholder={t.body.arm}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-xs text-center"
                  min="15"
                  max="60"
                  step="0.5"
                />
                <p className="text-[10px] text-gray-400 text-center mt-0.5">{t.body.cm}</p>
              </div>
              <div>
                <input
                  type="number"
                  value={leg}
                  onChange={(e) => setLeg(e.target.value)}
                  placeholder={t.body.leg}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-xs text-center"
                  min="30"
                  max="100"
                  step="0.5"
                />
                <p className="text-[10px] text-gray-400 text-center mt-0.5">{t.body.cm}</p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={addMeasurement.isPending || (!weight && !bodyFat && !waist)}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all"
          >
            {addMeasurement.isPending ? t.common.loading : t.common.save}
          </button>
        </form>
      </div>
    </div>
  );
}
