/**
 * ProgressionCard — Shows weight forecast chart with projection + stats.
 */

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Target, AlertTriangle, Calendar } from 'lucide-react';
import { useProgression } from '../hooks/useProgression';
import { predictValue, formatDaysAsDuration } from '../../../lib/calculations/progression';

interface ProgressionCardProps {
  language: 'de' | 'en';
}

const t_de = {
  title: 'Prognose',
  weeklyRate: 'Wochenrate',
  prediction30d: 'In 30 Tagen',
  timeToTarget: 'Ziel erreicht in',
  goalDate: 'Ziel erreicht am',
  days: 'Tagen',
  plateau: 'Plateau erkannt',
  plateauSince: 'seit',
  notEnoughData: 'Mindestens 5 Messungen fuer Prognose',
  forecast: 'Prognose',
  actual: 'Gemessen',
  movingAvg: '7-Tage-Ø',
  target: 'Ziel',
  perWeek: '/Woche',
  bodyFat: 'Koerperfett',
  atCurrentRate: 'bei aktuellem Trend',
};

const t_en = {
  title: 'Forecast',
  weeklyRate: 'Weekly Rate',
  prediction30d: 'In 30 Days',
  timeToTarget: 'Target reached in',
  goalDate: 'Goal date',
  days: 'days',
  plateau: 'Plateau detected',
  plateauSince: 'for',
  notEnoughData: 'At least 5 measurements for forecast',
  forecast: 'Forecast',
  actual: 'Measured',
  movingAvg: '7-day avg',
  target: 'Target',
  perWeek: '/week',
  bodyFat: 'Body Fat',
  atCurrentRate: 'at current rate',
};

export function ProgressionCard({ language }: ProgressionCardProps) {
  const { data, isLoading } = useProgression();
  const t = language === 'de' ? t_de : t_en;

  // Build chart data with projection
  const chartData = useMemo(() => {
    if (!data?.weightChartData.length || !data.weightRegression) return [];

    const historical = data.weightChartData.map(p => ({
      date: p.date,
      label: p.label,
      weight_kg: p.weight_kg,
      ma7: p.ma7,
      projection: null as number | null,
    }));

    // Add projection points (30 days forward)
    const lastPoint = data.weightChartData[data.weightChartData.length - 1];
    const lastDate = new Date(lastPoint.date);
    const numericLastX = data.weightChartData.length > 0
      ? (new Date(lastPoint.date).getTime() - new Date(data.weightChartData[0].date).getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    // Bridge: last actual value also in projection for continuity
    historical[historical.length - 1].projection = lastPoint.weight_kg;

    for (let d = 7; d <= 30; d += 7) {
      const futureDate = new Date(lastDate);
      futureDate.setDate(futureDate.getDate() + d);
      const dateStr = futureDate.toISOString().split('T')[0];
      const label = futureDate.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
        day: '2-digit',
        month: '2-digit',
      });
      historical.push({
        date: dateStr,
        label,
        weight_kg: null,
        ma7: null,
        projection: Math.round(predictValue(data.weightRegression!, numericLastX + d) * 10) / 10,
      });
    }

    return historical;
  }, [data, language]);

  if (isLoading) return null;
  if (!data) return null; // not enough data

  const rateIcon = data.weightWeeklyRate
    ? data.weightWeeklyRate < -0.05
      ? <TrendingDown className="h-4 w-4 text-green-500" />
      : data.weightWeeklyRate > 0.05
        ? <TrendingUp className="h-4 w-4 text-red-500" />
        : <Minus className="h-4 w-4 text-gray-400" />
    : null;

  const rateColor = data.weightWeeklyRate
    ? data.weightWeeklyRate < -0.05 ? 'text-green-600' : data.weightWeeklyRate > 0.05 ? 'text-red-600' : 'text-gray-600'
    : 'text-gray-600';

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">{t.title}</h3>

      {/* Chart */}
      {chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              width={40}
              unit="kg"
              domain={['dataMin - 1', 'dataMax + 1']}
            />
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => {
                const v = Number(value ?? 0).toFixed(1);
                if (name === 'weight_kg') return [`${v} kg`, t.actual];
                if (name === 'ma7') return [`${v} kg`, t.movingAvg];
                if (name === 'projection') return [`${v} kg`, t.forecast];
                return [v, name];
              }}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            {/* Target weight line */}
            {data.targetWeight && (
              <ReferenceLine
                y={data.targetWeight}
                stroke="#6366f1"
                strokeDasharray="6 3"
                strokeWidth={1}
                label={{ value: `${t.target}: ${data.targetWeight}kg`, fontSize: 10, fill: '#6366f1', position: 'right' }}
              />
            )}
            {/* Actual weight */}
            <Line
              type="monotone"
              dataKey="weight_kg"
              stroke="#14b8a6"
              strokeWidth={2}
              dot={{ r: 2, fill: '#14b8a6' }}
              connectNulls
            />
            {/* Moving average */}
            <Line
              type="monotone"
              dataKey="ma7"
              stroke="#99f6e4"
              strokeWidth={1.5}
              dot={false}
              connectNulls
            />
            {/* Projection (dashed) */}
            <Line
              type="monotone"
              dataKey="projection"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={{ r: 2, fill: '#f97316' }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Weekly Rate */}
        {data.weightWeeklyRate !== null && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 uppercase">{t.weeklyRate}</p>
            <div className="flex items-center gap-1 mt-1">
              {rateIcon}
              <span className={`text-sm font-bold ${rateColor}`}>
                {data.weightWeeklyRate > 0 ? '+' : ''}{data.weightWeeklyRate} kg{t.perWeek}
              </span>
            </div>
          </div>
        )}

        {/* 30-day prediction */}
        {data.weightPrediction30d !== null && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 uppercase">{t.prediction30d}</p>
            <p className="text-sm font-bold text-gray-800 mt-1">
              {data.weightPrediction30d} kg
            </p>
          </div>
        )}

        {/* Time to target + goal date */}
        {data.weightTimeToTarget !== null && (
          <div className="bg-indigo-50 rounded-lg p-3">
            <p className="text-[10px] text-indigo-500 uppercase">{t.goalDate}</p>
            <div className="flex items-center gap-1 mt-1">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-sm font-bold text-indigo-700">
                {data.weightGoalDate
                  ? new Date(data.weightGoalDate).toLocaleDateString(
                      language === 'de' ? 'de-DE' : 'en-US',
                      { day: 'numeric', month: 'short', year: 'numeric' }
                    )
                  : `~${data.weightTimeToTarget} ${t.days}`}
              </span>
            </div>
            <p className="text-[9px] text-indigo-400 mt-0.5">
              {formatDaysAsDuration(data.weightTimeToTarget, language)} · {data.targetWeight} kg · {t.atCurrentRate}
            </p>
          </div>
        )}

        {/* Plateau warning */}
        {data.weightPlateau.isPlateau && (
          <div className="bg-amber-50 rounded-lg p-3">
            <p className="text-[10px] text-amber-600 uppercase">{t.plateau}</p>
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-700">
                {t.plateauSince} {data.weightPlateau.durationDays} {t.days}
              </span>
            </div>
          </div>
        )}

        {/* Body Fat 30d prediction */}
        {data.bodyFatPrediction30d !== null && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 uppercase">{t.bodyFat} {t.prediction30d}</p>
            <p className="text-sm font-bold text-gray-800 mt-1">
              {data.bodyFatPrediction30d}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
