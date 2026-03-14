/**
 * NutritionExportDialog — Export nutrition data as Excel or PDF.
 * Includes energy balance metrics (expenditure, balance).
 */

import { useState, useCallback } from 'react';
import { X, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { exportNutritionExcel } from '../utils/exportNutritionExcel';
import { exportNutritionPDF } from '../utils/exportNutritionPDF';
import type { MealHistoryData } from '../hooks/useMealHistory';
import type { NutritionBalanceData } from '../hooks/useNutritionBalance';
import type { ScoringSystem, ScoringResult } from '../../nutrition/utils/alternativeScoring';

type ExportFormat = 'excel' | 'pdf';

const METRICS = [
  { key: 'calories', labelDE: 'Kalorien (kcal)', labelEN: 'Calories (kcal)' },
  { key: 'protein', labelDE: 'Protein (g)', labelEN: 'Protein (g)' },
  { key: 'carbs', labelDE: 'Kohlenhydrate (g)', labelEN: 'Carbs (g)' },
  { key: 'fat', labelDE: 'Fett (g)', labelEN: 'Fat (g)' },
  { key: 'mealCount', labelDE: 'Mahlzeiten pro Tag', labelEN: 'Meals per Day' },
  { key: 'expenditure', labelDE: 'Verbrauch (kcal)', labelEN: 'Expenditure (kcal)' },
  { key: 'balance', labelDE: 'Bilanz (kcal)', labelEN: 'Balance (kcal)' },
] as const;

const SCORING_METRICS = [
  { key: 'wwSmartPoints', labelDE: 'WW SmartPoints', labelEN: 'WW SmartPoints' },
  { key: 'wwClassic', labelDE: 'WW Klassisch (Punkte)', labelEN: 'WW Classic (Points)' },
  { key: 'noom', labelDE: 'Noom Farbe (Kaloriendichte)', labelEN: 'Noom Color (Cal. Density)' },
  { key: 'nutriScore', labelDE: 'Nutri-Score (A-E)', labelEN: 'Nutri-Score (A-E)' },
] as const;

interface NutritionExportDialogProps {
  timeRange: { from: string; to: string };
  history: MealHistoryData | null;
  balanceData?: NutritionBalanceData | null;
  activeScoingSystems?: ScoringSystem[];
  dayScores?: Map<string, ScoringResult>;
  avgScores?: ScoringResult | null;
  onClose: () => void;
}

export function NutritionExportDialog({ timeRange, history, balanceData, activeScoingSystems, dayScores, avgScores, onClose }: NutritionExportDialogProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const [format, setFormat] = useState<ExportFormat>('excel');
  const [exporting, setExporting] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(() => {
    const base = new Set(['calories', 'protein', 'carbs', 'fat', 'mealCount', 'expenditure', 'balance']);
    // Auto-include active scoring systems
    if (activeScoingSystems) {
      for (const s of activeScoingSystems) base.add(s);
    }
    return base;
  });

  const toggleMetric = (key: string) => {
    const next = new Set(selectedMetrics);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelectedMetrics(next);
  };

  // Only show expenditure/balance options if profile data is available
  const availableMetrics = METRICS.filter(m => {
    if ((m.key === 'expenditure' || m.key === 'balance') && !balanceData?.hasProfile) return false;
    return true;
  });

  // Only show scoring metrics that the user has activated
  const availableScoringMetrics = SCORING_METRICS.filter(m =>
    activeScoingSystems?.includes(m.key as ScoringSystem)
  );

  const handleExport = useCallback(async () => {
    if (!history || selectedMetrics.size === 0) return;

    const exportData = {
      timeRange,
      history,
      balanceData: balanceData ?? undefined,
      metrics: Array.from(selectedMetrics),
      dayScores,
      avgScores: avgScores ?? undefined,
    };

    if (format === 'excel') {
      exportNutritionExcel(exportData, isDE);
      onClose();
    } else {
      setExporting(true);
      try {
        exportNutritionPDF(exportData, isDE);
      } finally {
        setExporting(false);
      }
      onClose();
    }
  }, [format, selectedMetrics, timeRange, history, balanceData, dayScores, avgScores, isDE, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            <Download className="h-4 w-4 inline mr-1" />
            {isDE ? 'Ernährung exportieren' : 'Export Nutrition'}
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
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
            {isDE ? 'Was exportieren' : 'What to export'}
          </p>
          <div className="space-y-1.5">
            {availableMetrics.map(m => (
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
            {availableScoringMetrics.length > 0 && (
              <>
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                    {isDE ? 'Alternative Bewertungen' : 'Alternative Scores'}
                  </p>
                </div>
                {availableScoringMetrics.map(m => (
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
              </>
            )}
          </div>
        </div>

        {/* Summary info */}
        {history && history.daysWithData > 0 && (
          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 mb-4">
            {history.daysWithData} {isDE ? 'Tage mit Daten' : 'days with data'} •{' '}
            {history.days.reduce((sum, d) => sum + d.mealCount, 0)} {isDE ? 'Mahlzeiten' : 'meals'}
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={selectedMetrics.size === 0 || exporting || !history || history.daysWithData === 0}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {exporting ? (isDE ? 'Wird erstellt...' : 'Generating...') : (isDE ? 'Exportieren' : 'Export')}
        </button>
      </div>
    </div>
  );
}
