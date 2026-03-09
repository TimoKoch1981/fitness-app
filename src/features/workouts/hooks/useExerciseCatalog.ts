/**
 * Hook for querying the exercise catalog and fuzzy-matching exercise names.
 *
 * Uses TanStack Query with Infinity staleTime (catalog is static seed data).
 * Provides findExerciseInCatalog() for matching plan exercises to catalog entries.
 * Provides filter helpers for body_region, movement_pattern, category.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { CatalogExercise, BodyRegion, MovementPattern, ExerciseCategory } from '../../../types/health';

// ── Query Hook ──────────────────────────────────────────────────────────

export function useExerciseCatalog() {
  return useQuery<CatalogExercise[]>({
    queryKey: ['exercise-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercise_catalog')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name');

      if (error) throw error;
      return (data ?? []) as CatalogExercise[];
    },
    staleTime: Infinity, // catalog is seed data, never stale
  });
}

// ── Filter Helpers ──────────────────────────────────────────────────────

export interface ExerciseFilters {
  search?: string;
  bodyRegion?: BodyRegion;
  category?: ExerciseCategory;
  movementPattern?: MovementPattern;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  isCompound?: boolean;
  equipment?: string;
  muscle?: string;
}

export function useFilteredExercises(
  catalog: CatalogExercise[] | undefined,
  filters: ExerciseFilters,
) {
  return useMemo(() => {
    if (!catalog) return [];

    return catalog.filter((ex) => {
      // Text search (name, name_en, aliases)
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const matchesName = ex.name.toLowerCase().includes(q);
        const matchesNameEn = ex.name_en?.toLowerCase().includes(q);
        const matchesAlias = ex.aliases.some((a) => a.toLowerCase().includes(q));
        if (!matchesName && !matchesNameEn && !matchesAlias) return false;
      }

      // Body region filter
      if (filters.bodyRegion && ex.body_region !== filters.bodyRegion) return false;

      // Category filter
      if (filters.category && ex.category !== filters.category) return false;

      // Movement pattern filter
      if (filters.movementPattern && ex.movement_pattern !== filters.movementPattern) return false;

      // Difficulty filter
      if (filters.difficulty && ex.difficulty !== filters.difficulty) return false;

      // Compound filter
      if (filters.isCompound !== undefined && ex.is_compound !== filters.isCompound) return false;

      // Equipment filter (exercise has this equipment)
      if (filters.equipment) {
        const eq = filters.equipment.toLowerCase();
        const hasEquipment = ex.equipment_needed.some((e) => e.toLowerCase().includes(eq));
        if (!hasEquipment) return false;
      }

      // Muscle filter (primary or secondary)
      if (filters.muscle) {
        const m = filters.muscle.toLowerCase();
        const hasMuscle =
          ex.primary_muscles?.some((pm) => pm.toLowerCase().includes(m)) ||
          ex.secondary_muscles?.some((sm) => sm.toLowerCase().includes(m));
        if (!hasMuscle) return false;
      }

      return true;
    });
  }, [catalog, filters]);
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
