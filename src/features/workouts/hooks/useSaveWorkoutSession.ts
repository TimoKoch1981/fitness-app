/**
 * useSaveWorkoutSession — Saves a completed workout session to DB
 * and applies auto-progression (weight increases) to the training plan.
 *
 * Auto-Progression Rules:
 * - If actual_weight > target_weight in any set → update plan exercise weight
 * - Target reps are NEVER changed (only TrainerAgent can do that)
 * - Weight only goes UP automatically; user must manually lower it
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { today } from '../../../lib/utils';
import type { ActiveWorkoutState } from '../context/ActiveWorkoutContext';
import type { PlanExercise, SessionFeedback } from '../../../types/health';
import { calculateSessionCalories } from '../utils/calorieCalculation';
import { analyzeSession } from '../utils/postSessionAnalysis';
import { analyzeDoubleProgression } from '../utils/doubleProgression';

interface SaveSessionInput {
  session: ActiveWorkoutState;
  weightKg: number;  // user body weight for calorie calc
  userId?: string;
}

export function useSaveWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveSessionInput) => {
      const { session, weightKg } = input;

      let userId = input.userId;
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        userId = user.id;
      }

      const finishedAt = new Date().toISOString();
      const startedAt = session.startedAt;
      const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
      const durationMinutes = Math.round(durationMs / 60000);

      // Calculate total calories
      const caloriesBurned = calculateSessionCalories(
        session.exercises,
        session.warmup,
        weightKg,
        durationMinutes,
      );

      // Build legacy exercises array for backwards compatibility
      const legacyExercises = session.exercises
        .filter(ex => !ex.skipped)
        .map(ex => {
          const completedSets = ex.sets.filter(s => s.completed);
          return {
            name: ex.name,
            sets: completedSets.length,
            reps: completedSets.length > 0
              ? Math.round(completedSets.reduce((s, set) => s + (set.actual_reps ?? 0), 0) / completedSets.length)
              : undefined,
            weight_kg: completedSets.length > 0
              ? Math.max(...completedSets.map(s => s.actual_weight_kg ?? 0))
              : undefined,
            duration_minutes: ex.duration_minutes,
          };
        });

      // Step 1: Save workout
      const { data: workout, error } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          date: today(),
          name: session.planDayName,
          type: 'strength',
          duration_minutes: durationMinutes,
          calories_burned: caloriesBurned,
          exercises: legacyExercises,
          plan_id: session.planId,
          plan_day_id: session.planDayId,
          plan_day_number: session.planDayNumber,
          session_exercises: session.exercises,
          warmup: session.warmup,
          started_at: startedAt,
          finished_at: finishedAt,
        })
        .select()
        .single();

      if (error) throw error;

      // Step 2: Auto-progression — update plan weights where user went higher
      await applyAutoProgression(session);

      // Step 3: Post-session analysis — plateau detection, volume, RPE drift
      await runPostSessionAnalysis(session, workout.id);

      return workout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['training_plans'] });
      queryClient.invalidateQueries({ queryKey: ['last_workout_for_day'] });
    },
  });
}

/**
 * Auto-progression: If user lifted heavier than planned, update the plan.
 * Only increases weights, never touches reps.
 */
async function applyAutoProgression(session: ActiveWorkoutState): Promise<void> {
  // Load the current plan day
  const { data: planDay, error: loadError } = await supabase
    .from('training_plan_days')
    .select('id, exercises')
    .eq('id', session.planDayId)
    .single();

  if (loadError || !planDay) return;

  const planExercises = planDay.exercises as PlanExercise[];
  let changed = false;

  for (const sessionEx of session.exercises) {
    if (sessionEx.skipped || sessionEx.is_addition) continue;

    const planIdx = sessionEx.plan_exercise_index;
    if (planIdx < 0 || planIdx >= planExercises.length) continue;

    const planEx = planExercises[planIdx];
    if (planEx.weight_kg == null) continue;

    // Find max weight the user actually used across completed sets
    const completedSets = sessionEx.sets.filter(s => s.completed && s.actual_weight_kg != null);
    if (completedSets.length === 0) continue;

    const maxActualWeight = Math.max(...completedSets.map(s => s.actual_weight_kg!));

    // Auto-progress: only if user went HIGHER
    if (maxActualWeight > planEx.weight_kg) {
      planExercises[planIdx] = { ...planEx, weight_kg: maxActualWeight };
      changed = true;
    }
  }

  if (changed) {
    await supabase
      .from('training_plan_days')
      .update({ exercises: planExercises })
      .eq('id', session.planDayId);
  }
}

/**
 * Post-session analysis: Runs after auto-progression.
 * Loads recent workout history, analyzes patterns, and stores results
 * in session_feedback.auto_calculated JSONB.
 *
 * Also runs Double Progression check for weight adjustment suggestions.
 */
async function runPostSessionAnalysis(
  session: ActiveWorkoutState,
  workoutId: string,
): Promise<void> {
  try {
    if (!session.planId) return;

    // Load last 5 workouts for this plan (excluding the one we just saved)
    const { data: recentWorkouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('plan_id', session.planId)
      .neq('id', workoutId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!recentWorkouts) return;

    // 1. Run post-session analysis
    const analysis = analyzeSession(
      session.exercises,
      recentWorkouts,
    );

    // 2. Run double progression check
    let progressionSuggestions: ReturnType<typeof analyzeDoubleProgression> = [];
    if (session.planDayId) {
      // Load plan days for double progression
      const { data: planDays } = await supabase
        .from('training_plan_days')
        .select('*')
        .eq('plan_id', session.planId);

      if (planDays && planDays.length > 0) {
        // Include current workout in history for DP analysis
        const allWorkouts = [
          { session_exercises: session.exercises, session_feedback: null } as unknown as import('../../../types/health').Workout,
          ...recentWorkouts,
        ];
        progressionSuggestions = analyzeDoubleProgression(allWorkouts, planDays);
      }
    }

    // 3. Read existing session_feedback (user may have already submitted feelings)
    const { data: currentWorkout } = await supabase
      .from('workouts')
      .select('session_feedback')
      .eq('id', workoutId)
      .single();

    const existingFeedback = (currentWorkout?.session_feedback as SessionFeedback | null) ?? {};

    // 4. Merge auto-calculated analysis into session_feedback
    const updatedFeedback: Partial<SessionFeedback> = {
      ...existingFeedback,
      auto_calculated: {
        volume_per_muscle: analysis.volume_per_muscle,
        plateau_exercises: analysis.plateau_exercises,
        rpe_drift_exercises: analysis.rpe_drift_exercises,
        ...(progressionSuggestions.length > 0 && {
          progression_suggestions: progressionSuggestions.map(s => ({
            exercise: s.exerciseName,
            current: s.currentWeight,
            suggested: s.suggestedWeight,
            reason: s.reason,
            direction: s.direction,
          })),
        }),
      },
      completion_rate: analysis.completion_rate,
    };

    await supabase
      .from('workouts')
      .update({ session_feedback: updatedFeedback })
      .eq('id', workoutId);
  } catch (err) {
    // Fire-and-forget: Don't block session save on analysis errors
    console.warn('[PostSessionAnalysis] Error:', err);
  }
}
