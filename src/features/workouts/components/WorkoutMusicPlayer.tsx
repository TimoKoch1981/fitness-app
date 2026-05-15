/**
 * WorkoutMusicPlayer — Deep-Link picker (v14.7 / P1-5).
 *
 * History: We tried for months to host an in-app YouTube iframe player. It
 * never worked reliably (deprecated `listType=search`, non-embeddable Music
 * radio mixes, Capacitor WebView quirks, autoplay policies, mount-thrash on
 * route changes — see FORTSCHRITT.md v9.6 → v13.10). At every fix, a new
 * failure mode showed up.
 *
 * Decision (User feedback after v13.10): drop the in-app player entirely.
 * This component now matches the exercise-video pattern: tap a preset →
 * opens YouTube in a new tab; or paste any URL (YouTube / Spotify / Apple
 * Music / SoundCloud / …) → opens that URL in a new tab.
 *
 * The user controls audio in their actual music app. FitBuddy stays in
 * its lane (logging, coaching) and stops fighting browser embed policies.
 */

import { useState } from 'react';
import { Music, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { cn } from '../../../lib/utils';

// ── Genre presets — open YouTube search in a new tab ──────────────────

const PRESETS = [
  { id: 'workout', emoji: '\u{1F3CB}\u{FE0F}', query: 'best workout music mix 1 hour' },
  { id: 'cardio',  emoji: '\u{1F3C3}',         query: 'best cardio running music 1 hour' },
  { id: 'focus',   emoji: '\u{1F3AF}',         query: 'focus concentration music 1 hour' },
  { id: 'chill',   emoji: '\u{1F60C}',         query: 'lofi chill beats 1 hour' },
] as const;

const PRESET_LABELS: Record<string, Record<string, string>> = {
  workout: { de: 'Workout', en: 'Workout' },
  cardio:  { de: 'Cardio',  en: 'Cardio'  },
  focus:   { de: 'Fokus',   en: 'Focus'   },
  chill:   { de: 'Chill',   en: 'Chill'   },
};

function openYouTubeSearch(query: string): void {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function openExternalUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  // Permit http(s) only — protocol must be present (handle e.g. "youtube.com/..." gracefully)
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    window.open(parsed.toString(), '_blank', 'noopener,noreferrer');
    return true;
  } catch {
    return false;
  }
}

interface WorkoutMusicPlayerProps {
  className?: string;
}

export function WorkoutMusicPlayer({ className }: WorkoutMusicPlayerProps) {
  const { t, language } = useTranslation();
  const isDE = language === 'de';

  const [isExpanded, setIsExpanded] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [urlError, setUrlError] = useState(false);

  const handlePlayCustom = (): void => {
    const ok = openExternalUrl(customUrl);
    if (ok) {
      setCustomUrl('');
      setUrlError(false);
    } else {
      setUrlError(true);
    }
  };

  // ── Collapsed mini-bar ────────────────────────────────────────────────
  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-xl shadow-lg',
          'hover:bg-gray-700 transition-colors',
          className,
        )}
      >
        <Music className="h-4 w-4" />
        <span className="text-xs font-medium">{t.workout.music}</span>
        <ChevronUp className="h-3 w-3 ml-1" />
      </button>
    );
  }

  // ── Expanded panel ───────────────────────────────────────────────────
  return (
    <div className={cn('bg-gray-800 text-white rounded-2xl shadow-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-theme-primary" />
          <span className="text-sm font-medium">{t.workout.musicWorkout}</span>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="p-1 hover:bg-gray-700 rounded"
          aria-label={t.common.close}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Preset shortcuts — open YouTube search in new tab */}
      <div className="px-4 py-3">
        <p className="text-xs text-gray-400 mb-2">
          {isDE ? 'Vorschlag auf YouTube oeffnen:' : 'Open on YouTube:'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => openYouTubeSearch(p.query)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors bg-gray-700 text-gray-200 hover:bg-gray-600"
            >
              <span>{p.emoji}</span>
              <span className="flex-1 text-left">{PRESET_LABELS[p.id]?.[language] ?? p.id}</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </button>
          ))}
        </div>
      </div>

      {/* Custom URL — opens in new tab (YouTube / Spotify / Apple Music / …) */}
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-400 mb-1.5">
          {isDE
            ? 'Eigener Link (YouTube, Spotify, Apple Music, …):'
            : 'Custom link (YouTube, Spotify, Apple Music, …):'}
        </p>
        <div className="flex gap-2">
          <input
            type="url"
            value={customUrl}
            onChange={(e) => { setCustomUrl(e.target.value); setUrlError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handlePlayCustom()}
            placeholder="https://…"
            className={cn(
              'flex-1 px-3 py-1.5 bg-gray-700 border rounded-lg text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1',
              urlError ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 focus:ring-theme-primary',
            )}
            aria-invalid={urlError}
          />
          <button
            type="button"
            onClick={handlePlayCustom}
            disabled={!customUrl.trim()}
            className="flex items-center gap-1 px-3 py-1.5 bg-theme-primary text-white rounded-lg text-xs font-medium hover:bg-theme-primary-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            {isDE ? 'Oeffnen' : 'Open'}
          </button>
        </div>
        {urlError && (
          <p className="text-[10px] text-red-400 mt-1">
            {isDE ? 'Bitte einen gueltigen Link einfuegen.' : 'Please paste a valid URL.'}
          </p>
        )}
        <p className="text-[10px] text-gray-500 mt-2">
          {isDE
            ? '💡 Musik laeuft in deiner Musik-App weiter. FitBuddy oeffnet nur den Link.'
            : '💡 Music plays in your music app. FitBuddy just opens the link.'}
        </p>
      </div>
    </div>
  );
}
