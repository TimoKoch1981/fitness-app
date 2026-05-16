/**
 * SetsPerMuscleChart — Wochen-Volumen in *Saetzen* pro Muskelgruppe (UX11).
 *
 * Komplementaer zu VolumeChart (das kg-Volumen zeigt). Saetze sind die
 * wissenschaftlich validierte "harte Waehrung" fuer Hypertrophy:
 *   Schoenfeld 2017 dose-response review -> 10-20 work-sets/Woche/Muskel als
 *   evidenz-basierter Bereich. Unter 10 = wahrscheinlich Sub-Optimum, ueber
 *   25 = diminishing returns + Junk-Volumen-Risiko.
 *
 * Stacked-Bar pro KW, plus aktuelle Woche als Summary mit Range-Hinweis.
 */

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useTranslation } from '../../../../i18n';
import { calculateWeeklySetsPerMuscleGroup, type MuscleBucket } from '../../../../lib/calculations/progressiveOverload';
import type { Workout } from '../../../../types/health';
import type { TimeRange } from './TimeRangeSelector';

const MUSCLE_COLORS: Record<MuscleBucket, string> = {
  chest: '#ef4444',
  back: '#3b82f6',
  shoulders: '#f59e0b',
  legs: '#10b981',
  arms: '#8b5cf6',
  core: '#ec4899',
  cardio: '#06b6d4',
  other: '#6b7280',
};

const MUSCLE_LABELS_DE: Record<MuscleBucket, string> = {
  chest: 'Brust', back: 'Rücken', shoulders: 'Schultern',
  legs: 'Beine', arms: 'Arme', core: 'Core', cardio: 'Cardio', other: 'Sonstige',
};

const MUSCLE_LABELS_EN: Record<MuscleBucket, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders',
  legs: 'Legs', arms: 'Arms', core: 'Core', cardio: 'Cardio', other: 'Other',
};

const BUCKET_ORDER: MuscleBucket[] = ['chest', 'back', 'shoulders', 'legs', 'arms', 'core', 'cardio', 'other'];

interface SetsPerMuscleChartProps {
  workouts: Workout[];
  timeRange: TimeRange;
}

const REC_MIN = 10;
const REC_MAX = 20;

export function SetsPerMuscleChart({ workouts, timeRange }: SetsPerMuscleChartProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const labels = isDE ? MUSCLE_LABELS_DE : MUSCLE_LABELS_EN;

  // Filter auf TimeRange + berechnen
  const data = useMemo(() => {
    const filtered = workouts.filter(w => w.date >= timeRange.from && w.date <= timeRange.to);
    return calculateWeeklySetsPerMuscleGroup(filtered).map(p => ({
      name: p.weekLabel,
      ...p.buckets,
    }));
  }, [workouts, timeRange]);

  // Aktuelle Woche (letzte im Array) — fuer den Summary-Strip
  const currentWeek = data[data.length - 1] as undefined | (Record<MuscleBucket, number> & { name: string });

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <p className="text-sm text-gray-400">
          {isDE ? 'Noch keine Volumendaten' : 'No volume data yet'}
        </p>
      </div>
    );
  }

  // Y-Max bestimmen, damit ReferenceLine bei 10/20 sinnvoll sitzt
  const maxTotal = Math.max(...data.map(d => BUCKET_ORDER.reduce((s, b) => s + ((d as Record<MuscleBucket, number>)[b] ?? 0), 0)));

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">
          {isDE ? 'Sätze pro Muskelgruppe (Woche)' : 'Sets per Muscle (Weekly)'}
        </h4>
        <span className="text-[10px] text-gray-400" title={isDE ? 'Schoenfeld et al. 2017: 10-20 Saetze/Woche/Muskel optimaler Hypertrophie-Bereich' : 'Schoenfeld et al. 2017: 10-20 sets/week/muscle is the evidence-based hypertrophy range'}>
          {isDE ? 'Ziel: 10-20/Muskel' : 'Target: 10-20/muscle'}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={30} />
          <Tooltip
            formatter={((value: number, name: string) => [`${Math.round(value)} ${isDE ? 'Sätze' : 'sets'}`, name]) as never}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          {/* Empfehlungs-Referenzlinien — nur wenn Daten in der Naehe sind */}
          {maxTotal > 5 && <ReferenceLine y={REC_MIN} stroke="#94a3b8" strokeDasharray="3 3" />}
          {maxTotal > 12 && <ReferenceLine y={REC_MAX} stroke="#cbd5e1" strokeDasharray="3 3" />}
          {BUCKET_ORDER.map(g => (
            <Bar key={g} dataKey={g} stackId="sets" fill={MUSCLE_COLORS[g]} name={labels[g]} radius={0} />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Aktuelle-Woche-Summary mit Range-Indikator */}
      {currentWeek && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-1.5">
            {isDE ? 'Diese Woche' : 'This week'} ({currentWeek.name})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {BUCKET_ORDER.filter(b => b !== 'other' && b !== 'cardio').map(b => {
              const n = (currentWeek[b] ?? 0) as number;
              const status: 'low' | 'good' | 'high' = n < REC_MIN ? 'low' : n > REC_MAX ? 'high' : 'good';
              const statusColor =
                status === 'good' ? 'bg-green-50 text-green-700 border-green-200' :
                status === 'low' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-orange-50 text-orange-700 border-orange-200';
              return (
                <span
                  key={b}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded border ${statusColor}`}
                  title={
                    status === 'good'
                      ? (isDE ? 'Im optimalen Bereich (10-20)' : 'In optimal range (10-20)')
                      : status === 'low'
                        ? (isDE ? 'Unter 10 — kann erhoeht werden' : 'Below 10 — can be increased')
                        : (isDE ? 'Ueber 20 — Junk-Volumen-Risiko' : 'Over 20 — junk volume risk')
                  }
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MUSCLE_COLORS[b] }} />
                  {labels[b]}: {n}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
