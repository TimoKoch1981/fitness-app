/**
 * MealTimingPlanner — Configurable meal timing with protein distribution.
 * Shows vertical timeline with 4-8 meals, pre/post-workout highlighted.
 * Based on: Schoenfeld & Aragon 2018 (0.4-0.55g/kg per meal)
 * F15: Bodybuilder-Modus
 */

import { useState, useMemo } from 'react';
import { Minus, Plus, Dumbbell } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { PhaseMacros } from '../utils/phaseMacroCalculator';

interface MealTimingPlannerProps {
  baseMacros: PhaseMacros;
  bodyWeight: number;
}

interface MealSlot {
  time: string;
  label: string;
  isPreWorkout?: boolean;
  isPostWorkout?: boolean;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

const DEFAULT_MEAL_COUNT = 5;

export function MealTimingPlanner({ baseMacros, bodyWeight }: MealTimingPlannerProps) {
  const { language } = useTranslation();
  const t = language === 'de' ? DE : EN;

  const [mealCount, setMealCount] = useState(DEFAULT_MEAL_COUNT);
  const [workoutSlot, setWorkoutSlot] = useState(3); // 0-indexed, default: meal 4

  const meals = useMemo(() => {
    const { protein, carbs, fat } = baseMacros;

    // Evenly distribute, with pre/post workout getting slightly more carbs
    const baseProtein = Math.round(protein / mealCount);
    const baseCarbs = Math.round(carbs / mealCount);
    const baseFat = Math.round(fat / mealCount);

    // Generate time slots (evenly spaced from 07:00 to 21:00)
    const startHour = 7;
    const endHour = 21;
    const interval = (endHour - startHour) / (mealCount - 1);

    const slots: MealSlot[] = [];

    for (let i = 0; i < mealCount; i++) {
      const hour = Math.round(startHour + i * interval);
      const time = `${hour.toString().padStart(2, '0')}:00`;

      const isPreWorkout = i === workoutSlot - 1 && workoutSlot > 0;
      const isPostWorkout = i === workoutSlot;

      // Pre/post workout: +20% carbs, -10% fat
      const carbMod = (isPreWorkout || isPostWorkout) ? 1.2 : 1.0;
      const fatMod = (isPreWorkout || isPostWorkout) ? 0.85 : 1.0;

      const mealCarbs = Math.round(baseCarbs * carbMod);
      const mealFat = Math.round(baseFat * fatMod);
      const mealCals = baseProtein * 4 + mealCarbs * 4 + mealFat * 9;

      const label = i === 0
        ? t.breakfast
        : i === mealCount - 1
        ? t.lastMeal
        : isPreWorkout
        ? t.preWorkout
        : isPostWorkout
        ? t.postWorkout
        : `${t.meal} ${i + 1}`;

      slots.push({
        time,
        label,
        isPreWorkout,
        isPostWorkout,
        protein: baseProtein,
        carbs: mealCarbs,
        fat: mealFat,
        calories: Math.round(mealCals),
      });
    }

    return slots;
  }, [baseMacros, mealCount, workoutSlot, t]);

  // Optimal protein per meal range (Schoenfeld & Aragon 2018)
  const optProteinMin = Math.round(bodyWeight * 0.4);
  const optProteinMax = Math.round(bodyWeight * 0.55);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{t.title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMealCount(Math.max(4, mealCount - 1))}
            className="p-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            <Minus className="h-3 w-3 text-gray-600" />
          </button>
          <span className="text-sm font-medium text-gray-700 w-4 text-center">{mealCount}</span>
          <button
            onClick={() => setMealCount(Math.min(8, mealCount + 1))}
            className="p-1 rounded bg-gray-100 hover:bg-gray-200"
          >
            <Plus className="h-3 w-3 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Protein per meal info */}
      <p className="text-[10px] text-gray-500">
        {t.proteinPerMeal}: {baseMacros.proteinPerMeal.min}-{baseMacros.proteinPerMeal.max}g
        ({t.optimal}: {optProteinMin}-{optProteinMax}g, Schoenfeld & Aragon 2018)
      </p>

      {/* Timeline */}
      <div className="space-y-1">
        {meals.map((meal, i) => (
          <button
            key={i}
            onClick={() => setWorkoutSlot(i)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
              meal.isPreWorkout || meal.isPostWorkout
                ? 'bg-purple-50 border border-purple-200'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            {/* Time */}
            <span className="text-xs font-mono text-gray-500 w-10">{meal.time}</span>

            {/* Dot on timeline */}
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              meal.isPreWorkout || meal.isPostWorkout ? 'bg-purple-500' : 'bg-teal-400'
            }`} />

            {/* Label */}
            <span className="flex-1 text-xs font-medium text-gray-700">
              {meal.label}
              {(meal.isPreWorkout || meal.isPostWorkout) && (
                <Dumbbell className="h-3 w-3 inline ml-1 text-purple-500" />
              )}
            </span>

            {/* Macros */}
            <span className="text-[10px] text-gray-500">
              {meal.calories} kcal
            </span>
            <span className="text-[10px] text-teal-600">{meal.protein}P</span>
            <span className="text-[10px] text-blue-600">{meal.carbs}C</span>
            <span className="text-[10px] text-amber-600">{meal.fat}F</span>
          </button>
        ))}
      </div>

      <p className="text-[10px] text-gray-400">
        {t.hint}
      </p>
    </div>
  );
}

const DE = {
  title: 'Mahlzeiten-Timing',
  meal: 'Mahlzeit',
  breakfast: 'Fruehstueck',
  lastMeal: 'Letzte Mahlzeit',
  preWorkout: 'Pre-Workout',
  postWorkout: 'Post-Workout',
  proteinPerMeal: 'Protein pro Mahlzeit',
  optimal: 'Optimal',
  hint: 'Tippe auf eine Mahlzeit, um sie als Workout-Mahlzeit zu markieren. Pre/Post-Workout erhalten +20% Carbs.',
};

const EN = {
  title: 'Meal Timing',
  meal: 'Meal',
  breakfast: 'Breakfast',
  lastMeal: 'Last Meal',
  preWorkout: 'Pre-Workout',
  postWorkout: 'Post-Workout',
  proteinPerMeal: 'Protein per meal',
  optimal: 'Optimal',
  hint: 'Tap a meal to mark it as your workout meal. Pre/post-workout get +20% carbs.',
};
