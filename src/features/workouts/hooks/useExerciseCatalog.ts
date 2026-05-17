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
  /** Filter by subcategory prefix (e.g. 'yoga' matches 'yoga_hatha', 'yoga_vinyasa', etc.) */
  subcategoryPrefix?: string;
  /** Filter by pose_category (e.g. 'standing', 'backbend') */
  poseCategory?: string;
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

      // Subcategory prefix filter (e.g. 'yoga' → yoga_hatha, yoga_vinyasa, ...)
      if (filters.subcategoryPrefix) {
        const sub = (ex as unknown as Record<string, unknown>).subcategory as string | undefined;
        if (!sub) return false;
        if (filters.subcategoryPrefix === 'five_tibetans') {
          if (sub !== 'five_tibetans') return false;
        } else if (!sub.startsWith(filters.subcategoryPrefix)) {
          return false;
        }
      }

      // Pose category filter
      if (filters.poseCategory) {
        const pose = (ex as unknown as Record<string, unknown>).pose_category as string | undefined;
        if (pose !== filters.poseCategory) return false;
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
/**
 * B24-Fix: Normalize a name for robust catalog matching.
 * - lowercase
 * - Umlaute → ASCII (ä→ae, ö→oe, ü→ue, ß→ss)
 * - Alle nicht-alphanumerischen Zeichen weg (Bindestriche, Whitespace,
 *   Klammern, Punkte) — Bizeps-Curls / Bizepscurls / "Bizepscurls (mit Kh)"
 *   reduzieren sich alle auf "bizepscurls" (bzw. mit Suffix).
 */
function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '');
}

export function findExerciseInCatalog(
  name: string,
  catalog: CatalogExercise[],
): CatalogExercise | null {
  if (!name || !catalog.length) return null;

  const lower = name.toLowerCase().trim();
  const norm = normalizeName(name);

  // 1. Exact match (name or name_en) — lowercase only, schnelle Pfad
  const exact = catalog.find(
    (ex) =>
      ex.name.toLowerCase() === lower ||
      (ex.name_en && ex.name_en.toLowerCase() === lower),
  );
  if (exact) return exact;

  // 2. Alias match — lowercase only
  const aliasMatch = catalog.find((ex) =>
    ex.aliases.some((alias) => alias.toLowerCase() === lower),
  );
  if (aliasMatch) return aliasMatch;

  // 3. Normalized exact match — faengt Umlaut-Encoding, Bindestriche,
  //    Whitespace, Klammern (Bankdruecken/Bankdrücken, Bizepscurls/Bizeps-Curls).
  if (norm) {
    const normExact = catalog.find((ex) => {
      if (normalizeName(ex.name) === norm) return true;
      if (ex.name_en && normalizeName(ex.name_en) === norm) return true;
      return ex.aliases.some((alias) => normalizeName(alias) === norm);
    });
    if (normExact) return normExact;
  }

  // 4. Partial match — bidirectional substring, sowohl auf lowercase als auch
  //    auf normalisierter Form. Faengt Klammer-Suffixe ("Bankdrücken
  //    (Flachbank)" → "Bankdrücken") und Plurale ("Bulgarian Split Squats" →
  //    "Bulgarian Split Squat").
  const partial = catalog.find((ex) => {
    const exName = ex.name.toLowerCase();
    const exNameEn = ex.name_en?.toLowerCase();
    const exNorm = normalizeName(ex.name);
    const exNormEn = ex.name_en ? normalizeName(ex.name_en) : '';

    return (
      exName.includes(lower) ||
      lower.includes(exName) ||
      (exNameEn && (exNameEn.includes(lower) || lower.includes(exNameEn))) ||
      (norm && (exNorm.includes(norm) || norm.includes(exNorm))) ||
      (norm && exNormEn && (exNormEn.includes(norm) || norm.includes(exNormEn)))
    );
  });
  if (partial) return partial;

  return null;
}
