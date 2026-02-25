/**
 * Feedback hooks — submit feedback (bug, note, praise) and view own history.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Feedback, FeedbackInput } from '../types';

const FEEDBACK_KEY = 'feedback';

/** Collect automatic bug context from browser environment. */
export function collectBugContext(): { page_url: string; user_agent: string; app_version: string } {
  return {
    page_url: typeof window !== 'undefined' ? window.location.pathname : '',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    app_version: '9.0',
  };
}

/** Query: current user's own feedback history. */
export function useMyFeedback() {
  return useQuery<Feedback[]>({
    queryKey: [FEEDBACK_KEY, 'mine'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as Feedback[];
    },
  });
}

/** Mutation: submit new feedback. */
export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: FeedbackInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const context = collectBugContext();

      const { data, error } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          category: input.category,
          rating: input.rating ?? null,
          message: input.message ?? null,
          page_url: input.page_url ?? context.page_url,
          user_agent: input.user_agent ?? context.user_agent,
          app_version: context.app_version,
          screenshot_url: input.screenshot_url ?? null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data as Feedback;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FEEDBACK_KEY] });
    },
  });
}
