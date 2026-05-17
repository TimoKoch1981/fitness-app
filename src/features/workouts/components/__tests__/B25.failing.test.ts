/**
 * B25 — Workout-Theme schwer lesbar: blaue Schrift auf schwarzem Grund.
 *
 * Root-Cause (aus REGRESSION_TRIAGE_2026-05-17.md): ActiveWorkoutPage hat 2
 * Timer-Panels (Inline Set-Timer + Rest-Timer) mit `bg-gray-800` (Tailwind
 * #1F2937). Darin steht `text-theme-primary` (Studio-Indigo #3D4FB8). Kontrast
 * ~1.8:1, weit unter WCAG-AA (4.5:1).
 *
 * Zusaetzlich: 16 hardcoded `text-blue-*` / `text-indigo-*` / `bg-blue-*` /
 * `bg-indigo-*` in SetBySetTracker + ExerciseOverviewTracker — die switchen
 * nicht beim Power-Console-Auto-Switch.
 *
 * Test-Spec (Source-Code-Lint):
 *   - bg-gray-800 Panels in ActiveWorkoutPage duerfen KEIN text-theme-primary
 *     direkt im Panel-Block enthalten (Kontrast-Problem).
 *   - SetBySetTracker und ExerciseOverviewTracker duerfen keine hardcoded
 *     text-blue-* oder text-indigo-* mehr haben (Theme-Switch-Blocker).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Repo-Root relativ vom __tests__ Verzeichnis aus
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

  it('SetBySetTracker enthaelt keine hardcoded text-blue-* / text-indigo-* Klassen', () => {
    const src = read('SetBySetTracker.tsx');
    expect(
      src,
      'Active-Workout-Tracker darf keine hardcoded text-blue-* haben (blocked Theme-Switch zu Power Console)',
    ).not.toMatch(/\btext-blue-\d+\b/);
    expect(
      src,
      'Active-Workout-Tracker darf keine hardcoded text-indigo-* haben (blocked Theme-Switch zu Power Console)',
    ).not.toMatch(/\btext-indigo-\d+\b/);
  });

  it('ExerciseOverviewTracker enthaelt keine hardcoded text-blue-* / text-indigo-* Klassen', () => {
    const src = read('ExerciseOverviewTracker.tsx');
    expect(src).not.toMatch(/\btext-blue-\d+\b/);
    expect(src).not.toMatch(/\btext-indigo-\d+\b/);
  });
});
