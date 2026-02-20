import type { ReactNode } from 'react';
import { useNotificationScheduler } from '../hooks/useNotificationScheduler';

/**
 * Provider component that activates the notification scheduler.
 * Must be placed inside AuthProvider + BrowserRouter (needs user + navigate).
 */
export function NotificationSchedulerProvider({ children }: { children: ReactNode }) {
  useNotificationScheduler();
  return <>{children}</>;
}
