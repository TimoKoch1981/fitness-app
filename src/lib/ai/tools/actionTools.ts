/**
 * OpenAI Function Calling tool definitions, generated from the ActionRegistry.
 *
 * The registry (populated in `registerDefaults.ts`) is the **single source of
 * truth** for every action: its Zod schemas, descriptions, display info, and
 * execute function all live there. This file just converts the registry's
 * tool schemas into the OpenAI-compatible JSON-Schema shape that gets shipped
 * to the model.
 *
 * Used by both the OpenAI and the Anthropic path — the ai-proxy maps the
 * OpenAI tool format to Anthropic's `input_schema` server-side.
 *
 * Previously this file also held a 270-LOC duplicate of every tool schema
 * as a static fallback. P0-4 (v14.6) deleted that fallback after verifying
 * the registry is always populated before any caller asks for tools.
 *
 * @see https://platform.openai.com/docs/guides/function-calling
 */

import { z } from 'zod';
import type { ActionType } from '../actions/types';
import { actionRegistry } from '../actions/registry';
import type { ToolCall } from '../types';
export type { ToolCall };

// ── Types ──────────────────────────────────────────────────────────────

/** OpenAI Function Calling tool definition */
export interface ToolDefinition {
  type: `function`;
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    strict?: boolean;
  };
}

// ── Tool generation ────────────────────────────────────────────────────

/** All action tools for OpenAI Function Calling */
let _cachedTools: ToolDefinition[] | null = null;

/**
 * Get all action tool definitions for passing to OpenAI.
 *
 * Reads exclusively from the ActionRegistry. If the registry is empty
 * (e.g. someone forgot to call `registerDefaultActions()` at app startup),
 * we throw loudly rather than silently returning an empty array — a silent
 * empty here would cascade into "agent claimed saved but no action parsed"
 * and we'd never find the root cause.
 *
 * Cached because schemas are static after registration.
 */
export function getActionTools(): ToolDefinition[] {
  if (_cachedTools) return _cachedTools;

  const registrySchemas = actionRegistry.getAllToolSchemas();
  const registryDescriptions = actionRegistry.getAllToolDescriptions();

  if (Object.keys(registrySchemas).length === 0) {
    throw new Error(
      '[actionTools] ActionRegistry is empty. Was registerDefaultActions() called at startup? '
      + 'Check src/main.tsx for the registration call.',
    );
  }

  _cachedTools = Object.entries(registrySchemas).map(([name, schema]) => {
    const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
    // OpenAI doesn't want $schema in the top level
    const { $schema: _ignored, ...params } = jsonSchema;
    return {
      type: 'function' as const,
      function: {
        name,
        description: registryDescriptions[name] ?? '',
        parameters: params,
      },
    };
  });

  return _cachedTools;
}

/**
 * Get tool definitions for a specific subset of action types.
 * Useful for restricting which actions the System-Agent can invoke.
 */
export function getActionToolsForTypes(types: ActionType[]): ToolDefinition[] {
  return getActionTools().filter(tool => types.includes(tool.function.name as ActionType));
}

/**
 * Parse tool_calls from an OpenAI response into ParsedAction-compatible format.
 * Returns an array of { type, data } objects ready for validation via schemas.ts.
 */
export function parseToolCalls(toolCalls: ToolCall[]): Array<{ type: ActionType; data: Record<string, unknown>; rawJson: string }> {
  return toolCalls
    .filter(tc => tc.type === `function`)
    .map(tc => {
      const name = tc.function.name as ActionType;
      const rawJson = tc.function.arguments;
      try {
        const data = JSON.parse(rawJson) as Record<string, unknown>;
        return { type: name, data, rawJson };
      } catch {
        console.error('[actionTools] Failed to parse tool_call arguments:', rawJson.slice(0, 200));
        return null;
      }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

/** Test-only: reset the tool cache so suite runs without state leaking between tests. */
export function _resetToolCacheForTests(): void {
  _cachedTools = null;
}
