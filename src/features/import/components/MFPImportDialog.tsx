/**
 * MyFitnessPal CSV Import Dialog.
 *
 * Specialised dialog for importing MFP food diary exports.
 * Features: file upload, preview table, progress, results summary.
 */

import { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAuth } from '../../../app/providers/AuthProvider';
import { parseMFPCSV } from '../utils/mfpParser';
import { useMFPImport } from '../hooks/useDataImport';
import type { MFPRow, ImportResult } from '../types';

interface MFPImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function MFPImportDialog({ open, onClose }: MFPImportDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { importMFPData, isImporting, progress } = useMFPImport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsedRows, setParsedRows] = useState<MFPRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  if (!open) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError('');
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const rows = parseMFPCSV(text);
        if (rows.length === 0) {
          setParseError(t.dataImport.invalidFormat);
          setParsedRows([]);
        } else {
          setParsedRows(rows);
        }
      } catch {
        setParseError(t.dataImport.invalidFormat);
        setParsedRows([]);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!user || parsedRows.length === 0) return;
    setResult(null);
    const res = await importMFPData(parsedRows, user.id);
    setResult(res);
  };

  const handleClose = () => {
    if (!isImporting) {
      setParsedRows([]);
      setFileName('');
      setParseError('');
      setResult(null);
      onClose();
    }
  };

  const previewRows = parsedRows.slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">{t.dataImport.title}</h3>
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* File Upload */}
          {!result && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="w-full flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-teal-400 hover:bg-teal-50/50 transition-colors disabled:opacity-50"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600">{t.dataImport.selectFile}</span>
                <span className="text-xs text-gray-400">{t.dataImport.mfpFormat}</span>
              </button>

              {fileName && (
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4 text-teal-500" />
                  {fileName}
                </div>
              )}
            </div>
          )}

          {/* Parse Error */}
          {parseError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{parseError}</span>
            </div>
          )}

          {/* Preview Table */}
          {previewRows.length > 0 && !result && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                {t.dataImport.preview} ({parsedRows.length})
              </p>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">{t.common.date}</th>
                      <th className="px-2 py-1.5 text-left font-medium text-gray-500">{t.dataImport.mapping}</th>
                      <th className="px-2 py-1.5 text-right font-medium text-gray-500">{t.meals.calories}</th>
                      <th className="px-2 py-1.5 text-right font-medium text-gray-500">{t.meals.protein}</th>
                      <th className="px-2 py-1.5 text-right font-medium text-gray-500">{t.meals.carbs}</th>
                      <th className="px-2 py-1.5 text-right font-medium text-gray-500">{t.meals.fat}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-2 py-1.5 text-gray-700">{row.Date}</td>
                        <td className="px-2 py-1.5 text-gray-700">{row.Meal}</td>
                        <td className="px-2 py-1.5 text-right text-gray-700">{row.Calories}</td>
                        <td className="px-2 py-1.5 text-right text-gray-700">{row.Protein}g</td>
                        <td className="px-2 py-1.5 text-right text-gray-700">{row.Carbs}g</td>
                        <td className="px-2 py-1.5 text-right text-gray-700">{row.Fat}g</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 5 && (
                <p className="text-[10px] text-gray-400 mt-1">
                  +{parsedRows.length - 5} ...
                </p>
              )}
            </div>
          )}

          {/* Progress */}
          {isImporting && progress && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-teal-500 animate-spin" />
                <span className="text-sm text-gray-600">
                  {t.dataImport.importing} ({progress.current}/{progress.total})
                </span>
              </div>
              <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-teal-500 rounded-full h-1.5 transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Results */}
          {result && !isImporting && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">{t.dataImport.importComplete}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-teal-50 rounded-lg">
                  <p className="text-lg font-bold text-teal-700">{result.imported}</p>
                  <p className="text-[10px] text-teal-500">{t.dataImport.imported}</p>
                </div>
                <div className="text-center p-2 bg-amber-50 rounded-lg">
                  <p className="text-lg font-bold text-amber-700">{result.skipped}</p>
                  <p className="text-[10px] text-amber-500">{t.dataImport.skipped}</p>
                </div>
                {result.errors > 0 && (
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <p className="text-lg font-bold text-red-700">{result.errors}</p>
                    <p className="text-[10px] text-red-500">{t.dataImport.errors}</p>
                  </div>
                )}
              </div>
              {result.skipped > 0 && (
                <div className="flex items-start gap-2 text-xs text-amber-600">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  {t.dataImport.duplicateSkipped}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t bg-gray-50 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            {t.common.close}
          </button>
          {!result && parsedRows.length > 0 && (
            <button
              onClick={handleImport}
              disabled={isImporting || !user}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {t.dataImport.startImport}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
