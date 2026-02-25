/**
 * Test render utility — wraps components with all required providers.
 * Use this for component tests that need routing, i18n, and query context.
 */

import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '../../app/providers/I18nProvider';

interface ProviderOptions {
  initialRoute?: string;
  queryClient?: QueryClient;
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

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <MemoryRouter initialEntries={[options.initialRoute ?? '/']}>
          {children}
        </MemoryRouter>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
) {
  const { initialRoute, queryClient, ...renderOptions } = options;

  const result = render(ui, {
    wrapper: ({ children }) => (
      <AllProviders options={{ initialRoute, queryClient }}>
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
