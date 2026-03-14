/**
 * CRUD hooks for the user's personal pantry (user_pantry table).
 * Supports: load, add (batch), update status, remove, clear.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../app/providers/AuthProvider';
import type { PantryItem, PantryStatus, BuyPreference, IngredientCatalogItem } from '../types';
import { normalizeIngredient } from '../types';

// ── Query: Load user's pantry ─────────────────────────────────────────

export function usePantry() {
  const { user } = useAuth();

  return useQuery<PantryItem[]>({
    queryKey: ['user-pantry', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_pantry')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'empty')
        .order('category')
        .order('ingredient_name');

      if (error) throw error;
      return (data ?? []) as PantryItem[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

/** Load ALL pantry items including empty (for setup/management) */
export function usePantryAll() {
  const { user } = useAuth();

  return useQuery<PantryItem[]>({
    queryKey: ['user-pantry-all', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_pantry')
        .select('*')
        .eq('user_id', user.id)
        .order('category')
        .order('ingredient_name');

      if (error) throw error;
      return (data ?? []) as PantryItem[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

// ── Mutation: Add items to pantry (batch) ─────────────────────────────

interface AddPantryItemInput {
  ingredient_id?: string;
  ingredient_name: string;
  category?: string;
  quantity_text?: string;
  storage_location?: string;
  buy_preference?: BuyPreference;
  expires_at?: string;
}

export function useAddPantryItems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: AddPantryItemInput[]) => {
      if (!user) throw new Error('Not authenticated');

      const rows = items.map((item) => ({
        user_id: user.id,
        ingredient_id: item.ingredient_id || null,
        ingredient_name: item.ingredient_name,
        ingredient_normalized: normalizeIngredient(item.ingredient_name),
        category: item.category || 'sonstiges',
        quantity_text: item.quantity_text || null,
        storage_location: item.storage_location || null,
        status: 'available' as PantryStatus,
        buy_preference: item.buy_preference || 'sometimes',
        expires_at: item.expires_at || null,
        last_confirmed_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('user_pantry')
        .upsert(rows, { onConflict: 'user_id,ingredient_normalized' })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-pantry'] });
      queryClient.invalidateQueries({ queryKey: ['user-pantry-all'] });
    },
  });
}

// ── Mutation: Add from catalog items (batch — for setup wizard) ───────

export function useAddFromCatalog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (catalogItems: IngredientCatalogItem[]) => {
      if (!user) throw new Error('Not authenticated');

      const rows = catalogItems.map((item) => ({
        user_id: user.id,
        ingredient_id: item.id,
        ingredient_name: item.name_de,
        ingredient_normalized: normalizeIngredient(item.name_de),
        category: item.category,
        storage_location: item.storage_type,
        status: 'available' as PantryStatus,
        buy_preference: item.is_staple ? 'always' as BuyPreference : 'sometimes' as BuyPreference,
        last_confirmed_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('user_pantry')
        .upsert(rows, { onConflict: 'user_id,ingredient_normalized' })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-pantry'] });
      queryClient.invalidateQueries({ queryKey: ['user-pantry-all'] });
    },
  });
}

// ── Mutation: Update item status ──────────────────────────────────────

export function useUpdatePantryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      buy_preference,
      quantity_text,
      expires_at,
    }: {
      id: string;
      status?: PantryStatus;
      buy_preference?: BuyPreference;
      quantity_text?: string | null;
      expires_at?: string | null;
    }) => {
      const updates: Record<string, unknown> = { last_confirmed_at: new Date().toISOString() };
      if (status !== undefined) updates.status = status;
      if (buy_preference !== undefined) updates.buy_preference = buy_preference;
      if (quantity_text !== undefined) updates.quantity_text = quantity_text;
      if (expires_at !== undefined) updates.expires_at = expires_at;

      const { error } = await supabase
        .from('user_pantry')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-pantry'] });
      queryClient.invalidateQueries({ queryKey: ['user-pantry-all'] });
    },
  });
}

// ── Mutation: Remove item ─────────────────────────────────────────────

export function useRemovePantryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_pantry')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-pantry'] });
      queryClient.invalidateQueries({ queryKey: ['user-pantry-all'] });
    },
  });
}

// ── Mutation: Clear entire pantry ─────────────────────────────────────

export function useClearPantry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('user_pantry')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-pantry'] });
      queryClient.invalidateQueries({ queryKey: ['user-pantry-all'] });
    },
  });
}
