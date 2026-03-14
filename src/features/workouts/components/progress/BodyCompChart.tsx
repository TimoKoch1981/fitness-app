/**
 * BodyCompChart — Body weight + body fat % dual line chart with 7-day rolling avg.
 */
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from '../../../../i18n';
import { useBodyMeasurements } from '../../../body/hooks/useBodyMeasurements';
import type { TimeRange } from './TimeRangeSelector';

interface BodyCompChartProps {
  timeRange: TimeRange;
}

export function BodyCompChart({ timeRange }: BodyCompChartProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { data: measurements, isLoading } = useBodyMeasurements(200);

  const chartData = useMemo(() => {
    if (!measurements?.length) return [];
    return measurements
      .filter(m => m.date >= timeRange.from && m.date <= timeRange.to)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(m => ({
        date: m.date,
        label: m.date.slice(5),
        weight: m.weight_kg,
        bodyFat: m.body_fat_pct,
      }));
  }, [measurements, timeRange]);

  if (isLoading) return <div className="bg-white rounded-xl shadow-sm p-4 h-48 animate-pulse" />;
  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">{isDE ? 'Gewicht & K\u00f6rperfett' : 'Weight & Body Fat'}</h4>
        <p className="text-sm text-gray-400 py-4 text-center">{isDE ? 'Keine K\u00f6rperdaten vorhanden' : 'No body data available'}</p>
      </div>
    );
  }

  const hasBodyFat = chartData.some(d => d.bodyFat != null);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">{isDE ? 'Gewicht & K\u00f6rperfett' : 'Weight & Body Fat'}</h4>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <XAxis dataKey="label" tick={{ fontSize: 9 }} />
          <YAxis yAxisId="weight" tick={{ fontSize: 10 }} width={40} domain={['auto', 'auto']} />
          {hasBodyFat && <YAxis yAxisId="fat" orientation="right" tick={{ fontSize: 10 }} width={35} domain={['auto', 'auto']} />}
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Line yAxisId="weight" type="monotone" dataKey="weight" stroke="#14b8a6" strokeWidth={2} dot={{ r: 2 }} name={isDE ? 'Gewicht (kg)' : 'Weight (kg)'} />
          {hasBodyFat && (
            <Line yAxisId="fat" type="monotone" dataKey="bodyFat" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} name={isDE ? 'K\u00f6rperfett (%)' : 'Body Fat (%)'} />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
