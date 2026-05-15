/**
 * WeeklyChallengeCard — Shows one active weekly challenge with progress.
 *
 * The challenge type rotates based on the ISO week number:
 * - Even weeks: workout-focused challenge
 * - Odd weeks: nutrition-focused challenge
 *
 * Refreshes automatically each Monday (based on week calculation).
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useWeeklyActivity } from '../hooks/useStreaks';
import type { WeeklyChallenge } from '../types';

/** Returns the ISO week number for a given date. */
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/** Challenge templates that rotate by week. */
interface ChallengeTemplate {
  titleKey: string;
  type: WeeklyChallenge['type'];
  target: number;
  getter: (activity: ReturnType<typeof useWeeklyActivity>) => number;
}

const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    titleKey: 'gamification.challenge_workouts_5',
    type: 'workouts',
    target: 5,
    getter: (a) => a.workoutDays,
  },
  {
    titleKey: 'gamification.challenge_meals_7',
    type: 'meals',
    target: 7,
    getter: (a) => a.mealDays,
  },
  {
    titleKey: 'gamification.challenge_active_6',
    type: 'any',
    target: 6,
    getter: (a) => a.anyDays,
  },
  {
    titleKey: 'gamification.challenge_body_3',
    type: 'body',
    target: 3,
    getter: (a) => a.bodyDays,
  },
];

export function WeeklyChallengeCard() {
  const { t } = useTranslation();
  const weeklyActivity = useWeeklyActivity();

  const challenge = useMemo((): WeeklyChallenge | null => {
    const week = getISOWeekNumber(new Date());
    const templateIndex = week % CHALLENGE_TEMPLATES.length;
    const template = CHALLENGE_TEMPLATES[templateIndex];

    const current = template.getter(weeklyActivity);

    return {
      titleKey: template.titleKey,
      type: template.type,
      target: template.target,
      current: Math.min(current, template.target),
      completed: current >= template.target,
    };
  }, [weeklyActivity]);

  if (weeklyActivity.isLoading || !challenge) {
    return (
      <div className="bg-theme-surface border border-theme-line rounded-theme-md p-4 animate-pulse">
        <div className="h-4 bg-theme-surface-2 rounded w-48 mb-2" />
        <div className="h-2 bg-theme-surface-2 rounded w-full" />
      </div>
    );
  }

  // Resolve i18n key dynamically
  const resolveName = (key: string): string => {
    const parts = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = t;
    for (const part of parts) {
      val = val?.[part];
    }
    return typeof val === 'string' ? val : key;
  };

  const title = resolveName(challenge.titleKey);
  const pct = Math.min(100, Math.round((challenge.current / challenge.target) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`rounded-theme-md p-4 border ${
        challenge.completed
          ? 'bg-theme-surface border-theme-line border-l-[3px] border-l-theme-success'
          : 'bg-theme-surface border-theme-line'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Trophy className={`h-4 w-4 ${challenge.completed ? 'text-theme-success' : 'text-theme-ink-3'}`} strokeWidth={1.5} />
          <p className="text-[11px] font-semibold text-theme-ink-2 uppercase tracking-[0.08em]">
            {t.gamification.weeklyChallenge}
          </p>
        </div>
        {challenge.completed && (
          <span className="text-[10px] font-medium text-theme-success bg-theme-surface-2 border border-theme-line px-2 py-0.5 rounded-theme-sm">
            {'\u{2705}'} {t.gamification.challengeComplete}
          </span>
        )}
      </div>

      <p className={`text-sm font-semibold ${challenge.completed ? 'text-theme-ink' : 'text-theme-ink'}`}>
        {title}
      </p>

      <div className="mt-2">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-theme-ink-2">
            {t.gamification.challengeProgress}
          </span>
          <span className="font-medium text-theme-ink tabular-nums">
            {challenge.current}/{challenge.target}
          </span>
        </div>
        <div className="bg-theme-surface-2 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-2 rounded-full ${
              challenge.completed ? 'bg-theme-success' : 'bg-theme-primary'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
}
