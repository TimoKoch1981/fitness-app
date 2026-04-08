/**
 * System Control Agent — Function Calling layer.
 *
 * Sits between expert agents and the action execution pipeline.
 * Takes an action_request from the expert agent text and converts it
 * into a structured tool_call via OpenAI Function Calling.
 *
 * Flow:
 *   1. Expert agent streams advice text + includes action_request block
 *   2. extractActionRequest() pulls the request from the text
 *   3. executeSystemAgent() makes a non-streaming FC call
 *   4. Returns validated ParsedAction[] or error info
 *
 * Benefits over regex-based parsing:
 *   - Schema enforcement at token generation level (no malformed JSON)
 *   - Explicit error messages instead of silent failures
 *   - Type-safe parameter extraction
 *
 * @see docs/KONZEPT_LLM_OPTIMIERUNG.md
 */

import type { AIProvider, ChatOptions } from '../provider';
import type { ChatMessage } from '../types';
import type { ActionType, ParsedAction } from '../actions/types';
import { getActionTools, parseToolCalls } from '../tools/actionTools';
import { validateAction } from '../actions/schemas';

// ── Types ──────────────────────────────────────────────────────────────

/** Structured action request extracted from expert agent text */
export interface ActionRequest {
  /** The action type requested, e.g. "log_meal" */
  type: string;
  /** Raw data/description from the expert agent */
  description: string;
  /** Full expert response for context */
  fullResponse: string;
}

/** Result from the System Agent execution */
export interface SystemAgentResult {
  success: boolean;
  /** Validated actions ready for execution */
  actions?: ParsedAction[];
  /** Error code for structured handling */
  error?: 'no_tool_call' | 'validation_failed' | 'provider_error';
  /** User-facing error message (localized) */
  userMessage?: string;
  /** Detailed error info for debugging */
  details?: string;
}

// ── Action Request Extraction ────────────────────────────────────────

/**
 * Regex to extract action_request blocks from expert agent text.
 * Format:
 *   [ACTION_REQUEST]
 *   type: log_meal
 *   data: { "name": "Haehnchen", "calories": 500, ... }
 *   [/ACTION_REQUEST]
 */
const ACTION_REQUEST_REGEX = /\[ACTION_REQUEST\]\s*([\s\S]*?)\[\/?ACTION_REQUEST\]/gi;

/**
 * Extract action_request blocks from expert agent response text.
 * Returns null if no action request was found.
 */
export function extractActionRequest(text: string): ActionRequest[] | null {
  const matches = [...text.matchAll(ACTION_REQUEST_REGEX)];
  if (matches.length === 0) return null;

  const requests: ActionRequest[] = [];

  for (const match of matches) {
    const block = match[1].trim();

    // Parse type and data from the block
    const typeMatch = block.match(/type:\s*(\w+)/i);
    const dataMatch = block.match(/data:\s*([\s\S]*?)$/i);

    if (typeMatch) {
      requests.push({
        type: typeMatch[1],
        description: dataMatch ? dataMatch[1].trim() : '',
        fullResponse: text,
      });
    }
  }

  return requests.length > 0 ? requests : null;
}

/**
 * Strip action_request blocks from text for clean display.
 */
export function stripActionRequest(text: string): string {
  return text.replace(ACTION_REQUEST_REGEX, '').trim();
}

// ── System Agent Execution ─────────────────────────────────────────

/**
 * Build the system prompt for the System Control Agent.
 * Kept minimal (~500 tokens) since this is a utility call, not a conversation.
 */
function buildSystemPrompt(language: string): string {
  // CRITICAL: Inject current date explicitly — gpt-4o-mini hallucinates its training
  // cutoff date (2023-10-04) when asked for "today" without an explicit anchor.
  // This caused meals to be saved with date=2023-10-04 → invisible in "today" view.
  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];           // YYYY-MM-DD
  const currentTime = now.toTimeString().slice(0, 5);         // HH:MM
  const dayOfWeekDE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][now.getDay()];
  const dayOfWeekEN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];

  if (language === 'de') {
    return [
      '## System-Steuerungs-Agent',
      '',
      'Du bist der System-Agent der FitBuddy-App. Deine einzige Aufgabe:',
      'Wandle die Beschreibung des Experten-Agents in einen praezisen, VOLLSTAENDIGEN Function Call um.',
      '',
      '### ⚠️ AKTUELLES DATUM UND UHRZEIT (PFLICHT-ANKER — NICHT ERFINDEN!):',
      `- HEUTE ist: ${todayISO} (${dayOfWeekDE})`,
      `- Aktuelle Uhrzeit: ${currentTime}`,
      '- Wenn im date-Feld "heute", "jetzt", "morgens", "mittags", "abends" oder gar nichts steht:',
      `  → VERWENDE IMMER ${todayISO} als date!`,
      '- NIEMALS ein anderes Datum (z.B. 2023-10-04) verwenden, auch wenn es "ueblich" erscheint!',
      '- Bei "gestern" = HEUTE minus 1 Tag, bei "vorgestern" = HEUTE minus 2 Tage',
      '',
      '### Regeln:',
      '1. Rufe GENAU EINE Funktion pro Aktion auf (die zum Typ passt)',
      '2. Extrahiere ALLE genannten Werte aus der Beschreibung und dem Original-Kontext',
      '3. Bei save_training_plan MIT mehreren Tagen: Das Tool-Argument days[] MUSS ALLE im Text erwaehnten Tage enthalten. Wenn der Text "4 Tage" sagt, MUSST du 4 Tages-Objekte zurueckgeben. Niemals weniger!',
      '4. Wenn die Beschreibung zu kurz ist oder Luecken hat: Ergaenze sinnvolle Defaults basierend auf dem Original-Kontext (Ziele, Erfahrung, Geraete).',
      '5. Defaults fuer fehlende Felder:',
      `   - date: ${todayISO} (siehe oben)`,
      `   - time: ${currentTime}`,
      '   - source: "ai"',
      '   - Bei log_meal name: beschreibender Name aus dem Text (z.B. "500g Skyr mit Mango und Banane"), NICHT generisch "Snack"',
      '6. Runde Naehrwerte auf ganze Zahlen',
      '7. Bei mehreren Aktionen in der Anfrage: rufe mehrere Funktionen auf',
      '',
      '### Vollstaendigkeit (WICHTIG):',
      '- Trainingsplaene: ALLE Tage, alle Uebungen, alle Saetze/Reps/Gewichte. Niemals Tage weglassen!',
      '- Wenn 4-Tage-Split verlangt → exakt 4 days-Objekte im Tool-Aufruf',
      '- days_per_week MUSS zur Anzahl der days-Objekte passen',
      '',
      '### Fehler vermeiden:',
      '- Pflichtfelder MUESSEN gesetzt werden (siehe Funktionsdefinition)',
      '- Kalorien, Protein, Kohlenhydrate, Fett sind bei log_meal PFLICHT',
      '- systolic + diastolic sind bei log_blood_pressure PFLICHT',
      '- substance_name ist bei log_substance PFLICHT',
    ].join('\n');
  }

  return [
    '## System Control Agent',
    '',
    'You are the system agent for the FitBuddy app. Your only task:',
    'Convert the expert agent description into a precise, COMPLETE function call.',
    '',
    '### ⚠️ CURRENT DATE AND TIME (MANDATORY ANCHOR — DO NOT INVENT!):',
    `- TODAY is: ${todayISO} (${dayOfWeekEN})`,
    `- Current time: ${currentTime}`,
    '- If the date field contains "today", "now", "morning", "noon", "evening" or is empty:',
    `  → ALWAYS use ${todayISO} as date!`,
    '- NEVER use a different date (e.g. 2023-10-04), even if it seems "usual"!',
    '- "yesterday" = TODAY minus 1 day, "the day before yesterday" = TODAY minus 2 days',
    '',
    '### Rules:',
    '1. Call EXACTLY ONE function per action (matching the type)',
    '2. Extract ALL mentioned values from the description and original context',
    '3. For save_training_plan with multiple days: the tool argument days[] MUST contain ALL days mentioned. If the text says "4 days", you MUST return 4 day objects. Never fewer!',
    '4. If the description is too short: fill sensible defaults based on original context.',
    '5. Defaults for missing fields:',
    `   - date: ${todayISO} (see above)`,
    `   - time: ${currentTime}`,
    '   - source: "ai"',
    '   - For log_meal name: descriptive name from the text (e.g. "500g yogurt with mango and banana"), NOT generic "Snack"',
    '6. Round nutritional values to whole numbers',
    '7. For multiple actions in the request: call multiple functions',
    '',
    '### Completeness (IMPORTANT):',
    '- Training plans: ALL days, all exercises, all sets/reps/weights. Never omit days!',
    '- If 4-day split requested → exactly 4 day objects in tool call',
    '- days_per_week MUST match the number of day objects',
    '',
    '### Avoid errors:',
    '- Required fields MUST be set (see function definition)',
    '- calories, protein, carbs, fat are REQUIRED for log_meal',
    '- systolic + diastolic are REQUIRED for log_blood_pressure',
    '- substance_name is REQUIRED for log_substance',
  ].join('\n');
}

/**
 * Execute the System Control Agent to convert action_requests into tool_calls.
 *
 * Makes a blocking (non-streaming) Function Calling request.
 * Uses tool_choice="required" to force a tool call.
 *
 * @param actionRequests - Extracted action_request blocks from expert text
 * @param provider - The AI provider to use (must support tools)
 * @param language - User language for error messages
 * @param originalUserMessage - Optional: the user's original message for context (improves multi-day plan fidelity)
 * @returns SystemAgentResult with validated ParsedAction[] or error info
 */
export async function executeSystemAgent(
  actionRequests: ActionRequest[],
  provider: AIProvider,
  language: string = 'de',
  originalUserMessage?: string,
): Promise<SystemAgentResult> {
  const startTime = Date.now();
  try {
    // Build messages for the System Agent
    const systemPrompt = buildSystemPrompt(language);

    // Combine all action requests into one user message
    // Include original user message as context so FC has enough info to generate complete structured output
    const contextPrefix = originalUserMessage
      ? (language === 'de'
          ? `Original-Nachricht des Nutzers: "${originalUserMessage}"\n\n`
          : `Original user message: "${originalUserMessage}"\n\n`)
      : '';

    const userContent = contextPrefix + actionRequests.map(req => {
      return 'Aktion: ' + req.type + '\nBeschreibung: ' + req.description;
    }).join('\n---\n');

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];

    // Function Calling options: all 18 action tools, force a call
    const options: ChatOptions = {
      tools: getActionTools(),
      tool_choice: 'required',
    };

    // Non-streaming call (System Agent is not user-facing)
    const response = await provider.chat(messages, undefined, options);

    // Check for tool_calls in response
    if (!response.tool_calls?.length) {
      console.warn('[SystemAgent] No tool_calls in response. Content:', response.content?.slice(0, 200));
      return {
        success: false,
        error: 'no_tool_call',
        userMessage: language === 'de'
          ? 'Die Aktion konnte nicht verarbeitet werden. Versuche es nochmal.'
          : 'The action could not be processed. Please try again.',
      };
    }

    // Parse tool_calls into action format
    const rawActions = parseToolCalls(response.tool_calls);

    if (rawActions.length === 0) {
      return {
        success: false,
        error: 'no_tool_call',
        userMessage: language === 'de'
          ? 'Die Tool-Antwort konnte nicht gelesen werden.'
          : 'Could not parse the tool response.',
      };
    }

    // Validate each action via Zod schemas (double safety)
    const validatedActions: ParsedAction[] = [];
    const errors: string[] = [];

    for (const raw of rawActions) {
      const validation = validateAction(raw.type as ActionType, raw.data);

      if (validation.success) {
        validatedActions.push({
          type: raw.type as ActionType,
          data: validation.data,
          rawJson: raw.rawJson,
        });
      } else {
        const fieldErrors = validation.errors?.join(', ') ?? 'Unknown validation error';
        errors.push(raw.type + ': ' + fieldErrors);
        console.warn('[SystemAgent] Validation failed for', raw.type, ':', validation.errors);
      }
    }

    // Telemetry: log completeness for training plans (helps diagnose multi-day issues)
    for (const a of validatedActions) {
      if (a.type === 'save_training_plan') {
        const d = a.data as { days_per_week?: number; days?: unknown[] };
        const expected = d.days_per_week ?? 0;
        const actual = Array.isArray(d.days) ? d.days.length : 0;
        if (expected > 0 && actual < expected) {
          console.warn('[SystemAgent] ⚠️ Training plan incomplete: expected', expected, 'days, got', actual);
        } else {
          console.log('[SystemAgent] ✓ Training plan complete:', actual, '/', expected, 'days,', Date.now() - startTime, 'ms');
        }
      }
    }

    // If some actions validated, return them (partial success)
    if (validatedActions.length > 0) {
      if (errors.length > 0) {
        console.warn('[SystemAgent] Partial validation:', validatedActions.length, 'ok,', errors.length, 'failed');
      }
      return {
        success: true,
        actions: validatedActions,
      };
    }

    // All validations failed
    return {
      success: false,
      error: 'validation_failed',
      userMessage: language === 'de'
        ? 'Die Daten konnten nicht validiert werden. Bitte pruefe deine Angaben.'
        : 'The data could not be validated. Please check your input.',
      details: errors.join('; '),
    };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[SystemAgent] Provider error:', message);

    return {
      success: false,
      error: 'provider_error',
      userMessage: language === 'de'
        ? 'KI-Fehler: ' + message
        : 'AI error: ' + message,
    };
  }
}

/**
 * Check if the current provider supports Function Calling (tools).
 * Only OpenAI-compatible providers support this.
 * Ollama does NOT support Function Calling.
 */
export function providerSupportsTools(provider: AIProvider): boolean {
  const name = provider.getName().toLowerCase();
  return name.includes('openai') || name.includes('supabase') || name.includes('gpt');
}
