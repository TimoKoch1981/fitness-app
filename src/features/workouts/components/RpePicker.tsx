/**
 * RpePicker — Inline RPE (Rate of Perceived Exertion) 1-10 selector.
 *
 * UX2: Erscheint nach abgeschlossenem Satz fuer Effort-Tracking.
 * Default unset (kein Druck zum Loggen). Compact: kleine Chip-Bar.
 *
 * Skala:
 *   1-5  : sehr leicht (Warmup-Bereich)
 *   6    : ~4 RIR
 *   7    : ~3 RIR
 *   8    : 2 RIR (typische Hypertrophy-Schwelle)
 *   9    : 1 RIR (heavy)
 *   10   : Max-Effort / Failure
 */

interface RpePickerProps {
  /** Current RPE value (1-10), or undefined for unset */
  value?: number;
  /** Called when user selects a new value (1-10). No toggle-off — to "unset"
   *  the user picks a different value. Keeps the reducer-API simple. */
  onChange: (newValue: number) => void;
  /** Optional language override; defaults to checking <html lang> */
  language?: 'de' | 'en';
  className?: string;
}

const HIGH_INTENSITY_THRESHOLD = 8;  // 8+ wird visuell hervorgehoben (Hypertrophy/PowerZone)

export function RpePicker({ value, onChange, language, className }: RpePickerProps) {
  const isDE = (language ?? (typeof document !== 'undefined' && document.documentElement.lang === 'de' ? 'de' : 'en')) === 'de';

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ''}`}>
      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide" title={isDE ? 'Rate of Perceived Exertion' : 'Rate of Perceived Exertion'}>
        RPE
      </span>
      <div className="flex gap-0.5" role="radiogroup" aria-label={isDE ? 'Wahrgenommene Anstrengung 1-10' : 'Perceived effort 1-10'}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
          const isSelected = value === n;
          const isHigh = n >= HIGH_INTENSITY_THRESHOLD;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(n)}
              className={`min-w-[24px] h-6 px-1 rounded text-[11px] font-medium transition-colors ${
                isSelected
                  ? (isHigh ? 'bg-orange-500 text-white' : 'bg-theme-primary text-white')
                  : (isHigh ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100')
              }`}
              title={n === 10
                ? (isDE ? 'Max-Effort / Failure' : 'Max effort / failure')
                : n === 9
                  ? (isDE ? '1 RIR (sehr schwer)' : '1 RIR (very hard)')
                  : n === 8
                    ? (isDE ? '2 RIR (schwer)' : '2 RIR (hard)')
                    : (isDE ? `RPE ${n}` : `RPE ${n}`)}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
