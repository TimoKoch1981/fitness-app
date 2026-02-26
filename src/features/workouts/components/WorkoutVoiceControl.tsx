/**
 * WorkoutVoiceControl — Floating mic button for hands-free workout control.
 *
 * Shows a mic button that listens for voice commands during active workouts.
 * Displays live transcript and command feedback with TTS confirmation.
 */

import { useState, useCallback } from 'react';
import { Mic, MicOff, X } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useActiveWorkout } from '../context/ActiveWorkoutContext';
import { useWorkoutVoiceCommands } from '../hooks/useWorkoutVoiceCommands';
import type { WorkoutCommand } from '../hooks/useWorkoutVoiceCommands';
import { cn } from '../../../lib/utils';

interface WorkoutVoiceControlProps {
  className?: string;
}

export function WorkoutVoiceControl({ className }: WorkoutVoiceControlProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const {
    state,
    logSet,
    nextExercise,
    prevExercise,
    skipExercise,
    toggleTimer,
    finishSession,
  } = useActiveWorkout();

  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTimeout, setFeedbackTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = useCallback((msg: string) => {
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    setFeedback(msg);
    const timeout = setTimeout(() => setFeedback(null), 3000);
    setFeedbackTimeout(timeout);
  }, [feedbackTimeout]);

  const handleCommand = useCallback((command: WorkoutCommand) => {
    switch (command.type) {
      case 'next_exercise':
        nextExercise();
        break;
      case 'prev_exercise':
        prevExercise();
        break;
      case 'skip_exercise':
        skipExercise(state.currentExerciseIndex);
        break;
      case 'log_set': {
        const exercise = state.exercises[state.currentExerciseIndex];
        if (!exercise) break;
        const nextSetIdx = exercise.sets.findIndex(s => !s.completed && !s.skipped);
        if (nextSetIdx >= 0) {
          logSet(state.currentExerciseIndex, nextSetIdx, command.reps, command.weightKg);
        }
        break;
      }
      case 'start_timer':
      case 'stop_timer':
      case 'toggle_timer':
        toggleTimer();
        break;
      case 'finish_session':
        finishSession();
        break;
      case 'rest_phase':
        // Rest phase is handled automatically by the timer
        break;
      case 'unknown':
        break;
    }
  }, [state, logSet, nextExercise, prevExercise, skipExercise, toggleTimer, finishSession]);

  const {
    isSupported,
    isListening,
    transcript,
    error,
    toggleListening,
  } = useWorkoutVoiceCommands({
    language: language as 'de' | 'en',
    onCommand: handleCommand,
    onFeedback: showFeedback,
    enabled: state.isActive,
  });

  if (!isSupported) return null;

  return (
    <div className={cn('flex flex-col items-end gap-2', className)}>
      {/* Feedback toast */}
      {feedback && (
        <div className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2 max-w-[200px] text-center">
          {feedback}
        </div>
      )}

      {/* Live transcript */}
      {isListening && transcript && (
        <div className="bg-gray-900/90 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-[220px]">
          <p className="text-gray-400 text-[10px] mb-0.5">
            {isDE ? 'Erkannt:' : 'Heard:'}
          </p>
          <p className="text-white">{transcript}</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-900/90 text-red-200 text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
          <span>{error === 'not-allowed'
            ? (isDE ? 'Mikrofon blockiert' : 'Mic blocked')
            : (isDE ? 'Sprachfehler' : 'Voice error')
          }</span>
          <button onClick={toggleListening} className="p-0.5">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Mic button */}
      <button
        onClick={toggleListening}
        className={cn(
          'p-3 rounded-full shadow-lg transition-all',
          isListening
            ? 'bg-red-500 text-white animate-pulse shadow-red-500/30'
            : 'bg-gray-800 text-white hover:bg-gray-700',
        )}
        title={isListening
          ? (isDE ? 'Sprachsteuerung stoppen' : 'Stop voice control')
          : (isDE ? 'Sprachsteuerung starten' : 'Start voice control')
        }
      >
        {isListening ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
      </button>
    </div>
  );
}
