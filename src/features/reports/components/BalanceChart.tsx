/**
 * BalanceChart — Grouped bar chart showing daily calorie intake vs. TDEE expenditure.
 * Optional reference line for the user's calorie goal.
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
  Legend,
} from 'recharts';
import type { DailyBalance } from '../hooks/useReportData';

interface BalanceChartProps {
  data: DailyBalance[];
  language?: 'de' | 'en';
}

export function BalanceChart({ data, language = 'de' }: BalanceChartProps) {
  if (data.length === 0) return null;

  const labels = {
    intake: language === 'de' ? 'Aufnahme' : 'Intake',
    tdee: language === 'de' ? 'Verbrauch (TDEE)' : 'Expenditure (TDEE)',
    goal: language === 'de' ? 'Ziel' : 'Goal',
  };

  const goal = data[0]?.goal;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        {language === 'de' ? 'Kalorien-Bilanz' : 'Calorie Balance'}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
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
            formatter={((value: any, name: any) => {
              const v = Math.round(Number(value ?? 0));
              if (name === 'intake') return [`${v} kcal`, labels.intake];
              if (name === 'tdee') return [`${v} kcal`, labels.tdee];
              return [v, name];
            }) as any}
            labelFormatter={(label) => String(label)}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend
            formatter={(value: string) => {
              if (value === 'intake') return labels.intake;
              if (value === 'tdee') return labels.tdee;
              return value;
            }}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Bar
            dataKey="intake"
            fill="#14b8a6"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
            name="intake"
          />
          <Bar
            dataKey="tdee"
            fill="#f97316"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
            name="tdee"
          />
          {goal > 0 && (
            <ReferenceLine
              y={goal}
              stroke="#8b5cf6"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: `${labels.goal}: ${goal}`,
                position: 'right',
                fontSize: 10,
                fill: '#8b5cf6',
              }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
