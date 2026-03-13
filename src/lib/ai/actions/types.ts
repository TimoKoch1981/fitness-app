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
  | 'restart_tour';

/** Action types that are auto-executed (no user confirmation needed) */
export const AUTO_EXECUTE_ACTIONS: ActionType[] = ['search_product', 'restart_tour'];

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
  // Try registry first (Phase 1 ActionRegistry — populated at app startup)
  const fromRegistry = actionRegistry.getDisplayInfo(action.type, action.data as Record<string, unknown>);
  if (fromRegistry) return fromRegistry;

  // Fallback: static switch-case (backward compatibility)
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
    case 'log_blood_work':
      return {
        icon: '🩸',
        title: 'Blutwerte speichern?',
        summary: [
          d.testosterone_total ? `Test ${d.testosterone_total} ng/dL` : null,
          d.hematocrit ? `HCT ${d.hematocrit}%` : null,
          d.hemoglobin ? `Hb ${d.hemoglobin}` : null,
          d.hdl ? `HDL ${d.hdl}` : null,
          d.ldl ? `LDL ${d.ldl}` : null,
          d.alt ? `ALT ${d.alt}` : null,
          d.creatinine ? `Krea ${d.creatinine}` : null,
          d.fasting_glucose ? `Gluc ${d.fasting_glucose}` : null,
          d.iron ? `Fe ${d.iron}` : null,
          d.cortisol ? `Cort ${d.cortisol}` : null,
          d.tsh ? `TSH ${d.tsh}` : null,
          d.hba1c ? `HbA1c ${d.hba1c}%` : null,
          d.vitamin_d ? `VitD ${d.vitamin_d}` : null,
        ].filter(Boolean).slice(0, 5).join(', ') || 'Blutwerte',
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
        summary: `${d.name ?? 'Plan'} — ${(d.days as unknown[])?.length ?? '?'} Tage`,
      };
    case 'add_training_day':
      return {
        icon: '📅',
        title: 'Trainingstag hinzufügen?',
        summary: `Tag ${d.day_number ?? '?'}: ${d.name ?? 'Neuer Tag'} — ${(d.exercises as unknown[])?.length ?? '?'} Übungen`,
      };
    case 'modify_training_day':
      return {
        icon: '✏️',
        title: 'Trainingstag anpassen?',
        summary: `Tag ${d.day_number ?? '?'}${d.name ? `: ${d.name}` : ''} — ${(d.exercises as unknown[])?.length ?? '?'} Übungen`,
      };
    case 'remove_training_day':
      return {
        icon: '🗑️',
        title: 'Trainingstag entfernen?',
        summary: `Tag ${d.day_number ?? '?'}${d.day_name ? `: ${d.day_name}` : ''}`,
      };
    case 'save_product':
      return {
        icon: '📦',
        title: 'Produkt speichern?',
        summary: `${d.name ?? 'Produkt'} — ${d.serving_size_g ?? '?'}g — ${d.calories_per_serving ?? '?'} kcal | ${d.protein_per_serving ?? '?'}g P`,
      };
    case 'add_substance':
      return {
        icon: '💊',
        title: 'Substanz anlegen?',
        summary: `${d.name ?? 'Substanz'}${d.dosage ? ` — ${d.dosage}${d.unit ?? ''}` : ''} (${d.category ?? 'Sonstige'})`,
      };
    case 'add_reminder':
      return {
        icon: '🔔',
        title: 'Erinnerung anlegen?',
        summary: `${d.title ?? 'Erinnerung'}${d.time_period ? ` — ${d.time_period}` : ''}${d.repeat_mode === 'interval' && d.interval_days ? ` — alle ${d.interval_days} Tage` : ''}`,
      };
    case 'update_profile':
      return {
        icon: '👤',
        title: 'Profil aktualisieren?',
        summary: [
          d.height_cm ? `${d.height_cm} cm` : null,
          d.birth_year ? `Jg. ${d.birth_year}` : null,
          d.gender ? `${d.gender}` : null,
          d.activity_level ? `PAL ${d.activity_level}` : null,
        ].filter(Boolean).join(', ') || 'Profil-Update',
      };
    case 'update_equipment':
      return {
        icon: '🏋️',
        title: 'Gerätepark aktualisieren?',
        summary: `${(d.equipment_names as string[])?.length ?? '?'} Geräte`,
      };
    case 'search_product':
      return {
        icon: '🔍',
        title: 'Produkt wird recherchiert...',
        summary: `Suche nach "${d.query ?? 'Produkt'}"`,
      };
    case 'restart_tour':
      return {
        icon: '🎯',
        title: 'Produkttour wird gestartet...',
        summary: 'Tour wird neu gestartet',
      };
  }
}
