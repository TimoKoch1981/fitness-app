/**
 * PeriodizationView — Visualizes training periodization over 4-8 weeks.
 *
 * Shows:
 * - Bar chart of weekly volume (overall or by muscle group)
 * - Phase detection (accumulation / intensification / deload)
 * - Toggle between total and per-muscle-group view
 * - Responsive design using Recharts
 */

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Activity, BarChart3 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { usePeriodization } from '../hooks/usePeriodization';
import type { WeekData, PeriodizationPhase } from '../types/periodization';

type ViewMode = 'total' | 'muscleGroup';

const PHASE_COLORS: Record<PeriodizationPhase, string> = {
  accumulation: '#14b8a6',  // teal
  intensification: '#f59e0b', // amber
  deload: '#3b82f6',         // blue
  unknown: '#9ca3af',        // gray
};

const MUSCLE_GROUP_COLORS: Record<string, string> = {
  chest: '#ef4444',      // red
  back: '#3b82f6',       // blue
  shoulders: '#f59e0b',  // amber
  legs: '#10b981',       // emerald
  arms: '#8b5cf6',       // violet
  core: '#ec4899',       // pink
  other: '#6b7280',      // gray
};

export function PeriodizationView() {
  const { t, language } = useTranslation();
  const { weeks, avgWeeklyVolume, isLoading } = usePeriodization();
  const [viewMode, setViewMode] = useState<ViewMode>('total');

  // Safely access periodization translations
  const pt = (t as unknown as Record<string, Record<string, string>>).periodization;

  // Collect all unique muscle groups across weeks for stacked chart
  const allMuscleGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const week of weeks) {
      for (const mg of week.muscleGroupBreakdown) {
        groups.add(mg.muscleGroup);
      }
    }
    return Array.from(groups).sort();
  }, [weeks]);

  // Build chart data for muscle group view
  const muscleGroupChartData = useMemo(() => {
    return weeks.map((week) => {
      const entry: Record<string, string | number> = {
        weekLabel: week.weekLabel,
        workoutCount: week.workoutCount,
      };
      for (const mg of allMuscleGroups) {
        const found = week.muscleGroupBreakdown.find((b) => b.muscleGroup === mg);
        entry[mg] = found?.volume ?? 0;
      }
      return entry;
    });
  }, [weeks, allMuscleGroups]);

  // Muscle group display names
  const getMuscleGroupLabel = (key: string): string => {
    if (pt) {
      const translated = pt[`mg_${key}`];
      if (translated) return translated;
    }
    // Fallback labels
    const labels: Record<string, Record<string, string>> = {
      de: { chest: 'Brust', back: 'Ruecken', shoulders: 'Schultern', legs: 'Beine', arms: 'Arme', core: 'Core', other: 'Sonstige' },
      en: { chest: 'Chest', back: 'Back', shoulders: 'Shoulders', legs: 'Legs', arms: 'Arms', core: 'Core', other: 'Other' },
    };
    return labels[language]?.[key] ?? labels.en[key] ?? key;
  };

  // Phase label
  const getPhaseLabel = (phase: PeriodizationPhase): string => {
    if (pt) {
      const translated = pt[`phase_${phase}`];
      if (translated) return translated;
    }
    const labels: Record<PeriodizationPhase, Record<string, string>> = {
      accumulation: { de: 'Aufbau', en: 'Accumulation' },
      intensification: { de: 'Intensivierung', en: 'Intensification' },
      deload: { de: 'Deload', en: 'Deload' },
      unknown: { de: 'Unbekannt', en: 'Unknown' },
    };
    return labels[phase]?.[language] ?? labels[phase]?.en ?? phase;
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto" />
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm text-center">
        <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          {pt?.noData ?? (language === 'de' ? 'Noch keine Trainingsdaten vorhanden' : 'No training data available yet')}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {pt?.noDataHint ?? (language === 'de' ? 'Trage Workouts ein, um deine Periodisierung zu sehen' : 'Log workouts to see your periodization')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-teal-500" />
          <h3 className="text-sm font-semibold text-gray-700">
            {pt?.title ?? (language === 'de' ? 'Periodisierung' : 'Periodization')}
          </h3>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('total')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'total'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {pt?.overview ?? (language === 'de' ? 'Gesamt' : 'Total')}
          </button>
          <button
            onClick={() => setViewMode('muscleGroup')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              viewMode === 'muscleGroup'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {pt?.byMuscleGroup ?? (language === 'de' ? 'Muskelgruppen' : 'Muscle Groups')}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        {viewMode === 'total' ? (
          <TotalVolumeChart
            weeks={weeks}
            avgVolume={avgWeeklyVolume}
            getPhaseLabel={getPhaseLabel}
            language={language}
            pt={pt}
          />
        ) : (
          <MuscleGroupChart
            data={muscleGroupChartData}
            muscleGroups={allMuscleGroups}
            getMuscleGroupLabel={getMuscleGroupLabel}
            language={language}
            pt={pt}
          />
        )}
      </div>

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-2 gap-2">
        {weeks.map((week) => (
          <WeekSummaryCard
            key={week.startDate}
            week={week}
            getPhaseLabel={getPhaseLabel}
            language={language}
            pt={pt}
          />
        ))}
      </div>
    </div>
  );
}

// ── Sub-Components ──────────────────────────────────────────────────

interface TotalVolumeChartProps {
  weeks: WeekData[];
  avgVolume: number;
  getPhaseLabel: (phase: PeriodizationPhase) => string;
  language: string;
  pt: Record<string, string> | undefined;
}

function TotalVolumeChart({ weeks, avgVolume, getPhaseLabel, language, pt }: TotalVolumeChartProps) {
  return (
    <>
      <p className="text-xs text-gray-400 mb-2">
        {pt?.totalVolume ?? (language === 'de' ? 'Gesamtvolumen pro Woche' : 'Total volume per week')}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={weeks} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="weekLabel"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any, _name: any, props: any) => {
              const phase = getPhaseLabel(props.payload.phase);
              return [`${Math.round(value ?? 0).toLocaleString()} (${phase})`, pt?.volume ?? 'Volume'];
            }) as any}
            labelFormatter={(label) => String(label)}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <ReferenceLine
            y={avgVolume}
            stroke="#9ca3af"
            strokeDasharray="3 3"
            label={{
              value: pt?.avgLine ?? (language === 'de' ? 'Durchschnitt' : 'Average'),
              position: 'right',
              fill: '#9ca3af',
              fontSize: 10,
            }}
          />
          <Bar dataKey="totalVolume" radius={[4, 4, 0, 0]} maxBarSize={50}>
            {weeks.map((week, index) => (
              <Cell key={`cell-${index}`} fill={PHASE_COLORS[week.phase]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Phase Legend */}
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {(['accumulation', 'intensification', 'deload'] as PeriodizationPhase[]).map((phase) => (
          <div key={phase} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: PHASE_COLORS[phase] }}
            />
            <span className="text-[10px] text-gray-500">{getPhaseLabel(phase)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

interface MuscleGroupChartProps {
  data: Record<string, string | number>[];
  muscleGroups: string[];
  getMuscleGroupLabel: (key: string) => string;
  language: string;
  pt: Record<string, string> | undefined;
}

function MuscleGroupChart({ data, muscleGroups, getMuscleGroupLabel, language, pt }: MuscleGroupChartProps) {
  return (
    <>
      <p className="text-xs text-gray-400 mb-2">
        {pt?.volumeByGroup ?? (language === 'de' ? 'Volumen nach Muskelgruppe' : 'Volume by muscle group')}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis
            dataKey="weekLabel"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any, name: any) => [
              Math.round(value ?? 0).toLocaleString(),
              getMuscleGroupLabel(String(name)),
            ]) as any}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend
            formatter={(value: string) => (
              <span className="text-[10px] text-gray-500">{getMuscleGroupLabel(value)}</span>
            )}
            wrapperStyle={{ fontSize: 10 }}
          />
          {muscleGroups.map((mg) => (
            <Bar
              key={mg}
              dataKey={mg}
              stackId="volume"
              fill={MUSCLE_GROUP_COLORS[mg] ?? '#6b7280'}
              radius={mg === muscleGroups[muscleGroups.length - 1] ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={50}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

interface WeekSummaryCardProps {
  week: WeekData;
  getPhaseLabel: (phase: PeriodizationPhase) => string;
  language: string;
  pt: Record<string, string> | undefined;
}

function WeekSummaryCard({ week, getPhaseLabel, language, pt }: WeekSummaryCardProps) {
  const phaseColor = PHASE_COLORS[week.phase];

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-gray-700">{week.weekLabel}</p>
        <span
          className="px-1.5 py-0.5 rounded text-[9px] font-medium text-white"
          style={{ backgroundColor: phaseColor }}
        >
          {getPhaseLabel(week.phase)}
        </span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>{pt?.volume ?? 'Volume'}</span>
          <span className="font-medium text-gray-700">{week.totalVolume.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>{pt?.sets ?? (language === 'de' ? 'Saetze' : 'Sets')}</span>
          <span className="font-medium text-gray-700">{week.totalSets}</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>{pt?.intensity ?? (language === 'de' ? 'Avg. kg' : 'Avg. kg')}</span>
          <span className="font-medium text-gray-700">{week.avgIntensity} kg</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>{pt?.workouts ?? 'Workouts'}</span>
          <span className="font-medium text-gray-700">{week.workoutCount}</span>
        </div>
      </div>
    </div>
  );
}
