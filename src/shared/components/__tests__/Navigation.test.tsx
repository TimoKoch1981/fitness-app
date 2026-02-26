/**
 * Navigation Component Tests
 * Tests: 5 nav items, active state, links, i18n labels
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/helpers/renderWithProviders';
import { Navigation } from '../Navigation';

describe('Navigation', () => {
  it('renders 5 navigation items', () => {
    renderWithProviders(<Navigation />, { initialRoute: '/buddy' });
    const links = screen.getAllByRole('menuitem');
    expect(links).toHaveLength(5);
  });

  it('renders correct nav labels (German)', () => {
    renderWithProviders(<Navigation />, { initialRoute: '/buddy' });
    expect(screen.getByText('Buddy')).toBeInTheDocument();
    expect(screen.getByText('Cockpit')).toBeInTheDocument();
    expect(screen.getByText('Tracking')).toBeInTheDocument();
    expect(screen.getByText('Medizin')).toBeInTheDocument();
    expect(screen.getByText('Profil')).toBeInTheDocument();
  });

  it('links to correct paths', () => {
    renderWithProviders(<Navigation />, { initialRoute: '/buddy' });
    const links = screen.getAllByRole('menuitem');
    const hrefs = links.map(l => l.getAttribute('href'));
    expect(hrefs).toContain('/buddy');
    expect(hrefs).toContain('/cockpit');
    expect(hrefs).toContain('/tracking');
    expect(hrefs).toContain('/medical');
    expect(hrefs).toContain('/profile');
  });

  it('highlights active route', () => {
    renderWithProviders(<Navigation />, { initialRoute: '/cockpit' });
    const cockpitLink = screen.getByText('Cockpit').closest('a');
    expect(cockpitLink?.className).toContain('text-teal-600');
  });

  it('non-active items have gray color', () => {
    renderWithProviders(<Navigation />, { initialRoute: '/buddy' });
    const cockpitLink = screen.getByText('Cockpit').closest('a');
    expect(cockpitLink?.className).toContain('text-gray-500');
  });

  it('is fixed to bottom of screen', () => {
    const { container } = renderWithProviders(<Navigation />, { initialRoute: '/buddy' });
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('fixed');
    expect(nav?.className).toContain('bottom-0');
  });

  it('has z-50 for overlay stacking', () => {
    const { container } = renderWithProviders(<Navigation />, { initialRoute: '/buddy' });
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('z-50');
  });
});
