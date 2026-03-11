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
import type { AgentType } from '../../lib/ai/agents/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InlineBuddyChatContextType {
  /** Whether the inline chat sheet is currently visible */
  isOpen: boolean;
  /** Pre-filled message to send when the sheet opens */
  autoMessage: string | null;
  /** Target agent to switch to when the sheet opens */
  targetAgent: AgentType | null;
  /** Whether the buddy is docked next to the PlanWizard (side-by-side) */
  isDocked: boolean;
  /** Open the inline chat sheet. On /buddy this is a no-op. */
  openBuddyChat: (autoMessage?: string, targetAgent?: AgentType) => void;
  /** Close the inline chat sheet */
  closeBuddyChat: () => void;
  /** Clear the autoMessage after it has been consumed */
  clearAutoMessage: () => void;
  /** Toggle docked mode (side-by-side with PlanWizard) */
  setDocked: (docked: boolean) => void;
  /** Optional interceptor for save_training_plan actions (set by PlanWizard) */
  wizardActionInterceptor: ((actionData: unknown) => boolean) | null;
  /** Register/unregister the wizard action interceptor */
  setWizardActionInterceptor: (interceptor: ((actionData: unknown) => boolean) | null) => void;
}

const InlineBuddyChatContext = createContext<InlineBuddyChatContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function InlineBuddyChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [autoMessage, setAutoMessage] = useState<string | null>(null);
  const [targetAgent, setTargetAgent] = useState<AgentType | null>(null);
  const [isDocked, setIsDocked] = useState(false);
  const [wizardActionInterceptor, setWizardInterceptorState] = useState<((actionData: unknown) => boolean) | null>(null);
  const location = useLocation();

  const openBuddyChat = useCallback((msg?: string, agent?: AgentType) => {
    // Don't open overlay on /buddy — user is already in full-page chat
    if (location.pathname === '/buddy') return;
    setAutoMessage(msg ?? null);
    setTargetAgent(agent ?? null);
    setIsOpen(true);
  }, [location.pathname]);

  const closeBuddyChat = useCallback(() => {
    setIsOpen(false);
    setAutoMessage(null);
    setTargetAgent(null);
    setIsDocked(false);
    setWizardInterceptorState(null);
  }, []);

  const clearAutoMessage = useCallback(() => {
    setAutoMessage(null);
  }, []);

  const setDocked = useCallback((docked: boolean) => {
    setIsDocked(docked);
  }, []);

  const setWizardActionInterceptor = useCallback((interceptor: ((actionData: unknown) => boolean) | null) => {
    setWizardInterceptorState(() => interceptor);
  }, []);

  // Auto-close when navigating to /buddy
  useEffect(() => {
    if (location.pathname === '/buddy' && isOpen) {
      setIsOpen(false);
      setAutoMessage(null);
      setTargetAgent(null);
      setIsDocked(false);
    }
  }, [location.pathname, isOpen]);

  return (
    <InlineBuddyChatContext.Provider
      value={{ isOpen, autoMessage, targetAgent, isDocked, openBuddyChat, closeBuddyChat, clearAutoMessage, setDocked, wizardActionInterceptor, setWizardActionInterceptor }}
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
