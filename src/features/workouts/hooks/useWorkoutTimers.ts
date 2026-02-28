/**
 * useWorkoutTimers — Manages 5 independent timer sections for live workouts.
 *
 * Sections: total, exercise, exerciseRest, set, setRest
 * Each section can be countdown or stopwatch, enabled/disabled individually.
 * Auto-advance logic handles phase transitions between sets/exercises.
 */

import { useReducer, useRef, useEffect, useCallback } from 'react';
import type { AlertMode } from '../utils/timerAlerts';
import { triggerTimerAlert, playWarningBeep } from '../utils/timerAlerts';

// ── Types ────────────────────────────────────────────────────────────────

export type TimerSectionId = 'total' | 'exercise' | 'exerciseRest' | 'set' | 'setRest';
export type TimerSectionMode = 'countdown' | 'stopwatch';

export interface TimerSection {
  id: TimerSectionId;
  enabled: boolean;
  mode: TimerSectionMode;
  targetSeconds: number;
  elapsedSeconds: number;
  isRunning: boolean;
}

export interface WorkoutTimersState {
  sections: Record<TimerSectionId, TimerSection>;
  globalEnabled: boolean;
  autoAdvance: boolean;
  alertMode: AlertMode;
}

// ── Actions ──────────────────────────────────────────────────────────────

type TimerAction =
  | { type: 'TICK' }
  | { type: 'START_SECTION'; id: TimerSectionId }
  | { type: 'PAUSE_SECTION'; id: TimerSectionId }
  | { type: 'RESET_SECTION'; id: TimerSectionId }
  | { type: 'TOGGLE_SECTION_ENABLED'; id: TimerSectionId }
  | { type: 'SET_TARGET'; id: TimerSectionId; seconds: number }
  | { type: 'TOGGLE_MODE'; id: TimerSectionId }
  | { type: 'TOGGLE_GLOBAL' }
  | { type: 'TOGGLE_AUTO_ADVANCE' }
  | { type: 'SET_ALERT_MODE'; mode: AlertMode }
  | { type: 'START_SET_REST'; seconds?: number }
  | { type: 'START_EXERCISE_REST'; seconds?: number }
  | { type: 'START_EXERCISE_TIMER'; seconds?: number }
  | { type: 'START_SET_TIMER'; seconds?: number }
  | { type: 'RESET_ALL' }
  | { type: 'PAUSE_ALL' }
  | { type: 'INIT'; state: Partial<WorkoutTimersState> };

// ── Helpers ──────────────────────────────────────────────────────────────

function createSection(id: TimerSectionId, enabled: boolean, mode: TimerSectionMode, targetSeconds: number): TimerSection {
  return { id, enabled, mode, targetSeconds, elapsedSeconds: 0, isRunning: false };
}

function buildInitialState(): WorkoutTimersState {
  return {
    sections: {
      total: createSection('total', true, 'stopwatch', 3600),
      exercise: createSection('exercise', true, 'stopwatch', 300),
      exerciseRest: createSection('exerciseRest', false, 'countdown', 120),
      set: createSection('set', true, 'stopwatch', 60),
      setRest: createSection('setRest', true, 'countdown', 90),
    },
    globalEnabled: true,
    autoAdvance: true,
    alertMode: 'both',
  };
}

// ── Reducer ──────────────────────────────────────────────────────────────

function timerReducer(state: WorkoutTimersState, action: TimerAction): WorkoutTimersState {
  switch (action.type) {
    case 'TICK': {
      const sections = { ...state.sections };
      let changed = false;

      for (const key of Object.keys(sections) as TimerSectionId[]) {
        const s = sections[key];
        if (!s.isRunning || !s.enabled || !state.globalEnabled) continue;

        changed = true;
        const newElapsed = s.elapsedSeconds + 1;

        // Countdown completion
        if (s.mode === 'countdown' && newElapsed >= s.targetSeconds) {
          sections[key] = { ...s, elapsedSeconds: s.targetSeconds, isRunning: false };
        } else {
          sections[key] = { ...s, elapsedSeconds: newElapsed };
        }
      }

      return changed ? { ...state, sections } : state;
    }

    case 'START_SECTION': {
      const s = state.sections[action.id];
      if (!s.enabled) return state;
      // Don't restart if countdown already complete
      if (s.mode === 'countdown' && s.elapsedSeconds >= s.targetSeconds) {
        return {
          ...state,
          sections: {
            ...state.sections,
            [action.id]: { ...s, elapsedSeconds: 0, isRunning: true },
          },
        };
      }
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.id]: { ...s, isRunning: true },
        },
      };
    }

    case 'PAUSE_SECTION':
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.id]: { ...state.sections[action.id], isRunning: false },
        },
      };

    case 'RESET_SECTION':
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.id]: { ...state.sections[action.id], elapsedSeconds: 0, isRunning: false },
        },
      };

    case 'TOGGLE_SECTION_ENABLED': {
      const s = state.sections[action.id];
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.id]: {
            ...s,
            enabled: !s.enabled,
            isRunning: !s.enabled ? false : s.isRunning,
          },
        },
      };
    }

    case 'SET_TARGET':
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.id]: { ...state.sections[action.id], targetSeconds: Math.max(5, action.seconds) },
        },
      };

    case 'TOGGLE_MODE': {
      const s = state.sections[action.id];
      const newMode: TimerSectionMode = s.mode === 'countdown' ? 'stopwatch' : 'countdown';
      return {
        ...state,
        sections: {
          ...state.sections,
          [action.id]: { ...s, mode: newMode, elapsedSeconds: 0, isRunning: false },
        },
      };
    }

    case 'TOGGLE_GLOBAL':
      return { ...state, globalEnabled: !state.globalEnabled };

    case 'TOGGLE_AUTO_ADVANCE':
      return { ...state, autoAdvance: !state.autoAdvance };

    case 'SET_ALERT_MODE':
      return { ...state, alertMode: action.mode };

    // ── Phase transition helpers ────────────────────────────────────────
    case 'START_SET_REST': {
      const s = state.sections.setRest;
      const target = action.seconds ?? s.targetSeconds;
      return {
        ...state,
        sections: {
          ...state.sections,
          set: { ...state.sections.set, isRunning: false },
          setRest: { ...s, targetSeconds: target, elapsedSeconds: 0, isRunning: s.enabled && state.globalEnabled },
        },
      };
    }

    case 'START_EXERCISE_REST': {
      const s = state.sections.exerciseRest;
      const target = action.seconds ?? s.targetSeconds;
      return {
        ...state,
        sections: {
          ...state.sections,
          exercise: { ...state.sections.exercise, isRunning: false },
          set: { ...state.sections.set, isRunning: false, elapsedSeconds: 0 },
          setRest: { ...state.sections.setRest, isRunning: false, elapsedSeconds: 0 },
          exerciseRest: { ...s, targetSeconds: target, elapsedSeconds: 0, isRunning: s.enabled && state.globalEnabled },
        },
      };
    }

    case 'START_EXERCISE_TIMER': {
      const s = state.sections.exercise;
      const target = action.seconds ?? s.targetSeconds;
      return {
        ...state,
        sections: {
          ...state.sections,
          exercise: { ...s, targetSeconds: target, elapsedSeconds: 0, isRunning: s.enabled && state.globalEnabled },
          exerciseRest: { ...state.sections.exerciseRest, isRunning: false, elapsedSeconds: 0 },
          set: { ...state.sections.set, elapsedSeconds: 0, isRunning: state.sections.set.enabled && state.globalEnabled },
          setRest: { ...state.sections.setRest, isRunning: false, elapsedSeconds: 0 },
        },
      };
    }

    case 'START_SET_TIMER': {
      const s = state.sections.set;
      const target = action.seconds ?? s.targetSeconds;
      return {
        ...state,
        sections: {
          ...state.sections,
          set: { ...s, targetSeconds: target, elapsedSeconds: 0, isRunning: s.enabled && state.globalEnabled },
          setRest: { ...state.sections.setRest, isRunning: false, elapsedSeconds: 0 },
        },
      };
    }

    case 'RESET_ALL': {
      const sections = { ...state.sections };
      for (const key of Object.keys(sections) as TimerSectionId[]) {
        sections[key] = { ...sections[key], elapsedSeconds: 0, isRunning: false };
      }
      return { ...state, sections };
    }

    case 'PAUSE_ALL': {
      const sections = { ...state.sections };
      for (const key of Object.keys(sections) as TimerSectionId[]) {
        sections[key] = { ...sections[key], isRunning: false };
      }
      return { ...state, sections };
    }

    case 'INIT': {
      const base = buildInitialState();
      return {
        ...base,
        ...action.state,
        sections: {
          ...base.sections,
          ...(action.state.sections ?? {}),
        },
      };
    }

    default:
      return state;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useWorkoutTimers() {
  const [state, dispatch] = useReducer(timerReducer, undefined, buildInitialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStateRef = useRef(state);

  // 1-second tick interval
  useEffect(() => {
    const anyRunning = Object.values(state.sections).some(s => s.isRunning && s.enabled);

    if (anyRunning && state.globalEnabled) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => dispatch({ type: 'TICK' }), 1000);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.sections, state.globalEnabled]);

  // Detect countdown completions → trigger alerts
  useEffect(() => {
    const prev = prevStateRef.current;
    for (const key of Object.keys(state.sections) as TimerSectionId[]) {
      const curr = state.sections[key];
      const prevS = prev.sections[key];

      if (!curr || !prevS) continue;

      // Countdown just completed
      if (
        curr.mode === 'countdown' &&
        prevS.isRunning &&
        !curr.isRunning &&
        curr.elapsedSeconds >= curr.targetSeconds &&
        prevS.elapsedSeconds < curr.targetSeconds
      ) {
        triggerTimerAlert(state.alertMode);
      }

      // Warning beep at 3 seconds remaining
      if (
        curr.mode === 'countdown' &&
        curr.isRunning &&
        curr.targetSeconds - curr.elapsedSeconds === 3 &&
        prevS.elapsedSeconds !== curr.elapsedSeconds &&
        (state.alertMode === 'sound' || state.alertMode === 'both')
      ) {
        playWarningBeep();
      }
    }
    prevStateRef.current = state;
  }, [state]);

  // ── Convenience functions ──────────────────────────────────────────────

  const startSection = useCallback((id: TimerSectionId) => dispatch({ type: 'START_SECTION', id }), []);
  const pauseSection = useCallback((id: TimerSectionId) => dispatch({ type: 'PAUSE_SECTION', id }), []);
  const resetSection = useCallback((id: TimerSectionId) => dispatch({ type: 'RESET_SECTION', id }), []);
  const toggleSectionEnabled = useCallback((id: TimerSectionId) => dispatch({ type: 'TOGGLE_SECTION_ENABLED', id }), []);
  const setTarget = useCallback((id: TimerSectionId, seconds: number) => dispatch({ type: 'SET_TARGET', id, seconds }), []);
  const toggleMode = useCallback((id: TimerSectionId) => dispatch({ type: 'TOGGLE_MODE', id }), []);
  const toggleGlobal = useCallback(() => dispatch({ type: 'TOGGLE_GLOBAL' }), []);
  const toggleAutoAdvance = useCallback(() => dispatch({ type: 'TOGGLE_AUTO_ADVANCE' }), []);
  const setAlertMode = useCallback((mode: AlertMode) => dispatch({ type: 'SET_ALERT_MODE', mode }), []);

  const startSetRest = useCallback((seconds?: number) => dispatch({ type: 'START_SET_REST', seconds }), []);
  const startExerciseRest = useCallback((seconds?: number) => dispatch({ type: 'START_EXERCISE_REST', seconds }), []);
  const startExerciseTimer = useCallback((seconds?: number) => dispatch({ type: 'START_EXERCISE_TIMER', seconds }), []);
  const startSetTimer = useCallback((seconds?: number) => dispatch({ type: 'START_SET_TIMER', seconds }), []);
  const resetAll = useCallback(() => dispatch({ type: 'RESET_ALL' }), []);
  const pauseAll = useCallback(() => dispatch({ type: 'PAUSE_ALL' }), []);
  const initTimers = useCallback((init: Partial<WorkoutTimersState>) => dispatch({ type: 'INIT', state: init }), []);

  return {
    state,
    dispatch,
    // Section controls
    startSection,
    pauseSection,
    resetSection,
    toggleSectionEnabled,
    setTarget,
    toggleMode,
    // Global controls
    toggleGlobal,
    toggleAutoAdvance,
    setAlertMode,
    // Phase transitions
    startSetRest,
    startExerciseRest,
    startExerciseTimer,
    startSetTimer,
    resetAll,
    pauseAll,
    initTimers,
  };
}
