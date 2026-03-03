/**
 * ProgressiveOverloadCharts — Visualizes strength progression and weekly volume.
 *
 * Chart 1: Estimated 1RM per exercise over time (LineChart)
 * Chart 2: Weekly volume (BarChart)
 *
 * Uses Recharts (already installed) with teal/emerald color scheme.
 */

import { useState, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingUp, BarChart3, Trophy, Dumbbell } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAllWorkoutHistory, getUniqueExerciseNames } from '../hooks/useWorkoutHistory';
import {
  getStrengthProgression,
  calculateWeeklyVolume,
} from '../../../lib/calculations/progressiveOverload';
import type { StrengthProgressionPoint, WeeklyVolumePoint } from '../../../lib/calculations/progressiveOverload';

type TimeRange = 4 | 8 | 12;

export function ProgressiveOverloadCharts() {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const [timeRange, setTimeRange] = useState<TimeRange>(8);
  const [selectedExercise, setSelectedExercise] = useState('');

  // Load all workout history (up to 200 for good time range coverage)
  const { data: workouts, isLoading } = useAllWorkoutHistory(200);

  // Unique exercise names for dropdown
  const exerciseNames = useMemo(
    () => (workouts ? getUniqueExerciseNames(workouts) : []),
    [workouts],
  );

  // Auto-select first exercise if none selected
  const activeExercise = selectedExercise || exerciseNames[0] || '';

  // Filter workouts by time range
  const cutoffDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - timeRange * 7);
    return d.toISOString().split('T')[0];
  }, [timeRange]);

  const filteredWorkouts = useMemo(
    () => workouts?.filter(w => w.date >= cutoffDate) ?? [],
    [workouts, cutoffDate],
  );

  // Calculate 1RM progression
  const strengthData = useMemo<StrengthProgressionPoint[]>(
    () => activeExercise ? getStrengthProgression(filteredWorkouts, activeExercise) : [],
    [filteredWorkouts, activeExercise],
  );

  // Calculate weekly volume (all exercises)
  const weeklyVolumeData = useMemo<WeeklyVolumePoint[]>(
    () => calculateWeeklyVolume(filteredWorkouts),
    [filteredWorkouts],
  );

  // Chart-ready data with formatted labels
  const strengthChartData = useMemo(
    () => strengthData.map(d => ({
      ...d,
      label: new Date(d.date).toLocaleDateString(isDE ? 'de-DE' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
      }),
    })),
    [strengthData, isDE],
  );

  // Stats
  const best1RM = strengthData.length > 0
    ? Math.max(...strengthData.map(p => p.estimated1RM))
    : 0;
  const latest1RM = strengthData.length > 0
    ? strengthData[strengthData.length - 1].estimated1RM
    : 0;
  const first1RM = strengthData.length > 0
    ? strengthData[0].estimated1RM
    : 0;
  const progressPct = first1RM > 0
    ? Math.round(((latest1RM - first1RM) / first1RM) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto" />
      </div>
    );
  }

  if (!workouts || workouts.length === 0 || exerciseNames.length === 0) {
    return (
      <div className="text-center py-12">
        <Dumbbell className="h-12 w-12 mx-auto text-gray-200 mb-3" />
        <p className="text-gray-400 text-sm">
          {isDE ? 'Noch keine Trainingsdaten vorhanden' : 'No workout data available yet'}
        </p>
        <p className="text-gray-300 text-xs mt-1">
          {isDE
            ? 'Starte ein Training mit dem Trainingsplan, um Fortschritte zu sehen'
            : 'Start a workout session to see your progress'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls: Exercise Selector + Time Range */}
      <div className="flex gap-2">
        <select
          value={activeExercise}
          onChange={e => setSelectedExercise(e.target.value)}
          className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {exerciseNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {([4, 8, 12] as TimeRange[]).map(weeks => (
            <button
              key={weeks}
              onClick={() => setTimeRange(weeks)}
              className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                timeRange === weeks
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {weeks}{isDE ? 'W' : 'w'}
            </button>
          ))}
        </div>
      </div>

      {/* 1RM Stats Cards */}
      {strengthData.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-teal-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy className="h-3.5 w-3.5 text-teal-600" />
              <p className="text-[10px] text-teal-600 font-medium">
                {isDE ? 'Bestes 1RM' : 'Best 1RM'}
              </p>
            </div>
            <p className="text-lg font-bold text-teal-700">{best1RM} kg</p>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              <p className="text-[10px] text-emerald-600 font-medium">
                {isDE ? 'Aktuell' : 'Current'}
              </p>
            </div>
            <p className="text-lg font-bold text-emerald-700">{latest1RM} kg</p>
          </div>
          <div className={`rounded-lg p-3 ${progressPct >= 0 ? 'bg-teal-50' : 'bg-red-50'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 className={`h-3.5 w-3.5 ${progressPct >= 0 ? 'text-teal-600' : 'text-red-500'}`} />
              <p className={`text-[10px] font-medium ${progressPct >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
                {isDE ? 'Fortschritt' : 'Progress'}
              </p>
            </div>
            <p className={`text-lg font-bold ${progressPct >= 0 ? 'text-teal-700' : 'text-red-600'}`}>
              {progressPct > 0 ? '+' : ''}{progressPct}%
            </p>
          </div>
        </div>
      )}

      {/* Chart 1: Estimated 1RM over time */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {isDE ? 'Geschaetztes 1RM' : 'Estimated 1RM'} &mdash; {activeExercise}
        </h3>
        {strengthChartData.length > 0 ? (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={strengthChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  unit="kg"
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                  formatter={((value: number, name: string) => {
                    if (name === 'estimated1RM') return [`${value} kg`, isDE ? 'Gesch. 1RM' : 'Est. 1RM'];
                    if (name === 'maxWeight') return [`${value} kg`, isDE ? 'Max Gewicht' : 'Max Weight'];
                    return [value, name];
                  }) as never}
                />
                <Line
                  type="monotone"
                  dataKey="estimated1RM"
                  stroke="#14b8a6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#14b8a6' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="maxWeight"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center py-8 text-sm text-gray-400">
            {isDE ? 'Keine Daten fuer diese Uebung im Zeitraum' : 'No data for this exercise in the selected period'}
          </p>
        )}
      </div>

      {/* Chart 2: Weekly Volume */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {isDE ? 'Woechentliches Volumen (alle Uebungen)' : 'Weekly Volume (all exercises)'}
        </h3>
        {weeklyVolumeData.length > 0 ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyVolumeData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                  formatter={((value: number, name: string) => {
                    if (name === 'totalVolume') return [
                      `${value.toLocaleString()} kg`,
                      isDE ? 'Volumen' : 'Volume',
                    ];
                    return [value, name];
                  }) as never}
                />
                <Bar
                  dataKey="totalVolume"
                  fill="#14b8a6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center py-8 text-sm text-gray-400">
            {isDE ? 'Keine Volumendaten im Zeitraum' : 'No volume data in the selected period'}
          </p>
        )}
      </div>
    </div>
  );
}
