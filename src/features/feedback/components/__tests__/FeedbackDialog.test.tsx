/**
 * FeedbackDialog Component Tests
 * Tests: Open/close, mode selection, quick feedback, bug report, feature request
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test/helpers/renderWithProviders';
import { FeedbackDialog } from '../FeedbackDialog';

// Mock feedback hooks
const mockSubmitFeedback = vi.fn();
const mockSubmitFeature = vi.fn();

vi.mock('../../hooks/useFeedback', () => ({
  useSubmitFeedback: () => ({
    mutateAsync: mockSubmitFeedback,
    isPending: false,
  }),
  collectBugContext: () => ({
    page_url: '/test',
    user_agent: 'test-agent',
    app_version: '9.0',
  }),
}));

vi.mock('../../hooks/useFeatureRequests', () => ({
  useSubmitFeatureRequest: () => ({
    mutateAsync: mockSubmitFeature,
    isPending: false,
  }),
}));

describe('FeedbackDialog', () => {
  const defaultProps = { open: true, onClose: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmitFeedback.mockResolvedValue({});
    mockSubmitFeature.mockResolvedValue({});
  });

  it('renders nothing when closed', () => {
    const { container } = renderWithProviders(
      <FeedbackDialog open={false} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders mode selection when open', () => {
    renderWithProviders(<FeedbackDialog {...defaultProps} />);
    expect(screen.getByText('Feedback')).toBeInTheDocument();
    expect(screen.getByText('Schnell-Feedback')).toBeInTheDocument();
    expect(screen.getByText('Bug melden')).toBeInTheDocument();
    expect(screen.getByText('Feature wünschen')).toBeInTheDocument();
  });

  it('calls onClose when X button is clicked', async () => {
    const onClose = vi.fn();
    renderWithProviders(<FeedbackDialog open={true} onClose={onClose} />);
    // Find X button (the one with SVG in the header)
    const header = screen.getByText('Feedback').parentElement;
    const xButton = header?.querySelector('button');
    if (xButton) {
      await userEvent.click(xButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('switches to quick feedback mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackDialog {...defaultProps} />);
    await user.click(screen.getByText('Schnell-Feedback'));
    expect(screen.getByText('Gut')).toBeInTheDocument();
    expect(screen.getByText('Verbesserungsbedarf')).toBeInTheDocument();
  });

  it('switches to bug report mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackDialog {...defaultProps} />);
    await user.click(screen.getByText('Bug melden'));
    // Bug mode has auto-context chip and description textarea
    expect(screen.getByText(/Automatisch erfasst/)).toBeInTheDocument();
  });

  it('switches to feature request mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackDialog {...defaultProps} />);
    await user.click(screen.getByText('Feature wünschen'));
    expect(screen.getByText(/Titel/)).toBeInTheDocument();
  });

  it('shows back button in sub-modes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackDialog {...defaultProps} />);
    await user.click(screen.getByText('Schnell-Feedback'));
    expect(screen.getByText('Zurück')).toBeInTheDocument();
  });

  it('back button returns to select mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackDialog {...defaultProps} />);
    await user.click(screen.getByText('Schnell-Feedback'));
    await user.click(screen.getByText('Zurück'));
    // Should be back to selection
    expect(screen.getByText('Schnell-Feedback')).toBeInTheDocument();
    expect(screen.getByText('Bug melden')).toBeInTheDocument();
  });

  // Quick Feedback mode tests
  it('quick feedback: thumbs up/down toggle', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackDialog {...defaultProps} />);
    await user.click(screen.getByText('Schnell-Feedback'));

    const gutBtn = screen.getByText('Gut').closest('button');
    await user.click(gutBtn!);
    expect(gutBtn?.className).toContain('ring-2');
  });

  it('quick feedback: category tabs work', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackDialog {...defaultProps} />);
    await user.click(screen.getByText('Schnell-Feedback'));

    const lobBtn = screen.getByText('Lob');
    await user.click(lobBtn);
    expect(lobBtn.closest('button')?.className).toContain('ring-1');
  });

  it('quick feedback: submit button disabled without rating', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackDialog {...defaultProps} />);
    await user.click(screen.getByText('Schnell-Feedback'));

    const submitBtn = screen.getByText('Feedback senden').closest('button');
    expect(submitBtn).toBeDisabled();
  });

  it('quick feedback: submits with rating and message', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackDialog {...defaultProps} />);
    await user.click(screen.getByText('Schnell-Feedback'));

    // Select thumbs up
    await user.click(screen.getByText('Gut').closest('button')!);
    // Type message
    const textarea = screen.getByPlaceholderText(/mitteilen/);
    await user.type(textarea, 'Tolle App!');
    // Submit
    await user.click(screen.getByText('Feedback senden').closest('button')!);

    await waitFor(() => {
      expect(mockSubmitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'note',
          rating: 'up',
          message: 'Tolle App!',
        })
      );
    });
  });

  // Feature Request mode tests
  it('feature: submit disabled without title', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackDialog {...defaultProps} />);
    await user.click(screen.getByText('Feature wünschen'));

    const submitBtn = screen.getByText('Feature vorschlagen').closest('button');
    expect(submitBtn).toBeDisabled();
  });

  it('feature: submits with title and description', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackDialog {...defaultProps} />);
    await user.click(screen.getByText('Feature wünschen'));

    // Title is the input[type=text], description is the textarea
    const titleInput = screen.getByPlaceholderText(/Dunkler Modus/);
    await user.type(titleInput, 'Dark Mode');

    const descTextarea = screen.getByPlaceholderText(/genau/);
    await user.type(descTextarea, 'Dunkel-Modus fuer die App');

    await user.click(screen.getByText('Feature vorschlagen').closest('button')!);

    await waitFor(() => {
      expect(mockSubmitFeature).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Dark Mode',
        })
      );
    });
  });

  it('shows success state after submission', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedbackDialog {...defaultProps} />);
    await user.click(screen.getByText('Schnell-Feedback'));
    await user.click(screen.getByText('Gut').closest('button')!);
    await user.click(screen.getByText('Feedback senden').closest('button')!);

    await waitFor(() => {
      expect(screen.getByText(/Danke/)).toBeInTheDocument();
    });
  });
});
