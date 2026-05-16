/**
 * PeakWeekCard — Tag-fuer-Tag-Guidance bei aktiver Peak Week (UX12).
 *
 * Erscheint NUR wenn profile.current_phase === 'peak_week' und phase_started_at
 * gesetzt ist. Berechnet Tag 1-7 aus heute - phase_started_at und zeigt typische
 * Bodybuilder-Show-Prep-Anpassungen (KH-Cycling, Wasser, Natrium).
 *
 * Quellen:
 *   - Mitchell et al. 2014 (Pro-bodybuilder peak-week practices)
 *   - Helms et al. 2014 (Evidence-based recommendations for natural BB)
 *
 * Wichtig: Hinweise sind Orientierung, keine Vorschriften. Disclaimer-Text am
 * Ende der Karte.
 */

import { useMemo } from 'react';
import { Trophy, AlertCircle } from 'lucide-react';
import type { UserProfile } from '../../../types/health';
import { JargonTerm } from '../../../shared/components/JargonTerm';

interface PeakWeekCardProps {
  profile: UserProfile | null | undefined;
  language?: 'de' | 'en';
}

interface DayGuidance {
  day: number;
  emoji: string;
  focus_de: string;
  focus_en: string;
  notes_de: string;
  notes_en: string;
}

const DAY_GUIDANCE: DayGuidance[] = [
  {
    day: 1, emoji: '🔋',
    focus_de: 'Carb-Depletion (Tag 1-3)',
    focus_en: 'Carb depletion (day 1-3)',
    notes_de: 'KH auf ~1g/kg, Protein hoch. Trainings-Volumen reduziert, Intensitaet bleibt.',
    notes_en: 'Carbs ~1g/kg, protein high. Reduce training volume, keep intensity.',
  },
  {
    day: 2, emoji: '🔋',
    focus_de: 'Carb-Depletion + Wasser hoch',
    focus_en: 'Carb depletion + high water',
    notes_de: '6-8 L Wasser/Tag. Natrium normal. Kein Schwitz-Training.',
    notes_en: '6-8 L water/day. Sodium normal. No sweat training.',
  },
  {
    day: 3, emoji: '🔋',
    focus_de: 'Letzter Depletion-Tag',
    focus_en: 'Last depletion day',
    notes_de: 'Tiefster KH-Punkt. Glykogen-Speicher fast leer. Energie wird niedrig sein.',
    notes_en: 'Lowest carb point. Glycogen stores nearly empty. Energy will be low.',
  },
  {
    day: 4, emoji: '🍚',
    focus_de: 'Carb-Loading startet',
    focus_en: 'Carb loading begins',
    notes_de: 'KH auf 4-6g/kg. Salz beibehalten. Wasser weiter hoch.',
    notes_en: 'Carbs up to 4-6g/kg. Maintain sodium. Keep water high.',
  },
  {
    day: 5, emoji: '🍚',
    focus_de: 'Carb-Loading hoch',
    focus_en: 'Carb loading peak',
    notes_de: 'Max-Carbs (6-8g/kg). Salz noch normal. Wasser auf 5L reduzieren.',
    notes_en: 'Max carbs (6-8g/kg). Sodium still normal. Reduce water to 5L.',
  },
  {
    day: 6, emoji: '💧',
    focus_de: 'Wasser-Reduktion + Salz runter',
    focus_en: 'Water cut + sodium down',
    notes_de: 'Wasser auf 2-3L. Salz minimieren. KH moderat (4-5g/kg). Probepose vorm Spiegel.',
    notes_en: 'Water 2-3L. Minimize sodium. Carbs moderate (4-5g/kg). Practice posing.',
  },
  {
    day: 7, emoji: '🏆',
    focus_de: 'Show Day — Feintuning',
    focus_en: 'Show day — fine-tuning',
    notes_de: 'Wasser minimal. Kleine KH-Portionen 30-60min vor Posing (Pump). Viel Glueck!',
    notes_en: 'Water minimal. Small carb portions 30-60min before posing (pump). Good luck!',
  },
];

export function PeakWeekCard({ profile, language }: PeakWeekCardProps) {
  const isDE = (language ?? 'de') === 'de';

  const { dayOfWeek, isPeakWeek, daysOverdue } = useMemo(() => {
    if (profile?.current_phase !== 'peak_week' || !profile.phase_started_at) {
      return { dayOfWeek: 0, isPeakWeek: false, daysOverdue: 0 };
    }
    const started = new Date(profile.phase_started_at);
    const now = new Date();
    // Tagesdifferenz (kalender-tag, nicht 24h-Block)
    const startOfStarted = new Date(started.getFullYear(), started.getMonth(), started.getDate());
    const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((startOfNow.getTime() - startOfStarted.getTime()) / 86_400_000);
    const day = diffDays + 1;  // Tag 1 = Start-Tag
    return {
      dayOfWeek: Math.min(7, Math.max(1, day)),
      isPeakWeek: true,
      daysOverdue: day > 7 ? day - 7 : 0,
    };
  }, [profile?.current_phase, profile?.phase_started_at]);

  if (!isPeakWeek) return null;

  const guidance = DAY_GUIDANCE[dayOfWeek - 1];

  return (
    <div className="rounded-theme-lg border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-600" strokeWidth={1.75} />
          <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800">
            <JargonTerm term="Peak-Week" language={isDE ? 'de' : 'en'} display="subtle">
              {isDE ? 'Peak Week aktiv' : 'Peak week active'}
            </JargonTerm>
          </h3>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-amber-700 leading-none">
            {dayOfWeek}<span className="text-base text-amber-500">/7</span>
          </div>
          <div className="text-[10px] text-amber-600 mt-0.5">
            {isDE ? `Tag ${dayOfWeek}` : `Day ${dayOfWeek}`}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all"
          style={{ width: `${(dayOfWeek / 7) * 100}%` }}
        />
      </div>

      {/* Today's Guidance */}
      <div className="bg-white/70 rounded-lg p-3 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{guidance.emoji}</span>
          <p className="text-sm font-semibold text-amber-900">
            {isDE ? guidance.focus_de : guidance.focus_en}
          </p>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          {isDE ? guidance.notes_de : guidance.notes_en}
        </p>
      </div>

      {daysOverdue > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 mb-3 flex items-start gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-red-700">
            {isDE
              ? `Peak Week ist seit ${daysOverdue} Tagen vorbei. Phase im Profil aktualisieren?`
              : `Peak week ended ${daysOverdue} days ago. Update phase in profile?`}
          </p>
        </div>
      )}

      <p className="text-[10px] text-amber-600 italic leading-snug">
        {isDE
          ? '⚠ Allgemeine Orientierung nach Mitchell 2014 + Helms 2014. Spezifische Anpassungen mit deinem Coach abstimmen.'
          : '⚠ General guidance per Mitchell 2014 + Helms 2014. Specific adjustments — consult your coach.'}
      </p>
    </div>
  );
}
