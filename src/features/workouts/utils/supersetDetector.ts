/**
 * Superset Detector — Identifies paired exercises in a workout.
 *
 * Detection methods:
 * 1. Exercise notes contain superset keywords (superset, supersatz, A1, A2, B1, B2, etc.)
 * 2. Consecutive exercises with matching letter-number notation (A1→A2, B1→B2)
 *
 * Used by ExerciseListBar to show visual pairing brackets.
 */

import type { WorkoutExerciseResult } from '../../../types/health';

export interface SupersetGroup {
  /** Indices of exercises in this superset */
  indices: number[];
  /** Label for the group (e.g., 'A', 'B') */
  label: string;
}

const SUPERSET_KEYWORDS = [
  'superset', 'supersatz', 'super set', 'super-set',
  'circuit', 'zirkel', 'giant set', 'giant-set', 'riesensatz',
];

const LETTER_NUMBER_PATTERN = /^([A-Za-z])(\d)$/;

/**
 * Detect superset groupings from exercise notes.
 */
export function detectSupersets(exercises: WorkoutExerciseResult[]): SupersetGroup[] {
  const groups: SupersetGroup[] = [];
  const usedIndices = new Set<number>();

  // Method 1: Look for A1/A2/B1/B2 notation in notes
  const letterGroups = new Map<string, number[]>();

  exercises.forEach((ex, idx) => {
    const notes = (ex.notes ?? '').trim();
    if (!notes) return;

    // Check for A1, A2, B1, B2 pattern
    const match = notes.match(LETTER_NUMBER_PATTERN);
    if (match) {
      const letter = match[1].toUpperCase();
      if (!letterGroups.has(letter)) {
        letterGroups.set(letter, []);
      }
      letterGroups.get(letter)!.push(idx);
      return;
    }

    // Check for superset keyword — pair with next exercise
    const hasKeyword = SUPERSET_KEYWORDS.some(kw =>
      notes.toLowerCase().includes(kw),
    );
    if (hasKeyword && idx < exercises.length - 1) {
      // Find a free label
      const usedLabels = new Set([...letterGroups.keys()]);
      let label = 'A';
      while (usedLabels.has(label)) {
        label = String.fromCharCode(label.charCodeAt(0) + 1);
      }
      letterGroups.set(label, [idx, idx + 1]);
    }
  });

  // Convert to groups (only groups with 2+ exercises)
  for (const [label, indices] of letterGroups) {
    if (indices.length >= 2) {
      const sorted = [...new Set(indices)].sort((a, b) => a - b);
      groups.push({ indices: sorted, label });
      sorted.forEach(i => usedIndices.add(i));
    }
  }

  return groups.sort((a, b) => a.indices[0] - b.indices[0]);
}

/**
 * Get the superset label for a specific exercise index, if any.
 */
export function getSupersetLabel(
  groups: SupersetGroup[],
  exerciseIndex: number,
): { label: string; position: 'first' | 'middle' | 'last' | 'only' } | null {
  for (const group of groups) {
    const pos = group.indices.indexOf(exerciseIndex);
    if (pos === -1) continue;

    const position =
      group.indices.length === 1
        ? 'only' as const
        : pos === 0
          ? 'first' as const
          : pos === group.indices.length - 1
            ? 'last' as const
            : 'middle' as const;

    return { label: group.label, position };
  }
  return null;
}
