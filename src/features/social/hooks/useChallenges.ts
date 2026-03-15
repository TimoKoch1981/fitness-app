/**
 * useChallenges — CRUD hooks for the challenge system.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Challenge, ChallengeParticipant, ChallengeType } from '../types';

const CHALLENGES_KEY = 'challenges';

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── Queries ──────────────────────────────────────────────────────────

/** Active challenges the user participates in */
export function useMyChallenges() {
  return useQuery({
    queryKey: [CHALLENGES_KEY, 'my'],
    queryFn: async (): Promise<Challenge[]> => {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      // Get challenge IDs user participates in
      const { data: participations } = await supabase
        .from('challenge_participants')
        .select('challenge_id')
        .eq('user_id', userId);

      const challengeIds = (participations ?? []).map(p => p.challenge_id);

      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .or(challengeIds.length > 0
          ? `creator_id.eq.${userId},id.in.(${challengeIds.join(',')})`
          : `creator_id.eq.${userId}`)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      if (error || !data) return [];
      return data;
    },
    staleTime: 60_000,
  });
}

/** Leaderboard for a specific challenge */
export function useChallengeLeaderboard(challengeId: string | null) {
  return useQuery({
    queryKey: [CHALLENGES_KEY, 'leaderboard', challengeId],
    enabled: !!challengeId,
    queryFn: async (): Promise<ChallengeParticipant[]> => {
      if (!challengeId) return [];

      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('current_value', { ascending: false });

      if (error || !data) return [];

      // Fetch profiles
      const userIds = data.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

      return data.map(p => ({
        ...p,
        profile: profileMap.get(p.user_id)
          ? {
              id: p.user_id,
              display_name: profileMap.get(p.user_id)!.display_name,
              avatar_url: profileMap.get(p.user_id)!.avatar_url,
              profile_visibility: 'friends' as const,
            }
          : undefined,
      }));
    },
    staleTime: 30_000,
  });
}

// ── Mutations ────────────────────────────────────────────────────────

interface CreateChallengeInput {
  title: string;
  description?: string;
  challenge_type: ChallengeType;
  target_value: number;
  target_unit?: string;
  start_date: string;
  end_date: string;
  group_id?: string;
  visibility?: 'private' | 'friends' | 'group' | 'public';
}

export function useCreateChallenge() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateChallengeInput) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('challenges')
        .insert({
          ...input,
          creator_id: userId,
          visibility: input.visibility ?? 'friends',
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join creator
      await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: data.id,
          user_id: userId,
          current_value: 0,
        });

      return data as Challenge;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CHALLENGES_KEY] });
    },
  });
}

export function useJoinChallenge() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('challenge_participants')
        .insert({ challenge_id: challengeId, user_id: userId, current_value: 0 });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CHALLENGES_KEY] });
    },
  });
}

export function useUpdateChallengeProgress() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, value }: { challengeId: string; value: number }) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('challenge_participants')
        .update({ current_value: value })
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CHALLENGES_KEY] });
    },
  });
}

export function useDeleteChallenge() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CHALLENGES_KEY] });
    },
  });
}
