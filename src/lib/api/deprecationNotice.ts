/**
 * React hook for API deprecation notices.
 *
 * Shows a dismissable banner when the API returns deprecation warnings.
 * Dismissed notices are persisted in localStorage.
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'fitbuddy_dismissed_deprecations';

interface DeprecationState {
  /** Whether a deprecation notice is currently active. */
  hasNotice: boolean;
  /** The deprecation message to display. */
  message: string | null;
  /** Dismiss the current notice (persisted). */
  dismiss: () => void;
  /** Report a new deprecation notice from an API response. */
  report: (message: string) => void;
}

/**
 * Hook to manage API deprecation notices.
 *
 * @example
 * const { hasNotice, message, dismiss, report } = useDeprecationNotice();
 */
export function useDeprecationNotice(): DeprecationState {
  const [message, setMessage] = useState<string | null>(null);

  // Load dismissed notices from localStorage
  const getDismissed = useCallback((): Set<string> => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  }, []);

  const dismiss = useCallback(() => {
    if (message) {
      const dismissed = getDismissed();
      dismissed.add(message);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed]));
      } catch {
        // localStorage full — ignore
      }
    }
    setMessage(null);
  }, [message, getDismissed]);

  const report = useCallback(
    (msg: string) => {
      const dismissed = getDismissed();
      if (!dismissed.has(msg)) {
        setMessage(msg);
      }
    },
    [getDismissed],
  );

  // Clear stale dismissals on mount (keep last 10)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as string[];
        if (arr.length > 10) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(-10)));
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  return {
    hasNotice: message !== null,
    message,
    dismiss,
    report,
  };
}
