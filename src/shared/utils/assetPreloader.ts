/**
 * Asset Preloader — CDN-equivalent optimization for self-hosted Hetzner VPS.
 *
 * Injects `<link rel="preload">` tags to warm the browser cache for critical
 * resources.  Because Vite produces hashed filenames we cannot know the exact
 * URLs at build time, so the route-level preloading relies on dynamic
 * `import()` which Vite already handles.  The critical-asset preloader
 * targets well-known origins (fonts, API) with preconnect / dns-prefetch.
 */

// Track which hrefs have already been preloaded to avoid duplicate <link> tags.
const preloadedSet = new Set<string>();

/**
 * Returns `true` when an href has already been injected as a preload link.
 */
export function isPrecached(href: string): boolean {
  return preloadedSet.has(href);
}

/**
 * Inject a single `<link rel="preload">` (or `modulepreload`) into <head>.
 * Silently skips duplicates.
 */
export function preloadAsset(
  href: string,
  as: 'script' | 'style' | 'font' | 'image' | 'fetch',
  options?: { crossOrigin?: 'anonymous' | 'use-credentials'; type?: string },
): void {
  if (preloadedSet.has(href)) return;
  preloadedSet.add(href);

  const link = document.createElement('link');
  link.rel = as === 'script' ? 'modulepreload' : 'preload';
  link.href = href;
  if (as !== 'script') link.setAttribute('as', as);
  if (options?.crossOrigin) link.crossOrigin = options.crossOrigin;
  if (options?.type) link.type = options.type;

  document.head.appendChild(link);
}

/**
 * Preload critical assets that every page visit needs.
 * Called once after initial render in main.tsx.
 */
export function preloadCriticalAssets(): void {
  // Preconnect to the API origin (Supabase on same host in production)
  injectLink('preconnect', 'https://fudda.de');
  // DNS-prefetch for AI provider (calls go through edge function, but
  // the browser may still benefit from early DNS resolution)
  injectLink('dns-prefetch', 'https://api.openai.com');
}

/**
 * Preload a route's lazy chunk by triggering the same dynamic `import()`
 * that React.lazy uses.  Vite de-duplicates the request so the module is
 * fetched at most once.
 *
 * Supported route names match the page filenames without the "Page" suffix.
 */
const routeImportMap: Record<string, () => Promise<unknown>> = {
  cockpit: () => import('../../pages/CockpitPage'),
  nutrition: () => import('../../pages/NutritionPage'),
  training: () => import('../../pages/TrainingPage'),
  medical: () => import('../../pages/MedicalPage'),
  profile: () => import('../../pages/ProfilePage'),
  buddy: () => import('../../pages/BuddyPage'),
};

export function preloadRoute(routeName: string): void {
  const key = routeName.toLowerCase().replace(/^\//, '');
  const loader = routeImportMap[key];
  if (loader && !preloadedSet.has(`route:${key}`)) {
    preloadedSet.add(`route:${key}`);
    loader().catch(() => {
      // Silently ignore — preload failure is non-critical
    });
  }
}

// ── internal helper ─────────────────────────────────────────────────────

function injectLink(rel: string, href: string): void {
  if (preloadedSet.has(`${rel}:${href}`)) return;
  preloadedSet.add(`${rel}:${href}`);

  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Reset internal tracking — used by tests only.
 */
export function _resetPreloadState(): void {
  preloadedSet.clear();
}
