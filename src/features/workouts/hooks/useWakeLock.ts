/**
 * useWakeLock — Prevents the screen from dimming during an active workout.
 *
 * Uses the Screen Wake Lock API (Navigator.wakeLock).
 * Gracefully degrades on unsupported browsers (no-op).
 * Automatically re-acquires on visibility change (tab switch back).
 * Releases on unmount.
 */

import { useEffect, useRef, useCallback } from 'react';

export function useWakeLock(enabled = true) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const acquire = useCallback(async () => {
    if (!enabled) return;
    if (!('wakeLock' in navigator)) return;

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
    } catch {
      // Failed to acquire — browser denied or unsupported context
    }
  }, [enabled]);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // Already released
      }
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      release();
      return;
    }

    acquire();

    // Re-acquire when tab becomes visible again (wake lock auto-releases on hidden)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && enabled) {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      release();
    };
  }, [enabled, acquire, release]);
}
