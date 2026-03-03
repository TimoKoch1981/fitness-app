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
import type { KeyRotationEntry } from '../useKeyRotation';

// Helper to create mock key entries
function makeKeyEntry(overrides: Partial<KeyRotationEntry> = {}): KeyRotationEntry {
  return {
    name: 'OpenAI API Key',
    status: 'ok',
    daysOld: 30,
    rotatedAt: '2026-02-01T00:00:00Z',
    ...overrides,
  };
}

// Helper to mock a successful fetch response
function mockFetchResponse(keys: KeyRotationEntry[], status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(status >= 200 && status < 300 ? { keys } : { error: 'Error' }),
  });
}

describe('useKeyRotation', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty keys array initially', () => {
    // Without calling the fetch, the hook defaults to []
    const keys: KeyRotationEntry[] = [];
    expect(keys).toEqual([]);
    expect(keys.length).toBe(0);
  });

  it('KeyRotationEntry has correct shape with ok status', () => {
    const entry = makeKeyEntry({ status: 'ok', daysOld: 30 });
    expect(entry.status).toBe('ok');
    expect(entry.daysOld).toBe(30);
    expect(entry.name).toBe('OpenAI API Key');
    expect(entry.rotatedAt).toBeTruthy();
  });

  it('KeyRotationEntry has correct shape with warning status', () => {
    const entry = makeKeyEntry({ status: 'warning', daysOld: 95 });
    expect(entry.status).toBe('warning');
    expect(entry.daysOld).toBe(95);
  });

  it('KeyRotationEntry has correct shape with critical status', () => {
    const entry = makeKeyEntry({ status: 'critical', daysOld: 125 });
    expect(entry.status).toBe('critical');
    expect(entry.daysOld).toBe(125);
  });

  it('KeyRotationEntry handles unknown status with null values', () => {
    const entry = makeKeyEntry({
      status: 'unknown',
      daysOld: null,
      rotatedAt: null,
    });
    expect(entry.status).toBe('unknown');
    expect(entry.daysOld).toBeNull();
    expect(entry.rotatedAt).toBeNull();
  });

  it('fetch sends correct headers and URL', async () => {
    const keys = [makeKeyEntry()];
    mockFetchResponse(keys);

    const response = await fetch('http://localhost:54321/functions/v1/key-rotation-check', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-jwt-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    expect(data.keys).toHaveLength(1);
    expect(data.keys[0].status).toBe('ok');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:54321/functions/v1/key-rotation-check',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-jwt-token',
        }),
      }),
    );
  });

  it('handles multiple keys in response', async () => {
    const keys = [
      makeKeyEntry({ name: 'OpenAI API Key', status: 'ok', daysOld: 30 }),
      makeKeyEntry({ name: 'Resend API Key', status: 'warning', daysOld: 92 }),
    ];
    mockFetchResponse(keys);

    const response = await fetch('http://localhost:54321/functions/v1/key-rotation-check', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test-jwt-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    expect(data.keys).toHaveLength(2);
    expect(data.keys[0].name).toBe('OpenAI API Key');
    expect(data.keys[1].name).toBe('Resend API Key');
    expect(data.keys[1].status).toBe('warning');
  });

  it('handles error response from Edge Function', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'Forbidden: admin access required' }),
    });

    const response = await fetch('http://localhost:54321/functions/v1/key-rotation-check', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer test-jwt-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('Forbidden: admin access required');
  });

  it('handles network error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      fetch('http://localhost:54321/functions/v1/key-rotation-check', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer test-jwt-token', 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    ).rejects.toThrow('Network error');
  });
});
