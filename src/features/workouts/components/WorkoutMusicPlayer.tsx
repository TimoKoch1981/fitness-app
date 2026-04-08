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
 * Curated workout categories — each uses YouTube's built-in search-based playback
 * (`listType=search&list=KEYWORDS`). This works reliably without hardcoding specific
 * playlist IDs (which break when playlists go private/are deleted, and YouTube Music
 * radio mix IDs like `RDCLAK5uy_*` are personalized and don't embed publicly).
 */
const PLAYLISTS = [
  { id: 'workout+music+mix+2024',         label: 'workout', emoji: '\u{1F3CB}\u{FE0F}' },
  { id: 'cardio+running+music+mix',        label: 'cardio',  emoji: '\u{1F3C3}' },
  { id: 'focus+concentration+music+mix',   label: 'focus',   emoji: '\u{1F3AF}' },
  { id: 'chill+lofi+beats+mix',            label: 'chill',   emoji: '\u{1F60C}' },
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
 * Build a YouTube embed URL.
 * Uses youtube-nocookie.com for privacy (matching our CSP frame-src).
 *
 * Supports three input formats:
 *  1. URL with `?list=PLAYLIST_ID` → videoseries embed
 *  2. URL with `?v=VIDEO_ID` or youtu.be short link → single video loop
 *  3. Plain string like `workout+music+mix` → search-based playback (listType=search)
 */
function buildEmbedUrl(source: string): string | null {
  // Case 3: plain keyword string (our curated categories use this)
  const isKeywordSearch = !source.includes('/') && !source.includes('.');

  if (isKeywordSearch) {
    // YouTube search-based playback — reliable, no playlist-ID maintenance,
    // returns whatever matches the query right now.
    const query = encodeURIComponent(source);
    return `https://www.youtube-nocookie.com/embed?listType=search&list=${query}&autoplay=1&loop=1`;
  }

  const playlistId = extractPlaylistId(source);
  const videoId = extractYouTubeId(source);

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
  const { embedUrl, activePlaylistId, isPlaying, play, stop } = useMusicPlayer();

  // Expanded state stays local (UI-only, per-component)
  const [isExpanded, setIsExpanded] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // -------------------------------------------------------------------
  // Play handlers
  // -------------------------------------------------------------------
  const handlePlayPlaylist = (playlistId: string) => {
    const url = buildEmbedUrl(playlistId);
    if (url) play(url, playlistId);
  };

  const handlePlayCustom = () => {
    const trimmed = customUrl.trim();
    if (!trimmed) return;

    const url = buildEmbedUrl(trimmed);
    if (url) {
      play(url, null);
      setCustomUrl('');
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

        {/* Playlists */}
        <div className="px-4 py-3">
          <p className="text-xs text-gray-400 mb-2">
            {t.workout.musicChoose}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PLAYLISTS.map(pl => (
              <button
                key={pl.id}
                onClick={() => handlePlayPlaylist(pl.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  activePlaylistId === pl.id
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600',
                )}
              >
                <span>{pl.emoji}</span>
                <span>{PLAYLIST_LABELS[pl.label]?.[language] ?? pl.label}</span>
                {activePlaylistId === pl.id && <EqualizerBars />}
              </button>
            ))}
          </div>
        </div>

        {/* Custom URL */}
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 mb-1.5">
            {t.workout.musicCustom}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customUrl}
              onChange={e => setCustomUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePlayCustom()}
              placeholder="https://youtube.com/..."
              className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <button
              onClick={handlePlayCustom}
              disabled={!customUrl.trim()}
              className="px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {'\u25B6'}
            </button>
          </div>
        </div>

        {/* Status + Controls when playing */}
        {embedUrl && (
          <div className="px-4 pb-3 space-y-2">
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-700/50 rounded-lg">
              <div className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center">
                <Music className="w-4 h-4 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {activePlaylistId
                    ? PLAYLIST_LABELS[PLAYLISTS.find(p => p.id === activePlaylistId)?.label ?? '']?.[language] ?? 'Playlist'
                    : (isDE ? 'Eigene URL' : 'Custom URL')}
                </p>
                <div className="flex items-center gap-1.5">
                  <EqualizerBars />
                  <span className="text-[10px] text-gray-400">
                    {t.workout.musicPlaying}
                  </span>
                </div>
              </div>
              <button
                onClick={stop}
                className="flex items-center gap-1 px-2.5 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-xs"
                aria-label={isDE ? 'Stoppen' : 'Stop'}
              >
                <Square className="h-3 w-3" />
                {isDE ? 'Stopp' : 'Stop'}
              </button>
            </div>

            {/* Open in YouTube link — search-based for keyword categories, direct for playlist IDs */}
            {activePlaylistId && (
              <a
                href={
                  activePlaylistId.includes('+')
                    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(activePlaylistId.replace(/\+/g, ' '))}`
                    : `https://www.youtube.com/playlist?list=${activePlaylistId}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 px-2 py-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                {isDE ? 'In YouTube oeffnen' : 'Open in YouTube'}
              </a>
            )}

            {/* Hint */}
            <p className="text-[10px] text-gray-500 text-center">
              {isDE
                ? '\uD83D\uDCA1 Musik laeuft weiter beim Zuklappen, Seiten-Wechsel und Scroll'
                : '\uD83D\uDCA1 Music keeps playing on collapse, navigation and scroll'}
            </p>
          </div>
        )}

        {/* No music hint when nothing is playing */}
        {!embedUrl && (
          <div className="px-4 pb-3">
            <p className="text-[10px] text-gray-500 text-center">
              {isDE
                ? 'Waehle eine Playlist oder fuege einen YouTube-Link ein'
                : 'Choose a playlist or paste a YouTube link'}
            </p>
          </div>
        )}
      </div>
      )}
    </>
  );
}
