/**
 * useWorkoutVoiceCommands — Voice command parser for active workout sessions.
 *
 * Intercepts spoken commands locally (no AI call needed) and dispatches
 * workout actions. Falls back to Buddy Chat for complex queries.
 *
 * Supported commands (DE + EN):
 * - "Nächste Übung" / "Next exercise" → NEXT_EXERCISE
 * - "Zurück" / "Back" → PREV_EXERCISE
 * - "Überspringen" / "Skip" → SKIP_EXERCISE
 * - "Timer starten/stoppen" / "Start/Stop timer" → TOGGLE_TIMER
 * - "{N} Wiederholungen" / "{N} reps" → LOG_SET with reps
 * - "Fertig" / "Finish" / "Done" → FINISH_SESSION
 * - "Pause" → SET_PHASE rest
 */

import { useCallback, useRef } from 'react';
import { useVoiceInput } from '../../buddy/hooks/useVoiceInput';
import type { VoiceError } from '../../buddy/hooks/useVoiceInput';

export type WorkoutCommand =
  | { type: 'next_exercise' }
  | { type: 'prev_exercise' }
  | { type: 'skip_exercise' }
  | { type: 'log_set'; reps: number; weightKg?: number }
  | { type: 'toggle_timer' }
  | { type: 'start_timer' }
  | { type: 'stop_timer' }
  | { type: 'finish_session' }
  | { type: 'rest_phase' }
  | { type: 'unknown'; transcript: string };

export interface UseWorkoutVoiceCommandsOptions {
  language: string;
  onCommand: (command: WorkoutCommand) => void;
  onFeedback?: (message: string) => void;
  enabled?: boolean;
}

export interface UseWorkoutVoiceCommandsReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  error: VoiceError | null;
  toggleListening: () => void;
  lastCommand: WorkoutCommand | null;
}

// ---------------------------------------------------------------------------
// Command detection (regex-based, no AI needed)
// ---------------------------------------------------------------------------

const COMMAND_PATTERNS: Array<{
  pattern: RegExp;
  command: (match: RegExpMatchArray) => WorkoutCommand;
}> = [
  // Next exercise
  { pattern: /n[aä]chste?\s*(übung|exercise)/i, command: () => ({ type: 'next_exercise' }) },
  { pattern: /^next$/i, command: () => ({ type: 'next_exercise' }) },
  { pattern: /^weiter$/i, command: () => ({ type: 'next_exercise' }) },

  // Previous exercise
  { pattern: /zur[uü]ck/i, command: () => ({ type: 'prev_exercise' }) },
  { pattern: /vorherige?\s*(übung|exercise)/i, command: () => ({ type: 'prev_exercise' }) },
  { pattern: /^back$/i, command: () => ({ type: 'prev_exercise' }) },
  { pattern: /^previous$/i, command: () => ({ type: 'prev_exercise' }) },

  // Skip exercise
  { pattern: /[uü]berspringen/i, command: () => ({ type: 'skip_exercise' }) },
  { pattern: /^skip$/i, command: () => ({ type: 'skip_exercise' }) },

  // Log set: "80 kilo 10 reps" (weight-first — must be checked before reps-first)
  {
    pattern: /(\d+(?:[.,]\d+)?)\s*(?:kilo|kg)\s+(\d+)\s*(?:wiederholungen?|wdh|reps?)/i,
    command: (m) => ({
      type: 'log_set',
      reps: parseInt(m[2], 10),
      weightKg: parseFloat(m[1].replace(',', '.')),
    }),
  },
  // Log set: "10 Wiederholungen" / "10 reps" / "10 reps 80 kilo"
  {
    pattern: /(\d+)\s*(?:wiederholungen?|wdh|reps?)(?:\s+(?:mit\s+|at\s+|bei\s+)?(\d+(?:[.,]\d+)?)\s*(?:kilo|kg))?/i,
    command: (m) => ({
      type: 'log_set',
      reps: parseInt(m[1], 10),
      weightKg: m[2] ? parseFloat(m[2].replace(',', '.')) : undefined,
    }),
  },

  // Timer
  { pattern: /timer\s*(?:starten|start)/i, command: () => ({ type: 'start_timer' }) },
  { pattern: /(?:start|starte?)\s*(?:den\s+)?timer/i, command: () => ({ type: 'start_timer' }) },
  { pattern: /timer\s*(?:stoppen|stop)/i, command: () => ({ type: 'stop_timer' }) },
  { pattern: /(?:stop|stoppe?)\s*(?:den\s+)?timer/i, command: () => ({ type: 'stop_timer' }) },

  // Finish session
  { pattern: /(?:training\s*)?(?:beenden|abschlie[sß]en|fertig)/i, command: () => ({ type: 'finish_session' }) },
  { pattern: /(?:finish|done|end)\s*(?:workout|session|training)?/i, command: () => ({ type: 'finish_session' }) },

  // Rest phase
  { pattern: /^pause$/i, command: () => ({ type: 'rest_phase' }) },
  { pattern: /^rest$/i, command: () => ({ type: 'rest_phase' }) },
];

export function parseWorkoutCommand(transcript: string): WorkoutCommand {
  const trimmed = transcript.trim();
  if (!trimmed) return { type: 'unknown', transcript: '' };

  for (const { pattern, command } of COMMAND_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) return command(match);
  }

  return { type: 'unknown', transcript: trimmed };
}

// ---------------------------------------------------------------------------
// TTS Feedback
// ---------------------------------------------------------------------------

function speak(text: string, lang: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'de' ? 'de-DE' : 'en-US';
  utterance.rate = 1.1;
  utterance.volume = 0.7;
  window.speechSynthesis.speak(utterance);
}

const FEEDBACK: Record<string, Record<WorkoutCommand['type'], string>> = {
  de: {
    next_exercise: 'Nächste Übung',
    prev_exercise: 'Vorherige Übung',
    skip_exercise: 'Übung übersprungen',
    log_set: 'Satz gespeichert',
    toggle_timer: 'Timer umgeschaltet',
    start_timer: 'Timer gestartet',
    stop_timer: 'Timer gestoppt',
    finish_session: 'Training beendet',
    rest_phase: 'Pause',
    unknown: '',
  },
  en: {
    next_exercise: 'Next exercise',
    prev_exercise: 'Previous exercise',
    skip_exercise: 'Exercise skipped',
    log_set: 'Set logged',
    toggle_timer: 'Timer toggled',
    start_timer: 'Timer started',
    stop_timer: 'Timer stopped',
    finish_session: 'Workout finished',
    rest_phase: 'Rest',
    unknown: '',
  },
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWorkoutVoiceCommands(
  options: UseWorkoutVoiceCommandsOptions,
): UseWorkoutVoiceCommandsReturn {
  const { language, onCommand, onFeedback, enabled = true } = options;
  const lastCommandRef = useRef<WorkoutCommand | null>(null);

  const handleAutoSend = useCallback((transcript: string) => {
    if (!enabled) return;

    const command = parseWorkoutCommand(transcript);
    lastCommandRef.current = command;

    if (command.type !== 'unknown') {
      onCommand(command);
      // TTS feedback
      const msg = FEEDBACK[language]?.[command.type] ?? '';
      if (msg) {
        speak(msg, language);
        onFeedback?.(msg);
      }
    } else {
      // Fallback: show that the command was not recognized
      const fallbackMsg = language === 'de'
        ? `Nicht erkannt: "${transcript}"`
        : `Not recognized: "${transcript}"`;
      onFeedback?.(fallbackMsg);
    }
  }, [enabled, language, onCommand, onFeedback]);

  const {
    isSupported,
    isListening,
    transcript,
    error,
    toggleListening,
  } = useVoiceInput({
    language,
    silenceTimeout: 2000, // faster response for commands
    autoSend: true,
    onAutoSend: handleAutoSend,
  });

  return {
    isSupported,
    isListening,
    transcript,
    error,
    toggleListening,
    lastCommand: lastCommandRef.current,
  };
}
