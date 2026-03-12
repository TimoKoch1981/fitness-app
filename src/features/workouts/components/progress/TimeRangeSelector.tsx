/**
 * TimeRangeSelector — Preset buttons (1W, 4W, 8W, 12W, 1J) + custom date range.
 */
import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { useTranslation } from '../../../../i18n';

export type TimePreset = '1w' | '4w' | '8w' | '12w' | '1y' | 'custom';

export interface TimeRange {
  preset: TimePreset;
  from: string; // ISO date
  to: string;   // ISO date
}

function getPresetRange(preset: TimePreset): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  switch (preset) {
    case '1w': from.setDate(from.getDate() - 7); break;
    case '4w': from.setDate(from.getDate() - 28); break;
    case '8w': from.setDate(from.getDate() - 56); break;
    case '12w': from.setDate(from.getDate() - 84); break;
    case '1y': from.setFullYear(from.getFullYear() - 1); break;
    default: from.setDate(from.getDate() - 56); // default 8w
  }
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}

interface Props {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const PRESETS: { key: TimePreset; label: string }[] = [
  { key: '1w', label: '1W' },
  { key: '4w', label: '4W' },
  { key: '8w', label: '8W' },
  { key: '12w', label: '12W' },
  { key: '1y', label: '1J' },
];

export function TimeRangeSelector({ value, onChange }: Props) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const [showCustom, setShowCustom] = useState(value.preset === 'custom');
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);

  const handlePreset = (preset: TimePreset) => {
    setShowCustom(false);
    const range = getPresetRange(preset);
    onChange({ preset, ...range });
  };

  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onChange({ preset: 'custom', from: customFrom, to: customTo });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {PRESETS.map(p => (
          <button
            key={p.key}
            onClick={() => handlePreset(p.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              value.preset === p.key && !showCustom
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={`p-1.5 rounded-lg transition-colors ${
            showCustom ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={isDE ? 'Benutzerdefiniert' : 'Custom range'}
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>
      {showCustom && (
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            value={customFrom}
            onChange={e => setCustomFrom(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <span className="text-gray-400">–</span>
          <input
            type="date"
            value={customTo}
            onChange={e => setCustomTo(e.target.value)}
            className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <button
            onClick={handleCustomApply}
            className="px-3 py-1.5 text-xs font-medium bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            {isDE ? 'OK' : 'Apply'}
          </button>
        </div>
      )}
    </div>
  );
}

export { getPresetRange };
