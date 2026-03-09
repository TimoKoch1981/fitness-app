/**
 * Blood Work Vision — Analyzes lab report photos using AI.
 *
 * Sends a photo of a lab report to the AI proxy and extracts
 * blood work values as structured data. User can review and
 * correct before saving.
 */

import { isUsingProxy } from '../../../lib/ai/provider';
import { proxyCompletionRequest } from '../../../lib/ai/supabaseProxy';
import type { BloodWork } from '../../../types/health';

/** Subset of BloodWork fields that can be auto-detected from a photo */
export type BloodWorkVisionResult = Partial<Omit<BloodWork, 'id' | 'user_id' | 'created_at'>>;

const VISION_MODEL = 'gpt-4o-mini';
const VISION_TIMEOUT_MS = 60_000; // Lab reports can be complex

/**
 * Analyze a lab report photo and extract blood work values.
 */
export async function analyzeLabReport(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  language: string = 'de',
): Promise<BloodWorkVisionResult> {
  const systemPrompt = getLabReportPrompt(language);
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
        ? 'Extrahiere alle Blutwerte aus diesem Laborbefund als JSON.'
        : 'Extract all blood work values from this lab report as JSON.',
    },
  ];

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userContent },
  ];

  let content: string;

  if (isUsingProxy()) {
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
      temperature: 0.1,
      max_tokens: 600,
    });
    content = data.choices?.[0]?.message?.content ?? '';
  } else {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
    if (!apiKey) {
      throw new Error(
        language === 'de'
          ? 'OpenAI API-Key nicht konfiguriert.'
          : 'OpenAI API key not configured.',
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            ? 'Analyse-Timeout. Bitte versuche es erneut.'
            : 'Analysis timeout. Please try again.',
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  return parseLabReportResponse(content);
}

function getLabReportPrompt(language: string): string {
  return language === 'de'
    ? `Du bist ein medizinischer Laborwerte-Extraktor fuer eine Fitness-App.
Analysiere das Bild eines Laborbefunds und extrahiere die Blutwerte.

Erkenne diese Marker (falls vorhanden):
- testosterone_total (ng/dL), testosterone_free (pg/mL), estradiol (pg/mL)
- lh (mIU/mL), fsh (mIU/mL), shbg (nmol/L), prolactin (ng/mL)
- hematocrit (%), hemoglobin (g/dL)
- hdl (mg/dL), ldl (mg/dL), triglycerides (mg/dL), total_cholesterol (mg/dL)
- ast (U/L), alt (U/L), ggt (U/L)
- creatinine (mg/dL), egfr (mL/min/1.73m2)
- tsh (mIU/L)
- psa (ng/mL), hba1c (%), vitamin_d (ng/mL), ferritin (ng/mL)

WICHTIG: Einheiten ggf. konvertieren. Nur Werte die du SICHER erkennst.
Datum des Befunds als "date" (YYYY-MM-DD) wenn erkennbar.

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt. Kein weiterer Text.
Nur Felder mit erkannten Werten. Beispiel:
{"date":"2026-03-01","testosterone_total":650,"hematocrit":47.2,"hdl":55,"ldl":110}`
    : `You are a medical lab report value extractor for a fitness app.
Analyze the image of a lab report and extract blood work values.

Recognize these markers (if present):
- testosterone_total (ng/dL), testosterone_free (pg/mL), estradiol (pg/mL)
- lh (mIU/mL), fsh (mIU/mL), shbg (nmol/L), prolactin (ng/mL)
- hematocrit (%), hemoglobin (g/dL)
- hdl (mg/dL), ldl (mg/dL), triglycerides (mg/dL), total_cholesterol (mg/dL)
- ast (U/L), alt (U/L), ggt (U/L)
- creatinine (mg/dL), egfr (mL/min/1.73m2)
- tsh (mIU/L)
- psa (ng/mL), hba1c (%), vitamin_d (ng/mL), ferritin (ng/mL)

IMPORTANT: Convert units if needed. Only include values you're CONFIDENT about.
Include date as "date" (YYYY-MM-DD) if recognizable.

Reply EXCLUSIVELY with a JSON object. No other text.
Only fields with recognized values. Example:
{"date":"2026-03-01","testosterone_total":650,"hematocrit":47.2,"hdl":55,"ldl":110}`;
}

function parseLabReportResponse(content: string): BloodWorkVisionResult {
  // Extract JSON from response (may be wrapped in markdown code block)
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) {
    throw new Error('Could not parse lab report analysis response');
  }

  try {
    const parsed = JSON.parse(jsonMatch[1].trim());
    const result: BloodWorkVisionResult = {};

    // Map known fields with type validation
    const numericFields = [
      'testosterone_total', 'testosterone_free', 'estradiol', 'lh', 'fsh', 'shbg', 'prolactin',
      'hematocrit', 'hemoglobin', 'hdl', 'ldl', 'triglycerides', 'total_cholesterol',
      'ast', 'alt', 'ggt', 'creatinine', 'egfr', 'tsh', 'psa', 'hba1c', 'vitamin_d', 'ferritin',
    ] as const;

    for (const field of numericFields) {
      const val = parsed[field];
      if (val != null && typeof val === 'number' && val >= 0) {
        (result as Record<string, unknown>)[field] = val;
      }
    }

    if (parsed.date && typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
      result.date = parsed.date;
    }

    if (parsed.notes && typeof parsed.notes === 'string') {
      result.notes = parsed.notes;
    }

    return result;
  } catch {
    throw new Error('Invalid JSON in lab report analysis');
  }
}
