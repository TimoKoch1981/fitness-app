/**
 * CalorieChart — Bar chart showing daily calorie intake vs. goal.
 */

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import type { DailyNutrition } from '../hooks/useReportData';

interface CalorieChartProps {
  data: DailyNutrition[];
  calorieGoal?: number;
  language?: 'de' | 'en';
}

export function CalorieChart({ data, calorieGoal, language = 'de' }: CalorieChartProps) {
  if (data.length === 0) return null;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        {language === 'de' ? 'Kalorien pro Tag' : 'Calories per Day'}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
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
            width={45}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any) => [`${Math.round(value ?? 0)} kcal`, language === 'de' ? 'Kalorien' : 'Calories']) as any}
            labelFormatter={(label) => String(label)}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Bar
            dataKey="calories"
            fill="#14b8a6"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          {calorieGoal && (
            <ReferenceLine
              y={calorieGoal}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `${language === 'de' ? 'Ziel' : 'Goal'}: ${calorieGoal}`,
                position: 'right',
                fontSize: 10,
                fill: '#f59e0b',
              }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
