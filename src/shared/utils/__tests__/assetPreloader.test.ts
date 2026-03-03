/**
 * Tests for assetPreloader — preload link creation, duplicate prevention,
 * route preloading, and critical asset preloading.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  preloadAsset,
  preloadRoute,
  preloadCriticalAssets,
  isPrecached,
  _resetPreloadState,
} from '../assetPreloader';

// ── helpers ──────────────────────────────────────────────────────────────

function getPreloadLinks(): HTMLLinkElement[] {
  return Array.from(document.head.querySelectorAll('link[rel="preload"], link[rel="modulepreload"]'));
}

function getAllLinks(): HTMLLinkElement[] {
  return Array.from(document.head.querySelectorAll('link'));
}

// ── setup / teardown ────────────────────────────────────────────────────

beforeEach(() => {
  _resetPreloadState();
  // Remove all <link> tags injected during previous test
  document.head.querySelectorAll('link').forEach((el) => el.remove());
});

afterEach(() => {
  _resetPreloadState();
  document.head.querySelectorAll('link').forEach((el) => el.remove());
});

// ── preloadAsset ────────────────────────────────────────────────────────

describe('preloadAsset', () => {
  it('creates a preload link for a CSS file', () => {
    preloadAsset('/assets/style-abc123.css', 'style');

    const links = getPreloadLinks();
    expect(links).toHaveLength(1);
    expect(links[0].rel).toBe('preload');
    expect(links[0].href).toContain('/assets/style-abc123.css');
    expect(links[0].getAttribute('as')).toBe('style');
  });

  it('creates a modulepreload link for a JS file', () => {
    preloadAsset('/assets/chunk-xyz.js', 'script');

    const links = getPreloadLinks();
    expect(links).toHaveLength(1);
    expect(links[0].rel).toBe('modulepreload');
    expect(links[0].href).toContain('/assets/chunk-xyz.js');
    // modulepreload does not need an "as" attribute
    expect(links[0].getAttribute('as')).toBeNull();
  });

  it('sets crossOrigin when provided', () => {
    preloadAsset('/fonts/inter.woff2', 'font', { crossOrigin: 'anonymous', type: 'font/woff2' });

    const links = getPreloadLinks();
    expect(links).toHaveLength(1);
    expect(links[0].crossOrigin).toBe('anonymous');
    expect(links[0].type).toBe('font/woff2');
  });

  it('prevents duplicate preload links for the same href', () => {
    preloadAsset('/assets/dup.css', 'style');
    preloadAsset('/assets/dup.css', 'style');

    const links = getPreloadLinks();
    expect(links).toHaveLength(1);
  });

  it('marks the asset as precached after preloading', () => {
    expect(isPrecached('/assets/new.js')).toBe(false);
    preloadAsset('/assets/new.js', 'script');
    expect(isPrecached('/assets/new.js')).toBe(true);
  });
});

// ── preloadRoute ────────────────────────────────────────────────────────

describe('preloadRoute', () => {
  it('does not throw for a known route', () => {
    // The dynamic import will be intercepted by Vite/test runner but
    // the function itself should not throw synchronously.
    expect(() => preloadRoute('cockpit')).not.toThrow();
  });

  it('silently ignores unknown route names', () => {
    expect(() => preloadRoute('nonexistent')).not.toThrow();
  });

  it('does not trigger the import twice for the same route', () => {
    // First call triggers the import, second should be a no-op
    preloadRoute('nutrition');
    preloadRoute('nutrition');
    // isPrecached tracks the route key
    expect(isPrecached('route:nutrition')).toBe(true);
  });
});

// ── preloadCriticalAssets ───────────────────────────────────────────────

describe('preloadCriticalAssets', () => {
  it('injects preconnect and dns-prefetch links', () => {
    preloadCriticalAssets();

    const links = getAllLinks();
    const rels = links.map((l) => l.rel);
    expect(rels).toContain('preconnect');
    expect(rels).toContain('dns-prefetch');
  });

  it('does not create duplicate links on repeated calls', () => {
    preloadCriticalAssets();
    const countBefore = getAllLinks().length;

    preloadCriticalAssets();
    const countAfter = getAllLinks().length;

    expect(countAfter).toBe(countBefore);
  });
});
