/**
 * useApplyReviewChanges — Applies review changes to training plan
 *
 * Mutation Hook: Aktualisiert Plan-Days mit neuen Gewichten/Saetzen
 * und setzt review_config zurueck (neuer Mesozyklus).
 *
 * Konzept: KONZEPT_KI_TRAINER.md Block D, Review-Dialog
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { today } from '../../../lib/utils';
import type { PlanExercise, ReviewConfig } from '../../../types/health';
import type { ReviewChanges, ExerciseChange } from '../utils/reviewChanges';

interface ApplyReviewInput {
  planId: string;
  changes: ReviewChanges;
  currentReviewConfig: ReviewConfig;
}

export function useApplyReviewChanges() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ApplyReviewInput) => {
      const { planId, changes, currentReviewConfig } = input;

      if (changes.changes.length === 0) {
        // No exercise changes — just reset the mesocycle
        await resetMesocycle(planId, currentReviewConfig);
        return;
      }

      // Group changes by dayId
      const changesByDay = new Map<string, ExerciseChange[]>();
      for (const change of changes.changes) {
        const existing = changesByDay.get(change.dayId) ?? [];
        existing.push(change);
        changesByDay.set(change.dayId, existing);
      }

      // Apply changes to each day
      for (const [dayId, dayChanges] of changesByDay) {
        const { data: planDay, error: loadError } = await supabase
          .from('training_plan_days')
          .select('exercises')
          .eq('id', dayId)
          .single();

        if (loadError || !planDay) continue;

        const exercises = [...(planDay.exercises as PlanExercise[])];

        for (const change of dayChanges) {
          const idx = change.exerciseIndex;
          if (idx < 0 || idx >= exercises.length) continue;

          switch (change.changeType) {
            case 'adjust_weight':
              if (change.newWeight != null) {
                exercises[idx] = { ...exercises[idx], weight_kg: change.newWeight };
              }
              if (change.newSets != null) {
                exercises[idx] = { ...exercises[idx], sets: change.newSets };
              }
              break;

            case 'replace':
              if (change.replacementSuggestion) {
                exercises[idx] = {
                  ...exercises[idx],
                  name: change.replacementSuggestion,
                  // Keep weight but it may need manual adjustment
                };
              }
              break;

            case 'remove':
              exercises[idx] = { ...exercises[idx], sets: 0 };
              break;

            case 'keep':
            default:
              break;
          }
        }

        // Save updated exercises
        await supabase
          .from('training_plan_days')
          .update({ exercises })
          .eq('id', dayId);
      }

      // Reset mesocycle for new cycle
      await resetMesocycle(planId, currentReviewConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training_plans'] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

/**
 * Reset mesocycle: current_week=1, mesocycle_start=today, last_review=today
 */
async function resetMesocycle(planId: string, config: ReviewConfig): Promise<void> {
  const updatedConfig: ReviewConfig = {
    ...config,
    current_week: 1,
    mesocycle_start: today(),
    last_review: today(),
  };

  await supabase
    .from('training_plans')
    .update({ review_config: updatedConfig })
    .eq('id', planId);
}
