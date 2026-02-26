/**
 * ManualTimer — Startable timer for any exercise, set, or rest.
 * Supports two modes: Stopwatch (count up) and Countdown (count down).
 * Compact inline widget that can be toggled on/off.
 */

import { useState, useEffect, useCallback } from 'react';
import { Timer, Play, Pause, RotateCcw, Minus, Plus } from 'lucide-react';
import { useTranslation } from '../../../i18n';

interface ManualTimerProps {
  /** If provided, starts as countdown from this value (seconds) */
  initialSeconds?: number;
}

export function ManualTimer({ initialSeconds }: ManualTimerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'stopwatch' | 'countdown'>(initialSeconds ? 'countdown' : 'stopwatch');
  const [countdownTarget, setCountdownTarget] = useState(initialSeconds ?? 60);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (mode === 'countdown' && next >= countdownTarget) {
          setIsRunning(false);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
          return countdownTarget;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, countdownTarget]);

  const handleStartPause = useCallback(() => {
    if (mode === 'countdown' && elapsed >= countdownTarget) {
      setElapsed(0);
    }
    setIsRunning(prev => !prev);
  }, [mode, elapsed, countdownTarget]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
  }, []);

  const adjustCountdown = useCallback((delta: number) => {
    setCountdownTarget(prev => Math.max(5, prev + delta));
    setElapsed(0);
    setIsRunning(false);
  }, []);

  // Display value
  const displaySeconds = mode === 'countdown'
    ? Math.max(0, countdownTarget - elapsed)
    : elapsed;
  const minutes = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;
  const isCountdownComplete = mode === 'countdown' && elapsed >= countdownTarget;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Timer className="h-3.5 w-3.5" />
        {t.workout?.manualTimer ?? 'Timer'}
      </button>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
      {/* Mode Toggle */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => { setMode('stopwatch'); handleReset(); }}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            mode === 'stopwatch' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {t.workout?.stopwatch ?? 'Stopwatch'}
        </button>
        <button
          onClick={() => { setMode('countdown'); handleReset(); }}
          className={`px-3 py-1 text-xs rounded-full transition-colors ${
            mode === 'countdown' ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {t.workout?.countdown ?? 'Countdown'}
        </button>
        <button
          onClick={() => { setIsOpen(false); handleReset(); }}
          className="ml-auto text-xs text-gray-300 hover:text-gray-500 px-1"
        >
          ✕
        </button>
      </div>

      {/* Countdown duration adjustment */}
      {mode === 'countdown' && !isRunning && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => adjustCountdown(-15)}
            className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            <Minus className="h-3 w-3 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-600 w-12 text-center tabular-nums">
            {countdownTarget}s
          </span>
          <button
            onClick={() => adjustCountdown(15)}
            className="p-1.5 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
          >
            <Plus className="h-3 w-3 text-gray-600" />
          </button>
        </div>
      )}

      {/* Time Display + Controls */}
      <div className="flex items-center justify-between">
        <span className={`text-2xl font-bold tabular-nums ${
          isCountdownComplete ? 'text-green-500' : 'text-gray-900'
        }`}>
          {minutes}:{secs.toString().padStart(2, '0')}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleStartPause}
            className={`p-2 rounded-full transition-colors ${
              isRunning
                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                : 'bg-teal-100 text-teal-600 hover:bg-teal-200'
            }`}
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
