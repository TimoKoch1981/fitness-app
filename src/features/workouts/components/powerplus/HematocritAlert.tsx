/**
 * Hematocrit Alert Banner
 * Shows a warning when the latest blood work hematocrit is >=52%.
 * Elevated hematocrit increases thrombosis risk — common side effect of AAS/TRT.
 * Visible in Power+ mode when showHematocritAlert is true.
 */

import { AlertTriangle, Droplets } from 'lucide-react';
import { useTranslation } from '../../../../i18n';
import { useLatestBloodWork } from '../../../medical/hooks/useBloodWork';

const HEMATOCRIT_WARNING = 52; // % — clinical threshold for polycythemia
const HEMATOCRIT_DANGER = 54;  // % — urgent, consider phlebotomy

export function HematocritAlert() {
  const { t } = useTranslation();
  const { data: latest } = useLatestBloodWork();

  const hct = latest?.hematocrit;
  if (!hct || hct < HEMATOCRIT_WARNING) return null;

  const isDanger = hct >= HEMATOCRIT_DANGER;
  const daysAgo = latest?.date
    ? Math.floor((Date.now() - new Date(latest.date).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div
      className={`rounded-xl border p-3 ${
        isDanger
          ? 'bg-red-50 border-red-300'
          : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`p-1.5 rounded-lg ${isDanger ? 'bg-red-100' : 'bg-amber-100'}`}>
          {isDanger ? (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          ) : (
            <Droplets className="h-4 w-4 text-amber-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className={`text-sm font-semibold ${isDanger ? 'text-red-800' : 'text-amber-800'}`}>
              {t.powerPlus.hematocritAlert}
            </h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              isDanger ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-700'
            }`}>
              {hct.toFixed(1)}%
            </span>
          </div>
          <p className={`text-[11px] leading-relaxed ${isDanger ? 'text-red-700' : 'text-amber-700'}`}>
            {isDanger
              ? t.powerPlus.hematocritDanger
              : t.powerPlus.hematocritWarning}
          </p>
          {daysAgo !== null && (
            <p className="text-[10px] text-gray-400 mt-1">
              {t.powerPlus.bloodWorkAge}: {daysAgo} {t.powerPlus.daysAgo}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
