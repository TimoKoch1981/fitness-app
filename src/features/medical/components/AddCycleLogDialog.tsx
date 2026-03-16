import { useState, useMemo, useCallback } from 'react';
import { X, Info, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
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

/** Per-day override data for multi-day variation mode */
interface PerDayData {
  phase: CyclePhase;
  flowIntensity: FlowIntensity;
  symptoms: CycleSymptom[];
  mood: number;
  energy: number;
  notes: string;
  cervicalMucus: CervicalMucus | null;
  pmsFlag: boolean;
  sexualActivity: SexualActivity | null;
  basalTemp: string;
}

function makeDefaultPerDay(): PerDayData {
  return {
    phase: 'menstruation',
    flowIntensity: 'normal',
    symptoms: [],
    mood: 3,
    energy: 3,
    notes: '',
    cervicalMucus: null,
    pmsFlag: false,
    sexualActivity: null,
    basalTemp: '',
  };
}

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

  // Per-day variation mode
  const [perDayMode, setPerDayMode] = useState(false);
  const [perDayData, setPerDayData] = useState<Record<string, PerDayData>>({});
  const [currentDayIdx, setCurrentDayIdx] = useState(0);

  // Current day in per-day mode
  const currentDate = perDayMode && selectedDates.length > 1 ? selectedDates[currentDayIdx] : null;
  const currentDay = currentDate ? (perDayData[currentDate] ?? makeDefaultPerDay()) : null;

  // Helper to update a field for the current day in per-day mode
  const updateCurrentDay = useCallback(<K extends keyof PerDayData>(field: K, value: PerDayData[K]) => {
    if (!currentDate) return;
    setPerDayData(prev => ({
      ...prev,
      [currentDate]: { ...(prev[currentDate] ?? makeDefaultPerDay()), [field]: value },
    }));
  }, [currentDate]);

  // Copy data from previous day
  const copyFromPrevious = useCallback(() => {
    if (currentDayIdx <= 0 || !currentDate) return;
    const prevDate = selectedDates[currentDayIdx - 1];
    const prevData = perDayData[prevDate];
    if (prevData) {
      setPerDayData(prev => ({ ...prev, [currentDate]: { ...prevData } }));
    }
  }, [currentDayIdx, currentDate, selectedDates, perDayData]);

  // Get effective values — in per-day mode, read from perDayData; otherwise from shared state
  const eff = {
    phase: currentDay?.phase ?? phase,
    flowIntensity: currentDay?.flowIntensity ?? flowIntensity,
    symptoms: currentDay?.symptoms ?? symptoms,
    mood: currentDay?.mood ?? mood,
    energy: currentDay?.energy ?? energy,
    notes: currentDay?.notes ?? notes,
    cervicalMucus: currentDay?.cervicalMucus ?? cervicalMucus,
    pmsFlag: currentDay?.pmsFlag ?? pmsFlag,
    sexualActivity: currentDay?.sexualActivity ?? sexualActivity,
    basalTemp: currentDay?.basalTemp ?? basalTemp,
  };

  // Setters that work in both modes
  const setEffPhase = (v: CyclePhase) => { if (perDayMode && currentDate) updateCurrentDay('phase', v); else setPhase(v); };
  const setEffFlow = (v: FlowIntensity) => { if (perDayMode && currentDate) updateCurrentDay('flowIntensity', v); else setFlowIntensity(v); };
  const setEffMood = (v: number) => { if (perDayMode && currentDate) updateCurrentDay('mood', v); else setMood(v); };
  const setEffEnergy = (v: number) => { if (perDayMode && currentDate) updateCurrentDay('energy', v); else setEnergy(v); };
  const setEffNotes = (v: string) => { if (perDayMode && currentDate) updateCurrentDay('notes', v); else setNotes(v); };
  const setEffMucus = (v: CervicalMucus | null) => { if (perDayMode && currentDate) updateCurrentDay('cervicalMucus', v); else setCervicalMucus(v); };
  const setEffPms = (v: boolean) => { if (perDayMode && currentDate) updateCurrentDay('pmsFlag', v); else setPmsFlag(v); };
  const setEffSex = (v: SexualActivity | null) => { if (perDayMode && currentDate) updateCurrentDay('sexualActivity', v); else setSexualActivity(v); };
  const setEffBasal = (v: string) => { if (perDayMode && currentDate) updateCurrentDay('basalTemp', v); else setBasalTemp(v); };
  const toggleEffSymptom = (s: CycleSymptom) => {
    if (perDayMode && currentDate) {
      const cur = currentDay?.symptoms ?? [];
      updateCurrentDay('symptoms', cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]);
    } else {
      setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
    }
  };

  const dateDays = useMemo(() => getLastNDays(14), []);
  const weekdayLabels = de ? WEEKDAY_SHORT : WEEKDAY_SHORT_EN;

  if (!open) return null;

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
      const buildInput = (date: string, d?: PerDayData) => {
        const p = d?.phase ?? phase;
        const fi = d?.flowIntensity ?? flowIntensity;
        const sy = d?.symptoms ?? symptoms;
        const mo = d?.mood ?? mood;
        const en = d?.energy ?? energy;
        const no = d?.notes ?? notes;
        const cm = d?.cervicalMucus ?? cervicalMucus;
        const pm = d?.pmsFlag ?? pmsFlag;
        const sa = d?.sexualActivity ?? sexualActivity;
        const bt = d?.basalTemp ?? basalTemp;
        return {
          date,
          phase: p,
          flow_intensity: (p === 'menstruation' || p === 'spotting') ? fi : undefined,
          symptoms: sy.length > 0 ? sy : undefined,
          energy_level: en,
          mood: mo,
          notes: no || undefined,
          cervical_mucus: cm || undefined,
          pms_flag: pm || undefined,
          sexual_activity: sa || undefined,
          basal_temp: bt ? parseFloat(bt) : undefined,
        };
      };

      if (selectedDates.length === 1) {
        await addLog.mutateAsync(buildInput(selectedDates[0]));
      } else if (perDayMode) {
        // Per-day variation — each day has its own data
        const inputs = selectedDates.map(date => buildInput(date, perDayData[date]));
        await addLogBatch.mutateAsync(inputs);
      } else {
        // Shared data for all days
        await addLogBatch.mutateAsync(selectedDates.map(date => buildInput(date)));
      }

      // Reset
      setSelectedDates([initialDate ?? today()]);
      setMultiMode(false);
      setPerDayMode(false);
      setPerDayData({});
      setCurrentDayIdx(0);
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

          {/* Per-day variation toggle — only show in multi-mode with >1 date */}
          {multiMode && selectedDates.length > 1 && (
            <div className="flex items-center justify-between bg-rose-50 rounded-lg px-3 py-2">
              <div>
                <span className="text-xs font-medium text-rose-700">
                  {de ? 'Pro Tag anpassen' : 'Customize per day'}
                </span>
                <p className="text-[10px] text-rose-500">
                  {de ? 'Unterschiedliche Daten pro Tag eingeben' : 'Enter different data for each day'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={perDayMode} onChange={(e) => {
                  setPerDayMode(e.target.checked);
                  setCurrentDayIdx(0);
                  if (e.target.checked && Object.keys(perDayData).length === 0) {
                    // Initialize all days with current shared values
                    const init: Record<string, PerDayData> = {};
                    for (const d of selectedDates) {
                      init[d] = { phase, flowIntensity, symptoms: [...symptoms], mood, energy, notes, cervicalMucus, pmsFlag, sexualActivity, basalTemp };
                    }
                    setPerDayData(init);
                  }
                }} className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-rose-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500" />
              </label>
            </div>
          )}

          {/* Per-day step navigator */}
          {perDayMode && selectedDates.length > 1 && (
            <div className="flex items-center justify-between bg-white border border-rose-200 rounded-xl px-3 py-2">
              <button type="button" disabled={currentDayIdx === 0}
                onClick={() => setCurrentDayIdx(i => i - 1)}
                className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-900">
                  {new Date(selectedDates[currentDayIdx] + 'T12:00:00').toLocaleDateString(
                    de ? 'de-DE' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' }
                  )}
                </p>
                <p className="text-[10px] text-rose-500">
                  {de ? `Tag ${currentDayIdx + 1} von ${selectedDates.length}` : `Day ${currentDayIdx + 1} of ${selectedDates.length}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {currentDayIdx > 0 && (
                  <button type="button" onClick={copyFromPrevious}
                    className="p-1 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    title={de ? 'Vom vorherigen Tag kopieren' : 'Copy from previous day'}>
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
                <button type="button" disabled={currentDayIdx >= selectedDates.length - 1}
                  onClick={() => setCurrentDayIdx(i => i + 1)}
                  className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Phase Selection — 5 Phases (2+2+1 grid) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">{label('phase', de ? 'Phase' : 'Phase')}</label>
            <div className="grid grid-cols-2 gap-2">
              {PHASES.map((p) => (
                <button key={p} type="button" onClick={() => setEffPhase(p)}
                  className={`py-2 px-3 rounded-lg text-center transition-all text-sm ${
                    eff.phase === p ? 'bg-rose-100 ring-2 ring-rose-500 font-medium' : 'bg-gray-50 hover:bg-gray-100'
                  } ${p === 'spotting' ? 'col-span-2' : ''}`}>
                  <span className="text-lg mr-1">{getCyclePhaseEmoji(p)}</span>
                  {label(p, p)}
                </button>
              ))}
            </div>
          </div>

          {/* Flow Intensity — during menstruation or spotting (4 options) */}
          {(eff.phase === 'menstruation' || eff.phase === 'spotting') && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                {label('flowIntensity', de ? 'Blutungsstaerke' : 'Flow intensity')}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {FLOW_OPTIONS.map((f) => (
                  <button key={f} type="button" onClick={() => setEffFlow(f)}
                    className={`py-2 rounded-lg text-center transition-all text-xs ${
                      eff.flowIntensity === f ? 'bg-rose-100 ring-2 ring-rose-500 font-medium' : 'bg-gray-50 hover:bg-gray-100'
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
                  onClick={() => setEffMucus(eff.cervicalMucus === m ? null : m)}
                  className={`py-2 rounded-lg text-center transition-all text-xs flex flex-col items-center gap-0.5 ${
                    eff.cervicalMucus === m ? 'bg-rose-100 ring-2 ring-rose-500 font-medium' : 'bg-gray-50 hover:bg-gray-100'
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
          {(eff.phase === 'luteal' || eff.phase === 'menstruation' || eff.phase === 'spotting') && (
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
              <span className="text-sm text-gray-700">
                {label('pmsToday', de ? 'PMS heute?' : 'PMS today?')}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={eff.pmsFlag} onChange={(e) => setEffPms(e.target.checked)} className="sr-only peer" />
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
                  onClick={() => setEffSex(eff.sexualActivity === s ? null : s)}
                  className={`py-2 rounded-lg text-center transition-all text-xs ${
                    eff.sexualActivity === s ? 'bg-rose-100 ring-2 ring-rose-500 font-medium' : 'bg-gray-50 hover:bg-gray-100'
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
                <button key={s} type="button" onClick={() => toggleEffSymptom(s)}
                  className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                    eff.symptoms.includes(s) ? 'bg-rose-500 text-white font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                    <button key={val} type="button" onClick={() => setEffMood(val)}
                      className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                        eff.mood === val ? 'bg-rose-100 ring-2 ring-rose-400 scale-105' : 'bg-gray-50 hover:bg-gray-100'
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
                    <button key={val} type="button" onClick={() => setEffEnergy(val)}
                      className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                        eff.energy === val ? 'bg-amber-100 ring-2 ring-amber-400 scale-105' : 'bg-gray-50 hover:bg-gray-100'
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
              value={eff.basalTemp}
              onChange={(e) => setEffBasal(e.target.value)}
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
              value={eff.notes}
              onChange={(e) => setEffNotes(e.target.value)}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
            />
          </div>

          {/* Per-day progress dots */}
          {perDayMode && selectedDates.length > 1 && (
            <div className="flex justify-center gap-1.5">
              {selectedDates.map((d, i) => {
                const hasData = !!perDayData[d];
                return (
                  <button key={d} type="button" onClick={() => setCurrentDayIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentDayIdx ? 'bg-rose-500 scale-125' : hasData ? 'bg-rose-300' : 'bg-gray-200'
                    }`}
                    title={d}
                  />
                );
              })}
            </div>
          )}

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
