/**
 * useLastWorkoutForDay — Loads the most recent workout session
 * for a given plan + day number. Used to show "last time" values
 * during a live workout session.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { Workout } from '../../../types/health';

const LAST_WORKOUT_KEY = 'last_workout_for_day';

export function useLastWorkoutForDay(planId: string | undefined, dayNumber: number | undefined) {
  return useQuery({
    queryKey: [LAST_WORKOUT_KEY, planId, dayNumber],
    enabled: !!planId && dayNumber != null,
    queryFn: async (): Promise<Workout | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_id', planId!)
        .eq('plan_day_number', dayNumber!)
        .not('session_exercises', 'is', null)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as Workout | null;
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
