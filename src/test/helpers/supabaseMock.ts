/**
 * Supabase client mock for integration tests.
 * Provides a chainable query builder that mimics the real Supabase client.
 */

import { vi } from 'vitest';

export interface MockTableConfig {
  data?: unknown[];
  error?: { message: string } | null;
  singleData?: unknown;
}

export interface MockUser {
  id: string;
  email: string;
}

function createChainableMock(config: MockTableConfig = {}) {
  const resolvedData = config.data ?? [];
  const resolvedError = config.error ?? null;
  const resolvedSingle = config.singleData ?? resolvedData[0] ?? null;

  const chain: Record<string, unknown> = {};

  const methods = ['select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
    'in', 'is', 'order', 'limit', 'range', 'match', 'not'];

  for (const method of methods) {
    chain[method] = vi.fn(() => chain);
  }

  chain.single = vi.fn(() => Promise.resolve({
    data: resolvedSingle,
    error: resolvedError,
  }));

  // Make the chain itself thenable (for queries without .single())
  chain.then = vi.fn((resolve: (value: unknown) => void) => {
    resolve({ data: resolvedData, error: resolvedError });
  });

  return chain;
}

export function createSupabaseMock(options: {
  tables?: Record<string, MockTableConfig>;
  user?: MockUser | null;
} = {}) {
  const { tables = {}, user = { id: 'test-user-id', email: 'test@fitbuddy.local' } } = options;

  const mock = {
    from: vi.fn((table: string) => {
      const config = tables[table] ?? {};
      return createChainableMock(config);
    }),
    auth: {
      getUser: vi.fn(() => Promise.resolve({
        data: { user },
        error: null,
      })),
      getSession: vi.fn(() => Promise.resolve({
        data: { session: user ? { user, access_token: 'mock-token' } : null },
        error: null,
      })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: { path: 'mock/path' }, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://mock.url/image.jpg' } })),
      })),
    },
  };

  return mock;
}

/**
 * Installs the Supabase mock by mocking the module import.
 * Call this in beforeEach or at the top of a test file.
 *
 * Usage:
 *   vi.mock('../../../lib/supabase', () => ({ supabase: createSupabaseMock() }));
 */
export { vi };
