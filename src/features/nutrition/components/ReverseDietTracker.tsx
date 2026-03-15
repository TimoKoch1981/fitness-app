/**
 * ReverseDietTracker — Tracks weekly calorie increases + weight during reverse diet.
 *
 * Shows:
 * - Current week + target calories (auto-calculated from phaseMacroCalculator)
 * - Weight trend chart (LineChart) with acceptable gain corridor
 * - Warning if weight gain too fast (>0.5kg/week)
 *
 * Evidence: Trexler et al. 2014 — metabolic adaptation recovery
 * Visible only during reverse_diet phase + Power/Power+ mode.
 */

import { useMemo } from 'react';
import { TrendingUp, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useBodyMeasurements } from '../../body/hooks/useBodyMeasurements';

interface ReverseDietTrackerProps {
  language: 'de' | 'en';
  /** Weeks into the reverse diet phase */
  weeksIntoPhase: number;
  /** TDEE target */
  tdee: number;
  /** Current calorie target (from phaseMacroCalculator) */
  currentCalories: number;
  /** Date the phase started (ISO string) */
  phaseStartedAt: string | null;
}

export function ReverseDietTracker({
  language,
  weeksIntoPhase,
  tdee,
  currentCalories,
  phaseStartedAt,
}: ReverseDietTrackerProps) {
  const de = language === 'de';
  const { data: measurements } = useBodyMeasurements(60); // Last 60 entries

  // Filter to measurements since phase start
  const weightData = useMemo(() => {
    if (!measurements || !phaseStartedAt) return [];
    const startDate = new Date(phaseStartedAt);

    return measurements
      .filter(m => m.weight_kg && new Date(m.date) >= startDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(m => ({
        date: new Date(m.date).toLocaleDateString(de ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit' }),
        weight: m.weight_kg!,
        rawDate: m.date,
      }));
  }, [measurements, phaseStartedAt, de]);

  // Calculate weight change rate
  const weightTrend = useMemo(() => {
    if (weightData.length < 2) return null;
    const first = weightData[0];
    const last = weightData[weightData.length - 1];
    const totalChange = last.weight - first.weight;
    const daysDiff = Math.max(1, (new Date(last.rawDate).getTime() - new Date(first.rawDate).getTime()) / (24 * 60 * 60 * 1000));
    const weeklyChange = totalChange / (daysDiff / 7);
    return {
      totalChange: Math.round(totalChange * 10) / 10,
      weeklyChange: Math.round(weeklyChange * 100) / 100,
      isTooFast: weeklyChange > 0.5,
    };
  }, [weightData]);

  // Calorie progression milestones
  const calorieProgress = Math.min(100, Math.round((currentCalories / tdee) * 100));
  const caloriesToGo = Math.max(0, tdee - currentCalories);

  return (
    <div className="bg-white rounded-xl border border-blue-100 shadow-sm p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-700">
              {de ? 'Reverse Diet Tracker' : 'Reverse Diet Tracker'}
            </h3>
            <p className="text-[10px] text-gray-400">
              {de ? `Woche ${weeksIntoPhase}` : `Week ${weeksIntoPhase}`}
            </p>
          </div>
        </div>
      </div>

      {/* Calorie Progress */}
      <div className="bg-blue-50 rounded-lg p-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-blue-700 font-medium">
            {de ? 'Kalorien-Fortschritt' : 'Calorie Progress'}
          </span>
          <span className="text-xs font-bold text-blue-800">
            {currentCalories} / {tdee} kcal
          </span>
        </div>
        <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
            style={{ width: `${calorieProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-blue-500">
            +100 kcal/{de ? 'Woche' : 'week'}
          </span>
          <span className="text-[9px] text-blue-500">
            {caloriesToGo > 0
              ? (de ? `Noch ${caloriesToGo} kcal bis TDEE` : `${caloriesToGo} kcal to TDEE`)
              : (de ? 'TDEE erreicht!' : 'TDEE reached!')
            }
          </span>
        </div>
      </div>

      {/* Weight Trend Chart */}
      {weightData.length >= 2 && (
        <div>
          <p className="text-[10px] text-gray-500 font-medium mb-1">
            {de ? 'Gewichtsverlauf' : 'Weight Trend'}
          </p>
          <div className="h-[140px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  width={35}
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  tick={{ fontSize: 9, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  unit="kg"
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(val) => [`${val} kg`, de ? 'Gewicht' : 'Weight']}
                />
                {/* Acceptable gain corridor: +0.5kg/week from start */}
                {weightData[0] && (
                  <ReferenceLine
                    y={weightData[0].weight + (weeksIntoPhase * 0.5)}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{ value: 'Max', fontSize: 9, fill: '#ef4444' }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#6366f1' }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Weight Change Summary */}
      {weightTrend && (
        <div className={`rounded-lg p-2 flex items-center gap-2 ${
          weightTrend.isTooFast ? 'bg-red-50' : 'bg-green-50'
        }`}>
          {weightTrend.isTooFast ? (
            <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
          ) : (
            <ArrowUpRight className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className={`text-xs font-medium ${weightTrend.isTooFast ? 'text-red-700' : 'text-green-700'}`}>
              {weightTrend.totalChange > 0 ? '+' : ''}{weightTrend.totalChange} kg {de ? 'gesamt' : 'total'}
              {' • '}
              {weightTrend.weeklyChange > 0 ? '+' : ''}{weightTrend.weeklyChange} kg/{de ? 'Woche' : 'week'}
            </p>
            {weightTrend.isTooFast && (
              <p className="text-[10px] text-red-500">
                {de
                  ? 'Zunahme > 0.5 kg/Woche — Kalorien-Erhoehung verlangsamen'
                  : 'Gain > 0.5 kg/week — slow down calorie increase'
                }
              </p>
            )}
          </div>
        </div>
      )}

      {weightData.length < 2 && (
        <p className="text-[10px] text-gray-400 text-center py-2">
          {de
            ? 'Mindestens 2 Gewichtsmessungen noetig fuer Trendanzeige'
            : 'Need at least 2 weight measurements for trend display'
          }
        </p>
      )}

      {/* Evidence */}
      <p className="text-[9px] text-gray-300">
        Trexler et al. 2014 • {de ? 'Max. +0.5 kg/Woche empfohlen' : 'Max +0.5 kg/week recommended'}
      </p>
    </div>
  );
}
