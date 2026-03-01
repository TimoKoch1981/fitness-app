/**
 * LoginPage Component Tests
 * Tests: Form rendering, input fields, submit, error display, redirect when authenticated
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/helpers/renderWithProviders';
import { LoginPage } from '../LoginPage';

// Mock useAuth
const mockSignIn = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockResendConfirmation = vi.fn();
const mockUseAuth = vi.fn();
vi.mock('../../app/providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

/** Helper: find input after a label text */
function getInputByLabel(container: HTMLElement, labelText: string): HTMLInputElement {
  const labels = container.querySelectorAll('label');
  for (const label of labels) {
    if (label.textContent?.trim() === labelText) {
      const input = label.parentElement?.querySelector('input');
      if (input) return input as HTMLInputElement;
    }
  }
  throw new Error(`Input for label "${labelText}" not found`);
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockResolvedValue({ error: null });
    mockSignInWithOAuth.mockResolvedValue({ error: null });
    mockResendConfirmation.mockResolvedValue({ error: null });
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signInWithOAuth: mockSignInWithOAuth,
      resendConfirmation: mockResendConfirmation,
      user: null,
      loading: false,
    });
  });

  it('renders login form with email and password fields', () => {
    renderWithProviders(<LoginPage />, { initialRoute: '/login' });
    expect(screen.getByRole('heading', { name: 'Anmelden' })).toBeInTheDocument();
    expect(screen.getByText('E-Mail')).toBeInTheDocument();
    expect(screen.getByText('Passwort')).toBeInTheDocument();
  });

  it('renders app name and tagline', () => {
    renderWithProviders(<LoginPage />, { initialRoute: '/login' });
    expect(screen.getByText('FitBuddy')).toBeInTheDocument();
  });

  it('renders login button', () => {
    renderWithProviders(<LoginPage />, { initialRoute: '/login' });
    const button = screen.getByRole('button', { name: 'Anmelden' });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('renders register and forgot password links', () => {
    renderWithProviders(<LoginPage />, { initialRoute: '/login' });
    expect(screen.getByText('Registrieren')).toBeInTheDocument();
    expect(screen.getByText('Passwort vergessen?')).toBeInTheDocument();
  });

  it('calls signIn with email and password on submit', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<LoginPage />, { initialRoute: '/login' });

    const emailInput = getInputByLabel(container, 'E-Mail');
    const pwInput = getInputByLabel(container, 'Passwort');

    await user.type(emailInput, 'test@test.com');
    await user.type(pwInput, 'pw123');
    await user.click(screen.getByRole('button', { name: 'Anmelden' }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@test.com', 'pw123');
    });
  });

  it('displays error message on failed sign in', async () => {
    mockSignIn.mockResolvedValue({ error: new Error('Ungültige Zugangsdaten') });
    const user = userEvent.setup();
    const { container } = renderWithProviders(<LoginPage />, { initialRoute: '/login' });

    const emailInput = getInputByLabel(container, 'E-Mail');
    const pwInput = getInputByLabel(container, 'Passwort');

    await user.type(emailInput, 'bad@test.com');
    await user.type(pwInput, 'wrong');
    await user.click(screen.getByRole('button', { name: 'Anmelden' }));

    await waitFor(() => {
      expect(screen.getByText('Ungültige Zugangsdaten')).toBeInTheDocument();
    });
  });

  it('redirects to /buddy when user is already logged in', () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signInWithOAuth: mockSignInWithOAuth,
      resendConfirmation: mockResendConfirmation,
      user: { id: 'u1', email: 'test@test.com' },
      loading: false,
    });
    renderWithProviders(<LoginPage />, { initialRoute: '/login' });
    // Should not show login form
    expect(screen.queryByText('E-Mail')).not.toBeInTheDocument();
  });

  it('returns null while loading', () => {
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      signInWithOAuth: mockSignInWithOAuth,
      resendConfirmation: mockResendConfirmation,
      user: null,
      loading: true,
    });
    const { container } = renderWithProviders(<LoginPage />, { initialRoute: '/login' });
    expect(container.innerHTML).toBe('');
  });

  it('disables submit button while submitting', async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {}));
    const user = userEvent.setup();
    const { container } = renderWithProviders(<LoginPage />, { initialRoute: '/login' });

    const emailInput = getInputByLabel(container, 'E-Mail');
    const pwInput = getInputByLabel(container, 'Passwort');

    await user.type(emailInput, 'test@test.com');
    await user.type(pwInput, 'pw123');
    await user.click(screen.getByRole('button', { name: 'Anmelden' }));

    await waitFor(() => {
      // Submit button shows loading text while submitting
      expect(screen.getByRole('button', { name: 'Laden...' })).toBeDisabled();
    });
  });

  it('renders OAuth social login buttons', () => {
    renderWithProviders(<LoginPage />, { initialRoute: '/login' });
    expect(screen.getByRole('button', { name: /Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Apple/i })).toBeInTheDocument();
  });

  it('email field has correct type attribute', () => {
    const { container } = renderWithProviders(<LoginPage />, { initialRoute: '/login' });
    const emailInput = getInputByLabel(container, 'E-Mail');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('password field has correct type attribute', () => {
    const { container } = renderWithProviders(<LoginPage />, { initialRoute: '/login' });
    const pwInput = getInputByLabel(container, 'Passwort');
    expect(pwInput).toHaveAttribute('type', 'password');
  });
});
