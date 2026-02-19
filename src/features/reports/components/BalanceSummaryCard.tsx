/**
 * BalanceSummaryCard — Compact summary of calorie balance for a date range.
 *
 * Shows: Total Intake, Total TDEE, Net Balance (surplus/deficit),
 * and theoretical fat equivalent (7,000 kcal ≈ 1 kg body fat).
 */

import type { DailyBalance } from '../hooks/useReportData';

interface BalanceSummaryCardProps {
  data: DailyBalance[];
  language?: 'de' | 'en';
}

export function BalanceSummaryCard({ data, language = 'de' }: BalanceSummaryCardProps) {
  if (data.length === 0) return null;

  // Only count days with actual intake data
  const daysWithIntake = data.filter((d) => d.intake > 0).length;

  const totalIntake = data.reduce((s, d) => s + d.intake, 0);
  const totalTDEE = data.reduce((s, d) => s + d.tdee, 0);
  const totalBurned = data.reduce((s, d) => s + d.burned, 0);
  const netBalance = totalIntake - totalTDEE;
  const isDeficit = netBalance < 0;

  // Theoretical fat equivalent: ~7,000 kcal per kg body fat
  const fatEquivalentKg = Math.abs(netBalance) / 7000;

  const labels = {
    title: language === 'de' ? 'Bilanz-Zusammenfassung' : 'Balance Summary',
    intake: language === 'de' ? 'Aufnahme gesamt' : 'Total Intake',
    tdee: language === 'de' ? 'Verbrauch gesamt (TDEE)' : 'Total Expenditure (TDEE)',
    burned: language === 'de' ? 'Workout-Kalorien' : 'Workout Calories',
    net: language === 'de' ? 'Netto-Bilanz' : 'Net Balance',
    deficit: language === 'de' ? 'Defizit' : 'Deficit',
    surplus: language === 'de' ? 'Überschuss' : 'Surplus',
    equivalent: language === 'de' ? 'Entspricht ca.' : 'Equivalent to approx.',
    fatLoss: language === 'de' ? 'Fettabbau' : 'fat loss',
    fatGain: language === 'de' ? 'Fettzunahme' : 'fat gain',
    days: language === 'de' ? 'Tage mit Daten' : 'Days with data',
    avgDaily: language === 'de' ? 'Ø Tages-Bilanz' : 'Avg Daily Balance',
  };

  const avgDaily = daysWithIntake > 0 ? Math.round(netBalance / daysWithIntake) : 0;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{labels.title}</h3>

      <div className="space-y-2 text-sm">
        {/* Intake */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500">{labels.intake}</span>
          <span className="font-medium text-teal-600">
            {totalIntake.toLocaleString('de-DE')} kcal
          </span>
        </div>

        {/* TDEE */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500">{labels.tdee}</span>
          <span className="font-medium text-orange-500">
            {totalTDEE.toLocaleString('de-DE')} kcal
          </span>
        </div>

        {/* Workout Calories */}
        {totalBurned > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-500">{labels.burned}</span>
            <span className="font-medium text-purple-500">
              {totalBurned.toLocaleString('de-DE')} kcal
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-100 my-1" />

        {/* Net Balance */}
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">{labels.net}</span>
          <span
            className={`font-bold text-base ${
              isDeficit ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {netBalance > 0 ? '+' : ''}
            {netBalance.toLocaleString('de-DE')} kcal
          </span>
        </div>

        {/* Type label */}
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">{labels.days}: {daysWithIntake}</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isDeficit
                ? 'bg-green-50 text-green-600'
                : 'bg-red-50 text-red-500'
            }`}
          >
            {isDeficit ? labels.deficit : labels.surplus}
          </span>
        </div>

        {/* Average Daily */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500">{labels.avgDaily}</span>
          <span className={`font-medium ${isDeficit ? 'text-green-600' : 'text-red-500'}`}>
            {avgDaily > 0 ? '+' : ''}{avgDaily.toLocaleString('de-DE')} kcal
          </span>
        </div>

        {/* Fat Equivalent */}
        {fatEquivalentKg >= 0.05 && (
          <div className="flex justify-between items-center text-xs text-gray-400 pt-1">
            <span>{labels.equivalent}</span>
            <span>
              {fatEquivalentKg.toFixed(2)} kg {isDeficit ? labels.fatLoss : labels.fatGain}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
