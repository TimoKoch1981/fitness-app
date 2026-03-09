/**
 * Hook for fetching and writing blood work data from/to Supabase.
 * Read hooks used by Power+ mode widgets (BloodWorkDashboard, HematocritAlert).
 * Write hook (useAddBloodWork) used by AddBloodWorkDialog + AI action executor.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { ensureFreshSession } from '../../../lib/refreshSession';
import type { BloodWork } from '../../../types/health';

const BW_KEY = 'blood_work';

export function useBloodWorkLogs(limit = 10) {
  return useQuery({
    queryKey: [BW_KEY, limit],
    queryFn: async (): Promise<BloodWork[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('blood_work')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Returns only the latest blood work entry */
export function useLatestBloodWork() {
  return useQuery({
    queryKey: [BW_KEY, 'latest'],
    queryFn: async (): Promise<BloodWork | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('blood_work')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
}

/** Input for adding a blood work entry */
export interface AddBloodWorkInput {
  date?: string;
  testosterone_total?: number;
  testosterone_free?: number;
  estradiol?: number;
  lh?: number;
  fsh?: number;
  shbg?: number;
  prolactin?: number;
  hematocrit?: number;
  hemoglobin?: number;
  hdl?: number;
  ldl?: number;
  triglycerides?: number;
  total_cholesterol?: number;
  ast?: number;
  alt?: number;
  ggt?: number;
  creatinine?: number;
  egfr?: number;
  tsh?: number;
  psa?: number;
  hba1c?: number;
  vitamin_d?: number;
  ferritin?: number;
  notes?: string;
  user_id?: string;
}

/** Insert a new blood work entry */
export function useAddBloodWork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddBloodWorkInput) => {
      let userId = input.user_id;
      if (!userId) {
        userId = await ensureFreshSession();
      }

      const { user_id: _uid, ...rest } = input;
      const { data, error } = await supabase
        .from('blood_work')
        .insert({
          user_id: userId,
          date: rest.date ?? new Date().toISOString().slice(0, 10),
          testosterone_total: rest.testosterone_total,
          testosterone_free: rest.testosterone_free,
          estradiol: rest.estradiol,
          lh: rest.lh,
          fsh: rest.fsh,
          shbg: rest.shbg,
          prolactin: rest.prolactin,
          hematocrit: rest.hematocrit,
          hemoglobin: rest.hemoglobin,
          hdl: rest.hdl,
          ldl: rest.ldl,
          triglycerides: rest.triglycerides,
          total_cholesterol: rest.total_cholesterol,
          ast: rest.ast,
          alt: rest.alt,
          ggt: rest.ggt,
          creatinine: rest.creatinine,
          egfr: rest.egfr,
          tsh: rest.tsh,
          psa: rest.psa,
          hba1c: rest.hba1c,
          vitamin_d: rest.vitamin_d,
          ferritin: rest.ferritin,
          notes: rest.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BloodWork;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BW_KEY] });
    },
  });
}

/** Delete a blood work entry */
export function useDeleteBloodWork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blood_work').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BW_KEY] });
    },
  });
}
