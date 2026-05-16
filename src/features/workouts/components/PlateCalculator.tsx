/**
 * PlateCalculator — Inline-Component fuer Barbell-Plate-Loading (UX10).
 *
 * Zeigt zum aktuellen Zielgewicht die optimale Plate-Aufstellung pro Seite.
 * Klein, eingebettet im Tracker neben dem Gewichts-Input.
 */

import { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import {
  calculatePlates,
  STANDARD_BAR_KG,
  STANDARD_PLATES_KG,
} from '../../../lib/calculations/plateCalculator';

interface PlateCalculatorProps {
  /** Target weight in kg (incl. bar) */
  targetWeightKg: number;
  /** Optional bar override; defaults to 20 kg Olympic */
  barKg?: number;
  /** Optional custom plate inventory (z.B. wenn Heim-Gym anders ausgestattet) */
  availablePlates?: readonly number[];
  language?: 'de' | 'en';
  className?: string;
}

const PLATE_COLOR_HEX: Record<number, string> = {
  25: '#dc2626',   // red
  20: '#2563eb',   // blue
  15: '#eab308',   // yellow
  10: '#16a34a',   // green
  5: '#ffffff',    // white (with border)
  2.5: '#dc2626',  // small red
  1.25: '#16a34a', // small green
  0.5: '#9ca3af',  // gray
};

export function PlateCalculator({
  targetWeightKg,
  barKg = STANDARD_BAR_KG,
  availablePlates = STANDARD_PLATES_KG,
  language,
  className,
}: PlateCalculatorProps) {
  const [expanded, setExpanded] = useState(false);
  const isDE = (language ?? (typeof document !== 'undefined' && document.documentElement.lang === 'de' ? 'de' : 'en')) === 'de';

  const result = useMemo(
    () => calculatePlates(targetWeightKg, barKg, availablePlates),
    [targetWeightKg, barKg, availablePlates],
  );

  if (!targetWeightKg || targetWeightKg <= 0) return null;

  const totalPlates = result.plates.reduce((s, p) => s + p.countPerSide, 0);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
        title={isDE ? 'Plate-Calculator' : 'Plate Calculator'}
      >
        <Calculator className="h-3 w-3" aria-hidden="true" />
        {totalPlates === 0
          ? (isDE ? 'Nur Stange' : 'Bar only')
          : `${totalPlates}× ${isDE ? 'pro Seite' : 'per side'}`}
      </button>

      {expanded && (
        <div className="mt-1.5 p-2.5 bg-white rounded-lg border border-gray-200 shadow-sm space-y-2">
          <div className="text-[10px] text-gray-500 uppercase font-medium">
            {isDE ? 'Pro Seite' : 'Per side'} · Stange {barKg}kg
          </div>
          {/* Visual Plate-Stack */}
          <div className="flex items-center gap-0.5 flex-wrap">
            {result.plates.flatMap((p, i) =>
              Array.from({ length: p.countPerSide }, (_, j) => {
                const color = PLATE_COLOR_HEX[p.weight] ?? '#6b7280';
                const isWhite = p.weight === 5;
                // Hoehe skaliert mit Plate-Grosse (visuell)
                const h = Math.max(20, Math.min(48, 14 + p.weight * 1.5));
                return (
                  <div
                    key={`${i}-${j}`}
                    className={`w-2.5 rounded-sm flex items-center justify-center text-[8px] font-bold ${isWhite ? 'border border-gray-300 text-gray-700' : 'text-white'}`}
                    style={{ height: `${h}px`, backgroundColor: color }}
                    title={`${p.weight}kg`}
                  >
                    {p.weight >= 5 ? p.weight : ''}
                  </div>
                );
              }),
            )}
            {result.plates.length === 0 && (
              <span className="text-[11px] text-gray-400 italic">{isDE ? 'Keine Plates noetig' : 'No plates needed'}</span>
            )}
          </div>
          {/* Breakdown */}
          {result.plates.length > 0 && (
            <div className="text-xs text-gray-700 space-y-0.5">
              {result.plates.map((p, i) => (
                <div key={i} className="flex justify-between font-mono">
                  <span>{p.countPerSide}× {p.weight}kg</span>
                  <span className="text-gray-400">= {(p.countPerSide * p.weight).toFixed(1)}kg</span>
                </div>
              ))}
              <div className="flex justify-between font-mono pt-1 border-t border-gray-100">
                <span className="font-bold">{isDE ? 'Total' : 'Total'}</span>
                <span className="font-bold">{result.achievableKg}kg</span>
              </div>
            </div>
          )}
          {/* Residual-Warnung wenn target nicht exakt erreichbar */}
          {result.residualKg > 0.1 && (
            <div className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded">
              {isDE
                ? `⚠ ${result.residualKg}kg Differenz — keine kleinere Plate verfuegbar`
                : `⚠ ${result.residualKg}kg shortfall — no smaller plate available`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
