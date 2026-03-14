/**
 * VolumeChart — Weekly training volume as stacked bar chart by muscle group.
 */
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useTranslation } from '../../../../i18n';
import type { TimeRange } from './TimeRangeSelector';

// Muscle group colors (matches PeriodizationView)
const MUSCLE_COLORS: Record<string, string> = {
  chest: '#ef4444',
  back: '#3b82f6',
  shoulders: '#f59e0b',
  legs: '#10b981',
  arms: '#8b5cf6',
  core: '#ec4899',
  cardio: '#06b6d4',
  other: '#6b7280',
};

interface VolumeChartProps {
  workouts: any[];
  timeRange: TimeRange;
  exerciseCatalog?: Map<string, { body_region?: string }>;
}

export function VolumeChart({ workouts, timeRange }: VolumeChartProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const data = useMemo(() => {
    if (!workouts?.length) return [];

    // Group workouts by ISO week
    const weekMap = new Map<string, Record<string, number>>();

    for (const w of workouts) {
      if (w.date < timeRange.from || w.date > timeRange.to) continue;
      const d = new Date(w.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
      const weekKey = weekStart.toISOString().split('T')[0];
      const weekNum = getISOWeek(w.date);
      const label = `KW ${weekNum}`;

      if (!weekMap.has(label)) weekMap.set(label, { _weekKey: weekKey as any });

      const week = weekMap.get(label)!;
      const exercises = w.session_exercises || w.exercises || [];
      for (const ex of exercises) {
        if (ex.skipped) continue;
        const region = ex.body_region || ex.exercise_type || 'other';
        const group = mapToGroup(region);
        const sets = ex.sets || [];
        const vol = sets
          .filter((s: any) => s.completed && s.set_tag !== 'warmup')
          .reduce((sum: number, s: any) => sum + ((s.actual_reps ?? s.reps ?? 0) * (s.actual_weight_kg ?? s.weight_kg ?? 0)), 0);
        week[group] = (week[group] || 0) + vol;
      }
    }

    return Array.from(weekMap.entries())
      .sort((a, b) => String(a[1]._weekKey || '').localeCompare(String(b[1]._weekKey || '')))
      .map(([label, data]) => ({ name: label, ...data, _weekKey: undefined }));
  }, [workouts, timeRange]);

  if (data.length === 0) {
    return <EmptyState label={isDE ? 'Noch keine Volumendaten' : 'No volume data yet'} />;
  }

  const groups = Object.keys(MUSCLE_COLORS);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">
        {isDE ? 'Trainingsvolumen (Woche)' : 'Training Volume (Weekly)'}
      </h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={45} />
          <Tooltip
            formatter={((value: number, name: string) => [`${Math.round(value).toLocaleString()} kg`, MUSCLE_LABELS_DE[name] || name]) as any}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {groups.map(g => (
            <Bar key={g} dataKey={g} stackId="vol" fill={MUSCLE_COLORS[g]} name={MUSCLE_LABELS_DE[g] || g} radius={0} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const MUSCLE_LABELS_DE: Record<string, string> = {
  chest: 'Brust', back: 'R\u00fccken', shoulders: 'Schultern',
  legs: 'Beine', arms: 'Arme', core: 'Core', cardio: 'Cardio', other: 'Sonstige',
};

function mapToGroup(region: string): string {
  const r = region.toLowerCase();
  if (r.includes('chest') || r.includes('brust')) return 'chest';
  if (r.includes('back') || r.includes('r\u00fccken') || r.includes('rueck')) return 'back';
  if (r.includes('shoulder') || r.includes('schulter')) return 'shoulders';
  if (r.includes('leg') || r.includes('bein') || r.includes('quad') || r.includes('hamstr') || r.includes('glut') || r.includes('calf') || r.includes('wad')) return 'legs';
  if (r.includes('arm') || r.includes('bicep') || r.includes('tricep')) return 'arms';
  if (r.includes('core') || r.includes('abs') || r.includes('bauch')) return 'core';
  if (r.includes('cardio') || r.includes('lauf') || r.includes('run')) return 'cardio';
  return 'other';
}

function getISOWeek(dateStr: string): number {
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 text-center">
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}
