/**
 * Body Vision API — Analyzes body/physique photos using OpenAI gpt-4o-mini Vision.
 *
 * Used for:
 * - AI Body Scan (estimated body fat, muscle development, symmetry)
 * - Progress photo analysis and comparison
 *
 * Supports two modes:
 * - Direct: Uses VITE_OPENAI_API_KEY (local development)
 * - Proxy: Routes through Supabase Edge Function ai-proxy (cloud / production)
 *
 * @see vision.ts for the scale screenshot counterpart
 * @see mealVision.ts for the meal photo counterpart
 */

import { isUsingProxy } from './provider';
import { proxyCompletionRequest } from './supabaseProxy';

/** Structured result from body photo analysis */
export interface BodyScanResult {
  /** Estimated body fat percentage (3-60%) */
  estimated_body_fat_pct: number;
  /** Muscle development score (1-10) */
  muscle_development: number;
  /** Symmetry score (1-10) */
  symmetry: number;
  /** Visible muscle groups identified */
  visible_muscle_groups: string[];
  /** Assessment in German */
  assessment_de: string;
  /** Assessment in English */
  assessment_en: string;
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
 * Analyze a body/physique photo and extract body composition estimates.
 *
 * @param imageBase64 - Base64-encoded image (without data:image/... prefix)
 * @param mimeType - Image MIME type (image/jpeg, image/png, etc.)
 * @param language - Response language ('de' or 'en')
 * @returns Estimated body composition analysis
 */
export async function analyzeBodyPhoto(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  language: string = 'de',
): Promise<BodyScanResult> {
  const systemPrompt = getBodySystemPrompt(language);
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
        ? 'Analysiere dieses Koerperfoto und schaetze die Koerperzusammensetzung als JSON.'
        : 'Analyze this body photo and estimate the body composition as JSON.',
    },
  ];

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userContent },
  ];

  let content: string;

  if (isUsingProxy()) {
    // -- Cloud mode: Route through Supabase Edge Function --
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
    const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
    if (!supabaseUrl || !anonKey) {
      throw new Error(
        language === 'de'
          ? 'Supabase nicht konfiguriert. Body-Scan nicht moeglich.'
          : 'Supabase not configured. Body scan not available.',
      );
    }

    const data = await proxyCompletionRequest(supabaseUrl, anonKey, messages, {
      model: VISION_MODEL,
      temperature: 0.2,
      max_tokens: 600,
    });
    content = data.choices?.[0]?.message?.content ?? '';
  } else {
    // -- Local mode: Direct OpenAI API call --
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
    if (!apiKey) {
      throw new Error(
        language === 'de'
          ? 'OpenAI API-Key nicht konfiguriert. Body-Scan nicht moeglich.'
          : 'OpenAI API key not configured. Body scan not available.',
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
          max_tokens: 600,
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
            ? 'Body-Scan Timeout. Bitte versuche es erneut.'
            : 'Body scan timeout. Please try again.',
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  // -- Parse JSON from response --
  return parseBodyVisionResponse(content, language);
}

// -- Helper functions --

function getBodySystemPrompt(language: string): string {
  return language === 'de'
    ? `Du bist ein Fitness-Experte und Bildanalyse-Assistent fuer eine Fitness-App.
Deine Aufgabe: Analysiere Fotos von Koerpern/Physique und schaetze die Koerperzusammensetzung.

Analysiere das Bild und extrahiere:
- estimated_body_fat_pct: Geschaetzter Koerperfettanteil in % (realistisch 3-60%)
- muscle_development: Muskelentwicklung (1-10, wobei 1=kaum Muskeldefinition, 10=Profi-Bodybuilder)
- symmetry: Symmetrie der Muskulatur (1-10, wobei 1=stark asymmetrisch, 10=perfekt symmetrisch)
- visible_muscle_groups: Liste sichtbarer Muskelgruppen auf Deutsch (z.B. "Bizeps", "Brust", "Bauch", "Quadrizeps")
- assessment_de: Kurze Einschaetzung auf Deutsch (2-3 Saetze)
- assessment_en: Kurze Einschaetzung auf Englisch (2-3 Saetze)

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt. Kein weiterer Text.
Format:
{
  "estimated_body_fat_pct": 15,
  "muscle_development": 6,
  "symmetry": 7,
  "visible_muscle_groups": ["Brust", "Bizeps", "Bauch"],
  "assessment_de": "Gute Grundmuskelmasse mit moderatem Koerperfettanteil.",
  "assessment_en": "Good base muscle mass with moderate body fat percentage.",
  "confidence": 0.75,
  "notes": "Optionale Hinweise"
}

Regeln:
- Schaetze konservativ und realistisch
- estimated_body_fat_pct: Minimum 3%, Maximum 60%
- muscle_development und symmetry: Ganzzahlen 1-10
- visible_muscle_groups: Nur Muskeln die KLAR SICHTBAR definiert sind
- confidence: 0.7+ bei klarem Ganzkörperfoto, 0.4-0.7 bei teilweise verdeckt
- Bei nicht-Koerper-Bildern: confidence 0.0 und in notes erklaeren
- Sei respektvoll und sachlich in der Einschaetzung
- Dezimaltrennzeichen: Punkt (nicht Komma)`
    : `You are a fitness expert and image analysis assistant for a fitness app.
Your task: Analyze body/physique photos and estimate body composition.

Analyze the image and extract:
- estimated_body_fat_pct: Estimated body fat percentage (realistic 3-60%)
- muscle_development: Muscle development score (1-10, where 1=minimal definition, 10=pro bodybuilder)
- symmetry: Muscular symmetry (1-10, where 1=very asymmetric, 10=perfectly symmetric)
- visible_muscle_groups: List of visible muscle groups in English (e.g. "Biceps", "Chest", "Abs", "Quadriceps")
- assessment_de: Short assessment in German (2-3 sentences)
- assessment_en: Short assessment in English (2-3 sentences)

Respond ONLY with a JSON object. No other text.
Format:
{
  "estimated_body_fat_pct": 15,
  "muscle_development": 6,
  "symmetry": 7,
  "visible_muscle_groups": ["Chest", "Biceps", "Abs"],
  "assessment_de": "Gute Grundmuskelmasse mit moderatem Koerperfettanteil.",
  "assessment_en": "Good base muscle mass with moderate body fat percentage.",
  "confidence": 0.75,
  "notes": "Optional notes"
}

Rules:
- Estimate conservatively and realistically
- estimated_body_fat_pct: Minimum 3%, Maximum 60%
- muscle_development and symmetry: Integers 1-10
- visible_muscle_groups: Only muscles that are CLEARLY VISIBLE and defined
- confidence: 0.7+ for clear full-body photo, 0.4-0.7 if partially obscured
- For non-body images: confidence 0.0 and explain in notes
- Be respectful and objective in the assessment
- Decimal separator: dot (not comma)`;
}

export function parseBodyVisionResponse(content: string, language: string): BodyScanResult {
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const result = JSON.parse(jsonStr) as BodyScanResult;

    // Ensure required fields with defaults
    if (result.confidence === undefined) {
      result.confidence = 0.5;
    }

    // Clamp and round values
    result.estimated_body_fat_pct = Math.round(Number(result.estimated_body_fat_pct) || 0);
    result.muscle_development = Math.round(Number(result.muscle_development) || 5);
    result.symmetry = Math.round(Number(result.symmetry) || 5);

    // Ensure arrays
    if (!Array.isArray(result.visible_muscle_groups)) {
      result.visible_muscle_groups = [];
    }

    // Ensure assessment strings
    if (!result.assessment_de) {
      result.assessment_de = language === 'de'
        ? 'Keine Einschaetzung moeglich.'
        : 'No assessment available.';
    }
    if (!result.assessment_en) {
      result.assessment_en = 'No assessment available.';
    }

    // -- Sanity checks --

    // Body fat: 3-60% range
    if (result.estimated_body_fat_pct < 3 || result.estimated_body_fat_pct > 60) {
      result.confidence = Math.min(result.confidence, 0.2);
      result.notes = language === 'de'
        ? 'Unplausibler Koerperfettanteil — bitte manuell pruefen'
        : 'Implausible body fat percentage — please check manually';
      // Clamp to valid range
      result.estimated_body_fat_pct = Math.max(3, Math.min(60, result.estimated_body_fat_pct));
    }

    // Muscle development and symmetry: 1-10
    result.muscle_development = Math.max(1, Math.min(10, result.muscle_development));
    result.symmetry = Math.max(1, Math.min(10, result.symmetry));

    return result;
  } catch {
    console.error('[BodyVision] Failed to parse JSON response:', content);
    return {
      estimated_body_fat_pct: 0,
      muscle_development: 0,
      symmetry: 0,
      visible_muscle_groups: [],
      assessment_de: language === 'de'
        ? 'Konnte die KI-Antwort nicht verarbeiten. Bitte versuche ein deutlicheres Bild.'
        : 'Could not process AI response. Please try a clearer image.',
      assessment_en: 'Could not process AI response. Please try a clearer image.',
      confidence: 0,
      notes: language === 'de'
        ? 'Konnte die KI-Antwort nicht verarbeiten.'
        : 'Could not process AI response.',
    };
  }
}
