/**
 * ActiveWorkoutContext — Manages the state of a live workout session.
 *
 * Tracks current exercise, set, mode (set-by-set vs exercise overview),
 * rest timer, warm-up, and all per-set results.
 * Persists to localStorage for crash recovery.
 */

import { createContext, useContext, useReducer, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { supabase } from '../../../lib/supabase';
import { today } from '../../../lib/utils';
import type {
  TrainingPlanDay,
  PlanExercise,
  WorkoutExerciseResult,
  SetResult,
  WarmupResult,
  WorkoutTrackingMode,
  WorkoutSessionPhase,
} from '../../../types/health';

// ── State ────────────────────────────────────────────────────────────────

export interface ActiveWorkoutState {
  /** Plan metadata */
  planId: string;
  planDayId: string;
  planDayNumber: number;
  planDayName: string;
  /** All exercises being tracked (initialized from plan, can be modified) */
  exercises: WorkoutExerciseResult[];
  /** Original plan exercises (for reference / revert) */
  planExercises: PlanExercise[];
  /** Warm-up result */
  warmup?: WarmupResult;
  /** Current position */
  currentExerciseIndex: number;
  currentSetIndex: number;
  /** UI mode */
  mode: WorkoutTrackingMode;
  timerEnabled: boolean;
  timerSeconds: number;  // configurable rest duration
  /** Session timing */
  startedAt: string;
  /** Phase */
  phase: WorkoutSessionPhase;
  /** Is session active? */
  isActive: boolean;
  /**
   * Whether the user has confirmed they're ready for the current set.
   * Reset to false when navigating to a new exercise or returning from rest.
   * Set to true when the user presses "Satz starten".
   * This prevents auto-starting the set timer while the user is still setting up equipment.
   */
  setReady: boolean;
}

const STORAGE_KEY = 'fitbuddy_active_workout';

// ── Actions ──────────────────────────────────────────────────────────────

type Action =
  | { type: 'START_SESSION'; planDay: TrainingPlanDay; planId: string; lastResults?: WorkoutExerciseResult[] }
  | { type: 'START_FREE_SESSION'; name?: string }
  | { type: 'LOG_WARMUP'; warmup: WarmupResult }
  | { type: 'SKIP_WARMUP' }
  | { type: 'LOG_SET'; exerciseIndex: number; setIndex: number; actualReps: number; actualWeightKg?: number; notes?: string }
  | { type: 'SKIP_SET'; exerciseIndex: number; setIndex: number }
  | { type: 'COMPLETE_EXERCISE'; exerciseIndex: number }
  | { type: 'NEXT_EXERCISE' }
  | { type: 'PREV_EXERCISE' }
  | { type: 'GO_TO_EXERCISE'; index: number }
  | { type: 'SKIP_EXERCISE'; exerciseIndex: number }
  | { type: 'REMOVE_EXERCISE'; exerciseIndex: number; permanent: boolean }
  | { type: 'ADD_EXERCISE'; exercise: WorkoutExerciseResult; permanent: boolean }
  | { type: 'TOGGLE_MODE' }
  | { type: 'TOGGLE_TIMER' }
  | { type: 'SET_TIMER_SECONDS'; seconds: number }
  | { type: 'SET_PHASE'; phase: WorkoutSessionPhase }
  | { type: 'FINISH_SESSION' }
  | { type: 'RESTORE_SESSION'; state: ActiveWorkoutState }
  | { type: 'REORDER_EXERCISES'; fromIndex: number; toIndex: number }
  | { type: 'EDIT_EXERCISE'; exerciseIndex: number; updates: ExerciseEditPayload }
  | { type: 'SET_READY' }
  | { type: 'REPLACE_EXERCISES'; exercises: WorkoutExerciseResult[] }
  | { type: 'CLEAR_SESSION' };

/** Payload for editing exercise details mid-session */
export interface ExerciseEditPayload {
  /** New number of sets (add/remove sets) */
  numSets?: number;
  /** Per-set overrides: target_reps and target_weight_kg */
  setOverrides?: Array<{ target_reps?: string; target_weight_kg?: number }>;
  /** Rest seconds between sets */
  rest_seconds?: number;
  /** Duration in minutes (for timed exercises) */
  duration_minutes?: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────

export function buildExercisesFromPlan(
  planExercises: PlanExercise[],
): WorkoutExerciseResult[] {
  return planExercises.map((pe, idx) => {
    // Cardio/flexibility exercises default to 1 set (timed), strength defaults to 3
    const isTimedType = pe.exercise_type === 'cardio' || pe.exercise_type === 'flexibility';
    const numSets = pe.sets ?? (isTimedType ? 1 : 3);

    const sets: SetResult[] = Array.from({ length: numSets }, (_, setIdx) => ({
      set_number: setIdx + 1,
      target_reps: pe.reps ?? '10',
      target_weight_kg: pe.weight_kg,
      actual_reps: undefined,
      actual_weight_kg: pe.weight_kg, // pre-fill with target
      completed: false,
      skipped: false,
    }));

    return {
      name: pe.name,
      exercise_id: pe.exercise_id,
      exercise_type: pe.exercise_type,
      plan_exercise_index: idx,
      sets,
      duration_minutes: pe.duration_minutes,
      distance_km: pe.distance_km,
      pace: pe.pace,
      intensity: pe.intensity,
      rest_seconds: pe.rest_seconds,
      skipped: false,
      is_addition: false,
      notes: pe.notes,
    };
  });
}

// ── Reducer ──────────────────────────────────────────────────────────────

export function reducer(state: ActiveWorkoutState, action: Action): ActiveWorkoutState {
  switch (action.type) {
    case 'START_SESSION': {
      const exercises = buildExercisesFromPlan(
        action.planDay.exercises,
      );
      return {
        planId: action.planId,
        planDayId: action.planDay.id,
        planDayNumber: action.planDay.day_number,
        planDayName: action.planDay.name,
        exercises,
        planExercises: action.planDay.exercises,
        warmup: undefined,
        currentExerciseIndex: 0,
        currentSetIndex: 0,
        mode: 'exercise',
        timerEnabled: true,
        timerSeconds: 90,
        startedAt: new Date().toISOString(),
        phase: 'warmup',
        isActive: true,
        setReady: false,
      };
    }

    case 'START_FREE_SESSION': {
      return {
        planId: '',
        planDayId: '',
        planDayNumber: 0,
        planDayName: action.name ?? 'Freies Training',
        exercises: [],
        planExercises: [],
        warmup: undefined,
        currentExerciseIndex: 0,
        currentSetIndex: 0,
        mode: 'exercise',
        timerEnabled: true,
        timerSeconds: 90,
        startedAt: new Date().toISOString(),
        phase: 'exercise', // Skip warmup for free sessions — go straight to exercise picker
        isActive: true,
        setReady: false,
      };
    }

    case 'LOG_WARMUP':
      return { ...state, warmup: action.warmup, phase: 'exercise', setReady: false };

    case 'SKIP_WARMUP':
      return { ...state, phase: 'exercise', setReady: false };

    case 'LOG_SET': {
      const exercises = [...state.exercises];
      const ex = { ...exercises[action.exerciseIndex] };
      const sets = [...ex.sets];
      sets[action.setIndex] = {
        ...sets[action.setIndex],
        actual_reps: action.actualReps,
        actual_weight_kg: action.actualWeightKg ?? sets[action.setIndex].target_weight_kg,
        completed: true,
        skipped: false,
        notes: action.notes,
      };
      ex.sets = sets;
      exercises[action.exerciseIndex] = ex;

      // Auto-advance set index
      const nextSetIdx = action.setIndex + 1;
      const allSetsComplete = nextSetIdx >= sets.length;

      return {
        ...state,
        exercises,
        currentSetIndex: allSetsComplete ? 0 : nextSetIdx,
        phase: state.timerEnabled && !allSetsComplete ? 'rest' : state.phase,
        // When all sets complete → reset setReady so set timer stops
        // When going to rest → reset setReady so user must press "Start" for next set
        setReady: allSetsComplete ? false : (state.timerEnabled && !allSetsComplete ? false : state.setReady),
      };
    }

    case 'SKIP_SET': {
      const exercises = [...state.exercises];
      const ex = { ...exercises[action.exerciseIndex] };
      const sets = [...ex.sets];
      sets[action.setIndex] = { ...sets[action.setIndex], skipped: true, completed: false };
      ex.sets = sets;
      exercises[action.exerciseIndex] = ex;

      const nextSetIdx = action.setIndex + 1;
      return {
        ...state,
        exercises,
        currentSetIndex: nextSetIdx >= sets.length ? 0 : nextSetIdx,
      };
    }

    case 'NEXT_EXERCISE': {
      const nextIdx = state.currentExerciseIndex + 1;
      if (nextIdx >= state.exercises.length) {
        return { ...state, phase: 'summary' };
      }
      return { ...state, currentExerciseIndex: nextIdx, currentSetIndex: 0, phase: 'exercise', setReady: false };
    }

    case 'PREV_EXERCISE': {
      const prevIdx = Math.max(0, state.currentExerciseIndex - 1);
      return { ...state, currentExerciseIndex: prevIdx, currentSetIndex: 0, phase: 'exercise', setReady: false };
    }

    case 'GO_TO_EXERCISE':
      return { ...state, currentExerciseIndex: action.index, currentSetIndex: 0, phase: 'exercise', setReady: false };

    case 'SKIP_EXERCISE': {
      const exercises = [...state.exercises];
      exercises[action.exerciseIndex] = { ...exercises[action.exerciseIndex], skipped: true };
      const nextIdx = state.currentExerciseIndex + 1;
      return {
        ...state,
        exercises,
        currentExerciseIndex: nextIdx >= exercises.length ? state.currentExerciseIndex : nextIdx,
        currentSetIndex: 0,
        phase: nextIdx >= exercises.length ? 'summary' : 'exercise',
      };
    }

    case 'REMOVE_EXERCISE': {
      const exercises = state.exercises.filter((_, i) => i !== action.exerciseIndex);
      const newIdx = Math.min(state.currentExerciseIndex, exercises.length - 1);
      return {
        ...state,
        exercises,
        currentExerciseIndex: Math.max(0, newIdx),
        currentSetIndex: 0,
      };
    }

    case 'ADD_EXERCISE':
      return {
        ...state,
        exercises: [...state.exercises, action.exercise],
      };

    case 'SET_READY':
      return { ...state, setReady: true };

    case 'REPLACE_EXERCISES':
      return { ...state, exercises: action.exercises };

    case 'EDIT_EXERCISE': {
      const exercises = [...state.exercises];
      const ex = { ...exercises[action.exerciseIndex] };
      const { updates } = action;

      // Update duration
      if (updates.duration_minutes != null) {
        ex.duration_minutes = updates.duration_minutes;
      }

      // Update rest seconds
      if (updates.rest_seconds != null) {
        ex.rest_seconds = updates.rest_seconds;
      }

      // Adjust number of sets
      if (updates.numSets != null && updates.numSets !== ex.sets.length) {
        const newSets = [...ex.sets];
        if (updates.numSets > newSets.length) {
          // Add sets — copy target from last set
          const template = newSets[newSets.length - 1] || {
            target_reps: '10', target_weight_kg: undefined,
            completed: false, skipped: false,
          };
          for (let i = newSets.length; i < updates.numSets; i++) {
            newSets.push({
              set_number: i + 1,
              target_reps: template.target_reps,
              target_weight_kg: template.target_weight_kg,
              actual_reps: undefined,
              actual_weight_kg: template.target_weight_kg,
              completed: false,
              skipped: false,
            });
          }
        } else {
          // Remove sets from end (only non-completed)
          while (newSets.length > updates.numSets) {
            const last = newSets[newSets.length - 1];
            if (last.completed) break; // don't remove completed sets
            newSets.pop();
          }
        }
        ex.sets = newSets;
      }

      // Apply per-set overrides (target_reps, target_weight_kg)
      if (updates.setOverrides) {
        const sets = [...ex.sets];
        updates.setOverrides.forEach((override, idx) => {
          if (idx < sets.length && !sets[idx].completed) {
            sets[idx] = { ...sets[idx] };
            if (override.target_reps != null) sets[idx].target_reps = override.target_reps;
            if (override.target_weight_kg != null) {
              sets[idx].target_weight_kg = override.target_weight_kg;
              // Also update pre-filled actual weight if not yet logged
              if (!sets[idx].completed) sets[idx].actual_weight_kg = override.target_weight_kg;
            }
          }
        });
        ex.sets = sets;
      }

      exercises[action.exerciseIndex] = ex;
      return { ...state, exercises, currentSetIndex: 0 };
    }

    case 'REORDER_EXERCISES': {
      const exercises = [...state.exercises];
      const [moved] = exercises.splice(action.fromIndex, 1);
      exercises.splice(action.toIndex, 0, moved);
      // Adjust currentExerciseIndex to follow the currently active exercise
      let newCurrentIdx = state.currentExerciseIndex;
      if (state.currentExerciseIndex === action.fromIndex) {
        newCurrentIdx = action.toIndex;
      } else if (
        action.fromIndex < state.currentExerciseIndex &&
        action.toIndex >= state.currentExerciseIndex
      ) {
        newCurrentIdx = state.currentExerciseIndex - 1;
      } else if (
        action.fromIndex > state.currentExerciseIndex &&
        action.toIndex <= state.currentExerciseIndex
      ) {
        newCurrentIdx = state.currentExerciseIndex + 1;
      }
      return { ...state, exercises, currentExerciseIndex: newCurrentIdx };
    }

    case 'TOGGLE_MODE':
      return { ...state, mode: state.mode === 'set-by-set' ? 'exercise' : 'set-by-set' };

    case 'TOGGLE_TIMER':
      return { ...state, timerEnabled: !state.timerEnabled };

    case 'SET_TIMER_SECONDS':
      return { ...state, timerSeconds: action.seconds };

    case 'SET_PHASE':
      // When returning from rest → exercise, reset setReady so user must press "Start"
      return {
        ...state,
        phase: action.phase,
        setReady: action.phase === 'exercise' ? false : state.setReady,
      };

    case 'FINISH_SESSION':
      return { ...state, phase: 'summary', isActive: false };

    case 'RESTORE_SESSION':
      return action.state;

    case 'CLEAR_SESSION':
      return { ...initialState };

    default:
      return state;
  }
}

export const initialState: ActiveWorkoutState = {
  planId: '',
  planDayId: '',
  planDayNumber: 0,
  planDayName: '',
  exercises: [],
  planExercises: [],
  warmup: undefined,
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  mode: 'exercise',
  timerEnabled: true,
  timerSeconds: 90,
  startedAt: '',
  phase: 'warmup',
  isActive: false,
  setReady: false,
};

// ── Context ──────────────────────────────────────────────────────────────

interface ActiveWorkoutContextValue {
  state: ActiveWorkoutState;
  dispatch: React.Dispatch<Action>;
  startSession: (planDay: TrainingPlanDay, planId: string, lastResults?: WorkoutExerciseResult[]) => void;
  startFreeSession: (name?: string) => void;
  logWarmup: (warmup: WarmupResult) => void;
  skipWarmup: () => void;
  logSet: (exerciseIdx: number, setIdx: number, reps: number, weightKg?: number, notes?: string) => void;
  skipSet: (exerciseIdx: number, setIdx: number) => void;
  nextExercise: () => void;
  prevExercise: () => void;
  goToExercise: (index: number) => void;
  skipExercise: (exerciseIdx: number) => void;
  removeExercise: (exerciseIdx: number, permanent: boolean) => void;
  addExercise: (exercise: WorkoutExerciseResult, permanent: boolean) => void;
  editExercise: (exerciseIdx: number, updates: ExerciseEditPayload) => void;
  reorderExercises: (fromIndex: number, toIndex: number) => void;
  markSetReady: () => void;
  toggleMode: () => void;
  toggleTimer: () => void;
  setTimerSeconds: (seconds: number) => void;
  finishSession: () => void;
  clearSession: () => void;
}

const ActiveWorkoutCtx = createContext<ActiveWorkoutContextValue | null>(null);

export function ActiveWorkoutProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, () => {
    // Try to restore from localStorage on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ActiveWorkoutState;
        if (parsed.isActive) return parsed;
      }
    } catch { /* ignore */ }
    return initialState;
  });

  // Persist to localStorage on every state change
  useEffect(() => {
    if (state.isActive) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state]);

  // Periodic draft save to DB (every 60s while active)
  const draftSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!state.isActive || state.phase === 'summary') return;
    if (!state.planDayId && state.exercises.length === 0) return; // free session with no exercises yet

    draftSaveRef.current = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check for existing draft
        const isFreeSession = !state.planDayId;
        let existing: { id: string } | null = null;

        if (!isFreeSession) {
          const { data } = await supabase
            .from('workouts')
            .select('id')
            .eq('user_id', user.id)
            .eq('plan_day_id', state.planDayId!)
            .eq('status', 'in_progress')
            .maybeSingle();
          existing = data;
        } else {
          // Free session: find by started_at (unique per session)
          const { data } = await supabase
            .from('workouts')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'in_progress')
            .is('plan_day_id', null)
            .eq('started_at', state.startedAt)
            .maybeSingle();
          existing = data;
        }

        const payload = {
          session_exercises: state.exercises,
          warmup: state.warmup,
        };

        if (existing) {
          await supabase.from('workouts').update(payload).eq('id', existing.id);
        } else {
          await supabase.from('workouts').insert({
            user_id: user.id,
            date: today(),
            name: state.planDayName || 'Workout',
            type: 'strength',
            plan_id: state.planId || null,
            plan_day_id: state.planDayId || null,
            plan_day_number: state.planDayNumber ?? 0,
            session_exercises: state.exercises,
            warmup: state.warmup,
            started_at: state.startedAt,
            status: 'in_progress',
          });
        }
        console.log('[DraftSave] Saved workout draft');
      } catch (err) {
        console.warn('[DraftSave] Error (non-fatal):', err);
      }
    }, 60_000); // 60 seconds

    return () => {
      if (draftSaveRef.current) clearTimeout(draftSaveRef.current);
    };
  }, [state.exercises, state.currentExerciseIndex, state.isActive, state.phase, state.planDayId, state.planId, state.planDayName, state.planDayNumber, state.warmup, state.startedAt]);

  const startSession = useCallback((planDay: TrainingPlanDay, planId: string, lastResults?: WorkoutExerciseResult[]) => {
    dispatch({ type: 'START_SESSION', planDay, planId, lastResults });
  }, []);

  const startFreeSession = useCallback((name?: string) => {
    dispatch({ type: 'START_FREE_SESSION', name });
  }, []);

  const logWarmup = useCallback((warmup: WarmupResult) => dispatch({ type: 'LOG_WARMUP', warmup }), []);
  const skipWarmup = useCallback(() => dispatch({ type: 'SKIP_WARMUP' }), []);
  const logSet = useCallback((exerciseIdx: number, setIdx: number, reps: number, weightKg?: number, notes?: string) => {
    dispatch({ type: 'LOG_SET', exerciseIndex: exerciseIdx, setIndex: setIdx, actualReps: reps, actualWeightKg: weightKg, notes });
  }, []);
  const skipSet = useCallback((exerciseIdx: number, setIdx: number) => dispatch({ type: 'SKIP_SET', exerciseIndex: exerciseIdx, setIndex: setIdx }), []);
  const nextExercise = useCallback(() => dispatch({ type: 'NEXT_EXERCISE' }), []);
  const prevExercise = useCallback(() => dispatch({ type: 'PREV_EXERCISE' }), []);
  const goToExercise = useCallback((index: number) => dispatch({ type: 'GO_TO_EXERCISE', index }), []);
  const skipExercise = useCallback((exerciseIdx: number) => dispatch({ type: 'SKIP_EXERCISE', exerciseIndex: exerciseIdx }), []);
  const removeExercise = useCallback((exerciseIdx: number, permanent: boolean) => dispatch({ type: 'REMOVE_EXERCISE', exerciseIndex: exerciseIdx, permanent }), []);
  const addExercise = useCallback((exercise: WorkoutExerciseResult, permanent: boolean) => dispatch({ type: 'ADD_EXERCISE', exercise, permanent }), []);
  const editExercise = useCallback((exerciseIdx: number, updates: ExerciseEditPayload) => dispatch({ type: 'EDIT_EXERCISE', exerciseIndex: exerciseIdx, updates }), []);
  const reorderExercises = useCallback((fromIndex: number, toIndex: number) => dispatch({ type: 'REORDER_EXERCISES', fromIndex, toIndex }), []);
  const markSetReady = useCallback(() => dispatch({ type: 'SET_READY' }), []);
  const toggleMode = useCallback(() => dispatch({ type: 'TOGGLE_MODE' }), []);
  const toggleTimer = useCallback(() => dispatch({ type: 'TOGGLE_TIMER' }), []);
  const setTimerSeconds = useCallback((seconds: number) => dispatch({ type: 'SET_TIMER_SECONDS', seconds }), []);
  const finishSession = useCallback(() => dispatch({ type: 'FINISH_SESSION' }), []);
  const clearSession = useCallback(() => dispatch({ type: 'CLEAR_SESSION' }), []);

  return (
    <ActiveWorkoutCtx.Provider value={{
      state, dispatch,
      startSession, startFreeSession, logWarmup, skipWarmup, logSet, skipSet,
      nextExercise, prevExercise, goToExercise, skipExercise,
      removeExercise, addExercise, editExercise, reorderExercises, markSetReady, toggleMode, toggleTimer,
      setTimerSeconds, finishSession, clearSession,
    }}>
      {children}
    </ActiveWorkoutCtx.Provider>
  );
}

export function useActiveWorkout() {
  const ctx = useContext(ActiveWorkoutCtx);
  if (!ctx) throw new Error('useActiveWorkout must be used within ActiveWorkoutProvider');
  return ctx;
}
