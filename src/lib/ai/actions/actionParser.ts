/**
 * Action Parser — extracts structured actions from LLM responses.
 *
 * LLMs include ACTION blocks at the end of their response when they
 * detect that the user wants to log data:
 *
 * ```ACTION:log_meal
 * {"name":"Hähnchen mit Reis","type":"lunch","calories":755,...}
 * ```
 *
 * Supports MULTIPLE ACTION blocks per response — e.g. when the user
 * describes breakfast + lunch in one message, or a meal + substance.
 *
 * This parser:
 * 1. Detects ALL ACTION blocks via regex (matchAll)
 * 2. Extracts the action type and JSON payload for each
 * 3. Validates each with Zod schemas
 * 4. Returns ParsedAction[] (array) — empty if none found
 */

import type { ActionType, ParsedAction } from './types';
import { validateAction } from './schemas';

/** All valid action types */
const VALID_ACTIONS: ActionType[] = [
  'log_meal',
  'log_workout',
  'log_body',
  'log_blood_pressure',
  'log_substance',
  'save_training_plan',
];

/**
 * Regex to match ACTION blocks in LLM output.
 * Matches: ```ACTION:<type>\n<json>\n```
 * Also handles variations like ```action:... or extra whitespace.
 * Global flag enables matchAll() for multiple blocks.
 */
const ACTION_BLOCK_REGEX = /```ACTION:(\w+)\s*\n([\s\S]*?)```/gi;

/**
 * Parse ALL actions from the LLM response text.
 * Returns an array of ParsedAction objects (empty if none found).
 */
export function parseAllActionsFromResponse(text: string): ParsedAction[] {
  const actions: ParsedAction[] = [];

  // Debug: log response length and whether it contains ACTION markers
  const hasActionMarker = /ACTION:/i.test(text);
  console.log(`[ActionParser] Response length: ${text.length} chars, contains ACTION: ${hasActionMarker}`);
  if (hasActionMarker && text.length > 100) {
    // Show last 80 chars to detect truncation
    console.log(`[ActionParser] Response tail: ...${text.slice(-80)}`);
  }

  const matches = text.matchAll(ACTION_BLOCK_REGEX);

  for (const match of matches) {
    const rawType = match[1].toLowerCase();
    const rawJson = match[2].trim();

    // Validate action type
    if (!VALID_ACTIONS.includes(rawType as ActionType)) {
      console.warn(`[ActionParser] Unknown action type: ${rawType}`);
      continue;
    }

    const actionType = rawType as ActionType;

    // Parse JSON
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawJson);
    } catch (e) {
      console.warn(`[ActionParser] Invalid JSON in action block:`, e);
      continue;
    }

    // Validate with Zod schema
    const validation = validateAction(actionType, data);
    if (!validation.success) {
      console.warn(`[ActionParser] Validation failed for ${actionType}:`, validation.errors);
      continue;
    }

    actions.push({
      type: actionType,
      data: validation.data,
      rawJson,
    });
  }

  console.log(`[ActionParser] Parsed ${actions.length} action(s):`, actions.map(a => a.type));
  return actions;
}

/**
 * Parse the FIRST action from the LLM response text (backwards compat).
 * Returns null if no valid action block is found.
 */
export function parseActionFromResponse(text: string): ParsedAction | null {
  const actions = parseAllActionsFromResponse(text);
  return actions.length > 0 ? actions[0] : null;
}

/**
 * Remove ALL ACTION blocks from the response text for clean display.
 * The user sees only the conversational text, not the JSON blocks.
 */
export function stripActionBlock(text: string): string {
  return text.replace(ACTION_BLOCK_REGEX, '').trim();
}
