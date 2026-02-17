import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { today } from '../../../lib/utils';
import type { Substance, SubstanceLog, SubstanceCategory, SubstanceAdminType, InjectionSite } from '../../../types/health';

const SUBSTANCES_KEY = 'substances';
const SUBSTANCE_LOGS_KEY = 'substance_logs';

// === SUBSTANCES ===

export function useSubstances(activeOnly = true) {
  return useQuery({
    queryKey: [SUBSTANCES_KEY, activeOnly],
    queryFn: async (): Promise<Substance[]> => {
      let query = supabase.from('substances').select('*').order('name');
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

interface AddSubstanceInput {
  name: string;
  category?: SubstanceCategory;
  type?: SubstanceAdminType;
  dosage?: string;
  unit?: string;
  frequency?: string;
  ester?: string;
  half_life_days?: number;
  start_date?: string;
  notes?: string;
}

export function useAddSubstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddSubstanceInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('substances')
        .insert({ user_id: user.id, ...input, is_active: true })
        .select()
        .single();

      if (error) throw error;
      return data as Substance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBSTANCES_KEY] });
    },
  });
}

export function useToggleSubstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('substances')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBSTANCES_KEY] });
    },
  });
}

// === SUBSTANCE LOGS ===

export function useSubstanceLogs(limit = 30) {
  return useQuery({
    queryKey: [SUBSTANCE_LOGS_KEY, limit],
    queryFn: async (): Promise<SubstanceLog[]> => {
      const { data, error } = await supabase
        .from('substance_logs')
        .select('*, substances(name)')
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map((log: any) => ({
        ...log,
        substance_name: log.substances?.name,
      }));
    },
  });
}

interface LogSubstanceInput {
  substance_id: string;
  date?: string;
  time?: string;
  dosage_taken?: string;
  taken?: boolean;
  site?: InjectionSite;
  notes?: string;
}

export function useLogSubstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LogSubstanceInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const now = new Date();
      const { data, error } = await supabase
        .from('substance_logs')
        .insert({
          ...input,
          user_id: user.id,
          date: input.date || today(),
          time: input.time || `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
          taken: input.taken ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as SubstanceLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBSTANCE_LOGS_KEY] });
    },
  });
}
