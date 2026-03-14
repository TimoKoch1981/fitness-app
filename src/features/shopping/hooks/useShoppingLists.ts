/**
 * Shopping list CRUD hooks — TanStack Query + Supabase.
 * Pattern identical to usePantry.ts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../app/providers/AuthProvider';
import type { ShoppingList, ShoppingListItem, ShoppingListItemInput } from '../types';

const QUERY_KEY = 'shopping-lists';

// ── Query: Load all active shopping lists with items ──────────────────

export function useShoppingLists() {
  const { user } = useAuth();

  return useQuery<ShoppingList[]>({
    queryKey: [QUERY_KEY, user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch lists
      const { data: lists, error: listsErr } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (listsErr) throw listsErr;
      if (!lists || lists.length === 0) return [];

      // Fetch items for all lists
      const listIds = lists.map((l) => l.id);
      const { data: items, error: itemsErr } = await supabase
        .from('shopping_list_items')
        .select('*')
        .in('list_id', listIds)
        .order('category')
        .order('ingredient_name');

      if (itemsErr) throw itemsErr;

      // Group items by list
      const itemsByList = new Map<string, ShoppingListItem[]>();
      for (const item of (items ?? []) as ShoppingListItem[]) {
        const list = itemsByList.get(item.list_id) ?? [];
        list.push(item);
        itemsByList.set(item.list_id, list);
      }

      return (lists as ShoppingList[]).map((l) => ({
        ...l,
        items: itemsByList.get(l.id) ?? [],
      }));
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

// ── Mutation: Create a new shopping list ──────────────────────────────

interface CreateListInput {
  name: string;
  items: ShoppingListItemInput[];
  source_recipe_id?: string;
}

export function useCreateShoppingList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateListInput) => {
      if (!user) throw new Error('Not authenticated');

      // 1. Create list
      const { data: list, error: listErr } = await supabase
        .from('shopping_lists')
        .insert({
          user_id: user.id,
          name: input.name,
          source_recipe_id: input.source_recipe_id ?? null,
        })
        .select()
        .single();

      if (listErr) throw listErr;

      // 2. Insert items
      if (input.items.length > 0) {
        const rows = input.items.map((item) => ({
          list_id: list.id,
          ingredient_name: item.ingredient_name,
          ingredient_normalized: item.ingredient_normalized,
          amount: item.amount,
          unit: item.unit,
          category: item.category,
          is_checked: false,
        }));

        const { error: itemsErr } = await supabase
          .from('shopping_list_items')
          .insert(rows);

        if (itemsErr) throw itemsErr;
      }

      return list as ShoppingList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ── Mutation: Toggle item checked ─────────────────────────────────────

export function useToggleShoppingItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_checked }: { id: string; is_checked: boolean }) => {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ is_checked })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ── Mutation: Add items to existing list ──────────────────────────────

export function useAddItemsToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, items }: { listId: string; items: ShoppingListItemInput[] }) => {
      if (items.length === 0) return;

      const rows = items.map((item) => ({
        list_id: listId,
        ingredient_name: item.ingredient_name,
        ingredient_normalized: item.ingredient_normalized,
        amount: item.amount,
        unit: item.unit,
        category: item.category,
        is_checked: false,
      }));

      const { error } = await supabase
        .from('shopping_list_items')
        .insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ── Mutation: Delete a shopping list ──────────────────────────────────

export function useDeleteShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      // Items are cascade-deleted via FK
      const { error } = await supabase
        .from('shopping_lists')
        .delete()
        .eq('id', listId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// ── Mutation: Mark list as completed ──────────────────────────────────

export function useCompleteShoppingList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const { error } = await supabase
        .from('shopping_lists')
        .update({ is_active: false, completed_at: new Date().toISOString() })
        .eq('id', listId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}
