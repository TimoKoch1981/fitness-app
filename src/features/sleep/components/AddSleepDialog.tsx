import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddSleepLog } from '../hooks/useSleep';
import { today } from '../../../lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

const QUALITY_EMOJIS = ['😫', '😕', '😐', '🙂', '😴'];

export function AddSleepDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const addSleep = useAddSleepLog();

  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(3);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  // Calculate preview duration
  const calcDuration = (): number => {
    const [bh, bm] = bedtime.split(':').map(Number);
    const [wh, wm] = wakeTime.split(':').map(Number);
    const bed = bh * 60 + bm;
    const wake = wh * 60 + wm;
    return wake >= bed ? wake - bed : (24 * 60 - bed) + wake;
  };

  const durationMin = calcDuration();
  const durationH = Math.floor(durationMin / 60);
  const durationM = durationMin % 60;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await addSleep.mutateAsync({
        date: today(),
        bedtime,
        wake_time: wakeTime,
        duration_minutes: durationMin,
        quality,
        notes: notes || undefined,
      });

      setBedtime('23:00');
      setWakeTime('07:00');
      setQuality(3);
      setNotes('');
      onClose();
    } catch {
      setError(t.common.saveError);
    }
  };

  const qualityKeys = ['veryPoor', 'poor', 'fair', 'good', 'veryGood'] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{t.sleep.addSleep}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Bedtime + Wake time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.sleep.bedtime}
              </label>
              <input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-center"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t.sleep.wakeTime}
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm text-center"
                required
              />
            </div>
          </div>

          {/* Duration Preview */}
          <div className="bg-indigo-50 rounded-lg p-3 text-center">
            <p className="text-sm text-indigo-600 font-medium">
              {t.sleep.duration}: {durationH}h {durationM > 0 ? `${durationM}min` : ''}
            </p>
            <p className="text-[10px] text-indigo-400 mt-0.5">
              {durationMin >= 420 && durationMin <= 540
                ? t.sleep.durationOptimal
                : durationMin < 420
                  ? t.sleep.durationShort
                  : t.sleep.durationLong}
            </p>
          </div>

          {/* Quality Rating */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              {t.sleep.quality}
            </label>
            <div className="flex justify-between gap-1">
              {QUALITY_EMOJIS.map((emoji, idx) => {
                const val = idx + 1;
                const key = qualityKeys[idx];
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setQuality(val)}
                    className={`flex-1 py-2 rounded-lg text-center transition-all ${
                      quality === val
                        ? 'bg-indigo-100 ring-2 ring-indigo-500 scale-105'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{emoji}</span>
                    <p className="text-[9px] text-gray-500 mt-0.5">{t.sleep[key as keyof typeof t.sleep]}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t.common.notes}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={addSleep.isPending}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            {addSleep.isPending ? t.common.loading : t.common.save}
          </button>
        </form>
      </div>
    </div>
  );
}
