/**
 * useRestTimer — Hook for managing a rest timer between sets.
 *
 * State: { seconds, isRunning, isPaused, presetSeconds }
 * Actions: start(seconds), pause, resume, stop, reset
 * Persists running timer to localStorage so it survives page navigations.
 * Plays a beep + vibrates when timer reaches 0.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { playTimerComplete, vibrateDevice } from '../utils/timerSound';

export const REST_TIMER_PRESETS = [30, 60, 90, 120, 180] as const;

const STORAGE_KEY = 'fitbuddy_rest_timer';

interface TimerState {
  /** Remaining seconds */
  seconds: number;
  /** Whether the timer is actively counting down */
  isRunning: boolean;
  /** Whether the timer is paused (started but not counting) */
  isPaused: boolean;
  /** The preset/initial duration that was started */
  presetSeconds: number;
}

interface PersistedTimer {
  targetTimestamp: number;
  presetSeconds: number;
  isPaused: boolean;
  pausedRemaining: number;
}

function loadPersistedTimer(): PersistedTimer | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedTimer;
  } catch {
    return null;
  }
}

function persistTimer(data: PersistedTimer | null): void {
  try {
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage not available — ignore
  }
}

export function useRestTimer() {
  const [state, setState] = useState<TimerState>(() => {
    // Restore from localStorage on mount
    const persisted = loadPersistedTimer();
    if (persisted) {
      if (persisted.isPaused) {
        return {
          seconds: persisted.pausedRemaining,
          isRunning: true,
          isPaused: true,
          presetSeconds: persisted.presetSeconds,
        };
      }
      const remaining = Math.ceil((persisted.targetTimestamp - Date.now()) / 1000);
      if (remaining > 0) {
        return {
          seconds: remaining,
          isRunning: true,
          isPaused: false,
          presetSeconds: persisted.presetSeconds,
        };
      }
      // Timer already expired
      persistTimer(null);
    }
    return { seconds: 0, isRunning: false, isPaused: false, presetSeconds: 0 };
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const targetRef = useRef<number>(0);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    const remaining = Math.ceil((targetRef.current - Date.now()) / 1000);
    if (remaining <= 0) {
      clearTimer();
      persistTimer(null);
      setState(prev => ({
        ...prev,
        seconds: 0,
        isRunning: false,
        isPaused: false,
      }));
      // Alert!
      playTimerComplete();
      vibrateDevice();
    } else {
      setState(prev => ({ ...prev, seconds: remaining }));
    }
  }, [clearTimer]);

  // Start interval when running + not paused
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      // If no target set yet, compute from seconds
      if (targetRef.current <= Date.now()) {
        targetRef.current = Date.now() + state.seconds * 1000;
      }
      clearTimer();
      intervalRef.current = setInterval(tick, 250);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [state.isRunning, state.isPaused, clearTimer, tick]);

  const start = useCallback((presetSeconds: number) => {
    clearTimer();
    const target = Date.now() + presetSeconds * 1000;
    targetRef.current = target;
    persistTimer({
      targetTimestamp: target,
      presetSeconds,
      isPaused: false,
      pausedRemaining: presetSeconds,
    });
    setState({
      seconds: presetSeconds,
      isRunning: true,
      isPaused: false,
      presetSeconds,
    });
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setState(prev => {
      if (!prev.isRunning || prev.isPaused) return prev;
      persistTimer({
        targetTimestamp: 0,
        presetSeconds: prev.presetSeconds,
        isPaused: true,
        pausedRemaining: prev.seconds,
      });
      return { ...prev, isPaused: true };
    });
  }, [clearTimer]);

  const resume = useCallback(() => {
    setState(prev => {
      if (!prev.isRunning || !prev.isPaused) return prev;
      const target = Date.now() + prev.seconds * 1000;
      targetRef.current = target;
      persistTimer({
        targetTimestamp: target,
        presetSeconds: prev.presetSeconds,
        isPaused: false,
        pausedRemaining: prev.seconds,
      });
      return { ...prev, isPaused: false };
    });
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    persistTimer(null);
    targetRef.current = 0;
    setState({ seconds: 0, isRunning: false, isPaused: false, presetSeconds: 0 });
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setState(prev => {
      if (prev.presetSeconds <= 0) return prev;
      const target = Date.now() + prev.presetSeconds * 1000;
      targetRef.current = target;
      persistTimer({
        targetTimestamp: target,
        presetSeconds: prev.presetSeconds,
        isPaused: false,
        pausedRemaining: prev.presetSeconds,
      });
      return {
        seconds: prev.presetSeconds,
        isRunning: true,
        isPaused: false,
        presetSeconds: prev.presetSeconds,
      };
    });
  }, [clearTimer]);

  return {
    ...state,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
