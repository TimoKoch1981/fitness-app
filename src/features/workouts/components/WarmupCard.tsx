/**
 * WarmupCard — Cardio warm-up entry at the start of a workout session.
 * Quick-select buttons for common durations + cardio type dropdown.
 * Free-text field for custom warm-up description.
 * MET-based calorie calculation.
 */

import { useState } from 'react';
import { Flame, SkipForward, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { WarmupResult } from '../../../types/health';
import { calculateWarmupCalories } from '../utils/calorieCalculation';

interface WarmupCardProps {
  weightKg: number;
  onSave: (warmup: WarmupResult) => void;
  onSkip: () => void;
}

const CARDIO_TYPES = [
  { key: 'treadmill', de: 'Laufband', en: 'Treadmill' },
  { key: 'bike', de: 'Ergometer', en: 'Stationary Bike' },
  { key: 'rowing', de: 'Rudergerät', en: 'Rowing Machine' },
  { key: 'elliptical', de: 'Crosstrainer', en: 'Elliptical' },
  { key: 'jump_rope', de: 'Seilspringen', en: 'Jump Rope' },
  { key: 'walking', de: 'Gehen', en: 'Walking' },
] as const;

const QUICK_DURATIONS = [5, 10, 15, 20];

export function WarmupCard({ weightKg, onSave, onSkip }: WarmupCardProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const [duration, setDuration] = useState(10);
  const [cardioType, setCardioType] = useState('treadmill');
  const [customDescription, setCustomDescription] = useState('');

  const selectedCardio = CARDIO_TYPES.find(c => c.key === cardioType);
  const description = customDescription.trim()
    || `${duration} Min ${isDE ? selectedCardio?.de : selectedCardio?.en}`;

  const { calories, met } = calculateWarmupCalories(description, duration, weightKg);

  const handleSave = () => {
    onSave({
      description,
      duration_minutes: duration,
      calories_burned: calories,
      met_value: met,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-orange-500" />
        <h3 className="font-semibold text-gray-900">
          {isDE ? 'Aufwärmen (Cardio)' : 'Warm-up (Cardio)'}
        </h3>
      </div>

      {/* Cardio Type */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">
          {isDE ? 'Gerät / Art' : 'Equipment / Type'}
        </label>
        <div className="flex flex-wrap gap-2">
          {CARDIO_TYPES.map(ct => (
            <button
              key={ct.key}
              onClick={() => setCardioType(ct.key)}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                cardioType === ct.key
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isDE ? ct.de : ct.en}
            </button>
          ))}
        </div>
      </div>

      {/* Duration Quick Select */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">
          {isDE ? 'Dauer (Minuten)' : 'Duration (minutes)'}
        </label>
        <div className="flex gap-2">
          {QUICK_DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                duration === d
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {d} Min
            </button>
          ))}
        </div>
        {/* Custom duration input */}
        <input
          type="number"
          min={1}
          max={60}
          value={duration}
          onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
          className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder={isDE ? 'Oder eigene Dauer...' : 'Or custom duration...'}
        />
      </div>

      {/* Custom Description (optional) */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">
          {isDE ? 'Beschreibung (optional)' : 'Description (optional)'}
        </label>
        <input
          type="text"
          value={customDescription}
          onChange={e => setCustomDescription(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder={isDE ? 'z.B. Leichtes Joggen, Zone 2' : 'e.g. Light jogging, Zone 2'}
        />
      </div>

      {/* Calorie Preview */}
      <div className="bg-orange-50 rounded-lg px-3 py-2 flex items-center justify-between">
        <span className="text-sm text-orange-700">
          {isDE ? 'Geschätzter Verbrauch' : 'Estimated burn'}
        </span>
        <span className="text-sm font-semibold text-orange-700">
          ~{calories} kcal
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onSkip}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <SkipForward className="h-4 w-4" />
          {isDE ? 'Überspringen' : 'Skip'}
        </button>
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors font-medium"
        >
          <ChevronRight className="h-4 w-4" />
          {isDE ? 'Weiter' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
