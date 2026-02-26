/**
 * ActiveWorkoutContext — Manages the state of a live workout session.
 *
 * Tracks current exercise, set, mode (set-by-set vs exercise overview),
 * rest timer, warm-up, and all per-set results.
 * Persists to localStorage for crash recovery.
 */

import { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from 'react';
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
}

const STORAGE_KEY = 'fitbuddy_active_workout';

// ── Actions ──────────────────────────────────────────────────────────────

type Action =
  | { type: 'START_SESSION'; planDay: TrainingPlanDay; planId: string; lastResults?: WorkoutExerciseResult[] }
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
  | { type: 'CLEAR_SESSION' };

// ── Helpers ──────────────────────────────────────────────────────────────

export function buildExercisesFromPlan(
  planExercises: PlanExercise[],
): WorkoutExerciseResult[] {
  return planExercises.map((pe, idx) => {
    const numSets = pe.sets ?? 3;

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
        mode: 'set-by-set',
        timerEnabled: true,
        timerSeconds: 90,
        startedAt: new Date().toISOString(),
        phase: 'warmup',
        isActive: true,
      };
    }

    case 'LOG_WARMUP':
      return { ...state, warmup: action.warmup, phase: 'exercise' };

    case 'SKIP_WARMUP':
      return { ...state, phase: 'exercise' };

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
      return { ...state, currentExerciseIndex: nextIdx, currentSetIndex: 0, phase: 'exercise' };
    }

    case 'PREV_EXERCISE': {
      const prevIdx = Math.max(0, state.currentExerciseIndex - 1);
      return { ...state, currentExerciseIndex: prevIdx, currentSetIndex: 0, phase: 'exercise' };
    }

    case 'GO_TO_EXERCISE':
      return { ...state, currentExerciseIndex: action.index, currentSetIndex: 0, phase: 'exercise' };

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

    case 'TOGGLE_MODE':
      return { ...state, mode: state.mode === 'set-by-set' ? 'exercise' : 'set-by-set' };

    case 'TOGGLE_TIMER':
      return { ...state, timerEnabled: !state.timerEnabled };

    case 'SET_TIMER_SECONDS':
      return { ...state, timerSeconds: action.seconds };

    case 'SET_PHASE':
      return { ...state, phase: action.phase };

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
  mode: 'set-by-set',
  timerEnabled: true,
  timerSeconds: 90,
  startedAt: '',
  phase: 'warmup',
  isActive: false,
};

// ── Context ──────────────────────────────────────────────────────────────

interface ActiveWorkoutContextValue {
  state: ActiveWorkoutState;
  dispatch: React.Dispatch<Action>;
  startSession: (planDay: TrainingPlanDay, planId: string, lastResults?: WorkoutExerciseResult[]) => void;
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

  const startSession = useCallback((planDay: TrainingPlanDay, planId: string, lastResults?: WorkoutExerciseResult[]) => {
    dispatch({ type: 'START_SESSION', planDay, planId, lastResults });
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
  const toggleMode = useCallback(() => dispatch({ type: 'TOGGLE_MODE' }), []);
  const toggleTimer = useCallback(() => dispatch({ type: 'TOGGLE_TIMER' }), []);
  const setTimerSeconds = useCallback((seconds: number) => dispatch({ type: 'SET_TIMER_SECONDS', seconds }), []);
  const finishSession = useCallback(() => dispatch({ type: 'FINISH_SESSION' }), []);
  const clearSession = useCallback(() => dispatch({ type: 'CLEAR_SESSION' }), []);

  return (
    <ActiveWorkoutCtx.Provider value={{
      state, dispatch,
      startSession, logWarmup, skipWarmup, logSet, skipSet,
      nextExercise, prevExercise, goToExercise, skipExercise,
      removeExercise, addExercise, toggleMode, toggleTimer,
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
