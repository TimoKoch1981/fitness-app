/**
 * useRecipes — Supabase-backed recipe CRUD with TanStack Query.
 * v2.0: Replaces localStorage with real DB persistence.
 * Includes localStorage migration for existing users.
 */

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../app/providers/AuthProvider';
import type { Recipe, RecipeFilter, RecipeSortBy, LegacyRecipe } from '../types';
import { DEFAULT_RECIPE_FILTER, convertLegacyRecipe, recipeFitsDietaryPrefs } from '../types';
import type { PantryItem } from '../../pantry/types';
import { matchRecipeAgainstPantry, sortByPantryMatch } from '../../pantry/utils/pantryMatcher';

const LEGACY_STORAGE_KEY = 'fitbuddy_recipes';
const MIGRATION_FLAG = 'fitbuddy_recipes_migrated';

// ── Filtering & sorting (pure functions, exported for testing) ──────────

export function filterRecipes(recipes: Recipe[], filters: RecipeFilter, pantryItems?: PantryItem[]): Recipe[] {
  let result = [...recipes];

  // Filter by favorites
  if (filters.favoritesOnly) {
    result = result.filter((r) => r.is_favorite);
  }

  // Filter by pantry availability
  if (filters.pantryOnly && pantryItems && pantryItems.length > 0) {
    result = result.filter((r) => {
      const match = matchRecipeAgainstPantry(r, pantryItems);
      return match.matchPercent > 0;
    });
  }

  // Search by title/description
  if (filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    result = result.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Filter by tags
  if (filters.tags.length > 0) {
    result = result.filter((r) =>
      filters.tags.some((tag) => r.tags.includes(tag))
    );
  }

  // Filter by meal type
  if (filters.mealType) {
    result = result.filter((r) => r.meal_type === filters.mealType);
  }

  // Filter by max prep time
  if (filters.maxPrepTime !== null) {
    result = result.filter((r) => r.prep_time_min <= filters.maxPrepTime!);
  }

  // Filter by max calories
  if (filters.maxCalories !== null) {
    result = result.filter(
      (r) => r.calories_per_serving <= filters.maxCalories!
    );
  }

  // Filter by allergens (exclude recipes containing these allergens)
  if (filters.allergenFilterEnabled && filters.excludeAllergens.length > 0) {
    result = result.filter((r) =>
      !filters.excludeAllergens.some((allergen) => r.allergens.includes(allergen))
    );
  }

  // Filter by dietary preferences (exclude recipes that don't fit)
  if (filters.dietaryFilterEnabled && filters.dietaryFilter.length > 0) {
    result = result.filter((r) => recipeFitsDietaryPrefs(r, filters.dietaryFilter));
  }

  // Sort
  result = sortRecipes(result, filters.sortBy, pantryItems);

  return result;
}

export function sortRecipes(recipes: Recipe[], sortBy: RecipeSortBy, pantryItems?: PantryItem[]): Recipe[] {
  if (sortBy === 'bestMatch' && pantryItems && pantryItems.length > 0) {
    return sortByPantryMatch(recipes, pantryItems);
  }

  const sorted = [...recipes];
  switch (sortBy) {
    case 'name':
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'de'));
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'prepTime':
      sorted.sort((a, b) => a.prep_time_min - b.prep_time_min);
      break;
    case 'calories':
      sorted.sort((a, b) => a.calories_per_serving - b.calories_per_serving);
      break;
    case 'protein':
      sorted.sort((a, b) => b.protein_per_serving - a.protein_per_serving);
      break;
  }
  return sorted;
}

// ── localStorage migration ──────────────────────────────────────────────

async function migrateLegacyRecipes(userId: string): Promise<number> {
  // Already migrated?
  if (localStorage.getItem(MIGRATION_FLAG)) return 0;

  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MIGRATION_FLAG, 'true');
      return 0;
    }

    const legacyRecipes: LegacyRecipe[] = JSON.parse(raw);
    if (!Array.isArray(legacyRecipes) || legacyRecipes.length === 0) {
      localStorage.setItem(MIGRATION_FLAG, 'true');
      return 0;
    }

    const dbRecipes = legacyRecipes.map(lr => convertLegacyRecipe(lr, userId));

    const { error } = await supabase.from('recipes').insert(dbRecipes);
    if (error) {
      console.warn('[useRecipes] Migration failed:', error);
      return 0;
    }

    // Mark as migrated + clean up
    localStorage.setItem(MIGRATION_FLAG, 'true');
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    console.log(`[useRecipes] Migrated ${dbRecipes.length} recipes from localStorage`);
    return dbRecipes.length;
  } catch (e) {
    console.warn('[useRecipes] Migration error:', e);
    return 0;
  }
}

// ── Type for new recipe input ───────────────────────────────────────────

export type RecipeInput = Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// ── Hook ────────────────────────────────────────────────────────────────

export function useRecipes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<RecipeFilter>(DEFAULT_RECIPE_FILTER);
  const [migrationDone, setMigrationDone] = useState(false);

  // Run localStorage migration once on mount
  useEffect(() => {
    if (user?.id && !migrationDone) {
      migrateLegacyRecipes(user.id).then((count) => {
        if (count > 0) {
          queryClient.invalidateQueries({ queryKey: ['recipes'] });
        }
        setMigrationDone(true);
      });
    }
  }, [user?.id, migrationDone, queryClient]);

  // Fetch all user recipes from Supabase
  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ['recipes', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Recipe[];
    },
    enabled: !!user?.id,
    staleTime: 30_000,
  });

  // Filtered & sorted (pantryItems passed externally via setPantryItems)
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);

  const filteredRecipes = useMemo(
    () => filterRecipes(recipes, filters, pantryItems),
    [recipes, filters, pantryItems]
  );

  // All unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'de'));
  }, [recipes]);

  // Add recipe
  const addRecipeMutation = useMutation({
    mutationFn: async (input: RecipeInput) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('recipes')
        .insert({ ...input, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Recipe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  const addRecipe = useCallback(
    async (input: RecipeInput) => {
      return addRecipeMutation.mutateAsync(input);
    },
    [addRecipeMutation]
  );

  // Update recipe
  const updateRecipeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RecipeInput> }) => {
      const { data, error } = await supabase
        .from('recipes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Recipe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  const updateRecipe = useCallback(
    async (id: string, updates: Partial<RecipeInput>) => {
      return updateRecipeMutation.mutateAsync({ id, updates });
    },
    [updateRecipeMutation]
  );

  // Delete recipe
  const deleteRecipeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  const deleteRecipe = useCallback(
    async (id: string) => {
      return deleteRecipeMutation.mutateAsync(id);
    },
    [deleteRecipeMutation]
  );

  // Toggle favorite
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase
        .from('recipes')
        .update({ is_favorite: isFavorite })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });

  const toggleFavorite = useCallback(
    async (id: string, isFavorite: boolean) => {
      return toggleFavoriteMutation.mutateAsync({ id, isFavorite });
    },
    [toggleFavoriteMutation]
  );

  // Get single recipe
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
    setPantryItems,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    toggleFavorite,
    getRecipe,
    isLoading,
    isAdding: addRecipeMutation.isPending,
  };
}
