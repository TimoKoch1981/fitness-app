/**
 * useRecipes — Client-side recipe CRUD with localStorage persistence.
 * No Supabase table needed — keeps things simple for MVP.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { generateId } from '../../../lib/utils';
import type { Recipe, RecipeFilter, RecipeSortBy } from '../types';
import { DEFAULT_RECIPE_FILTER } from '../types';

const STORAGE_KEY = 'fitbuddy_recipes';

// ── Persistence helpers ─────────────────────────────────────────────────

function loadRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecipes(recipes: Recipe[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
  } catch {
    console.warn('[useRecipes] Failed to persist to localStorage');
  }
}

// ── Filtering & sorting (pure functions, exported for testing) ──────────

export function filterRecipes(recipes: Recipe[], filters: RecipeFilter): Recipe[] {
  let result = [...recipes];

  // Search by name/description
  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    );
  }

  // Filter by tags
  if (filters.tags.length > 0) {
    result = result.filter((r) =>
      filters.tags.some((tag) => r.tags.includes(tag))
    );
  }

  // Filter by max prep time
  if (filters.maxPrepTime !== null) {
    result = result.filter((r) => r.prepTime <= filters.maxPrepTime!);
  }

  // Filter by max calories
  if (filters.maxCalories !== null) {
    result = result.filter(
      (r) => r.macrosPerServing.calories <= filters.maxCalories!
    );
  }

  // Sort
  result = sortRecipes(result, filters.sortBy);

  return result;
}

export function sortRecipes(recipes: Recipe[], sortBy: RecipeSortBy): Recipe[] {
  const sorted = [...recipes];
  switch (sortBy) {
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'de'));
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'prepTime':
      sorted.sort((a, b) => a.prepTime - b.prepTime);
      break;
    case 'calories':
      sorted.sort((a, b) => a.macrosPerServing.calories - b.macrosPerServing.calories);
      break;
  }
  return sorted;
}

// ── Hook ────────────────────────────────────────────────────────────────

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>(() => loadRecipes());
  const [filters, setFilters] = useState<RecipeFilter>(DEFAULT_RECIPE_FILTER);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate async load
  useEffect(() => {
    setRecipes(loadRecipes());
    setIsLoading(false);
  }, []);

  // Persist on every change
  useEffect(() => {
    if (!isLoading) {
      saveRecipes(recipes);
    }
  }, [recipes, isLoading]);

  // Filtered & sorted recipes
  const filteredRecipes = useMemo(
    () => filterRecipes(recipes, filters),
    [recipes, filters]
  );

  // All unique tags across all recipes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'de'));
  }, [recipes]);

  const addRecipe = useCallback(
    (input: Omit<Recipe, 'id' | 'createdAt'>) => {
      const newRecipe: Recipe = {
        ...input,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setRecipes((prev) => [newRecipe, ...prev]);
      return newRecipe;
    },
    []
  );

  const updateRecipe = useCallback(
    (id: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt'>>) => {
      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
      );
    },
    []
  );

  const deleteRecipe = useCallback((id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const getRecipe = useCallback(
    (id: string): Recipe | undefined => {
      return recipes.find((r) => r.id === id);
    },
    [recipes]
  );

  return {
    recipes,
    filteredRecipes,
    allTags,
    filters,
    setFilters,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    getRecipe,
    isLoading,
  };
}
