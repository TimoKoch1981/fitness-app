/**
 * Hook for symptom log CRUD operations.
 * Pattern follows useSleep.ts and useMenstrualCycle.ts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { today } from '../../../lib/utils';
import type { SymptomLog, SymptomKey } from '../../../types/health';

const SL_KEY = 'symptom_logs';

/** Fetch recent symptom logs (default: last 7 days) */
export function useSymptomLogs(limit = 7) {
  return useQuery({
    queryKey: [SL_KEY, limit],
    queryFn: async (): Promise<SymptomLog[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Fetch today's symptom log */
export function useTodaySymptomLog() {
  return useQuery({
    queryKey: [SL_KEY, 'today'],
    queryFn: async (): Promise<SymptomLog | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('symptom_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today())
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

interface AddSymptomLogInput {
  date?: string;
  symptoms: SymptomKey[];
  severity?: number;
  notes?: string;
}

/** Add or update today's symptom log (upsert) */
export function useAddSymptomLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddSymptomLogInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('symptom_logs')
        .upsert(
          {
            user_id: user.id,
            date: input.date ?? today(),
            symptoms: input.symptoms,
            severity: input.severity ?? null,
            notes: input.notes ?? null,
          },
          { onConflict: 'user_id,date' },
        )
        .select()
        .single();

      if (error) throw error;
      return data as SymptomLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SL_KEY] });
    },
  });
}

/** Delete a symptom log entry */
export function useDeleteSymptomLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('symptom_logs').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SL_KEY] });
    },
  });
}

// === Helpers ===

/** Emoji per symptom key (for UI display) */
export function getSymptomEmoji(key: SymptomKey): string {
  const map: Record<SymptomKey, string> = {
    headache: '🤕',
    back_pain: '🔙',
    neck_pain: '🦴',
    joint_pain: '🦵',
    muscle_soreness: '💪',
    bloating: '🎈',
    nausea: '🤢',
    diarrhea: '🚽',
    constipation: '😣',
    loss_of_appetite: '🍽️',
    cough: '😷',
    sore_throat: '🤒',
    congestion: '🤧',
    shortness_of_breath: '😮‍💨',
    rash: '🔴',
    acne: '🧴',
    dry_skin: '🏜️',
    itching: '🐛',
    brain_fog: '🌫️',
    dizziness: '💫',
    fatigue: '😴',
    insomnia: '🌙',
    palpitations: '💓',
    fever: '🌡️',
  };
  return map[key] ?? '❓';
}

/** Severity label */
export function getSeverityLabel(severity: number, de: boolean): string {
  const labels = de
    ? ['Mild', 'Leicht', 'Mittel', 'Stark', 'Sehr stark']
    : ['Mild', 'Light', 'Moderate', 'Strong', 'Very strong'];
  return labels[severity - 1] ?? '';
}

/** Severity emoji */
export function getSeverityEmoji(severity: number): string {
  return ['😊', '🙁', '😐', '😣', '😫'][severity - 1] ?? '❓';
}
