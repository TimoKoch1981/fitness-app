/**
 * WorkoutMusicPlayer — Floating music player for workout sessions.
 * Embeds YouTube videos as background music during training.
 * Supports curated playlists and custom YouTube URLs.
 */

import { useState, useRef, useCallback } from 'react';
import {
  Music, X, ChevronUp, ChevronDown,
  Play, Pause, SkipForward, Volume2, VolumeX,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { cn } from '../../../lib/utils';

// Curated workout playlists (YouTube playlist IDs)
const PLAYLISTS = [
  { id: 'PLgzTt0k8mXzEk586SfGBUBNkgmfGBKAV', label: 'workout', emoji: '🏋️' },
  { id: 'PLDfKAXSi6kzZmB3HroGh9jCIlImz-djir', label: 'cardio', emoji: '🏃' },
  { id: 'PLw-VjHDlEOgs658kAHR_LAaILBXb-s6Q5', label: 'focus', emoji: '🎯' },
  { id: 'PLgzTt0k8mXzEpH3-UrLbmGPSYjJLOFAJm', label: 'chill', emoji: '😌' },
] as const;

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/
  );
  return match?.[1] ?? null;
}

function extractPlaylistId(url: string): string | null {
  const match = url.match(/[?&]list=([^&]+)/);
  return match?.[1] ?? null;
}

interface WorkoutMusicPlayerProps {
  className?: string;
}

export function WorkoutMusicPlayer({ className }: WorkoutMusicPlayerProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSource, setCurrentSource] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const playlistLabels: Record<string, Record<string, string>> = {
    workout: { de: 'Workout', en: 'Workout' },
    cardio: { de: 'Cardio', en: 'Cardio' },
    focus: { de: 'Fokus', en: 'Focus' },
    chill: { de: 'Chill', en: 'Chill' },
  };

  const buildEmbedUrl = useCallback((source: string) => {
    // Check if it's a playlist ID (no slashes)
    if (!source.includes('/') && !source.includes('.')) {
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${source}&autoplay=1&loop=1`;
    }

    // Try to extract video ID from URL
    const videoId = extractYouTubeId(source);
    const playlistId = extractPlaylistId(source);

    if (playlistId) {
      return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&autoplay=1&loop=1`;
    }
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1`;
    }

    return null;
  }, []);

  const handlePlayPlaylist = (playlistId: string) => {
    setCurrentSource(playlistId);
    setIsPlaying(true);
  };

  const handlePlayCustom = () => {
    const trimmed = customUrl.trim();
    if (!trimmed) return;

    const embedUrl = buildEmbedUrl(trimmed);
    if (embedUrl) {
      setCurrentSource(trimmed);
      setIsPlaying(true);
      setCustomUrl('');
    }
  };

  const handleStop = () => {
    setCurrentSource(null);
    setIsPlaying(false);
  };

  const toggleMute = () => {
    setIsMuted(prev => !prev);
    // Post message to YouTube iframe API
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({
          event: 'command',
          func: isMuted ? 'unMute' : 'mute',
        }),
        '*'
      );
    }
  };

  const embedUrl = currentSource ? buildEmbedUrl(currentSource) : null;

  // Collapsed mini-bar
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
            ? (isDE ? 'Musik läuft' : 'Music playing')
            : (isDE ? 'Musik' : 'Music')}
        </span>
        {isPlaying && (
          <span className="flex gap-0.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-0.5 bg-teal-400 rounded-full animate-pulse"
                style={{
                  height: `${8 + Math.random() * 8}px`,
                  animationDelay: `${i * 150}ms`,
                }}
              />
            ))}
          </span>
        )}
        <ChevronUp className="h-3 w-3 ml-1" />
      </button>
    );
  }

  // Expanded panel
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
            {isDE ? 'Workout-Musik' : 'Workout Music'}
          </span>
        </div>
        <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-gray-700 rounded">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Playlists */}
      <div className="px-4 py-3">
        <p className="text-xs text-gray-400 mb-2">
          {isDE ? 'Playlist wählen' : 'Choose playlist'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PLAYLISTS.map(pl => (
            <button
              key={pl.id}
              onClick={() => handlePlayPlaylist(pl.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                currentSource === pl.id
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600',
              )}
            >
              <span>{pl.emoji}</span>
              <span>{playlistLabels[pl.label][language]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom URL */}
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-400 mb-1.5">
          {isDE ? 'Oder YouTube-Link einfügen' : 'Or paste YouTube link'}
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
            className="px-3 py-1.5 bg-teal-500 text-white rounded-lg text-xs font-medium hover:bg-teal-600 disabled:opacity-40 transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Controls (when playing) */}
      {isPlaying && (
        <div className="px-4 pb-3 flex items-center gap-3">
          <button
            onClick={handleStop}
            className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <Pause className="h-4 w-4" />
          </button>
          <button
            onClick={toggleMute}
            className="p-1.5 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <div className="flex-1 flex items-center gap-1">
            {[0, 1, 2, 3, 4].map(i => (
              <span
                key={i}
                className="w-1 bg-teal-400 rounded-full animate-pulse"
                style={{
                  height: `${6 + Math.random() * 10}px`,
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
            <span className="text-xs text-gray-400 ml-2">
              {isDE ? 'Läuft...' : 'Playing...'}
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-1.5 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Hidden YouTube iframe */}
      {embedUrl && (
        <iframe
          ref={iframeRef}
          src={`${embedUrl}&enablejsapi=1${isMuted ? '&mute=1' : ''}`}
          className="w-0 h-0 absolute opacity-0 pointer-events-none"
          allow="autoplay; encrypted-media"
          title="Workout Music"
        />
      )}
    </div>
  );
}
