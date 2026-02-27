/**
 * ScreenshotImport — Camera/upload UI for smart scale screenshots.
 *
 * Flow:
 * 1. User takes a photo or selects from gallery
 * 2. Image preview is shown
 * 3. AI analyzes the image via Vision API
 * 4. Extracted values are shown for review
 * 5. User confirms → values saved as body measurement (source: 'scale')
 *
 * Supports: Fitdays, Renpho, Withings, and other smart scale app screenshots.
 */

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Loader2, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAddBodyMeasurement } from '../hooks/useBodyMeasurements';
import { analyzeScaleScreenshot, compressImage } from '../../../lib/ai/vision';
import type { ScaleAnalysisResult } from '../../../lib/ai/vision';
import { today } from '../../../lib/utils';

interface ScreenshotImportProps {
  open: boolean;
  onClose: () => void;
}

type ImportStep = 'select' | 'analyzing' | 'review' | 'error';

export function ScreenshotImport({ open, onClose }: ScreenshotImportProps) {
  const { t, language } = useTranslation();
  const addMeasurement = useAddBodyMeasurement();

  const [step, setStep] = useState<ImportStep>('select');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<ScaleAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Editable values for review step
  const [editWeight, setEditWeight] = useState('');
  const [editBodyFat, setEditBodyFat] = useState('');
  const [editMuscleMass, setEditMuscleMass] = useState('');
  const [editWater, setEditWater] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('select');
    setImagePreview(null);
    setResult(null);
    setErrorMsg('');
    setSaving(false);
    setEditWeight('');
    setEditBodyFat('');
    setEditMuscleMass('');
    setEditWater('');
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const processImage = useCallback(async (file: File) => {
    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setStep('analyzing');

    try {
      const { base64, mimeType } = await compressImage(file);
      const analysisResult = await analyzeScaleScreenshot(
        base64,
        mimeType,
        language as 'de' | 'en',
      );

      setResult(analysisResult);

      if (analysisResult.confidence < 0.3) {
        setErrorMsg(
          analysisResult.notes ??
          (language === 'de'
            ? 'Konnte keine Körperwerte erkennen. Ist das ein Waagen-Screenshot?'
            : 'Could not detect body metrics. Is this a scale screenshot?'),
        );
        setStep('error');
        return;
      }

      // Pre-fill editable values
      setEditWeight(analysisResult.weight_kg?.toString() ?? '');
      setEditBodyFat(analysisResult.body_fat_pct?.toString() ?? '');
      setEditMuscleMass(analysisResult.muscle_mass_kg?.toString() ?? '');
      setEditWater(analysisResult.water_pct?.toString() ?? '');
      setStep('review');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMsg(msg);
      setStep('error');
    }
  }, [language]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  }, [processImage]);

  const handleSave = useCallback(async () => {
    const weight = editWeight ? parseFloat(editWeight) : undefined;
    const bodyFat = editBodyFat ? parseFloat(editBodyFat) : undefined;
    const muscleMass = editMuscleMass ? parseFloat(editMuscleMass) : undefined;
    const water = editWater ? parseFloat(editWater) : undefined;

    if (!weight && !bodyFat && !muscleMass) {
      setErrorMsg(
        language === 'de'
          ? 'Mindestens ein Wert muss vorhanden sein.'
          : 'At least one value is required.',
      );
      return;
    }

    setSaving(true);
    try {
      await addMeasurement.mutateAsync({
        date: today(),
        weight_kg: weight,
        body_fat_pct: bodyFat,
        muscle_mass_kg: muscleMass,
        water_pct: water,
        source: 'scale',
      });
      handleClose();
    } catch {
      setErrorMsg(
        language === 'de'
          ? 'Speichern fehlgeschlagen. Bitte versuche es erneut.'
          : 'Save failed. Please try again.',
      );
      setSaving(false);
    }
  }, [editWeight, editBodyFat, editMuscleMass, editWater, language, addMeasurement, handleClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl flex items-center justify-between px-4 py-3 border-b z-10">
          <h2 className="text-lg font-semibold text-gray-900">{t.screenshot.title}</h2>
          <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Step 1: Select Image */}
          {step === 'select' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                {t.screenshot.description}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* Camera Button */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-teal-400 hover:bg-teal-50/50 transition-all"
                >
                  <Camera className="h-8 w-8 text-teal-500" />
                  <span className="text-sm font-medium text-gray-700">{t.screenshot.camera}</span>
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* Gallery Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-teal-400 hover:bg-teal-50/50 transition-all"
                >
                  <Upload className="h-8 w-8 text-teal-500" />
                  <span className="text-sm font-medium text-gray-700">{t.screenshot.gallery}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <p className="text-[10px] text-gray-400 text-center">
                {t.screenshot.supportedApps}
              </p>
            </div>
          )}

          {/* Step 2: Analyzing */}
          {step === 'analyzing' && (
            <div className="space-y-4">
              {imagePreview && (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={imagePreview}
                    alt="Screenshot"
                    className="w-full max-h-48 object-contain bg-gray-50"
                  />
                </div>
              )}
              <div className="text-center py-6">
                <Loader2 className="h-8 w-8 text-teal-500 animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">{t.screenshot.analyzing}</p>
                <p className="text-xs text-gray-400 mt-1">{t.screenshot.analyzingHint}</p>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && result && (
            <div className="space-y-4">
              {/* Image Preview (small) */}
              {imagePreview && (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={imagePreview}
                    alt="Screenshot"
                    className="w-full max-h-32 object-contain bg-gray-50"
                  />
                </div>
              )}

              {/* Confidence Indicator */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                result.confidence >= 0.8
                  ? 'bg-green-50 text-green-700'
                  : result.confidence >= 0.5
                  ? 'bg-yellow-50 text-yellow-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {result.confidence >= 0.8 ? (
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                )}
                <span>
                  {t.screenshot.confidence}: {Math.round(result.confidence * 100)}%
                  {result.notes && ` — ${result.notes}`}
                </span>
              </div>

              {/* Editable Values */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t.body.weight} ({t.body.kg})
                  </label>
                  <input
                    type="number"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    placeholder="—"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                    min="30"
                    max="300"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t.body.bodyFat} ({t.body.percent})
                  </label>
                  <input
                    type="number"
                    value={editBodyFat}
                    onChange={(e) => setEditBodyFat(e.target.value)}
                    placeholder="—"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                    min="3"
                    max="60"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t.body.muscleMass} ({t.body.kg})
                  </label>
                  <input
                    type="number"
                    value={editMuscleMass}
                    onChange={(e) => setEditMuscleMass(e.target.value)}
                    placeholder="—"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                    min="10"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t.body.waterPct} ({t.body.percent})
                  </label>
                  <input
                    type="number"
                    value={editWater}
                    onChange={(e) => setEditWater(e.target.value)}
                    placeholder="—"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm"
                    min="30"
                    max="80"
                    step="0.1"
                  />
                </div>
              </div>

              {/* Error in review */}
              {errorMsg && (
                <p className="text-xs text-red-500 text-center">{errorMsg}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all text-sm flex items-center justify-center gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t.screenshot.retry}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || (!editWeight && !editBodyFat && !editMuscleMass)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-1"
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {t.screenshot.save}
                </button>
              </div>
            </div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <div className="space-y-4">
              {imagePreview && (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={imagePreview}
                    alt="Screenshot"
                    className="w-full max-h-32 object-contain bg-gray-50"
                  />
                </div>
              )}

              <div className="text-center py-4">
                <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">{t.screenshot.errorTitle}</p>
                <p className="text-xs text-gray-500">{errorMsg}</p>
              </div>

              <button
                onClick={reset}
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 transition-all text-sm flex items-center justify-center gap-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t.screenshot.retry}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
