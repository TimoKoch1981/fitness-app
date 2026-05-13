/**
 * Test render utility — wraps components with all required providers.
 * Use this for component tests that need routing, i18n, and query context.
 */

import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '../../app/providers/I18nProvider';
import { AuthContext } from '../../app/providers/AuthProvider';
import type { Session, User } from '@supabase/supabase-js';

interface ProviderOptions {
  initialRoute?: string;
  queryClient?: QueryClient;
  /** Optional auth state override — defaults to a settled anonymous user
   *  context so hooks that depend on useAuth don't crash. */
  auth?: Partial<{
    user: User | null;
    session: Session | null;
    loading: boolean;
    isAdmin: boolean;
  }>;
}

function makeAuthValue(override: ProviderOptions['auth']) {
  return {
    user: override?.user ?? null,
    session: override?.session ?? null,
    loading: override?.loading ?? false,
    isAdmin: override?.isAdmin ?? false,
    signIn: async () => ({ error: null, errorCode: undefined }),
    signUp: async () => ({ error: null, errorCode: undefined }),
    signInWithOAuth: async () => ({ error: null }),
    signOut: async () => {},
    resetPassword: async () => ({ error: null }),
    updatePassword: async () => ({ error: null }),
    resendConfirmation: async () => ({ error: null }),
  };
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function AllProviders({ children, options }: { children: React.ReactNode; options: ProviderOptions }) {
  const queryClient = options.queryClient ?? createTestQueryClient();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const authValue = React.useMemo(() => makeAuthValue(options.auth), [JSON.stringify(options.auth ?? null)]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter initialEntries={[options.initialRoute ?? '/']}>
            {children}
          </MemoryRouter>
        </AuthContext.Provider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { initialRoute, queryClient, auth, ...renderOptions } = options;

  const result = render(ui, {
    wrapper: ({ children }) => (
      <AllProviders options={{ initialRoute, queryClient, auth }}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });

  return {
    ...result,
    queryClient: queryClient ?? createTestQueryClient(),
  };
}

export { createTestQueryClient };
