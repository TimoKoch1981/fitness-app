/**
 * CelebrationProvider — Wraps the app with celebration overlay.
 * Provides celebration context to child components.
 */
import { createContext, useContext } from 'react';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { useCelebration } from './hooks/useCelebration';
import { useTranslation } from '../../i18n';

type CelebrationContextType = ReturnType<typeof useCelebration>;

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const celebration = useCelebration();
  const { language } = useTranslation();

  return (
    <CelebrationContext.Provider value={celebration}>
      {children}
      <CelebrationOverlay
        event={celebration.currentEvent}
        language={language}
        onDismiss={celebration.dismiss}
      />
    </CelebrationContext.Provider>
  );
}

export function useCelebrations(): CelebrationContextType {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error('useCelebrations must be used within CelebrationProvider');
  return ctx;
}
