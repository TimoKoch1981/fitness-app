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

import { useRef, useCallback, useEffect, useMemo } from 'react';

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

  // Use useMemo to create a callable object with flush/cancel properties
  // (useCallback return values are immutable under React compiler rules)
  const debounced = useMemo(() => {
    const trigger = (() => {
      cancel();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        fnRef.current();
      }, delay);
    }) as DebouncedFn;
    trigger.flush = flush;
    trigger.cancel = cancel;
    return trigger;
  }, [delay, cancel, flush]);

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
