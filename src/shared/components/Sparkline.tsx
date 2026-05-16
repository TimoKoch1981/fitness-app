/**
 * Sparkline — Inline-Trend-Linie fuer Cockpit-Cards (UX15).
 *
 * Pure SVG, kein chart-library Overhead. Zeigt nur die Linie selbst — keine
 * Achsen, Labels, Grid. Default ~80x24px, kompakt fuer Card-Footer.
 *
 * Last-Punkt wird groesser gezeichnet (active dot).
 * Trend-Farbe optional (positiv = gruen, negativ = rot, neutral = grau).
 */

import { useMemo } from 'react';

interface SparklineProps {
  /** Data points (chronological, oldest first) */
  data: number[];
  /** Width in pixels (defaults 80) */
  width?: number;
  /** Height in pixels (defaults 24) */
  height?: number;
  /** Stroke color — defaults to currentColor (inherits text-color) */
  color?: string;
  /** Fill-area under the line (subtle gradient). Default false. */
  filled?: boolean;
  /** Whether the trend is positive/negative/neutral. Sets color if not explicit. */
  trend?: 'up' | 'down' | 'neutral';
  /** Label for screen-readers */
  ariaLabel?: string;
  className?: string;
}

const TREND_COLORS: Record<NonNullable<SparklineProps['trend']>, string> = {
  up:      '#16a34a',  // green-600
  down:    '#dc2626',  // red-600
  neutral: '#6b7280',  // gray-500
};

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color,
  filled = false,
  trend,
  ariaLabel,
  className,
}: SparklineProps) {
  const stroke = color ?? (trend ? TREND_COLORS[trend] : 'currentColor');
  const padding = 2;  // vertikales Padding, damit die Linie nicht am Rand schneidet

  const { pathD, lastPoint, areaD } = useMemo(() => {
    if (!data.length) return { pathD: '', lastPoint: null, areaD: '' };
    if (data.length === 1) {
      // Einzelpunkt: zentriere als Punkt
      const cx = width / 2;
      const cy = height / 2;
      return { pathD: `M ${cx} ${cy}`, lastPoint: { x: cx, y: cy }, areaD: '' };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;  // avoid div/0 wenn alle gleich

    const xStep = (width - padding * 2) / (data.length - 1);
    const points = data.map((v, i) => {
      const x = padding + i * xStep;
      // y inverted: max -> top, min -> bottom
      const y = padding + (height - padding * 2) * (1 - (v - min) / range);
      return { x, y };
    });

    const path = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(' ');

    const area = filled
      ? `${path} L ${points[points.length - 1].x.toFixed(2)} ${height - padding} L ${padding} ${height - padding} Z`
      : '';

    return { pathD: path, lastPoint: points[points.length - 1], areaD: area };
  }, [data, width, height, padding, filled]);

  if (!data.length) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel ?? `Sparkline mit ${data.length} Datenpunkten`}
      className={className}
    >
      {filled && areaD && (
        <path d={areaD} fill={stroke} fillOpacity={0.15} stroke="none" />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {lastPoint && (
        <circle cx={lastPoint.x} cy={lastPoint.y} r={2} fill={stroke} />
      )}
    </svg>
  );
}
