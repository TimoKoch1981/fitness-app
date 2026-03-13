/**
 * MealPhotoCapture — Photo-based meal analysis component.
 *
 * Step-based flow: idle → analyzing → result → error
 * Uses camera or gallery to capture food image, then sends to Vision API.
 *
 * Pattern based on ScreenshotImport.tsx (body/components).
 */

import { useState, useRef, useMemo } from 'react';
import { Camera, Image, Loader2, RefreshCw, Check, AlertCircle, X, Upload } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAnalyzeMealPhoto } from '../hooks/useAnalyzeMealPhoto';
import type { MealPhotoAnalysisResult } from '../../../lib/ai/mealVision';
import { OptimizedImage } from '../../../shared/components/OptimizedImage';

type CaptureStep = 'idle' | 'analyzing' | 'result' | 'error';

/** Detect mobile device (touch + small screen = likely has camera capture) */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    ('ontouchstart' in window && window.innerWidth < 1024);
}

interface MealPhotoCaptureProps {
  /** Called when user accepts the analysis result */
  onAccept: (result: MealPhotoAnalysisResult) => void;
  /** Called when user wants to close the photo capture */
  onClose: () => void;
}

export function MealPhotoCapture({ onAccept, onClose }: MealPhotoCaptureProps) {
  const { t, language } = useTranslation();
  const { analyze, result, error, reset } = useAnalyzeMealPhoto();

  const [step, setStep] = useState<CaptureStep>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const isMobile = useMemo(() => isMobileDevice(), []);
  const meals = t.meals as Record<string, string>;

  const handleFileSelect = async (file: File) => {
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStep('analyzing');

    const analysisResult = await analyze(file, language);

    if (analysisResult && analysisResult.confidence > 0) {
      setStep('result');
    } else {
      setStep('error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRetry = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setStep('idle');
    reset();
  };

  const handleAccept = () => {
    if (result) {
      onAccept(result);
    }
    // Clean up preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const confidenceColor = (conf: number) => {
    if (conf >= 0.8) return 'text-emerald-600';
    if (conf >= 0.5) return 'text-amber-500';
    return 'text-red-500';
  };

  const confidenceLabel = (conf: number) => {
    if (language === 'de') {
      if (conf >= 0.8) return 'Hoch';
      if (conf >= 0.5) return 'Mittel';
      return 'Niedrig';
    }
    if (conf >= 0.8) return 'High';
    if (conf >= 0.5) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          {meals.mealPhoto || 'Foto-Analyse'}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Step: Idle — Camera/Gallery selection */}
      {step === 'idle' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            {isMobile
              ? (meals.photoHint || 'Fotografiere deine Mahlzeit für automatische Nährwert-Schätzung')
              : (language === 'de' ? 'Lade ein Foto deiner Mahlzeit hoch für automatische Nährwert-Schätzung' : 'Upload a photo of your meal for automatic nutrition estimation')}
          </p>
          {isMobile ? (
            /* Mobile: Show Camera + Gallery buttons */
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-700 text-sm font-medium hover:bg-teal-100 transition-colors"
              >
                <Camera className="h-5 w-5" />
                {meals.photoCamera || 'Kamera'}
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-700 text-sm font-medium hover:bg-teal-100 transition-colors"
              >
                <Image className="h-5 w-5" />
                {meals.photoGallery || 'Galerie'}
              </button>
            </div>
          ) : (
            /* Desktop: Single upload button (camera capture not supported) */
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-700 text-sm font-medium hover:bg-teal-100 transition-colors"
            >
              <Upload className="h-5 w-5" />
              {language === 'de' ? 'Bild auswählen' : 'Choose image'}
            </button>
          )}
        </div>
      )}

      {/* Step: Analyzing — Preview + Spinner */}
      {step === 'analyzing' && (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-gray-100">
            {previewUrl && (
              <OptimizedImage
                src={previewUrl}
                alt="Meal preview"
                className="w-full h-48 object-cover opacity-50"
                priority
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/90 rounded-full p-3 shadow-lg">
                <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center animate-pulse">
            {meals.photoAnalyzing || 'Mahlzeit wird analysiert...'}
          </p>
        </div>
      )}

      {/* Step: Result — Show detected food + macros */}
      {step === 'result' && result && (
        <div className="space-y-3">
          {/* Preview image (small) */}
          {previewUrl && (
            <div className="rounded-xl overflow-hidden bg-gray-100">
              <OptimizedImage
                src={previewUrl}
                alt="Meal"
                className="w-full h-32 object-cover"
                priority
              />
            </div>
          )}

          {/* Detected name */}
          <div className="bg-teal-50 rounded-lg p-3">
            <p className="text-sm font-semibold text-gray-900">{result.name}</p>
            {result.portion_description && (
              <p className="text-xs text-gray-500 mt-0.5">{result.portion_description}</p>
            )}
          </div>

          {/* Macros preview */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-400">{t.meals.calories}</p>
              <p className="text-sm font-bold text-gray-900">{result.calories}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-400">{t.meals.protein}</p>
              <p className="text-sm font-bold text-gray-900">{result.protein}g</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-400">{t.meals.carbs}</p>
              <p className="text-sm font-bold text-gray-900">{result.carbs}g</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-400">{t.meals.fat}</p>
              <p className="text-sm font-bold text-gray-900">{result.fat}g</p>
            </div>
          </div>

          {/* Confidence */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">
              {meals.photoConfidence || 'Erkennungssicherheit'}
            </span>
            <span className={`font-medium ${confidenceColor(result.confidence)}`}>
              {confidenceLabel(result.confidence)} ({Math.round(result.confidence * 100)}%)
            </span>
          </div>

          {/* Notes */}
          {result.notes && (
            <p className="text-xs text-gray-400 italic">{result.notes}</p>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              {meals.photoRetry || 'Neues Bild'}
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 transition-all"
            >
              <Check className="h-4 w-4" />
              {meals.photoAccept || 'Werte uebernehmen'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Error */}
      {step === 'error' && (
        <div className="space-y-3">
          {/* Preview image */}
          {previewUrl && (
            <div className="rounded-xl overflow-hidden bg-gray-100">
              <OptimizedImage
                src={previewUrl}
                alt="Meal"
                className="w-full h-32 object-cover opacity-50"
                priority
              />
            </div>
          )}

          <div className="bg-red-50 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">
                {meals.photoError || 'Foto konnte nicht analysiert werden'}
              </p>
              {error && (
                <p className="text-xs text-red-500 mt-1">{error}</p>
              )}
              {result?.notes && (
                <p className="text-xs text-red-400 mt-1">{result.notes}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            {meals.photoRetry || 'Neues Bild'}
          </button>
        </div>
      )}
    </div>
  );
}
