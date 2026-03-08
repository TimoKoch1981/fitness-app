import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import type { MenstrualCycleLog, CyclePhase, FlowIntensity, CycleSymptom, CervicalMucus, SexualActivity } from '../../../types/health';

const CYCLE_KEY = 'menstrual_cycle_logs';

// === Pure helpers (exported for testing) ===

/** Map cycle phase to i18n key */
export function getCyclePhaseKey(phase: CyclePhase): string {
  const keys: Record<CyclePhase, string> = {
    menstruation: 'menstruation',
    follicular: 'follicular',
    ovulation: 'ovulation',
    luteal: 'luteal',
    spotting: 'spotting',
  };
  return keys[phase] ?? 'follicular';
}

/** Get emoji for cycle phase */
export function getCyclePhaseEmoji(phase: CyclePhase): string {
  const emojis: Record<CyclePhase, string> = {
    menstruation: '\u{1FA78}',  // 🩸
    follicular: '\u{1F331}',    // 🌱
    ovulation: '\u{2728}',      // ✨
    luteal: '\u{1F319}',        // 🌙
    spotting: '\u{1F538}',      // 🔸
  };
  return emojis[phase] ?? '\u{1F4C5}';
}

/** Get color class for cycle phase */
export function getCyclePhaseColor(phase: CyclePhase): string {
  const colors: Record<CyclePhase, string> = {
    menstruation: 'text-red-500',
    follicular: 'text-green-500',
    ovulation: 'text-amber-500',
    luteal: 'text-purple-500',
    spotting: 'text-orange-500',
  };
  return colors[phase] ?? 'text-gray-500';
}

/** Get flow intensity i18n key */
export function getFlowIntensityKey(flow: FlowIntensity): string {
  const keys: Record<FlowIntensity, string> = {
    light: 'flowLight',
    normal: 'flowNormal',
    heavy: 'flowHeavy',
    very_heavy: 'flowVeryHeavy',
  };
  return keys[flow] ?? 'flowNormal';
}

/** Get cervical mucus emoji */
export function getCervicalMucusEmoji(mucus: CervicalMucus): string {
  const emojis: Record<CervicalMucus, string> = {
    none: '\u{1F6AB}',       // 🚫
    sticky: '\u{1F4A7}',     // 💧
    creamy: '\u{2601}\u{FE0F}', // ☁️
    egg_white: '\u{1F95A}',  // 🥚
  };
  return emojis[mucus] ?? '';
}

/** Get cervical mucus i18n key */
export function getCervicalMucusKey(mucus: CervicalMucus): string {
  const keys: Record<CervicalMucus, string> = {
    none: 'mucusNone',
    sticky: 'mucusSticky',
    creamy: 'mucusCreamy',
    egg_white: 'mucusEggWhite',
  };
  return keys[mucus] ?? 'mucusNone';
}

/** Get symptom i18n key */
export function getSymptomKey(symptom: CycleSymptom): string {
  const keys: Record<CycleSymptom, string> = {
    cramping: 'cramping',
    bloating: 'bloating',
    mood_changes: 'moodChanges',
    fatigue: 'fatigue',
    acne: 'acne',
    headache: 'headache',
    breast_tenderness: 'breastTenderness',
    water_retention: 'waterRetention',
    sleep_issues: 'sleepIssues',
    hot_flashes: 'hotFlashes',
    urinary_frequency: 'urinaryFrequency',
    concentration_issues: 'concentrationIssues',
    libido_changes: 'libidoChanges',
    back_pain: 'backPain',
    joint_pain: 'jointPain',
    nausea: 'nausea',
    dizziness: 'dizziness',
    appetite_changes: 'appetiteChanges',
    skin_changes: 'skinChanges',
    irritability: 'irritability',
  };
  return keys[symptom] ?? symptom;
}

/** Estimate current cycle phase from last menstruation date and average cycle length */
export function estimateCyclePhase(_lastMenstruationDate: string, daysSinceMenstruation: number, cycleLength = 28): CyclePhase {
  // Normalize to cycle position
  const dayInCycle = daysSinceMenstruation % cycleLength;

  if (dayInCycle < 5) return 'menstruation';          // Days 0-4
  if (dayInCycle < Math.round(cycleLength * 0.5)) return 'follicular';    // Days 5 to ~14
  if (dayInCycle < Math.round(cycleLength * 0.5) + 2) return 'ovulation'; // ~Day 14-15
  return 'luteal';                                      // Day 16+
}

/** Calculate days between two ISO date strings */
export function daysBetweenDates(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.round(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// === React Query Hooks ===

/** Fetch recent menstrual cycle logs for the current user. */
export function useMenstrualCycleLogs(limit = 30) {
  return useQuery({
    queryKey: [CYCLE_KEY, limit],
    queryFn: async (): Promise<MenstrualCycleLog[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('menstrual_cycle_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface AddCycleLogInput {
  date: string;
  phase: CyclePhase;
  flow_intensity?: FlowIntensity;
  symptoms?: CycleSymptom[];
  energy_level?: number;
  mood?: number;
  notes?: string;
  cervical_mucus?: CervicalMucus;
  pms_flag?: boolean;
  sexual_activity?: SexualActivity;
  basal_temp?: number;
}

/** Add or update a cycle log (upsert by user_id + date). */
export function useAddCycleLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddCycleLogInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('menstrual_cycle_logs')
        .upsert(
          {
            user_id: user.id,
            date: input.date,
            phase: input.phase,
            flow_intensity: input.flow_intensity || null,
            symptoms: input.symptoms ?? [],
            energy_level: input.energy_level || null,
            mood: input.mood || null,
            notes: input.notes || null,
            cervical_mucus: input.cervical_mucus || null,
            pms_flag: input.pms_flag ?? false,
            sexual_activity: input.sexual_activity || null,
            basal_temp: input.basal_temp || null,
          },
          { onConflict: 'user_id,date' }
        )
        .select()
        .single();

      if (error) throw error;
      return data as MenstrualCycleLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CYCLE_KEY] });
    },
  });
}

/** Delete a cycle log by ID. */
export function useDeleteCycleLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('menstrual_cycle_logs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CYCLE_KEY] });
    },
  });
}
