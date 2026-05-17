/**
 * B25 — Workout-Theme schwer lesbar: blaue Schrift auf schwarzem Grund.
 *
 * Root-Cause (aus REGRESSION_TRIAGE_2026-05-17.md): ActiveWorkoutPage hat 2
 * Timer-Panels (Inline Set-Timer + Rest-Timer) mit `bg-gray-800` (Tailwind
 * #1F2937). Darin steht `text-theme-primary` (Studio-Indigo #3D4FB8). Kontrast
 * ~1.8:1, weit unter WCAG-AA (4.5:1).
 *
 * Frueher (v14.27 Baseline, vor Color-Migration): `text-teal-400` (#2DD4BF)
 * auf gray-800 — Kontrast ~6.8:1, WCAG-AA OK. Timo's O-Ton: "frueher war's gar
 * nicht schlecht". Fix-Spec: dark-tauglicher Akzent-Token, der das alte
 * Lesbarkeits-Niveau wiederherstellt — Studio resolved zu Teal, Console-Mode
 * zu Acid-Lime (das passt zur Power-Console-Palette).
 *
 * Test-Spec (Source-Code-Lint): bg-gray-800 Panels in ActiveWorkoutPage
 * duerfen KEIN text-theme-primary direkt im Panel-Block enthalten.
 *
 * Tracker-Hardcodes-Followup: Die hardcoded text-blue-NN, text-indigo-NN,
 * bg-blue-50, bg-indigo-100 in SetBySetTracker und ExerciseOverviewTracker
 * sitzen alle auf hellen white-Backgrounds (Status-Banner, L/R-Indikatoren),
 * sind dort gut lesbar und tragen NICHT zum aktuellen Bug bei. Sie wuerden
 * erst stoeren, wenn Auto-Switch-zu-Power-Console aktiv ist und der Page-BG
 * Charcoal wird. Verschoben nach docs/regression-sprint-followups.md.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const COMPONENTS_DIR = join(__dirname, '..');

function read(file: string): string {
  return readFileSync(join(COMPONENTS_DIR, file), 'utf8');
}

describe('B25 — Workout-Theme Kontrast', () => {
  it('ActiveWorkoutPage: bg-gray-800 Panels enthalten kein text-theme-primary direkt', () => {
    const src = read('ActiveWorkoutPage.tsx');

    // Finde alle Stellen wo bg-gray-800 als Tailwind-Klasse vorkommt
    const grayPanelRegex = /className="[^"]*\bbg-gray-800\b[^"]*"/g;
    const matches = [...src.matchAll(grayPanelRegex)];

    expect(matches.length, 'Sanity: bg-gray-800 Panels existieren').toBeGreaterThan(0);

    for (const match of matches) {
      const start = match.index!;
      // Ein Panel ist typisch < 800 chars — schau in den umgebenden Block
      const block = src.slice(start, start + 800);
      expect(
        block,
        `Panel an Position ${start} enthaelt text-theme-primary (Studio-Indigo auf Dark-Gray = WCAG-Fail).\nBlock-Snippet: ${block.slice(0, 200)}`,
      ).not.toMatch(/\btext-theme-primary\b/);
    }
  });
});
