/**
 * NumericValue Component Tests
 *
 * Tests:
 *  - Locale-aware number formatting (de-DE default, en-US opt-in)
 *  - Decimal handling
 *  - Sign prefix
 *  - String pass-through (e.g. "N/A")
 *  - Unit rendering with reduced opacity
 *  - Tabular-nums + Mono font enforcement
 *  - Variant size classes
 *  - Trailing content
 *  - className passthrough
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NumericValue } from '../NumericValue';

describe('NumericValue', () => {
  describe('number formatting', () => {
    it('formats integers without decimals by default (de-DE)', () => {
      render(<NumericValue value={1234} />);
      expect(screen.getByText('1.234')).toBeInTheDocument();
    });

    it('formats decimals with German comma separator (de-DE)', () => {
      render(<NumericValue value={87.3} decimals={1} />);
      expect(screen.getByText('87,3')).toBeInTheDocument();
    });

    it('formats decimals with English period separator (en-US)', () => {
      render(<NumericValue value={87.3} decimals={1} locale="en-US" />);
      expect(screen.getByText('87.3')).toBeInTheDocument();
    });

    it('zero-pads decimals when requested', () => {
      render(<NumericValue value={5} decimals={2} />);
      expect(screen.getByText('5,00')).toBeInTheDocument();
    });

    it('handles large numbers with thousands separator (de-DE)', () => {
      render(<NumericValue value={12840} />);
      expect(screen.getByText('12.840')).toBeInTheDocument();
    });

    it('passes through string values unchanged', () => {
      render(<NumericValue value="N/A" />);
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('sign prefix', () => {
    it('renders minus sign for deficit', () => {
      const { container } = render(<NumericValue value={423} sign="−" />);
      expect(container.textContent).toBe('−423');
    });

    it('renders plus sign for surplus', () => {
      const { container } = render(<NumericValue value={500} sign="+" />);
      expect(container.textContent).toBe('+500');
    });

    it('renders no sign when omitted', () => {
      const { container } = render(<NumericValue value={42} />);
      expect(container.textContent).toBe('42');
    });
  });

  describe('unit rendering', () => {
    it('renders unit halftransparent', () => {
      render(<NumericValue value={87.3} unit="kg" decimals={1} />);
      const unit = screen.getByText('kg');
      expect(unit.className).toMatch(/opacity-60/);
    });

    it('renders no unit element when unit is undefined', () => {
      const { container } = render(<NumericValue value={42} />);
      const spans = container.querySelectorAll('span');
      // outer span only, no nested unit span
      expect(spans.length).toBe(1);
    });

    it('renders kcal unit after calorie value', () => {
      const { container } = render(<NumericValue value={2347} unit="kcal" />);
      expect(container.textContent).toBe('2.347kcal');
    });

    it('renders complex unit (pg/mL) unchanged', () => {
      render(<NumericValue value={28.4} decimals={1} unit="pg/mL" />);
      expect(screen.getByText('pg/mL')).toBeInTheDocument();
    });
  });

  describe('typography enforcement', () => {
    it('applies tabular-nums class for monospaced digit width', () => {
      const { container } = render(<NumericValue value={42} />);
      const span = container.querySelector('span');
      expect(span?.className).toMatch(/tabular-nums/);
    });

    it('uses --theme-font-numeric CSS variable for font-family', () => {
      const { container } = render(<NumericValue value={42} />);
      const span = container.querySelector('span');
      // style is inline, font-family includes the var()
      expect(span?.getAttribute('style')).toMatch(/--theme-font-numeric/);
    });
  });

  describe('variant size classes', () => {
    it('applies display size for hero metric', () => {
      const { container } = render(<NumericValue value={423} variant="display" />);
      const span = container.querySelector('span');
      expect(span?.className).toMatch(/text-5xl/);
      expect(span?.className).toMatch(/font-bold/);
    });

    it('applies inline size as default', () => {
      const { container } = render(<NumericValue value={423} />);
      const span = container.querySelector('span');
      expect(span?.className).toMatch(/text-base/);
      expect(span?.className).toMatch(/font-semibold/);
    });

    it('applies caption size for small contexts', () => {
      const { container } = render(<NumericValue value={42} variant="caption" />);
      const span = container.querySelector('span');
      expect(span?.className).toMatch(/text-xs/);
    });
  });

  describe('extensibility', () => {
    it('renders trailing content after the unit', () => {
      const { container } = render(
        <NumericValue
          value={52.3}
          decimals={1}
          unit="%"
          trailing={<span data-testid="warn-badge">↑</span>}
        />,
      );
      expect(container.querySelector('[data-testid="warn-badge"]')).toBeInTheDocument();
    });

    it('passes through custom className', () => {
      const { container } = render(
        <NumericValue value={42} className="text-theme-success" />,
      );
      const span = container.querySelector('span');
      expect(span?.className).toMatch(/text-theme-success/);
    });

    it('passes through HTML attributes (aria-label)', () => {
      render(<NumericValue value={42} aria-label="Antwort auf alles" />);
      expect(screen.getByLabelText('Antwort auf alles')).toBeInTheDocument();
    });
  });

  describe('realistic use-cases (Mood-Board examples)', () => {
    it('renders Cockpit leading metric: −423 kcal', () => {
      const { container } = render(
        <NumericValue value={423} sign="−" unit="kcal" variant="display" />,
      );
      expect(container.textContent).toBe('−423kcal');
    });

    it('renders Bloodwork value: 28,4 pg/mL (Estradiol Mann)', () => {
      const { container } = render(
        <NumericValue value={28.4} decimals={1} unit="pg/mL" />,
      );
      expect(container.textContent).toBe('28,4pg/mL');
    });

    it('renders Volume: 12.840 kg with German thousand separator', () => {
      const { container } = render(<NumericValue value={12840} unit="kg" />);
      expect(container.textContent).toBe('12.840kg');
    });

    it('renders Hematokrit warning: 52,3 %', () => {
      const { container } = render(
        <NumericValue value={52.3} decimals={1} unit="%" />,
      );
      expect(container.textContent).toBe('52,3%');
    });
  });
});
