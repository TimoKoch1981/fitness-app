/**
 * Daily Check-in Hooks — Morning wellbeing tracking.
 *
 * useTodayCheckin: fetches today's check-in (if any)
 * useAddCheckin: upsert today's check-in values
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { today } from '../../../lib/utils';
import type { DailyCheckin } from '../../../types/health';

const CHECKIN_KEY = 'daily_checkin';

/**
 * Fetch today's check-in for the current user.
 * Returns null if no check-in exists yet.
 */
export function useTodayCheckin() {
  return useQuery({
    queryKey: [CHECKIN_KEY, today()],
    queryFn: async (): Promise<DailyCheckin | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('daily_checkins')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today())
        .maybeSingle();

      if (error) throw error;
      return data ?? null;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

interface AddCheckinInput {
  energy_level?: number;
  sleep_quality?: number;
  mood?: number;
  stress_level?: number;
  pain_areas?: string[];
  illness?: boolean;
  notes?: string;
}

/**
 * Upsert today's check-in — creates or updates.
 */
export function useAddCheckin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddCheckinInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('daily_checkins')
        .upsert(
          {
            user_id: user.id,
            date: today(),
            ...input,
          },
          { onConflict: 'user_id,date' },
        )
        .select()
        .single();

      if (error) throw error;
      return data as DailyCheckin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHECKIN_KEY] });
    },
  });
}
