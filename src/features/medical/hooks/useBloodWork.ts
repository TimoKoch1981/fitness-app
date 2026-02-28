/**
 * Hook for fetching blood work data from Supabase.
 * Used by Power+ mode widgets (BloodWorkDashboard, HematocritAlert).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
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
