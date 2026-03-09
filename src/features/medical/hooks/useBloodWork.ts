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

/** Input for adding a blood work entry (38 biomarkers) */
export interface AddBloodWorkInput {
  date?: string;
  // Hormones
  testosterone_total?: number;
  testosterone_free?: number;
  estradiol?: number;
  lh?: number;
  fsh?: number;
  shbg?: number;
  prolactin?: number;
  cortisol?: number;
  free_androgen_index?: number;
  // Blood count
  hematocrit?: number;
  hemoglobin?: number;
  erythrocytes?: number;
  leukocytes?: number;
  platelets?: number;
  // Lipids
  hdl?: number;
  ldl?: number;
  triglycerides?: number;
  total_cholesterol?: number;
  // Liver
  ast?: number;
  alt?: number;
  ggt?: number;
  bilirubin?: number;
  alkaline_phosphatase?: number;
  // Kidney
  creatinine?: number;
  egfr?: number;
  urea?: number;
  // Metabolism
  fasting_glucose?: number;
  uric_acid?: number;
  iron?: number;
  total_protein?: number;
  // Electrolytes
  potassium?: number;
  sodium?: number;
  calcium?: number;
  // Other
  tsh?: number;
  psa?: number;
  free_psa?: number;
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

      const { user_id: _uid, date, ...markers } = input;
      // Spread all marker fields — Supabase ignores unknown columns gracefully
      const { data, error } = await supabase
        .from('blood_work')
        .insert({
          user_id: userId,
          date: date ?? new Date().toISOString().slice(0, 10),
          ...markers,
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
