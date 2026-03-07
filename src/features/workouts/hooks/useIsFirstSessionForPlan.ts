/**
 * useIsFirstSessionForPlan — Checks if this is the first workout session for a plan.
 *
 * Used by RIR-Feedback dialog: Only show weight adjustment prompts in the very first session
 * after calibration. After that, the auto-calibration (Double Progression) takes over.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';

/**
 * Check if there are any completed workouts for a given plan.
 * Returns isFirstSession=true if no previous workouts exist.
 */
export function useIsFirstSessionForPlan(planId: string | undefined) {
  return useQuery({
    queryKey: ['workout_history', 'first_check', planId],
    queryFn: async () => {
      if (!planId) return { isFirstSession: true };

      const { data, error } = await supabase
        .from('workouts')
        .select('id')
        .eq('plan_id', planId)
        .limit(1);

      if (error) {
        console.warn('[useIsFirstSessionForPlan] Query error:', error);
        return { isFirstSession: false }; // Fail safe: don't show dialog
      }

      return { isFirstSession: !data || data.length === 0 };
    },
    enabled: !!planId,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
