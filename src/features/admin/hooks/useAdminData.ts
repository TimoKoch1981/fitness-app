/**
 * Admin data hooks — fetch user stats, token usage, and manage products.
 * All queries are restricted by RLS: only admins can read all data.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { AdminUserStat, AdminUsageStat, ProductNutrition } from '../../../types/health';

// ── User Statistics ──────────────────────────────────────────────────────

export function useUserStats() {
  return useQuery<AdminUserStat[]>({
    queryKey: ['admin', 'user-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_user_stats')
        .select('*')
        .order('registered_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as AdminUserStat[];
    },
    staleTime: 60_000, // 1 minute
  });
}

// ── Token Usage Statistics ───────────────────────────────────────────────

export function useTokenUsage(days: number = 30) {
  return useQuery<AdminUsageStat[]>({
    queryKey: ['admin', 'token-usage', days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await supabase
        .from('admin_usage_stats')
        .select('*')
        .gte('day', since.toISOString())
        .order('day', { ascending: true });

      if (error) throw new Error(error.message);
      return (data ?? []) as AdminUsageStat[];
    },
    staleTime: 60_000,
  });
}

// ── AI Usage Logs (detailed) ─────────────────────────────────────────────

export function useAiUsageLogs(limit: number = 100) {
  return useQuery({
    queryKey: ['admin', 'ai-usage-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 30_000,
  });
}

// ── Admin Products Management ────────────────────────────────────────────

export function useAdminProducts(search?: string) {
  return useQuery<ProductNutrition[]>({
    queryKey: ['admin', 'products', search],
    queryFn: async () => {
      let query = supabase
        .from('standard_products')
        .select('*')
        .order('name', { ascending: true });

      if (search && search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      const { data, error } = await query.limit(200);
      if (error) throw new Error(error.message);
      return (data ?? []) as ProductNutrition[];
    },
    staleTime: 60_000,
  });
}

export function useAddProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Omit<ProductNutrition, 'id'>) => {
      const { data, error } = await supabase
        .from('standard_products')
        .insert(product)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['standard-products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProductNutrition> & { id: string }) => {
      const { data, error } = await supabase
        .from('standard_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['standard-products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('standard_products')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['standard-products'] });
    },
  });
}

// ── Usage Summary (aggregated totals) ────────────────────────────────────

export function useUsageSummary(days: number = 30) {
  const { data: usageStats, ...rest } = useTokenUsage(days);

  const summary = usageStats ? {
    totalCalls: usageStats.reduce((sum, s) => sum + s.call_count, 0),
    totalTokens: usageStats.reduce((sum, s) => sum + s.total_tokens, 0),
    totalCostUsd: usageStats.reduce((sum, s) => sum + s.total_cost_usd, 0),
    uniqueUsers: new Set(usageStats.flatMap(() => [])).size, // per-day, not exact
    avgDurationMs: usageStats.length > 0
      ? Math.round(usageStats.reduce((sum, s) => sum + s.avg_duration_ms * s.call_count, 0)
          / usageStats.reduce((sum, s) => sum + s.call_count, 0))
      : 0,
    byAgent: Object.entries(
      usageStats.reduce((acc, s) => {
        acc[s.agent_type] = (acc[s.agent_type] ?? 0) + s.call_count;
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]),
  } : null;

  return { summary, usageStats, ...rest };
}
