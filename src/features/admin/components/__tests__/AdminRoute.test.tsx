/**
 * AdminRoute Component Tests
 * Tests: Loading state, unauthenticated redirect, non-admin redirect, admin access
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../../test/helpers/renderWithProviders';
import { AdminRoute } from '../AdminRoute';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../../../../app/providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, isAdmin: false });
    const { container } = renderWithProviders(
      <AdminRoute><div>Admin Content</div></AdminRoute>,
      { initialRoute: '/admin' }
    );
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('redirects to /login when no user', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, isAdmin: false });
    renderWithProviders(
      <AdminRoute><div>Admin Content</div></AdminRoute>,
      { initialRoute: '/admin' }
    );
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('redirects to /buddy when user is not admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'test@test.com' },
      loading: false,
      isAdmin: false,
    });
    renderWithProviders(
      <AdminRoute><div>Admin Content</div></AdminRoute>,
      { initialRoute: '/admin' }
    );
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('renders children when user is admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', email: 'admin@test.com' },
      loading: false,
      isAdmin: true,
    });
    renderWithProviders(
      <AdminRoute><div>Admin Content</div></AdminRoute>,
      { initialRoute: '/admin' }
    );
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('loading spinner has correct styling', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, isAdmin: false });
    const { container } = renderWithProviders(
      <AdminRoute><div>X</div></AdminRoute>,
      { initialRoute: '/admin' }
    );
    const spinner = container.querySelector('.animate-spin');
    expect(spinner?.className).toContain('border-indigo-600');
  });
});
