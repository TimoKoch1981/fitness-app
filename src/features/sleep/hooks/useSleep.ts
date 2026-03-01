import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { SleepLog } from '../../../types/health';

const SLEEP_KEY = 'sleep_logs';

/**
 * Calculate sleep duration in minutes from bedtime and wake_time strings (HH:mm).
 * Handles overnight sleep (bedtime before midnight, wake after midnight).
 */
export function calculateSleepDuration(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  const bedMinutes = bh * 60 + bm;
  const wakeMinutes = wh * 60 + wm;

  if (wakeMinutes >= bedMinutes) {
    return wakeMinutes - bedMinutes;
  }
  // Overnight: e.g. 23:00 → 07:00
  return (24 * 60 - bedMinutes) + wakeMinutes;
}

/**
 * Format duration in minutes to human-readable "Xh Ym" string.
 */
export function formatSleepDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

/**
 * Get sleep quality label key (for i18n).
 */
export function getSleepQualityKey(quality: number): string {
  const keys: Record<number, string> = {
    1: 'veryPoor',
    2: 'poor',
    3: 'fair',
    4: 'good',
    5: 'veryGood',
  };
  return keys[quality] ?? 'fair';
}

/** Fetch recent sleep logs for the current user. */
export function useSleepLogs(limit = 30) {
  return useQuery({
    queryKey: [SLEEP_KEY, limit],
    queryFn: async (): Promise<SleepLog[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
  });
}

interface AddSleepInput {
  date: string;
  bedtime?: string;
  wake_time?: string;
  duration_minutes?: number;
  quality?: number;
  notes?: string;
}

/** Add or update a sleep log (upsert by user_id + date). */
export function useAddSleepLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddSleepInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Auto-calculate duration if bedtime + wake_time given
      let duration = input.duration_minutes;
      if (!duration && input.bedtime && input.wake_time) {
        duration = calculateSleepDuration(input.bedtime, input.wake_time);
      }

      const { data, error } = await supabase
        .from('sleep_logs')
        .upsert(
          {
            user_id: user.id,
            date: input.date,
            bedtime: input.bedtime || null,
            wake_time: input.wake_time || null,
            duration_minutes: duration || null,
            quality: input.quality || null,
            notes: input.notes || null,
          },
          { onConflict: 'user_id,date' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as SleepLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SLEEP_KEY] });
    },
  });
}

/** Delete a sleep log by ID. */
export function useDeleteSleepLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sleep_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SLEEP_KEY] });
    },
  });
}
