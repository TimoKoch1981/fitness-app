/**
 * GDPR Art. 20 — Data Export Dialog
 *
 * Shows export scope, progress, and triggers JSON download.
 */

import { useState } from 'react';
import { X, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useDataExport } from '../hooks/useDataExport';

interface DataExportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DataExportDialog({ open, onClose }: DataExportDialogProps) {
  const { t } = useTranslation();
  const { exportData, isExporting, progress } = useDataExport();
  const [result, setResult] = useState<{ success: boolean; filename?: string; error?: string } | null>(null);

  if (!open) return null;

  const handleExport = async () => {
    setResult(null);
    const res = await exportData();
    setResult(res);
  };

  const handleClose = () => {
    if (!isExporting) {
      setResult(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{t.dataExport.title}</h3>
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Description */}
          <p className="text-sm text-gray-600">{t.dataExport.description}</p>

          {/* Data categories */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 mb-2">{t.dataExport.includedData}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                t.dataExport.catProfile,
                t.dataExport.catMeals,
                t.dataExport.catWorkouts,
                t.dataExport.catBody,
                t.dataExport.catBloodPressure,
                t.dataExport.catSubstances,
                t.dataExport.catBloodWork,
                t.dataExport.catGoals,
                t.dataExport.catReminders,
                t.dataExport.catCheckins,
                t.dataExport.catProducts,
                t.dataExport.catPlans,
              ].map((cat) => (
                <span key={cat} className="text-[10px] text-gray-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-teal-400" />
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Progress */}
          {isExporting && progress && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-teal-500 animate-spin" />
                <span className="text-sm text-gray-600">
                  {t.dataExport.exporting} ({progress.current}/{progress.total})
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-teal-500 rounded-full h-1.5 transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400">{progress.currentTable}</p>
            </div>
          )}

          {/* Result */}
          {result && !isExporting && (
            <div className={`flex items-start gap-2 p-3 rounded-lg ${
              result.success ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {result.success ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">{t.dataExport.success}</p>
                    <p className="text-xs text-green-600 mt-0.5">{result.filename}</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">{t.dataExport.error}</p>
                    <p className="text-xs text-red-600 mt-0.5">{result.error}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Legal notice */}
          <p className="text-[9px] text-gray-300">
            {t.dataExport.legalNotice}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            {t.common.cancel}
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t.dataExport.exportButton}
          </button>
        </div>
      </div>
    </div>
  );
}
