import { useState, useEffect, useCallback } from 'react';

/**
 * Custom events dispatched by the SW registration in main.tsx.
 * This decouples the virtual:pwa-register import (which only works
 * in the Vite build pipeline) from the React hook layer.
 */
const SW_NEED_REFRESH = 'sw:need-refresh';
const SW_OFFLINE_READY = 'sw:offline-ready';
const SW_UPDATE = 'sw:update';

/**
 * Hook that manages Service Worker registration state and update prompts.
 *
 * The actual SW registration happens in main.tsx via registerSW().
 * This hook listens for custom events dispatched by that registration code
 * and provides a clean React interface.
 *
 * Returns:
 * - needRefresh: true when a new SW version is waiting to activate
 * - offlineReady: true when the app has been cached for offline use
 * - updateServiceWorker: call to activate the waiting SW
 * - close: dismiss the prompt
 */
export function useServiceWorker() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    function handleNeedRefresh() {
      setNeedRefresh(true);
    }

    function handleOfflineReady() {
      setOfflineReady(true);
    }

    window.addEventListener(SW_NEED_REFRESH, handleNeedRefresh);
    window.addEventListener(SW_OFFLINE_READY, handleOfflineReady);

    return () => {
      window.removeEventListener(SW_NEED_REFRESH, handleNeedRefresh);
      window.removeEventListener(SW_OFFLINE_READY, handleOfflineReady);
    };
  }, []);

  const updateServiceWorker = useCallback(() => {
    window.dispatchEvent(new Event(SW_UPDATE));
  }, []);

  const close = useCallback(() => {
    setNeedRefresh(false);
    setOfflineReady(false);
  }, []);

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker,
    close,
  };
}
