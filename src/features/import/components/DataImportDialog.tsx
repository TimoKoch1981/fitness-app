/**
 * DataImportDialog — Multi-step import dialog for CSV, email text, and scale exports.
 */

import { useState, useRef } from 'react';
import { X, FileSpreadsheet, MessageSquare, Loader2, Check, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { parseCSV, autoDetectColumns, detectDataType, mapToImportedRows, type ParsedCsv } from '../lib/csvParser';
import { detectScaleFormat } from '../lib/scaleFormats';
import { extractHealthDataFromText } from '../lib/emailExtractor';
import type { ImportStep, ImportMode, ImportedRow, ImportDataType, CsvColumnMapping } from '../lib/importTypes';
import { useAddBodyMeasurement } from '../../body/hooks/useBodyMeasurements';
import { useAddMeal } from '../../meals/hooks/useMeals';
import { useAddBloodPressure } from '../../medical/hooks/useBloodPressure';
import { isUsingProxy } from '../../../lib/ai/provider';
import { ColumnMappingStep } from './ColumnMappingStep';

interface DataImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function DataImportDialog({ open, onClose }: DataImportDialogProps) {
  const { t, language } = useTranslation();
  const [step, setStep] = useState<ImportStep>('mode_select');
  const [mode, setMode] = useState<ImportMode>('csv');
  const [rows, setRows] = useState<ImportedRow[]>([]);
  const [csvData, setCsvData] = useState<ParsedCsv | null>(null);
  const [mappings, setMappings] = useState<CsvColumnMapping[]>([]);
  const [detectedDataType, setDetectedDataType] = useState<ImportDataType>('body');
  const [scaleFormat, setScaleFormat] = useState<string | null>(null);
  const [emailText, setEmailText] = useState('');
  const [error, setError] = useState('');
  const [savedCount, setSavedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addBody = useAddBodyMeasurement();
  const addMeal = useAddMeal();
  const addBP = useAddBloodPressure();

  const isDE = language === 'de';

  const reset = () => {
    setStep('mode_select');
    setMode('csv');
    setRows([]);
    setCsvData(null);
    setMappings([]);
    setDetectedDataType('body');
    setScaleFormat(null);
    setEmailText('');
    setError('');
    setSavedCount(0);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!open) return null;

  // ── Mode Select ────────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text) return;

      const parsed = parseCSV(text);
      setCsvData(parsed);

      // Try scale format detection first
      const scale = detectScaleFormat(parsed.headers);
      if (scale) {
        // Known scale format — skip mapping, go straight to review
        setScaleFormat(scale.name);
        const scaleMappings = scale.getMappings(parsed.headers);
        setMappings(scaleMappings);
        const dataType = detectDataType(scaleMappings);
        setDetectedDataType(dataType);
        const imported = mapToImportedRows(parsed.headers, parsed.rows, scaleMappings, dataType);
        setRows(imported);
        setStep('review');
      } else {
        // Generic CSV — auto-detect columns, let user confirm mapping
        const detectedMappings = autoDetectColumns(parsed.headers);
        setMappings(detectedMappings);
        const dataType = detectDataType(detectedMappings);
        setDetectedDataType(dataType);
        setStep('mapping');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleEmailExtract = async () => {
    if (!emailText.trim()) return;
    setStep('analyzing');

    try {
      // In proxy mode, the API key is on the server — no client-side key needed.
      // In direct mode, we still need the key from env.
      const apiKey = isUsingProxy() ? '' : ((import.meta.env.VITE_OPENAI_API_KEY as string) || '');
      if (!isUsingProxy() && !apiKey) {
        setError(isDE ? 'OpenAI API-Key nicht konfiguriert' : 'OpenAI API key not configured');
        setStep('error');
        return;
      }
      const extracted = await extractHealthDataFromText(emailText, apiKey, language as 'de' | 'en');
      if (extracted.length === 0) {
        setError(isDE ? 'Keine Gesundheitsdaten im Text erkannt' : 'No health data found in text');
        setStep('error');
        return;
      }
      setRows(extracted);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('error');
    }
  };

  // ── Save ───────────────────────────────────────────────────────────

  const handleSave = async () => {
    setStep('saving');
    let count = 0;

    for (const row of rows.filter(r => r.selected)) {
      try {
        if (row.type === 'body') {
          await addBody.mutateAsync({
            date: row.date,
            weight_kg: row.values.weight_kg as number | undefined,
            body_fat_pct: row.values.body_fat_pct as number | undefined,
            muscle_mass_kg: row.values.muscle_mass_kg as number | undefined,
            water_pct: row.values.water_pct as number | undefined,
            waist_cm: row.values.waist_cm as number | undefined,
            chest_cm: row.values.chest_cm as number | undefined,
            arm_cm: row.values.arm_cm as number | undefined,
            leg_cm: row.values.leg_cm as number | undefined,
            source: scaleFormat ? 'scale' as const : 'import' as const,
          });
          count++;
        } else if (row.type === 'meal') {
          await addMeal.mutateAsync({
            date: row.date,
            name: (row.values.name as string) ?? 'Import',
            type: 'snack' as const,
            calories: (row.values.calories as number) ?? 0,
            protein: (row.values.protein as number) ?? 0,
            carbs: (row.values.carbs as number) ?? 0,
            fat: (row.values.fat as number) ?? 0,
            source: 'import' as const,
          });
          count++;
        } else if (row.type === 'blood_pressure') {
          // BP table expects separate date + time columns
          const bpDate = row.date;
          const bpTime = (row.values.time as string) ?? new Date().toTimeString().slice(0, 5);
          await addBP.mutateAsync({
            date: bpDate,
            time: bpTime,
            systolic: (row.values.systolic as number) ?? 0,
            diastolic: (row.values.diastolic as number) ?? 0,
            pulse: row.values.pulse as number | undefined,
            notes: 'Import',
          });
          count++;
        }
      } catch {
        // Skip failed rows, continue with rest
      }
    }

    setSavedCount(count);
    setStep('done');
  };

  const toggleRow = (id: string) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, selected: !r.selected } : r));
  };

  const selectedCount = rows.filter(r => r.selected).length;

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-900">
            {isDE ? 'Daten importieren' : 'Import Data'}
          </h2>
          <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Step: Mode Select */}
          {step === 'mode_select' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                {isDE ? 'Wie moechtest du Daten importieren?' : 'How would you like to import data?'}
              </p>
              <button
                onClick={() => { setMode('csv'); fileInputRef.current?.click(); }}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
              >
                <FileSpreadsheet className="h-6 w-6 text-teal-500" />
                <div>
                  <p className="font-medium text-gray-900">
                    {isDE ? 'CSV-Datei' : 'CSV File'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isDE ? 'Fitdays, Renpho, Withings oder andere CSV-Exporte' : 'Fitdays, Renpho, Withings or other CSV exports'}
                  </p>
                </div>
              </button>
              <button
                onClick={() => { setMode('email'); setStep('input'); }}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
              >
                <MessageSquare className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900">
                    {isDE ? 'Text / E-Mail' : 'Text / Email'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isDE ? 'Text einfuegen — KI erkennt Gesundheitsdaten' : 'Paste text — AI extracts health data'}
                  </p>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          )}

          {/* Step: Email Input */}
          {step === 'input' && mode === 'email' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                {isDE ? 'Fuege den Text ein, aus dem Gesundheitsdaten extrahiert werden sollen:' : 'Paste the text to extract health data from:'}
              </p>
              <textarea
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                placeholder={isDE ? 'E-Mail-Text, Laborbericht, Notizen...' : 'Email text, lab report, notes...'}
                className="w-full h-40 p-3 border rounded-xl text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <button
                onClick={handleEmailExtract}
                disabled={!emailText.trim()}
                className="w-full py-3 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isDE ? 'Analysieren' : 'Analyze'}
              </button>
              <button
                onClick={() => { setStep('mode_select'); setEmailText(''); }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                {t.common.back}
              </button>
            </div>
          )}

          {/* Step: Analyzing */}
          {step === 'analyzing' && (
            <div className="text-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-teal-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600">{isDE ? 'Daten werden analysiert...' : 'Analyzing data...'}</p>
            </div>
          )}

          {/* Step: Column Mapping (generic CSV only) */}
          {step === 'mapping' && csvData && (
            <ColumnMappingStep
              mappings={mappings}
              dataType={detectedDataType}
              sampleRow={csvData.rows[0]}
              headers={csvData.headers}
              isDE={isDE}
              onConfirm={(confirmedMappings, confirmedType) => {
                setMappings(confirmedMappings);
                setDetectedDataType(confirmedType);
                const imported = mapToImportedRows(
                  csvData.headers, csvData.rows, confirmedMappings, confirmedType
                );
                setRows(imported);
                setStep('review');
              }}
              onBack={reset}
            />
          )}

          {/* Step: Review */}
          {step === 'review' && (
            <div className="space-y-3">
              {scaleFormat && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 text-xs font-medium rounded-full">
                  <Check className="h-3.5 w-3.5" />
                  {scaleFormat} {isDE ? 'erkannt' : 'detected'}
                </div>
              )}
              <p className="text-sm text-gray-600">
                {selectedCount} {isDE ? 'Eintraege ausgewaehlt' : 'entries selected'}
              </p>

              {/* Rows */}
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 border rounded-xl">
                {rows.map(row => (
                  <label key={row.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      onChange={() => toggleRow(row.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-teal-600"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">{row.date}</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm">
                        {Object.entries(row.values).map(([key, val]) => {
                          if (val === undefined || val === '') return null;
                          return (
                            <span key={key} className="text-gray-700">
                              <span className="text-gray-400 text-xs">{key}:</span> {typeof val === 'number' ? val.toFixed(1) : val}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { reset(); }}
                  className="flex-1 py-2.5 text-sm text-gray-600 border rounded-xl hover:bg-gray-50"
                >
                  {t.common.back}
                </button>
                <button
                  onClick={handleSave}
                  disabled={selectedCount === 0}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-teal-500 rounded-xl hover:bg-teal-600 disabled:opacity-40 transition-colors"
                >
                  {selectedCount} {isDE ? 'speichern' : 'save'}
                </button>
              </div>
            </div>
          )}

          {/* Step: Saving */}
          {step === 'saving' && (
            <div className="text-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-teal-500 mx-auto mb-3" />
              <p className="text-sm text-gray-600">{isDE ? 'Wird gespeichert...' : 'Saving...'}</p>
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="text-center py-12">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-medium text-gray-900">
                {savedCount} {isDE ? 'Eintraege importiert' : 'entries imported'}
              </p>
              <button
                onClick={handleClose}
                className="mt-4 px-6 py-2 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-600"
              >
                {t.common.close}
              </button>
            </div>
          )}

          {/* Step: Error */}
          {step === 'error' && (
            <div className="text-center py-12">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <p className="font-medium text-gray-900">{t.common.error}</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
              <button
                onClick={reset}
                className="mt-4 px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200"
              >
                {isDE ? 'Nochmal versuchen' : 'Try again'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
