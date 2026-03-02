/**
 * WeightChart — Line chart showing weight (and optionally body fat %) over time.
 */

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { BodyDataPoint } from '../hooks/useReportData';

interface WeightChartProps {
  data: BodyDataPoint[];
  showBodyFat?: boolean;
  language?: string;
}

export function WeightChart({ data, showBodyFat = true, language = 'de' }: WeightChartProps) {
  if (data.length === 0) return null;

  const hasBodyFat = showBodyFat && data.some((d) => d.body_fat_pct != null);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        {language === 'de' ? 'Gewichtsverlauf' : 'Weight Trend'}
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="weight"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={40}
            unit="kg"
            domain={['dataMin - 2', 'dataMax + 2']}
          />
          {hasBodyFat && (
            <YAxis
              yAxisId="bf"
              orientation="right"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={35}
              unit="%"
              domain={['dataMin - 2', 'dataMax + 2']}
            />
          )}
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any, name: any) => {
              const v = Number(value ?? 0);
              if (name === 'weight_kg') return [`${v.toFixed(1)} kg`, language === 'de' ? 'Gewicht' : 'Weight'];
              if (name === 'body_fat_pct') return [`${v.toFixed(1)}%`, language === 'de' ? 'Körperfett' : 'Body Fat'];
              return [v, name];
            }) as any}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend
            formatter={(value: string) => {
              if (value === 'weight_kg') return language === 'de' ? 'Gewicht' : 'Weight';
              if (value === 'body_fat_pct') return language === 'de' ? 'Körperfett' : 'Body Fat';
              return value;
            }}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Line
            yAxisId="weight"
            type="monotone"
            dataKey="weight_kg"
            stroke="#14b8a6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#14b8a6' }}
            activeDot={{ r: 5 }}
            connectNulls
          />
          {hasBodyFat && (
            <Line
              yAxisId="bf"
              type="monotone"
              dataKey="body_fat_pct"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ r: 3, fill: '#f59e0b' }}
              activeDot={{ r: 5 }}
              connectNulls
              strokeDasharray="5 5"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
