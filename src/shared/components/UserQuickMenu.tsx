import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../app/providers/AuthProvider';
import { useProfile } from '../../features/auth/hooks/useProfile';
import { useTranslation } from '../../i18n';

/**
 * Compact user avatar + dropdown quick menu.
 * Rendered in the PageShell header (top-right).
 * Provides quick access to profile, settings, and logout.
 */
export function UserQuickMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { t } = useTranslation();

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  const handleNavigate = useCallback(
    (path: string) => {
      setOpen(false);
      navigate(path);
    },
    [navigate],
  );

  const handleLogout = useCallback(async () => {
    const confirmed = window.confirm(t.quickMenu.logoutConfirm);
    if (!confirmed) return;
    setOpen(false);
    await signOut();
  }, [signOut, t]);

  if (!user) return null;

  // Build initials from display_name or email
  const displayName = profile?.display_name || '';
  const email = user.email || '';
  const initials = displayName
    ? displayName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : email.charAt(0).toUpperCase();

  const avatarUrl = profile?.avatar_url;

  return (
    <div ref={menuRef} className="relative">
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold text-xs ring-2 ring-white shadow-sm overflow-hidden focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all hover:ring-teal-300"
        aria-label={t.quickMenu.profile}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName || email}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200/60 z-50 overflow-hidden"
            role="menu"
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-gray-100">
              {displayName && (
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {displayName}
                </p>
              )}
              <p className="text-xs text-gray-500 truncate">{email}</p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <button
                onClick={() => handleNavigate('/profile')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 transition-colors"
                role="menuitem"
              >
                <User className="w-4 h-4 text-teal-600" />
                {t.quickMenu.profile}
              </button>

              <button
                onClick={() => handleNavigate('/profile')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-teal-50 transition-colors"
                role="menuitem"
              >
                <Settings className="w-4 h-4 text-teal-600" />
                {t.quickMenu.settings}
              </button>
            </div>

            {/* Divider + Logout */}
            <div className="border-t border-gray-100 py-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                role="menuitem"
              >
                <LogOut className="w-4 h-4" />
                {t.quickMenu.logout}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
