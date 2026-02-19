/**
 * Product Database Hooks — CRUD for standard + user products.
 *
 * Standard products are systemwide (read-only for users).
 * User products are per-user with aliases and use_count tracking.
 *
 * @see productLookup.ts for search / matching logic
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { ProductNutrition, UserProduct, ProductCategory } from '../../../types/health';

const STANDARD_PRODUCTS_KEY = 'standard_products';
const USER_PRODUCTS_KEY = 'user_products';

// ══════════════════════════════════════════════════════════════════════
// QUERIES
// ══════════════════════════════════════════════════════════════════════

/**
 * Fetch all standard products (systemwide, cached aggressively).
 * These rarely change — staleTime is 30 minutes.
 */
export function useStandardProducts() {
  return useQuery({
    queryKey: [STANDARD_PRODUCTS_KEY],
    queryFn: async (): Promise<ProductNutrition[]> => {
      const { data, error } = await supabase
        .from('standard_products')
        .select('*')
        .order('category')
        .order('name');

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Fetch all user-specific products.
 * Sorted by use_count (most used first) for better UX.
 */
export function useUserProducts() {
  return useQuery({
    queryKey: [USER_PRODUCTS_KEY],
    queryFn: async (): Promise<UserProduct[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_products')
        .select('*')
        .eq('user_id', user.id)
        .order('use_count', { ascending: false })
        .order('name');

      if (error) throw error;
      return data ?? [];
    },
  });
}

// ══════════════════════════════════════════════════════════════════════
// MUTATIONS
// ══════════════════════════════════════════════════════════════════════

interface AddUserProductInput {
  name: string;
  brand?: string;
  category?: ProductCategory;
  barcode?: string;
  serving_size_g: number;
  serving_label?: string;
  calories_per_serving: number;
  protein_per_serving: number;
  carbs_per_serving: number;
  fat_per_serving: number;
  fiber_per_serving?: number;
  aliases?: string[];
  is_favorite?: boolean;
  source?: string;
  source_ref?: string;
  notes?: string;
  /** Pre-resolved user ID — skips getUser() call (used by action executor) */
  user_id?: string;
}

/**
 * Add a new user product.
 * Called by the AI agent (ACTION:save_product) or manual UI form.
 */
export function useAddUserProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddUserProductInput) => {
      let userId = input.user_id;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('user_products')
        .insert({
          user_id: userId,
          name: input.name,
          brand: input.brand,
          category: input.category ?? 'general',
          barcode: input.barcode,
          serving_size_g: input.serving_size_g,
          serving_label: input.serving_label,
          calories_per_serving: input.calories_per_serving,
          protein_per_serving: input.protein_per_serving,
          carbs_per_serving: input.carbs_per_serving,
          fat_per_serving: input.fat_per_serving,
          fiber_per_serving: input.fiber_per_serving,
          aliases: input.aliases ?? [],
          is_favorite: input.is_favorite ?? false,
          source: input.source ?? 'manual',
          source_ref: input.source_ref,
          notes: input.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_PRODUCTS_KEY] });
    },
  });
}

interface UpdateUserProductInput {
  id: string;
  name?: string;
  brand?: string;
  category?: ProductCategory;
  serving_size_g?: number;
  serving_label?: string;
  calories_per_serving?: number;
  protein_per_serving?: number;
  carbs_per_serving?: number;
  fat_per_serving?: number;
  fiber_per_serving?: number;
  aliases?: string[];
  is_favorite?: boolean;
  notes?: string;
}

/**
 * Update an existing user product (e.g. add aliases, correct macros).
 */
export function useUpdateUserProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateUserProductInput) => {
      const { data, error } = await supabase
        .from('user_products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as UserProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_PRODUCTS_KEY] });
    },
  });
}

/**
 * Delete a user product.
 */
export function useDeleteUserProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_PRODUCTS_KEY] });
    },
  });
}

/**
 * Increment use_count for a product (called after a meal is logged with this product).
 * Silent — does not invalidate query cache since use_count is non-critical.
 */
export function useIncrementProductUseCount() {
  return useMutation({
    mutationFn: async (productId: string) => {
      // Use RPC or raw update — increment atomically
      const { error } = await supabase.rpc('increment_product_use_count', {
        product_id: productId,
      });

      // Fallback: If RPC doesn't exist yet, do manual update
      if (error) {
        const { data: current } = await supabase
          .from('user_products')
          .select('use_count')
          .eq('id', productId)
          .single();

        if (current) {
          await supabase
            .from('user_products')
            .update({ use_count: (current.use_count ?? 0) + 1 })
            .eq('id', productId);
        }
      }
    },
  });
}
