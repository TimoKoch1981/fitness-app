import { useState, useMemo } from 'react';
import { X, Info } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddCycleLog, useAddCycleLogBatch, getCyclePhaseEmoji, getCervicalMucusEmoji } from '../hooks/useMenstrualCycle';
import { today } from '../../../lib/utils';
import type { CyclePhase, FlowIntensity, CycleSymptom, CervicalMucus, SexualActivity } from '../../../types/health';

interface Props {
  open: boolean;
  onClose: () => void;
  initialDate?: string;
}

const PHASES: CyclePhase[] = ['menstruation', 'follicular', 'ovulation', 'luteal', 'spotting'];

const SYMPTOMS: CycleSymptom[] = [
  'cramping', 'bloating', 'mood_changes', 'fatigue',
  'acne', 'headache', 'breast_tenderness', 'water_retention',
  'sleep_issues', 'hot_flashes', 'irritability', 'back_pain',
  'joint_pain', 'nausea', 'concentration_issues', 'libido_changes',
  'appetite_changes', 'skin_changes', 'dizziness', 'urinary_frequency',
];

const FLOW_OPTIONS: FlowIntensity[] = ['light', 'normal', 'heavy', 'very_heavy'];
const MUCUS_OPTIONS: CervicalMucus[] = ['none', 'sticky', 'creamy', 'egg_white'];
const SEX_OPTIONS: SexualActivity[] = ['none', 'protected', 'unprotected'];

const MOOD_EMOJIS = ['\u{1F622}', '\u{1F615}', '\u{1F610}', '\u{1F642}', '\u{1F60A}'];
const ENERGY_EMOJIS = ['\u{1FAB6}', '\u{1F634}', '\u{1F610}', '\u{26A1}', '\u{1F525}'];

const WEEKDAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WEEKDAY_SHORT_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function getLastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function getWeekdayIndex(isoDate: string): number {
  const d = new Date(isoDate + 'T12:00:00');
  return (d.getDay() + 6) % 7;
}

function getDayNum(isoDate: string): number {
  return parseInt(isoDate.split('-')[2], 10);
}

export function AddCycleLogDialog({ open, onClose, initialDate }: Props) {
  const { t, language } = useTranslation();
  const addLog = useAddCycleLog();
  const addLogBatch = useAddCycleLogBatch();
  const de = language === 'de';

  const [selectedDates, setSelectedDates] = useState<string[]>([initialDate ?? today()]);
  const [phase, setPhase] = useState<CyclePhase>('menstruation');
  const [flowIntensity, setFlowIntensity] = useState<FlowIntensity>('normal');
  const [symptoms, setSymptoms] = useState<CycleSymptom[]>([]);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [notes, setNotes] = useState('');
  const [cervicalMucus, setCervicalMucus] = useState<CervicalMucus | null>(null);
  const [pmsFlag, setPmsFlag] = useState(false);
  const [sexualActivity, setSexualActivity] = useState<SexualActivity | null>(null);
  const [basalTemp, setBasalTemp] = useState('');
  const [showMucusInfo, setShowMucusInfo] = useState(false);
  const [error, setError] = useState('');
  const [multiMode, setMultiMode] = useState(false);

  const dateDays = useMemo(() => getLastNDays(14), []);
  const weekdayLabels = de ? WEEKDAY_SHORT : WEEKDAY_SHORT_EN;

  if (!open) return null;

  const toggleSymptom = (s: CycleSymptom) => {
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const toggleDate = (d: string) => {
    if (multiMode) {
      setSelectedDates(prev =>
        prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()
      );
    } else {
      setSelectedDates([d]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedDates.length === 0) {
      setError(de ? 'Bitte mindestens ein Datum wählen' : 'Please select at least one date');
      return;
    }

    try {
      const buildInput = (date: string) => ({
        date,
        phase,
        flow_intensity: (phase === 'menstruation' || phase === 'spotting') ? flowIntensity : undefined,
        symptoms: symptoms.length > 0 ? symptoms : undefined,
        energy_level: energy,
        mood,
        notes: notes || undefined,
        cervical_mucus: cervicalMucus || undefined,
        pms_flag: pmsFlag || undefined,
        sexual_activity: sexualActivity || undefined,
        basal_temp: basalTemp ? parseFloat(basalTemp) : undefined,
      });

      if (selectedDates.length === 1) {
        // Single day — use original hook
        await addLog.mutateAsync(buildInput(selectedDates[0]));
      } else {
        // Multiple days — atomic batch upsert (single DB request)
        await addLogBatch.mutateAsync(selectedDates.map(buildInput));
      }

      // Reset
      setSelectedDates([initialDate ?? today()]);
      setMultiMode(false);
      setPhase('menstruation');
      setFlowIntensity('normal');
      setSymptoms([]);
      setMood(3);
      setEnergy(3);
      setNotes('');
      setCervicalMucus(null);
      setPmsFlag(false);
      setSexualActivity(null);
      setBasalTemp('');
      onClose();
    } catch {
      setError(t.common.saveError);
    }
  };

  const cycleT = t.cycle as Record<string, string> | undefined;
  const label = (key: string, fallback: string): string =>
    cycleT && typeof cycleT[key] === 'string' ? cycleT[key] : fallback;

  // Symptom key mapping for i18n
  const symptomKeyMap: Record<CycleSymptom, string> = {
    cramping: 'cramping', bloating: 'bloating', mood_changes: 'moodChanges',
    fatigue: 'fatigue', acne: 'acne', headache: 'headache',
    breast_tenderness: 'breastTenderness', water_retention: 'waterRetention',
    sleep_issues: 'sleepIssues', hot_flashes: 'hotFlashes',
    urinary_frequency: 'urinaryFrequency', concentration_issues: 'concentrationIssues',
    libido_changes: 'libidoChanges', back_pain: 'backPain',
    joint_pain: 'jointPain', nausea: 'nausea', dizziness: 'dizziness',
    appetite_changes: 'appetiteChanges', skin_changes: 'skinChanges',
    irritability: 'irritability',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-gray-900">{label('addEntry', de ? 'Zyklus eintragen' : 'Log cycle')}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Date Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">{de ? 'Datum' : 'Date'}</label>
              <div className="flex items-center gap-2">
                {selectedDates.length > 1 && (
                  <span className="text-[10px] text-rose-500 font-medium">
                    {selectedDates.length} {de ? 'Tage' : 'days'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMultiMode(!multiMode);
                    if (!multiMode) {
                      // Keep current selection when entering multi mode
                    } else {
                      // When leaving multi mode, keep only last selected
                      setSelectedDates(prev => prev.length > 0 ? [prev[prev.length - 1]] : [today()]);
                    }
                  }}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                    multiMode
                      ? 'bg-rose-500 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {de ? 'Mehrere Tage' : 'Multi-day'}
                </button>
              </div>
            </div>
            {multiMode && (
              <p className="text-[10px] text-rose-500 mb-1.5">
                {de ? '💡 Tippe auf mehrere Tage, um sie gleichzeitig nachzutragen' : '💡 Tap multiple days to log them at once'}
              </p>
            )}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
              {dateDays.map((d) => {
                const isToday = d === today();
                const isSelected = selectedDates.includes(d);
                const wdIdx = getWeekdayIndex(d);
                return (
                  <button key={d} type="button" onClick={() => toggleDate(d)}
                    className={`flex flex-col items-center min-w-[40px] py-1.5 px-1 rounded-lg transition-all text-xs ${
                      isSelected ? 'bg-rose-500 text-white ring-2 ring-rose-300'
                      : isToday ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}>
                    <span className="text-[9px] font-medium opacity-70">{weekdayLabels[wdIdx]}</span>
                    <span className="text-sm font-semibold">{getDayNum(d)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phase Selection — 5 Phases (2+2+1 grid) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">{label('phase', de ? 'Phase' : 'Phase')}</label>
            <div className="grid grid-cols-2 gap-2">
              {PHASES.map((p) => (
                <button key={p} type="button" onClick={() => setPhase(p)}
                  className={`py-2 px-3 rounded-lg text-center transition-all text-sm ${
                    phase === p ? 'bg-rose-100 ring-2 ring-rose-500 font-medium' : 'bg-gray-50 hover:bg-gray-100'
                  } ${p === 'spotting' ? 'col-span-2' : ''}`}>
                  <span className="text-lg mr-1">{getCyclePhaseEmoji(p)}</span>
                  {label(p, p)}
                </button>
              ))}
            </div>
          </div>

          {/* Flow Intensity — during menstruation or spotting (4 options) */}
          {(phase === 'menstruation' || phase === 'spotting') && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                {label('flowIntensity', de ? 'Blutungsstaerke' : 'Flow intensity')}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {FLOW_OPTIONS.map((f) => (
                  <button key={f} type="button" onClick={() => setFlowIntensity(f)}
                    className={`py-2 rounded-lg text-center transition-all text-xs ${
                      flowIntensity === f ? 'bg-rose-100 ring-2 ring-rose-500 font-medium' : 'bg-gray-50 hover:bg-gray-100'
                    }`}>
                    {label(f === 'very_heavy' ? 'flowVeryHeavy' : `flow${f.charAt(0).toUpperCase()}${f.slice(1)}`,
                      f === 'very_heavy' ? (de ? 'Sehr stark' : 'Very heavy') :
                      f === 'light' ? (de ? 'Leicht' : 'Light') :
                      f === 'normal' ? (de ? 'Normal' : 'Normal') :
                      (de ? 'Stark' : 'Heavy'))}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cervical Mucus — all phases */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <label className="text-xs font-medium text-gray-500">
                {label('cervicalMucus', de ? 'Zervixschleim' : 'Cervical mucus')}
              </label>
              <button type="button" onClick={() => setShowMucusInfo(!showMucusInfo)}
                className="p-0.5 text-gray-400 hover:text-rose-500">
                <Info className="w-3 h-3" />
              </button>
            </div>
            {showMucusInfo && (
              <p className="mb-2 px-3 py-2 bg-rose-50 border border-rose-100 rounded-lg text-[10px] text-rose-700">
                {de
                  ? 'Zervixschleim veraendert sich im Zyklus. Spinnbarer (eiweissartiger) Schleim zeigt hohe Fruchtbarkeit an.'
                  : 'Cervical mucus changes throughout the cycle. Egg-white mucus indicates high fertility.'}
              </p>
            )}
            <div className="grid grid-cols-4 gap-1.5">
              {MUCUS_OPTIONS.map((m) => (
                <button key={m} type="button"
                  onClick={() => setCervicalMucus(cervicalMucus === m ? null : m)}
                  className={`py-2 rounded-lg text-center transition-all text-xs flex flex-col items-center gap-0.5 ${
                    cervicalMucus === m ? 'bg-rose-100 ring-2 ring-rose-500 font-medium' : 'bg-gray-50 hover:bg-gray-100'
                  }`}>
                  <span className="text-base">{getCervicalMucusEmoji(m)}</span>
                  <span>{label(m === 'none' ? 'mucusNone' : m === 'sticky' ? 'mucusSticky' : m === 'creamy' ? 'mucusCreamy' : 'mucusEggWhite',
                    m === 'none' ? (de ? 'Keiner' : 'None') :
                    m === 'sticky' ? (de ? 'Klebrig' : 'Sticky') :
                    m === 'creamy' ? (de ? 'Cremig' : 'Creamy') :
                    (de ? 'Spinnbar' : 'Egg white'))}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PMS Toggle — show in luteal + menstruation + spotting */}
          {(phase === 'luteal' || phase === 'menstruation' || phase === 'spotting') && (
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
              <span className="text-sm text-gray-700">
                {label('pmsToday', de ? 'PMS heute?' : 'PMS today?')}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={pmsFlag} onChange={(e) => setPmsFlag(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500" />
              </label>
            </div>
          )}

          {/* Sexual Activity */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              {label('sexualActivity', de ? 'Sexuelle Aktivitaet' : 'Sexual activity')}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {SEX_OPTIONS.map((s) => (
                <button key={s} type="button"
                  onClick={() => setSexualActivity(sexualActivity === s ? null : s)}
                  className={`py-2 rounded-lg text-center transition-all text-xs ${
                    sexualActivity === s ? 'bg-rose-100 ring-2 ring-rose-500 font-medium' : 'bg-gray-50 hover:bg-gray-100'
                  }`}>
                  {label(s === 'none' ? 'sexNone' : s === 'protected' ? 'sexProtected' : 'sexUnprotected',
                    s === 'none' ? (de ? 'Keine' : 'None') :
                    s === 'protected' ? (de ? 'Geschuetzt' : 'Protected') :
                    (de ? 'Ungeschuetzt' : 'Unprotected'))}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              {label('symptoms', de ? 'Symptome' : 'Symptoms')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SYMPTOMS.map((s) => (
                <button key={s} type="button" onClick={() => toggleSymptom(s)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                    symptoms.includes(s) ? 'bg-rose-500 text-white font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {label(symptomKeyMap[s], s.replace(/_/g, ' '))}
                </button>
              ))}
            </div>
          </div>

          {/* Mood + Energy */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                {label('mood', de ? 'Stimmung' : 'Mood')}
              </label>
              <div className="flex gap-1">
                {MOOD_EMOJIS.map((emoji, idx) => {
                  const val = idx + 1;
                  return (
                    <button key={val} type="button" onClick={() => setMood(val)}
                      className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                        mood === val ? 'bg-rose-100 ring-2 ring-rose-400 scale-105' : 'bg-gray-50 hover:bg-gray-100'
                      }`}>
                      <span className="text-base">{emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                {label('energyLevel', de ? 'Energie' : 'Energy')}
              </label>
              <div className="flex gap-1">
                {ENERGY_EMOJIS.map((emoji, idx) => {
                  const val = idx + 1;
                  return (
                    <button key={val} type="button" onClick={() => setEnergy(val)}
                      className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                        energy === val ? 'bg-amber-100 ring-2 ring-amber-400 scale-105' : 'bg-gray-50 hover:bg-gray-100'
                      }`}>
                      <span className="text-base">{emoji}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Basal Temperature */}
          <div>
            <label htmlFor="cycle-basal-temp" className="block text-xs font-medium text-gray-500 mb-1">
              {label('basalTemp', de ? 'Basaltemperatur (°C)' : 'Basal temperature (°C)')}
            </label>
            <input
              id="cycle-basal-temp"
              type="number"
              step="0.01"
              min="35.0"
              max="42.0"
              value={basalTemp}
              onChange={(e) => setBasalTemp(e.target.value)}
              placeholder={de ? 'z.B. 36.50' : 'e.g. 36.50'}
              aria-label={label('basalTemp', de ? 'Basaltemperatur' : 'Basal temperature')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="cycle-notes" className="block text-xs font-medium text-gray-500 mb-1">{t.common.notes}</label>
            <input
              id="cycle-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
            />
          </div>

          {error && <p className="text-xs text-red-500 text-center" role="alert">{error}</p>}

          <button type="submit" disabled={addLog.isPending || selectedDates.length === 0}
            className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium rounded-lg hover:from-rose-600 hover:to-pink-700 disabled:opacity-50 transition-all">
            {addLog.isPending
              ? t.common.loading
              : selectedDates.length > 1
                ? `${t.common.save} (${selectedDates.length} ${de ? 'Tage' : 'days'})`
                : t.common.save}
          </button>
        </form>
      </div>
    </div>
  );
}
