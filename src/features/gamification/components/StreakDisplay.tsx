/**
 * StreakDisplay — Compact horizontal streak widget.
 *
 * Shows fire emoji + current streak count + "Tage Streak" label.
 * Animates on mount via framer-motion scale.
 * Teal/emerald color scheme matching the app design system.
 */

import { motion } from 'framer-motion';
import { useTranslation } from '../../../i18n';
import { useStreaks } from '../hooks/useStreaks';

export function StreakDisplay() {
  const { t } = useTranslation();
  const { currentStreak, longestStreak, totalActiveDays, isLoading } = useStreaks();

  if (isLoading) {
    return (
      <div className="bg-theme-surface border border-theme-line rounded-theme-md p-4 animate-pulse">
        <div className="h-6 bg-theme-surface-2 rounded w-40" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="bg-theme-surface border border-theme-line border-l-[3px] border-l-theme-accent rounded-theme-md p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentStreak > 0 ? (
            <>
              <motion.span
                className="text-2xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}
              >
                {'\u{1F525}'}
              </motion.span>
              <div>
                <p className="text-lg font-bold text-theme-ink tabular-nums">
                  {currentStreak} {t.gamification.streakDays}
                </p>
                <p className="text-[10px] text-theme-ink-2">
                  {t.gamification.longestStreak}: {longestStreak} {t.gamification.days}
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="text-2xl opacity-50">{'\u{1F525}'}</span>
              <div>
                <p className="text-sm font-medium text-theme-ink-2">
                  {t.gamification.noStreak}
                </p>
                {longestStreak > 0 && (
                  <p className="text-[10px] text-theme-ink-3">
                    {t.gamification.longestStreak}: {longestStreak} {t.gamification.days}
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="text-right">
          <p className="text-xs text-theme-ink-2 font-medium tabular-nums">
            {totalActiveDays} {t.gamification.totalActiveDays}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
