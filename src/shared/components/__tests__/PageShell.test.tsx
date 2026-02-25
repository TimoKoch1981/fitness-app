/**
 * PageShell Component Tests
 * Tests: Rendering, title, children, actions slot, CSS classes
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/helpers/renderWithProviders';
import { PageShell } from '../PageShell';

describe('PageShell', () => {
  it('renders title in header', () => {
    renderWithProviders(<PageShell title="Test Titel">Content</PageShell>);
    expect(screen.getByText('Test Titel')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Titel');
  });

  it('renders children in main area', () => {
    renderWithProviders(
      <PageShell title="T">
        <div data-testid="child">Child Content</div>
      </PageShell>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('renders actions slot when provided', () => {
    renderWithProviders(
      <PageShell title="T" actions={<button>Action</button>}>
        Content
      </PageShell>
    );
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('does not render actions area when not provided', () => {
    const { container } = renderWithProviders(<PageShell title="T">C</PageShell>);
    // Header should exist but no action buttons
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header?.querySelectorAll('button')).toHaveLength(0);
  });

  it('applies custom className to main', () => {
    const { container } = renderWithProviders(
      <PageShell title="T" className="custom-class">C</PageShell>
    );
    const main = container.querySelector('main');
    expect(main?.className).toContain('custom-class');
  });

  it('has bottom padding for navigation (pb-20)', () => {
    const { container } = renderWithProviders(<PageShell title="T">C</PageShell>);
    const main = container.querySelector('main');
    expect(main?.className).toContain('pb-20');
  });

  it('header is sticky', () => {
    const { container } = renderWithProviders(<PageShell title="T">C</PageShell>);
    const header = container.querySelector('header');
    expect(header?.className).toContain('sticky');
    expect(header?.className).toContain('top-0');
  });
});
