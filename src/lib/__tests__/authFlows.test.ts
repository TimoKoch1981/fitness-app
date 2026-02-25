import { describe, it, expect } from 'vitest';

// ── Auth State Transitions ──────────────────────────────────────────

type AuthState = 'signed_out' | 'signed_in' | 'token_refreshed' | 'session_expired';

interface AuthEvent {
  from: AuthState;
  to: AuthState;
  trigger: string;
}

const VALID_TRANSITIONS: AuthEvent[] = [
  { from: 'signed_out', to: 'signed_in', trigger: 'login' },
  { from: 'signed_in', to: 'signed_out', trigger: 'logout' },
  { from: 'signed_in', to: 'token_refreshed', trigger: 'token_refresh' },
  { from: 'token_refreshed', to: 'signed_in', trigger: 'refresh_complete' },
  { from: 'signed_in', to: 'session_expired', trigger: 'jwt_expired' },
  { from: 'session_expired', to: 'signed_out', trigger: 'redirect_login' },
  { from: 'session_expired', to: 'signed_in', trigger: 'token_refresh' },
];

function isValidTransition(from: AuthState, to: AuthState): boolean {
  return VALID_TRANSITIONS.some(t => t.from === from && t.to === to);
}

describe('Auth state transitions', () => {
  it('allows login from signed_out', () => {
    expect(isValidTransition('signed_out', 'signed_in')).toBe(true);
  });

  it('allows logout from signed_in', () => {
    expect(isValidTransition('signed_in', 'signed_out')).toBe(true);
  });

  it('allows token refresh from signed_in', () => {
    expect(isValidTransition('signed_in', 'token_refreshed')).toBe(true);
  });

  it('allows session expiry from signed_in', () => {
    expect(isValidTransition('signed_in', 'session_expired')).toBe(true);
  });

  it('allows redirect to login from expired', () => {
    expect(isValidTransition('session_expired', 'signed_out')).toBe(true);
  });

  it('allows re-auth from expired', () => {
    expect(isValidTransition('session_expired', 'signed_in')).toBe(true);
  });

  it('disallows direct signed_out to token_refreshed', () => {
    expect(isValidTransition('signed_out', 'token_refreshed')).toBe(false);
  });

  it('disallows direct signed_out to session_expired', () => {
    expect(isValidTransition('signed_out', 'session_expired')).toBe(false);
  });
});

// ── JWT Expiry Detection ──────────────────────────────────────────

describe('JWT expiry detection', () => {
  function isTokenExpired(exp: number, nowSeconds?: number): boolean {
    const now = nowSeconds ?? Math.floor(Date.now() / 1000);
    return now >= exp;
  }

  it('detects expired token', () => {
    const exp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    expect(isTokenExpired(exp)).toBe(true);
  });

  it('detects valid token', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    expect(isTokenExpired(exp)).toBe(false);
  });

  it('detects token expiring now', () => {
    const now = 1000;
    expect(isTokenExpired(1000, now)).toBe(true);
  });

  it('detects token with 1 second left', () => {
    const now = 999;
    expect(isTokenExpired(1000, now)).toBe(false);
  });
});

// ── Protected Route Logic ──────────────────────────────────────────

describe('Protected route logic', () => {
  interface RouteCheck {
    isAuthenticated: boolean;
    isAdmin: boolean;
    isLoading: boolean;
  }

  function resolveRoute(check: RouteCheck, requireAdmin: boolean): 'render' | 'redirect_login' | 'redirect_home' | 'loading' {
    if (check.isLoading) return 'loading';
    if (!check.isAuthenticated) return 'redirect_login';
    if (requireAdmin && !check.isAdmin) return 'redirect_home';
    return 'render';
  }

  it('renders for authenticated user', () => {
    expect(resolveRoute({ isAuthenticated: true, isAdmin: false, isLoading: false }, false)).toBe('render');
  });

  it('redirects unauthenticated to login', () => {
    expect(resolveRoute({ isAuthenticated: false, isAdmin: false, isLoading: false }, false)).toBe('redirect_login');
  });

  it('shows loading when auth is pending', () => {
    expect(resolveRoute({ isAuthenticated: false, isAdmin: false, isLoading: true }, false)).toBe('loading');
  });

  it('renders admin page for admin user', () => {
    expect(resolveRoute({ isAuthenticated: true, isAdmin: true, isLoading: false }, true)).toBe('render');
  });

  it('redirects non-admin from admin page', () => {
    expect(resolveRoute({ isAuthenticated: true, isAdmin: false, isLoading: false }, true)).toBe('redirect_home');
  });

  it('redirects unauthenticated from admin page to login', () => {
    expect(resolveRoute({ isAuthenticated: false, isAdmin: false, isLoading: false }, true)).toBe('redirect_login');
  });
});
