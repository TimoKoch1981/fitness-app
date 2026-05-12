/**
 * Navigation Component Tests
 * Tests: 6 base nav items (+1 optional cycle for female users), active state, links, i18n labels
 *
 * Note: Phase-F-Benchmark recommends removing Social (P3-1) — when that happens,
 * update this test back to 5 items.
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/helpers/renderWithProviders';
import { Navigation } from '../Navigation';

describe('Navigation', () => {
  it('renders 6 base navigation items (without cycle)', () => {
    renderWithProviders(<Navigation />, { initialRoute: '/cockpit' });
    const links = screen.getAllByRole('menuitem');
    expect(links).toHaveLength(6);
  });

  it('renders correct nav labels (German)', () => {
    renderWithProviders(<Navigation />, { initialRoute: '/cockpit' });
    expect(screen.getByText('Cockpit')).toBeInTheDocument();
    expect(screen.getByText('Ernährung')).toBeInTheDocument();
    expect(screen.getByText('Training')).toBeInTheDocument();
    expect(screen.getByText('Medizin')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Profil')).toBeInTheDocument();
  });

  it('links to correct paths', () => {
    renderWithProviders(<Navigation />, { initialRoute: '/cockpit' });
    const links = screen.getAllByRole('menuitem');
    const hrefs = links.map(l => l.getAttribute('href'));
    expect(hrefs).toContain('/cockpit');
    expect(hrefs).toContain('/nutrition');
    expect(hrefs).toContain('/training');
    expect(hrefs).toContain('/medical');
    expect(hrefs).toContain('/social');
    expect(hrefs).toContain('/profile');
  });

  it('highlights active route', () => {
    renderWithProviders(<Navigation />, { initialRoute: '/cockpit' });
    const cockpitLink = screen.getByText('Cockpit').closest('a');
    expect(cockpitLink?.className).toContain('text-teal-600');
  });

  it('non-active items have gray color', () => {
    renderWithProviders(<Navigation />, { initialRoute: '/cockpit' });
    const medizinLink = screen.getByText('Medizin').closest('a');
    expect(medizinLink?.className).toContain('text-gray-500');
  });

  it('is fixed to bottom of screen', () => {
    const { container } = renderWithProviders(<Navigation />, { initialRoute: '/cockpit' });
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('fixed');
    expect(nav?.className).toContain('bottom-0');
  });

  it('has z-50 for overlay stacking', () => {
    const { container } = renderWithProviders(<Navigation />, { initialRoute: '/cockpit' });
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('z-50');
  });
});
