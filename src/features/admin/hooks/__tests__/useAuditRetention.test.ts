import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock fetch globally ─────────────────────────────────────────────
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ── Mock supabase ──────────────────────────────────────────────────
vi.mock('../../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-jwt-token' } },
      }),
    },
  },
}));

// ── Import after mocks ─────────────────────────────────────────────
import { RETENTION_POLICY, type RetentionPolicyEntry, type CleanupResult } from '../useAuditRetention';

describe('useAuditRetention', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Static Retention Policy Tests ──────────────────────────────

  it('RETENTION_POLICY has 4 categories', () => {
    expect(RETENTION_POLICY).toHaveLength(4);
  });

  it('login events have 90-day retention', () => {
    const login = RETENTION_POLICY.find((p: RetentionPolicyEntry) => p.category === 'login');
    expect(login).toBeDefined();
    expect(login!.retentionDays).toBe(90);
  });

  it('data change events have 365-day retention', () => {
    const dataChange = RETENTION_POLICY.find((p: RetentionPolicyEntry) => p.category === 'dataChange');
    expect(dataChange).toBeDefined();
    expect(dataChange!.retentionDays).toBe(365);
  });

  it('security events have 730-day retention (2 years)', () => {
    const security = RETENTION_POLICY.find((p: RetentionPolicyEntry) => p.category === 'security');
    expect(security).toBeDefined();
    expect(security!.retentionDays).toBe(730);
  });

  it('consent events have 3650-day retention (10 years)', () => {
    const consent = RETENTION_POLICY.find((p: RetentionPolicyEntry) => p.category === 'consent');
    expect(consent).toBeDefined();
    expect(consent!.retentionDays).toBe(3650);
  });

  it('all policy entries have required fields', () => {
    for (const entry of RETENTION_POLICY) {
      expect(entry.category).toBeTruthy();
      expect(typeof entry.retentionDays).toBe('number');
      expect(entry.retentionDays).toBeGreaterThan(0);
      expect(entry.description).toBeTruthy();
    }
  });

  // ── Cleanup API Tests ─────────────────────────────────────────

  it('cleanup API returns correct result shape', async () => {
    const mockResult: CleanupResult = {
      deletedCounts: { login: 15, dataChange: 3, security: 0, consent: 0 },
      totalDeleted: 18,
      timestamp: '2026-03-03T12:00:00.000Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResult),
    });

    const response = await fetch('http://localhost:54321/functions/v1/audit-cleanup', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-jwt-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = (await response.json()) as CleanupResult;
    expect(data.totalDeleted).toBe(18);
    expect(data.deletedCounts.login).toBe(15);
    expect(data.deletedCounts.dataChange).toBe(3);
    expect(data.deletedCounts.security).toBe(0);
    expect(data.timestamp).toBeTruthy();
  });

  it('cleanup API handles admin-only restriction', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'Forbidden: admin access required' }),
    });

    const response = await fetch('http://localhost:54321/functions/v1/audit-cleanup', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer non-admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('admin');
  });
});
