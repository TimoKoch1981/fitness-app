/**
 * BodyTabContent — Inner content of the Body tab, extracted from BodyPage.
 * Used inside TrackingPage as one of 3 tracking tabs.
 */

import { useState } from 'react';
import { Activity, Camera, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { BuddyQuickAccess } from '../../../shared/components/BuddyQuickAccess';
import { useTranslation } from '../../../i18n';
import { useBodyMeasurements, useDeleteBodyMeasurement } from '../hooks/useBodyMeasurements';
import { useProfile } from '../../auth/hooks/useProfile';
import { usePageBuddySuggestions } from '../../buddy/hooks/usePageBuddySuggestions';
import { AddBodyMeasurementDialog } from './AddBodyMeasurementDialog';
import { ScreenshotImport } from './ScreenshotImport';
import { classifyBMI, calculateFFMI, classifyFFMI } from '../../../lib/calculations';
import { formatDate } from '../../../lib/utils';

interface BodyTabContentProps {
  showAddDialog: boolean;
  onOpenAddDialog: () => void;
  onCloseAddDialog: () => void;
}

export function BodyTabContent({ showAddDialog, onOpenAddDialog, onCloseAddDialog }: BodyTabContentProps) {
  const { t, language } = useTranslation();
  const isDE = language === 'de';
  const bodySuggestions = usePageBuddySuggestions('tracking_body', language as 'de' | 'en');
  const { data: measurements, isLoading } = useBodyMeasurements(20);
  const { data: profile } = useProfile();
  const deleteMeasurement = useDeleteBodyMeasurement();
  const [showScreenshotImport, setShowScreenshotImport] = useState(false);

  const locale = language === 'de' ? 'de-DE' : 'en-US';

  // Latest vs previous for trend indicators
  const latest = measurements?.[0];
  const previous = measurements?.[1];

  const getTrend = (current?: number, prev?: number) => {
    if (!current || !prev) return null;
    const diff = current - prev;
    if (Math.abs(diff) < 0.1) return null;
    return diff > 0 ? 'up' : 'down';
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto" />
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="text-center py-12">
        <Activity className="h-12 w-12 mx-auto text-gray-200 mb-3" />
        <p className="text-gray-400 text-sm">{t.common.noData}</p>
        <div className="mt-3 flex gap-2 justify-center">
          <button
            onClick={onOpenAddDialog}
            className="px-4 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 transition-colors"
          >
            {t.body.addMeasurement}
          </button>
          <button
            onClick={() => setShowScreenshotImport(true)}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
          >
            <Camera className="h-3.5 w-3.5" />
            {t.screenshot.importButton}
          </button>
        </div>
        <AddBodyMeasurementDialog
          open={showAddDialog}
          onClose={onCloseAddDialog}
        />
        <ScreenshotImport
          open={showScreenshotImport}
          onClose={() => setShowScreenshotImport(false)}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Current Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: t.body.weight, value: latest.weight_kg, unit: t.body.kg, prev: previous?.weight_kg },
            { label: t.body.bodyFat, value: latest.body_fat_pct, unit: t.body.percent, prev: previous?.body_fat_pct },
            { label: t.body.muscleMass, value: latest.muscle_mass_kg, unit: t.body.kg, prev: previous?.muscle_mass_kg },
            { label: t.body.waist, value: latest.waist_cm, unit: t.body.cm, prev: previous?.waist_cm },
            { label: t.body.waterPct, value: latest.water_pct, unit: t.body.percent, prev: previous?.water_pct },
          ].map((stat) => {
            if (!stat.value) return null;
            const trend = getTrend(stat.value, stat.prev);
            return (
              <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <div className="flex items-end gap-1 mt-1">
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  <span className="text-xs text-gray-400 mb-0.5">{stat.unit}</span>
                  {trend && (
                    trend === 'up'
                      ? <TrendingUp className="h-3.5 w-3.5 text-orange-500 mb-0.5 ml-auto" />
                      : <TrendingDown className="h-3.5 w-3.5 text-green-500 mb-0.5 ml-auto" />
                  )}
                </div>
              </div>
            );
          })}

          {/* BMI — color-coded */}
          {latest.bmi && (() => {
            const bmiClass = classifyBMI(latest.bmi);
            const trend = getTrend(latest.bmi, previous?.bmi);
            return (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">{t.body.bmi}</p>
                <div className="flex items-end gap-1 mt-1">
                  <p className="text-xl font-bold text-gray-900">{latest.bmi}</p>
                  {trend && (
                    trend === 'up'
                      ? <TrendingUp className="h-3.5 w-3.5 text-orange-500 mb-0.5 ml-auto" />
                      : <TrendingDown className="h-3.5 w-3.5 text-green-500 mb-0.5 ml-auto" />
                  )}
                </div>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-medium ${bmiClass.color} ${bmiClass.textColor}`}>
                  {isDE ? bmiClass.label_de : bmiClass.label_en}
                </span>
              </div>
            );
          })()}

          {/* FFMI — if body fat available */}
          {latest.lean_mass_kg && profile?.height_cm && (() => {
            const ffmiResult = calculateFFMI(latest.lean_mass_kg!, profile.height_cm);
            const ffmiClass = classifyFFMI(ffmiResult.normalizedFFMI, profile.gender ?? 'male');
            return (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-gray-500 font-medium">{t.body.ffmi}</p>
                <div className="flex items-end gap-1 mt-1">
                  <p className="text-xl font-bold text-gray-900">{ffmiResult.normalizedFFMI}</p>
                </div>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-medium ${ffmiClass.color} ${ffmiClass.textColor}`}>
                  {isDE ? ffmiClass.label_de : ffmiClass.label_en}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Screenshot Import Button */}
        <button
          onClick={() => setShowScreenshotImport(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm"
        >
          <Camera className="h-4 w-4" />
          {t.screenshot.importButton}
        </button>

        {/* Buddy Quick Access */}
        <BuddyQuickAccess suggestions={bodySuggestions} />

        {/* History */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900 text-sm">{t.body.history}</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {measurements?.slice(0, 10).map((m) => (
              <div key={m.id} className="px-4 py-2.5 flex items-center gap-3 group">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    {m.weight_kg && `${m.weight_kg} kg`}
                    {m.body_fat_pct && ` \u00b7 ${m.body_fat_pct}%`}
                    {m.muscle_mass_kg && ` \u00b7 ${m.muscle_mass_kg} kg MM`}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {formatDate(m.date, locale)}
                    {m.source !== 'manual' && ` \u00b7 ${m.source}`}
                  </p>
                </div>
                <button
                  onClick={() => deleteMeasurement.mutate(m.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AddBodyMeasurementDialog
        open={showAddDialog}
        onClose={onCloseAddDialog}
      />

      <ScreenshotImport
        open={showScreenshotImport}
        onClose={() => setShowScreenshotImport(false)}
      />
    </>
  );
}
