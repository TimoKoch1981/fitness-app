import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { today } from '../../lib/utils';

export interface GapInfo {
  /** Days since last meal was logged (null = never logged) */
  mealGapDays: number | null;
  /** Days since last workout was logged (null = never logged) */
  workoutGapDays: number | null;
  /** True if any gap >= threshold */
  hasGap: boolean;
  /** Whether data is still loading */
  isLoading: boolean;
}

const GAP_THRESHOLD_DAYS = 2;

function daysBetween(dateStr: string, todayStr: string): number {
  const d1 = new Date(dateStr + 'T00:00:00');
  const d2 = new Date(todayStr + 'T00:00:00');
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Detects gaps in meal and workout logging.
 * Returns gap info when user hasn't logged for 2+ days.
 */
export function useGapDetection(threshold = GAP_THRESHOLD_DAYS): GapInfo {
  const todayStr = today();

  const { data, isLoading } = useQuery({
    queryKey: ['gap-detection', todayStr],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { lastMealDate: null, lastWorkoutDate: null };

      // Fetch most recent meal date
      const { data: lastMeal } = await supabase
        .from('meals')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      // Fetch most recent workout date
      const { data: lastWorkout } = await supabase
        .from('workouts')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      return {
        lastMealDate: lastMeal?.date ?? null,
        lastWorkoutDate: lastWorkout?.date ?? null,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const mealGapDays = data?.lastMealDate ? daysBetween(data.lastMealDate, todayStr) : null;
  const workoutGapDays = data?.lastWorkoutDate ? daysBetween(data.lastWorkoutDate, todayStr) : null;

  const hasGap =
    (mealGapDays !== null && mealGapDays >= threshold) ||
    (workoutGapDays !== null && workoutGapDays >= threshold);

  return { mealGapDays, workoutGapDays, hasGap, isLoading };
}
