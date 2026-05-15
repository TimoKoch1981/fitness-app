/**
 * NumericValue — single source of truth for displaying numeric data.
 *
 * Background (Phase 8 §3.3 / Lina-Review): Heute schreibt die App Zahlen an
 * 100+ Stellen jedes Mal anders — manchmal mit `tabular-nums`, manchmal ohne,
 * manchmal mit Inter, manchmal Mono, manchmal Unit als `<span>`, manchmal
 * Inline. Diese Komponente vereinheitlicht das:
 *
 *  - **font-variant-numeric: tabular-nums** immer erzwungen (Ziffern springen
 *    nicht zwischen Werten)
 *  - **JetBrains Mono** über `--theme-font-numeric`-CSS-Variable (Sober → Mono,
 *    Console → Mono, Print → Serif via @media print überschreibbar)
 *  - **Unit halbtransluzent** (opacity 0.6) und kleiner als der Wert
 *  - **Drei Größen-Variants** für Hero/Inline/Caption-Kontexte
 *  - **Locale-aware Formatierung** (de-DE default mit Punkt als Tausender-
 *    Trenner und Komma als Dezimal-Trenner)
 *
 * In Stufe 0 noch nicht in bestehenden Pages eingesetzt. Verwendung kommt
 * inkrementell ab Stufe 1.
 */

import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type NumericValueVariant = 'display' | 'inline' | 'caption';

interface NumericValueProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** The numeric value to display. Strings are passed through unchanged (e.g. "N/A"). */
  value: number | string;
  /** Optional unit (e.g. "kg", "kcal", "pg/mL") rendered halftransparent. */
  unit?: string;
  /** Size variant. `display` = Hero (z. B. Cockpit-Leitmetrik), `inline` = Default, `caption` = klein. */
  variant?: NumericValueVariant;
  /** Optional sign prefix (e.g. "−" for deficit, "+" for surplus). */
  sign?: '+' | '−' | '';
  /** Number of decimal places. If undefined, no formatting is applied (integer rendering). */
  decimals?: number;
  /** Locale for number formatting. Defaults to 'de-DE'. */
  locale?: 'de-DE' | 'en-US';
  /** Custom Tailwind classes appended at the end. */
  className?: string;
  /** Optional content rendered after the unit (e.g. a status badge). */
  trailing?: ReactNode;
}

const VARIANT_CLASSES: Record<NumericValueVariant, string> = {
  display: 'text-5xl font-bold leading-none',
  inline:  'text-base font-semibold',
  caption: 'text-xs font-medium',
};

const UNIT_CLASSES: Record<NumericValueVariant, string> = {
  display: 'text-base font-normal opacity-60 ml-1.5',
  inline:  'text-xs font-normal opacity-60 ml-1',
  caption: 'text-[10px] font-normal opacity-60 ml-0.5',
};

function formatNumber(value: number, locale: string, decimals?: number): string {
  if (decimals === undefined) {
    return value.toLocaleString(locale);
  }
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function NumericValue({
  value,
  unit,
  variant = 'inline',
  sign,
  decimals,
  locale = 'de-DE',
  className,
  trailing,
  ...rest
}: NumericValueProps) {
  const displayValue =
    typeof value === 'number' ? formatNumber(value, locale, decimals) : value;

  return (
    <span
      className={cn(
        'tabular-nums',
        VARIANT_CLASSES[variant],
        className,
      )}
      style={{ fontFamily: 'var(--theme-font-numeric, ui-monospace, monospace)' }}
      {...rest}
    >
      {sign}
      {displayValue}
      {unit ? <span className={UNIT_CLASSES[variant]}>{unit}</span> : null}
      {trailing}
    </span>
  );
}
