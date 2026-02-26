/**
 * ExerciseTimer — Countdown timer for timed exercises.
 * Used for planks, isometric holds, stretches, and other time-based exercises.
 * Shows countdown with start/pause/reset controls.
 */

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Check, SkipForward } from 'lucide-react';
import { useTranslation } from '../../../i18n';

interface ExerciseTimerProps {
  /** Target duration in seconds */
  durationSeconds: number;
  /** Exercise name for display */
  exerciseName: string;
  /** Called when timer completes or user marks done */
  onComplete: (actualSeconds: number) => void;
  /** Called when user skips */
  onSkip: () => void;
}

export function ExerciseTimer({ durationSeconds, exerciseName, onComplete, onSkip }: ExerciseTimerProps) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, remaining]);

  const handleStart = useCallback(() => {
    setIsRunning(true);
    setHasStarted(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setRemaining(durationSeconds);
    setHasStarted(false);
  }, [durationSeconds]);

  const handleDone = useCallback(() => {
    const elapsed = durationSeconds - remaining;
    onComplete(elapsed > 0 ? elapsed : durationSeconds);
  }, [durationSeconds, remaining, onComplete]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = durationSeconds > 0 ? ((durationSeconds - remaining) / durationSeconds) * 100 : 100;
  const isCompleted = remaining <= 0;

  // Circle dimensions
  const size = 180;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <div className="flex flex-col items-center py-4">
      {/* Label */}
      <div className="text-center mb-4">
        <p className="text-sm font-medium text-gray-500">
          {t.workout?.timedExercise ?? 'Timed Exercise'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {t.workout?.holdFor ?? 'Hold for'} {durationSeconds}s
        </p>
      </div>

      {/* Circular Timer */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={isCompleted ? '#22c55e' : '#14b8a6'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-gray-900 tabular-nums">
            {minutes}:{secs.toString().padStart(2, '0')}
          </span>
          {isRunning && (
            <span className="text-xs text-teal-500 mt-1">
              {t.workout?.timerRunning ?? 'Running'}
            </span>
          )}
          {isCompleted && (
            <span className="text-xs text-green-500 font-medium mt-1">
              ✓
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mt-5">
        {!isCompleted && !isRunning && (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
          >
            <Play className="h-4 w-4" />
            {t.workout?.timerStart ?? 'Start'}
          </button>
        )}
        {isRunning && (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors"
          >
            <Pause className="h-4 w-4" />
            {t.workout?.timerPause ?? 'Pause'}
          </button>
        )}
        {hasStarted && !isRunning && !isCompleted && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            {t.workout?.timerReset ?? 'Reset'}
          </button>
        )}
      </div>

      {/* Done / Skip */}
      <div className="flex gap-2 mt-5 w-full max-w-xs">
        <button
          onClick={onSkip}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <SkipForward className="h-4 w-4" />
          {t.workout?.skipSet ?? 'Skip'}
        </button>
        <button
          onClick={handleDone}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-white rounded-lg font-medium transition-colors ${
            isCompleted ? 'bg-green-500 hover:bg-green-600' : 'bg-teal-500 hover:bg-teal-600'
          }`}
        >
          <Check className="h-4 w-4" />
          {t.workout?.exerciseDone ?? 'Done'}
        </button>
      </div>
    </div>
  );
}
