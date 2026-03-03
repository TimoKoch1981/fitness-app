/**
 * Cache-Control header constants — reference for the Caddy reverse-proxy
 * configuration on the Hetzner VPS.
 *
 * These values are NOT applied by the frontend itself; they document the
 * recommended headers that Caddy should send for each asset type.
 * See docs/CDN_CACHE_CONFIG.md for the corresponding Caddyfile snippet.
 */

export interface CachePolicy {
  /** Human-readable description of the asset category. */
  description: string;
  /** Glob pattern matching the assets in Caddy's file_server. */
  pattern: string;
  /** Recommended Cache-Control header value. */
  cacheControl: string;
  /** Max-age in seconds (for quick reference). */
  maxAgeSeconds: number;
}

/**
 * CACHE_POLICIES — one entry per asset category.
 *
 * Hashed assets (JS, CSS) produced by Vite have content-hash filenames and
 * can be cached indefinitely (`immutable`).  `index.html` must always be
 * revalidated so the browser picks up new hashes.
 */
export const CACHE_POLICIES: Record<string, CachePolicy> = {
  /** Vite-hashed JS bundles in /assets/*.js */
  hashedJs: {
    description: 'Hashed JavaScript bundles (Vite output)',
    pattern: '/assets/*.js',
    cacheControl: 'public, max-age=31536000, immutable',
    maxAgeSeconds: 31_536_000, // 1 year
  },

  /** Vite-hashed CSS bundles in /assets/*.css */
  hashedCss: {
    description: 'Hashed CSS bundles (Vite output)',
    pattern: '/assets/*.css',
    cacheControl: 'public, max-age=31536000, immutable',
    maxAgeSeconds: 31_536_000,
  },

  /** index.html — entry point, must always revalidate */
  html: {
    description: 'HTML entry point (index.html)',
    pattern: '/index.html',
    cacheControl: 'no-cache, must-revalidate',
    maxAgeSeconds: 0,
  },

  /** Static images (icons, photos) */
  images: {
    description: 'Static images (PNG, SVG, WebP, JPEG)',
    pattern: '/assets/*.{png,svg,webp,jpg,jpeg,gif,ico}',
    cacheControl: 'public, max-age=86400',
    maxAgeSeconds: 86_400, // 1 day
  },

  /** Web fonts */
  fonts: {
    description: 'Web fonts (WOFF2, WOFF)',
    pattern: '/assets/*.{woff2,woff}',
    cacheControl: 'public, max-age=31536000, immutable',
    maxAgeSeconds: 31_536_000,
  },

  /** API responses — never cache in browser (Supabase handles its own ETags) */
  api: {
    description: 'API responses (REST, Edge Functions)',
    pattern: '/rest/v1/*, /functions/v1/*',
    cacheControl: 'no-store',
    maxAgeSeconds: 0,
  },

  /** Service worker — must always revalidate */
  serviceWorker: {
    description: 'Service Worker script',
    pattern: '/sw.js',
    cacheControl: 'no-cache, must-revalidate',
    maxAgeSeconds: 0,
  },

  /** PWA manifest */
  manifest: {
    description: 'PWA manifest',
    pattern: '/manifest.json',
    cacheControl: 'no-cache, must-revalidate',
    maxAgeSeconds: 0,
  },
} as const;
