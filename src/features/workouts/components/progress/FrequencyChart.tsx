/**
 * FrequencyChart — Training frequency (sessions/week) + current streak.
 */
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CalendarDays, Flame } from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import type { TimeRange } from './TimeRangeSelector';

interface FrequencyChartProps {
  workouts: any[];
  timeRange: TimeRange;
}

export function FrequencyChart({ workouts, timeRange }: FrequencyChartProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const { weekData, streak, avgPerWeek } = useMemo(() => {
    if (!workouts?.length) return { weekData: [], streak: 0, avgPerWeek: 0 };

    // Filter by time range
    const filtered = workouts.filter(w => w.date >= timeRange.from && w.date <= timeRange.to);

    // Group by ISO week
    const weekMap = new Map<string, { count: number; weekKey: string }>();
    for (const w of filtered) {
      const d = new Date(w.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const weekNum = getISOWeek(w.date);
      const label = `KW ${weekNum}`;
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!weekMap.has(label)) weekMap.set(label, { count: 0, weekKey });
      weekMap.get(label)!.count++;
    }

    const weekData = Array.from(weekMap.entries())
      .sort((a, b) => a[1].weekKey.localeCompare(b[1].weekKey))
      .map(([name, { count }]) => ({ name, sessions: count }));

    const avgPerWeek = weekData.length > 0
      ? Math.round((weekData.reduce((s, w) => s + w.sessions, 0) / weekData.length) * 10) / 10
      : 0;

    // Calculate streak: consecutive weeks with at least 1 session (from most recent)
    let streak = 0;
    const sorted = [...weekData].reverse();
    for (const w of sorted) {
      if (w.sessions > 0) streak++;
      else break;
    }

    return { weekData, streak, avgPerWeek };
  }, [workouts, timeRange]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-2">
        {isDE ? 'Trainingsh\u00e4ufigkeit' : 'Training Frequency'}
      </h4>
      {/* Stats */}
      <div className="flex gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-4 w-4 text-teal-500" />
          <span className="text-sm font-bold text-gray-900">{avgPerWeek}</span>
          <span className="text-[10px] text-gray-400">/{isDE ? 'Woche' : 'week'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-bold text-gray-900">{streak}</span>
          <span className="text-[10px] text-gray-400">{isDE ? 'Wochen Streak' : 'week streak'}</span>
        </div>
      </div>

      {weekData.length > 0 ? (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={weekData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 10 }} width={25} allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <ReferenceLine y={avgPerWeek} stroke="#94a3b8" strokeDasharray="3 3" label="" />
            <Bar dataKey="sessions" fill="#14b8a6" radius={[4, 4, 0, 0]} name={isDE ? 'Sessions' : 'Sessions'} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[140px] flex items-center justify-center text-sm text-gray-400">
          {isDE ? 'Noch keine Trainingsdaten' : 'No training data yet'}
        </div>
      )}
    </div>
  );
}

function getISOWeek(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}
