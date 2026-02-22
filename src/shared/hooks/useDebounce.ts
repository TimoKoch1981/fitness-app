/**
 * useDebounce — Debounced callback hook for auto-save patterns.
 *
 * Usage:
 *   const debouncedSave = useDebouncedCallback(saveFunction, 800);
 *   // Call debouncedSave() on every change — it fires after 800ms of inactivity.
 *
 * Features:
 * - Timer-based debounce with automatic cleanup
 * - Stable callback reference (no re-renders)
 * - Cleanup on unmount (prevents stale saves)
 * - Flush method to force immediate execution
 * - Cancel method to abort pending calls
 */

import { useRef, useCallback, useEffect } from 'react';

export interface DebouncedFn {
  (): void;
  /** Force immediate execution of pending call */
  flush: () => void;
  /** Cancel any pending call */
  cancel: () => void;
}

export function useDebouncedCallback(
  fn: () => void | Promise<void>,
  delay: number,
): DebouncedFn {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);

  // Always keep the latest fn reference
  fnRef.current = fn;

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current) {
      cancel();
      fnRef.current();
    }
  }, [cancel]);

  const debounced = useCallback(() => {
    cancel();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      fnRef.current();
    }, delay);
  }, [delay, cancel]) as DebouncedFn;

  debounced.flush = flush;
  debounced.cancel = cancel;

  // Cleanup on unmount — flush pending save
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        // Flush on unmount so data isn't lost
        fnRef.current();
      }
    };
  }, []);

  return debounced;
}
