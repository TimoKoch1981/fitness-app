import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { today } from '../../../lib/utils';
import { calculateBMI, calculateLeanMass } from '../../../lib/calculations';
import type { BodyMeasurement, DataSource } from '../../../types/health';

const BODY_KEY = 'body_measurements';

export function useBodyMeasurements(limit = 30) {
  return useQuery({
    queryKey: [BODY_KEY, limit],
    queryFn: async (): Promise<BodyMeasurement[]> => {
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLatestBodyMeasurement() {
  return useQuery({
    queryKey: [BODY_KEY, 'latest'],
    queryFn: async (): Promise<BodyMeasurement | null> => {
      const { data, error } = await supabase
        .from('body_measurements')
        .select('*')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data ?? null;
    },
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
}

export function useAddBodyMeasurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddBodyMeasurementInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get height from profile for BMI calculation
      const { data: profile } = await supabase
        .from('profiles')
        .select('height_cm')
        .eq('id', user.id)
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
          user_id: user.id,
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BODY_KEY] });
    },
  });
}

export function useDeleteBodyMeasurement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('body_measurements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BODY_KEY] });
    },
  });
}
