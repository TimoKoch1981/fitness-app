import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { today } from '../../../lib/utils';
import { calculateBMI, calculateLeanMass } from '../../../lib/calculations';
import { useAuth } from '../../../app/providers/AuthProvider';
import { withTelemetry } from '../../../lib/telemetry/actionLog';
import type { BodyMeasurement, DataSource } from '../../../types/health';

const BODY_KEY = 'body_measurements';

// v14.10: queryKey scoped per user.id + `enabled` waits for auth-ready —
// same fix as useProfile, otherwise the cache holds a stale `null` from the
// first render before the session arrived (caused onboarding-reset on every
// login because useOnboarding got `latestBody=null`).

export function useBodyMeasurements(limit = 30) {
  const { user, loading: authLoading } = useAuth();
  return useQuery({
    queryKey: [BODY_KEY, user?.id, limit],
    queryFn: async (): Promise<BodyMeasurement[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !authLoading && !!user,
  });
}

export function useLatestBodyMeasurement() {
  const { user, loading: authLoading } = useAuth();
  return useQuery({
    queryKey: [BODY_KEY, user?.id, 'latest'],
    queryFn: async (): Promise<BodyMeasurement | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data ?? null;
    },
    enabled: !authLoading && !!user,
  });
}

interface AddBodyMeasurementInput {
  date?: string;
  weight_kg?: number;
  body_fat_pct?: number;
  muscle_mass_kg?: number;
  water_pct?: number;
  waist_cm?: number;
  chest_cm?: number;
  arm_cm?: number;
  leg_cm?: number;
  source?: DataSource;
  /** Pre-resolved user ID — skips getUser() network call */
  user_id?: string;
}

export function useAddBodyMeasurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withTelemetry('log_body', 'ui', async (input: AddBodyMeasurementInput) => {
      let userId = input.user_id;
      if (!userId) {
        const { ensureFreshSession } = await import('../../../lib/refreshSession');
        userId = await ensureFreshSession();
      }

      // Get height from profile for BMI calculation
      const { data: profile } = await supabase
        .from('profiles')
        .select('height_cm')
        .eq('id', userId)
        .single();

      // Calculate derived values
      let bmi: number | undefined;
      let lean_mass_kg: number | undefined;

      if (input.weight_kg && profile?.height_cm) {
        bmi = calculateBMI(input.weight_kg, profile.height_cm);
      }
      if (input.weight_kg && input.body_fat_pct) {
        lean_mass_kg = calculateLeanMass(input.weight_kg, input.body_fat_pct);
      }

      const { data, error } = await supabase
        .from('body_measurements')
        .insert({
          user_id: userId,
          date: input.date ?? today(),
          ...input,
          bmi,
          lean_mass_kg,
          source: input.source ?? 'manual',
        })
        .select()
        .single();

      if (error) throw error;
      return data as BodyMeasurement;
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BODY_KEY] });
    },
  });
}

export function useDeleteBodyMeasurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: withTelemetry('delete_body_measurement', 'ui', async (id: string) => {
      const { error } = await supabase.from('body_measurements').delete().eq('id', id);
      if (error) throw error;
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BODY_KEY] });
    },
  });
}
