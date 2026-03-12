/**
 * BloodWorkChart — Blood biomarker trends with reference ranges.
 */
import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { useTranslation } from '../../../../i18n';
import { useBloodWorkLogs } from '../../../medical/hooks/useBloodWork';
import type { TimeRange } from './TimeRangeSelector';

const MARKER_GROUPS = {
  hormones: ['testosterone_total', 'testosterone_free', 'estradiol', 'cortisol', 'shbg'],
  lipids: ['hdl', 'ldl', 'triglycerides', 'total_cholesterol'],
  liver: ['ast', 'alt', 'ggt'],
  kidney: ['creatinine', 'egfr', 'urea'],
  metabolism: ['fasting_glucose', 'hba1c', 'iron', 'ferritin', 'vitamin_d'],
  blood_count: ['hematocrit', 'hemoglobin', 'leukocytes'],
};

const MARKER_LABELS: Record<string, string> = {
  testosterone_total: 'Testosteron (ges.)', testosterone_free: 'Testosteron (frei)',
  estradiol: 'Estradiol', cortisol: 'Cortisol', shbg: 'SHBG',
  hdl: 'HDL', ldl: 'LDL', triglycerides: 'Triglyceride', total_cholesterol: 'Cholesterin (ges.)',
  ast: 'AST (GOT)', alt: 'ALT (GPT)', ggt: 'GGT',
  creatinine: 'Kreatinin', egfr: 'eGFR', urea: 'Harnstoff',
  fasting_glucose: 'N\u00fcchternglukose', hba1c: 'HbA1c', iron: 'Eisen', ferritin: 'Ferritin', vitamin_d: 'Vitamin D',
  hematocrit: 'H\u00e4matokrit', hemoglobin: 'H\u00e4moglobin', leukocytes: 'Leukozyten',
};

interface BloodWorkChartProps {
  timeRange: TimeRange;
}

export function BloodWorkChart({ timeRange }: BloodWorkChartProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';
  const { data: logs, isLoading } = useBloodWorkLogs(50);
  const [selectedMarker, setSelectedMarker] = useState('testosterone_total');

  const chartData = useMemo(() => {
    if (!logs?.length) return [];
    return logs
      .filter(l => l.date >= timeRange.from && l.date <= timeRange.to)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(l => ({
        date: l.date,
        label: l.date.slice(5),
        value: (l as any)[selectedMarker] ?? null,
      }))
      .filter(d => d.value != null);
  }, [logs, timeRange, selectedMarker]);

  // Available markers (those that have at least one data point)
  const availableMarkers = useMemo(() => {
    if (!logs?.length) return [];
    const markers = new Set<string>();
    for (const l of logs) {
      for (const [key, val] of Object.entries(l)) {
        if (val != null && typeof val === 'number' && key !== 'id' && MARKER_LABELS[key]) {
          markers.add(key);
        }
      }
    }
    return Array.from(markers);
  }, [logs]);

  if (isLoading) return <div className="bg-white rounded-xl shadow-sm p-4 h-48 animate-pulse" />;
  if (availableMarkers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">{isDE ? 'Blutwerte' : 'Blood Work'}</h4>
        <p className="text-sm text-gray-400 py-4 text-center">{isDE ? 'Keine Blutwerte vorhanden' : 'No blood work data'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-2">{isDE ? 'Blutwerte' : 'Blood Work'}</h4>
      <select
        value={selectedMarker}
        onChange={e => setSelectedMarker(e.target.value)}
        className="w-full mb-3 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
      >
        {Object.entries(MARKER_GROUPS).map(([group, markers]) => {
          const available = markers.filter(m => availableMarkers.includes(m));
          if (available.length === 0) return null;
          return (
            <optgroup key={group} label={group.replace('_', ' ').toUpperCase()}>
              {available.map(m => (
                <option key={m} value={m}>{MARKER_LABELS[m] || m}</option>
              ))}
            </optgroup>
          );
        })}
      </select>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <XAxis dataKey="label" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 10 }} width={45} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name={MARKER_LABELS[selectedMarker] || selectedMarker} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[160px] flex items-center justify-center text-sm text-gray-400">
          {isDE ? 'Keine Daten f\u00fcr diesen Marker' : 'No data for this marker'}
        </div>
      )}
    </div>
  );
}
