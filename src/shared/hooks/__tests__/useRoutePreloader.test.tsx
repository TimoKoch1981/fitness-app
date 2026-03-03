/**
 * Tests for useRoutePreloader — predictive preloading of adjacent route chunks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useRoutePreloader } from '../useRoutePreloader';
import { _resetPreloadState, isPrecached } from '../../utils/assetPreloader';

// ── helpers ──────────────────────────────────────────────────────────────

/** Wrapper that provides a MemoryRouter with a specific initial path. */
function createWrapper(initialPath: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialPath]}>
        {children}
      </MemoryRouter>
    );
  };
}

// ── setup / teardown ────────────────────────────────────────────────────

let idleCallbacks: (() => void)[] = [];

beforeEach(() => {
  _resetPreloadState();
  idleCallbacks = [];

  // Mock requestIdleCallback to capture and manually run callbacks
  vi.stubGlobal('requestIdleCallback', (cb: () => void) => {
    idleCallbacks.push(cb);
    return idleCallbacks.length;
  });
});

afterEach(() => {
  _resetPreloadState();
  vi.restoreAllMocks();
});

// ── tests ───────────────────────────────────────────────────────────────

describe('useRoutePreloader', () => {
  it('schedules preload via requestIdleCallback on /cockpit', () => {
    renderHook(() => useRoutePreloader(), {
      wrapper: createWrapper('/cockpit'),
    });

    // Should have enqueued an idle callback
    expect(idleCallbacks).toHaveLength(1);
  });

  it('preloads nutrition and training when on /cockpit', () => {
    renderHook(() => useRoutePreloader(), {
      wrapper: createWrapper('/cockpit'),
    });

    // Execute the idle callback
    idleCallbacks.forEach((cb) => cb());

    expect(isPrecached('route:nutrition')).toBe(true);
    expect(isPrecached('route:training')).toBe(true);
  });

  it('preloads training and profile when on /medical', () => {
    renderHook(() => useRoutePreloader(), {
      wrapper: createWrapper('/medical'),
    });

    idleCallbacks.forEach((cb) => cb());

    expect(isPrecached('route:training')).toBe(true);
    expect(isPrecached('route:profile')).toBe(true);
  });

  it('does nothing for routes not in the adjacency map', () => {
    renderHook(() => useRoutePreloader(), {
      wrapper: createWrapper('/login'),
    });

    // No idle callback should be scheduled for unknown routes
    expect(idleCallbacks).toHaveLength(0);
  });

  it('uses setTimeout fallback when requestIdleCallback is unavailable', () => {
    // Remove requestIdleCallback
    vi.stubGlobal('requestIdleCallback', undefined);
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    renderHook(() => useRoutePreloader(), {
      wrapper: createWrapper('/cockpit'),
    });

    // Should have fallen back to setTimeout
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1);
  });

  it('preloads cockpit and nutrition when on /buddy', () => {
    renderHook(() => useRoutePreloader(), {
      wrapper: createWrapper('/buddy'),
    });

    idleCallbacks.forEach((cb) => cb());

    expect(isPrecached('route:cockpit')).toBe(true);
    expect(isPrecached('route:nutrition')).toBe(true);
  });
});
