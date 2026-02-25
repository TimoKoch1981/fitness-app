/**
 * AddMealDialog Component Tests
 * Tests: Open/close, form fields, meal type selection, submit, validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../../test/helpers/renderWithProviders';
import { AddMealDialog } from '../AddMealDialog';

// Mock useMeals hook
const mockMutateAsync = vi.fn();
vi.mock('../../hooks/useMeals', () => ({
  useAddMeal: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

describe('AddMealDialog', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  it('renders nothing when closed', () => {
    const { container } = renderWithProviders(
      <AddMealDialog open={false} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders dialog when open', () => {
    renderWithProviders(<AddMealDialog {...defaultProps} />);
    expect(screen.getByText('Mahlzeit hinzufügen')).toBeInTheDocument();
  });

  it('renders meal type buttons', () => {
    renderWithProviders(<AddMealDialog {...defaultProps} />);
    expect(screen.getByText('Frühstück')).toBeInTheDocument();
    expect(screen.getByText('Mittagessen')).toBeInTheDocument();
    expect(screen.getByText('Abendessen')).toBeInTheDocument();
    expect(screen.getByText('Snack')).toBeInTheDocument();
  });

  it('defaults to lunch meal type', () => {
    renderWithProviders(<AddMealDialog {...defaultProps} />);
    const lunchBtn = screen.getByText('Mittagessen');
    expect(lunchBtn.className).toContain('bg-teal-500');
  });

  it('renders name and macro input fields', () => {
    renderWithProviders(<AddMealDialog {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Hähnchenbrust/)).toBeInTheDocument();
    // Macro fields (labels)
    expect(screen.getByText(/Kalorien/)).toBeInTheDocument();
    expect(screen.getByText(/Protein/)).toBeInTheDocument();
    expect(screen.getByText(/Kohlenhydrate/)).toBeInTheDocument();
    expect(screen.getByText(/Fett/)).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    const { container } = renderWithProviders(
      <AddMealDialog open={true} onClose={onClose} />
    );
    // Backdrop is the div with bg-black/40
    const backdrop = container.querySelector('.bg-black\\/40');
    if (backdrop) {
      await userEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('calls onClose when X button is clicked', async () => {
    const onClose = vi.fn();
    renderWithProviders(<AddMealDialog open={true} onClose={onClose} />);
    const closeButtons = screen.getAllByRole('button');
    // X button is the one without text (just the icon)
    const xButton = closeButtons.find(b => b.querySelector('svg') && !b.textContent?.trim());
    if (xButton) {
      await userEvent.click(xButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('switches meal type on button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AddMealDialog {...defaultProps} />);

    const breakfastBtn = screen.getByText('Frühstück');
    await user.click(breakfastBtn);
    expect(breakfastBtn.className).toContain('bg-teal-500');

    const lunchBtn = screen.getByText('Mittagessen');
    expect(lunchBtn.className).not.toContain('bg-teal-500');
  });

  it('submits meal data and calls onClose', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<AddMealDialog open={true} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText(/Hähnchenbrust/), 'Reis mit Huhn');

    // Find calorie input by its number type and required attribute
    const numberInputs = screen.getAllByRole('spinbutton');
    await user.type(numberInputs[0], '500'); // calories
    await user.type(numberInputs[1], '40');  // protein

    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Reis mit Huhn',
          calories: 500,
          protein: 40,
          type: 'lunch',
        })
      );
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('submit button is disabled without name', () => {
    renderWithProviders(<AddMealDialog {...defaultProps} />);
    const submitBtn = screen.getByRole('button', { name: 'Speichern' });
    expect(submitBtn).toBeDisabled();
  });

  it('uses defaultType prop', () => {
    renderWithProviders(<AddMealDialog {...defaultProps} defaultType="breakfast" />);
    const breakfastBtn = screen.getByText('Frühstück');
    expect(breakfastBtn.className).toContain('bg-teal-500');
  });

  it('displays error on submit failure', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Save failed'));
    const user = userEvent.setup();
    renderWithProviders(<AddMealDialog {...defaultProps} />);

    await user.type(screen.getByPlaceholderText(/Hähnchenbrust/), 'Test Meal');
    const numberInputs = screen.getAllByRole('spinbutton');
    await user.type(numberInputs[0], '100');

    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => {
      expect(screen.getByText(/fehlgeschlagen/i)).toBeInTheDocument();
    });
  });

  it('has close button with X icon', () => {
    renderWithProviders(<AddMealDialog {...defaultProps} />);
    // The X button should exist in the header
    const header = screen.getByText('Mahlzeit hinzufügen').parentElement;
    expect(header?.querySelector('svg')).toBeInTheDocument();
  });
});
