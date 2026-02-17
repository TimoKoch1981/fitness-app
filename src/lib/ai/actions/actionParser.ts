/**
 * Action Parser — extracts structured actions from LLM responses.
 *
 * LLMs include an ACTION block at the end of their response when they
 * detect that the user wants to log data:
 *
 * ```ACTION:log_meal
 * {"name":"Hähnchen mit Reis","type":"lunch","calories":755,...}
 * ```
 *
 * This parser:
 * 1. Detects the ACTION block via regex
 * 2. Extracts the action type and JSON payload
 * 3. Validates with Zod schemas
 * 4. Returns a ParsedAction or null
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
];

/**
 * Regex to match ACTION blocks in LLM output.
 * Matches: ```ACTION:<type>\n<json>\n```
 * Also handles variations like ```action:... or extra whitespace.
 */
const ACTION_BLOCK_REGEX = /```ACTION:(\w+)\s*\n([\s\S]*?)```/i;

/**
 * Parse an action from the LLM response text.
 * Returns null if no valid action block is found.
 */
export function parseActionFromResponse(text: string): ParsedAction | null {
  const match = text.match(ACTION_BLOCK_REGEX);
  if (!match) return null;

  const rawType = match[1].toLowerCase();
  const rawJson = match[2].trim();

  // Validate action type
  if (!VALID_ACTIONS.includes(rawType as ActionType)) {
    console.warn(`[ActionParser] Unknown action type: ${rawType}`);
    return null;
  }

  const actionType = rawType as ActionType;

  // Parse JSON
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(rawJson);
  } catch (e) {
    console.warn(`[ActionParser] Invalid JSON in action block:`, e);
    return null;
  }

  // Validate with Zod schema
  const validation = validateAction(actionType, data);
  if (!validation.success) {
    console.warn(`[ActionParser] Validation failed for ${actionType}:`, validation.errors);
    return null;
  }

  return {
    type: actionType,
    data: validation.data,
    rawJson,
  };
}

/**
 * Remove the ACTION block from the response text for clean display.
 * The user sees only the conversational text, not the JSON block.
 */
export function stripActionBlock(text: string): string {
  return text.replace(ACTION_BLOCK_REGEX, '').trim();
}
