/**
 * RestTimer — Countdown timer between sets.
 * Shows circular animation, vibrates on completion (if supported).
 * Configurable: on/off toggle, adjustable duration.
 */

import { useState, useEffect, useCallback } from 'react';
import { Timer, SkipForward, Minus, Plus } from 'lucide-react';
import { useTranslation } from '../../../i18n';

interface RestTimerProps {
  seconds: number;
  onComplete: () => void;
  onSkip: () => void;
  onAdjust: (seconds: number) => void;
}

export function RestTimer({ seconds, onComplete, onSkip, onAdjust }: RestTimerProps) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      // Vibrate if supported
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      onComplete();
      return;
    }

    const interval = setInterval(() => {
      setRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [remaining, onComplete]);

  const progress = seconds > 0 ? ((seconds - remaining) / seconds) * 100 : 100;
  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const adjustBy = useCallback((delta: number) => {
    const newVal = Math.max(15, seconds + delta);
    onAdjust(newVal);
  }, [seconds, onAdjust]);

  // Circle dimensions
  const size = 160;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <div className="flex flex-col items-center py-6">
      {/* Timer Label */}
      <div className="flex items-center gap-2 mb-4">
        <Timer className="h-5 w-5 text-teal-500" />
        <span className="text-sm font-medium text-gray-500">
          {t.workout?.restTimer ?? 'Pause'}
        </span>
      </div>

      {/* Circular Countdown */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#14b8a6"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        {/* Time display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold text-gray-900 tabular-nums">
            {minutes}:{secs.toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Adjust Duration */}
      <div className="flex items-center gap-4 mt-4">
        <button
          onClick={() => adjustBy(-15)}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <Minus className="h-4 w-4 text-gray-600" />
        </button>
        <span className="text-sm text-gray-400 w-12 text-center">{seconds}s</span>
        <button
          onClick={() => adjustBy(15)}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <Plus className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Skip Button */}
      <button
        onClick={onSkip}
        className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
      >
        <SkipForward className="h-4 w-4" />
        {t.workout?.skipTimer ?? 'Überspringen'}
      </button>
    </div>
  );
}
