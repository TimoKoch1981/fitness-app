/**
 * MacroChart — Stacked bar chart showing P/C/F distribution per day.
 */

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { DailyNutrition } from '../hooks/useReportData';

interface MacroChartProps {
  data: DailyNutrition[];
  language?: 'de' | 'en';
}

export function MacroChart({ data, language = 'de' }: MacroChartProps) {
  if (data.length === 0) return null;

  const labels = {
    protein: language === 'de' ? 'Protein' : 'Protein',
    carbs: language === 'de' ? 'Kohlenhydrate' : 'Carbs',
    fat: language === 'de' ? 'Fett' : 'Fat',
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        {language === 'de' ? 'Makronährstoffe (g)' : 'Macronutrients (g)'}
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
            width={40}
            unit="g"
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any, name: any) => {
              const label = name === 'protein' ? labels.protein
                : name === 'carbs' ? labels.carbs
                : labels.fat;
              return [`${Math.round(value ?? 0)}g`, label];
            }) as any}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend
            formatter={(value: string) =>
              value === 'protein' ? labels.protein
              : value === 'carbs' ? labels.carbs
              : labels.fat
            }
            wrapperStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="protein" stackId="macro" fill="#3b82f6" radius={[0, 0, 0, 0]} maxBarSize={40} />
          <Bar dataKey="carbs" stackId="macro" fill="#f59e0b" radius={[0, 0, 0, 0]} maxBarSize={40} />
          <Bar dataKey="fat" stackId="macro" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
