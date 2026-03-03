/**
 * useRestTimer — Hook tests.
 * Tests: start, countdown, pause/resume, stop, presets, zero callback (beep + vibrate).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRestTimer, REST_TIMER_PRESETS } from '../useRestTimer';

// Mock timer sound module
vi.mock('../../utils/timerSound', () => ({
  playTimerComplete: vi.fn(),
  vibrateDevice: vi.fn(),
}));

import { playTimerComplete, vibrateDevice } from '../../utils/timerSound';

describe('useRestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default idle state', () => {
    const { result } = renderHook(() => useRestTimer());
    expect(result.current.seconds).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.presetSeconds).toBe(0);
  });

  it('starts a timer with the given seconds', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => { result.current.start(60); });
    expect(result.current.isRunning).toBe(true);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.seconds).toBe(60);
    expect(result.current.presetSeconds).toBe(60);
  });

  it('counts down over time', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => { result.current.start(10); });
    act(() => { vi.advanceTimersByTime(3000); });
    // Should have counted down (timer uses Date.now-based calculation)
    expect(result.current.seconds).toBeLessThanOrEqual(8);
    expect(result.current.seconds).toBeGreaterThanOrEqual(6);
    expect(result.current.isRunning).toBe(true);
  });

  it('pauses the timer', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => { result.current.start(60); });
    act(() => { vi.advanceTimersByTime(2000); });
    const secondsBeforePause = result.current.seconds;
    act(() => { result.current.pause(); });
    expect(result.current.isPaused).toBe(true);
    expect(result.current.isRunning).toBe(true);
    // Advance time — seconds should not change while paused
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.seconds).toBe(secondsBeforePause);
  });

  it('resumes the timer after pause', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => { result.current.start(60); });
    act(() => { vi.advanceTimersByTime(1000); });
    act(() => { result.current.pause(); });
    const pausedSeconds = result.current.seconds;
    act(() => { result.current.resume(); });
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isRunning).toBe(true);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.seconds).toBeLessThan(pausedSeconds);
  });

  it('stops the timer and resets state', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => { result.current.start(60); });
    act(() => { result.current.stop(); });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.seconds).toBe(0);
    expect(result.current.presetSeconds).toBe(0);
  });

  it('resets the timer to the original preset', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => { result.current.start(90); });
    act(() => { vi.advanceTimersByTime(5000); });
    act(() => { result.current.reset(); });
    expect(result.current.seconds).toBe(90);
    expect(result.current.isRunning).toBe(true);
    expect(result.current.presetSeconds).toBe(90);
  });

  it('plays beep and vibrates when timer reaches 0', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => { result.current.start(2); });
    act(() => { vi.advanceTimersByTime(3000); });
    expect(playTimerComplete).toHaveBeenCalled();
    expect(vibrateDevice).toHaveBeenCalled();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.seconds).toBe(0);
  });

  it('exposes standard preset values', () => {
    expect(REST_TIMER_PRESETS).toEqual([30, 60, 90, 120, 180]);
  });

  it('persists timer to localStorage on start', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => { result.current.start(60); });
    const stored = localStorage.getItem('fitbuddy_rest_timer');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.presetSeconds).toBe(60);
    expect(parsed.isPaused).toBe(false);
  });

  it('clears localStorage on stop', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => { result.current.start(60); });
    expect(localStorage.getItem('fitbuddy_rest_timer')).not.toBeNull();
    act(() => { result.current.stop(); });
    expect(localStorage.getItem('fitbuddy_rest_timer')).toBeNull();
  });
});
