/**
 * WorkoutChart — Bar chart showing daily workout count and duration.
 */

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { DailyWorkout } from '../hooks/useReportData';

interface WorkoutChartProps {
  data: DailyWorkout[];
  language?: 'de' | 'en';
}

export function WorkoutChart({ data, language = 'de' }: WorkoutChartProps) {
  if (data.length === 0) return null;

  // Check if any workout has duration data
  const hasDuration = data.some((d) => d.totalDuration > 0);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        {language === 'de' ? 'Training pro Tag' : 'Workouts per Day'}
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={35}
            allowDecimals={false}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any, name: any) => {
              const v = Number(value ?? 0);
              if (name === 'totalDuration') return [`${v} min`, language === 'de' ? 'Dauer' : 'Duration'];
              if (name === 'workoutCount') return [v, language === 'de' ? 'Einheiten' : 'Sessions'];
              return [v, name];
            }) as any}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          {hasDuration ? (
            <Bar
              dataKey="totalDuration"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              name="totalDuration"
            />
          ) : (
            <Bar
              dataKey="workoutCount"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              name="workoutCount"
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
