/**
 * ExerciseHistoryChart — Line chart showing weight and volume progression
 * for a single exercise over time.
 */

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useTranslation } from '../../../i18n';
import type { ExerciseProgressPoint } from '../hooks/useWorkoutHistory';

interface ExerciseHistoryChartProps {
  data: ExerciseProgressPoint[];
  showVolume?: boolean;
}

export function ExerciseHistoryChart({ data, showVolume = false }: ExerciseHistoryChartProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const chartData = useMemo(() =>
    data.map(d => ({
      ...d,
      label: new Date(d.date).toLocaleDateString(isDE ? 'de-DE' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
      }),
    })),
  [data, isDE]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        {isDE ? 'Noch keine Daten vorhanden' : 'No data available yet'}
      </div>
    );
  }

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
          />
          <YAxis
            yAxisId="weight"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={35}
            unit="kg"
          />
          {showVolume && (
            <YAxis
              yAxisId="volume"
              orientation="right"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
          )}
          <Tooltip
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            formatter={((value: number, name: string) => {
              if (name === 'maxWeight') return [`${value} kg`, isDE ? 'Max. Gewicht' : 'Max Weight'];
              if (name === 'totalVolume') return [`${value}`, isDE ? 'Volumen' : 'Volume'];
              return [value, name];
            }) as never}
          />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="maxWeight"
            stroke="#14b8a6"
            strokeWidth={2}
            dot={{ r: 4, fill: '#14b8a6' }}
            activeDot={{ r: 6 }}
          />
          {showVolume && (
            <Line
              yAxisId="volume"
              type="monotone"
              dataKey="totalVolume"
              stroke="#818cf8"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#818cf8' }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
