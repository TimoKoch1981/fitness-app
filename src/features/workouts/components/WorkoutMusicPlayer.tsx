/**
 * WorkoutMusicPlayer — Floating music player for workout sessions.
 * Uses the YouTube IFrame Player API for real playback control.
 * Supports curated playlists and custom YouTube URLs.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Music, ChevronUp, ChevronDown,
  Play, Pause, Square, Volume2, VolumeX,
  AlertCircle, RefreshCw, Loader2,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { cn } from '../../../lib/utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Curated workout playlists (YouTube playlist IDs). */
const PLAYLISTS = [
  { id: 'PLgzTt0k8mXzEk586SfGBUBNkgmfGBKAV', label: 'workout', emoji: '\u{1F3CB}\u{FE0F}' },
  { id: 'PLDfKAXSi6kzZmB3HroGh9jCIlImz-djir', label: 'cardio', emoji: '\u{1F3C3}' },
  { id: 'PLw-VjHDlEOgs658kAHR_LAaILBXb-s6Q5', label: 'focus', emoji: '\u{1F3AF}' },
  { id: 'PLgzTt0k8mXzEpH3-UrLbmGPSYjJLOFAJm', label: 'chill', emoji: '\u{1F60C}' },
] as const;

const PLAYLIST_LABELS: Record<string, Record<string, string>> = {
  workout: { de: 'Workout', en: 'Workout' },
  cardio:  { de: 'Cardio',  en: 'Cardio'  },
  focus:   { de: 'Fokus',   en: 'Focus'   },
  chill:   { de: 'Chill',   en: 'Chill'   },
};

const DEFAULT_VOLUME = 70;

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

// ---------------------------------------------------------------------------
// Equalizer bars (extracted to avoid creating components during render)
// ---------------------------------------------------------------------------

function EqualizerBars({
  count = 3,
  barClass = 'w-0.5 bg-teal-400 rounded-full',
  animate = false,
}: {
  count?: number;
  barClass?: string;
  animate?: boolean;
}) {
  return (
    <span className="flex items-end gap-0.5">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={cn(barClass, animate && 'animate-pulse')}
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

  // UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [customUrl, setCustomUrl] = useState('');

  // Player state
  const [ytReady, setYtReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSource, setCurrentSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs
  const playerRef = useRef<YT.Player | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------
  // 1. Load the YouTube IFrame API script (once)
  // -------------------------------------------------------------------
  useEffect(() => {
    if (window.YT?.Player) {
      setYtReady(true);
      return;
    }

    // If already loading (script tag exists), just wait for callback
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existing) {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        setYtReady(true);
      };
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => setYtReady(true);

    return () => {
      // Don't remove the global callback — other instances may rely on it.
    };
  }, []);

  // -------------------------------------------------------------------
  // 2. Destroy player on unmount
  // -------------------------------------------------------------------
  useEffect(() => {
    return () => {
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  }, []);

  // -------------------------------------------------------------------
  // 3. Create / update YT.Player when source changes
  // -------------------------------------------------------------------
  const createPlayer = useCallback((source: string) => {
    if (!ytReady || !containerRef.current) return;

    // Tear down previous player
    try { playerRef.current?.destroy(); } catch { /* ignore */ }
    playerRef.current = null;

    setError(null);
    setIsLoading(true);
    setIsPlaying(false);

    // Determine if playlist or single video
    const isRawPlaylistId = !source.includes('/') && !source.includes('.');
    const playlistId = isRawPlaylistId ? source : extractPlaylistId(source);
    const videoId = isRawPlaylistId ? undefined : extractYouTubeId(source);

    if (!playlistId && !videoId) {
      setError(t('workout', 'musicError'));
      setIsLoading(false);
      return;
    }

    const playerVars: YT.PlayerVars = {
      autoplay: 1,
      controls: 0,
      loop: 1,
      rel: 0,
      modestbranding: 1,
      enablejsapi: 1,
      playsinline: 1,
      origin: window.location.origin,
    };

    if (playlistId) {
      playerVars.listType = 'playlist';
      playerVars.list = playlistId;
    }
    if (videoId && !playlistId) {
      playerVars.playlist = videoId; // needed for loop=1 on single video
    }

    const player = new YT.Player(containerRef.current, {
      width: 1,
      height: 1,
      videoId: videoId ?? undefined,
      host: 'https://www.youtube-nocookie.com',
      playerVars,
      events: {
        onReady: (event) => {
          event.target.setVolume(volume);
          if (isMuted) event.target.mute();
          setIsLoading(false);
          setIsPlaying(true);
        },
        onStateChange: (event) => {
          switch (event.data) {
            case YT.PlayerState.PLAYING:
              setIsPlaying(true);
              setIsLoading(false);
              break;
            case YT.PlayerState.PAUSED:
              setIsPlaying(false);
              break;
            case YT.PlayerState.BUFFERING:
              setIsLoading(true);
              break;
            case YT.PlayerState.ENDED:
              setIsPlaying(false);
              break;
          }
        },
        onError: (event) => {
          setIsLoading(false);
          setIsPlaying(false);
          const code = event.data;
          if (code === 101 || code === 150) {
            setError(t('workout', 'musicError') + ' (embedding disabled)');
          } else if (code === 100) {
            setError(t('workout', 'musicError') + ' (video not found)');
          } else {
            setError(t('workout', 'musicError'));
          }
        },
      },
    });

    playerRef.current = player;
  }, [ytReady, volume, isMuted, t]);

  // -------------------------------------------------------------------
  // 4. Playback controls
  // -------------------------------------------------------------------
  const handlePlayPlaylist = useCallback((playlistId: string) => {
    setCurrentSource(playlistId);
    createPlayer(playlistId);
  }, [createPlayer]);

  const handlePlayCustom = useCallback(() => {
    const trimmed = customUrl.trim();
    if (!trimmed) return;

    const videoId = extractYouTubeId(trimmed);
    const playlistId = extractPlaylistId(trimmed);

    if (!videoId && !playlistId) {
      setError(t('workout', 'musicError'));
      return;
    }

    setCurrentSource(trimmed);
    createPlayer(trimmed);
    setCustomUrl('');
  }, [customUrl, createPlayer, t]);

  const handleStop = useCallback(() => {
    try { playerRef.current?.stopVideo(); } catch { /* ignore */ }
    try { playerRef.current?.destroy(); } catch { /* ignore */ }
    playerRef.current = null;
    setCurrentSource(null);
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
  }, []);

  const togglePlayPause = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    try {
      const state = player.getPlayerState();
      if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    } catch { /* ignore */ }
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    try {
      const player = playerRef.current;
      if (player) {
        player.setVolume(newVolume);
        if (newVolume === 0) {
          player.mute();
        } else {
          player.unMute();
        }
      }
    } catch { /* ignore */ }
  }, []);

  const toggleMute = useCallback(() => {
    try {
      const player = playerRef.current;
      if (!player) return;
      if (isMuted) {
        player.unMute();
        player.setVolume(volume || DEFAULT_VOLUME);
        setIsMuted(false);
      } else {
        player.mute();
        setIsMuted(true);
      }
    } catch { /* ignore */ }
  }, [isMuted, volume]);

  const handleRetry = useCallback(() => {
    if (currentSource) {
      setError(null);
      createPlayer(currentSource);
    }
  }, [currentSource, createPlayer]);

  // -------------------------------------------------------------------
  // RENDER: Collapsed mini-bar
  // -------------------------------------------------------------------
  if (!isExpanded) {
    return (
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
          {isPlaying
            ? t('workout', 'musicPlaying')
            : t('workout', 'music')}
        </span>
        {isPlaying && <EqualizerBars animate />}
        {isLoading && <Loader2 className="h-3 w-3 animate-spin text-teal-400" />}
        <ChevronUp className="h-3 w-3 ml-1" />

        {/* YT Player container — small but visible (not opacity-0) */}
        <div
          ref={!isExpanded ? containerRef : undefined}
          className="w-px h-px overflow-hidden absolute -left-[9999px]"
          aria-hidden="true"
        />
      </button>
    );
  }

  // -------------------------------------------------------------------
  // RENDER: Expanded panel
  // -------------------------------------------------------------------
  return (
    <div className={cn(
      'bg-gray-800 text-white rounded-2xl shadow-xl overflow-hidden',
      className,
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-teal-400" />
          <span className="text-sm font-medium">
            {t('workout', 'musicWorkout')}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 hover:bg-gray-700 rounded"
          aria-label={t('common', 'close')}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Playlists */}
      <div className="px-4 py-3">
        <p className="text-xs text-gray-400 mb-2">
          {t('workout', 'musicChoose')}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PLAYLISTS.map(pl => (
            <button
              key={pl.id}
              onClick={() => handlePlayPlaylist(pl.id)}
              disabled={!ytReady}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                currentSource === pl.id
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600',
              )}
            >
              <span>{pl.emoji}</span>
              <span>{PLAYLIST_LABELS[pl.label]?.[language] ?? pl.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom URL */}
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-400 mb-1.5">
          {t('workout', 'musicCustom')}
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
            disabled={!customUrl.trim() || !ytReady}
            className="px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-xs text-red-300 flex-1">{error}</span>
            <button
              onClick={handleRetry}
              className="p-1 hover:bg-red-500/20 rounded transition-colors"
              title={t('workout', 'musicRetry')}
            >
              <RefreshCw className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && !error && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>{t('workout', 'musicLoading')}</span>
          </div>
        </div>
      )}

      {/* Controls (when a source is active) */}
      {currentSource && !error && (
        <div className="px-4 pb-3 space-y-2">
          {/* Play/Pause + Stop + Mute + Equalizer */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayPause}
              className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors"
              aria-label={isPlaying ? t('workout', 'timerPause') : t('workout', 'timerStart')}
            >
              {isPlaying
                ? <Pause className="h-4 w-4" />
                : <Play className="h-4 w-4" />}
            </button>
            <button
              onClick={handleStop}
              className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              aria-label={t('common', 'close')}
            >
              <Square className="h-4 w-4" />
            </button>
            <button
              onClick={toggleMute}
              className="p-1.5 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              aria-label={t('workout', 'musicVolume')}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <div className="flex-1 flex items-center gap-1">
              {isPlaying && <EqualizerBars count={5} barClass="w-1 bg-teal-400 rounded-full" animate />}
              {isPlaying && (
                <span className="text-xs text-gray-400 ml-2">
                  {t('workout', 'musicPlaying')}
                </span>
              )}
            </div>
          </div>

          {/* Volume slider */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 w-14">
              {t('workout', 'musicVolume')}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={e => handleVolumeChange(Number(e.target.value))}
              className="flex-1 h-1 accent-teal-500 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-teal-400 [&::-webkit-slider-thumb]:rounded-full"
            />
            <span className="text-[10px] text-gray-500 w-6 text-right">
              {isMuted ? 0 : volume}
            </span>
          </div>
        </div>
      )}

      {/* YT Player container — small but not hidden/opacity-0 */}
      <div
        ref={isExpanded ? containerRef : undefined}
        className="w-px h-px overflow-hidden"
        aria-hidden="true"
      />
    </div>
  );
}
