/**
 * SleepChart — Sleep duration (bars) + quality (line) chart.
 */
import { useMemo } from 'react';
import { Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart } from 'recharts';
import { useTranslation } from '../../../../i18n';
import { useSleepLogs } from '../../../sleep/hooks/useSleep';
import type { TimeRange } from './TimeRangeSelector';

interface SleepChartProps {
  timeRange: TimeRange;
}

export function SleepChart({ timeRange }: SleepChartProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { data: logs, isLoading } = useSleepLogs(200);

  const chartData = useMemo(() => {
    if (!logs?.length) return [];
    return logs
      .filter(l => l.date >= timeRange.from && l.date <= timeRange.to)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(l => ({
        date: l.date,
        label: l.date.slice(5),
        hours: l.duration_minutes ? Math.round((l.duration_minutes / 60) * 10) / 10 : null,
        quality: l.quality,
      }));
  }, [logs, timeRange]);

  if (isLoading) return <div className="bg-white rounded-xl shadow-sm p-4 h-48 animate-pulse" />;
  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">{isDE ? 'Schlaf' : 'Sleep'}</h4>
        <p className="text-sm text-gray-400 py-4 text-center">{isDE ? 'Keine Schlafdaten' : 'No sleep data'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">{isDE ? 'Schlaf' : 'Sleep'}</h4>
      <ResponsiveContainer width="100%" height={160}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <XAxis dataKey="label" tick={{ fontSize: 9 }} />
          <YAxis yAxisId="hours" tick={{ fontSize: 10 }} width={30} domain={[0, 12]} />
          <YAxis yAxisId="quality" orientation="right" tick={{ fontSize: 10 }} width={25} domain={[1, 5]} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Bar yAxisId="hours" dataKey="hours" fill="#6366f1" radius={[3, 3, 0, 0]} name={isDE ? 'Stunden' : 'Hours'} />
          <Line yAxisId="quality" type="monotone" dataKey="quality" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} name={isDE ? 'Qualit\u00e4t' : 'Quality'} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
