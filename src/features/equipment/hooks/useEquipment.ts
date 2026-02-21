/**
 * Equipment Hooks — CRUD for equipment catalog, gym profiles, and user equipment.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../app/providers/AuthProvider';
import type { Equipment, GymProfile, UserEquipment } from '../../../types/health';

// ── Query Keys ──────────────────────────────────────────────────────────

const EQUIPMENT_KEY = ['equipment_catalog'] as const;
const GYM_PROFILES_KEY = ['gym_profiles'] as const;
const USER_EQUIPMENT_KEY = ['user_equipment'] as const;

// ── Equipment Catalog ────────────────────────────────────────────────────

export function useEquipmentCatalog() {
  return useQuery({
    queryKey: EQUIPMENT_KEY,
    queryFn: async (): Promise<Equipment[]> => {
      const { data, error } = await supabase
        .from('equipment_catalog')
        .select('*')
        .order('category')
        .order('name');

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 30, // 30 min — rarely changes
  });
}

// ── Gym Profiles ─────────────────────────────────────────────────────────

export function useGymProfiles() {
  return useQuery({
    queryKey: GYM_PROFILES_KEY,
    queryFn: async (): Promise<GymProfile[]> => {
      const { data, error } = await supabase
        .from('gym_profiles')
        .select('*')
        .eq('is_template', true)
        .order('name');

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ── User Equipment ───────────────────────────────────────────────────────

export function useUserEquipment() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...USER_EQUIPMENT_KEY, user?.id],
    queryFn: async (): Promise<UserEquipment | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_equipment')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data ?? null;
    },
    enabled: !!user?.id,
  });
}

// ── Set User Equipment (upsert) ──────────────────────────────────────────

export function useSetUserEquipment() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      equipment_ids: string[];
      gym_profile_id?: string | null;
      custom_name?: string;
      notes?: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_equipment')
        .upsert(
          {
            user_id: user.id,
            equipment_ids: params.equipment_ids,
            gym_profile_id: params.gym_profile_id ?? null,
            custom_name: params.custom_name ?? null,
            notes: params.notes ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_EQUIPMENT_KEY });
    },
  });
}

// ── Resolved Equipment Names (for display) ───────────────────────────────

/**
 * Returns the full Equipment objects for the user's selected equipment_ids.
 */
export function useUserEquipmentResolved() {
  const { data: catalog } = useEquipmentCatalog();
  const { data: userEquip, isLoading } = useUserEquipment();

  const resolved = catalog && userEquip
    ? catalog.filter(e => userEquip.equipment_ids.includes(e.id))
    : [];

  return {
    equipment: resolved,
    equipmentIds: userEquip?.equipment_ids ?? [],
    gymProfileId: userEquip?.gym_profile_id ?? null,
    customName: userEquip?.custom_name ?? null,
    isLoading,
    hasEquipment: (userEquip?.equipment_ids?.length ?? 0) > 0,
  };
}
