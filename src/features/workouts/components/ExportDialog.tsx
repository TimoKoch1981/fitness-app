/**
 * ExportDialog — Matrix-style export menu with format, metric, and exercise selection.
 */
import { useState, useMemo, useCallback } from 'react';
import { X, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useBodyMeasurements } from '../../body/hooks/useBodyMeasurements';
import { useBloodPressureLogs } from '../../medical/hooks/useBloodPressure';
import { useBloodWorkLogs } from '../../medical/hooks/useBloodWork';
import { useSleepLogs } from '../../sleep/hooks/useSleep';
import { exportToExcel } from '../utils/exportExcel';
import { exportToPDF } from '../utils/exportPDF';
import type { TimeRange } from './progress/TimeRangeSelector';

type ExportFormat = 'excel' | 'pdf';

const METRICS = [
  { key: 'volume', labelDE: 'Trainingsvolumen', labelEN: 'Training Volume' },
  { key: 'e1rm', labelDE: 'e1RM Progression', labelEN: 'e1RM Progression' },
  { key: 'prs', labelDE: 'Bestleistungen (PRs)', labelEN: 'Personal Records' },
  { key: 'frequency', labelDE: 'Trainingsh\u00e4ufigkeit', labelEN: 'Training Frequency' },
  { key: 'bodycomp', labelDE: 'Gewicht & K\u00f6rperfett', labelEN: 'Weight & Body Fat' },
  { key: 'bp', labelDE: 'Blutdruck', labelEN: 'Blood Pressure' },
  { key: 'sleep', labelDE: 'Schlaf', labelEN: 'Sleep' },
  { key: 'bloodwork', labelDE: 'Blutwerte', labelEN: 'Blood Work' },
] as const;

interface ExportDialogProps {
  timeRange: TimeRange;
  workouts: any[];
  onClose: () => void;
}

export function ExportDialog({ timeRange, workouts, onClose }: ExportDialogProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const [format, setFormat] = useState<ExportFormat>('excel');
  const [exporting, setExporting] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(
    new Set(['volume', 'e1rm', 'prs', 'frequency'])
  );
  const [allExercises, setAllExercises] = useState(true);
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());

  // Load auxiliary data
  const { data: bodyData } = useBodyMeasurements(200);
  const { data: bpData } = useBloodPressureLogs(200);
  const { data: bloodWork } = useBloodWorkLogs(50);
  const { data: sleepData } = useSleepLogs(200);

  const exerciseNames = useMemo(() => {
    if (!workouts?.length) return [];
    const names = new Set<string>();
    for (const w of workouts) {
      const exercises = w.session_exercises || w.exercises || [];
      for (const ex of exercises) {
        if (ex.name && ex.exercise_type !== 'cardio') names.add(ex.name);
      }
    }
    return Array.from(names).sort();
  }, [workouts]);

  const toggleMetric = (key: string) => {
    const next = new Set(selectedMetrics);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelectedMetrics(next);
  };

  const toggleExercise = (name: string) => {
    const next = new Set(selectedExercises);
    if (next.has(name)) next.delete(name); else next.add(name);
    setSelectedExercises(next);
  };

  const handleExport = useCallback(async () => {
    const exportData = {
      timeRange,
      workouts: workouts?.filter(w => w.date >= timeRange.from && w.date <= timeRange.to) || [],
      metrics: Array.from(selectedMetrics),
      exercises: allExercises ? exerciseNames : Array.from(selectedExercises),
      bodyData: selectedMetrics.has('bodycomp') ? bodyData?.filter(m => m.date >= timeRange.from && m.date <= timeRange.to) : undefined,
      bpData: selectedMetrics.has('bp') ? bpData?.filter(l => l.date >= timeRange.from && l.date <= timeRange.to) : undefined,
      bloodWork: selectedMetrics.has('bloodwork') ? bloodWork?.filter(l => l.date >= timeRange.from && l.date <= timeRange.to) : undefined,
      sleepData: selectedMetrics.has('sleep') ? sleepData?.filter(l => l.date >= timeRange.from && l.date <= timeRange.to) : undefined,
    };

    if (format === 'excel') {
      exportToExcel(exportData, isDE);
      onClose();
    } else {
      // PDF needs async (html2canvas)
      setExporting(true);
      try {
        await exportToPDF(exportData, isDE);
      } finally {
        setExporting(false);
      }
      onClose();
    }
  }, [format, selectedMetrics, allExercises, selectedExercises, timeRange, workouts, bodyData, bpData, bloodWork, sleepData, exerciseNames, isDE, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            <Download className="h-4 w-4 inline mr-1" />
            {isDE ? 'Daten exportieren' : 'Export Data'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Time Range Info */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4">
          {isDE ? 'Zeitraum' : 'Period'}: {timeRange.from} &ndash; {timeRange.to}
        </div>

        {/* Format Selection */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Format</p>
          <div className="flex gap-2">
            <button
              onClick={() => setFormat('excel')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm rounded-lg border transition-colors ${
                format === 'excel' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </button>
            <button
              onClick={() => setFormat('pdf')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm rounded-lg border transition-colors ${
                format === 'pdf' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>

        {/* Metric Selection */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">{isDE ? 'Was exportieren' : 'What to export'}</p>
          <div className="space-y-1.5">
            {METRICS.map(m => (
              <label key={m.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedMetrics.has(m.key)}
                  onChange={() => toggleMetric(m.key)}
                  className="rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">{isDE ? m.labelDE : m.labelEN}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Exercise Selection (for volume/e1rm) */}
        {(selectedMetrics.has('volume') || selectedMetrics.has('e1rm')) && exerciseNames.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
              {isDE ? '\u00dcbungen' : 'Exercises'}
            </p>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={allExercises}
                onChange={() => setAllExercises(!allExercises)}
                className="rounded border-gray-300 text-teal-500 focus:ring-teal-500"
              />
              <span className="text-sm font-medium text-gray-700">{isDE ? 'Alle \u00dcbungen' : 'All exercises'}</span>
            </label>
            {!allExercises && (
              <div className="max-h-32 overflow-y-auto space-y-1 pl-6">
                {exerciseNames.map(name => (
                  <label key={name} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedExercises.has(name)}
                      onChange={() => toggleExercise(name)}
                      className="rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                    />
                    <span className="text-xs text-gray-600">{name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={selectedMetrics.size === 0 || exporting}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? (isDE ? 'Wird erstellt...' : 'Generating...') : (isDE ? 'Exportieren' : 'Export')}
        </button>
      </div>
    </div>
  );
}
