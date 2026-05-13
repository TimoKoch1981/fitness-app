import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../app/providers/AuthProvider';
import type { UserProfile, Gender, BMRFormula, PersonalGoals, TrainingMode, TrainingPhase, CycleStatus, BuddyAvatarStyle } from '../../../types/health';

export const PROFILE_KEY = 'profile';

/**
 * Fetch the current user's profile.
 *
 * v14.10 (P0 fix): queryKey now scoped per user.id, and `enabled` gates the
 * query on auth-ready state. Before, the query ran once at app boot with
 * queryKey=['profile'] before the session had arrived, returned null, then
 * never re-ran because the key never changed — so the in-memory cache held
 * `null` forever and `useOnboarding(null)` triggered the redirect to
 * /onboarding on every login. Now: query waits for `user`, refetches when
 * the auth user changes.
 */
export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  return useQuery({
    queryKey: [PROFILE_KEY, user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ?? null;
    },
    enabled: !authLoading && !!user,
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
  disclaimer_accepted_at?: string;
  // Granulare DSGVO-Einwilligungen
  consent_health_data_at?: string;
  consent_ai_processing_at?: string;
  consent_third_country_at?: string;
  // Training mode fields (Power/Power+)
  training_mode?: TrainingMode;
  current_phase?: TrainingPhase;
  cycle_status?: CycleStatus;
  show_date?: string;
  show_federation?: string;
  cycle_start_date?: string;
  cycle_planned_weeks?: number;
  power_plus_accepted_at?: string;
  // Dietary & Health
  dietary_preferences?: string[];
  allergies?: string[];
  health_restrictions?: string[];
  // Breastfeeding / Stillzeit
  is_breastfeeding?: boolean;
  // Data Retention / Loeschkonzept
  data_retention_months?: number | null;
  // KI-Trainer Review System
  ai_trainer_enabled?: boolean;
  // Power+ Advanced Nutrition
  show_advanced_nutrition?: boolean;
  phase_started_at?: string;
  phase_target_weeks?: number;
  // Cycle Tracking
  cycle_tracking_enabled?: boolean;
  // Buddy Avatar Style
  buddy_avatar_style?: BuddyAvatarStyle;
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
