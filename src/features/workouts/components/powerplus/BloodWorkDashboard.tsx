/**
 * Blood Work Dashboard Widget
 * Compact summary card showing the latest blood work markers.
 * Color-coded: green (normal), amber (borderline), red (out of range).
 * Visible in Power+ mode when showBloodWorkDashboard is true.
 */

import { useState } from 'react';
import { Beaker, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import { useLatestBloodWork } from '../../../medical/hooks/useBloodWork';

/** Reference ranges (male, standard clinical) */
interface MarkerRange {
  key: keyof typeof MARKER_KEYS;
  label: string;
  unit: string;
  low: number;
  high: number;
}

const MARKER_KEYS = {
  testosterone_total: true,
  estradiol: true,
  hematocrit: true,
  hemoglobin: true,
  hdl: true,
  ldl: true,
  ast: true,
  alt: true,
  creatinine: true,
  psa: true,
} as const;

function getMarkerRanges(t: Record<string, string>): MarkerRange[] {
  return [
    { key: 'testosterone_total', label: t.testosterone ?? 'Testosteron', unit: 'ng/dL', low: 300, high: 1000 },
    { key: 'estradiol', label: t.estradiol ?? 'Estradiol', unit: 'pg/mL', low: 10, high: 40 },
    { key: 'hematocrit', label: t.hematocrit ?? 'Hämatokrit', unit: '%', low: 38, high: 52 },
    { key: 'hemoglobin', label: t.hemoglobin ?? 'Hämoglobin', unit: 'g/dL', low: 13.5, high: 17.5 },
    { key: 'hdl', label: 'HDL', unit: 'mg/dL', low: 40, high: 200 },
    { key: 'ldl', label: 'LDL', unit: 'mg/dL', low: 0, high: 130 },
    { key: 'ast', label: 'AST (GOT)', unit: 'U/L', low: 0, high: 50 },
    { key: 'alt', label: 'ALT (GPT)', unit: 'U/L', low: 0, high: 50 },
    { key: 'creatinine', label: t.creatinine ?? 'Kreatinin', unit: 'mg/dL', low: 0.7, high: 1.3 },
    { key: 'psa', label: 'PSA', unit: 'ng/mL', low: 0, high: 4 },
  ];
}

function getStatus(value: number, low: number, high: number): 'normal' | 'warning' | 'danger' {
  if (value < low * 0.8 || value > high * 1.2) return 'danger';
  if (value < low || value > high) return 'warning';
  return 'normal';
}

const STATUS_COLORS = {
  normal: 'text-green-600 bg-green-50',
  warning: 'text-amber-600 bg-amber-50',
  danger: 'text-red-600 bg-red-50',
};

export function BloodWorkDashboard() {
  const { t } = useTranslation();
  const { data: latest, isLoading } = useLatestBloodWork();
  const [expanded, setExpanded] = useState(false);

  if (isLoading || !latest) return null;

  const markers = getMarkerRanges(t.powerPlus as unknown as Record<string, string>);

  // Filter to markers that have data
  const availableMarkers = markers.filter(m => {
    const val = latest[m.key as keyof typeof latest];
    return val !== undefined && val !== null;
  });

  if (availableMarkers.length === 0) return null;

  // Count issues
  const issues = availableMarkers.filter(m => {
    const val = latest[m.key as keyof typeof latest] as number;
    return getStatus(val, m.low, m.high) !== 'normal';
  });

  const displayMarkers = expanded ? availableMarkers : availableMarkers.slice(0, 4);

  const daysAgo = latest.date
    ? Math.floor((Date.now() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="rounded-xl border bg-white border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Beaker className="h-4 w-4 text-teal-500" />
          <h3 className="text-sm font-semibold text-gray-900">
            {t.powerPlus.bloodWorkDashboard}
          </h3>
          {issues.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-medium">
              {issues.length} {t.powerPlus.outOfRange}
            </span>
          )}
        </div>
        {daysAgo !== null && (
          <span className="text-[10px] text-gray-400">
            {daysAgo === 0 ? t.common.today : `${daysAgo}d`}
          </span>
        )}
      </div>

      {/* Marker Grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {displayMarkers.map(marker => {
          const val = latest[marker.key as keyof typeof latest] as number;
          const status = getStatus(val, marker.low, marker.high);
          return (
            <div
              key={marker.key}
              className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${STATUS_COLORS[status]}`}
            >
              <span className="text-[10px] font-medium truncate mr-1">
                {marker.label}
              </span>
              <span className="text-[11px] font-bold whitespace-nowrap">
                {typeof val === 'number' ? val.toFixed(val < 10 ? 1 : 0) : val} {marker.unit}
              </span>
            </div>
          );
        })}
      </div>

      {/* Expand/Collapse */}
      {availableMarkers.length > 4 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center gap-1 w-full mt-2 py-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded ? (
            <>
              {t.powerPlus.showLess} <ChevronUp className="h-3 w-3" />
            </>
          ) : (
            <>
              {t.powerPlus.showAll} ({availableMarkers.length}) <ChevronDown className="h-3 w-3" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
