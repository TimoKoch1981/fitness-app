/**
 * BloodPressureChart — Systolic/Diastolic dual line chart.
 */
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useTranslation } from '../../../../i18n';
import { useBloodPressureLogs } from '../../../medical/hooks/useBloodPressure';
import type { TimeRange } from './TimeRangeSelector';

interface BloodPressureChartProps {
  timeRange: TimeRange;
}

export function BloodPressureChart({ timeRange }: BloodPressureChartProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { data: logs, isLoading } = useBloodPressureLogs(200);

  const chartData = useMemo(() => {
    if (!logs?.length) return [];
    return logs
      .filter(l => l.date >= timeRange.from && l.date <= timeRange.to)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(l => ({
        date: l.date,
        label: l.date.slice(5),
        systolic: l.systolic,
        diastolic: l.diastolic,
        pulse: l.pulse,
      }));
  }, [logs, timeRange]);

  if (isLoading) return <div className="bg-white rounded-xl shadow-sm p-4 h-48 animate-pulse" />;
  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">{isDE ? 'Blutdruck' : 'Blood Pressure'}</h4>
        <p className="text-sm text-gray-400 py-4 text-center">{isDE ? 'Keine Blutdruckdaten' : 'No blood pressure data'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">{isDE ? 'Blutdruck' : 'Blood Pressure'}</h4>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <XAxis dataKey="label" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 10 }} width={35} domain={[60, 180]} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="3 3" />
          <ReferenceLine y={90} stroke="#f59e0b" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} name="Systolisch" />
          <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} name="Diastolisch" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
