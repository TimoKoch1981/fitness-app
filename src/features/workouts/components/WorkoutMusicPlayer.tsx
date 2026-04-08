/**
 * WorkoutMusicPlayer — Control-UI fuer den globalen Musik-Player.
 *
 * Dieses Component ist NUR noch das Control-Panel (Playlist-Buttons + Custom-URL).
 * Das eigentliche YouTube-Iframe lebt global im MusicPlayerProvider (App-Root)
 * und wird NIE re-mounted — das loest B20 (Musik stoppt beim Collapse/Navigate).
 *
 * @see features/workouts/context/MusicPlayerContext.tsx
 */

import { useState } from 'react';
import {
  Music, ChevronUp, ChevronDown, Square, ExternalLink,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { cn } from '../../../lib/utils';
import { useMusicPlayer } from '../context/MusicPlayerContext';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Workout music categories — open a YouTube search in a new tab.
 *
 * Historie:
 *  - RDCLAK5uy_* (v12.x): YouTube Music Radio-Mix-IDs → personalisiert, nicht embeddable
 *  - listType=search (v13.6): YouTube hat Search-basiertes Embedding Nov 2020 deprecated
 *    → 4xx "Dieses Video ist nicht verfuegbar"
 *
 * Loesung: Die 4 Buttons oeffnen YouTube extern (neuer Tab) mit einer Suche,
 * der User kann dann einen konkreten Link kopieren und unten ins Custom-URL-Feld
 * einfuegen. Der embedded Player funktioniert garantiert mit echten Video-URLs.
 */
const PLAYLISTS = [
  { query: 'best workout music mix 2024 1 hour',     label: 'workout', emoji: '\u{1F3CB}\u{FE0F}' },
  { query: 'best cardio running music mix 2024',     label: 'cardio',  emoji: '\u{1F3C3}' },
  { query: 'focus concentration music 1 hour',       label: 'focus',   emoji: '\u{1F3AF}' },
  { query: 'lofi chill beats 1 hour',                 label: 'chill',   emoji: '\u{1F60C}' },
] as const;

const PLAYLIST_LABELS: Record<string, Record<string, string>> = {
  workout: { de: 'Workout', en: 'Workout' },
  cardio:  { de: 'Cardio',  en: 'Cardio'  },
  focus:   { de: 'Fokus',   en: 'Focus'   },
  chill:   { de: 'Chill',   en: 'Chill'   },
};

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/,
  );
  return match?.[1] ?? null;
}

function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([^&]+)/);
  return match?.[1] ?? null;
}

/**
 * Build a YouTube embed URL from a user-provided link.
 * Uses youtube-nocookie.com for privacy (matching our CSP frame-src).
 *
 * Supports:
 *  - URL with `?list=PL...` → videoseries embed (real public playlist)
 *  - URL with `?v=VIDEO_ID` or youtu.be short link → single video on loop
 *
 * Note: Keyword search embeds (`listType=search`) were deprecated by YouTube in
 * Nov 2020 and return 4xx ("Video not available"). We no longer support them.
 */
function buildEmbedUrl(source: string): string | null {
  const trimmed = source.trim();
  if (!trimmed) return null;

  const playlistId = extractPlaylistId(trimmed);
  const videoId = extractYouTubeId(trimmed);

  if (playlistId) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&autoplay=1&loop=1`;
  }
  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Equalizer bars animation
// ---------------------------------------------------------------------------

function EqualizerBars() {
  return (
    <span className="flex items-end gap-0.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-0.5 bg-teal-400 rounded-full animate-pulse"
          style={{
            height: `${8 + (i * 3) % 10}px`,
            animationDelay: `${i * 150}ms`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface WorkoutMusicPlayerProps {
  className?: string;
}

export function WorkoutMusicPlayer({ className }: WorkoutMusicPlayerProps) {
  const { t, language } = useTranslation();
  const isDE = language === 'de';

  // Global music state from context — NOT local!
  const { embedUrl, isPlaying, play, stop } = useMusicPlayer();

  // Expanded state stays local (UI-only, per-component)
  const [isExpanded, setIsExpanded] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // -------------------------------------------------------------------
  // Play handlers
  // -------------------------------------------------------------------

  /**
   * Open YouTube search in a new tab. User picks a video/playlist and
   * pastes the URL into the Custom URL field to play it in-app.
   *
   * Rationale: Hardcoded playlist IDs break constantly (playlists deleted,
   * privatized, YT Music radio-mix IDs not embeddable, listType=search
   * deprecated). External search = always works, user control.
   */
  const handleOpenYouTubeSearch = (query: string) => {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePlayCustom = () => {
    const trimmed = customUrl.trim();
    if (!trimmed) return;

    const url = buildEmbedUrl(trimmed);
    if (url) {
      play(url, null);
      setCustomUrl('');
    } else {
      console.warn('[WorkoutMusicPlayer] Could not extract video/playlist ID from:', trimmed);
    }
  };

  // -------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------
  return (
    <>
      {/* ── Collapsed mini-bar ──────────────────────────────────── */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-xl shadow-lg',
            'hover:bg-gray-700 transition-colors',
            className,
          )}
        >
          <Music className="h-4 w-4" />
          <span className="text-xs font-medium">
            {isPlaying ? t.workout.musicPlaying : t.workout.music}
          </span>
          {isPlaying && <EqualizerBars />}
          <ChevronUp className="h-3 w-3 ml-1" />
        </button>
      ) : (

      /* ── Expanded panel ───────────────────────────────────────── */
      <div className={cn(
        'bg-gray-800 text-white rounded-2xl shadow-xl overflow-hidden',
        className,
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-teal-400" />
            <span className="text-sm font-medium">
              {t.workout.musicWorkout}
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1 hover:bg-gray-700 rounded"
            aria-label={t.common.close}
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Custom URL — primary in-app play path */}
        <div className="px-4 py-3">
          <p className="text-xs text-gray-400 mb-1.5">
            {isDE ? 'YouTube-Link einfuegen und abspielen:' : 'Paste YouTube link and play:'}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customUrl}
              onChange={e => setCustomUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePlayCustom()}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button
              onClick={handlePlayCustom}
              disabled={!customUrl.trim()}
              className="px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title={isDE ? 'Abspielen' : 'Play'}
            >
              {'\u25B6'}
            </button>
          </div>
        </div>

        {/* Category shortcuts — open YouTube search in new tab */}
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 mb-2">
            {isDE ? 'Oder Vorschlaege auf YouTube suchen:' : 'Or browse suggestions on YouTube:'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PLAYLISTS.map(pl => (
              <button
                key={pl.label}
                onClick={() => handleOpenYouTubeSearch(pl.query)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors bg-gray-700 text-gray-200 hover:bg-gray-600"
                title={isDE ? 'Auf YouTube oeffnen' : 'Open on YouTube'}
              >
                <span>{pl.emoji}</span>
                <span className="flex-1 text-left">{PLAYLIST_LABELS[pl.label]?.[language] ?? pl.label}</span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            {isDE
              ? '\uD83D\uDCA1 Tipp: Video auf YouTube oeffnen, URL kopieren, oben einfuegen.'
              : '\uD83D\uDCA1 Tip: Open a video on YouTube, copy the URL, paste it above.'}
          </p>
        </div>

        {/* Status + Stop button when playing */}
        {embedUrl && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-700/50 rounded-lg">
              <div className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center shrink-0">
                <Music className="w-4 h-4 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <EqualizerBars />
                  <span className="text-xs text-gray-300">
                    {t.workout.musicPlaying}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {isDE ? 'Player oben rechts' : 'Player top-right'}
                </p>
              </div>
              <button
                onClick={stop}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-xs shrink-0"
                aria-label={isDE ? 'Stoppen' : 'Stop'}
              >
                <Square className="h-3 w-3" />
                {isDE ? 'Stopp' : 'Stop'}
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </>
  );
}
