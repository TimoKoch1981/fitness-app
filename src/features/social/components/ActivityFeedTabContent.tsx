/**
 * ActivityFeedTabContent — Friends' activity timeline.
 */

import {
  Dumbbell, Trophy, Award, Flame, Target, UtensilsCrossed,
  Loader2, Activity, Clock,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { cn } from '../../../lib/utils';
import { useActivityFeed } from '../hooks/useActivityFeed';
import type { ActivityFeedItem, ActivityType } from '../types';

// ── Activity Type Config ────────────────────────────────────────────

const ACTIVITY_CONFIG: Record<ActivityType, {
  icon: typeof Dumbbell;
  colorClass: string;
  bgClass: string;
}> = {
  workout_completed: { icon: Dumbbell, colorClass: 'text-teal-600', bgClass: 'bg-teal-100' },
  goal_achieved: { icon: Target, colorClass: 'text-green-600', bgClass: 'bg-green-100' },
  badge_earned: { icon: Award, colorClass: 'text-amber-600', bgClass: 'bg-amber-100' },
  challenge_joined: { icon: Trophy, colorClass: 'text-blue-600', bgClass: 'bg-blue-100' },
  challenge_completed: { icon: Trophy, colorClass: 'text-purple-600', bgClass: 'bg-purple-100' },
  streak_milestone: { icon: Flame, colorClass: 'text-orange-600', bgClass: 'bg-orange-100' },
  body_goal_reached: { icon: Target, colorClass: 'text-pink-600', bgClass: 'bg-pink-100' },
  recipe_shared: { icon: UtensilsCrossed, colorClass: 'text-emerald-600', bgClass: 'bg-emerald-100' },
};

// ── Time Ago ────────────────────────────────────────────────────────

function timeAgo(dateStr: string, isDE: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return isDE ? 'Gerade eben' : 'Just now';
  if (mins < 60) return isDE ? `vor ${mins} Min.` : `${mins}m ago`;
  if (hours < 24) return isDE ? `vor ${hours} Std.` : `${hours}h ago`;
  if (days < 7) return isDE ? `vor ${days} Tagen` : `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(isDE ? 'de-DE' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// ── Activity Card ───────────────────────────────────────────────────

function ActivityCard({ item }: { item: ActivityFeedItem }) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const cfg = ACTIVITY_CONFIG[item.activity_type] ?? ACTIVITY_CONFIG.workout_completed;
  const Icon = cfg.icon;

  return (
    <div className="flex gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
      {/* Icon */}
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bgClass, cfg.colorClass)}>
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {/* Avatar */}
          {item.profile?.avatar_url ? (
            <img
              src={item.profile.avatar_url}
              alt=""
              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500 flex-shrink-0">
              {(item.profile?.display_name ?? '?').slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-semibold text-gray-700 truncate">
            {item.profile?.display_name ?? (isDE ? 'Unbekannt' : 'Unknown')}
          </span>
          <span className="text-[10px] text-gray-300 flex-shrink-0">•</span>
          <span className="text-[10px] text-gray-400 flex-shrink-0 flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {timeAgo(item.created_at, isDE)}
          </span>
        </div>

        <p className="text-sm text-gray-800 mt-0.5">{item.title}</p>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
        )}

        {/* Data badges */}
        {item.data && Object.keys(item.data).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {Object.entries(item.data).slice(0, 4).map(([key, value]) => (
              <span key={key} className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded-md">
                {key}: {String(value)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────

export function ActivityFeedTabContent() {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { data: feed, isLoading } = useActivityFeed();

  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      ) : feed && feed.length > 0 ? (
        feed.map((item: ActivityFeedItem) => (
          <ActivityCard key={item.id} item={item} />
        ))
      ) : (
        <div className="text-center py-8 space-y-2">
          <Activity className="h-10 w-10 text-gray-200 mx-auto" />
          <p className="text-sm text-gray-400">
            {isDE
              ? 'Noch keine Aktivitäten. Füge Freunde hinzu, um deren Fortschritte zu sehen!'
              : 'No activities yet. Add friends to see their progress!'}
          </p>
        </div>
      )}
    </div>
  );
}
