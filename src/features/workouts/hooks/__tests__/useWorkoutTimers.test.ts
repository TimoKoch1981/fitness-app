/**
 * Tests for useWorkoutTimers hook — 5-section timer logic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkoutTimers } from '../useWorkoutTimers';

describe('useWorkoutTimers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with 5 timer sections', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    expect(Object.keys(result.current.state.sections)).toEqual([
      'total', 'exercise', 'exerciseRest', 'set', 'setRest',
    ]);
  });

  it('all sections start at 0 elapsed, not running', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    for (const section of Object.values(result.current.state.sections)) {
      expect(section.elapsedSeconds).toBe(0);
      expect(section.isRunning).toBe(false);
    }
  });

  it('default settings: globalEnabled=true, autoAdvance=true, alertMode=both', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    expect(result.current.state.globalEnabled).toBe(true);
    expect(result.current.state.autoAdvance).toBe(true);
    expect(result.current.state.alertMode).toBe('both');
  });

  it('startSection starts a section', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    act(() => {
      result.current.startSection('total');
    });

    expect(result.current.state.sections.total.isRunning).toBe(true);
  });

  it('pauseSection pauses a section', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    act(() => {
      result.current.startSection('total');
    });
    expect(result.current.state.sections.total.isRunning).toBe(true);

    act(() => {
      result.current.pauseSection('total');
    });
    expect(result.current.state.sections.total.isRunning).toBe(false);
  });

  it('resetSection resets elapsed and stops', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    act(() => {
      result.current.startSection('set');
    });

    // Advance time
    act(() => { vi.advanceTimersByTime(3000); });

    act(() => {
      result.current.resetSection('set');
    });

    expect(result.current.state.sections.set.elapsedSeconds).toBe(0);
    expect(result.current.state.sections.set.isRunning).toBe(false);
  });

  it('toggleGlobal disables all timers', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    act(() => {
      result.current.toggleGlobal();
    });

    expect(result.current.state.globalEnabled).toBe(false);
  });

  it('toggleAutoAdvance flips autoAdvance', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    expect(result.current.state.autoAdvance).toBe(true);

    act(() => {
      result.current.toggleAutoAdvance();
    });

    expect(result.current.state.autoAdvance).toBe(false);
  });

  it('setAlertMode changes the alert mode', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    act(() => {
      result.current.setAlertMode('sound');
    });

    expect(result.current.state.alertMode).toBe('sound');
  });

  it('toggleSectionEnabled disables a section', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    expect(result.current.state.sections.total.enabled).toBe(true);

    act(() => {
      result.current.toggleSectionEnabled('total');
    });

    expect(result.current.state.sections.total.enabled).toBe(false);
  });

  it('setTarget updates target seconds', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    act(() => {
      result.current.setTarget('setRest', 120);
    });

    expect(result.current.state.sections.setRest.targetSeconds).toBe(120);
  });

  it('setTarget enforces minimum of 5 seconds', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    act(() => {
      result.current.setTarget('setRest', 2);
    });

    expect(result.current.state.sections.setRest.targetSeconds).toBe(5);
  });

  it('toggleMode switches between countdown and stopwatch', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    expect(result.current.state.sections.setRest.mode).toBe('countdown');

    act(() => {
      result.current.toggleMode('setRest');
    });

    expect(result.current.state.sections.setRest.mode).toBe('stopwatch');
  });

  it('startSetRest pauses set timer and starts setRest', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    act(() => {
      result.current.startSection('set');
    });
    expect(result.current.state.sections.set.isRunning).toBe(true);

    act(() => {
      result.current.startSetRest(60);
    });

    expect(result.current.state.sections.set.isRunning).toBe(false);
    expect(result.current.state.sections.setRest.isRunning).toBe(true);
    expect(result.current.state.sections.setRest.targetSeconds).toBe(60);
    expect(result.current.state.sections.setRest.elapsedSeconds).toBe(0);
  });

  it('startExerciseTimer resets exercise and set timers', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    act(() => {
      result.current.startExerciseTimer(300);
    });

    expect(result.current.state.sections.exercise.isRunning).toBe(true);
    expect(result.current.state.sections.exercise.targetSeconds).toBe(300);
    expect(result.current.state.sections.set.elapsedSeconds).toBe(0);
    expect(result.current.state.sections.exerciseRest.isRunning).toBe(false);
  });

  it('resetAll stops and resets all sections', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    act(() => {
      result.current.startSection('total');
      result.current.startSection('set');
    });

    act(() => { vi.advanceTimersByTime(5000); });

    act(() => {
      result.current.resetAll();
    });

    for (const section of Object.values(result.current.state.sections)) {
      expect(section.elapsedSeconds).toBe(0);
      expect(section.isRunning).toBe(false);
    }
  });

  it('pauseAll stops all running sections', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    act(() => {
      result.current.startSection('total');
      result.current.startSection('exercise');
      result.current.startSection('set');
    });

    act(() => {
      result.current.pauseAll();
    });

    for (const section of Object.values(result.current.state.sections)) {
      expect(section.isRunning).toBe(false);
    }
  });

  it('disabled section cannot be started', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    act(() => {
      result.current.toggleSectionEnabled('set');
    });

    act(() => {
      result.current.startSection('set');
    });

    expect(result.current.state.sections.set.isRunning).toBe(false);
  });

  it('countdown timer stops when reaching target', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    // Set a short countdown
    act(() => {
      result.current.setTarget('setRest', 5);
      result.current.startSection('setRest');
    });

    expect(result.current.state.sections.setRest.isRunning).toBe(true);

    // Advance past the target
    act(() => { vi.advanceTimersByTime(6000); });

    expect(result.current.state.sections.setRest.isRunning).toBe(false);
    expect(result.current.state.sections.setRest.elapsedSeconds).toBe(5);
  });

  it('stopwatch timer keeps running past target', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    act(() => {
      result.current.setTarget('total', 10);
      result.current.startSection('total');
    });

    act(() => { vi.advanceTimersByTime(15000); });

    expect(result.current.state.sections.total.isRunning).toBe(true);
    expect(result.current.state.sections.total.elapsedSeconds).toBeGreaterThanOrEqual(10);
  });

  it('initTimers can override initial state', () => {
    const { result } = renderHook(() => useWorkoutTimers());

    act(() => {
      result.current.initTimers({
        autoAdvance: false,
        alertMode: 'vibration',
      });
    });

    expect(result.current.state.autoAdvance).toBe(false);
    expect(result.current.state.alertMode).toBe('vibration');
  });
});
