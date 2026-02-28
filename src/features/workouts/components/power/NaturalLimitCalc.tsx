/**
 * Natural Limit Calculator (FFMI-based)
 * Shows how close the user is to their estimated genetic muscular potential.
 * Based on Kouri et al. 1995 FFMI formula.
 * Visible in Power mode when showNaturalLimits is true.
 */

import { Target } from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import { useProfile } from '../../../auth/hooks/useProfile';
import { useBodyMeasurements } from '../../../body/hooks/useBodyMeasurements';

export function NaturalLimitCalc() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const { data: bodyData } = useBodyMeasurements();

  const heightCm = profile?.height_cm;
  const latestBody = bodyData?.[0];
  const weightKg = latestBody?.weight_kg;
  const bodyFatPct = latestBody?.body_fat_pct;

  // Need height, weight, and BF% for FFMI calculation
  if (!heightCm || !weightKg || !bodyFatPct) {
    return null; // Don't show if data is incomplete
  }

  const heightM = heightCm / 100;
  const leanMassKg = weightKg * (1 - bodyFatPct / 100);
  const ffmi = leanMassKg / (heightM * heightM);
  // Normalized FFMI (adjusted to 1.80m)
  const normalizedFfmi = ffmi + 6.1 * (1.8 - heightM);

  // Natural ceiling ~ 25-26 FFMI for men, ~22 for women
  const gender = profile?.gender ?? 'male';
  const naturalCeiling = gender === 'female' ? 22 : 25;
  const absoluteMax = gender === 'female' ? 24 : 27; // Even with perfect genetics

  const progressPercent = Math.min(100, Math.round((normalizedFfmi / naturalCeiling) * 100));
  const isNearLimit = normalizedFfmi >= naturalCeiling * 0.9;
  const isAboveNatural = normalizedFfmi > naturalCeiling;

  // Classification
  const getClassification = (ffmiVal: number, isFemale: boolean): string => {
    if (isFemale) {
      if (ffmiVal < 15) return t.power.ffmiBelow;
      if (ffmiVal < 17) return t.power.ffmiAverage;
      if (ffmiVal < 19) return t.power.ffmiTrained;
      if (ffmiVal < 22) return t.power.ffmiAdvanced;
      return t.power.ffmiElite;
    }
    if (ffmiVal < 18) return t.power.ffmiBelow;
    if (ffmiVal < 20) return t.power.ffmiAverage;
    if (ffmiVal < 22) return t.power.ffmiTrained;
    if (ffmiVal < 25) return t.power.ffmiAdvanced;
    return t.power.ffmiElite;
  };

  return (
    <div className="rounded-xl border bg-indigo-50 border-indigo-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-900">
          {t.power.naturalLimit}
        </h3>
      </div>

      {/* FFMI Display */}
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold text-indigo-700">
          {normalizedFfmi.toFixed(1)}
        </span>
        <span className="text-xs text-gray-500">FFMI</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-600 font-medium">
          {getClassification(normalizedFfmi, gender === 'female')}
        </span>
      </div>

      {/* Progress to natural ceiling */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
          <span>{t.power.ffmiCurrent}</span>
          <span>
            {t.power.ffmiNaturalMax}: ~{naturalCeiling}
          </span>
        </div>
        <div className="bg-white/60 rounded-full h-2.5 overflow-hidden relative">
          <div
            className={`rounded-full h-2.5 transition-all duration-500 ${
              isAboveNatural ? 'bg-red-400' : isNearLimit ? 'bg-amber-400' : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
          {/* Natural limit marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
            style={{ left: `${Math.min((naturalCeiling / absoluteMax) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-gray-400">{t.power.leanMass}</p>
          <p className="text-xs font-semibold text-gray-700">{leanMassKg.toFixed(1)} kg</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400">{t.power.bodyFat}</p>
          <p className="text-xs font-semibold text-gray-700">{bodyFatPct.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400">{t.power.potential}</p>
          <p className="text-xs font-semibold text-gray-700">{progressPercent}%</p>
        </div>
      </div>

      {isNearLimit && !isAboveNatural && (
        <p className="text-[10px] text-amber-600 mt-2">
          ⚡ {t.power.nearNaturalLimit}
        </p>
      )}
    </div>
  );
}
