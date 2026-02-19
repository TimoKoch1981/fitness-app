/**
 * BloodPressureChart — Line chart showing systolic/diastolic/pulse trends.
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
  ReferenceLine,
} from 'recharts';
import type { BPDataPoint } from '../hooks/useReportData';

interface BloodPressureChartProps {
  data: BPDataPoint[];
  language?: 'de' | 'en';
}

export function BloodPressureChart({ data, language = 'de' }: BloodPressureChartProps) {
  if (data.length === 0) return null;

  const hasPulse = data.some((d) => d.pulse != null);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        {language === 'de' ? 'Blutdruck-Verlauf' : 'Blood Pressure Trend'}
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
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={40}
            domain={[40, 180]}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any, name: any) => {
              const v = Number(value ?? 0);
              if (name === 'systolic') return [`${v} mmHg`, language === 'de' ? 'Systolisch' : 'Systolic'];
              if (name === 'diastolic') return [`${v} mmHg`, language === 'de' ? 'Diastolisch' : 'Diastolic'];
              if (name === 'pulse') return [`${v} bpm`, language === 'de' ? 'Puls' : 'Pulse'];
              return [v, name];
            }) as any}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend
            formatter={(value: string) => {
              if (value === 'systolic') return language === 'de' ? 'Systolisch' : 'Systolic';
              if (value === 'diastolic') return language === 'de' ? 'Diastolisch' : 'Diastolic';
              if (value === 'pulse') return language === 'de' ? 'Puls' : 'Pulse';
              return value;
            }}
            wrapperStyle={{ fontSize: 11 }}
          />
          {/* Normal range reference lines */}
          <ReferenceLine y={120} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Line
            type="monotone"
            dataKey="systolic"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3, fill: '#ef4444' }}
            activeDot={{ r: 5 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="diastolic"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#3b82f6' }}
            activeDot={{ r: 5 }}
            connectNulls
          />
          {hasPulse && (
            <Line
              type="monotone"
              dataKey="pulse"
              stroke="#a855f7"
              strokeWidth={1.5}
              dot={{ r: 2, fill: '#a855f7' }}
              activeDot={{ r: 4 }}
              connectNulls
              strokeDasharray="5 5"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
