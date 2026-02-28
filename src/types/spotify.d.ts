/**
 * TypeScript declarations for Spotify Web Playback SDK.
 * @see https://developer.spotify.com/documentation/web-playback-sdk/reference
 */

declare namespace Spotify {
  interface Player {
    new (options: PlayerOptions): Player;

    connect(): Promise<boolean>;
    disconnect(): void;

    addListener(event: 'ready', callback: (data: { device_id: string }) => void): boolean;
    addListener(event: 'not_ready', callback: (data: { device_id: string }) => void): boolean;
    addListener(event: 'player_state_changed', callback: (state: PlaybackState | null) => void): boolean;
    addListener(event: 'initialization_error', callback: (error: { message: string }) => void): boolean;
    addListener(event: 'authentication_error', callback: (error: { message: string }) => void): boolean;
    addListener(event: 'account_error', callback: (error: { message: string }) => void): boolean;
    addListener(event: string, callback: (...args: unknown[]) => void): boolean;

    removeListener(event: string, callback?: (...args: unknown[]) => void): boolean;

    getCurrentState(): Promise<PlaybackState | null>;

    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;

    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(positionMs: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;

    activateElement(): Promise<void>;
  }

  interface PlayerOptions {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume?: number;
  }

  interface PlaybackState {
    context: {
      uri: string | null;
      metadata: Record<string, string>;
    };
    disallows: {
      pausing?: boolean;
      peeking_next?: boolean;
      peeking_prev?: boolean;
      resuming?: boolean;
      seeking?: boolean;
      skipping_next?: boolean;
      skipping_prev?: boolean;
    };
    duration: number;
    paused: boolean;
    position: number;
    repeat_mode: number;
    shuffle: boolean;
    track_window: {
      current_track: Track;
      next_tracks: Track[];
      previous_tracks: Track[];
    };
  }

  interface Track {
    uri: string;
    id: string;
    type: 'track' | 'episode' | 'ad';
    media_type: 'audio' | 'video';
    name: string;
    is_playable: boolean;
    album: {
      uri: string;
      name: string;
      images: Array<{ url: string; height: number; width: number }>;
    };
    artists: Array<{
      uri: string;
      name: string;
    }>;
    duration_ms: number;
  }
}

interface Window {
  Spotify?: typeof Spotify;
  onSpotifyWebPlaybackSDKReady?: () => void;
}
