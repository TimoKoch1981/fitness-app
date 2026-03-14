/**
 * Hook to load and search the ingredient catalog.
 * Read-only access — the catalog is global and pre-seeded.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { IngredientCatalogItem, IngredientCategory } from '../types';
import { normalizeIngredient } from '../types';

/** Load full catalog (cached indefinitely — it rarely changes) */
export function useIngredientCatalog() {
  return useQuery<IngredientCatalogItem[]>({
    queryKey: ['ingredient-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredient_catalog')
        .select('*')
        .order('category')
        .order('sort_order');

      if (error) throw error;
      return (data ?? []) as IngredientCatalogItem[];
    },
    staleTime: Infinity, // catalog doesn't change
    gcTime: Infinity,
  });
}

/** Search catalog by text (client-side fuzzy matching) */
export function searchCatalog(
  catalog: IngredientCatalogItem[],
  query: string,
): IngredientCatalogItem[] {
  if (!query.trim()) return catalog;

  const normalized = normalizeIngredient(query);
  const terms = normalized.split(' ').filter(Boolean);

  return catalog.filter((item) => {
    const searchableText = [
      normalizeIngredient(item.name_de),
      item.name_en?.toLowerCase() ?? '',
      ...item.search_terms.map((t) => normalizeIngredient(t)),
    ].join(' ');

    return terms.every((term) => searchableText.includes(term));
  });
}

/** Group catalog items by category */
export function groupByCategory(
  items: IngredientCatalogItem[],
): Map<IngredientCategory, IngredientCatalogItem[]> {
  const grouped = new Map<IngredientCategory, IngredientCatalogItem[]>();

  for (const item of items) {
    const existing = grouped.get(item.category) ?? [];
    existing.push(item);
    grouped.set(item.category, existing);
  }

  return grouped;
}
