/**
 * B23 — Gewichte nicht sichtbar / nicht eingebbar / Last-Weight-Memory weg.
 *
 * Bug: In aktiver Workout-Session werden Gewichte nicht angezeigt; Eingabe
 * geht nicht; Vorbefuellung aus letzten Sessions greift nicht.
 *
 * Root-Hypothese (siehe REGRESSION_TRIAGE_2026-05-17.md): Die 3-stufige
 * Fallback-Kette in buildExercisesFromPlan landet bei `targetWeightKg = undefined`,
 * wenn (a) der Plan kein `weight_kg` hat, (b) keine Cross-Plan-History existiert,
 * (c) `suggestExerciseDefaults` fuer unbekannte Uebungen `undefined` zurueckliefert.
 *
 * Mit `targetWeightKg = undefined` triggern Tracker den `noWeight`-Branch
 * (`exercise.sets.every(s => s.target_weight_kg == null)`) und blenden Spalte
 * + Input komplett aus. Der User kann nichts eingeben.
 *
 * Test-Spec: Strength-Exercises (auch wenn der User keinen weight_kg-Wert
 * eingegeben hat) MUESSEN auf Reducer-Ebene ein definiertes `target_weight_kg`
 * bekommen, damit die UI die Gewichts-Spalte rendert. Default 0 ist akzeptabel.
 *
 * Cardio/Bodyweight/Mind-Body ist davon ausgenommen (dort ist `noWeight` korrekt).
 */

import { describe, it, expect } from 'vitest';
import { buildExercisesFromPlan } from '../ActiveWorkoutContext';
import type { PlanExercise, WorkoutExerciseResult } from '../../../../types/health';

// ── Fixtures ─────────────────────────────────────────────────────────────

function makeStrengthExerciseNoWeight(name: string): PlanExercise {
  return {
    name,
    sets: 3,
    reps: '10',
    // bewusst KEIN weight_kg gesetzt — User-Plan via Wizard ohne Gewicht
    rest_seconds: 90,
  };
}

// ── B23a — Gewichts-Spalte muss sichtbar bleiben ────────────────────────

describe('B23a — target_weight_kg nach buildExercisesFromPlan', () => {
  it('Strength-Exercise ohne weight_kg, ohne crossPlanData, ohne Catalog-Match → mindestens ein Satz hat target_weight_kg', () => {
    const plan: PlanExercise[] = [makeStrengthExerciseNoWeight('Mystery-Exercise-XYZ')];

    // Kein catalog, keine crossPlanData → wir testen die "Worst-Case"-Defaults
    const result = buildExercisesFromPlan(plan, undefined, undefined);

    expect(result).toHaveLength(1);
    const sets = result[0].sets;
    expect(sets.length).toBeGreaterThan(0);

    // Spec: Mindestens ein Satz sollte einen numerischen target_weight_kg haben,
    // damit der Tracker die Weight-Spalte rendert (noWeight-Check ist
    // `every(s => s.target_weight_kg == null)`).
    const someSetHasWeight = sets.some(s => s.target_weight_kg != null);
    expect(
      someSetHasWeight,
      'Strength-Exercise muss nach buildExercisesFromPlan einen numerischen target_weight_kg fuer mindestens einen Satz haben, damit die Weight-Spalte gerendert wird',
    ).toBe(true);
  });

  it('Strength-Exercise ohne weight_kg → KEIN Satz darf target_weight_kg === undefined haben', () => {
    // Schaerfer formuliert: alle Saetze sollten konsistent sein (nicht "mal
    // definiert, mal undefiniert"). Currently: alle sind undefined.
    const plan: PlanExercise[] = [makeStrengthExerciseNoWeight('Bizeps-Curl-Variation-99')];
    const result = buildExercisesFromPlan(plan, undefined, undefined);

    const undefinedCount = result[0].sets.filter(s => s.target_weight_kg === undefined).length;
    expect(
      undefinedCount,
      'Alle Saetze einer Strength-Uebung sollten ein definiertes target_weight_kg haben (auch wenn nur 0 als Placeholder)',
    ).toBe(0);
  });
});

// ── B23c — Last-Weight-Memory via crossPlanData ─────────────────────────

describe('B23c — Last-Weight-Memory (crossPlanData)', () => {
  it('Wenn crossPlanData fuer eine Uebung einen letzten Wert hat, wird er als target uebernommen', () => {
    const plan: PlanExercise[] = [makeStrengthExerciseNoWeight('Bench Press')];

    // Simuliere: vergangene Session mit Bench Press 85kg x 8 Reps
    const prevExercise: WorkoutExerciseResult = {
      name: 'Bench Press',
      exercise_id: undefined,
      exercise_type: 'strength',
      plan_exercise_index: 0,
      sets: [
        {
          set_number: 1,
          target_reps: '8',
          target_weight_kg: 85,
          actual_reps: 8,
          actual_weight_kg: 85,
          completed: true,
          skipped: false,
          set_tag: 'normal',
        },
      ],
      skipped: false,
      is_addition: false,
    };
    const crossPlanData = new Map<string, WorkoutExerciseResult>([
      ['bench press', prevExercise],
    ]);

    const result = buildExercisesFromPlan(plan, undefined, crossPlanData);

    expect(
      result[0].sets[0].target_weight_kg,
      'target_weight_kg sollte aus crossPlanData uebernommen werden (85kg von letzter Session)',
    ).toBe(85);
  });
});
