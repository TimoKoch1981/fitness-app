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
  if (language === 'de') {
    return [
      '## System-Steuerungs-Agent',
      '',
      'Du bist der System-Agent der FitBuddy-App. Deine einzige Aufgabe:',
      'Wandle die Beschreibung des Experten-Agents in einen praezisen Function Call um.',
      '',
      '### Regeln:',
      '1. Rufe GENAU EINE Funktion auf (die zum Typ passt)',
      '2. Extrahiere ALLE genannten Werte aus der Beschreibung',
      '3. Verwende sinnvolle Defaults fuer fehlende Felder:',
      '   - date: heutiges Datum (YYYY-MM-DD)',
      '   - time: aktuelle Uhrzeit (HH:MM)',
      '   - source: "ai"',
      '4. Runde Naehrwerte auf ganze Zahlen',
      '5. Bei mehreren Aktionen: rufe mehrere Funktionen auf',
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
    'Convert the expert agent description into a precise function call.',
    '',
    '### Rules:',
    '1. Call EXACTLY ONE function (matching the type)',
    '2. Extract ALL mentioned values from the description',
    '3. Use sensible defaults for missing fields:',
    '   - date: today (YYYY-MM-DD)',
    '   - time: current time (HH:MM)',
    '   - source: "ai"',
    '4. Round nutritional values to whole numbers',
    '5. For multiple actions: call multiple functions',
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
 * @returns SystemAgentResult with validated ParsedAction[] or error info
 */
export async function executeSystemAgent(
  actionRequests: ActionRequest[],
  provider: AIProvider,
  language: string = 'de',
): Promise<SystemAgentResult> {
  try {
    // Build messages for the System Agent
    const systemPrompt = buildSystemPrompt(language);

    // Combine all action requests into one user message
    const userContent = actionRequests.map(req => {
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
