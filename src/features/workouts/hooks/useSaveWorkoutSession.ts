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
import { ensureFreshSession } from '../../../lib/refreshSession';
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

      // Ensure fresh session — fixes stale JWT / RLS rejections
      let userId = input.userId;
      if (!userId) {
        userId = await ensureFreshSession();
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

      // Step 1: Check if there's an in-progress draft to upgrade
      const MAX_RETRIES = 2;
      let workout: Record<string, unknown> | null = null;

      // Check for existing draft
      let draftId: string | null = null;
      if (session.planDayId) {
        try {
          const { data: draft } = await supabase
            .from('workouts')
            .select('id')
            .eq('user_id', userId)
            .eq('plan_day_id', session.planDayId)
            .eq('status', 'in_progress')
            .maybeSingle();
          draftId = draft?.id ?? null;
        } catch { /* ignore — will do fresh insert */ }
      }

      const workoutPayload = {
        user_id: userId,
        date: today(),
        name: session.planDayName,
        type: 'strength' as const,
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
        status: 'completed' as const,
      };

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            console.warn(`[SaveWorkout] Retry attempt ${attempt}...`);
            userId = await ensureFreshSession();
            workoutPayload.user_id = userId;
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }

          if (draftId) {
            // Upgrade existing draft → completed
            const { data, error } = await supabase
              .from('workouts')
              .update(workoutPayload)
              .eq('id', draftId)
              .select()
              .single();
            if (error) throw error;
            workout = data;
          } else {
            // Fresh insert
            const { data, error } = await supabase
              .from('workouts')
              .insert(workoutPayload)
              .select()
              .single();
            if (error) throw error;
            workout = data;
          }

          break; // Success — exit retry loop
        } catch (err) {
          if (attempt >= MAX_RETRIES) throw err;
          console.warn('[SaveWorkout] Attempt failed:', err);
        }
      }

      if (!workout) throw new Error('Failed to save workout after retries');

      // Step 2: Auto-progression — update plan weights where user went higher
      // Fire-and-forget: Don't block session save on auto-progression errors
      try {
        await applyAutoProgression(session);
      } catch (progErr) {
        console.warn('[AutoProgression] Error:', progErr);
      }

      // Step 3: Post-session analysis — plateau detection, volume, RPE drift
      await runPostSessionAnalysis(session, workout.id as string);

      // Step 4: Update mesocycle current_week in review_config
      await updateMesocycleWeek(session);

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
  if (!session.planDayId) return; // No plan day — skip auto-progression

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

/**
 * Step 4: Update mesocycle current_week in review_config.
 * Calculates the current week based on mesocycle_start date.
 * Fire-and-forget — doesn't block session save.
 */
async function updateMesocycleWeek(session: ActiveWorkoutState): Promise<void> {
  try {
    if (!session.planId) return;

    const { data: plan } = await supabase
      .from('training_plans')
      .select('review_config')
      .eq('id', session.planId)
      .single();

    if (!plan?.review_config) return;

    const config = plan.review_config as import('../../../types/health').ReviewConfig;
    if (!config.mesocycle_start) return;

    const startDate = new Date(config.mesocycle_start);
    const now = new Date();
    const daysSinceStart = Math.floor(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const currentWeek = Math.max(1, Math.floor(daysSinceStart / 7) + 1);

    if (currentWeek !== config.current_week) {
      await supabase
        .from('training_plans')
        .update({
          review_config: { ...config, current_week: currentWeek },
        })
        .eq('id', session.planId);
    }
  } catch (err) {
    console.warn('[MesocycleWeekUpdate] Error:', err);
  }
}
