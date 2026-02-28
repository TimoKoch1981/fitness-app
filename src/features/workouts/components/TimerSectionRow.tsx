/**
 * TimerSectionRow — A single row in the workout timer table.
 * Shows checkbox, label, target time (editable), and current time.
 */

import { useState, useCallback } from 'react';
import { cn } from '../../../lib/utils';
import type { TimerSection, TimerSectionId } from '../hooks/useWorkoutTimers';

interface TimerSectionRowProps {
  section: TimerSection;
  label: string;
  onToggle: (id: TimerSectionId) => void;
  onSetTarget: (id: TimerSectionId, seconds: number) => void;
  globalEnabled: boolean;
}

/**
 * Format seconds as MM:SS.
 */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function TimerSectionRow({
  section,
  label,
  onToggle,
  onSetTarget,
  globalEnabled,
}: TimerSectionRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const isActive = section.enabled && globalEnabled;

  // Remaining for countdown, elapsed for stopwatch
  const displaySeconds = section.mode === 'countdown'
    ? Math.max(0, section.targetSeconds - section.elapsedSeconds)
    : section.elapsedSeconds;

  const isCompleted = section.mode === 'countdown' && section.elapsedSeconds >= section.targetSeconds;
  const isOvertime = section.mode === 'countdown' && isCompleted;

  const handleStartEdit = useCallback(() => {
    if (!isActive) return;
    const m = Math.floor(section.targetSeconds / 60);
    const s = section.targetSeconds % 60;
    setEditValue(`${m}:${s.toString().padStart(2, '0')}`);
    setIsEditing(true);
  }, [isActive, section.targetSeconds]);

  const handleSaveEdit = useCallback(() => {
    const parts = editValue.split(':');
    let totalSeconds = 0;
    if (parts.length === 2) {
      totalSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 1) {
      totalSeconds = parseInt(parts[0]) * 60;
    }
    if (totalSeconds > 0 && !isNaN(totalSeconds)) {
      onSetTarget(section.id, totalSeconds);
    }
    setIsEditing(false);
  }, [editValue, onSetTarget, section.id]);

  return (
    <tr
      className={cn(
        'border-b border-gray-700/50 last:border-b-0 transition-colors',
        !isActive && 'opacity-40',
      )}
    >
      {/* Checkbox */}
      <td className="py-1.5 px-2 w-8">
        <input
          type="checkbox"
          checked={section.enabled}
          onChange={() => onToggle(section.id)}
          className="h-3.5 w-3.5 rounded border-gray-600 text-teal-500 focus:ring-teal-500 bg-gray-700"
        />
      </td>

      {/* Label */}
      <td className="py-1.5 px-1 text-xs text-gray-300 whitespace-nowrap">
        {label}
      </td>

      {/* Target (Soll) — clickable for editing */}
      <td className="py-1.5 px-1 text-center w-16">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
            className="w-14 text-xs text-center bg-gray-600 text-white rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-teal-400"
            autoFocus
          />
        ) : (
          <button
            onClick={handleStartEdit}
            disabled={!isActive}
            className={cn(
              'text-xs tabular-nums',
              isActive ? 'text-gray-400 hover:text-teal-300 cursor-pointer' : 'text-gray-600 cursor-default',
            )}
          >
            {formatTime(section.targetSeconds)}
          </button>
        )}
      </td>

      {/* Current (Ist) — live counter */}
      <td className="py-1.5 px-2 text-right w-20">
        {section.enabled ? (
          <span
            className={cn(
              'text-sm font-mono tabular-nums font-semibold',
              section.isRunning && 'text-teal-400',
              !section.isRunning && !isOvertime && 'text-gray-500',
              isOvertime && 'text-red-400',
            )}
          >
            {isCompleted && !section.isRunning ? (
              <span className="text-green-400">00:00</span>
            ) : (
              formatTime(displaySeconds)
            )}
            {section.isRunning && (
              <span className="ml-0.5 text-[10px] text-teal-500 align-top animate-pulse">&bull;</span>
            )}
          </span>
        ) : (
          <span className="text-xs text-gray-600">--:--</span>
        )}
      </td>
    </tr>
  );
}
