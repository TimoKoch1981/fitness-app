/**
 * ModeBar — surfaces "global toggles" that change app behaviour (v14.14 / P1-4).
 *
 * Rationale (from the IST-Analyse, persona walkthroughs):
 * The app has several profile flags that silently change what the user sees
 * (training_mode = power_plus turns on extra widgets; is_breastfeeding adds
 * +400 kcal; current_phase = cut/bulk shifts goals; cycle_tracking_enabled
 * adds the Cycle tab). Today these are invisible — the user can't tell why
 * the same page looks different on different days.
 *
 * The ModeBar makes the active state visible as small pills under the
 * header. When no modes are active, nothing renders (no wasted vertical
 * space).
 *
 * Pills are read-only intentionally — toggling a mode is a profile-level
 * decision and lives under /profile. Tap-targets here just navigate there.
 */

import { useNavigate } from 'react-router-dom';
import { useProfile } from '../../features/auth/hooks/useProfile';
import { useTranslation } from '../../i18n';

interface ModePill {
  key: string;
  emoji: string;
  labelDE: string;
  labelEN: string;
  /** Akzent-Farbe via Border-Left-Indikator (Phase 7 §2.2 Mode-Tag-Bar). */
  tone: 'amber' | 'pink' | 'teal' | 'orange' | 'violet';
}

// Studio-Look: Surface-2 BG + 3px Border-Left in Domain-Farbe (statt Pastell-Pill).
// Emojis bleiben als kompakter Tag-Identifier — schneller scanbar als Text-Only.
const TONE_CLASSES: Record<ModePill['tone'], string> = {
  amber:  'bg-theme-surface-2 text-theme-ink border-theme-line border-l-[3px] border-l-amber-600',
  pink:   'bg-theme-surface-2 text-theme-ink border-theme-line border-l-[3px] border-l-pink-600',
  teal:   'bg-theme-surface-2 text-theme-ink border-theme-line border-l-[3px] border-l-teal-600',
  orange: 'bg-theme-surface-2 text-theme-ink border-theme-line border-l-[3px] border-l-orange-600',
  violet: 'bg-theme-surface-2 text-theme-ink border-theme-line border-l-[3px] border-l-violet-600',
};

export function ModeBar() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { data: profile } = useProfile();
  const isDE = language === 'de';

  if (!profile) return null;

  const pills: ModePill[] = [];

  // Training mode (Power / Power+) — only show non-default
  if (profile.training_mode === 'power_plus') {
    pills.push({ key: 'mode-power-plus', emoji: '💪', labelDE: 'Power+', labelEN: 'Power+', tone: 'amber' });
  } else if (profile.training_mode === 'power') {
    pills.push({ key: 'mode-power', emoji: '⚡', labelDE: 'Power', labelEN: 'Power', tone: 'amber' });
  }

  // Training phase — surface non-default phases. "maintenance" is the
  // implicit baseline and stays hidden to avoid bar-bloat.
  if (profile.current_phase === 'cut') {
    pills.push({ key: 'phase-cut', emoji: '📉', labelDE: 'Cut', labelEN: 'Cut', tone: 'orange' });
  } else if (profile.current_phase === 'bulk') {
    pills.push({ key: 'phase-bulk', emoji: '📈', labelDE: 'Bulk', labelEN: 'Bulk', tone: 'teal' });
  } else if (profile.current_phase === 'peak_week') {
    pills.push({ key: 'phase-peak', emoji: '🏆', labelDE: 'Peak Week', labelEN: 'Peak Week', tone: 'violet' });
  } else if (profile.current_phase === 'reverse_diet') {
    pills.push({ key: 'phase-reverse', emoji: '↗️', labelDE: 'Reverse', labelEN: 'Reverse', tone: 'teal' });
  }

  // Cycle status (separate field from training phase — Power+ users only).
  // 'natural' is the baseline; blast/cruise/pct are noteworthy.
  if (profile.cycle_status === 'blast') {
    pills.push({ key: 'cycle-blast', emoji: '🚀', labelDE: 'Blast', labelEN: 'Blast', tone: 'amber' });
  } else if (profile.cycle_status === 'cruise') {
    pills.push({ key: 'cycle-cruise', emoji: '🛳️', labelDE: 'Cruise', labelEN: 'Cruise', tone: 'amber' });
  } else if (profile.cycle_status === 'pct') {
    pills.push({ key: 'cycle-pct', emoji: '🔄', labelDE: 'PCT', labelEN: 'PCT', tone: 'violet' });
  }

  // Breastfeeding (only visible for female users in practice — toggle is profile-gated)
  if (profile.is_breastfeeding) {
    pills.push({ key: 'breastfeeding', emoji: '🤱', labelDE: 'Stillzeit', labelEN: 'Breastfeeding', tone: 'pink' });
  }

  // Cycle tracking (informational — the dedicated /cycle tab is the action)
  if (profile.cycle_tracking_enabled && (profile.gender === 'female' || profile.gender === 'other')) {
    pills.push({ key: 'cycle', emoji: '🌸', labelDE: 'Zyklus', labelEN: 'Cycle', tone: 'pink' });
  }

  if (pills.length === 0) return null;

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto px-4 pt-2 pb-1 flex items-center gap-1.5 overflow-x-auto">
      <span className="text-[10px] uppercase tracking-[0.12em] text-theme-ink-3 font-semibold flex-shrink-0">
        {isDE ? 'Modus' : 'Mode'}
      </span>
      {pills.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => navigate('/profile')}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-theme-sm text-[11px] font-medium border whitespace-nowrap transition-colors hover:bg-theme-surface-3 ${TONE_CLASSES[p.tone]}`}
          title={isDE ? 'Im Profil aendern' : 'Change in profile'}
        >
          <span>{p.emoji}</span>
          <span>{isDE ? p.labelDE : p.labelEN}</span>
        </button>
      ))}
    </div>
  );
}
