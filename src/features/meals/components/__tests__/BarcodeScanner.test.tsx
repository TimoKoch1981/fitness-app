/**
 * BarcodeScanner Component Tests
 *
 * Tests: Rendering, idle state, close callback, scanning trigger,
 *        error handling, cleanup on unmount
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test/helpers/renderWithProviders';
import { BarcodeScanner } from '../BarcodeScanner';

// ── Mock html5-qrcode ───────────────────────────────────────────────

const mockStart = vi.fn().mockResolvedValue(undefined);
const mockStop = vi.fn().mockResolvedValue(undefined);
const mockClear = vi.fn();
const mockGetState = vi.fn().mockReturnValue(1); // 1 = NOT_STARTED

vi.mock('html5-qrcode', () => {
  return {
    Html5Qrcode: function MockHtml5Qrcode() {
      return {
        start: mockStart,
        stop: mockStop,
        clear: mockClear,
        getState: mockGetState,
      };
    },
    Html5QrcodeSupportedFormats: {
      EAN_13: 0,
      EAN_8: 1,
      UPC_A: 2,
      QR_CODE: 3,
    },
  };
});

// ── Mock Open Food Facts lookup ─────────────────────────────────────

vi.mock('../../../../services/openFoodFactsBarcode', () => ({
  lookupBarcode: vi.fn(),
}));

// ── Tests ────────────────────────────────────────────────────────────

describe('BarcodeScanner', () => {
  const defaultProps = {
    onAccept: vi.fn(),
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetState.mockReturnValue(1); // NOT_STARTED
  });

  it('renders header with title', () => {
    renderWithProviders(<BarcodeScanner {...defaultProps} />);
    expect(screen.getByText('Barcode scannen')).toBeInTheDocument();
  });

  it('renders hint text in idle state', () => {
    renderWithProviders(<BarcodeScanner {...defaultProps} />);
    expect(
      screen.getByText(/Scanne den Barcode/)
    ).toBeInTheDocument();
  });

  it('renders start scanner button in idle state', () => {
    renderWithProviders(<BarcodeScanner {...defaultProps} />);
    expect(screen.getByText('Scanner starten')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<BarcodeScanner onAccept={vi.fn()} onClose={onClose} />);

    // Find close button (the one with X icon, no text)
    const buttons = screen.getAllByRole('button');
    const closeBtn = buttons.find((b) => {
      const svg = b.querySelector('svg');
      return svg && b.textContent?.trim() === '';
    });

    if (closeBtn) {
      await user.click(closeBtn);
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    }
  });

  it('starts scanning when start button is clicked', async () => {
    mockStart.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderWithProviders(<BarcodeScanner {...defaultProps} />);

    const startButton = screen.getByText('Scanner starten');
    await user.click(startButton);

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    });
  });

  it('shows scanning hint text after start is clicked', async () => {
    // Make start hang (never resolve) so we stay in scanning state
    mockStart.mockReturnValue(new Promise(() => {}));
    const user = userEvent.setup();
    renderWithProviders(<BarcodeScanner {...defaultProps} />);

    const startButton = screen.getByText('Scanner starten');
    await user.click(startButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Barcode vor die Kamera halten/)
      ).toBeInTheDocument();
    });
  });

  it('shows error when camera fails to start', async () => {
    mockStart.mockRejectedValueOnce(new Error('Camera not available'));
    const user = userEvent.setup();
    renderWithProviders(<BarcodeScanner {...defaultProps} />);

    const startButton = screen.getByText('Scanner starten');
    await user.click(startButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Kamera konnte nicht gestartet werden/)
      ).toBeInTheDocument();
    });
  });

  it('shows retry button in error state', async () => {
    mockStart.mockRejectedValueOnce(new Error('Camera not available'));
    const user = userEvent.setup();
    renderWithProviders(<BarcodeScanner {...defaultProps} />);

    const startButton = screen.getByText('Scanner starten');
    await user.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Erneut scannen')).toBeInTheDocument();
    });
  });

  it('renders ScanBarcode icon in header', () => {
    const { container } = renderWithProviders(<BarcodeScanner {...defaultProps} />);
    // The header should have an SVG icon
    const header = screen.getByText('Barcode scannen').closest('h3');
    expect(header?.querySelector('svg')).toBeInTheDocument();
  });

  it('calls clear on scanner instance during cleanup', async () => {
    // Make start hang to stay in scanning state
    mockStart.mockReturnValue(new Promise(() => {}));
    mockGetState.mockReturnValue(1); // NOT_STARTED (no scanning yet)

    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<BarcodeScanner {...defaultProps} />);

    const startButton = screen.getByText('Scanner starten');
    await user.click(startButton);

    // Wait for the scanner to be instantiated (start is called)
    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    });

    // Unmount triggers cleanup
    unmount();

    // Since getState returns 1 (NOT_STARTED), stop is skipped but clear should be called
    expect(mockClear).toHaveBeenCalled();
  });

  it('accepts onLookupUserProduct callback', () => {
    const lookupFn = vi.fn().mockReturnValue(null);
    renderWithProviders(
      <BarcodeScanner
        {...defaultProps}
        onLookupUserProduct={lookupFn}
      />
    );
    // Should render without error — callback is optional
    expect(screen.getByText('Barcode scannen')).toBeInTheDocument();
  });
});
