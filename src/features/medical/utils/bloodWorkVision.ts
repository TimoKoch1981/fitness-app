/**
 * Blood Work Vision — Analyzes lab report photos AND PDFs using AI.
 *
 * Supports two input modes:
 * 1. Image (photo of lab report) → Vision API
 * 2. PDF (digital lab report) → Text extraction + Completion API
 *
 * For PDFs: Extracts text via pdfjs-dist, sends as text prompt.
 * Falls back to rendering PDF page as image if text extraction fails.
 */

import { isUsingProxy } from '../../../lib/ai/provider';
import { proxyCompletionRequest } from '../../../lib/ai/supabaseProxy';
import { ALL_MARKER_KEYS } from './bloodWorkReferenceRanges';
import type { BloodWork } from '../../../types/health';

/** Subset of BloodWork fields that can be auto-detected */
export type BloodWorkVisionResult = Partial<Omit<BloodWork, 'id' | 'user_id' | 'created_at'>>;

const VISION_MODEL = 'gpt-4o-mini';
const TEXT_MODEL = 'gpt-4o-mini';
const TIMEOUT_MS = 60_000;

// All numeric marker fields (expanded to 38)
const NUMERIC_FIELDS = ALL_MARKER_KEYS;

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Analyze a lab report image and extract blood work values.
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

  const content = await callAI(messages, language, true);
  return parseLabReportResponse(content);
}

/**
 * Analyze a PDF lab report by extracting text first, then parsing with AI.
 * Falls back to rendering the first page as an image if text extraction fails.
 */
export async function analyzeLabReportPDF(
  file: File,
  language: string = 'de',
): Promise<BloodWorkVisionResult> {
  // Try text extraction first (cheaper + faster than Vision)
  try {
    const { extractTextFromPDF, hasUsableText } = await import('./pdfTextExtractor');
    const text = await extractTextFromPDF(file);

    if (hasUsableText(text)) {
      return analyzeLabReportText(text, language);
    }
  } catch (err) {
    console.warn('PDF text extraction failed, falling back to image:', err);
  }

  // Fallback: Render PDF page as image, then use Vision
  try {
    const { pdfPageToImage } = await import('./pdfTextExtractor');
    const imageBase64 = await pdfPageToImage(file, 1, 1600);
    return analyzeLabReport(imageBase64, 'image/jpeg', language);
  } catch (err) {
    throw new Error(
      language === 'de'
        ? `PDF-Analyse fehlgeschlagen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`
        : `PDF analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
    );
  }
}

/**
 * Analyze extracted text from a lab report using the completion API.
 * Much cheaper than Vision — no image token costs.
 */
export async function analyzeLabReportText(
  text: string,
  language: string = 'de',
): Promise<BloodWorkVisionResult> {
  const systemPrompt = getLabReportPrompt(language);
  const userText = language === 'de'
    ? `Hier ist der extrahierte Text eines Laborbefunds. Extrahiere alle Blutwerte als JSON:\n\n${text}`
    : `Here is the extracted text from a lab report. Extract all blood work values as JSON:\n\n${text}`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userText },
  ];

  const content = await callAI(messages, language, false);
  return parseLabReportResponse(content);
}

// ── Internal ─────────────────────────────────────────────────────────────

async function callAI(
  messages: Array<{ role: string; content: unknown }>,
  language: string,
  isVision: boolean,
): Promise<string> {
  if (isUsingProxy()) {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
    const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
    if (!supabaseUrl || !anonKey) {
      throw new Error(
        language === 'de'
          ? 'Supabase nicht konfiguriert. Analyse nicht moeglich.'
          : 'Supabase not configured. Analysis not available.',
      );
    }

    const data = await proxyCompletionRequest(supabaseUrl, anonKey, messages, {
      model: isVision ? VISION_MODEL : TEXT_MODEL,
      temperature: 0.1,
      max_tokens: 800,
    });
    return data.choices?.[0]?.message?.content ?? '';
  }

  // Direct OpenAI API call (local dev)
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
  if (!apiKey) {
    throw new Error(
      language === 'de'
        ? 'OpenAI API-Key nicht konfiguriert.'
        : 'OpenAI API key not configured.',
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: isVision ? VISION_MODEL : TEXT_MODEL,
        messages,
        temperature: 0.1,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = (errorData as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`;
      throw new Error(`API error: ${errorMsg}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
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

function getLabReportPrompt(language: string): string {
  // Expanded to include all 38 markers
  return language === 'de'
    ? `Du bist ein medizinischer Laborwerte-Extraktor fuer eine Fitness-App.
Analysiere den Laborbefund und extrahiere die Blutwerte.

Erkenne diese Marker (falls vorhanden) und konvertiere in die angegebene Ziel-Einheit:

HORMONE:
- testosterone_total → ng/dL (ACHTUNG: wenn Quelle ng/mL, dann *100)
- testosterone_free → pg/mL
- estradiol → pg/mL
- lh → mIU/mL, fsh → mIU/mL, shbg → nmol/L, prolactin → ng/mL
- cortisol → µg/dL, free_androgen_index → %

BLUTBILD:
- hemoglobin → g/dL, hematocrit → %
- erythrocytes → /pL (Mio/µL), leukocytes → /nL (Tsd/µL), platelets → /nL (Tsd/µL)

LIPIDE:
- hdl → mg/dL, ldl → mg/dL, triglycerides → mg/dL, total_cholesterol → mg/dL

LEBER:
- ast → U/L, alt → U/L, ggt → U/L, bilirubin → mg/dL, alkaline_phosphatase → U/L

NIERE:
- creatinine → mg/dL, egfr → mL/min, urea → mg/dL

STOFFWECHSEL:
- fasting_glucose → mg/dL, uric_acid → mg/dL, iron → µg/dL
- total_protein → g/dL, hba1c → %, ferritin → ng/mL

ELEKTROLYTE:
- potassium → mmol/L, sodium → mmol/L, calcium → mmol/L

SONSTIGE:
- tsh → mIU/L, psa → ng/mL, free_psa → ng/mL, vitamin_d → ng/mL

WICHTIG:
- Einheiten IMMER in die Ziel-Einheit konvertieren (z.B. ng/mL → ng/dL: *100)
- Nur Werte die du SICHER erkennst
- Datum des Befunds als "date" (YYYY-MM-DD) wenn erkennbar
- Bei mehreren Befund-Daten: das juengste Datum verwenden

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt. Kein weiterer Text.
Beispiel:
{"date":"2025-12-08","testosterone_total":299,"hematocrit":44,"hdl":51,"ldl":143,"ast":72,"alt":58,"iron":118}`
    : `You are a medical lab report value extractor for a fitness app.
Analyze the lab report and extract blood work values.

Recognize these markers (if present) and convert to the target unit:

HORMONES:
- testosterone_total → ng/dL (NOTE: if source is ng/mL, multiply by 100)
- testosterone_free → pg/mL
- estradiol → pg/mL
- lh → mIU/mL, fsh → mIU/mL, shbg → nmol/L, prolactin → ng/mL
- cortisol → µg/dL, free_androgen_index → %

BLOOD COUNT:
- hemoglobin → g/dL, hematocrit → %
- erythrocytes → /pL (M/µL), leukocytes → /nL (K/µL), platelets → /nL (K/µL)

LIPIDS:
- hdl → mg/dL, ldl → mg/dL, triglycerides → mg/dL, total_cholesterol → mg/dL

LIVER:
- ast → U/L, alt → U/L, ggt → U/L, bilirubin → mg/dL, alkaline_phosphatase → U/L

KIDNEY:
- creatinine → mg/dL, egfr → mL/min, urea → mg/dL

METABOLISM:
- fasting_glucose → mg/dL, uric_acid → mg/dL, iron → µg/dL
- total_protein → g/dL, hba1c → %, ferritin → ng/mL

ELECTROLYTES:
- potassium → mmol/L, sodium → mmol/L, calcium → mmol/L

OTHER:
- tsh → mIU/L, psa → ng/mL, free_psa → ng/mL, vitamin_d → ng/mL

IMPORTANT:
- ALWAYS convert to target units (e.g. ng/mL → ng/dL: *100)
- Only include values you're CONFIDENT about
- Include date as "date" (YYYY-MM-DD) if recognizable
- If multiple dates: use the most recent

Reply EXCLUSIVELY with a JSON object. No other text.
Example:
{"date":"2025-12-08","testosterone_total":299,"hematocrit":44,"hdl":51,"ldl":143,"ast":72,"alt":58,"iron":118}`;
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

    for (const field of NUMERIC_FIELDS) {
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
