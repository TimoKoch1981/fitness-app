/**
 * E1RMChart — Estimated 1RM progression per exercise (line chart).
 */
import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useTranslation } from '../../../../i18n';
import { getStrengthProgression } from '../../../../lib/calculations/progressiveOverload';
import type { TimeRange } from './TimeRangeSelector';

interface E1RMChartProps {
  workouts: any[];
  timeRange: TimeRange;
}

export function E1RMChart({ workouts, timeRange }: E1RMChartProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const exerciseNames = useMemo(() => {
    if (!workouts?.length) return [];
    const names = new Set<string>();
    for (const w of workouts) {
      const exercises = w.session_exercises || w.exercises || [];
      for (const ex of exercises) {
        if (ex.name && ex.exercise_type !== 'cardio') names.add(ex.name);
      }
    }
    return Array.from(names).sort();
  }, [workouts]);

  const [selectedExercise, setSelectedExercise] = useState('');

  // Auto-select first exercise
  const exercise = selectedExercise || exerciseNames[0] || '';

  const data = useMemo(() => {
    if (!exercise || !workouts?.length) return [];
    const points = getStrengthProgression(workouts, exercise);
    return points.filter(p => p.date >= timeRange.from && p.date <= timeRange.to);
  }, [workouts, exercise, timeRange]);

  const best1RM = data.length > 0 ? Math.max(...data.map(p => p.estimated1RM)) : 0;
  const current1RM = data.length > 0 ? data[data.length - 1].estimated1RM : 0;
  const progress = data.length >= 2 && data[0].estimated1RM > 0
    ? Math.round(((current1RM - data[0].estimated1RM) / data[0].estimated1RM) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-2">
        {isDE ? 'Gesch\u00e4tztes 1RM' : 'Estimated 1RM'}
      </h4>
      {/* Exercise selector */}
      <select
        value={exercise}
        onChange={e => setSelectedExercise(e.target.value)}
        className="w-full mb-3 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
      >
        {exerciseNames.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-[10px] text-gray-400 uppercase">{isDE ? 'Bestes' : 'Best'}</p>
          <p className="text-sm font-bold text-gray-900">{Math.round(best1RM)} kg</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-400 uppercase">{isDE ? 'Aktuell' : 'Current'}</p>
          <p className="text-sm font-bold text-gray-900">{Math.round(current1RM)} kg</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-400 uppercase">{isDE ? 'Fortschritt' : 'Progress'}</p>
          <p className={`text-sm font-bold ${progress > 0 ? 'text-green-600' : progress < 0 ? 'text-red-500' : 'text-gray-500'}`}>
            {progress > 0 ? '+' : ''}{progress}%
          </p>
        </div>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} width={40} domain={['auto', 'auto']} />
            <Tooltip
              formatter={(val: number) => [`${Math.round(val)} kg`]}
              labelFormatter={d => d}
              contentStyle={{ fontSize: 12 }}
            />
            <Line type="monotone" dataKey="estimated1RM" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} name="e1RM" />
            <Line type="monotone" dataKey="maxWeight" stroke="#10b981" strokeWidth={1} strokeDasharray="4 2" dot={false} name="Max kg" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">
          {isDE ? 'Keine Daten f\u00fcr diese \u00dcbung' : 'No data for this exercise'}
        </div>
      )}
    </div>
  );
}
