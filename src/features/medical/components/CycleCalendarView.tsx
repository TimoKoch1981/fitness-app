/**
 * CycleCalendarView — Monatskalender-Ansicht fuer Zyklus-Tracking (Flo/Clue-Style).
 *
 * v3: Period-First UX
 * - Quick-Toggle-Modus: Tage antippen = Periode an/aus
 * - Phase wird NIE manuell gesetzt — immer auto-berechnet
 * - Vereinfachtes Detail-Sheet (kein Phase-Edit)
 */

import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Droplets } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useMenstrualCycleLogs, getCyclePhaseEmoji, useDeleteCycleLog, useAddCycleLogBatch } from '../hooks/useMenstrualCycle';
import { useCyclePrediction } from '../hooks/useCyclePrediction';
import { PHASE_BAR_COLORS } from './CycleTimeline';
import type { MenstrualCycleLog, CyclePhase, FlowIntensity } from '../../../types/health';

interface CycleCalendarViewProps {
  cycleTrackingEnabled?: boolean;
  onDayClick?: (date: string) => void;
}

// Calendar-specific background colors (lighter for better readability)
const PHASE_BG: Record<CyclePhase, string> = {
  menstruation: 'bg-red-200',
  follicular: 'bg-green-200',
  ovulation: 'bg-amber-200',
  luteal: 'bg-purple-200',
  spotting: 'bg-orange-200',
};

const PHASE_BG_PREDICTED: Record<CyclePhase, string> = {
  menstruation: 'bg-red-100 border-dashed border border-red-300',
  follicular: 'bg-green-50',
  ovulation: 'bg-amber-100 border-dashed border border-amber-300',
  luteal: 'bg-purple-50',
  spotting: 'bg-orange-50',
};

const WEEKDAY_LABELS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WEEKDAY_LABELS_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const MOOD_EMOJIS = ['\u{1F622}', '\u{1F615}', '\u{1F610}', '\u{1F642}', '\u{1F60A}'];
const ENERGY_EMOJIS = ['\u{1FAB6}', '\u{1F634}', '\u{1F610}', '\u{26A1}', '\u{1F525}'];

const FLOW_OPTIONS: { key: FlowIntensity; emoji: string }[] = [
  { key: 'light', emoji: '\u{1F4A7}' },
  { key: 'normal', emoji: '\u{1F4A7}\u{1F4A7}' },
  { key: 'heavy', emoji: '\u{1F4A7}\u{1F4A7}\u{1F4A7}' },
  { key: 'very_heavy', emoji: '\u{1FA78}' },
];

interface CalendarDay {
  date: string;           // ISO date
  dayNum: number;         // 1-31
  isCurrentMonth: boolean;
  isToday: boolean;
  log?: MenstrualCycleLog;
  predictedPhase?: CyclePhase;
  isFertile?: boolean;
}

function getMonthGrid(year: number, month: number, logsMap: Map<string, MenstrualCycleLog>, prediction: ReturnType<typeof useCyclePrediction>): CalendarDay[] {
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDay = new Date(year, month, 1);
  // Monday-start: 0=Mon, 6=Sun
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: CalendarDay[] = [];

  // Fill leading days from previous month
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      date: dateStr,
      dayNum: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      log: logsMap.get(dateStr),
      predictedPhase: getPredictedPhase(dateStr, prediction),
      isFertile: isInFertileWindow(dateStr, prediction),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      date: dateStr,
      dayNum: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      log: logsMap.get(dateStr),
      predictedPhase: getPredictedPhase(dateStr, prediction),
      isFertile: isInFertileWindow(dateStr, prediction),
    });
  }

  // Fill trailing days to complete last row
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        log: logsMap.get(dateStr),
        predictedPhase: getPredictedPhase(dateStr, prediction),
        isFertile: isInFertileWindow(dateStr, prediction),
      });
    }
  }

  return days;
}

function getPredictedPhase(dateStr: string, prediction: ReturnType<typeof useCyclePrediction>): CyclePhase | undefined {
  if (!prediction || prediction.confidence === 'none' || !prediction.lastPeriodStart) return undefined;
  const { predictedCycleLength, averagePeriodLength, lastPeriodStart } = prediction;
  if (!lastPeriodStart) return undefined;

  const date = new Date(dateStr + 'T12:00:00');
  const lastStart = new Date(lastPeriodStart + 'T12:00:00');
  const diffDays = Math.round((date.getTime() - lastStart.getTime()) / 86400000);

  // Only predict within 1 cycle length into the future
  if (diffDays < 0 || diffDays > predictedCycleLength * 2) return undefined;

  const cycleDay = (diffDays % predictedCycleLength) + 1;
  const ovulationDay = Math.max(averagePeriodLength + 1, predictedCycleLength - 14);

  if (cycleDay <= averagePeriodLength) return 'menstruation';
  if (cycleDay < ovulationDay) return 'follicular';
  if (cycleDay <= ovulationDay + 1) return 'ovulation';
  return 'luteal';
}

function isInFertileWindow(dateStr: string, prediction: ReturnType<typeof useCyclePrediction>): boolean {
  if (!prediction?.fertileWindowStart || !prediction?.fertileWindowEnd) return false;
  return dateStr >= prediction.fertileWindowStart && dateStr <= prediction.fertileWindowEnd;
}

export function CycleCalendarView({ cycleTrackingEnabled, onDayClick }: CycleCalendarViewProps) {
  const { t, language } = useTranslation();
  const de = language === 'de';
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const deleteCycle = useDeleteCycleLog();

  // Quick-Toggle state
  const [quickToggleMode, setQuickToggleMode] = useState(false);
  const [quickToggleFlow, setQuickToggleFlow] = useState<FlowIntensity>('normal');
  const [quickToggleDates, setQuickToggleDates] = useState<Set<string>>(new Set());
  const [quickToggleRemoves, setQuickToggleRemoves] = useState<Set<string>>(new Set());
  const addLogBatch = useAddCycleLogBatch();

  const { data: logs } = useMenstrualCycleLogs(365);
  const prediction = useCyclePrediction();

  const weekdays = de ? WEEKDAY_LABELS_DE : WEEKDAY_LABELS_EN;

  const logsMap = useMemo(() => {
    const map = new Map<string, MenstrualCycleLog>();
    if (logs) {
      for (const log of logs) {
        map.set(log.date, log);
      }
    }
    return map;
  }, [logs]);

  const calendarDays = useMemo(
    () => getMonthGrid(viewYear, viewMonth, logsMap, prediction),
    [viewYear, viewMonth, logsMap, prediction]
  );

  const monthLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    return d.toLocaleDateString(de ? 'de-DE' : 'en-US', { month: 'long', year: 'numeric' });
  }, [viewYear, viewMonth, de]);

  const goToPrev = useCallback(() => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }, [viewMonth]);

  const goToNext = useCallback(() => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }, [viewMonth]);

  const goToToday = useCallback(() => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  }, []);

  // Quick-Toggle handlers
  const handleQuickToggleDay = useCallback((day: CalendarDay) => {
    const date = day.date;
    const existingLog = day.log;
    const isPeriodLog = existingLog && (existingLog.phase === 'menstruation' || existingLog.phase === 'spotting');

    if (isPeriodLog) {
      // Toggle OFF: mark for removal
      setQuickToggleRemoves(prev => {
        const next = new Set(prev);
        if (next.has(date)) next.delete(date); else next.add(date);
        return next;
      });
      // Also remove from adds if it was there
      setQuickToggleDates(prev => { const next = new Set(prev); next.delete(date); return next; });
    } else {
      // Toggle ON: mark for adding
      setQuickToggleDates(prev => {
        const next = new Set(prev);
        if (next.has(date)) next.delete(date); else next.add(date);
        return next;
      });
      // Also remove from removes if it was there
      setQuickToggleRemoves(prev => { const next = new Set(prev); next.delete(date); return next; });
    }
  }, []);

  const handleQuickToggleSave = useCallback(async () => {
    const adds = Array.from(quickToggleDates);
    const removes = Array.from(quickToggleRemoves);

    // Delete removed period logs
    for (const date of removes) {
      const log = logsMap.get(date);
      if (log) await deleteCycle.mutateAsync(log.id);
    }

    // Add new period logs
    if (adds.length > 0) {
      await addLogBatch.mutateAsync(
        adds.map(date => ({
          date,
          phase: 'menstruation' as const,
          flow_intensity: quickToggleFlow,
        }))
      );
    }

    setQuickToggleMode(false);
    setQuickToggleDates(new Set());
    setQuickToggleRemoves(new Set());
  }, [quickToggleDates, quickToggleRemoves, quickToggleFlow, logsMap, deleteCycle, addLogBatch]);

  const handleDayClick = (day: CalendarDay) => {
    if (quickToggleMode) {
      handleQuickToggleDay(day);
      return;
    }
    if (day.log) {
      setSelectedDay(day);
    } else if (onDayClick) {
      onDayClick(day.date);
    }
  };

  if (!cycleTrackingEnabled) return null;

  const hasQuickChanges = quickToggleDates.size > 0 || quickToggleRemoves.size > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header: Month navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <button onClick={goToPrev} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>
        <button onClick={goToToday} className="text-sm font-semibold text-gray-900 hover:text-rose-600 transition-colors">
          {monthLabel}
        </button>
        <button onClick={goToNext} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Quick-Toggle Bar */}
      <div className="px-3 py-2 border-b bg-gray-50 flex items-center justify-between">
        <button
          onClick={() => {
            if (quickToggleMode) {
              // Cancel
              setQuickToggleMode(false);
              setQuickToggleDates(new Set());
              setQuickToggleRemoves(new Set());
            } else {
              setQuickToggleMode(true);
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            quickToggleMode
              ? 'bg-rose-500 text-white'
              : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
          }`}
        >
          <Droplets className="h-3.5 w-3.5" />
          {quickToggleMode
            ? (de ? 'Abbrechen' : 'Cancel')
            : (de ? 'Periode eintragen' : 'Log period')}
        </button>

        {quickToggleMode && (
          <div className="flex items-center gap-2">
            {/* Flow selector */}
            <div className="flex gap-0.5">
              {FLOW_OPTIONS.map(({ key, emoji }) => (
                <button
                  key={key}
                  onClick={() => setQuickToggleFlow(key)}
                  className={`px-1.5 py-1 rounded text-[10px] transition-all ${
                    quickToggleFlow === key ? 'bg-rose-200 ring-1 ring-rose-400' : 'bg-white hover:bg-gray-100'
                  }`}
                  title={key}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Save button */}
            {hasQuickChanges && (
              <button
                onClick={handleQuickToggleSave}
                disabled={addLogBatch.isPending}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-all"
              >
                {addLogBatch.isPending
                  ? '...'
                  : `${de ? 'Speichern' : 'Save'} (${quickToggleDates.size + quickToggleRemoves.size})`}
              </button>
            )}
          </div>
        )}
      </div>

      {quickToggleMode && (
        <div className="px-3 py-1.5 bg-rose-50 border-b">
          <p className="text-[10px] text-rose-600">
            {de
              ? 'Tippe auf Tage, um Periode an/aus zu schalten. Waehle die Staerke rechts.'
              : 'Tap days to toggle period on/off. Select flow intensity on the right.'}
          </p>
        </div>
      )}

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {weekdays.map(wd => (
          <div key={wd} className="text-center text-[10px] font-medium text-gray-400 py-1.5">{wd}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const hasLog = !!day.log;
          const phase = day.log?.phase;
          const predicted = !hasLog ? day.predictedPhase : undefined;

          // Quick-toggle visual overrides
          const isQuickAdded = quickToggleDates.has(day.date);
          const isQuickRemoved = quickToggleRemoves.has(day.date);

          let bgClass = '';
          if (isQuickAdded) {
            bgClass = 'bg-red-300 ring-2 ring-red-500 ring-inset';
          } else if (isQuickRemoved) {
            bgClass = 'bg-gray-100 line-through';
          } else if (hasLog && phase) {
            bgClass = PHASE_BG[phase];
          } else if (predicted) {
            bgClass = PHASE_BG_PREDICTED[predicted];
          }

          return (
            <button
              key={day.date}
              onClick={() => handleDayClick(day)}
              className={`relative flex flex-col items-center justify-center py-2 min-h-[44px] transition-all ${
                day.isCurrentMonth ? '' : 'opacity-30'
              } ${bgClass} ${
                day.isToday ? 'ring-2 ring-rose-500 ring-inset rounded-sm z-10' : ''
              } ${day.isFertile && !hasLog && !isQuickAdded ? 'ring-1 ring-pink-300 ring-inset' : ''} hover:brightness-95`}
            >
              <span className={`text-xs font-medium ${
                isQuickAdded ? 'text-white' :
                isQuickRemoved ? 'text-gray-400 line-through' :
                hasLog ? 'text-gray-800' : predicted ? 'text-gray-500' : 'text-gray-600'
              }`}>
                {day.dayNum}
              </span>
              {hasLog && !isQuickRemoved && phase && (
                <span className="text-[8px] leading-none mt-0.5">
                  {getCyclePhaseEmoji(phase)}
                </span>
              )}
              {isQuickAdded && (
                <span className="text-[8px] leading-none mt-0.5">{'\u{1FA78}'}</span>
              )}
              {day.isFertile && !hasLog && !isQuickAdded && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-pink-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t bg-gray-50 flex flex-wrap gap-2">
        {(['menstruation', 'follicular', 'ovulation', 'luteal'] as CyclePhase[]).map(p => (
          <div key={p} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-sm ${PHASE_BAR_COLORS[p]}`} />
            <span className="text-[9px] text-gray-500">{t.cycle?.[p as keyof typeof t.cycle] ?? p}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded-sm bg-pink-200 border border-dashed border-pink-400" />
          <span className="text-[9px] text-gray-500">{de ? 'Vorhersage' : 'Predicted'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
          <span className="text-[9px] text-gray-500">{de ? 'Fruchtbar' : 'Fertile'}</span>
        </div>
      </div>

      {/* Day Detail Bottom Sheet */}
      {selectedDay && selectedDay.log && (
        <DayDetailSheet
          day={selectedDay}
          log={selectedDay.log}
          de={de}
          t={t}
          prediction={prediction}
          onClose={() => setSelectedDay(null)}
          onEdit={() => {
            setSelectedDay(null);
            onDayClick?.(selectedDay.date);
          }}
          onDelete={() => {
            deleteCycle.mutate(selectedDay.log!.id);
            setSelectedDay(null);
          }}
        />
      )}
    </div>
  );
}

// ── Day Detail Bottom Sheet ────────────────────────────────────────────

interface DayDetailSheetProps {
  day: CalendarDay;
  log: MenstrualCycleLog;
  de: boolean;
  t: ReturnType<typeof useTranslation>['t'];
  prediction: ReturnType<typeof useCyclePrediction>;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function DayDetailSheet({ day, log, de, t, prediction, onClose, onEdit, onDelete }: DayDetailSheetProps) {
  const locale = de ? 'de-DE' : 'en-US';
  // Show logged phase, or auto-calculated phase from prediction
  const displayPhase = log.phase ?? prediction.currentPhase;
  const phaseLabel = displayPhase ? (t.cycle?.[displayPhase as keyof typeof t.cycle] ?? displayPhase) : (de ? 'Kein Phase' : 'No phase');
  const symptoms = log.symptoms as string[] ?? [];
  const isPeriod = log.phase === 'menstruation' || log.phase === 'spotting';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative bg-white rounded-t-2xl w-full max-w-lg shadow-xl p-4 pb-6 animate-in slide-in-from-bottom"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {displayPhase && getCyclePhaseEmoji(displayPhase)} {phaseLabel}
              {!log.phase && displayPhase && (
                <span className="ml-1.5 text-[10px] font-normal text-gray-400">
                  ({de ? 'berechnet' : 'calculated'})
                </span>
              )}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(day.date).toLocaleDateString(locale, {
                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Details */}
        <div className="space-y-2 text-xs">
          {/* Flow */}
          {log.flow_intensity && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-20">{de ? 'Staerke' : 'Flow'}:</span>
              <span className="font-medium text-gray-700">
                {t.cycle?.[`flow${log.flow_intensity.charAt(0).toUpperCase()}${log.flow_intensity.slice(1)}` as keyof typeof t.cycle] ?? log.flow_intensity}
              </span>
            </div>
          )}

          {/* Mood & Energy */}
          {log.mood && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-20">{de ? 'Stimmung' : 'Mood'}:</span>
              <span className="text-base">{MOOD_EMOJIS[log.mood - 1]}</span>
              <span className="text-gray-400">({log.mood}/5)</span>
            </div>
          )}
          {log.energy_level && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-20">{de ? 'Energie' : 'Energy'}:</span>
              <span className="text-base">{ENERGY_EMOJIS[log.energy_level - 1]}</span>
              <span className="text-gray-400">({log.energy_level}/5)</span>
            </div>
          )}

          {/* Cervical Mucus */}
          {log.cervical_mucus && log.cervical_mucus !== 'none' && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-20">{de ? 'Schleim' : 'Mucus'}:</span>
              <span className="font-medium text-gray-700">
                {t.cycle?.[`mucus${log.cervical_mucus.charAt(0).toUpperCase()}${log.cervical_mucus.slice(1)}` as keyof typeof t.cycle] ?? log.cervical_mucus}
              </span>
            </div>
          )}

          {/* Basal Temp */}
          {log.basal_temp && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-20">{de ? 'Temperatur' : 'Temp'}:</span>
              <span className="font-medium text-gray-700">{log.basal_temp} °C</span>
            </div>
          )}

          {/* Symptoms */}
          {symptoms.length > 0 && (
            <div>
              <span className="text-gray-500">{de ? 'Symptome' : 'Symptoms'}:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {symptoms.map(s => (
                  <span key={s} className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[10px]">
                    {t.cycle?.[s as keyof typeof t.cycle] ?? s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {log.notes && (
            <div>
              <span className="text-gray-500">{de ? 'Notizen' : 'Notes'}:</span>
              <p className="text-gray-700 mt-0.5">{log.notes}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4 pt-3 border-t">
          <button
            onClick={onEdit}
            className="flex-1 py-2 text-xs font-medium bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            {de ? 'Bearbeiten' : 'Edit'}
          </button>
          {isPeriod && (
            <button
              onClick={onDelete}
              className="py-2 px-4 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {de ? 'Periode entfernen' : 'Remove period'}
            </button>
          )}
          <button
            onClick={onDelete}
            className="py-2 px-4 text-xs font-medium bg-gray-100 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
          >
            {de ? 'Loeschen' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
