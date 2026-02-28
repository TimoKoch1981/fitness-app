/**
 * YouTube IFrame Player API — TypeScript Declarations
 *
 * The YouTube IFrame API lets you embed a YouTube video player on your page
 * and control the player using JavaScript. These declarations cover the
 * full public API surface used by FitBuddy training videos.
 *
 * @see https://developers.google.com/youtube/iframe_api_reference
 */

declare namespace YT {
  // ---------------------------------------------------------------------------
  // Player States
  // ---------------------------------------------------------------------------

  /** Enumeration of possible player states returned by getPlayerState(). */
  enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }

  // ---------------------------------------------------------------------------
  // Event Interfaces
  // ---------------------------------------------------------------------------

  /** Base event passed to all player event callbacks. */
  interface PlayerEvent {
    target: Player;
  }

  /** Event passed to the onStateChange callback. */
  interface OnStateChangeEvent {
    target: Player;
    data: PlayerState;
  }

  /** Event passed to the onError callback. */
  interface OnErrorEvent {
    target: Player;
    /**
     * Error codes:
     *   2   – Invalid parameter value
     *   5   – HTML5 player error
     *   100 – Video not found / removed
     *   101 – Video owner does not allow embedded playback
     *   150 – Same as 101
     */
    data: number;
  }

  /** Event passed to the onPlaybackQualityChange callback. */
  interface OnPlaybackQualityChangeEvent {
    target: Player;
    data: string;
  }

  /** Event passed to the onPlaybackRateChange callback. */
  interface OnPlaybackRateChangeEvent {
    target: Player;
    data: number;
  }

  // ---------------------------------------------------------------------------
  // Configuration Interfaces
  // ---------------------------------------------------------------------------

  /** Player embed parameters (passed as playerVars in PlayerOptions). */
  interface PlayerVars {
    /** Auto-play the video on load (0 or 1). Default: 0. */
    autoplay?: 0 | 1;
    /** Show player controls (0, 1, or 2). Default: 1. */
    controls?: 0 | 1 | 2;
    /** Loop the video (0 or 1). Default: 0. */
    loop?: 0 | 1;
    /** Comma-separated list of video IDs to play (required when loop=1). */
    playlist?: string;
    /** Show related videos (0 or 1). Default: 1. */
    rel?: 0 | 1;
    /** Hide the YouTube logo in the control bar (0 or 1). Default: 0. */
    modestbranding?: 0 | 1;
    /** Enable the JS API (0 or 1). Default: 0. */
    enablejsapi?: 0 | 1;
    /** Origin domain for additional security. */
    origin?: string;
    /** Mute the video on load (0 or 1). Default: 0. */
    mute?: 0 | 1;
    /** Start playback at the given number of seconds. */
    start?: number;
    /** Stop playback at the given number of seconds. */
    end?: number;
    /** Type of content feed: 'playlist', 'search', or 'user_uploads'. */
    listType?: 'playlist' | 'search' | 'user_uploads';
    /** List request identifier (playlist ID, search query, or channel name). */
    list?: string;
    /** Display closed captions by default (0 or 1). Default: 0. */
    cc_load_policy?: 0 | 1;
    /** Default language for captions (ISO 639-1 code). */
    cc_lang_pref?: string;
    /** Color of the progress bar ('red' or 'white'). Default: 'red'. */
    color?: 'red' | 'white';
    /** Disable keyboard controls (0 or 1). Default: 0. */
    disablekb?: 0 | 1;
    /** Allow fullscreen (0 or 1). Default: 1. */
    fs?: 0 | 1;
    /** Interface language (ISO 639-1 code). */
    hl?: string;
    /** Show video annotations (1 or 3). Default: 1. */
    iv_load_policy?: 1 | 3;
    /** Play inline on iOS (0 or 1). Default: 0. */
    playsinline?: 0 | 1;
  }

  /** Event handler map passed in PlayerOptions.events. */
  interface Events {
    /** Fired when the player has finished loading and is ready. */
    onReady?: (event: PlayerEvent) => void;
    /** Fired when the player's state changes. */
    onStateChange?: (event: OnStateChangeEvent) => void;
    /** Fired when an error occurs. */
    onError?: (event: OnErrorEvent) => void;
    /** Fired when the playback quality changes. */
    onPlaybackQualityChange?: (event: OnPlaybackQualityChangeEvent) => void;
    /** Fired when the playback rate changes. */
    onPlaybackRateChange?: (event: OnPlaybackRateChangeEvent) => void;
    /** Fired when the API module for the player is ready. */
    onApiChange?: (event: PlayerEvent) => void;
  }

  /** Options passed to the YT.Player constructor. */
  interface PlayerOptions {
    /** Width of the player in pixels or as a CSS string. */
    width?: number | string;
    /** Height of the player in pixels or as a CSS string. */
    height?: number | string;
    /** YouTube video ID to load. */
    videoId?: string;
    /** Player embed parameters. */
    playerVars?: PlayerVars;
    /** Event handlers. */
    events?: Events;
    /** Host URL (e.g. 'https://www.youtube-nocookie.com' for privacy mode). */
    host?: string;
  }

  // ---------------------------------------------------------------------------
  // Player Class
  // ---------------------------------------------------------------------------

  /** The main YouTube IFrame Player class. */
  class Player {
    /**
     * Create a new YouTube player.
     *
     * @param elementId - DOM element ID or HTMLElement to replace with the player iframe.
     * @param options   - Player configuration options.
     */
    constructor(elementId: string | HTMLElement, options?: PlayerOptions);

    // -- Playback Controls --------------------------------------------------

    /** Play the currently cued/loaded video. */
    playVideo(): void;
    /** Pause the currently playing video. */
    pauseVideo(): void;
    /** Stop and reset the video. */
    stopVideo(): void;
    /**
     * Seek to the specified time in seconds.
     * @param seconds        - Target time in seconds.
     * @param allowSeekAhead - Whether to make a new request if the seek point
     *                         is beyond the currently buffered data.
     */
    seekTo(seconds: number, allowSeekAhead?: boolean): void;

    // -- Volume Controls ----------------------------------------------------

    /** Set the player volume (0–100). */
    setVolume(volume: number): void;
    /** Get the current player volume (0–100). */
    getVolume(): number;
    /** Mute the player. */
    mute(): void;
    /** Unmute the player. */
    unMute(): void;
    /** Whether the player is muted. */
    isMuted(): boolean;

    // -- Player State -------------------------------------------------------

    /** Get the current player state. */
    getPlayerState(): PlayerState;
    /** Get the elapsed time in seconds since the video started playing. */
    getCurrentTime(): number;
    /** Get the total duration of the video in seconds. */
    getDuration(): number;

    // -- Video Information --------------------------------------------------

    /** Get the YouTube URL for the currently loaded video. */
    getVideoUrl(): string;
    /** Get the embed code for the currently loaded video. */
    getVideoEmbedCode(): string;

    // -- Playback Quality & Rate --------------------------------------------

    /** Get the current playback quality (e.g. 'hd720', 'large'). */
    getPlaybackQuality(): string;
    /** Set the suggested playback quality. */
    setPlaybackQuality(quality: string): void;
    /** Get the set of available quality levels. */
    getAvailableQualityLevels(): string[];
    /** Get the current playback rate. */
    getPlaybackRate(): number;
    /** Set the playback rate (e.g. 0.5, 1, 1.5, 2). */
    setPlaybackRate(rate: number): void;
    /** Get the set of available playback rates. */
    getAvailablePlaybackRates(): number[];

    // -- Video Loading ------------------------------------------------------

    /**
     * Load and play a video by ID.
     * @param videoId     - YouTube video ID.
     * @param startSeconds - Optional start time in seconds.
     */
    loadVideoById(videoId: string, startSeconds?: number): void;
    /**
     * Cue a video by ID without auto-playing.
     * @param videoId     - YouTube video ID.
     * @param startSeconds - Optional start time in seconds.
     */
    cueVideoById(videoId: string, startSeconds?: number): void;

    // -- Player Element -----------------------------------------------------

    /** Get the DOM element containing the player iframe. */
    getIframe(): HTMLIFrameElement;
    /** Remove the player iframe and all associated event listeners. */
    destroy(): void;

    // -- Size ---------------------------------------------------------------

    /** Set the width and height of the player. */
    setSize(width: number, height: number): void;
  }
}

// ---------------------------------------------------------------------------
// Window augmentation
// ---------------------------------------------------------------------------

interface Window {
  /** The YouTube IFrame API namespace, available after the API script loads. */
  YT?: typeof YT;
  /**
   * Global callback invoked by the YouTube IFrame API script when it has
   * finished loading. Assign a function to this property before loading
   * the API script tag.
   */
  onYouTubeIframeAPIReady?: () => void;
}
