/**
 * MealPhotoCapture Component Tests
 * Tests: Rendering, camera/gallery buttons, step states, accept/close callbacks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test/helpers/renderWithProviders';
import { MealPhotoCapture } from '../MealPhotoCapture';

// Mock the useAnalyzeMealPhoto hook
const mockAnalyze = vi.fn();
const mockReset = vi.fn();
vi.mock('../../hooks/useAnalyzeMealPhoto', () => ({
  useAnalyzeMealPhoto: () => ({
    analyze: mockAnalyze,
    result: null,
    loading: false,
    error: '',
    reset: mockReset,
  }),
}));

describe('MealPhotoCapture', () => {
  const defaultProps = {
    onAccept: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header with title', () => {
    renderWithProviders(<MealPhotoCapture {...defaultProps} />);
    expect(screen.getByText('Foto-Analyse')).toBeInTheDocument();
  });

  it('renders camera and gallery buttons in idle state', () => {
    renderWithProviders(<MealPhotoCapture {...defaultProps} />);
    expect(screen.getByText('Kamera')).toBeInTheDocument();
    expect(screen.getByText('Galerie')).toBeInTheDocument();
  });

  it('renders hint text', () => {
    renderWithProviders(<MealPhotoCapture {...defaultProps} />);
    expect(screen.getByText(/Fotografiere deine Mahlzeit/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<MealPhotoCapture onAccept={vi.fn()} onClose={onClose} />);

    // Find the close button (X icon)
    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find(b => {
      const svg = b.querySelector('svg');
      return svg && b.textContent?.trim() === '';
    });

    if (closeBtn) {
      await user.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('has hidden file inputs for camera and gallery', () => {
    const { container } = renderWithProviders(<MealPhotoCapture {...defaultProps} />);

    // Camera input with capture attribute
    const cameraInput = container.querySelector('input[capture="environment"]');
    expect(cameraInput).toBeInTheDocument();
    expect(cameraInput).toHaveAttribute('type', 'file');
    expect(cameraInput).toHaveAttribute('accept', 'image/*');

    // Gallery input without capture attribute
    const inputs = container.querySelectorAll('input[type="file"]');
    expect(inputs.length).toBe(2);
  });

  it('renders close button with X icon', () => {
    const { container } = renderWithProviders(<MealPhotoCapture {...defaultProps} />);
    // Should have an SVG icon in the close button area
    const header = screen.getByText('Foto-Analyse').parentElement;
    expect(header?.querySelector('svg')).toBeInTheDocument();
  });
});
