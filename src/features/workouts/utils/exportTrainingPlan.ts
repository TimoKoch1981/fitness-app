/**
 * Training Plan Export Utilities — Text + JSON export for sharing.
 *
 * Generates shareable text or JSON representations of a training plan.
 * Used by ShareTrainingPlanDialog for clipboard, QR code, and link sharing.
 */

import type { TrainingPlan, PlanExercise } from '../../../types/health';

/**
 * Serialize a training plan to a compact JSON string for sharing.
 * Strips IDs and user-specific data, keeps only the plan structure.
 */
export function planToShareJSON(plan: TrainingPlan): string {
  const sharePlan = {
    n: plan.name,
    s: plan.split_type,
    d: plan.days_per_week,
    no: plan.notes || undefined,
    days: plan.days?.map(day => ({
      dn: day.day_number,
      nm: day.name,
      f: day.focus || undefined,
      no: day.notes || undefined,
      ex: day.exercises.map(ex => compactExercise(ex)),
    })),
  };

  return JSON.stringify(sharePlan);
}

function compactExercise(ex: PlanExercise): Record<string, unknown> {
  const compact: Record<string, unknown> = { n: ex.name };
  if (ex.sets != null) compact.s = ex.sets;
  if (ex.reps != null) compact.r = ex.reps;
  if (ex.weight_kg != null) compact.w = ex.weight_kg;
  if (ex.rest_seconds != null) compact.rs = ex.rest_seconds;
  if (ex.duration_minutes != null) compact.dm = ex.duration_minutes;
  if (ex.distance_km != null) compact.dk = ex.distance_km;
  if (ex.pace) compact.p = ex.pace;
  if (ex.intensity) compact.i = ex.intensity;
  if (ex.exercise_type) compact.et = ex.exercise_type;
  if (ex.notes) compact.no = ex.notes;
  return compact;
}

/**
 * Generate a human-readable text representation of a training plan.
 * Suitable for copying to clipboard or sharing via messaging apps.
 */
export function planToText(plan: TrainingPlan, language: string): string {
  const isDE = language === 'de';
  const lines: string[] = [];

  // Header
  lines.push(`📋 ${plan.name}`);
  lines.push(`${plan.days_per_week}x / ${isDE ? 'Woche' : 'Week'}`);
  if (plan.notes) lines.push(plan.notes);
  lines.push('');

  // Days
  plan.days?.forEach(day => {
    lines.push(`━━━ ${isDE ? 'Tag' : 'Day'} ${day.day_number}: ${day.name} ━━━`);
    if (day.focus) lines.push(`🎯 ${day.focus}`);
    lines.push('');

    day.exercises.forEach((ex, idx) => {
      const details = formatExerciseText(ex);
      lines.push(`  ${idx + 1}. ${ex.name}${details ? ' — ' + details : ''}`);
    });

    if (day.notes) lines.push(`\n  📝 ${day.notes}`);
    lines.push('');
  });

  // Footer
  lines.push(`${isDE ? 'Erstellt mit FitBuddy' : 'Made with FitBuddy'} 💪`);

  return lines.join('\n');
}

function formatExerciseText(ex: PlanExercise): string {
  const parts: string[] = [];

  if (ex.sets != null && ex.reps != null) {
    parts.push(`${ex.sets}×${ex.reps}`);
  }
  if (ex.weight_kg != null) {
    parts.push(`${ex.weight_kg}kg`);
  }
  if (ex.duration_minutes != null) {
    parts.push(`${ex.duration_minutes} Min`);
  }
  if (ex.distance_km != null) {
    parts.push(`${ex.distance_km} km`);
  }
  if (ex.pace) {
    parts.push(`@ ${ex.pace}`);
  }
  if (ex.intensity) {
    parts.push(`(${ex.intensity})`);
  }

  return parts.join(' · ');
}

/**
 * Encode a plan to a base64 URL parameter.
 * Note: Large plans may exceed URL length limits (~2KB).
 */
export function planToBase64(plan: TrainingPlan): string {
  const json = planToShareJSON(plan);
  return btoa(unescape(encodeURIComponent(json)));
}

/**
 * Generate a share URL with the plan data encoded in the hash.
 * Uses hash instead of query params to avoid server-side length limits.
 */
export function planToShareURL(plan: TrainingPlan): string {
  const base64 = planToBase64(plan);
  // Use the current origin, or fallback to fitbuddy.app
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://fitbuddy.app';
  return `${origin}/import-plan#${base64}`;
}
