import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddCycleLog, getCyclePhaseEmoji } from '../hooks/useMenstrualCycle';
import { today } from '../../../lib/utils';
import type { CyclePhase, FlowIntensity, CycleSymptom } from '../../../types/health';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PHASES: CyclePhase[] = ['menstruation', 'follicular', 'ovulation', 'luteal'];

const SYMPTOMS: CycleSymptom[] = [
  'cramping', 'bloating', 'mood_changes', 'fatigue',
  'acne', 'headache', 'breast_tenderness', 'water_retention',
];

const MOOD_EMOJIS = ['😢', '😕', '😐', '🙂', '😊'];
const ENERGY_EMOJIS = ['🪫', '😴', '😐', '⚡', '🔥'];

export function AddCycleLogDialog({ open, onClose }: Props) {
  const { t } = useTranslation();
  const addLog = useAddCycleLog();

  const [phase, setPhase] = useState<CyclePhase>('menstruation');
  const [flowIntensity, setFlowIntensity] = useState<FlowIntensity>('normal');
  const [symptoms, setSymptoms] = useState<CycleSymptom[]>([]);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const toggleSymptom = (s: CycleSymptom) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await addLog.mutateAsync({
        date: today(),
        phase,
        flow_intensity: phase === 'menstruation' ? flowIntensity : undefined,
        symptoms: symptoms.length > 0 ? symptoms : undefined,
        energy_level: energy,
        mood,
        notes: notes || undefined,
      });

      // Reset
      setPhase('menstruation');
      setFlowIntensity('normal');
      setSymptoms([]);
      setMood(3);
      setEnergy(3);
      setNotes('');
      onClose();
    } catch {
      setError(t.common.saveError);
    }
  };

  const cycleT = t.cycle;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-900">{cycleT.addEntry}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Phase Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              {cycleT.phase}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PHASES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPhase(p)}
                  className={`py-2 px-3 rounded-lg text-center transition-all text-sm ${
                    phase === p
                      ? 'bg-rose-100 ring-2 ring-rose-500 font-medium'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg mr-1">{getCyclePhaseEmoji(p)}</span>
                  {cycleT[p as keyof typeof cycleT]}
                </button>
              ))}
            </div>
          </div>

          {/* Flow Intensity (only during menstruation) */}
          {phase === 'menstruation' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                {cycleT.flowIntensity}
              </label>
              <div className="flex gap-2">
                {(['light', 'normal', 'heavy'] as FlowIntensity[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFlowIntensity(f)}
                    className={`flex-1 py-2 rounded-lg text-center transition-all text-sm ${
                      flowIntensity === f
                        ? 'bg-rose-100 ring-2 ring-rose-500 font-medium'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {cycleT[`flow${f.charAt(0).toUpperCase()}${f.slice(1)}` as keyof typeof cycleT]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Symptoms */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              {cycleT.symptoms}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SYMPTOMS.map((s) => {
                const keyMap: Record<CycleSymptom, string> = {
                  cramping: 'cramping',
                  bloating: 'bloating',
                  mood_changes: 'moodChanges',
                  fatigue: 'fatigue',
                  acne: 'acne',
                  headache: 'headache',
                  breast_tenderness: 'breastTenderness',
                  water_retention: 'waterRetention',
                };
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSymptom(s)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                      symptoms.includes(s)
                        ? 'bg-rose-500 text-white font-medium'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cycleT[keyMap[s] as keyof typeof cycleT]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mood + Energy */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                {cycleT.mood}
              </label>
              <div className="flex gap-1">
                {MOOD_EMOJIS.map((emoji, idx) => {
                  const val = idx + 1;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMood(val)}
                      className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                        mood === val
                          ? 'bg-rose-100 ring-2 ring-rose-400 scale-105'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-base">{emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                {cycleT.energyLevel}
              </label>
              <div className="flex gap-1">
                {ENERGY_EMOJIS.map((emoji, idx) => {
                  const val = idx + 1;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEnergy(val)}
                      className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                        energy === val
                          ? 'bg-amber-100 ring-2 ring-amber-400 scale-105'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-base">{emoji}</span>
                    </button>
                  );
                })}
              </div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={addLog.isPending}
            className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium rounded-lg hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 transition-all"
          >
            {addLog.isPending ? t.common.loading : t.common.save}
          </button>
        </form>
      </div>
    </div>
  );
}
