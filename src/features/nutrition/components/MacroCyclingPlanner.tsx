/**
 * MacroCyclingPlanner — Week grid with High/Moderate/Low carb day types.
 * Protein constant, carbs/fat adjust. Shows daily macro targets.
 * F15: Bodybuilder-Modus
 */

import { useState, useMemo } from 'react';
import { useTranslation } from '../../../i18n';
import {
  generateMacroCyclingWeek,
  DAY_TYPE_INFO,
  type PhaseMacros,
  type DayType,
} from '../utils/phaseMacroCalculator';

interface MacroCyclingPlannerProps {
  baseMacros: PhaseMacros;
}

const WEEKDAYS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEFAULT_PATTERN: DayType[] = ['high', 'moderate', 'low', 'high', 'moderate', 'low', 'rest'];

export function MacroCyclingPlanner({ baseMacros }: MacroCyclingPlannerProps) {
  const { language } = useTranslation();
  const t = language === 'de' ? DE : EN;
  const weekdays = language === 'de' ? WEEKDAYS_DE : WEEKDAYS_EN;

  const [pattern, setPattern] = useState<DayType[]>(DEFAULT_PATTERN);

  const week = useMemo(() => generateMacroCyclingWeek(baseMacros, pattern), [baseMacros, pattern]);

  const cycleDayType = (index: number) => {
    const types: DayType[] = ['high', 'moderate', 'low', 'rest'];
    setPattern((prev) => {
      const next = [...prev];
      const current = next[index];
      const currentIdx = types.indexOf(current);
      next[index] = types[(currentIdx + 1) % types.length];
      return next;
    });
  };

  // Weekly averages
  const avgCalories = Math.round(week.reduce((s, d) => s + d.calories, 0) / 7);
  const avgCarbs = Math.round(week.reduce((s, d) => s + d.carbs, 0) / 7);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{t.title}</h3>
        <span className="text-xs text-gray-500">
          Ø {avgCalories} kcal | Ø {avgCarbs}g {t.carbs}
        </span>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {week.map((day, i) => {
          const info = DAY_TYPE_INFO[day.dayType];
          return (
            <div key={i} className="text-center space-y-1">
              <p className="text-[10px] font-medium text-gray-500">{weekdays[i]}</p>
              <button
                onClick={() => cycleDayType(i)}
                className={`w-full px-1 py-1 text-[9px] font-medium rounded-md ${info.color} transition-colors`}
                title={t.clickToChange}
              >
                {language === 'de' ? info.de : info.en}
              </button>
              <div className="text-[10px] text-gray-600 space-y-0.5">
                <p className="font-medium">{day.calories}</p>
                <p className="text-teal-600">{day.protein}P</p>
                <p className="text-blue-600">{day.carbs}C</p>
                <p className="text-amber-600">{day.fat}F</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-1">
        {(['high', 'moderate', 'low', 'rest'] as DayType[]).map((dt) => {
          const info = DAY_TYPE_INFO[dt];
          return (
            <span key={dt} className={`text-[10px] px-2 py-0.5 rounded-full ${info.color}`}>
              {language === 'de' ? info.de : info.en}
            </span>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-400">{t.hint}</p>
    </div>
  );
}

const DE = {
  title: 'Makro-Cycling',
  carbs: 'Carbs',
  clickToChange: 'Klicken zum Aendern',
  hint: 'Protein bleibt konstant. Carbs/Fett variieren nach Tag-Typ. Tippe auf einen Tag zum Aendern.',
};

const EN = {
  title: 'Macro Cycling',
  carbs: 'Carbs',
  clickToChange: 'Click to change',
  hint: 'Protein stays constant. Carbs/fat vary by day type. Tap a day to change.',
};
