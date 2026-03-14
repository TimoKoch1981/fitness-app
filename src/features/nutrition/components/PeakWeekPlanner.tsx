/**
 * PeakWeekPlanner — 7-day peak week nutrition protocol.
 * Only visible when phase=peak_week + showPeakWeekNutrition flag.
 * Days 1-3: Carb Depletion, Days 4-6: Carb Loading, Day 7: Show Day.
 * F15: Bodybuilder-Modus
 */

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { calculatePhaseMacros, type PhaseMacroInput } from '../utils/phaseMacroCalculator';

interface PeakWeekPlannerProps {
  tdee: number;
  bodyWeight: number;
  bodyFatPct?: number;
}

export function PeakWeekPlanner({ tdee, bodyWeight, bodyFatPct }: PeakWeekPlannerProps) {
  const { language } = useTranslation();
  const t = language === 'de' ? DE : EN;

  const [selectedDay, setSelectedDay] = useState(1);

  const days = Array.from({ length: 7 }, (_, i) => {
    const dayNum = i + 1;
    const input: PhaseMacroInput = {
      tdee,
      phase: 'peak_week',
      weeksIntoPhase: dayNum,
      bodyWeight,
      bodyFatPct,
    };
    return {
      day: dayNum,
      macros: calculatePhaseMacros(input),
      phase: dayNum <= 3 ? 'depletion' : dayNum <= 6 ? 'loading' : 'show',
    };
  });

  const selected = days[selectedDay - 1];

  return (
    <div className="bg-white rounded-xl border border-purple-200 p-4 space-y-3">
      {/* Warning Banner */}
      <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">{t.warning}</p>
      </div>

      <h3 className="text-sm font-semibold text-gray-900">{t.title}</h3>

      {/* Day Selector */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => (
          <button
            key={d.day}
            onClick={() => setSelectedDay(d.day)}
            className={`py-2 text-center rounded-lg text-xs font-medium transition-colors ${
              selectedDay === d.day
                ? d.phase === 'depletion'
                  ? 'bg-red-500 text-white'
                  : d.phase === 'loading'
                  ? 'bg-green-500 text-white'
                  : 'bg-purple-500 text-white'
                : d.phase === 'depletion'
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : d.phase === 'loading'
                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <span className="block text-[10px]">{t.day}</span>
            {d.day}
          </button>
        ))}
      </div>

      {/* Phase Labels */}
      <div className="grid grid-cols-3 gap-1 text-center">
        <span className="text-[10px] text-red-600 bg-red-50 rounded py-0.5">{t.depletion}</span>
        <span className="text-[10px] text-green-600 bg-green-50 rounded py-0.5">{t.loading}</span>
        <span className="text-[10px] text-purple-600 bg-purple-50 rounded py-0.5">{t.showDay}</span>
      </div>

      {/* Selected Day Details */}
      {selected && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">
            {selected.macros.phaseLabelDe && language === 'de'
              ? selected.macros.phaseLabelDe
              : selected.macros.phaseLabelEn}
          </p>

          {/* Macros */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-gray-50 rounded-lg py-2">
              <p className="text-sm font-bold text-gray-900">{selected.macros.calories}</p>
              <p className="text-[10px] text-gray-500">kcal</p>
            </div>
            <div className="bg-teal-50 rounded-lg py-2">
              <p className="text-sm font-bold text-teal-700">{selected.macros.protein}g</p>
              <p className="text-[10px] text-teal-600">Protein</p>
            </div>
            <div className="bg-blue-50 rounded-lg py-2">
              <p className="text-sm font-bold text-blue-700">{selected.macros.carbs}g</p>
              <p className="text-[10px] text-blue-600">Carbs</p>
            </div>
            <div className="bg-amber-50 rounded-lg py-2">
              <p className="text-sm font-bold text-amber-700">{selected.macros.fat}g</p>
              <p className="text-[10px] text-amber-600">{t.fat}</p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            {selected.macros.notes.map((note, i) => (
              <p key={i} className="text-[10px] text-gray-600">
                {language === 'de' ? note.de : note.en}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const DE = {
  title: 'Peak Week Protokoll',
  warning: 'Peak Week ist ein fortgeschrittenes Protokoll. Umsetzung nur in Absprache mit deinem Coach!',
  day: 'Tag',
  depletion: 'Depletion',
  loading: 'Loading',
  showDay: 'Show Day',
  fat: 'Fett',
};

const EN = {
  title: 'Peak Week Protocol',
  warning: 'Peak week is an advanced protocol. Only implement under guidance of your coach!',
  day: 'Day',
  depletion: 'Depletion',
  loading: 'Loading',
  showDay: 'Show Day',
  fat: 'Fat',
};
