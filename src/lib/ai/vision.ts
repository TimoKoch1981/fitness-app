/**
 * Vision API — Analyzes images (screenshots) using OpenAI gpt-4o.
 *
 * Used for:
 * - Fitdays smart scale screenshot import (weight, body fat, muscle mass, water %)
 * - General body composition screenshots
 *
 * Supports two modes:
 * - Direct: Uses VITE_OPENAI_API_KEY (local development)
 * - Proxy: Routes through Supabase Edge Function ai-proxy (cloud / production)
 *
 * @see https://platform.openai.com/docs/guides/vision
 */

import { isUsingProxy } from './provider';
import { proxyCompletionRequest } from './supabaseProxy';

/** Structured result from scale screenshot analysis */
export interface ScaleAnalysisResult {
  weight_kg?: number;
  body_fat_pct?: number;
  muscle_mass_kg?: number;
  water_pct?: number;
  bone_mass_kg?: number;
  bmi?: number;
  /** Raw text the AI detected (for debugging / user verification) */
  raw_text?: string;
  /** Confidence: how sure the AI is about the extraction (0-1) */
  confidence: number;
  /** Any warnings or notes from the analysis */
  notes?: string;
}

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

/** Vision model — gpt-4o supports image input, gpt-4o-mini does too but with lower quality */
const VISION_MODEL = 'gpt-4o-mini';

/** Timeout for vision API calls (images take longer to process) */
const VISION_TIMEOUT_MS = 45_000;

/** Max image dimension (px) for compression — 1280px is enough for scale screenshots */
const MAX_IMAGE_DIMENSION = 1280;

/** JPEG quality for compression (0-1) */
const JPEG_QUALITY = 0.85;

/**
 * Analyze a scale screenshot and extract body measurements.
 *
 * @param imageBase64 - Base64-encoded image (without data:image/... prefix)
 * @param mimeType - Image MIME type (image/jpeg, image/png, etc.)
 * @param language - Response language ('de' or 'en')
 * @returns Extracted body measurement values
 */
export async function analyzeScaleScreenshot(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  language: string = 'de',
): Promise<ScaleAnalysisResult> {
  const systemPrompt = getSystemPrompt(language);
  const userContent = [
    {
      type: 'image_url' as const,
      image_url: {
        url: `data:${mimeType};base64,${imageBase64}`,
        detail: 'high' as const,
      },
    },
    {
      type: 'text' as const,
      text: language === 'de'
        ? 'Analysiere dieses Waagen-Screenshot und extrahiere die Koerperwerte als JSON.'
        : 'Analyze this scale screenshot and extract the body metrics as JSON.',
    },
  ];

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userContent },
  ];

  let content: string;

  if (isUsingProxy()) {
    // ── Cloud mode: Route through Supabase Edge Function ──────────
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
    const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
    if (!supabaseUrl || !anonKey) {
      throw new Error(
        language === 'de'
          ? 'Supabase nicht konfiguriert. Vision-Analyse nicht moeglich.'
          : 'Supabase not configured. Vision analysis not available.',
      );
    }

    const data = await proxyCompletionRequest(supabaseUrl, anonKey, messages, {
      model: VISION_MODEL,
      temperature: 0.1,
      max_tokens: 500,
    });
    content = data.choices?.[0]?.message?.content ?? '';
  } else {
    // ── Local mode: Direct OpenAI API call ────────────────────────
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
    if (!apiKey) {
      throw new Error(
        language === 'de'
          ? 'OpenAI API-Key nicht konfiguriert. Vision-Analyse nicht moeglich.'
          : 'OpenAI API key not configured. Vision analysis not available.',
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);

    try {
      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: VISION_MODEL,
          messages,
          temperature: 0.1,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = (errorData as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`;
        throw new Error(`Vision API error: ${errorMsg}`);
      }

      const data = await response.json();
      content = data.choices?.[0]?.message?.content ?? '';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(
          language === 'de'
            ? 'Vision-Analyse Timeout. Bitte versuche es erneut.'
            : 'Vision analysis timeout. Please try again.',
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ── Parse JSON from response ──────────────────────────────────────
  return parseVisionResponse(content, language);
}

/**
 * Convert a File object to a compressed base64 string.
 * Resizes large images to MAX_IMAGE_DIMENSION and compresses as JPEG.
 * Returns { base64, mimeType } — base64 WITHOUT the data:... prefix.
 */
export async function fileToBase64(file: File): Promise<string> {
  // Compress the image first to avoid sending huge payloads
  const compressed = await compressImage(file);
  return compressed.base64;
}

/**
 * Compress and resize an image File.
 * Returns the compressed base64 string and the resulting MIME type (always image/jpeg).
 *
 * - Resizes to max 1280px on longest side (preserves aspect ratio)
 * - Compresses to JPEG 85% quality
 * - Typical result: 5-12MB phone photo → 100-400KB JPEG
 */
export async function compressImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if needed (preserve aspect ratio)
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        const ratio = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Draw to canvas for compression
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG with quality setting
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      const base64 = dataUrl.split(',')[1];

      resolve({ base64, mimeType: 'image/jpeg' });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback: read original file without compression
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ base64, mimeType: file.type || 'image/jpeg' });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };

    img.src = url;
  });
}

// ── Helper functions ────────────────────────────────────────────────

function getSystemPrompt(language: string): string {
  return language === 'de'
    ? `Du bist ein Bildanalyse-Assistent fuer Fitness-Apps. Deine Aufgabe ist es, Koerperwerte aus Screenshots von Smart-Waagen (z.B. Fitdays, Renpho, Withings) zu extrahieren.

Analysiere das Bild und extrahiere folgende Werte (falls sichtbar):
- weight_kg: Gewicht in kg
- body_fat_pct: Koerperfettanteil in %
- muscle_mass_kg: Muskelmasse in kg
- water_pct: Wasseranteil in %
- bone_mass_kg: Knochenmasse in kg
- bmi: BMI-Wert

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt. Kein weiterer Text.
Format:
{
  "weight_kg": 85.3,
  "body_fat_pct": 22.1,
  "muscle_mass_kg": 38.5,
  "water_pct": 52.3,
  "bone_mass_kg": 3.1,
  "bmi": 26.8,
  "raw_text": "Kurze Beschreibung was du auf dem Bild siehst",
  "confidence": 0.95,
  "notes": "Optionale Hinweise"
}

Regeln:
- Nur Werte eintragen die KLAR LESBAR sind
- Fehlende Werte weglassen (nicht null setzen)
- confidence: 0.9+ wenn klar lesbar, 0.5-0.8 wenn teilweise verdeckt/unscharf
- Bei nicht-Waagen-Bildern: confidence 0.0 und notes erklaeren warum
- Dezimaltrennzeichen: Punkt (nicht Komma)`
    : `You are an image analysis assistant for fitness apps. Your task is to extract body metrics from smart scale screenshots (e.g., Fitdays, Renpho, Withings).

Analyze the image and extract the following values (if visible):
- weight_kg: Weight in kg
- body_fat_pct: Body fat percentage
- muscle_mass_kg: Muscle mass in kg
- water_pct: Water percentage
- bone_mass_kg: Bone mass in kg
- bmi: BMI value

Respond ONLY with a JSON object. No other text.
Format:
{
  "weight_kg": 85.3,
  "body_fat_pct": 22.1,
  "muscle_mass_kg": 38.5,
  "water_pct": 52.3,
  "bone_mass_kg": 3.1,
  "bmi": 26.8,
  "raw_text": "Brief description of what you see",
  "confidence": 0.95,
  "notes": "Optional notes"
}

Rules:
- Only include values that are CLEARLY READABLE
- Omit missing values (don't set them to null)
- confidence: 0.9+ if clearly readable, 0.5-0.8 if partially obscured/blurry
- For non-scale images: confidence 0.0 and explain in notes
- Decimal separator: dot (not comma)`;
}

function parseVisionResponse(content: string, language: string): ScaleAnalysisResult {
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const result = JSON.parse(jsonStr) as ScaleAnalysisResult;
    if (result.confidence === undefined) {
      result.confidence = 0.5;
    }
    return result;
  } catch {
    console.error('[Vision] Failed to parse JSON response:', content);
    return {
      confidence: 0,
      notes: language === 'de'
        ? 'Konnte die KI-Antwort nicht verarbeiten. Bitte versuche ein deutlicheres Bild.'
        : 'Could not process AI response. Please try a clearer image.',
      raw_text: content,
    };
  }
}
