/**
 * LeadingMetricCard — the ONE dominant number on the cockpit (v14.15 / P1-1).
 *
 * IST-Analyse §3.D (UX-Audit) finding: the cockpit shows 8–10 chips of equal
 * weight, no hierarchy. User has to *interpret* instead of *see*. Hevy and
 * MacroFactor both surface one dominant metric — that's what makes them feel
 * answerable at a glance.
 *
 * Our dominant metric depends on the phase:
 *   - Cut         → calorie deficit (consumed - tdee); negative is the goal
 *   - Bulk        → calories remaining to surplus target
 *   - Maintenance → calories remaining to maintenance goal
 *   - Peak Week / Reverse Diet → calories remaining (no special framing)
 *
 * Secondary numbers (protein remaining, % of goal) live below the hero
 * number — visible but quieter. The 2×2 macro grid still exists in the
 * page below for users who want detail.
 */

import { Flame, TrendingDown, TrendingUp, Target } from 'lucide-react';
import type { UserProfile, TrainingPhase } from '../../../types/health';
import { useTranslation } from '../../../i18n';

interface LeadingMetricCardProps {
  caloriesConsumed: number;
  caloriesGoal: number;
  proteinConsumed: number;
  proteinGoal: number;
  caloriesBurned: number;
  tdee: number | null;
  profile: UserProfile | null | undefined;
  profileComplete: boolean;
}

interface MetricView {
  /** Big number rendered as the hero */
  primaryValue: number;
  /** Optional sign forced when value already is signed (e.g. deficit) */
  primarySign?: '+' | '−' | '';
  /** Label above the hero number */
  primaryLabel: string;
  /** Short context line under the hero (e.g. "Bulk-Ziel: +500/Tag") */
  contextLine: string;
  /** Tailwind classes for the hero number color */
  primaryColor: string;
  /** Icon for the card header */
  Icon: typeof Flame;
  /** Tone class for the card background */
  cardTone: string;
  /** Progress 0..100 toward the daily target — informs the small bar */
  progressPct: number;
}

function buildMetricView(
  phase: TrainingPhase | undefined,
  consumed: number,
  goal: number,
  tdee: number | null,
  isDE: boolean,
): MetricView {
  const burned = 0; // burned is netted into consumed by the caller already
  void burned;

  // ── Cut: focus is on the deficit ──
  if (phase === 'cut' && tdee && tdee > 0) {
    const deficit = consumed - tdee; // negative = in deficit (good)
    const targetDeficit = -500; // typical Cut goal
    const onTrackPct = Math.min(100, Math.max(0, (Math.abs(deficit) / Math.abs(targetDeficit)) * 100));
    return {
      primaryValue: Math.abs(deficit),
      primarySign: deficit < 0 ? '−' : '+',
      primaryLabel: isDE ? 'Tagesbilanz' : 'Daily balance',
      contextLine: isDE
        ? `Cut-Ziel: −500 kcal/Tag · TDEE ${Math.round(tdee)}`
        : `Cut target: −500 kcal/day · TDEE ${Math.round(tdee)}`,
      primaryColor: deficit < 0 ? 'text-emerald-600' : 'text-amber-600',
      Icon: TrendingDown,
      cardTone: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200',
      progressPct: onTrackPct,
    };
  }

  // ── Bulk: focus is on remaining calories toward surplus ──
  if (phase === 'bulk') {
    const remaining = Math.max(0, goal - consumed);
    return {
      primaryValue: remaining,
      primaryLabel: isDE ? 'Heute noch' : 'Remaining today',
      contextLine: isDE
        ? `Bulk-Ziel: ${goal} kcal/Tag${tdee ? ` · +${goal - Math.round(tdee)} ueber TDEE` : ''}`
        : `Bulk target: ${goal} kcal/day${tdee ? ` · +${goal - Math.round(tdee)} over TDEE` : ''}`,
      primaryColor: remaining > 0 ? 'text-teal-600' : 'text-emerald-600',
      Icon: TrendingUp,
      cardTone: 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200',
      progressPct: goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0,
    };
  }

  // ── Default (Maintenance / Reverse / Peak / etc.) — remaining to goal ──
  const remaining = Math.max(0, goal - consumed);
  return {
    primaryValue: remaining,
    primaryLabel: isDE ? 'Heute noch' : 'Remaining today',
    contextLine: isDE
      ? `Tagesziel: ${goal} kcal${tdee ? ` · TDEE ${Math.round(tdee)}` : ''}`
      : `Daily goal: ${goal} kcal${tdee ? ` · TDEE ${Math.round(tdee)}` : ''}`,
    primaryColor: 'text-teal-700',
    Icon: Flame,
    cardTone: 'bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200',
    progressPct: goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0,
  };
}

export function LeadingMetricCard({
  caloriesConsumed,
  caloriesGoal,
  proteinConsumed,
  proteinGoal,
  caloriesBurned,
  tdee,
  profile,
  profileComplete,
}: LeadingMetricCardProps) {
  const { t, language } = useTranslation();
  const isDE = language === 'de';

  // Not enough data to render a meaningful hero card — leave the SetupGoals
  // CTA below to take its place.
  if (!profileComplete) return null;

  // Net consumed (burned activity calories are added back to the budget)
  const netConsumed = Math.max(0, caloriesConsumed - caloriesBurned);
  const view = buildMetricView(profile?.current_phase, netConsumed, caloriesGoal, tdee, isDE);

  const proteinRemaining = Math.max(0, proteinGoal - Math.round(proteinConsumed));
  const proteinPct = proteinGoal > 0 ? Math.min(100, (proteinConsumed / proteinGoal) * 100) : 0;

  const PrimaryIcon = view.Icon;

  return (
    <div className={`rounded-2xl p-5 shadow-sm border ${view.cardTone}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <PrimaryIcon className="h-4 w-4 text-teal-600" />
        <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
          {view.primaryLabel}
        </p>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className={`text-5xl font-bold tabular-nums ${view.primaryColor}`}>
          {view.primarySign ?? ''}{view.primaryValue.toLocaleString(isDE ? 'de-DE' : 'en-US')}
        </span>
        <span className="text-base text-gray-500 font-medium">kcal</span>
      </div>

      <p className="text-xs text-gray-500 mb-3">{view.contextLine}</p>

      {/* Progress bar (calories) */}
      <div className="bg-white/70 rounded-full h-2 overflow-hidden mb-3">
        <div
          className="bg-gradient-to-r from-teal-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${view.progressPct}%` }}
        />
      </div>

      {/* Protein companion — secondary metric, dimmer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Target className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-medium">{t.dashboard.protein}:</span>
          <span className="font-semibold text-gray-900 tabular-nums">
            {Math.round(proteinConsumed)} / {proteinGoal}{' '}
            <span className="text-gray-500 font-normal">g</span>
          </span>
        </div>
        <span className="text-[11px] text-gray-400">
          {proteinRemaining > 0
            ? `${proteinRemaining} g ${isDE ? 'fehlen' : 'left'}`
            : (isDE ? '✓ Ziel erreicht' : '✓ Goal hit')}
        </span>
      </div>
      <div className="bg-white/70 rounded-full h-1 overflow-hidden mt-1">
        <div
          className="bg-emerald-500 h-1 rounded-full transition-all duration-500"
          style={{ width: `${proteinPct}%` }}
        />
      </div>
    </div>
  );
}
