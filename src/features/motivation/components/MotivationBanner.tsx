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

const TIER_STYLES = {
  gentle: {
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    icon: 'text-teal-500',
    title: 'text-teal-800',
    text: 'text-teal-600',
    button: 'bg-teal-500 hover:bg-teal-600',
    dismiss: 'text-teal-400 hover:text-teal-600',
  },
  supportive: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500',
    title: 'text-amber-800',
    text: 'text-amber-600',
    button: 'bg-amber-500 hover:bg-amber-600',
    dismiss: 'text-amber-400 hover:text-amber-600',
  },
  reengagement: {
    bg: 'bg-gradient-to-r from-teal-50 to-amber-50',
    border: 'border-teal-200',
    icon: 'text-teal-500',
    title: 'text-teal-800',
    text: 'text-teal-700',
    button: 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600',
    dismiss: 'text-teal-400 hover:text-teal-600',
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
        className={`${styles.bg} border ${styles.border} rounded-xl p-4 shadow-sm`}
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
              className={`mt-3 px-4 py-1.5 text-xs font-medium text-white rounded-lg transition-colors ${styles.button}`}
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
