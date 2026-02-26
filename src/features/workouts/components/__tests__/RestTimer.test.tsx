/**
 * RestTimer — Component tests.
 * Tests countdown, skip, adjust, vibration, and completion callback.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RestTimer } from '../RestTimer';

// Mock i18n
vi.mock('../../../../i18n', () => ({
  useTranslation: () => ({
    t: {
      workout: {
        restTimer: 'Pause',
        skipTimer: 'Überspringen',
      },
    },
  }),
}));

describe('RestTimer', () => {
  const defaultProps = {
    seconds: 90,
    onComplete: vi.fn(),
    onSkip: vi.fn(),
    onAdjust: vi.fn(),
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders initial time display', () => {
    render(<RestTimer {...defaultProps} />);
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });

  it('counts down every second', () => {
    render(<RestTimer {...defaultProps} />);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText('1:29')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(4000); });
    expect(screen.getByText('1:25')).toBeInTheDocument();
  });

  it('calls onComplete when timer reaches 0', () => {
    render(<RestTimer {...defaultProps} seconds={3} />);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(defaultProps.onComplete).toHaveBeenCalledTimes(1);
  });

  it('vibrates on completion when supported', () => {
    render(<RestTimer {...defaultProps} seconds={2} />);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(navigator.vibrate).toHaveBeenCalledWith([200, 100, 200]);
  });

  it('calls onSkip when skip button clicked', () => {
    render(<RestTimer {...defaultProps} />);
    fireEvent.click(screen.getByText('Überspringen'));
    expect(defaultProps.onSkip).toHaveBeenCalledTimes(1);
  });

  it('calls onAdjust with +15 when plus button clicked', () => {
    render(<RestTimer {...defaultProps} seconds={90} />);
    // Buttons: [Minus, Plus, Skip]
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]); // Plus
    expect(defaultProps.onAdjust).toHaveBeenCalledWith(105);
  });

  it('calls onAdjust with -15 when minus button clicked', () => {
    render(<RestTimer {...defaultProps} seconds={90} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // Minus
    expect(defaultProps.onAdjust).toHaveBeenCalledWith(75);
  });

  it('does not go below 15 seconds when adjusting down', () => {
    render(<RestTimer {...defaultProps} seconds={20} />);
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]); // Minus
    expect(defaultProps.onAdjust).toHaveBeenCalledWith(15);
  });

  it('shows the total timer duration label', () => {
    render(<RestTimer {...defaultProps} seconds={60} />);
    expect(screen.getByText('60s')).toBeInTheDocument();
  });

  it('displays 0:01 just before completion', () => {
    render(<RestTimer {...defaultProps} seconds={2} />);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText('0:01')).toBeInTheDocument();
  });

  it('renders SVG elements for circular progress', () => {
    const { container } = render(<RestTimer {...defaultProps} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
    // At least one circle across all SVGs (progress indicator)
    const allCircles = container.querySelectorAll('circle');
    expect(allCircles.length).toBeGreaterThanOrEqual(1);
  });
});
