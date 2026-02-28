/**
 * WorkoutTimerPanel — Compact tabular timer display for active workouts.
 *
 * Shows 5 timer sections as a table:
 *   ✓ | Label     | Soll  | Ist
 *   ──┼───────────┼───────┼──────
 *   ☑ | Gesamt    | 60:00 | 12:34
 *   ☑ | Übung     | 05:00 | 02:11
 *   ☐ | Üb.-Pause |       | --:--
 *   ☑ | Satz      | 01:00 | 00:45
 *   ☑ | Satzpause | 01:30 | 00:22
 *
 * Collapsible: starts collapsed (just a bar), tap to expand.
 * Settings toggle for autoAdvance + alertMode.
 */

import { useState, useCallback } from 'react';
import {
  Timer, ChevronDown, ChevronUp, Settings, Bell, BellOff,
  Smartphone, Volume2, Vibrate,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { cn } from '../../../lib/utils';
import { TimerSectionRow } from './TimerSectionRow';
import type { TimerSectionId, WorkoutTimersState } from '../hooks/useWorkoutTimers';
import type { AlertMode } from '../utils/timerAlerts';

// ── Props ────────────────────────────────────────────────────────────────

interface WorkoutTimerPanelProps {
  state: WorkoutTimersState;
  onToggleSectionEnabled: (id: TimerSectionId) => void;
  onSetTarget: (id: TimerSectionId, seconds: number) => void;
  onToggleGlobal: () => void;
  onToggleAutoAdvance: () => void;
  onSetAlertMode: (mode: AlertMode) => void;
  className?: string;
}

// ── Alert Mode Cycle ─────────────────────────────────────────────────────

const ALERT_MODES: AlertMode[] = ['both', 'vibration', 'sound', 'none'];

function nextAlertMode(current: AlertMode): AlertMode {
  const idx = ALERT_MODES.indexOf(current);
  return ALERT_MODES[(idx + 1) % ALERT_MODES.length];
}

function AlertModeIcon({ mode }: { mode: AlertMode }) {
  switch (mode) {
    case 'both':
      return <Bell className="h-3.5 w-3.5" />;
    case 'vibration':
      return <Vibrate className="h-3.5 w-3.5" />;
    case 'sound':
      return <Volume2 className="h-3.5 w-3.5" />;
    case 'none':
      return <BellOff className="h-3.5 w-3.5" />;
  }
}

// ── Section Labels ───────────────────────────────────────────────────────

const SECTION_LABELS_DE: Record<TimerSectionId, string> = {
  total: 'Gesamt',
  exercise: 'Übung',
  exerciseRest: 'Üb.-Pause',
  set: 'Satz',
  setRest: 'Satzpause',
};

const SECTION_LABELS_EN: Record<TimerSectionId, string> = {
  total: 'Total',
  exercise: 'Exercise',
  exerciseRest: 'Ex. Rest',
  set: 'Set',
  setRest: 'Set Rest',
};

const SECTION_ORDER: TimerSectionId[] = ['total', 'exercise', 'exerciseRest', 'set', 'setRest'];

// ── Component ────────────────────────────────────────────────────────────

export function WorkoutTimerPanel({
  state,
  onToggleSectionEnabled,
  onSetTarget,
  onToggleGlobal,
  onToggleAutoAdvance,
  onSetAlertMode,
  className,
}: WorkoutTimerPanelProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const labels = isDE ? SECTION_LABELS_DE : SECTION_LABELS_EN;

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleAlertCycle = useCallback(() => {
    onSetAlertMode(nextAlertMode(state.alertMode));
  }, [state.alertMode, onSetAlertMode]);

  // Count running timers
  const runningCount = Object.values(state.sections).filter(s => s.isRunning && s.enabled).length;

  // Format total elapsed for the collapsed bar
  const totalElapsed = state.sections.total.elapsedSeconds;
  const totalMin = Math.floor(totalElapsed / 60);
  const totalSec = totalElapsed % 60;
  const totalStr = `${totalMin}:${totalSec.toString().padStart(2, '0')}`;

  // ── Collapsed bar ──────────────────────────────────────────────────────

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white rounded-lg shadow',
          'hover:bg-gray-700 transition-colors text-xs',
          !state.globalEnabled && 'opacity-50',
          className,
        )}
      >
        <Timer className="h-3.5 w-3.5 text-teal-400" />
        <span className="font-mono tabular-nums">{totalStr}</span>
        {runningCount > 0 && (
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
        )}
        <ChevronDown className="h-3 w-3 text-gray-400 ml-1" />
      </button>
    );
  }

  // ── Expanded panel ─────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        'bg-gray-800 rounded-xl shadow-lg overflow-hidden text-white',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleGlobal}
            className={cn(
              'p-1 rounded transition-colors',
              state.globalEnabled ? 'text-teal-400' : 'text-gray-500',
            )}
            title={isDE ? 'Timer ein/aus' : 'Timer on/off'}
          >
            <Timer className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium text-gray-300">
            {isDE ? 'Timer' : 'Timers'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Alert mode toggle */}
          <button
            onClick={handleAlertCycle}
            className="p-1 rounded text-gray-400 hover:text-teal-300 transition-colors"
            title={`Alert: ${state.alertMode}`}
          >
            <AlertModeIcon mode={state.alertMode} />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(v => !v)}
            className={cn(
              'p-1 rounded transition-colors',
              showSettings ? 'text-teal-400' : 'text-gray-400 hover:text-gray-300',
            )}
          >
            <Settings className="h-3.5 w-3.5" />
          </button>

          {/* Collapse */}
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 rounded text-gray-400 hover:text-gray-300 transition-colors"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Settings row */}
      {showSettings && (
        <div className="px-3 py-2 border-b border-gray-700 flex items-center gap-3 text-[11px] text-gray-400">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={state.autoAdvance}
              onChange={onToggleAutoAdvance}
              className="h-3 w-3 rounded border-gray-600 text-teal-500 bg-gray-700"
            />
            <span>{isDE ? 'Auto-Weiter' : 'Auto-Advance'}</span>
          </label>

          <button
            onClick={handleAlertCycle}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-700/50 hover:bg-gray-700 transition-colors"
          >
            <Smartphone className="h-3 w-3" />
            <span className="capitalize">{state.alertMode === 'both' ? (isDE ? 'Beides' : 'Both') : state.alertMode}</span>
          </button>
        </div>
      )}

      {/* Timer Table */}
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-700 text-[10px] uppercase tracking-wider text-gray-500">
            <th className="py-1 px-2 w-8" />
            <th className="py-1 px-1">{isDE ? 'Timer' : 'Timer'}</th>
            <th className="py-1 px-1 text-center w-16">{isDE ? 'Soll' : 'Target'}</th>
            <th className="py-1 px-2 text-right w-20">{isDE ? 'Ist' : 'Current'}</th>
          </tr>
        </thead>
        <tbody>
          {SECTION_ORDER.map(id => (
            <TimerSectionRow
              key={id}
              section={state.sections[id]}
              label={labels[id]}
              onToggle={onToggleSectionEnabled}
              onSetTarget={onSetTarget}
              globalEnabled={state.globalEnabled}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
