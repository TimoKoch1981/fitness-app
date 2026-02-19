import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { classifyBloodPressure } from '../../../lib/calculations';
import type { BloodPressure } from '../../../types/health';

const BP_KEY = 'blood_pressure';

export function useBloodPressureLogs(limit = 30) {
  return useQuery({
    queryKey: [BP_KEY, limit],
    queryFn: async (): Promise<BloodPressure[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('blood_pressure_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
  });
}

interface AddBPInput {
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  notes?: string;
  /** Pre-resolved user ID — skips getUser() network call */
  user_id?: string;
}

export function useAddBloodPressure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddBPInput) => {
      let userId = input.user_id;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        userId = user.id;
      }

      const { classification } = classifyBloodPressure(input.systolic, input.diastolic);

      const { data, error } = await supabase
        .from('blood_pressure_logs')
        .insert({
          user_id: userId,
          ...input,
          classification,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BloodPressure;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BP_KEY] });
    },
  });
}

export function useDeleteBloodPressure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blood_pressure_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BP_KEY] });
    },
  });
}
