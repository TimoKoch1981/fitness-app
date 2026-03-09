/**
 * Hook for managing user exercise favorites.
 * Uses the user_exercise_favorites table with RLS.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../app/providers/AuthProvider';

export function useExerciseFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const { data: favoriteIds = [], isLoading } = useQuery<string[]>({
    queryKey: ['exercise-favorites', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_exercise_favorites')
        .select('exercise_id')
        .eq('user_id', userId);
      if (error) throw error;
      return (data ?? []).map((f: { exercise_id: string }) => f.exercise_id);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const toggleFavorite = useMutation({
    mutationFn: async (exerciseId: string) => {
      if (!userId) throw new Error('Not authenticated');

      const isFav = favoriteIds.includes(exerciseId);
      if (isFav) {
        const { error } = await supabase
          .from('user_exercise_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('exercise_id', exerciseId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_exercise_favorites')
          .insert({ user_id: userId, exercise_id: exerciseId });
        if (error) throw error;
      }
    },
    onMutate: async (exerciseId: string) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['exercise-favorites', userId] });
      const prev = queryClient.getQueryData<string[]>(['exercise-favorites', userId]) ?? [];
      const next = prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId];
      queryClient.setQueryData(['exercise-favorites', userId], next);
      return { prev };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.prev) {
        queryClient.setQueryData(['exercise-favorites', userId], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['exercise-favorites', userId] });
    },
  });

  return {
    favoriteIds,
    isLoading,
    isFavorite: (exerciseId: string) => favoriteIds.includes(exerciseId),
    toggleFavorite: toggleFavorite.mutate,
  };
}
