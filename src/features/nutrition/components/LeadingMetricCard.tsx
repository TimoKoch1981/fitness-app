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
import { NumericValue } from '../../../shared/components/NumericValue';

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
      primaryColor: deficit < 0 ? 'text-theme-success' : 'text-theme-warning',
      Icon: TrendingDown,
      cardTone: 'bg-theme-surface border-theme-line',
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
      primaryColor: remaining > 0 ? 'text-theme-primary' : 'text-theme-success',
      Icon: TrendingUp,
      cardTone: 'bg-theme-surface border-theme-line',
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
    primaryColor: 'text-theme-primary',
    Icon: Flame,
    cardTone: 'bg-theme-surface border-theme-line',
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
    <div className={`rounded-theme-lg p-7 border ${view.cardTone}`}>
      {/* Section-Eyebrow ueber dem Hero — gibt der Karte Editorial-Charakter */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          <PrimaryIcon className="h-3.5 w-3.5 text-theme-primary" strokeWidth={1.5} />
          <p className="text-[11px] text-theme-ink-2 font-semibold uppercase tracking-[0.16em]">
            {view.primaryLabel}
          </p>
        </div>
        <p className="text-[11px] text-theme-ink-3 font-theme-numeric tabular-nums">
          {new Date().toLocaleDateString(isDE ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit' })}
        </p>
      </div>

      {/* HERO — Source Serif Display, drastisch groesser. Dominant auf dem Cockpit. */}
      <div className="flex items-baseline gap-3 mb-2 leading-none">
        <span className={`text-7xl md:text-8xl font-semibold tracking-tight font-theme-display tabular-nums ${view.primaryColor}`}>
          {view.primarySign ?? ''}{view.primaryValue.toLocaleString(isDE ? 'de-DE' : 'en-US')}
        </span>
        <span className="text-lg text-theme-ink-2 font-medium tracking-tight">kcal</span>
      </div>

      <p className="text-xs text-theme-ink-2 mb-5 font-theme-numeric tabular-nums">{view.contextLine}</p>

      {/* Progress bar (calories) — duenner, editorialer */}
      <div className="bg-theme-surface-2 rounded-full h-1 overflow-hidden mb-5">
        <div
          className="bg-theme-primary h-1 rounded-full transition-all duration-500"
          style={{ width: `${view.progressPct}%` }}
        />
      </div>

      {/* Protein companion — eigene Sub-Sektion, klar abgetrennt */}
      <div className="border-t border-theme-line pt-4">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <div className="flex items-center gap-2 text-theme-ink-2">
            <Target className="h-3.5 w-3.5 text-theme-success" strokeWidth={1.5} />
            <span className="text-[11px] uppercase tracking-[0.12em] font-semibold">{t.dashboard.protein}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <NumericValue
              value={Math.round(proteinConsumed)}
              variant="inline"
              locale={isDE ? 'de-DE' : 'en-US'}
              className="!text-base !font-semibold text-theme-ink"
            />
            <span className="text-xs text-theme-ink-3">/ {proteinGoal} g</span>
          </div>
        </div>
        <div className="bg-theme-surface-2 rounded-full h-1 overflow-hidden">
          <div
            className="bg-theme-success h-1 rounded-full transition-all duration-500"
            style={{ width: `${proteinPct}%` }}
          />
        </div>
        <p className="text-[10px] text-theme-ink-3 mt-1.5 font-theme-numeric tabular-nums">
          {proteinRemaining > 0
            ? `${proteinRemaining} g ${isDE ? 'noch offen' : 'remaining'}`
            : (isDE ? 'Ziel erreicht' : 'Goal hit')}
        </p>
      </div>
    </div>
  );
}
