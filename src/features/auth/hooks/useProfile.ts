import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { UserProfile, Gender, BMRFormula, PersonalGoals } from '../../../types/health';

export const PROFILE_KEY = 'profile';

/**
 * Fetch the current user's profile.
 */
export function useProfile() {
  return useQuery({
    queryKey: [PROFILE_KEY],
    queryFn: async (): Promise<UserProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ?? null;
    },
  });
}

interface UpdateProfileInput {
  display_name?: string;
  height_cm?: number;
  birth_date?: string;
  gender?: Gender;
  activity_level?: number;
  daily_calories_goal?: number;
  daily_protein_goal?: number;
  daily_water_goal?: number;
  preferred_language?: 'de' | 'en';
  preferred_bmr_formula?: BMRFormula;
  personal_goals?: PersonalGoals;
  avatar_url?: string | null;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(input)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROFILE_KEY] });
    },
  });
}
