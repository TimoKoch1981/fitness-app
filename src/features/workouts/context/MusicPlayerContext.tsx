/**
 * MusicPlayerContext — App-weit persistenter Musik-Player.
 *
 * Loest B20: Der bisherige WorkoutMusicPlayer hat sein Iframe bei jedem Collapse/Expand
 * neu gemountet, was auf iOS/Mobile-Safari durch die Autoplay-Policy blockiert wurde
 * und zu stillen Abbruechen der Wiedergabe fuehrte. Zusaetzlich wurde das Iframe bei
 * Route-Wechseln (z.B. Cockpit -> Training) zerstoert.
 *
 * Loesung: EINE einzige Iframe-Instanz am App-Root, gemountet ausserhalb aller Routes.
 * Der Iframe wird per CSS hidden/sichtbar gemacht, NIE unmounted. Audio laeuft
 * ununterbrochen weiter beim Collapse, Route-Wechsel und Scroll.
 *
 * Architektur:
 *  - MusicPlayerProvider   : Context mit embedUrl / setEmbedUrl / stop / activePlaylistId
 *  - GlobalMusicIframe     : memoized Single-Instance-Iframe, Position fixed top-right
 *  - WorkoutMusicPlayer    : Nur noch Control-UI (Playlist-Buttons, Custom-URL) — kein eigenes Iframe mehr
 */

import { createContext, useContext, useState, useCallback, useMemo, memo, type ReactNode } from 'react';
import { Music, X } from 'lucide-react';

// ── Context ──────────────────────────────────────────────────────────────

interface MusicPlayerContextValue {
  /** Aktuelle Embed-URL (null = kein Player sichtbar). */
  embedUrl: string | null;
  /** ID der aktiven Playlist (fuer Highlighting im Control-UI). */
  activePlaylistId: string | null;
  /** Laeuft gerade eine Wiedergabe? */
  isPlaying: boolean;
  /** Neue Embed-URL + optional Playlist-ID setzen. */
  play: (embedUrl: string, playlistId?: string | null) => void;
  /** Wiedergabe stoppen und Iframe verbergen. */
  stop: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

export function useMusicPlayer(): MusicPlayerContextValue {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error('useMusicPlayer must be used within MusicPlayerProvider');
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────

interface MusicPlayerProviderProps {
  children: ReactNode;
}

export function MusicPlayerProvider({ children }: MusicPlayerProviderProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);

  const play = useCallback((url: string, playlistId: string | null = null) => {
    console.log('[MusicPlayer] Play:', playlistId ?? 'custom', url.slice(0, 60));
    setEmbedUrl(url);
    setActivePlaylistId(playlistId);
  }, []);

  const stop = useCallback(() => {
    console.log('[MusicPlayer] Stop');
    setEmbedUrl(null);
    setActivePlaylistId(null);
  }, []);

  const value = useMemo<MusicPlayerContextValue>(
    () => ({ embedUrl, activePlaylistId, isPlaying: embedUrl !== null, play, stop }),
    [embedUrl, activePlaylistId, play, stop],
  );

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      <GlobalMusicIframe embedUrl={embedUrl} onStop={stop} />
    </MusicPlayerContext.Provider>
  );
}

// ── Global Iframe (memoized, stable, never re-mounts) ────────────────────

interface GlobalMusicIframeProps {
  embedUrl: string | null;
  onStop: () => void;
}

/**
 * Persistent Single-Instance Iframe am App-Root.
 *
 * Key-Invarianten:
 *  - React.memo + stable key="persistent-music-iframe"  → NIE re-mounted
 *  - Position: fixed, top-right, z-index high           → ueberlebt Page-Navigation
 *  - Iframe muss SICHTBAR und mindestens 200x120 sein   → YouTube erlaubt sonst kein Audio
 *  - Beim Stop wird das Iframe komplett unmounted (src=null) = aktiver Stop
 *
 * LERNEFFEKT aus v13.5: Ein 10x10px off-screen Iframe spielt KEIN Audio auf
 * YouTube — Google pruefte Visibility im Viewport. Deshalb hier: echtes
 * sichtbares 240x135 Mini-Video oben rechts, mit Stop-Button darueber.
 */
const GlobalMusicIframe = memo(function GlobalMusicIframe({ embedUrl, onStop }: GlobalMusicIframeProps) {
  if (!embedUrl) return null;

  return (
    <div
      className="fixed top-3 right-3 z-[9999] flex flex-col gap-1 pointer-events-auto"
      style={{ width: 240 }}
      role="status"
      aria-label="Musik-Player"
    >
      {/* Header with status + stop button */}
      <div className="flex items-center gap-2 bg-gray-900/95 backdrop-blur-sm text-white rounded-t-lg shadow-xl border border-b-0 border-teal-500/30 px-2 py-1">
        <div className="flex items-center justify-center w-5 h-5 bg-teal-500/20 rounded-full shrink-0">
          <Music className="w-3 h-3 text-teal-400 animate-pulse" />
        </div>
        <span className="text-[10px] font-medium text-gray-200 whitespace-nowrap flex-1">
          Musik
        </span>
        <button
          onClick={onStop}
          className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors shrink-0"
          aria-label="Musik stoppen"
          title="Stoppen"
        >
          <X className="w-3 h-3 text-red-400" />
        </button>
      </div>

      {/*
        VISIBLE YouTube iframe — 240x135 (16:9). Must be visible in viewport for
        YouTube to route audio. NOT offscreen, NOT opacity:0, NOT width<200.
      */}
      <iframe
        key="persistent-music-iframe"
        src={embedUrl}
        title="Workout Music"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="rounded-b-lg shadow-xl border border-t-0 border-teal-500/30 bg-black"
        style={{
          width: 240,
          height: 135,
          border: 0,
        }}
      />
    </div>
  );
});

GlobalMusicIframe.displayName = 'GlobalMusicIframe';
