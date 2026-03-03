/**
 * useRoutePreloader — predictive route preloading based on current location.
 *
 * When a user lands on a page, this hook preloads the chunks for the routes
 * they are most likely to navigate to next.  Loading is deferred via
 * `requestIdleCallback` (with a `setTimeout` fallback) so it never blocks
 * user interaction.
 *
 * Navigation adjacency map (matches the 5 bottom-nav items):
 *   Cockpit   -> Nutrition, Training
 *   Nutrition -> Cockpit, Training
 *   Training  -> Nutrition, Medical
 *   Medical   -> Training, Profile
 *   Profile   -> Medical, Cockpit
 *   Buddy     -> Cockpit, Nutrition
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { preloadRoute } from '../utils/assetPreloader';

/** Map of pathname -> adjacent routes that are likely next navigations. */
const ADJACENCY_MAP: Record<string, string[]> = {
  '/cockpit': ['nutrition', 'training'],
  '/nutrition': ['cockpit', 'training'],
  '/training': ['nutrition', 'medical'],
  '/medical': ['training', 'profile'],
  '/profile': ['medical', 'cockpit'],
  '/buddy': ['cockpit', 'nutrition'],
};

/**
 * Schedule a callback during idle time.
 * Falls back to `setTimeout(cb, 1)` in environments without
 * `requestIdleCallback` (e.g. Safari < 17, test runners).
 */
function scheduleIdle(cb: () => void): void {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(cb);
  } else {
    setTimeout(cb, 1);
  }
}

/**
 * Hook: call once in the component tree that lives inside `<BrowserRouter>`.
 * It watches `location.pathname` and preloads the predicted next routes
 * during idle time.
 */
export function useRoutePreloader(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    const targets = ADJACENCY_MAP[pathname];
    if (!targets || targets.length === 0) return;

    scheduleIdle(() => {
      for (const route of targets) {
        preloadRoute(route);
      }
    });
  }, [pathname]);
}
