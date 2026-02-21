/**
 * Hook for querying the exercise catalog and fuzzy-matching exercise names.
 *
 * Uses TanStack Query with a 1-hour staleTime (catalog rarely changes).
 * Provides findExerciseInCatalog() for matching plan exercises to catalog entries.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { CatalogExercise } from '../../../types/health';

// ── Query Hook ──────────────────────────────────────────────────────────

export function useExerciseCatalog() {
  return useQuery<CatalogExercise[]>({
    queryKey: ['exercise-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_catalog')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data ?? []) as CatalogExercise[];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// ── Fuzzy Match ─────────────────────────────────────────────────────────

/**
 * Find an exercise in the catalog by name.
 * Matching priority: exact → alias → partial → null
 *
 * @param name The exercise name to look up (from a training plan)
 * @param catalog The full exercise catalog array
 * @returns The matching CatalogExercise or null
 */
export function findExerciseInCatalog(
  name: string,
  catalog: CatalogExercise[],
): CatalogExercise | null {
  if (!name || !catalog.length) return null;

  const lower = name.toLowerCase().trim();

  // 1. Exact match (name or name_en)
  const exact = catalog.find(
    (ex) =>
      ex.name.toLowerCase() === lower ||
      (ex.name_en && ex.name_en.toLowerCase() === lower),
  );
  if (exact) return exact;

  // 2. Alias match
  const aliasMatch = catalog.find((ex) =>
    ex.aliases.some((alias) => alias.toLowerCase() === lower),
  );
  if (aliasMatch) return aliasMatch;

  // 3. Partial match (catalog name starts with search, or vice versa)
  const partial = catalog.find(
    (ex) =>
      ex.name.toLowerCase().includes(lower) ||
      lower.includes(ex.name.toLowerCase()) ||
      (ex.name_en && (
        ex.name_en.toLowerCase().includes(lower) ||
        lower.includes(ex.name_en.toLowerCase())
      )),
  );
  if (partial) return partial;

  return null;
}
