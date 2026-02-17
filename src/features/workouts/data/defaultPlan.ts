/**
 * Default training plan — user's real 4-day Upper/Lower split.
 * Based on ChatGPT training export (best values 20.01.–08.02.2026).
 *
 * Used as seed data when the user clicks "Load sample plan" on the
 * training plan tab. All exercises, weights, and rep ranges are real values.
 */

import type { AddTrainingPlanInput } from '../hooks/useTrainingPlans';

export const DEFAULT_PLAN: AddTrainingPlanInput = {
  name: '4-Tage Upper/Lower Split',
  split_type: 'upper_lower',
  days_per_week: 4,
  notes: 'Minimal Effective Dose — gelenkschonende Varianten, progressive Overload',
  days: [
    {
      day_number: 1,
      name: 'Unterkörper A',
      focus: 'Posterior Chain, Gluteus, Beine',
      exercises: [
        { name: 'Trap-Bar Deadlift', sets: 4, reps: '6-8', weight_kg: 70, rest_seconds: 120, notes: 'Hauptübung — schwer' },
        { name: 'Hip Thrust', sets: 3, reps: '10-12', notes: 'Violettes Band' },
        { name: 'Bulgarian Split Squat', sets: 3, reps: '10-12', weight_kg: 4, notes: 'pro Seite, KH je Hand' },
        { name: 'Reverse Hyperextension', sets: 3, reps: '12-15', weight_kg: 5 },
      ],
    },
    {
      day_number: 2,
      name: 'Oberkörper A',
      focus: 'Brust, Rücken, Schultern, Arme',
      exercises: [
        { name: 'Bankdrücken', sets: 4, reps: '8-12', weight_kg: 50, rest_seconds: 90, notes: 'Hauptübung — Brust' },
        { name: 'Brustgestütztes Rudern', sets: 3, reps: '10-12', weight_kg: 20 },
        { name: 'Landmine Press', sets: 3, reps: '10-12', weight_kg: 20, notes: 'Schulter + obere Brust' },
        { name: 'Latzug', sets: 3, reps: '10-12', weight_kg: 60, notes: 'Top-Set: 65kg × 8' },
        { name: 'Face Pulls', sets: 3, reps: '15-20', weight_kg: 25, notes: 'Schultergesundheit' },
        { name: 'Bizeps-Blaster', sets: 3, reps: '10-12', weight_kg: 35 },
        { name: 'Trizeps Kabel', sets: 3, reps: '10-12', weight_kg: 25, notes: 'pro Arm' },
      ],
    },
    {
      day_number: 3,
      name: 'Unterkörper B',
      focus: 'Posterior Chain, Grip, Rumpfstabilität',
      exercises: [
        { name: 'RDL (Rumänisches Kreuzheben)', sets: 4, reps: '8-10', weight_kg: 60, rest_seconds: 120, notes: 'Hauptübung — Hamstrings' },
        { name: "Farmer's Walk", sets: 3, reps: '60m', weight_kg: 30, notes: 'pro Hand, Griffkraft + Core' },
      ],
    },
    {
      day_number: 4,
      name: 'Oberkörper B',
      focus: 'Rücken, Brust, Core, Klimmzug-Progression',
      exercises: [
        { name: 'Dead Hang', sets: 3, reps: '60s', notes: 'Griffkraft + Schulter-Dekompression' },
        { name: 'Negative Klimmzüge', sets: 3, reps: '6-8', notes: 'Klimmzug-Progression — langsam ablassen' },
        { name: 'Kabelrudern', sets: 3, reps: '10-12', weight_kg: 60 },
        { name: 'Landmine Press', sets: 3, reps: '10-12', weight_kg: 20 },
        { name: 'Dips', sets: 3, reps: '10-12', notes: 'Brust + Trizeps' },
        { name: 'Flys (Kabel)', sets: 3, reps: '10-12', weight_kg: 20 },
        { name: 'Kabel-Crunch', sets: 3, reps: '10-15', weight_kg: 30, notes: 'Core-Finisher' },
      ],
    },
  ],
};
