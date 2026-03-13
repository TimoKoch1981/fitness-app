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
import { actionRegistry } from './registry';

// ── JSON Repair for truncated ACTION blocks ──────────────────────────

/**
 * Attempt to repair truncated JSON (common with large training plan ACTIONs).
 * The LLM may run out of tokens mid-JSON, leaving unclosed braces/brackets.
 * Strategy: count open/close braces and brackets, append missing closers.
 */
function attemptJsonRepair(rawJson: string): Record<string, unknown> | null {
  let json = rawJson.trim();
  if (!json.startsWith('{')) return null;

  // Remove trailing commas before we try to close
  json = json.replace(/,\s*$/, '');

  // Count unmatched braces and brackets (ignoring those inside strings)
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (const ch of json) {
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') openBraces++;
    if (ch === '}') openBraces--;
    if (ch === '[') openBrackets++;
    if (ch === ']') openBrackets--;
  }

  // If already balanced, something else is wrong
  if (openBraces === 0 && openBrackets === 0) return null;

  // If inside a string, close it first
  if (inString) json += '"';

  // Remove any trailing incomplete key-value pairs (e.g., `"name":` without value)
  json = json.replace(/,?\s*"[^"]*"\s*:\s*$/, '');
  // Remove trailing incomplete string values (e.g., `"name": "Knie`)
  json = json.replace(/,?\s*"[^"]*"\s*:\s*"[^"]*$/, '');

  // Close brackets then braces
  for (let i = 0; i < openBrackets; i++) json += ']';
  for (let i = 0; i < openBraces; i++) json += '}';

  try {
    return JSON.parse(json);
  } catch {
    // Second attempt: more aggressive truncation — remove last incomplete element in arrays
    const lastBracket = json.lastIndexOf('[');
    if (lastBracket > 0) {
      // Try truncating the last array element
      const beforeBracket = json.substring(0, lastBracket + 1);
      const afterBracket = json.substring(lastBracket + 1);
      const lastCompleteComma = afterBracket.lastIndexOf('},');
      if (lastCompleteComma >= 0) {
        const repaired = beforeBracket + afterBracket.substring(0, lastCompleteComma + 1) + ']}';
        // Re-count and close
        let ob = 0, obk = 0;
        let ins = false, esc = false;
        for (const ch of repaired) {
          if (esc) { esc = false; continue; }
          if (ch === '\\') { esc = true; continue; }
          if (ch === '"') { ins = !ins; continue; }
          if (ins) continue;
          if (ch === '{') ob++;
          if (ch === '}') ob--;
          if (ch === '[') obk++;
          if (ch === ']') obk--;
        }
        let finalJson = repaired;
        for (let i = 0; i < obk; i++) finalJson += ']';
        for (let i = 0; i < ob; i++) finalJson += '}';
        try {
          return JSON.parse(finalJson);
        } catch { /* give up */ }
      }
    }
    return null;
  }
}

/** All valid action types — derived from ActionRegistry if available, static fallback otherwise */

function getValidActions(): ActionType[] {
  // Primary: from registry (all registered types)
  const fromRegistry = actionRegistry.getAll().map(d => d.type);
  if (fromRegistry.length > 0) return fromRegistry;
  // Fallback: static list (should never reach here after registerDefaultActions)
  return [
    'log_meal', 'log_workout', 'log_body', 'log_blood_pressure',
    'log_blood_work', 'log_substance', 'save_training_plan',
    'add_training_day', 'modify_training_day', 'remove_training_day',
    'save_product', 'add_substance', 'add_reminder',
    'update_profile', 'update_equipment', 'search_product', 'restart_tour',
    'save_recipe',
  ];
}
const VALID_ACTIONS: ActionType[] = getValidActions();

/**
 * Regex to match ACTION blocks in LLM output.
 * Matches multiple formats LLMs might produce:
 * - ```ACTION:type\n{json}```       (standard)
 * - ```action:type\n{json}\n```     (lowercase + trailing newline)
 * - ```ACTION:type {json}```        (no newline after type)
 * - ```ACTION:type\n{json}          (missing closing backticks — streaming cutoff)
 * Global flag enables matchAll() for multiple blocks.
 */
const ACTION_BLOCK_REGEX = /```\s*ACTION:(\w+)[\s\n]+([\s\S]*?)(?:\n```|```|$)/gi;

/**
 * Parse ALL actions from the LLM response text.
 * Returns an array of ParsedAction objects (empty if none found).
 */
export function parseAllActionsFromResponse(text: string): ParsedAction[] {
  const actions: ParsedAction[] = [];

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

    // Parse JSON (with repair attempt for truncated blocks like training plans)
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(rawJson);
    } catch (e) {
      // Attempt repair for truncated JSON (common with large ACTION blocks)
      const repaired = attemptJsonRepair(rawJson);
      if (repaired) {
        console.warn(`[ActionParser] Repaired truncated JSON for ${actionType}`);
        data = repaired;
      } else {
        console.warn(`[ActionParser] Invalid JSON in action block (${actionType}), repair failed:`, e);
        console.warn(`[ActionParser] Raw JSON (first 500 chars): ${rawJson.slice(0, 500)}`);
        continue;
      }
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

  // Only log when actions were found (reduces console noise in production)
  if (actions.length > 0) {
    console.log(`[ActionParser] Parsed ${actions.length} action(s):`, actions.map(a => a.type));
  }
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
