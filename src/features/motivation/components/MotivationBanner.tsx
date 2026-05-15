/**
 * MotivationBanner — Dismissable re-engagement banner shown on the CockpitPage
 * when the user hasn't logged any activity for 3+ days.
 *
 * Features:
 * - Animated entrance (framer-motion slide-in from top)
 * - Three tiers of messaging (gentle, supportive, re-engagement)
 * - Action button navigating to training or nutrition
 * - Dismiss button (saved in localStorage, reappears next day)
 * - Teal/amber warm color scheme
 */

import { useNavigate } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../../../i18n';
import { useInactivityCheck } from '../hooks/useInactivityCheck';

// Studio: alle Tiers nutzen Surface mit Border-Left in Severity-Farbe.
// Statt 3 verschiedener Pastell-BGs eine konsistente Card-Sprache (Phase 7 §3).
const TIER_STYLES = {
  gentle: {
    bg: 'bg-theme-surface',
    border: 'border-theme-line border-l-[3px] border-l-theme-primary',
    icon: 'text-theme-primary',
    title: 'text-theme-ink',
    text: 'text-theme-ink-2',
    button: 'bg-theme-primary hover:bg-theme-primary-2 text-theme-primary-on',
    dismiss: 'text-theme-ink-3 hover:text-theme-ink-2',
  },
  supportive: {
    bg: 'bg-theme-surface',
    border: 'border-theme-line border-l-[3px] border-l-theme-warning',
    icon: 'text-theme-warning',
    title: 'text-theme-ink',
    text: 'text-theme-ink-2',
    button: 'bg-theme-warning hover:opacity-90 text-white',
    dismiss: 'text-theme-ink-3 hover:text-theme-ink-2',
  },
  reengagement: {
    bg: 'bg-theme-surface',
    border: 'border-theme-line border-l-[3px] border-l-theme-accent',
    icon: 'text-theme-accent',
    title: 'text-theme-ink',
    text: 'text-theme-ink-2',
    button: 'bg-theme-primary hover:bg-theme-primary-2 text-theme-primary-on',
    dismiss: 'text-theme-ink-3 hover:text-theme-ink-2',
  },
} as const;

export function MotivationBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    daysSinceLastActivity,
    isInactive,
    motivationMessage,
    tier,
    dismissMotivation,
    isDismissed,
    isLoading,
  } = useInactivityCheck();

  // Safely access motivation translations with fallback
  const mt = (t as unknown as Record<string, Record<string, string>>).motivation;

  if (isLoading || !isInactive || isDismissed || !motivationMessage || !tier || !mt) return null;

  const styles = TIER_STYLES[tier];
  const messageText = mt[motivationMessage.textKey] ?? '';
  const actionLabel = mt[motivationMessage.actionLabelKey] ?? mt.startTraining ?? '';
  const daysLabel = mt.daysInactive
    ? mt.daysInactive.replace('{days}', String(daysSinceLastActivity ?? 0))
    : `${daysSinceLastActivity} days`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`${styles.bg} border ${styles.border} rounded-theme-md p-4`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Sparkles className={`h-5 w-5 ${styles.icon}`} />
          </div>

          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${styles.title}`}>
              {daysLabel}
            </p>
            <p className={`text-xs ${styles.text} mt-1`}>
              {messageText}
            </p>

            {/* Action Button */}
            <button
              onClick={() => navigate(motivationMessage.actionRoute)}
              className={`mt-3 px-4 py-1.5 text-xs font-medium rounded-theme-md transition-colors ${styles.button}`}
            >
              {actionLabel}
            </button>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={dismissMotivation}
            className={`p-1 flex-shrink-0 ${styles.dismiss} transition-colors`}
            aria-label={t.common.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
