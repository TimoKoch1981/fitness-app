/**
 * useVoiceInput — Web Speech API Hook for speech-to-text
 *
 * Wraps the browser-native SpeechRecognition API (Chrome/Edge).
 * Returns live transcript text that can be piped into the chat input field.
 *
 * Features:
 * - German (de-DE) and English (en-US) based on i18n setting
 * - Continuous mode with interim results (live text while speaking)
 * - Auto-restart on Chrome's ~60s timeout
 * - Auto-stop after configurable silence duration
 * - Error handling (permission denied, not supported, network)
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
 */

import { useState, useRef, useCallback, useEffect } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseVoiceInputOptions {
  /** i18n language key ('de' or 'en') */
  language: 'de' | 'en';
  /** Called whenever transcript updates (interim or final) */
  onTranscript?: (text: string, isFinal: boolean) => void;
  /** Called when an error occurs */
  onError?: (error: VoiceError) => void;
  /** Auto-stop after this many ms of silence. 0 = disabled. Default: 3000 */
  silenceTimeout?: number;
  /** Auto-send the final transcript when voice input stops (silence or manual). Default: false */
  autoSend?: boolean;
  /** Called when auto-send triggers. Receives the trimmed final transcript. */
  onAutoSend?: (text: string) => void;
}

export type VoiceError =
  | 'not-supported'
  | 'not-allowed'
  | 'no-speech'
  | 'network'
  | 'unknown';

export interface UseVoiceInputReturn {
  /** Whether the browser supports Speech Recognition */
  isSupported: boolean;
  /** Whether we are currently listening */
  isListening: boolean;
  /** Current transcript text (interim + final combined) */
  transcript: string;
  /** Last error that occurred (null if none) */
  error: VoiceError | null;
  /** Start listening */
  startListening: () => void;
  /** Stop listening */
  stopListening: () => void;
  /** Toggle listening on/off */
  toggleListening: () => void;
  /** Clear transcript and error */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Helper: Check browser support
// ---------------------------------------------------------------------------

function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVoiceInput(options: UseVoiceInputOptions): UseVoiceInputReturn {
  const {
    language,
    onTranscript,
    onError,
    silenceTimeout = 3000,
    autoSend = false,
    onAutoSend,
  } = options;

  // State
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<VoiceError | null>(null);

  // Refs (stable across renders)
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalTranscriptRef = useRef('');
  const autoSentRef = useRef(false); // Guard against double auto-send

  // Browser support check
  const isSupported = getSpeechRecognitionClass() !== null;

  // -------------------------------------------------------------------------
  // Clear silence timer
  // -------------------------------------------------------------------------

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Start silence timer (auto-stop after silence)
  // -------------------------------------------------------------------------

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    if (silenceTimeout <= 0) return;

    silenceTimerRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        recognitionRef.current?.stop();
        isListeningRef.current = false;
        setIsListening(false);

        // Auto-send transcript on silence timeout
        if (autoSend && finalTranscriptRef.current.trim() && !autoSentRef.current) {
          autoSentRef.current = true;
          onAutoSend?.(finalTranscriptRef.current.trim());
        }
      }
    }, silenceTimeout);
  }, [silenceTimeout, clearSilenceTimer, autoSend, onAutoSend]);

  // -------------------------------------------------------------------------
  // Stop listening
  // -------------------------------------------------------------------------

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    isListeningRef.current = false;
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Already stopped — ignore
      }
    }

    // Auto-send transcript on manual stop
    if (autoSend && finalTranscriptRef.current.trim() && !autoSentRef.current) {
      autoSentRef.current = true;
      onAutoSend?.(finalTranscriptRef.current.trim());
    }
  }, [clearSilenceTimer, autoSend, onAutoSend]);

  // -------------------------------------------------------------------------
  // Start listening
  // -------------------------------------------------------------------------

  const startListening = useCallback(async () => {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) {
      const err: VoiceError = 'not-supported';
      setError(err);
      onError?.(err);
      return;
    }

    // Request microphone permission FIRST via getUserMedia.
    // SpeechRecognition often fails silently without proper mic access.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Permission granted — release the stream immediately
      stream.getTracks().forEach(t => t.stop());
    } catch {
      const err: VoiceError = 'not-allowed';
      setError(err);
      onError?.(err);
      return;
    }

    // Reset state
    setError(null);
    finalTranscriptRef.current = '';
    setTranscript('');
    autoSentRef.current = false;

    // Create new instance (reuse can cause issues in Chrome)
    const recognition = new SpeechRecognitionClass();
    recognition.lang = language === 'de' ? 'de-DE' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // ----- onresult: Collect transcripts -----
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      clearSilenceTimer();

      let interimText = '';
      let finalText = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const chunk = result[0].transcript.trim();
          finalText += (finalText ? ' ' : '') + chunk;
          finalTranscriptRef.current = finalText;
        } else {
          interimText += result[0].transcript;
        }
      }

      const combined = finalText + (interimText ? (finalText ? ' ' : '') + interimText : '');
      setTranscript(combined);
      onTranscript?.(combined, interimText === '');

      // Restart silence timer after each result
      startSilenceTimer();
    };

    // ----- onerror: Handle errors -----
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let voiceError: VoiceError;

      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          voiceError = 'not-allowed';
          break;
        case 'no-speech':
          voiceError = 'no-speech';
          // no-speech is not fatal — just restart if still listening
          if (isListeningRef.current) {
            startSilenceTimer();
            return;
          }
          break;
        case 'network':
          voiceError = 'network';
          break;
        case 'aborted':
          // User or code called abort — not an error
          return;
        default:
          voiceError = 'unknown';
      }

      setError(voiceError);
      onError?.(voiceError);
      stopListening();
    };

    // ----- onend: Auto-restart if still listening -----
    recognition.onend = () => {
      // Chrome stops recognition after ~60s. Restart if user hasn't stopped.
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          // If restart fails, stop cleanly
          isListeningRef.current = false;
          setIsListening(false);
        }
      }
    };

    // Store ref and start
    recognitionRef.current = recognition;
    isListeningRef.current = true;
    setIsListening(true);

    try {
      recognition.start();
      startSilenceTimer();
    } catch {
      const err: VoiceError = 'unknown';
      setError(err);
      onError?.(err);
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [language, onTranscript, onError, clearSilenceTimer, startSilenceTimer, stopListening]);

  // -------------------------------------------------------------------------
  // Toggle
  // -------------------------------------------------------------------------

  const toggleListening = useCallback(async () => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      await startListening();
    }
  }, [startListening, stopListening]);

  // -------------------------------------------------------------------------
  // Reset
  // -------------------------------------------------------------------------

  const reset = useCallback(() => {
    stopListening();
    setTranscript('');
    setError(null);
    finalTranscriptRef.current = '';
  }, [stopListening]);

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        try {
          isListeningRef.current = false;
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, [clearSilenceTimer]);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
    reset,
  };
}
