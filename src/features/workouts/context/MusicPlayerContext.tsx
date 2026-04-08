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
 *  - 2 Modi per CSS: visible (80px pill oben rechts) / hidden (display:none)
 *  - Beim Stop wird das Iframe komplett unmounted (src=null) = aktiver Stop
 *
 * Autoplay-Policy-Trick: Das Iframe wird erst gemountet wenn play() aufgerufen
 * wurde — also IMMER nach einer User-Geste. Danach darf es so lange leben wie
 * es will, Autoplay ist freigegeben.
 */
const GlobalMusicIframe = memo(function GlobalMusicIframe({ embedUrl, onStop }: GlobalMusicIframeProps) {
  if (!embedUrl) return null;

  return (
    <div
      className="fixed top-3 right-3 z-[9999] flex items-center gap-2 bg-gray-900/95 backdrop-blur-sm text-white rounded-full shadow-xl border border-teal-500/30 px-2 py-1.5 pointer-events-auto"
      style={{ maxWidth: 220 }}
      role="status"
      aria-label="Musik-Player"
    >
      {/* Animated musical indicator */}
      <div className="flex items-center justify-center w-7 h-7 bg-teal-500/20 rounded-full shrink-0">
        <Music className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
      </div>

      {/* Status text */}
      <span className="text-[10px] font-medium text-gray-200 whitespace-nowrap">
        Musik laeuft
      </span>

      {/* Stop button */}
      <button
        onClick={onStop}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors shrink-0"
        aria-label="Musik stoppen"
        title="Stoppen"
      >
        <X className="w-3 h-3 text-red-400" />
      </button>

      {/*
        The actual YouTube iframe — kept at 1 fixed size to avoid re-render issues.
        Hidden via absolute positioning off-screen but NOT display:none (which would
        pause some browsers) and NOT width:0 (which throttles audio on iOS).
        Using 10x10px minimum + opacity 0 + pointer-events none = audio plays reliably.
      */}
      <iframe
        key="persistent-music-iframe"
        src={embedUrl}
        title="Workout Music"
        allow="autoplay; encrypted-media"
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: 10,
          height: 10,
          left: -9999,
          top: -9999,
          opacity: 0,
          pointerEvents: 'none',
          border: 0,
        }}
      />
    </div>
  );
});

GlobalMusicIframe.displayName = 'GlobalMusicIframe';
