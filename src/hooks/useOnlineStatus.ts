import { useState, useEffect, useCallback } from 'react';

/**
 * Hook that tracks the browser's online/offline status.
 *
 * Returns:
 * - isOnline: current navigator.onLine value
 * - wasOffline: true if the user was offline and came back online
 *   (resets when acknowledged via resetWasOffline)
 * - resetWasOffline: call to clear the wasOffline flag
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      // User came back online — set the flag for sync prompts
      setWasOffline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const resetWasOffline = useCallback(() => {
    setWasOffline(false);
  }, []);

  return { isOnline, wasOffline, resetWasOffline };
}
