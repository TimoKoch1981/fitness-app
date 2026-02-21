/**
 * DailyCheckinCard — Quick morning check-in widget.
 *
 * Renders a compact card with emoji-based rating for:
 * - Energy level (1-5)
 * - Sleep quality (1-5)
 * - Mood (1-5)
 * - Stress level (1-5)
 * - Pain areas (text input)
 * - Illness toggle
 *
 * Shown on the Cockpit page. Collapses to a summary after completion.
 */

import { useState, useCallback } from 'react';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useTodayCheckin, useAddCheckin } from '../hooks/useDailyCheckin';

const EMOJI_SCALE = ['😫', '😕', '😐', '🙂', '😄'];

interface RatingRowProps {
  label: string;
  value: number | undefined;
  onChange: (val: number) => void;
}

function RatingRow({ label, value, onChange }: RatingRowProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-20 flex-shrink-0">{label}</span>
      <div className="flex gap-1">
        {EMOJI_SCALE.map((emoji, idx) => {
          const level = idx + 1;
          const isSelected = value === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              className={`w-8 h-8 rounded-full text-base flex items-center justify-center transition-all ${
                isSelected
                  ? 'bg-teal-100 ring-2 ring-teal-500 scale-110'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              title={`${level}/5`}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DailyCheckinCard() {
  const { t } = useTranslation();
  const { data: existingCheckin, isLoading } = useTodayCheckin();
  const addCheckin = useAddCheckin();

  const [expanded, setExpanded] = useState(!existingCheckin);
  const [energy, setEnergy] = useState<number | undefined>(existingCheckin?.energy_level ?? undefined);
  const [sleep, setSleep] = useState<number | undefined>(existingCheckin?.sleep_quality ?? undefined);
  const [mood, setMood] = useState<number | undefined>(existingCheckin?.mood ?? undefined);
  const [stress, setStress] = useState<number | undefined>(existingCheckin?.stress_level ?? undefined);
  const [illness, setIllness] = useState(existingCheckin?.illness ?? false);
  const [saved, setSaved] = useState(!!existingCheckin);

  // Sync state when existing check-in loads
  const [lastLoadedId, setLastLoadedId] = useState<string | null>(null);
  if (existingCheckin && existingCheckin.id !== lastLoadedId) {
    setLastLoadedId(existingCheckin.id);
    setEnergy(existingCheckin.energy_level);
    setSleep(existingCheckin.sleep_quality);
    setMood(existingCheckin.mood);
    setStress(existingCheckin.stress_level);
    setIllness(existingCheckin.illness);
    setSaved(true);
    setExpanded(false);
  }

  const handleSave = useCallback(async () => {
    await addCheckin.mutateAsync({
      energy_level: energy,
      sleep_quality: sleep,
      mood: mood,
      stress_level: stress,
      illness,
    });
    setSaved(true);
    setExpanded(false);
  }, [energy, sleep, mood, stress, illness, addCheckin]);

  const hasAnyValue = energy || sleep || mood || stress;

  if (isLoading) return null;

  // Collapsed summary view
  if (!expanded && saved && existingCheckin) {
    return (
      <div
        onClick={() => setExpanded(true)}
        className="bg-white rounded-xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">{t.checkin.title}</span>
            <div className="flex gap-1 text-base">
              {existingCheckin.energy_level && <span title={t.checkin.energy}>{EMOJI_SCALE[existingCheckin.energy_level - 1]}</span>}
              {existingCheckin.sleep_quality && <span title={t.checkin.sleep}>{EMOJI_SCALE[existingCheckin.sleep_quality - 1]}</span>}
              {existingCheckin.mood && <span title={t.checkin.mood}>{EMOJI_SCALE[existingCheckin.mood - 1]}</span>}
              {existingCheckin.illness && <span title={t.checkin.illness}>🤒</span>}
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{t.checkin.title}</h3>
        {saved && (
          <button onClick={() => setExpanded(false)} className="p-1 text-gray-400 hover:text-gray-600">
            <ChevronUp className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-3">{t.checkin.subtitle}</p>

      {/* Ratings */}
      <div className="space-y-2.5">
        <RatingRow label={t.checkin.energy} value={energy} onChange={setEnergy} />
        <RatingRow label={t.checkin.sleep} value={sleep} onChange={setSleep} />
        <RatingRow label={t.checkin.mood} value={mood} onChange={setMood} />
        <RatingRow label={t.checkin.stress} value={stress} onChange={setStress} />
      </div>

      {/* Illness Toggle */}
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setIllness(!illness)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            illness
              ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          🤒 {t.checkin.illness}
        </button>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!hasAnyValue || addCheckin.isPending}
        className="w-full mt-3 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-1"
      >
        <Check className="h-3.5 w-3.5" />
        {saved ? t.checkin.update : t.checkin.save}
      </button>
    </div>
  );
}
