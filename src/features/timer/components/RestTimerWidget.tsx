/**
 * RestTimerWidget — Compact rest timer with circular countdown display.
 *
 * Features:
 * - SVG circular countdown (like WaterWidget)
 * - MM:SS display
 * - Color: green -> yellow (< 30s) -> red (< 10s)
 * - Preset buttons (30s, 60s, 90s, 120s, 180s)
 * - Play/Pause/Stop controls
 * - Framer-motion animation
 * - Minimizable to TimerBubble
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Minimize2, RotateCcw } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useRestTimerContext } from '../context/RestTimerContext';
import { REST_TIMER_PRESETS } from '../hooks/useRestTimer';

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getTimerColor(seconds: number): string {
  if (seconds <= 10) return '#ef4444'; // red-500
  if (seconds <= 30) return '#eab308'; // yellow-500
  return '#22c55e'; // green-500
}

function getTimerColorClass(seconds: number): string {
  if (seconds <= 10) return 'text-red-500';
  if (seconds <= 30) return 'text-yellow-500';
  return 'text-green-500';
}

interface ProgressRingProps {
  percentage: number;
  size: number;
  strokeWidth: number;
  color: string;
}

function ProgressRing({ percentage, size, strokeWidth, color }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-gray-200"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </svg>
  );
}

interface RestTimerWidgetProps {
  onMinimize?: () => void;
}

export function RestTimerWidget({ onMinimize }: RestTimerWidgetProps) {
  const { t } = useTranslation();
  const timer = useRestTimerContext();
  const [showPresets, setShowPresets] = useState(!timer.isRunning);

  const percentage = timer.presetSeconds > 0
    ? (timer.seconds / timer.presetSeconds) * 100
    : 0;

  const color = getTimerColor(timer.seconds);
  const colorClass = getTimerColorClass(timer.seconds);

  const timerKeys = t.timer;

  const presetLabels: Record<number, string> = {
    30: timerKeys?.preset30 ?? '30s',
    60: timerKeys?.preset60 ?? '60s',
    90: timerKeys?.preset90 ?? '90s',
    120: timerKeys?.preset120 ?? '2m',
    180: timerKeys?.preset180 ?? '3m',
  };

  const handlePreset = (seconds: number) => {
    timer.start(seconds);
    setShowPresets(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {timerKeys?.restTimer ?? 'Rest Timer'}
        </h3>
        {timer.isRunning && onMinimize && (
          <button
            onClick={onMinimize}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={timerKeys?.minimize ?? 'Minimize'}
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Circular countdown */}
      {timer.isRunning && (
        <div className="flex flex-col items-center mb-4">
          <div className="relative">
            <ProgressRing
              percentage={percentage}
              size={120}
              strokeWidth={8}
              color={color}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                key={timer.seconds}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className={`text-2xl font-mono font-bold ${colorClass}`}
              >
                {formatTime(timer.seconds)}
              </motion.span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 mt-3">
            {timer.isPaused ? (
              <button
                onClick={timer.resume}
                className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors"
                aria-label={timerKeys?.resume ?? 'Resume'}
              >
                <Play className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={timer.pause}
                className="p-2 bg-yellow-100 text-yellow-600 rounded-full hover:bg-yellow-200 transition-colors"
                aria-label={timerKeys?.pause ?? 'Pause'}
              >
                <Pause className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={timer.stop}
              className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
              aria-label={timerKeys?.stop ?? 'Stop'}
            >
              <Square className="h-5 w-5" />
            </button>
            <button
              onClick={timer.reset}
              className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Time's up message */}
      <AnimatePresence>
        {!timer.isRunning && timer.presetSeconds > 0 && timer.seconds === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm font-medium text-green-600 mb-3"
          >
            {timerKeys?.timeUp ?? "Time's up!"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preset buttons */}
      {(!timer.isRunning || showPresets) && (
        <div className="flex flex-wrap gap-2 justify-center">
          {REST_TIMER_PRESETS.map(preset => (
            <button
              key={preset}
              onClick={() => handlePreset(preset)}
              className="px-3 py-1.5 text-xs font-medium bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
            >
              {presetLabels[preset]}
            </button>
          ))}
        </div>
      )}

      {/* Toggle presets when running */}
      {timer.isRunning && !showPresets && (
        <button
          onClick={() => setShowPresets(true)}
          className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-2"
        >
          {timerKeys?.start ?? 'New timer'}
        </button>
      )}
    </motion.div>
  );
}
