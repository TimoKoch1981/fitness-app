/**
 * Action-Pipeline-Telemetrie (P0-1).
 *
 * Logs every step of the LLM-driven action lifecycle into `ai_action_logs`
 * so we can finally answer questions like:
 *   - "What is the success rate of `log_meal` over the last 24h?"
 *   - "Which of the 7 fallback paths in useBuddyChat still fire?"
 *   - "What error_codes dominate the failures?"
 *
 * Design principles:
 *   - Fire-and-forget. A telemetry failure must NEVER break a user flow.
 *   - DSGVO: NO user content (no meal names, no body values). Only structure.
 *   - Trunc error_detail to 500 chars (defensive).
 *   - All inserts are async, errors only logged to console.warn.
 *
 * @see supabase/migrations/20260512000001_ai_action_logs.sql
 */

import { supabase } from '../supabase';
import type { ActionType } from '../ai/actions/types';

// ── Types ──────────────────────────────────────────────────────────────

export type ActionPhase = 'parse' | 'validate' | 'execute';
export type ActionStatus = 'attempted' | 'success' | 'failed';

/** Which path in useBuddyChat parsed the action out of the LLM response. */
export type ParsingPath =
  | 'fc'                       // Function Calling via SystemAgent (preferred)
  | 'direct_json'              // Direct JSON.parse from ACTION_REQUEST block (fallback)
  | 'regex'                    // parseAllActionsFromResponse legacy regex
  | 'text_heuristic_search'    // search_product extracted from prose
  | 'text_heuristic_body'      // log_body extracted from "X kg" mention
  | 'text_heuristic_tour'      // restart_tour extracted from prose
  | 'agent_claim_no_block';    // Nutrition agent claimed saved but no action block found

export type ErrorCode =
  | 'no_tool_call'              // SystemAgent returned content but no tool_calls
  | 'validation_failed'         // Zod schema validation rejected the input
  | 'auth_error'                // Session expired / not authenticated
  | 'rls_error'                 // RLS policy denied
  | 'mutation_error'            // Generic mutation error (DB, network, etc.)
  | 'duplicate_idempotency'     // Skipped via idempotency cache
  | 'agent_no_action_block'     // Agent produced no ACTION_REQUEST block at all
  | 'date_clamped'              // clampDate silently corrected a bad date
  | 'provider_error'            // AIProvider threw (timeout, 5xx, etc.)
  | 'unknown';

export interface LogActionEventParams {
  actionType: ActionType | string;
  phase: ActionPhase;
  status: ActionStatus;
  /** Required when phase==='parse'. */
  parsingPath?: ParsingPath;
  /** Required when status==='failed' (or for any other event worth tagging). */
  errorCode?: ErrorCode;
  /** Short, structured error explanation. Truncated to 500 chars. */
  errorDetail?: string;
  /** Wall-clock latency from caller's start time, in ms. */
  latencyMs?: number;
  /** Which expert agent owned the response. */
  agentType?: string;
  /** Free-form structured metadata (e.g. { expected_days: 4, actual_days: 2 }). */
  metadata?: Record<string, unknown>;
}

// ── Truncation helper (defensive) ──────────────────────────────────────

const MAX_DETAIL_CHARS = 500;

function trunc(s: string | undefined): string | null {
  if (!s) return null;
  if (s.length <= MAX_DETAIL_CHARS) return s;
  return s.slice(0, MAX_DETAIL_CHARS - 1) + '…';
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Log a single action-pipeline event. Fire-and-forget.
 *
 * Resolves quickly even on network/DB failure; errors only land in console.warn.
 * Awaiting is optional — callers that don't care about ordering can ignore the promise.
 */
export async function logActionEvent(params: LogActionEventParams): Promise<void> {
  try {
    // Resolve user_id lazily so callers don't have to pass it
    const { data: { user } } = await supabase.auth.getUser();

    const row = {
      user_id: user?.id ?? null,
      action_type: params.actionType,
      phase: params.phase,
      status: params.status,
      parsing_path: params.parsingPath ?? null,
      error_code: params.errorCode ?? null,
      error_detail: trunc(params.errorDetail),
      latency_ms: params.latencyMs ?? null,
      agent_type: params.agentType ?? null,
      metadata: params.metadata ?? null,
    };

    const { error } = await supabase.from('ai_action_logs').insert(row);
    if (error) {
      console.warn('[actionLog] insert failed:', error.message);
    }
  } catch (err) {
    // Never let telemetry break the caller
    console.warn('[actionLog] unexpected error:', err);
  }
}

/**
 * Convenience builder: starts a timer, returns a function that logs the end-event
 * with the elapsed latency. Use for execute/validate phases.
 *
 * Example:
 *   const finish = startActionTimer({ actionType: 'log_meal', phase: 'execute' });
 *   try {
 *     await doTheWork();
 *     finish({ status: 'success' });
 *   } catch (e) {
 *     finish({ status: 'failed', errorCode: 'mutation_error', errorDetail: String(e) });
 *   }
 */
export function startActionTimer(
  base: Pick<LogActionEventParams, 'actionType' | 'phase' | 'agentType'>,
): (rest: Omit<LogActionEventParams, 'actionType' | 'phase' | 'agentType' | 'latencyMs'>) => void {
  const t0 = Date.now();
  return (rest) => {
    void logActionEvent({
      ...base,
      ...rest,
      latencyMs: Date.now() - t0,
    });
  };
}
