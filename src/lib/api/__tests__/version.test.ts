import { describe, it, expect } from 'vitest';
import {
  API_VERSION,
  API_BASE_PATH,
  getApiUrl,
  isDeprecated,
  getLatestVersion,
  isSupported,
  API_VERSION_HEADER,
  DEPRECATION_HEADER,
} from '../version';
import { addVersionHeaders, checkDeprecation } from '../apiClient';

// ── version constants ────────────────────────────────────────────────────

describe('API version constants', () => {
  it('exports a valid API_VERSION string', () => {
    expect(API_VERSION).toBe('v1');
  });

  it('builds API_BASE_PATH from version', () => {
    expect(API_BASE_PATH).toBe('/api/v1');
  });

  it('exports header name constants', () => {
    expect(API_VERSION_HEADER).toBe('X-API-Version');
    expect(DEPRECATION_HEADER).toBe('X-Deprecated');
  });
});

// ── getApiUrl() ──────────────────────────────────────────────────────────

describe('getApiUrl()', () => {
  it('builds a versioned URL from a path with leading slash', () => {
    expect(getApiUrl('/meals')).toBe('/api/v1/meals');
  });

  it('builds a versioned URL from a path without leading slash', () => {
    expect(getApiUrl('meals')).toBe('/api/v1/meals');
  });

  it('handles nested paths', () => {
    expect(getApiUrl('/users/123/meals')).toBe('/api/v1/users/123/meals');
  });
});

// ── isDeprecated() ───────────────────────────────────────────────────────

describe('isDeprecated()', () => {
  it('returns false for current version', () => {
    expect(isDeprecated('v1')).toBe(false);
  });

  it('returns false for unknown versions', () => {
    expect(isDeprecated('v99')).toBe(false);
  });
});

// ── getLatestVersion() ───────────────────────────────────────────────────

describe('getLatestVersion()', () => {
  it('returns v1 as the latest version', () => {
    expect(getLatestVersion()).toBe('v1');
  });
});

// ── isSupported() ────────────────────────────────────────────────────────

describe('isSupported()', () => {
  it('returns true for v1', () => {
    expect(isSupported('v1')).toBe(true);
  });

  it('returns false for unsupported versions', () => {
    expect(isSupported('v99')).toBe(false);
  });
});

// ── addVersionHeaders() ─────────────────────────────────────────────────

describe('addVersionHeaders()', () => {
  it('adds version headers to empty object', () => {
    const result = addVersionHeaders();
    expect(result['X-API-Version']).toBe('v1');
    expect(result['X-Client-Version']).toBeDefined();
  });

  it('preserves existing headers', () => {
    const result = addVersionHeaders({ 'Content-Type': 'application/json' });
    expect(result['Content-Type']).toBe('application/json');
    expect(result['X-API-Version']).toBe('v1');
  });
});

// ── checkDeprecation() ──────────────────────────────────────────────────

describe('checkDeprecation()', () => {
  it('returns null when no deprecation header is present', () => {
    const headers = new Headers();
    expect(checkDeprecation(headers)).toBeNull();
  });

  it('returns deprecation message from Headers object', () => {
    const headers = new Headers();
    headers.set('X-Deprecated', 'v1 will be removed on 2027-01-01');
    expect(checkDeprecation(headers)).toBe('v1 will be removed on 2027-01-01');
  });

  it('returns deprecation message from plain object', () => {
    const headers = { 'X-Deprecated': 'v1 ending soon' };
    expect(checkDeprecation(headers)).toBe('v1 ending soon');
  });

  it('returns null from plain object without deprecation', () => {
    const headers = { 'Content-Type': 'application/json' };
    expect(checkDeprecation(headers)).toBeNull();
  });
});
