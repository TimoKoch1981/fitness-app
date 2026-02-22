/**
 * BodyTabContent — Inner content of the Body tab, extracted from BodyPage.
 * Used inside TrackingPage as one of 3 tracking tabs.
 */

import { useState } from 'react';
import { Activity, Camera, Info, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react';
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
  const [showInfo, setShowInfo] = useState<'bmi' | 'ffmi' | null>(null);

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

          {/* BMI — color-coded with info button */}
          {latest.bmi && (() => {
            const bmiClass = classifyBMI(latest.bmi);
            const trend = getTrend(latest.bmi, previous?.bmi);
            return (
              <div className="bg-white rounded-xl p-4 shadow-sm relative">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-medium">{t.body.bmi}</p>
                  <button
                    onClick={() => setShowInfo(showInfo === 'bmi' ? null : 'bmi')}
                    className="p-0.5 text-gray-300 hover:text-teal-500 transition-colors"
                    title={isDE ? 'Formel anzeigen' : 'Show formula'}
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>
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

          {/* FFMI — if body fat available, with info button */}
          {latest.lean_mass_kg && profile?.height_cm && (() => {
            const ffmiResult = calculateFFMI(latest.lean_mass_kg!, profile.height_cm);
            const ffmiClass = classifyFFMI(ffmiResult.normalizedFFMI, profile.gender ?? 'male');
            return (
              <div className="bg-white rounded-xl p-4 shadow-sm relative">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 font-medium">{t.body.ffmi}</p>
                  <button
                    onClick={() => setShowInfo(showInfo === 'ffmi' ? null : 'ffmi')}
                    className="p-0.5 text-gray-300 hover:text-teal-500 transition-colors"
                    title={isDE ? 'Formel anzeigen' : 'Show formula'}
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>
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

        {/* BMI / FFMI Info Overlay */}
        {showInfo && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-teal-100">
            <div className="flex items-center justify-between px-4 py-2.5 bg-teal-50 border-b border-teal-100">
              <h3 className="text-sm font-semibold text-teal-800">
                {showInfo === 'bmi'
                  ? (isDE ? 'BMI — Body Mass Index' : 'BMI — Body Mass Index')
                  : (isDE ? 'FFMI — Fettfreie-Masse-Index' : 'FFMI — Fat-Free Mass Index')}
              </h3>
              <button onClick={() => setShowInfo(null)} className="p-0.5 text-teal-400 hover:text-teal-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 py-3 space-y-3">
              {showInfo === 'bmi' ? (
                <>
                  {/* BMI Formula */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-mono text-gray-700 font-medium">
                      BMI = {isDE ? 'Gewicht' : 'Weight'} / {isDE ? 'Gr\u00f6\u00dfe' : 'Height'}{'\u00b2'}
                    </p>
                  </div>

                  {/* Calculation with current values */}
                  {latest.weight_kg && profile?.height_cm && (
                    <div className="bg-teal-50 rounded-lg p-3">
                      <p className="text-[10px] text-gray-500 mb-1">{isDE ? 'Deine Berechnung:' : 'Your calculation:'}</p>
                      <p className="text-xs font-mono text-teal-800">
                        {latest.weight_kg} kg / ({profile.height_cm / 100} m){'\u00b2'} = {latest.weight_kg} / {((profile.height_cm / 100) * (profile.height_cm / 100)).toFixed(4)} = <strong>{latest.bmi}</strong>
                      </p>
                    </div>
                  )}

                  {/* Classification table */}
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1.5">{isDE ? 'WHO-Klassifikation:' : 'WHO Classification:'}</p>
                    <div className="space-y-1">
                      {[
                        { range: '< 18.5', label: isDE ? 'Untergewicht' : 'Underweight', color: 'bg-blue-100 text-blue-700' },
                        { range: '18.5 – 24.9', label: isDE ? 'Normalgewicht' : 'Normal', color: 'bg-emerald-100 text-emerald-700' },
                        { range: '25.0 – 29.9', label: isDE ? '\u00dcbergewicht' : 'Overweight', color: 'bg-amber-100 text-amber-700' },
                        { range: '30.0 – 34.9', label: isDE ? 'Adipositas I' : 'Obese I', color: 'bg-orange-100 text-orange-700' },
                        { range: '35.0 – 39.9', label: isDE ? 'Adipositas II' : 'Obese II', color: 'bg-red-100 text-red-700' },
                        { range: '\u2265 40', label: isDE ? 'Adipositas III' : 'Obese III', color: 'bg-red-200 text-red-800' },
                      ].map(row => (
                        <div key={row.range} className={`flex items-center justify-between px-2 py-1 rounded text-[10px] ${
                          latest.bmi && (
                            (row.range === '< 18.5' && latest.bmi < 18.5) ||
                            (row.range === '18.5 – 24.9' && latest.bmi >= 18.5 && latest.bmi < 25) ||
                            (row.range === '25.0 – 29.9' && latest.bmi >= 25 && latest.bmi < 30) ||
                            (row.range === '30.0 – 34.9' && latest.bmi >= 30 && latest.bmi < 35) ||
                            (row.range === '35.0 – 39.9' && latest.bmi >= 35 && latest.bmi < 40) ||
                            (row.range === '\u2265 40' && latest.bmi >= 40)
                          ) ? `${row.color} font-semibold` : 'text-gray-500'
                        }`}>
                          <span>{row.range}</span>
                          <span>{row.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[9px] text-gray-400">
                    {isDE
                      ? 'Hinweis: BMI unterscheidet nicht zwischen Muskelmasse und Fettmasse. Bei Kraftsportlern ist der FFMI aussagekr\u00e4ftiger.'
                      : 'Note: BMI does not differentiate between muscle and fat mass. For athletes, FFMI is more meaningful.'}
                  </p>
                </>
              ) : (
                <>
                  {/* FFMI Formula */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                    <p className="text-xs font-mono text-gray-700 font-medium">
                      FFMI = {isDE ? 'Magermasse' : 'Lean Mass'} / {isDE ? 'Gr\u00f6\u00dfe' : 'Height'}{'\u00b2'}
                    </p>
                    <p className="text-xs font-mono text-gray-500">
                      {isDE ? 'Normalisiert' : 'Normalized'} = FFMI + 6.1 × (1.80 - {isDE ? 'Gr\u00f6\u00dfe' : 'Height'})
                    </p>
                  </div>

                  {/* Calculation with current values */}
                  {latest.lean_mass_kg && profile?.height_cm && (() => {
                    const hm = profile.height_cm / 100;
                    const ffmiRaw = latest.lean_mass_kg / (hm * hm);
                    const ffmiNorm = ffmiRaw + 6.1 * (1.80 - hm);
                    return (
                      <div className="bg-teal-50 rounded-lg p-3 space-y-1">
                        <p className="text-[10px] text-gray-500 mb-1">{isDE ? 'Deine Berechnung:' : 'Your calculation:'}</p>
                        <p className="text-xs font-mono text-teal-800">
                          {isDE ? 'Magermasse' : 'Lean'} = {latest.weight_kg} kg × (1 - {latest.body_fat_pct}% / 100) = <strong>{latest.lean_mass_kg} kg</strong>
                        </p>
                        <p className="text-xs font-mono text-teal-800">
                          FFMI = {latest.lean_mass_kg} / {hm}{'\u00b2'} = {ffmiRaw.toFixed(1)}
                        </p>
                        <p className="text-xs font-mono text-teal-800">
                          {isDE ? 'Norm.' : 'Norm.'} = {ffmiRaw.toFixed(1)} + 6.1 × (1.80 - {hm}) = <strong>{ffmiNorm.toFixed(1)}</strong>
                        </p>
                      </div>
                    );
                  })()}

                  {/* Classification table */}
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1.5">
                      {isDE ? `Klassifikation (${profile?.gender === 'female' ? 'Frauen' : 'M\u00e4nner'}):` : `Classification (${profile?.gender === 'female' ? 'Female' : 'Male'}):`}
                    </p>
                    {(() => {
                      const isFemale = profile?.gender === 'female';
                      const rows = isFemale
                        ? [
                            { range: '< 14', label: isDE ? 'Unter Durchschnitt' : 'Below Average', color: 'bg-blue-100 text-blue-700', min: -Infinity, max: 14 },
                            { range: '14 – 16.5', label: isDE ? 'Durchschnitt' : 'Average', color: 'bg-emerald-100 text-emerald-700', min: 14, max: 16.5 },
                            { range: '16.5 – 18', label: isDE ? '\u00dcberdurchschnittlich' : 'Above Average', color: 'bg-teal-100 text-teal-700', min: 16.5, max: 18 },
                            { range: '18 – 20', label: isDE ? 'Sehr gut' : 'Excellent', color: 'bg-amber-100 text-amber-700', min: 18, max: 20 },
                            { range: '\u2265 20', label: isDE ? 'Exzellent' : 'Superior', color: 'bg-purple-100 text-purple-700', min: 20, max: Infinity },
                          ]
                        : [
                            { range: '< 18', label: isDE ? 'Unter Durchschnitt' : 'Below Average', color: 'bg-blue-100 text-blue-700', min: -Infinity, max: 18 },
                            { range: '18 – 20', label: isDE ? 'Durchschnitt' : 'Average', color: 'bg-emerald-100 text-emerald-700', min: 18, max: 20 },
                            { range: '20 – 22', label: isDE ? '\u00dcberdurchschnittlich' : 'Above Average', color: 'bg-teal-100 text-teal-700', min: 20, max: 22 },
                            { range: '22 – 25', label: isDE ? 'Sehr gut' : 'Excellent', color: 'bg-amber-100 text-amber-700', min: 22, max: 25 },
                            { range: '25 – 26', label: isDE ? 'Exzellent' : 'Superior', color: 'bg-purple-100 text-purple-700', min: 25, max: 26 },
                            { range: '> 26', label: isDE ? '\u00dcber nat. Limit' : 'Above Natural Limit', color: 'bg-red-100 text-red-700', min: 26, max: Infinity },
                          ];

                      const currentFFMI = latest.lean_mass_kg && profile?.height_cm
                        ? calculateFFMI(latest.lean_mass_kg, profile.height_cm).normalizedFFMI
                        : null;

                      return (
                        <div className="space-y-1">
                          {rows.map(row => (
                            <div key={row.range} className={`flex items-center justify-between px-2 py-1 rounded text-[10px] ${
                              currentFFMI !== null && currentFFMI >= row.min && currentFFMI < row.max
                                ? `${row.color} font-semibold` : 'text-gray-500'
                            }`}>
                              <span>{row.range}</span>
                              <span>{row.label}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <p className="text-[9px] text-gray-400">
                    {isDE
                      ? 'FFMI ist aussagekr\u00e4ftiger als BMI f\u00fcr Sportler, da er die fettfreie Masse ber\u00fccksichtigt. Normalisiert auf 1,80 m Referenzgr\u00f6\u00dfe (Kouri et al., 1995).'
                      : 'FFMI is more meaningful than BMI for athletes as it considers lean mass. Normalized to 1.80m reference height (Kouri et al., 1995).'}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

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
