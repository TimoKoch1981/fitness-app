/**
 * useActivityFeed — Query hook for the activity feed (own + friends' activities).
 * Also provides a mutation to post new activities.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { ActivityFeedItem, ActivityType, ActivityVisibility } from '../types';

const FEED_KEY = 'activity-feed';

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Activity feed: own + friends' + public activities, newest first */
export function useActivityFeed(limit = 50) {
  return useQuery({
    queryKey: [FEED_KEY, limit],
    queryFn: async (): Promise<ActivityFeedItem[]> => {
      const userId = await getCurrentUserId();
      if (!userId) return [];

      // RLS handles visibility — just fetch the latest activities
      const { data, error } = await supabase
        .from('activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error || !data) return [];

      // Fetch profiles for all activity authors
      const userIds = [...new Set(data.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

      return data.map(a => ({
        ...a,
        profile: profileMap.get(a.user_id)
          ? {
              id: a.user_id,
              display_name: profileMap.get(a.user_id)!.display_name,
              avatar_url: profileMap.get(a.user_id)!.avatar_url,
              profile_visibility: 'friends' as const,
            }
          : undefined,
      }));
    },
    staleTime: 30_000,
  });
}

/** Post an activity to the feed */
export function usePostActivity() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      activity_type: ActivityType;
      title: string;
      description?: string;
      data?: Record<string, unknown>;
      visibility?: ActivityVisibility;
    }) => {
      const userId = await getCurrentUserId();
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('activity_feed')
        .insert({
          user_id: userId,
          activity_type: input.activity_type,
          title: input.title,
          description: input.description ?? null,
          data: input.data ?? {},
          visibility: input.visibility ?? 'friends',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FEED_KEY] });
    },
  });
}
