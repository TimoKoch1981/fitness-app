/**
 * Action system types for chat-to-database data capture.
 *
 * When an agent detects that the user wants to LOG something (meal, workout, etc.),
 * it includes a structured ACTION block in its response. The action parser extracts
 * this, validates it, and presents a confirmation banner to the user.
 */

import { actionRegistry } from './registry';

/** Supported action types — map to existing Supabase mutation hooks */
export type ActionType =
  | 'log_meal'
  | 'log_workout'
  | 'log_body'
  | 'log_blood_pressure'
  | 'log_blood_work'
  | 'log_substance'
  | 'log_water'
  | 'save_training_plan'
  | 'add_training_day'
  | 'modify_training_day'
  | 'remove_training_day'
  | 'save_product'
  | 'add_substance'
  | 'add_reminder'
  | 'update_profile'
  | 'update_equipment'
  | 'search_product'
  | 'restart_tour'
  | 'save_recipe'
  | 'import_recipe'
  | 'update_pantry';

/** Action types that are auto-executed (no user confirmation needed) */
export const AUTO_EXECUTE_ACTIONS: ActionType[] = ['search_product', 'restart_tour', 'log_water'];

/** Parsed action extracted from an LLM response */
export interface ParsedAction {
  type: ActionType;
  data: Record<string, unknown>;
  rawJson: string;
}

/** Lifecycle status of a pending action */
export type ActionStatus =
  | 'pending'    // action parsed, waiting for user confirmation
  | 'executing'  // user confirmed, mutation in progress
  | 'executed'   // successfully saved to database
  | 'failed'     // mutation failed
  | 'rejected';  // user dismissed the action

/** Display info for the confirmation banner */
export interface ActionDisplayInfo {
  icon: string;
  title: string;       // e.g. "Mahlzeit speichern?"
  summary: string;     // e.g. "Hähnchen mit Reis — 755 kcal | 98g P"
}

/**
 * Map action types to their display info.
 *
 * Single source of truth: the ActionRegistry (populated by
 * registerDefaultActions() at app startup). P0-4 (v14.6) deleted the
 * 140-LOC switch-case fallback that used to live here — any unknown
 * action type now falls through to a generic display rather than being
 * duplicated. If you need to add display info for a new action,
 * register it in registerDefaults.ts.
 */
export function getActionDisplayInfo(action: ParsedAction): ActionDisplayInfo {
  const fromRegistry = actionRegistry.getDisplayInfo(action.type, action.data as Record<string, unknown>);
  if (fromRegistry) return fromRegistry;

  // Unknown action type — shouldn't happen in practice, but degrade gracefully
  return {
    icon: '⚡',
    title: action.type,
    summary: '',
  };
}
