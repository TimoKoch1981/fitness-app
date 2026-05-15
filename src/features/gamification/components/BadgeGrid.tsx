/**
 * BadgeGrid — 3-column grid of earned/locked badges.
 *
 * Earned badges show full color with icon and earned date.
 * Locked badges are grayed out with a lock overlay.
 * Clicking an earned badge triggers a scale pop animation.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useBadges } from '../hooks/useBadges';
import type { Badge } from '../types';

function BadgeCard({ badge }: { badge: Badge }) {
  const { t } = useTranslation();
  const [popped, setPopped] = useState(false);

  // Resolve i18n key: split "gamification.badge_first_day" → t.gamification.badge_first_day
  const resolveName = (key: string): string => {
    const parts = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = t;
    for (const part of parts) {
      val = val?.[part];
    }
    return typeof val === 'string' ? val : key;
  };

  const name = resolveName(badge.nameKey);
  const description = resolveName(badge.descriptionKey);

  const handleClick = () => {
    if (badge.earned) {
      setPopped(true);
      setTimeout(() => setPopped(false), 300);
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      animate={popped ? { scale: [1, 1.15, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={`relative flex flex-col items-center p-3 rounded-theme-md text-center transition-colors ${
        badge.earned
          ? 'bg-theme-surface border border-theme-line hover:border-theme-primary cursor-pointer'
          : 'bg-theme-surface-2 border border-theme-line cursor-default'
      }`}
    >
      {/* Icon */}
      <span className={`text-2xl ${badge.earned ? '' : 'opacity-20 grayscale'}`}>
        {badge.icon}
      </span>

      {/* Lock overlay for unearned */}
      {!badge.earned && (
        <div className="absolute top-2 right-2">
          <Lock className="h-3 w-3 text-theme-ink-3" strokeWidth={1.5} />
        </div>
      )}

      {/* Name */}
      <p className={`text-[10px] font-medium mt-1.5 leading-tight ${
        badge.earned ? 'text-theme-ink' : 'text-theme-ink-3'
      }`}>
        {name}
      </p>

      {/* Description */}
      <p className={`text-[9px] mt-0.5 leading-tight ${
        badge.earned ? 'text-theme-primary' : 'text-theme-ink-3'
      }`}>
        {description}
      </p>
    </motion.button>
  );
}

export function BadgeGrid() {
  const { t } = useTranslation();
  const { badges, earnedCount, totalBadges, isLoading } = useBadges();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-4 bg-theme-surface-2 rounded w-32 animate-pulse" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-theme-surface-2 rounded-theme-md animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-theme-ink-2 uppercase tracking-[0.12em] px-1">
          {t.gamification.badges}
        </p>
        <p className="text-[10px] text-theme-primary font-medium tabular-nums">
          {earnedCount}/{totalBadges} {t.gamification.badgesEarned}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <AnimatePresence>
          {badges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
