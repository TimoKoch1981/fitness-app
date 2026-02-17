/**
 * Action system types for chat-to-database data capture.
 *
 * When an agent detects that the user wants to LOG something (meal, workout, etc.),
 * it includes a structured ACTION block in its response. The action parser extracts
 * this, validates it, and presents a confirmation banner to the user.
 */

/** Supported action types — map to existing Supabase mutation hooks */
export type ActionType =
  | 'log_meal'
  | 'log_workout'
  | 'log_body'
  | 'log_blood_pressure'
  | 'log_substance'
  | 'save_training_plan';

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

/** Map action types to their display info */
export function getActionDisplayInfo(action: ParsedAction): ActionDisplayInfo {
  const d = action.data;
  switch (action.type) {
    case 'log_meal':
      return {
        icon: '🍽️',
        title: 'Mahlzeit speichern?',
        summary: `${d.name ?? 'Mahlzeit'} — ${d.calories ?? '?'} kcal | ${d.protein ?? '?'}g P`,
      };
    case 'log_workout':
      return {
        icon: '💪',
        title: 'Training speichern?',
        summary: `${d.name ?? 'Workout'}${d.duration_minutes ? ` — ${d.duration_minutes} Min` : ''}`,
      };
    case 'log_body':
      return {
        icon: '⚖️',
        title: 'Körperwerte speichern?',
        summary: [
          d.weight_kg ? `${d.weight_kg} kg` : null,
          d.body_fat_pct ? `${d.body_fat_pct}% KFA` : null,
        ].filter(Boolean).join(', ') || 'Körpermessung',
      };
    case 'log_blood_pressure':
      return {
        icon: '❤️',
        title: 'Blutdruck speichern?',
        summary: `${d.systolic ?? '?'}/${d.diastolic ?? '?'} mmHg${d.pulse ? ` | Puls ${d.pulse}` : ''}`,
      };
    case 'log_substance':
      return {
        icon: '💊',
        title: 'Einnahme loggen?',
        summary: `${d.substance_name ?? 'Substanz'}${d.dosage_taken ? ` — ${d.dosage_taken}` : ''}`,
      };
    case 'save_training_plan':
      return {
        icon: '📋',
        title: 'Trainingsplan speichern?',
        summary: `${d.name ?? 'Plan'} — ${(d.days as any[])?.length ?? '?'} Tage`,
      };
  }
}
