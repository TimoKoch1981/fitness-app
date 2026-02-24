/**
 * Email/Text Extractor — Uses AI to extract health data from freeform text.
 *
 * Supports two modes:
 * - Direct: Uses OpenAI API key directly (local development)
 * - Proxy: Routes through Supabase Edge Function ai-proxy (cloud / production)
 */

import type { ImportedRow } from './importTypes';
import { isUsingProxy } from '../../../lib/ai/provider';
import { proxyCompletionRequest } from '../../../lib/ai/supabaseProxy';

const EXTRACTION_PROMPT = `Du bist ein Gesundheitsdaten-Extraktor. Analysiere den folgenden Text und extrahiere alle Gesundheitsdaten daraus.

Gib ein JSON-Array zurueck mit folgender Struktur:
[{
  "type": "meal" | "body" | "blood_pressure",
  "date": "YYYY-MM-DD",
  "values": {
    // Fuer meal: "name", "calories", "protein", "carbs", "fat"
    // Fuer body: "weight_kg", "body_fat_pct", "muscle_mass_kg", "waist_cm", "chest_cm", "arm_cm", "leg_cm"
    // Fuer blood_pressure: "systolic", "diastolic", "pulse"
  }
}]

Regeln:
- Extrahiere NUR Daten, die explizit im Text stehen
- Wenn kein Datum genannt wird, verwende "TODAY" als Platzhalter
- Numerische Werte als Zahlen, nicht als Strings
- Wenn nichts extrahierbar ist, gib ein leeres Array [] zurueck
- Antworte NUR mit dem JSON-Array, kein anderer Text`;

let idCounter = 0;

/**
 * Extract health data from freeform text using AI.
 *
 * @param text - Freeform text (email, notes, lab report, etc.)
 * @param apiKey - OpenAI API key (only used in direct mode, ignored in proxy mode)
 * @param language - Response language ('de' or 'en')
 */
export async function extractHealthDataFromText(
  text: string,
  apiKey: string,
  language: 'de' | 'en' = 'de'
): Promise<ImportedRow[]> {
  const systemPrompt = language === 'de' ? EXTRACTION_PROMPT : EXTRACTION_PROMPT
    .replace('Du bist ein Gesundheitsdaten-Extraktor', 'You are a health data extractor')
    .replace('Analysiere den folgenden Text', 'Analyze the following text')
    .replace('extrahiere alle Gesundheitsdaten daraus', 'extract all health data from it')
    .replace('Gib ein JSON-Array zurueck', 'Return a JSON array')
    .replace('Regeln:', 'Rules:')
    .replace('Extrahiere NUR Daten, die explizit im Text stehen', 'Extract ONLY data explicitly present in the text')
    .replace('Wenn kein Datum genannt wird', 'If no date is mentioned')
    .replace('Numerische Werte als Zahlen, nicht als Strings', 'Numeric values as numbers, not strings')
    .replace('Wenn nichts extrahierbar ist, gib ein leeres Array [] zurueck', 'If nothing is extractable, return an empty array []')
    .replace('Antworte NUR mit dem JSON-Array, kein anderer Text', 'Respond ONLY with the JSON array, no other text');

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: text },
  ];

  let content: string;

  if (isUsingProxy()) {
    // ── Cloud mode: Route through Supabase Edge Function ──────────
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
    const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
    if (!supabaseUrl || !anonKey) {
      throw new Error('Supabase not configured for AI proxy');
    }

    const data = await proxyCompletionRequest(supabaseUrl, anonKey, messages, {
      model: 'gpt-4o-mini',
      temperature: 0.1,
      max_tokens: 2000,
    });
    content = data.choices?.[0]?.message?.content?.trim() ?? '[]';
  } else {
    // ── Local mode: Direct OpenAI API call ────────────────────────
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.1,
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    content = data.choices?.[0]?.message?.content?.trim() ?? '[]';
  }

  // Parse JSON from response (may be wrapped in markdown code block)
  const jsonStr = content.replace(/^```json?\n?/m, '').replace(/\n?```$/m, '').trim();
  const parsed = JSON.parse(jsonStr);

  if (!Array.isArray(parsed)) return [];

  const today = new Date().toISOString().split('T')[0];

  return parsed.map((item: { type?: string; date?: string; values?: Record<string, unknown> }) => ({
    id: `email_${++idCounter}_${Date.now()}`,
    type: (item.type as ImportedRow['type']) ?? 'body',
    date: item.date === 'TODAY' ? today : (item.date ?? today),
    values: (item.values ?? {}) as Record<string, number | string | undefined>,
    confidence: 0.8,
    selected: true,
  }));
}
