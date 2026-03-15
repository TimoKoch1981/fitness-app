/**
 * useGroups — CRUD hooks for the group/community system.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Group, GroupMember } from '../types';

const GROUPS_KEY = 'groups';

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── Queries ──────────────────────────────────────────────────────────

/** All groups the current user is a member of */
export function useMyGroups() {
  return useQuery({
    queryKey: [GROUPS_KEY, 'my'],
    queryFn: async (): Promise<Group[]> => {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      // Get group IDs user is member of
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      if (!memberships || memberships.length === 0) {
        // Also include owned groups
        const { data: owned } = await supabase
          .from('groups')
          .select('*')
          .eq('owner_id', userId);
        return owned ?? [];
      }

      const groupIds = memberships.map(m => m.group_id);

      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .or(`id.in.(${groupIds.join(',')}),owner_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data;
    },
    staleTime: 60_000,
  });
}

/** Public groups for discovery */
export function usePublicGroups() {
  return useQuery({
    queryKey: [GROUPS_KEY, 'public'],
    queryFn: async (): Promise<Group[]> => {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data) return [];
      return data;
    },
    staleTime: 120_000,
  });
}

/** Members of a specific group */
export function useGroupMembers(groupId: string | null) {
  return useQuery({
    queryKey: [GROUPS_KEY, 'members', groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<GroupMember[]> => {
      if (!groupId) return [];

      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (error || !data) return [];

      // Fetch profiles
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

      return data.map(m => ({
        ...m,
        profile: profileMap.get(m.user_id)
          ? {
              id: m.user_id,
              display_name: profileMap.get(m.user_id)!.display_name,
              avatar_url: profileMap.get(m.user_id)!.avatar_url,
              profile_visibility: 'friends' as const,
            }
          : undefined,
      }));
    },
    staleTime: 60_000,
  });
}

// ── Mutations ────────────────────────────────────────────────────────

export function useCreateGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; description?: string; visibility?: 'private' | 'public' }) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('groups')
        .insert({
          name: input.name,
          description: input.description ?? null,
          owner_id: userId,
          visibility: input.visibility ?? 'private',
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join as admin
      await supabase
        .from('group_members')
        .insert({
          group_id: data.id,
          user_id: userId,
          role: 'admin',
        });

      return data as Group;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GROUPS_KEY] });
    },
  });
}

export function useJoinGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_members')
        .insert({ group_id: groupId, user_id: userId, role: 'member' });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GROUPS_KEY] });
    },
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GROUPS_KEY] });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GROUPS_KEY] });
    },
  });
}
