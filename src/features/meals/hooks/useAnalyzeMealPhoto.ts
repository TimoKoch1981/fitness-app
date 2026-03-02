/**
 * useAnalyzeMealPhoto — React Hook for photo-based meal analysis.
 *
 * Takes a photo File, compresses it, sends to Vision API, returns
 * identified food name + estimated macros.
 *
 * Uses the same compressImage() utility from vision.ts and the
 * analyzeMealPhoto() function from mealVision.ts.
 */

import { useState, useCallback } from 'react';
import { compressImage } from '../../../lib/ai/vision';
import { analyzeMealPhoto } from '../../../lib/ai/mealVision';
import type { MealPhotoAnalysisResult } from '../../../lib/ai/mealVision';

export function useAnalyzeMealPhoto() {
  const [result, setResult] = useState<MealPhotoAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = useCallback(async (
    file: File,
    language: string = 'de',
  ): Promise<MealPhotoAnalysisResult | null> => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Compress image (1280px, JPEG 85% quality → ~100-400KB)
      const { base64, mimeType } = await compressImage(file);

      // Send to Vision API
      const analysisResult = await analyzeMealPhoto(base64, mimeType, language);

      // Check if it's a valid food detection
      if (analysisResult.confidence === 0 && analysisResult.calories === 0) {
        setError(language === 'de'
          ? 'Kein Essen erkannt. Bitte versuche ein anderes Bild.'
          : 'No food detected. Please try a different image.');
        setResult(analysisResult);
        return null;
      }

      setResult(analysisResult);
      return analysisResult;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(language === 'de'
        ? `Foto-Analyse fehlgeschlagen: ${msg}`
        : `Photo analysis failed: ${msg}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError('');
    setLoading(false);
  }, []);

  return { analyze, result, loading, error, reset };
}
