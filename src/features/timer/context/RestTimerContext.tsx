/**
 * RestTimerContext — Provides rest timer state globally.
 * The timer persists across page navigations and shows a floating bubble.
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useRestTimer } from '../hooks/useRestTimer';

type RestTimerContextType = ReturnType<typeof useRestTimer>;

const RestTimerContext = createContext<RestTimerContextType | null>(null);

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const timer = useRestTimer();
  return (
    <RestTimerContext.Provider value={timer}>
      {children}
    </RestTimerContext.Provider>
  );
}

export function useRestTimerContext(): RestTimerContextType {
  const ctx = useContext(RestTimerContext);
  if (!ctx) {
    throw new Error('useRestTimerContext must be used within RestTimerProvider');
  }
  return ctx;
}
