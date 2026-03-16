/**
 * WorkoutMusicPlayer — Floating music player for workout sessions.
 *
 * Uses simple YouTube iframe embeds (NOT the IFrame Player API).
 * This works with Content-Security-Policy because:
 * - frame-src allows youtube.com / youtube-nocookie.com ✅
 * - No external script needed (IFrame API was blocked by script-src 'self') ✅
 *
 * Architecture:
 * - Expanded: Shows playlist buttons + visible YouTube player (small embed)
 * - Collapsed: Shows mini button, iframe stays in DOM (audio keeps playing)
 */

import { useState } from 'react';
import {
  Music, ChevronUp, ChevronDown, Square, ExternalLink,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { cn } from '../../../lib/utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Curated workout playlists (YouTube playlist IDs). */
const PLAYLISTS = [
  { id: 'RDCLAK5uy_n9Fb4e2UPSuzcbxRuakVBkAE85BEY_sjM', label: 'workout', emoji: '\u{1F3CB}\u{FE0F}' },
  { id: 'RDCLAK5uy_kgXMHMfuABcnFNOum4kVIhEa97Q1W-S00', label: 'cardio', emoji: '\u{1F3C3}' },
  { id: 'RDCLAK5uy_mfz4WCU2OEqJieBi8jXB-bSBhLqrnY0e0', label: 'focus', emoji: '\u{1F3AF}' },
  { id: 'RDCLAK5uy_m1IWBQ2x7HOQAX_2O6CVVxMFINT8RJDM', label: 'chill', emoji: '\u{1F60C}' },
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
 * Build a YouTube embed URL for a playlist or single video.
 * Uses youtube-nocookie.com for privacy (matching our CSP frame-src).
 */
function buildEmbedUrl(source: string): string | null {
  // Raw playlist ID (no URL chars)
  const isRawPlaylistId = !source.includes('/') && !source.includes('.');

  if (isRawPlaylistId) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${source}&autoplay=1&loop=1`;
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

  // State
  const [isExpanded, setIsExpanded] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);

  // -------------------------------------------------------------------
  // Play handlers
  // -------------------------------------------------------------------
  const handlePlayPlaylist = (playlistId: string) => {
    const url = buildEmbedUrl(playlistId);
    if (url) {
      setEmbedUrl(url);
      setActivePlaylistId(playlistId);
    }
  };

  const handlePlayCustom = () => {
    const trimmed = customUrl.trim();
    if (!trimmed) return;

    const url = buildEmbedUrl(trimmed);
    if (url) {
      setEmbedUrl(url);
      setActivePlaylistId(null);
      setCustomUrl('');
    }
  };

  const handleStop = () => {
    setEmbedUrl(null);
    setActivePlaylistId(null);
  };

  const isPlaying = embedUrl != null;

  // -------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------
  return (
    <>
      {/* ── YouTube iframe — always in DOM when playing ──────────── */}
      {/* Hidden when collapsed (tiny), visible when expanded        */}
      {embedUrl && !isExpanded && (
        <iframe
          src={embedUrl}
          className="fixed"
          style={{ width: 1, height: 1, top: 0, left: 0, opacity: 0.01, pointerEvents: 'none' }}
          allow="autoplay; encrypted-media"
          title="Workout Music"
          aria-hidden="true"
        />
      )}

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
              ▶
            </button>
          </div>
        </div>

        {/* Embedded YouTube player (visible when playing) */}
        {embedUrl && (
          <div className="px-4 pb-3 space-y-2">
            {/* Player iframe — visible and functional */}
            <div className="rounded-lg overflow-hidden bg-black aspect-video">
              <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Workout Music Player"
              />
            </div>

            {/* Controls below player */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-xs"
              >
                <Square className="h-3 w-3" />
                {isDE ? 'Stopp' : 'Stop'}
              </button>

              {isPlaying && (
                <div className="flex items-center gap-2 flex-1">
                  <EqualizerBars />
                  <span className="text-xs text-gray-400">
                    {t.workout.musicPlaying}
                  </span>
                </div>
              )}

              {/* Open in YouTube link */}
              {activePlaylistId && (
                <a
                  href={`https://www.youtube.com/playlist?list=${activePlaylistId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  YouTube
                </a>
              )}
            </div>

            {/* Hint */}
            <p className="text-[10px] text-gray-500">
              {isDE
                ? '💡 Zuklappen = Musik spielt weiter im Hintergrund'
                : '💡 Collapse = Music keeps playing in background'}
            </p>
          </div>
        )}

        {/* No music hint when nothing is playing */}
        {!embedUrl && (
          <div className="px-4 pb-3">
            <p className="text-[10px] text-gray-500 text-center">
              {isDE
                ? 'Wähle eine Playlist oder füge einen YouTube-Link ein'
                : 'Choose a playlist or paste a YouTube link'}
            </p>
          </div>
        )}
      </div>
      )}
    </>
  );
}
