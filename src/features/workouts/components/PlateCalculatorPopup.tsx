/**
 * PlateCalculatorPopup — Shows which plates to load on each side of the barbell.
 *
 * Compact, toggleable popup under the weight input.
 * Only visible for strength exercises with weight > bar weight.
 */

import { useState, useMemo } from 'react';
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { calculatePlateLoading, formatPlates } from '../utils/plateCalculator';

interface PlateCalculatorPopupProps {
  weight: number | null | undefined;
  barWeight?: number;
}

const PLATE_COLORS: Record<number, string> = {
  25: 'bg-red-500 text-white',
  20: 'bg-blue-500 text-white',
  15: 'bg-yellow-400 text-gray-900',
  10: 'bg-green-500 text-white',
  5: 'bg-white text-gray-800 border border-gray-300',
  2.5: 'bg-gray-800 text-white',
  1.25: 'bg-gray-400 text-white',
};

export function PlateCalculatorPopup({ weight, barWeight = 20 }: PlateCalculatorPopupProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const [expanded, setExpanded] = useState(false);

  const result = useMemo(
    () => (weight != null && weight > barWeight) ? calculatePlateLoading(weight, barWeight) : null,
    [weight, barWeight],
  );

  if (!result || result.plates.length === 0) return null;

  return (
    <div className="mt-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-teal-500 transition-colors"
      >
        <Calculator className="h-3 w-3" />
        <span>{isDE ? 'Hantelbeladung' : 'Plate Loading'}</span>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {expanded && (
        <div className="mt-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 space-y-1.5">
          {/* Bar weight */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500">{isDE ? 'Stange' : 'Bar'}</span>
            <span className="font-medium text-gray-700">{barWeight} kg</span>
          </div>

          {/* Per side */}
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-500">{isDE ? 'Pro Seite' : 'Per Side'}</span>
            <span className="font-medium text-gray-700">{result.perSide} kg</span>
          </div>

          {/* Visual plate representation */}
          <div className="flex items-center gap-0.5 justify-center py-1">
            {/* Bar end */}
            <div className="w-1.5 h-6 bg-gray-400 rounded-l" />
            {/* Plates (reversed to show from bar outward) */}
            {[...result.plates].reverse().map((plate, i) => {
              const heightClass = plate >= 20 ? 'h-8' : plate >= 10 ? 'h-7' : plate >= 5 ? 'h-6' : 'h-5';
              return (
                <div
                  key={i}
                  className={`w-3 ${heightClass} rounded-sm flex items-center justify-center ${PLATE_COLORS[plate] ?? 'bg-gray-300 text-gray-700'}`}
                  title={`${plate} kg`}
                >
                  <span className="text-[7px] font-bold rotate-90 whitespace-nowrap">
                    {plate}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Text summary */}
          <p className="text-[10px] text-center text-gray-500">
            {formatPlates(result.plates)}
          </p>

          {!result.isExact && result.closestWeight && (
            <p className="text-[10px] text-center text-amber-500">
              {isDE
                ? `Nächstes erreichbares Gewicht: ${result.closestWeight} kg`
                : `Closest achievable weight: ${result.closestWeight} kg`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
