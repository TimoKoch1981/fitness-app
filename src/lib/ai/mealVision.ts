/**
 * Meal Vision API — Analyzes food photos using OpenAI gpt-4o-mini Vision.
 *
 * Used for:
 * - Photo-based meal logging (user photographs their food)
 * - Automatic food identification and macro estimation
 *
 * Supports two modes:
 * - Direct: Uses VITE_OPENAI_API_KEY (local development)
 * - Proxy: Routes through Supabase Edge Function ai-proxy (cloud / production)
 *
 * @see vision.ts for the scale screenshot counterpart
 */

import { isUsingProxy } from './provider';
import { proxyCompletionRequest } from './supabaseProxy';

/** Structured result from meal photo analysis */
export interface MealPhotoAnalysisResult {
  /** Identified food name / description */
  name: string;
  /** Estimated calories (kcal) */
  calories: number;
  /** Estimated protein (g) */
  protein: number;
  /** Estimated carbs (g) */
  carbs: number;
  /** Estimated fat (g) */
  fat: number;
  /** Estimated fiber (g), if identifiable */
  fiber?: number;
  /** Estimated portion size description */
  portion_description?: string;
  /** Raw text the AI detected (for debugging / user verification) */
  raw_text?: string;
  /** Confidence: how sure the AI is about the analysis (0-1) */
  confidence: number;
  /** Any warnings or notes from the analysis */
  notes?: string;
}

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

/** Vision model — gpt-4o-mini supports image input */
const VISION_MODEL = 'gpt-4o-mini';

/** Timeout for vision API calls (images take longer to process) */
const VISION_TIMEOUT_MS = 45_000;

/**
 * Analyze a meal photo and extract food identification + nutritional estimates.
 *
 * @param imageBase64 - Base64-encoded image (without data:image/... prefix)
 * @param mimeType - Image MIME type (image/jpeg, image/png, etc.)
 * @param language - Response language ('de' or 'en')
 * @returns Identified food with estimated nutritional values
 */
export async function analyzeMealPhoto(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  language: string = 'de',
): Promise<MealPhotoAnalysisResult> {
  const systemPrompt = getMealSystemPrompt(language);
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
        ? 'Analysiere dieses Essensfoto und schaetze die Naehrwerte als JSON.'
        : 'Analyze this food photo and estimate the nutritional values as JSON.',
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
          ? 'Supabase nicht konfiguriert. Foto-Analyse nicht moeglich.'
          : 'Supabase not configured. Photo analysis not available.',
      );
    }

    const data = await proxyCompletionRequest(supabaseUrl, anonKey, messages, {
      model: VISION_MODEL,
      temperature: 0.2,
      max_tokens: 400,
    });
    content = data.choices?.[0]?.message?.content ?? '';
  } else {
    // ── Local mode: Direct OpenAI API call ────────────────────────
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
    if (!apiKey) {
      throw new Error(
        language === 'de'
          ? 'OpenAI API-Key nicht konfiguriert. Foto-Analyse nicht moeglich.'
          : 'OpenAI API key not configured. Photo analysis not available.',
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
          temperature: 0.2,
          max_tokens: 400,
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
            ? 'Foto-Analyse Timeout. Bitte versuche es erneut.'
            : 'Photo analysis timeout. Please try again.',
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ── Parse JSON from response ──────────────────────────────────────
  return parseMealVisionResponse(content, language);
}

// ── Helper functions ────────────────────────────────────────────────

function getMealSystemPrompt(language: string): string {
  return language === 'de'
    ? `Du bist ein Ernaehrungsexperte und Bildanalyse-Assistent fuer eine Fitness-App.
Deine Aufgabe: Analysiere Fotos von Mahlzeiten und schaetze die Naehrwerte.

Analysiere das Bild und extrahiere:
- name: Kurzer Name der Mahlzeit (z.B. "Haehnchenbrust mit Reis und Brokkoli")
- calories: Geschaetzte Kalorien (kcal) fuer die sichtbare Portion
- protein: Protein in Gramm
- carbs: Kohlenhydrate in Gramm
- fat: Fett in Gramm
- fiber: Ballaststoffe in Gramm (falls schaetzbar)
- portion_description: Kurze Portionsbeschreibung (z.B. "ca. 1 Teller, 400g")

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt. Kein weiterer Text.
Format:
{
  "name": "Haehnchenbrust mit Reis",
  "calories": 450,
  "protein": 42,
  "carbs": 48,
  "fat": 8,
  "fiber": 3,
  "portion_description": "1 Teller, ca. 400g",
  "raw_text": "Kurze Beschreibung was du auf dem Bild siehst",
  "confidence": 0.85,
  "notes": "Optionale Hinweise"
}

Regeln:
- Schaetze basierend auf der SICHTBAREN Portionsgroesse
- Portionsgroessen-Richtwerte: Fleisch 150g, Reis/Nudeln 200g, Gemuese 150g
- Alle Naehrwerte als ganze Zahlen
- confidence: 0.8+ bei klarer Mahlzeit, 0.5-0.8 bei teilweise verdeckt/unklar
- Bei nicht-Essens-Bildern: confidence 0.0, calories 0, und notes erklaeren
- Dezimaltrennzeichen: Punkt (nicht Komma)
- name: Deutsch, kurz und praegnant (max 50 Zeichen)`
    : `You are a nutrition expert and image analysis assistant for a fitness app.
Your task: Analyze photos of meals and estimate nutritional values.

Analyze the image and extract:
- name: Short meal name (e.g. "Chicken breast with rice and broccoli")
- calories: Estimated calories (kcal) for the visible portion
- protein: Protein in grams
- carbs: Carbohydrates in grams
- fat: Fat in grams
- fiber: Fiber in grams (if estimatable)
- portion_description: Short portion description (e.g. "approx. 1 plate, 400g")

Respond ONLY with a JSON object. No other text.
Format:
{
  "name": "Chicken breast with rice",
  "calories": 450,
  "protein": 42,
  "carbs": 48,
  "fat": 8,
  "fiber": 3,
  "portion_description": "1 plate, approx. 400g",
  "raw_text": "Brief description of what you see",
  "confidence": 0.85,
  "notes": "Optional notes"
}

Rules:
- Estimate based on the VISIBLE portion size
- Serving size guidelines: Meat 150g, Rice/Pasta 200g, Vegetables 150g
- All nutritional values as integers
- confidence: 0.8+ for clear meals, 0.5-0.8 if partially obscured/unclear
- For non-food images: confidence 0.0, calories 0, and explain in notes
- Decimal separator: dot (not comma)
- name: English, short and concise (max 50 characters)`;
}

export function parseMealVisionResponse(content: string, language: string): MealPhotoAnalysisResult {
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const result = JSON.parse(jsonStr) as MealPhotoAnalysisResult;

    // Ensure required fields with defaults
    if (!result.name) {
      result.name = language === 'de' ? 'Unbekannte Mahlzeit' : 'Unknown meal';
    }
    if (result.confidence === undefined) {
      result.confidence = 0.5;
    }
    result.calories = Math.round(Number(result.calories) || 0);
    result.protein = Math.round(Number(result.protein) || 0);
    result.carbs = Math.round(Number(result.carbs) || 0);
    result.fat = Math.round(Number(result.fat) || 0);
    if (result.fiber !== undefined) {
      result.fiber = Math.round(Number(result.fiber) || 0);
    }

    // Sanity check — reject obviously wrong results
    if (result.calories > 5000) {
      result.confidence = 0.1;
      result.notes = language === 'de'
        ? 'Unplausibel hohe Kalorien — bitte manuell pruefen'
        : 'Implausibly high calories — please check manually';
    }

    return result;
  } catch {
    console.error('[MealVision] Failed to parse JSON response:', content);
    return {
      name: language === 'de' ? 'Nicht erkannt' : 'Not recognized',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      confidence: 0,
      notes: language === 'de'
        ? 'Konnte die KI-Antwort nicht verarbeiten. Bitte versuche ein deutlicheres Bild.'
        : 'Could not process AI response. Please try a clearer image.',
      raw_text: content,
    };
  }
}
