import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { today } from '../../../lib/utils';
import type { Workout, WorkoutType, ExerciseSet } from '../../../types/health';

const WORKOUTS_KEY = 'workouts';

export function useWorkoutsByDate(date: string = today()) {
  return useQuery({
    queryKey: [WORKOUTS_KEY, date],
    queryFn: async (): Promise<Workout[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRecentWorkouts(limit = 10) {
  return useQuery({
    queryKey: [WORKOUTS_KEY, 'recent', limit],
    queryFn: async (): Promise<Workout[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data ?? [];
    },
  });
}

interface AddWorkoutInput {
  date?: string;
  name: string;
  type: WorkoutType;
  duration_minutes?: number;
  calories_burned?: number;
  met_value?: number;
  exercises?: ExerciseSet[];
  notes?: string;
  /** Pre-resolved user ID — skips getUser() network call */
  user_id?: string;
}

export function useAddWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddWorkoutInput) => {
      let userId = input.user_id;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        userId = user.id;
      }

      const { data, error } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          date: input.date ?? today(),
          name: input.name,
          type: input.type,
          duration_minutes: input.duration_minutes,
          calories_burned: input.calories_burned,
          met_value: input.met_value,
          exercises: input.exercises ?? [],
          notes: input.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Workout;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [WORKOUTS_KEY, data.date] });
      queryClient.invalidateQueries({ queryKey: [WORKOUTS_KEY, 'recent'] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      const { error } = await supabase.from('workouts').delete().eq('id', id);
      if (error) throw error;
      return { id, date };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [WORKOUTS_KEY, data.date] });
      queryClient.invalidateQueries({ queryKey: [WORKOUTS_KEY, 'recent'] });
    },
  });
}
