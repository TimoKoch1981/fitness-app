/**
 * ShareProgressCard — Visual progress card for sharing.
 *
 * Renders a styled card with weekly fitness stats that can be
 * captured as an image via html2canvas. This component is designed
 * to look good both on-screen and when exported as a PNG.
 */

import { forwardRef } from 'react';
import { Flame, Zap, Dumbbell, Scale } from 'lucide-react';

export interface ShareCardData {
  displayName: string;
  currentWeight?: number;
  weightChange?: number; // positive = gained, negative = lost
  avgCalories: number;
  caloriesGoal: number;
  avgProtein: number;
  proteinGoal: number;
  workoutCount: number;
  weekLabel: string; // e.g. "KW 8 / 2026"
}

interface ShareProgressCardProps {
  data: ShareCardData;
  language: string;
}

export const ShareProgressCard = forwardRef<HTMLDivElement, ShareProgressCardProps>(
  function ShareProgressCard({ data, language }, ref) {
    const isDE = language === 'de';

    const weightChangeText = data.weightChange
      ? `${data.weightChange > 0 ? '+' : ''}${data.weightChange.toFixed(1)} kg`
      : null;

    const calPct = data.caloriesGoal > 0
      ? Math.min(100, Math.round((data.avgCalories / data.caloriesGoal) * 100))
      : 0;

    const protPct = data.proteinGoal > 0
      ? Math.min(100, Math.round((data.avgProtein / data.proteinGoal) * 100))
      : 0;

    return (
      <div
        ref={ref}
        className="w-[360px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-2xl"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold">{data.displayName}</h3>
            <p className="text-xs text-gray-400">{data.weekLabel}</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center">
            <span className="text-sm font-bold">FB</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Weight */}
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Scale className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                {isDE ? 'Gewicht' : 'Weight'}
              </span>
            </div>
            <p className="text-xl font-bold">
              {data.currentWeight ? `${data.currentWeight.toFixed(1)}` : '—'}
              <span className="text-xs font-normal text-gray-400 ml-1">kg</span>
            </p>
            {weightChangeText && (
              <p className={`text-[10px] mt-0.5 ${
                data.weightChange! < 0 ? 'text-green-400' : data.weightChange! > 0 ? 'text-orange-400' : 'text-gray-400'
              }`}>
                {weightChangeText} {isDE ? 'diese Woche' : 'this week'}
              </p>
            )}
          </div>

          {/* Workouts */}
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Dumbbell className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                {isDE ? 'Trainings' : 'Workouts'}
              </span>
            </div>
            <p className="text-xl font-bold">
              {data.workoutCount}
              <span className="text-xs font-normal text-gray-400 ml-1">
                {isDE ? 'Sessions' : 'sessions'}
              </span>
            </p>
          </div>
        </div>

        {/* Calories Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs text-gray-300">
                {isDE ? 'Ø Kalorien' : 'Avg Calories'}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {data.avgCalories} / {data.caloriesGoal} kcal
            </span>
          </div>
          <div className="bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-full h-2.5 transition-all"
              style={{ width: `${calPct}%` }}
            />
          </div>
        </div>

        {/* Protein Bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-gray-300">
                {isDE ? 'Ø Protein' : 'Avg Protein'}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {data.avgProtein}g / {data.proteinGoal}g
            </span>
          </div>
          <div className="bg-white/10 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full h-2.5 transition-all"
              style={{ width: `${protPct}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <span className="text-[10px] text-gray-500">fitbuddy.app</span>
          <span className="text-[10px] text-gray-500">
            {isDE ? 'Erstellt mit FitBuddy' : 'Made with FitBuddy'}
          </span>
        </div>
      </div>
    );
  }
);
