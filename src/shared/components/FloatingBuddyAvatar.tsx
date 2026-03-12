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
import { useInlineBuddyChat } from './InlineBuddyChatContext';
import { useAuth } from '../../app/providers/AuthProvider';
import { useTranslation } from '../../i18n';
import { BuddyAvatar, BUDDY_VARIANTS } from './BuddyAvatar';
import { useProfile } from '../../features/auth/hooks/useProfile';

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

export function FloatingBuddyAvatar() {
  const { user, loading } = useAuth();
  const { isOpen, openBuddyChat } = useInlineBuddyChat();
  const location = useLocation();
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const buddyStyle = profile?.buddy_avatar_style ?? 'coach';
  const variantConfig = BUDDY_VARIANTS[buddyStyle];

  // Don't render for unauthenticated users or while loading
  if (loading || !user) return null;

  // Don't render on hidden routes
  if (shouldHide(location.pathname)) return null;

  // Don't render when the inline chat is already open
  if (isOpen) return null;

  return (
    <AnimatePresence>
      <motion.button
        key="floating-buddy-avatar"
        type="button"
        onClick={() => openBuddyChat()}
        data-tour-buddy
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={`fixed bottom-20 right-4 z-[51] w-14 h-14 rounded-full shadow-lg flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:${variantConfig.ring} focus-visible:ring-offset-2 active:scale-95 transition-transform`}
        aria-label={t.buddy.floatingHint}
        title={t.buddy.floatingHint}
      >
        {/* Pulse ring — draws attention */}
        <span className={`absolute inset-0 rounded-full ${variantConfig.pingColor} opacity-75 animate-ping`} />

        {/* Inner circle with avatar */}
        <BuddyAvatar size="fab" variant={buddyStyle} useVideo />
      </motion.button>
    </AnimatePresence>
  );
}
