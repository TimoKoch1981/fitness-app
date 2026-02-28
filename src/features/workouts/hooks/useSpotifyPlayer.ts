/**
 * useSpotifyPlayer — Manages Spotify Web Playback SDK connection.
 *
 * Flow:
 * 1. User clicks "Connect Spotify" → opens OAuth popup
 * 2. Spotify redirects back with ?code= parameter
 * 3. Code exchanged for tokens via Edge Function (spotify-proxy)
 * 4. Web Playback SDK loaded + player created
 * 5. Device registered, user can play/pause/skip
 *
 * Requires: Spotify Premium account.
 * Tokens stored in sessionStorage (per-session, not persisted).
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────

export interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp in ms
}

export interface SpotifyTrackInfo {
  name: string;
  artist: string;
  albumArt: string;
  durationMs: number;
  positionMs: number;
}

type SpotifyStatus = 'disconnected' | 'connecting' | 'ready' | 'playing' | 'paused' | 'error';

// ── Constants ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'fitbuddy-spotify-tokens';
const SPOTIFY_SDK_URL = 'https://sdk.scdn.co/spotify-player.js';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state',
].join(' ');

// ── Helper: Load SDK script ──────────────────────────────────────────────

function loadSpotifySdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Spotify) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[src="${SPOTIFY_SDK_URL}"]`);
    if (existing) {
      // Script loading, wait for callback
      window.onSpotifyWebPlaybackSDKReady = () => resolve();
      return;
    }

    window.onSpotifyWebPlaybackSDKReady = () => resolve();

    const script = document.createElement('script');
    script.src = SPOTIFY_SDK_URL;
    script.onerror = () => reject(new Error('Failed to load Spotify SDK'));
    document.head.appendChild(script);
  });
}

// ── Token helpers ────────────────────────────────────────────────────────

function saveTokens(tokens: SpotifyTokens): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

function loadTokens(): SpotifyTokens | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SpotifyTokens;
  } catch {
    return null;
  }
}

function clearTokens(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useSpotifyPlayer() {
  const [status, setStatus] = useState<SpotifyStatus>('disconnected');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrackInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const playerRef = useRef<Spotify.Player | null>(null);
  const tokensRef = useRef<SpotifyTokens | null>(loadTokens());

  // ── Get Supabase URL for Edge Function calls ────────────────────────
  const getEdgeFunctionUrl = useCallback(() => {
    const url = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
    return `${url}/functions/v1/spotify-proxy`;
  }, []);

  const getAnonKey = useCallback(() => {
    return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }, []);

  // ── Token refresh ──────────────────────────────────────────────────────
  const refreshToken = useCallback(async (): Promise<string | null> => {
    const tokens = tokensRef.current;
    if (!tokens?.refresh_token) return null;

    try {
      const res = await fetch(getEdgeFunctionUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': getAnonKey(),
          'Authorization': `Bearer ${getAnonKey()}`,
        },
        body: JSON.stringify({
          action: 'token_refresh',
          refresh_token: tokens.refresh_token,
        }),
      });

      if (!res.ok) {
        console.error('[Spotify] Token refresh failed');
        clearTokens();
        setStatus('disconnected');
        return null;
      }

      const data = await res.json();
      const newTokens: SpotifyTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };

      tokensRef.current = newTokens;
      saveTokens(newTokens);
      return data.access_token;
    } catch (err) {
      console.error('[Spotify] Token refresh error:', err);
      return null;
    }
  }, [getEdgeFunctionUrl, getAnonKey]);

  // ── Get valid access token ─────────────────────────────────────────────
  const getValidToken = useCallback(async (): Promise<string | null> => {
    const tokens = tokensRef.current;
    if (!tokens) return null;

    // Check if token is still valid (with 5 min buffer)
    if (tokens.expires_at > Date.now() + 5 * 60 * 1000) {
      return tokens.access_token;
    }

    // Token expired or about to expire → refresh
    return refreshToken();
  }, [refreshToken]);

  // ── Initialize player ──────────────────────────────────────────────────
  const initializePlayer = useCallback(async () => {
    try {
      setStatus('connecting');
      await loadSpotifySdk();

      if (!window.Spotify) {
        throw new Error('Spotify SDK not available');
      }

      const player = new window.Spotify.Player({
        name: 'FitBuddy Workout',
        getOAuthToken: async (cb) => {
          const token = await getValidToken();
          if (token) cb(token);
        },
        volume: 0.7,
      });

      // ── Event listeners ────────────────────────────────────────────
      player.addListener('ready', ({ device_id }) => {
        console.log('[Spotify] Player ready, device:', device_id);
        setDeviceId(device_id);
        setStatus('ready');
        setError(null);
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.warn('[Spotify] Device not ready:', device_id);
        setStatus('disconnected');
      });

      player.addListener('player_state_changed', (state) => {
        if (!state) {
          setCurrentTrack(null);
          return;
        }

        const track = state.track_window.current_track;
        setCurrentTrack({
          name: track.name,
          artist: track.artists.map(a => a.name).join(', '),
          albumArt: track.album.images[0]?.url ?? '',
          durationMs: track.duration_ms,
          positionMs: state.position,
        });

        setStatus(state.paused ? 'paused' : 'playing');
      });

      player.addListener('initialization_error', ({ message }) => {
        console.error('[Spotify] Init error:', message);
        setError(message);
        setStatus('error');
      });

      player.addListener('authentication_error', ({ message }) => {
        console.error('[Spotify] Auth error:', message);
        setError(message);
        clearTokens();
        setStatus('disconnected');
      });

      player.addListener('account_error', ({ message }) => {
        console.error('[Spotify] Account error (Premium required?):', message);
        setError(message);
        setStatus('error');
      });

      const connected = await player.connect();
      if (!connected) {
        throw new Error('Failed to connect to Spotify');
      }

      playerRef.current = player;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Spotify connection failed';
      setError(msg);
      setStatus('error');
    }
  }, [getValidToken]);

  // ── OAuth flow: Start ──────────────────────────────────────────────────
  const connect = useCallback(() => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    if (!clientId) {
      setError('VITE_SPOTIFY_CLIENT_ID not configured');
      return;
    }

    const redirectUri = `${window.location.origin}/spotify/callback`;
    const state = crypto.randomUUID();
    sessionStorage.setItem('spotify-oauth-state', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: SCOPES,
      redirect_uri: redirectUri,
      state,
      show_dialog: 'false',
    });

    // Open in popup (not full redirect, so workout isn't interrupted)
    const width = 450;
    const height = 700;
    const left = window.screenX + (window.innerWidth - width) / 2;
    const top = window.screenY + (window.innerHeight - height) / 2;

    window.open(
      `https://accounts.spotify.com/authorize?${params}`,
      'spotify-auth',
      `width=${width},height=${height},left=${left},top=${top}`,
    );
  }, []);

  // ── OAuth flow: Handle callback ────────────────────────────────────────
  const handleCallback = useCallback(async (code: string, state: string): Promise<boolean> => {
    const savedState = sessionStorage.getItem('spotify-oauth-state');
    if (state !== savedState) {
      setError('OAuth state mismatch');
      return false;
    }
    sessionStorage.removeItem('spotify-oauth-state');

    try {
      setStatus('connecting');

      const redirectUri = `${window.location.origin}/spotify/callback`;
      const res = await fetch(getEdgeFunctionUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': getAnonKey(),
          'Authorization': `Bearer ${getAnonKey()}`,
        },
        body: JSON.stringify({
          action: 'token_exchange',
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details ?? data.error ?? 'Token exchange failed');
      }

      const data = await res.json();
      const tokens: SpotifyTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };

      tokensRef.current = tokens;
      saveTokens(tokens);

      // Initialize the player with the new tokens
      await initializePlayer();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Spotify auth failed';
      setError(msg);
      setStatus('error');
      return false;
    }
  }, [getEdgeFunctionUrl, getAnonKey, initializePlayer]);

  // ── Auto-reconnect if tokens exist ─────────────────────────────────────
  useEffect(() => {
    const tokens = loadTokens();
    if (tokens && tokens.expires_at > Date.now()) {
      tokensRef.current = tokens;
      initializePlayer();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup on unmount ─────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      playerRef.current?.disconnect();
    };
  }, []);

  // ── Playback controls ──────────────────────────────────────────────────
  const play = useCallback(async (spotifyUri?: string) => {
    const token = await getValidToken();
    if (!token || !deviceId) return;

    if (spotifyUri) {
      // Play specific track/playlist via API
      const isPlaylist = spotifyUri.includes(':playlist:');
      const body = isPlaylist
        ? { context_uri: spotifyUri }
        : { uris: [spotifyUri] };

      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } else {
      // Resume
      await playerRef.current?.resume();
    }
  }, [getValidToken, deviceId]);

  const pause = useCallback(async () => {
    await playerRef.current?.pause();
  }, []);

  const togglePlay = useCallback(async () => {
    await playerRef.current?.togglePlay();
  }, []);

  const nextTrack = useCallback(async () => {
    await playerRef.current?.nextTrack();
  }, []);

  const prevTrack = useCallback(async () => {
    await playerRef.current?.previousTrack();
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    await playerRef.current?.setVolume(Math.max(0, Math.min(1, volume / 100)));
  }, []);

  const disconnect = useCallback(() => {
    playerRef.current?.disconnect();
    playerRef.current = null;
    clearTokens();
    setStatus('disconnected');
    setDeviceId(null);
    setCurrentTrack(null);
    setError(null);
  }, []);

  // ── Supabase reference (unused but kept for future DB token storage) ──
  void supabase;

  return {
    status,
    deviceId,
    currentTrack,
    error,
    isConnected: status !== 'disconnected' && status !== 'error',
    isPremium: status !== 'error' || !error?.includes('Premium'),
    // Auth
    connect,
    handleCallback,
    disconnect,
    // Playback
    play,
    pause,
    togglePlay,
    nextTrack,
    prevTrack,
    setVolume,
  };
}
