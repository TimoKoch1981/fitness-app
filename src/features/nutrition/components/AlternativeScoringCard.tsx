/**
 * AlternativeScoringCard — Optional display of alternative nutrition scoring systems.
 * Shows WW Points, Noom Colors, and/or Nutri-Score based on user preference.
 * Collapsible card with system selector.
 */

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { cn } from '../../../lib/utils';
import {
  calculateAllScores,
  NOOM_COLOR_CONFIG,
  NUTRI_SCORE_CONFIG,
  SCORING_SYSTEMS,
  type NutritionScoringInput,
  type ScoringSystem,
  type ScoringResult,
} from '../utils/alternativeScoring';

interface AlternativeScoringCardProps {
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  /** Which systems to show (persisted in localStorage) */
  activeSystems?: ScoringSystem[];
  onSystemsChange?: (systems: ScoringSystem[]) => void;
}

const STORAGE_KEY = 'fitbuddy_scoring_systems';

export function AlternativeScoringCard({ totals, activeSystems, onSystemsChange }: AlternativeScoringCardProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  const [expanded, setExpanded] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Load from localStorage if not controlled
  const [localSystems, setLocalSystems] = useState<ScoringSystem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const systems = activeSystems ?? localSystems;
  const setSystems = (s: ScoringSystem[]) => {
    if (onSystemsChange) {
      onSystemsChange(s);
    } else {
      setLocalSystems(s);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    }
  };

  // Calculate scores
  const scores: ScoringResult | null = useMemo(() => {
    if (totals.calories <= 0 || systems.length === 0) return null;
    const input: NutritionScoringInput = {
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      fiber: totals.fiber > 0 ? totals.fiber : undefined,
    };
    return calculateAllScores(input);
  }, [totals, systems]);

  const toggleSystem = (key: ScoringSystem) => {
    const next = systems.includes(key)
      ? systems.filter((s) => s !== key)
      : [...systems, key];
    setSystems(next);
  };

  // Don't render if no calories tracked yet
  if (totals.calories <= 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm">📊</span>
        <span className="flex-1 text-xs font-medium text-gray-700">
          {isDE ? 'Alternative Bewertungen' : 'Alternative Scores'}
        </span>
        {systems.length > 0 && scores && !expanded && (
          <div className="flex items-center gap-1.5">
            {systems.includes('wwSmartPoints') && (
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full font-medium">
                {scores.wwPoints} WW
              </span>
            )}
            {systems.includes('wwClassic') && (
              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded-full font-medium">
                {scores.wwClassicPoints} P
              </span>
            )}
            {systems.includes('noom') && (
              <span className={cn(
                'px-1.5 py-0.5 text-[10px] rounded-full font-medium',
                NOOM_COLOR_CONFIG[scores.noomColor].bg,
                NOOM_COLOR_CONFIG[scores.noomColor].text,
              )}>
                {isDE ? NOOM_COLOR_CONFIG[scores.noomColor].labelDe : NOOM_COLOR_CONFIG[scores.noomColor].labelEn}
              </span>
            )}
            {systems.includes('nutriScore') && (
              <span className={cn(
                'w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold',
                NUTRI_SCORE_CONFIG[scores.nutriScoreGrade].bg,
                NUTRI_SCORE_CONFIG[scores.nutriScoreGrade].text,
              )}>
                {scores.nutriScoreGrade}
              </span>
            )}
          </div>
        )}
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-gray-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* System selector */}
          <div className="flex gap-1 flex-wrap">
            {SCORING_SYSTEMS.map((sys) => (
              <button
                key={sys.key}
                onClick={() => toggleSystem(sys.key)}
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border',
                  systems.includes(sys.key)
                    ? 'bg-teal-50 text-teal-700 border-teal-200'
                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                )}
              >
                {isDE ? sys.labelDe : sys.labelEn}
              </button>
            ))}
          </div>

          {systems.length === 0 && (
            <p className="text-[10px] text-gray-400 text-center py-2">
              {isDE ? 'Waehle ein Bewertungssystem aus' : 'Select a scoring system'}
            </p>
          )}

          {scores && systems.length > 0 && (
            <div className="space-y-2">
              {/* WW SmartPoints */}
              {systems.includes('wwSmartPoints') && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{scores.wwPoints}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800">WW SmartPoints</p>
                    <p className="text-[10px] text-gray-500">
                      {isDE
                        ? 'Punkte fuer den heutigen Tag'
                        : "Today's total points"}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConfig(s => !s)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* WW Classic */}
              {systems.includes('wwClassic') && (
                <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{scores.wwClassicPoints}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800">
                      {isDE ? 'WW Klassisch' : 'WW Classic'}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {isDE
                        ? 'Kalorien + Fett - Ballaststoffe'
                        : 'Calories + Fat - Fiber'}
                    </p>
                  </div>
                </div>
              )}

              {/* Noom */}
              {systems.includes('noom') && (
                <div className={cn('flex items-center gap-2 p-2 rounded-lg', NOOM_COLOR_CONFIG[scores.noomColor].bg)}>
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2',
                    NOOM_COLOR_CONFIG[scores.noomColor].border,
                    scores.noomColor === 'green' ? 'bg-green-500' : scores.noomColor === 'yellow' ? 'bg-yellow-400' : 'bg-red-500',
                  )}>
                    <span className={cn('font-bold text-[10px]', scores.noomColor === 'yellow' ? 'text-gray-900' : 'text-white')}>
                      {scores.noomCalorieDensity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800">
                      Noom: {isDE ? NOOM_COLOR_CONFIG[scores.noomColor].labelDe : NOOM_COLOR_CONFIG[scores.noomColor].labelEn}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {isDE
                        ? `Kaloriendichte: ${scores.noomCalorieDensity} kcal/g`
                        : `Calorie density: ${scores.noomCalorieDensity} kcal/g`}
                    </p>
                  </div>
                </div>
              )}

              {/* Nutri-Score */}
              {systems.includes('nutriScore') && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className="flex gap-0.5">
                    {(['A', 'B', 'C', 'D', 'E'] as const).map((grade) => (
                      <div
                        key={grade}
                        className={cn(
                          'w-6 h-7 rounded-sm flex items-center justify-center text-[10px] font-bold transition-transform',
                          NUTRI_SCORE_CONFIG[grade].bg,
                          NUTRI_SCORE_CONFIG[grade].text,
                          scores.nutriScoreGrade === grade ? 'scale-125 ring-2 ring-gray-800 ring-offset-1' : 'opacity-50',
                        )}
                      >
                        {grade}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800">
                      Nutri-Score {scores.nutriScoreGrade}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {isDE
                        ? 'EU-Naehrwertbewertung (vereinfacht)'
                        : 'EU nutrition grade (simplified)'}
                    </p>
                  </div>
                </div>
              )}

              {/* Data completeness warning */}
              {scores.dataCompleteness < 75 && (
                <p className="text-[9px] text-amber-600 flex items-center gap-1">
                  <Info className="h-2.5 w-2.5" />
                  {isDE
                    ? `Datenvollstaendigkeit: ${scores.dataCompleteness}% — fehlende Werte (Zucker, ges. Fett) werden geschaetzt`
                    : `Data completeness: ${scores.dataCompleteness}% — missing values (sugar, sat. fat) are estimated`}
                </p>
              )}
            </div>
          )}

          {/* Info popover */}
          {showConfig && (
            <div className="bg-gray-50 rounded-lg p-2 text-[10px] text-gray-600 space-y-1">
              <p className="font-medium text-gray-700">{isDE ? 'Formeln:' : 'Formulas:'}</p>
              <p>• <strong>WW SmartPoints:</strong> (Cal×0.031) + (Ges.Fett×0.275) + (Zucker×0.12) - (Protein×0.098)</p>
              <p>• <strong>WW Classic:</strong> (Cal/50) + (Fett/12) - (Ballaststoffe/5)</p>
              <p>• <strong>Noom:</strong> {isDE ? 'Kaloriendichte' : 'Calorie density'} {'<'}1 = {isDE ? 'Gruen' : 'Green'}, 1-3 = {isDE ? 'Gelb' : 'Yellow'}, {'>'}3 = {isDE ? 'Rot' : 'Red'}</p>
              <p>• <strong>Nutri-Score:</strong> {isDE ? 'EU-Standard, vereinfacht (ohne Obst/Gemuese-%)' : 'EU standard, simplified (without fruit/veg %)'}</p>
              <button
                onClick={() => setShowConfig(false)}
                className="text-teal-600 hover:underline mt-1"
              >
                {isDE ? 'Schliessen' : 'Close'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
