/**
 * Feature request hooks — list, submit, vote on feature requests.
 * All authenticated users can view and vote. Users submit their own requests.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { FeatureRequest, FeatureRequestInput, FeatureVote, VoteType } from '../types';

const FEATURE_KEY = 'feature-requests';
const VOTES_KEY = 'feature-votes';

/** Query: all feature requests (public, sorted). */
export function useFeatureRequests(sortBy: 'votes' | 'newest' = 'votes') {
  return useQuery<FeatureRequest[]>({
    queryKey: [FEATURE_KEY, sortBy],
    queryFn: async () => {
      const orderCol = sortBy === 'votes' ? 'vote_count' : 'created_at';

      const { data, error } = await supabase
        .from('feature_requests')
        .select('*')
        .order(orderCol, { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as FeatureRequest[];
    },
    staleTime: 30_000,
  });
}

/** Query: current user's votes (to show active vote state in UI). */
export function useMyVotes() {
  return useQuery<FeatureVote[]>({
    queryKey: [VOTES_KEY, 'mine'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('feature_votes')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);
      return (data ?? []) as FeatureVote[];
    },
  });
}

/** Mutation: submit a new feature request. */
export function useSubmitFeatureRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FeatureRequestInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('feature_requests')
        .insert({
          user_id: user.id,
          title: input.title,
          description: input.description ?? null,
          category: input.category ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as FeatureRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEATURE_KEY] });
    },
  });
}

/** Mutation: vote on a feature request (upsert — changes existing vote or creates new). */
export function useVoteFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ featureRequestId, voteType }: { featureRequestId: string; voteType: VoteType }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check existing vote
      const { data: existing } = await supabase
        .from('feature_votes')
        .select('id, vote_type')
        .eq('user_id', user.id)
        .eq('feature_request_id', featureRequestId)
        .single();

      if (existing) {
        if (existing.vote_type === voteType) {
          // Same vote = remove it (toggle off)
          const { error } = await supabase
            .from('feature_votes')
            .delete()
            .eq('id', existing.id);
          if (error) throw new Error(error.message);
          return null; // Vote removed
        } else {
          // Different vote = update
          const { data, error } = await supabase
            .from('feature_votes')
            .update({ vote_type: voteType })
            .eq('id', existing.id)
            .select()
            .single();
          if (error) throw new Error(error.message);
          return data as FeatureVote;
        }
      } else {
        // No existing vote = insert
        const { data, error } = await supabase
          .from('feature_votes')
          .insert({
            user_id: user.id,
            feature_request_id: featureRequestId,
            vote_type: voteType,
          })
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data as FeatureVote;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEATURE_KEY] });
      queryClient.invalidateQueries({ queryKey: [VOTES_KEY] });
    },
  });
}
