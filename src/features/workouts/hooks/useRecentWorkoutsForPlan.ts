/**
 * useRecentWorkoutsForPlan — Load recent workouts for a specific plan.
 *
 * Used by ReviewDialog to generate mesocycle review summaries.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Workout } from '../../../types/health';

/**
 * Load the most recent workouts for a given plan.
 *
 * @param planId - Training plan ID
 * @param limit - Max number of workouts to load (default: 20)
 */
export function useRecentWorkoutsForPlan(planId: string | undefined, limit: number = 20) {
  return useQuery({
    queryKey: ['workouts', 'plan', planId, limit],
    queryFn: async (): Promise<Workout[]> => {
      if (!planId) return [];

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('plan_id', planId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as Workout[];
    },
    enabled: !!planId,
    staleTime: 5 * 60 * 1000,
  });
}
