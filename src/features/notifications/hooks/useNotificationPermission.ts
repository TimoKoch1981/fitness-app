import { useState, useCallback, useEffect } from 'react';
import {
  getPermissionState,
  requestPermission,
  isSupported,
  type PermissionState,
} from '../lib/notificationBridge';

/**
 * Hook to manage notification permission state.
 *
 * Returns:
 * - permission: current state ('granted' | 'denied' | 'prompt' | 'unsupported')
 * - supported: whether notifications are available on this platform
 * - request: function to request permission (shows browser/OS prompt)
 */
export function useNotificationPermission() {
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const supported = isSupported();

  useEffect(() => {
    if (!supported) {
      setPermission('unsupported');
      return;
    }
    getPermissionState().then(setPermission);
  }, [supported]);

  const request = useCallback(async (): Promise<PermissionState> => {
    if (!supported) return 'unsupported';
    const result = await requestPermission();
    setPermission(result);
    return result;
  }, [supported]);

  return { permission, supported, request };
}
