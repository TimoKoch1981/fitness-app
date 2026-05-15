/**
 * FloatingBuddyAvatar — Always-visible floating action button (FAB) for the KI Buddy.
 *
 * "KI first" — the AI buddy should always be one tap away.
 * Clicking opens the InlineBuddyChat bottom-sheet overlay.
 *
 * Hidden on:
 *  - /buddy (full-page chat already visible)
 *  - Public pages (login, register, landing, impressum, datenschutz, etc.)
 *  - When the InlineBuddyChat is already open
 */

import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { useInlineBuddyChat } from './InlineBuddyChatContext';
import { useAuth } from '../../app/providers/AuthProvider';
import { useTranslation } from '../../i18n';
import type { AgentType } from '../../lib/ai/agents/types';

// Routes where the FAB should NOT appear
const HIDDEN_ROUTES = new Set([
  '/buddy',
  '/login',
  '/register',
  '/landing',
  '/impressum',
  '/datenschutz',
  '/onboarding',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
]);

/** Returns true if the current path should hide the FAB */
function shouldHide(pathname: string): boolean {
  if (HIDDEN_ROUTES.has(pathname)) return true;
  // /join/:code — any path starting with /join
  if (pathname.startsWith('/join')) return true;
  return false;
}

/** Map current page path to the correct default agent */
function getAgentForPage(pathname: string): AgentType {
  if (pathname.startsWith('/nutrition') || pathname.startsWith('/ernaehrung')) return 'nutrition';
  if (pathname.startsWith('/training') || pathname.startsWith('/workout')) return 'training';
  if (pathname.startsWith('/medical') || pathname.startsWith('/medizin')) return 'medical';
  if (pathname.startsWith('/cockpit') || pathname === '/') return 'general';
  if (pathname.startsWith('/profile') || pathname.startsWith('/profil')) return 'general';
  if (pathname.startsWith('/social')) return 'general';
  return 'general';
}

export function FloatingBuddyAvatar() {
  const { user, loading } = useAuth();
  const { isOpen, openBuddyChat } = useInlineBuddyChat();
  const location = useLocation();
  const { t } = useTranslation();

  // Don't render for unauthenticated users or while loading
  if (loading || !user) return null;

  // Don't render on hidden routes
  if (shouldHide(location.pathname)) return null;

  // Don't render when the inline chat is already open
  if (isOpen) return null;

  // v14.28 Stufe 2b: 3D-Render-Buddy ist visueller Bruch im flachen Studio-
  // Layout (Phase 8 §1.1 Lina, §3 Persona-Reviews). Reframe als Mono-
  // Sprechblase mit Studio-Surface — der 3D-Avatar lebt ab jetzt nur noch
  // auf der Buddy-Vollchat-Page und in den Buddy-Settings.
  return (
    <AnimatePresence>
      <motion.button
        key="floating-buddy-avatar"
        type="button"
        onClick={() => openBuddyChat(undefined, getAgentForPage(location.pathname))}
        data-tour-buddy
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-20 right-4 z-[51] w-14 h-14 rounded-full shadow-md flex items-center justify-center bg-theme-surface border border-theme-line text-theme-primary hover:bg-theme-surface-2 hover:border-theme-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2 active:scale-95 transition-colors"
        aria-label={t.buddy.floatingHint}
        title={t.buddy.floatingHint}
      >
        <MessageSquare className="h-6 w-6" strokeWidth={1.5} />
      </motion.button>
    </AnimatePresence>
  );
}
