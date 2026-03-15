/**
 * useFriendships — CRUD hooks for the friendship system.
 *
 * - useFriends() — list accepted friends
 * - usePendingRequests() — incoming friend requests
 * - useSendFriendRequest() — send a friend request
 * - useAcceptFriendRequest() — accept a pending request
 * - useDeclineFriendRequest() — decline / remove friendship
 * - useSearchUsers() — search for users by display_name
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Friendship, FriendProfile } from '../types';

const FRIENDS_KEY = 'friendships';

// ── Helpers ──────────────────────────────────────────────────────────

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── Queries ──────────────────────────────────────────────────────────

export function useFriends() {
  return useQuery({
    queryKey: [FRIENDS_KEY, 'accepted'],
    queryFn: async (): Promise<Friendship[]> => {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      // Fetch friendships with profile data via a manual join approach
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

      if (error || !data) return [];

      // Collect friend IDs and fetch profiles
      const friendIds = data.map(f =>
        f.requester_id === userId ? f.addressee_id : f.requester_id,
      );

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, profile_visibility')
        .in('id', friendIds);

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

      return data.map(f => {
        const friendId = f.requester_id === userId ? f.addressee_id : f.requester_id;
        const profile = profileMap.get(friendId);
        return {
          ...f,
          friend_profile: profile
            ? {
                id: profile.id,
                display_name: profile.display_name,
                avatar_url: profile.avatar_url,
                profile_visibility: profile.profile_visibility ?? 'friends',
              }
            : { id: friendId, display_name: null, avatar_url: null, profile_visibility: 'friends' as const },
        };
      });
    },
    staleTime: 60_000,
  });
}

export function usePendingRequests() {
  return useQuery({
    queryKey: [FRIENDS_KEY, 'pending'],
    queryFn: async (): Promise<Friendship[]> => {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('status', 'pending')
        .eq('addressee_id', userId)
        .order('requested_at', { ascending: false });

      if (error || !data) return [];

      // Fetch requester profiles
      const requesterIds = data.map(f => f.requester_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', requesterIds);

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

      return data.map(f => ({
        ...f,
        friend_profile: profileMap.get(f.requester_id)
          ? {
              id: f.requester_id,
              display_name: profileMap.get(f.requester_id)!.display_name,
              avatar_url: profileMap.get(f.requester_id)!.avatar_url,
              profile_visibility: 'friends' as const,
            }
          : { id: f.requester_id, display_name: null, avatar_url: null, profile_visibility: 'friends' as const },
      }));
    },
    staleTime: 30_000,
  });
}

// ── Mutations ────────────────────────────────────────────────────────

export function useSendFriendRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (addresseeId: string) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('friendships')
        .insert({ requester_id: userId, addressee_id: addresseeId, status: 'pending' });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FRIENDS_KEY] });
    },
  });
}

export function useAcceptFriendRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', friendshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FRIENDS_KEY] });
    },
  });
}

export function useDeclineFriendRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FRIENDS_KEY] });
    },
  });
}

export function useRemoveFriend() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FRIENDS_KEY] });
    },
  });
}

// ── User Search ──────────────────────────────────────────────────────

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ['user-search', query],
    enabled: query.length >= 2,
    queryFn: async (): Promise<FriendProfile[]> => {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, profile_visibility')
        .neq('id', userId)
        .or(`profile_visibility.eq.public,profile_visibility.eq.friends`)
        .ilike('display_name', `%${query}%`)
        .limit(20);

      if (error || !data) return [];
      return data.map(p => ({
        id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        profile_visibility: p.profile_visibility ?? 'friends',
      }));
    },
    staleTime: 10_000,
  });
}
