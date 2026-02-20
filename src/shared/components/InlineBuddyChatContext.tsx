/**
 * InlineBuddyChatContext — Global context for the inline chat bottom-sheet.
 *
 * Allows any component to open/close the buddy chat overlay via
 * `openBuddyChat(autoMessage?)` without navigating away from the current page.
 *
 * When on /buddy, the overlay does NOT open (full-page chat is already active).
 * When navigating TO /buddy, the overlay auto-closes.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InlineBuddyChatContextType {
  /** Whether the inline chat sheet is currently visible */
  isOpen: boolean;
  /** Pre-filled message to send when the sheet opens */
  autoMessage: string | null;
  /** Open the inline chat sheet. On /buddy this is a no-op. */
  openBuddyChat: (autoMessage?: string) => void;
  /** Close the inline chat sheet */
  closeBuddyChat: () => void;
  /** Clear the autoMessage after it has been consumed */
  clearAutoMessage: () => void;
}

const InlineBuddyChatContext = createContext<InlineBuddyChatContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function InlineBuddyChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [autoMessage, setAutoMessage] = useState<string | null>(null);
  const location = useLocation();

  const openBuddyChat = useCallback((msg?: string) => {
    // Don't open overlay on /buddy — user is already in full-page chat
    if (location.pathname === '/buddy') return;
    setAutoMessage(msg ?? null);
    setIsOpen(true);
  }, [location.pathname]);

  const closeBuddyChat = useCallback(() => {
    setIsOpen(false);
    setAutoMessage(null);
  }, []);

  const clearAutoMessage = useCallback(() => {
    setAutoMessage(null);
  }, []);

  // Auto-close when navigating to /buddy
  useEffect(() => {
    if (location.pathname === '/buddy' && isOpen) {
      setIsOpen(false);
      setAutoMessage(null);
    }
  }, [location.pathname, isOpen]);

  return (
    <InlineBuddyChatContext.Provider
      value={{ isOpen, autoMessage, openBuddyChat, closeBuddyChat, clearAutoMessage }}
    >
      {children}
    </InlineBuddyChatContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useInlineBuddyChat(): InlineBuddyChatContextType {
  const ctx = useContext(InlineBuddyChatContext);
  if (!ctx) {
    throw new Error('useInlineBuddyChat must be used within InlineBuddyChatProvider');
  }
  return ctx;
}
