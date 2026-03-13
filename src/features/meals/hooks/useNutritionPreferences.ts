/**
 * Hook for fetching learned nutrition preferences.
 * Used by InlineBuddyChat to pass preferences into agent context.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../app/providers/AuthProvider';
import type { StoredPreference } from '../../../lib/ai/nutritionPreferenceEngine';

export function useNutritionPreferences() {
  const { user } = useAuth();

  return useQuery<StoredPreference[]>({
    queryKey: ['nutrition_preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_nutrition_preferences')
        .select('*')
        .eq('user_id', user.id)
        .gte('confidence', 0.4)
        .order('confidence', { ascending: false })
        .limit(30);
      if (error) {
        console.warn('[useNutritionPreferences] Query error:', error.message);
        return [];
      }
      return (data || []) as StoredPreference[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
