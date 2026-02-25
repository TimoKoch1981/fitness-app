/**
 * Admin feedback hooks — manage all feedback and feature requests.
 * Restricted by RLS to admin users only.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Feedback, FeedbackStatus, FeatureRequest, FeatureRequestStatus } from '../types';

const ADMIN_FEEDBACK_KEY = 'admin-feedback';
const ADMIN_FEATURES_KEY = 'admin-feature-requests';

/** Query: all feedback (admin only). */
export function useAllFeedback(filters?: { status?: FeedbackStatus; category?: string }) {
  return useQuery<Feedback[]>({
    queryKey: [ADMIN_FEEDBACK_KEY, filters],
    queryFn: async () => {
      let query = supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return (data ?? []) as Feedback[];
    },
    staleTime: 30_000,
  });
}

/** Query: feedback statistics (admin view). */
export function useFeedbackStats() {
  return useQuery({
    queryKey: [ADMIN_FEEDBACK_KEY, 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_feedback_stats')
        .select('*');

      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

/** Query: all feature requests with author info (admin view). */
export function useAllFeatureRequests() {
  return useQuery<FeatureRequest[]>({
    queryKey: [ADMIN_FEATURES_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_feature_request_stats')
        .select('*');

      if (error) throw new Error(error.message);
      return (data ?? []) as FeatureRequest[];
    },
    staleTime: 30_000,
  });
}

/** Mutation: update feedback status / admin notes. */
export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: FeedbackStatus; admin_notes?: string }) => {
      const updates: Record<string, unknown> = { status };
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;

      const { data, error } = await supabase
        .from('feedback')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Feedback;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_FEEDBACK_KEY] });
    },
  });
}

/** Mutation: update feature request status / planned month. */
export function useUpdateFeatureRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, planned_month, admin_notes }: {
      id: string;
      status: FeatureRequestStatus;
      planned_month?: string;
      admin_notes?: string;
    }) => {
      const updates: Record<string, unknown> = { status };
      if (planned_month !== undefined) updates.planned_month = planned_month;
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;

      const { data, error } = await supabase
        .from('feature_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as FeatureRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_FEATURES_KEY] });
      queryClient.invalidateQueries({ queryKey: ['feature-requests'] });
    },
  });
}
