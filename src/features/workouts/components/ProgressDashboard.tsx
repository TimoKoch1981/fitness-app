/**
 * ProgressDashboard — Full analytics dashboard with time range selector,
 * category chips, and all progress chart sections.
 */
import { useState } from 'react';
import { Download } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useAllWorkoutHistory } from '../hooks/useWorkoutHistory';
import { TimeRangeSelector, getPresetRange, type TimeRange } from './progress/TimeRangeSelector';
import { VolumeChart } from './progress/VolumeChart';
import { E1RMChart } from './progress/E1RMChart';
import { PRTimeline } from './progress/PRTimeline';
import { FrequencyChart } from './progress/FrequencyChart';
import { BodyCompChart } from './progress/BodyCompChart';
import { BloodPressureChart } from './progress/BloodPressureChart';
import { SleepChart } from './progress/SleepChart';
import { BloodWorkChart } from './progress/BloodWorkChart';
import { PeriodizationSection } from './progress/PeriodizationSection';
import { ExportDialog } from './ExportDialog';
import { PhotoTrackingSection } from './progress/PhotoTrackingSection';

type Category = 'all' | 'strength' | 'body' | 'health';

const defaultRange = getPresetRange('8w');

export function ProgressDashboard() {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const [timeRange, setTimeRange] = useState<TimeRange>({
    preset: '8w',
    ...defaultRange,
  });

  const [category, setCategory] = useState<Category>('all');
  const [showExport, setShowExport] = useState(false);

  // Load workout history (central data source for strength charts)
  const { data: workouts, isLoading } = useAllWorkoutHistory(500);

  const categories: { key: Category; label: string }[] = [
    { key: 'all', label: isDE ? 'Alle' : 'All' },
    { key: 'strength', label: isDE ? 'Kraft' : 'Strength' },
    { key: 'body', label: isDE ? 'K\u00f6rper' : 'Body' },
    { key: 'health', label: isDE ? 'Gesundheit' : 'Health' },
  ];

  const showStrength = category === 'all' || category === 'strength';
  const showBody = category === 'all' || category === 'body';
  const showHealth = category === 'all' || category === 'health';

  return (
    <div className="space-y-4">
      {/* Time Range Selector */}
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

      {/* Category Chips + Export Button */}
      <div className="flex items-center gap-1.5">
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              category === c.key
                ? 'bg-teal-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {c.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 rounded-full hover:bg-teal-100 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      {/* Fototracking — always visible, self-contained accordion */}
      <PhotoTrackingSection />

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
          <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* KRAFT / STRENGTH */}
          {showStrength && (
            <>
              <SectionHeader title={isDE ? 'Kraft' : 'Strength'} />
              <VolumeChart workouts={workouts || []} timeRange={timeRange} />
              <E1RMChart workouts={workouts || []} timeRange={timeRange} />
              <PRTimeline workouts={workouts || []} timeRange={timeRange} />
              <FrequencyChart workouts={workouts || []} timeRange={timeRange} />
            </>
          )}

          {/* KOERPER / BODY */}
          {showBody && (
            <>
              <SectionHeader title={isDE ? 'K\u00f6rper' : 'Body'} />
              <BodyCompChart timeRange={timeRange} />
            </>
          )}

          {/* GESUNDHEIT / HEALTH */}
          {showHealth && (
            <>
              <SectionHeader title={isDE ? 'Gesundheit' : 'Health'} />
              <BloodPressureChart timeRange={timeRange} />
              <SleepChart timeRange={timeRange} />
              <BloodWorkChart timeRange={timeRange} />
            </>
          )}

          {/* PERIODISIERUNG */}
          {showStrength && (
            <>
              <SectionHeader title={isDE ? 'Periodisierung' : 'Periodization'} />
              <PeriodizationSection />
            </>
          )}
        </>
      )}

      {/* Export Dialog */}
      {showExport && (
        <ExportDialog
          timeRange={timeRange}
          workouts={workouts || []}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <div className="h-px flex-1 bg-gray-200" />
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</span>
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}
