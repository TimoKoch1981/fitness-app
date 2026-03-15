/**
 * RefeedCalendar — Weekly refeed day planner + diet break scheduling.
 *
 * Allows users to configure which days are refeed days during cut phase.
 * Calculates refeed-day macros (TDEE + extra carbs).
 * Supports diet-break scheduling (1-2 week periods at maintenance).
 *
 * Evidence:
 * - Byrne et al. 2018 (MATADOR study): Intermittent energy restriction
 * - Trexler et al. 2014: Metabolic adaptation to weight loss
 * - Campbell et al. 2020: Contest preparation guidelines
 *
 * Visible only in cut phase + Power/Power+ mode.
 */

import { useState, useMemo, useCallback } from 'react';
import { UtensilsCrossed, ChevronDown, ChevronUp, Info, Zap, Pause } from 'lucide-react';

interface RefeedCalendarProps {
  language: 'de' | 'en';
  /** Weeks into the current cut phase */
  weeksIntoCut: number;
  /** TDEE for refeed macro calculation */
  tdee: number;
  /** Body weight in kg */
  bodyWeight: number;
  /** Current phase (only shown during cut) */
  phase: string;
}

interface RefeedConfig {
  /** Which weekdays are refeed days (0=Mon, 6=Sun) */
  refeedDays: number[];
  /** Diet break: start date ISO string */
  dietBreakStart: string | null;
  /** Diet break duration in days */
  dietBreakDuration: number;
}

const LS_KEY = 'fitbuddy_refeed_config';

const WEEKDAY_LABELS = {
  de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

function loadConfig(): RefeedConfig {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { refeedDays: [5], dietBreakStart: null, dietBreakDuration: 14 }; // Default: Saturday refeed
}

function saveConfig(config: RefeedConfig) {
  localStorage.setItem(LS_KEY, JSON.stringify(config));
}

export function RefeedCalendar({ language, weeksIntoCut, tdee, bodyWeight, phase }: RefeedCalendarProps) {
  const de = language === 'de';
  const [config, setConfig] = useState<RefeedConfig>(loadConfig);
  const [expanded, setExpanded] = useState(false);
  const [showDietBreak, setShowDietBreak] = useState(false);

  // Only show during cut
  if (phase !== 'cut' && phase !== 'peak_week') return null;

  const updateConfig = useCallback((updates: Partial<RefeedConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      saveConfig(next);
      return next;
    });
  }, []);

  const toggleRefeedDay = useCallback((dayIdx: number) => {
    setConfig(prev => {
      const days = prev.refeedDays.includes(dayIdx)
        ? prev.refeedDays.filter(d => d !== dayIdx)
        : [...prev.refeedDays, dayIdx].sort();
      const next = { ...prev, refeedDays: days };
      saveConfig(next);
      return next;
    });
  }, []);

  // Recommended refeed frequency based on weeks into cut
  const recommendation = useMemo(() => {
    if (weeksIntoCut < 4) return { freq: 0, label: de ? 'Noch kein Refeed noetig' : 'No refeed needed yet', type: 'none' as const };
    if (weeksIntoCut < 8) return { freq: 1, label: de ? '1x/Woche empfohlen' : '1x/week recommended', type: 'refeed' as const };
    if (weeksIntoCut < 12) return { freq: 2, label: de ? '2x/Woche empfohlen' : '2x/week recommended', type: 'refeed' as const };
    return { freq: 0, label: de ? 'Diet Break empfohlen (7-14 Tage)' : 'Diet break recommended (7-14 days)', type: 'break' as const };
  }, [weeksIntoCut, de]);

  // Is today a refeed day?
  const todayDayIdx = (new Date().getDay() + 6) % 7; // Convert JS Sunday=0 to Monday=0
  const isTodayRefeed = config.refeedDays.includes(todayDayIdx);

  // Is today in a diet break?
  const isTodayDietBreak = useMemo(() => {
    if (!config.dietBreakStart) return false;
    const start = new Date(config.dietBreakStart).getTime();
    const end = start + config.dietBreakDuration * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return now >= start && now <= end;
  }, [config.dietBreakStart, config.dietBreakDuration]);

  // Refeed day macros: TDEE (no deficit) + extra carbs
  const refeedMacros = useMemo(() => {
    const protein = Math.round(bodyWeight * 2.5); // Keep protein high
    const fat = Math.round(bodyWeight * 0.5); // Minimize fat on refeed
    const extraCarbs = Math.round(bodyWeight * 1.5); // +1.5g/kg extra carbs
    const baseCarbs = Math.round((tdee - protein * 4 - fat * 9) / 4);
    const carbs = Math.round(baseCarbs + extraCarbs);
    const calories = protein * 4 + carbs * 4 + fat * 9;
    return { calories: Math.round(calories), protein, carbs, fat };
  }, [tdee, bodyWeight]);

  // Diet break status
  const dietBreakStatus = useMemo(() => {
    if (!config.dietBreakStart) return null;
    const start = new Date(config.dietBreakStart);
    const end = new Date(start.getTime() + config.dietBreakDuration * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
    const isActive = now >= start && now <= end;
    const isPast = now > end;
    return {
      startFormatted: start.toLocaleDateString(de ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit' }),
      endFormatted: end.toLocaleDateString(de ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit' }),
      daysLeft,
      isActive,
      isPast,
    };
  }, [config.dietBreakStart, config.dietBreakDuration, de]);

  return (
    <div className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-3"
      >
        <div className="w-7 h-7 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
          <UtensilsCrossed className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <span className="text-xs font-semibold text-gray-700">
            {de ? 'Refeed-Kalender' : 'Refeed Calendar'}
          </span>
          <span className="ml-2 text-[10px] text-gray-400">
            {de ? `Woche ${weeksIntoCut}` : `Week ${weeksIntoCut}`}
            {isTodayRefeed && (
              <span className="ml-1 px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full font-medium">
                {de ? 'Heute Refeed!' : 'Refeed today!'}
              </span>
            )}
            {isTodayDietBreak && (
              <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full font-medium">
                {de ? 'Diet Break aktiv' : 'Diet break active'}
              </span>
            )}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-300" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-300" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Recommendation */}
          <div className={`rounded-lg p-2 text-xs ${
            recommendation.type === 'break' ? 'bg-red-50 text-red-700' :
            recommendation.type === 'refeed' ? 'bg-orange-50 text-orange-700' :
            'bg-gray-50 text-gray-600'
          }`}>
            <div className="flex items-center gap-1.5">
              <Info className="h-3 w-3 flex-shrink-0" />
              <span className="font-medium">{recommendation.label}</span>
            </div>
          </div>

          {/* Weekly Refeed Day Selector */}
          <div>
            <p className="text-[10px] text-gray-500 font-medium mb-1.5 uppercase tracking-wider">
              {de ? 'Refeed-Tage waehlen' : 'Select Refeed Days'}
            </p>
            <div className="flex gap-1.5">
              {WEEKDAY_LABELS[de ? 'de' : 'en'].map((label, i) => (
                <button
                  key={i}
                  onClick={() => toggleRefeedDay(i)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    config.refeedDays.includes(i)
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  } ${i === todayDayIdx ? 'ring-2 ring-orange-300 ring-offset-1' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-gray-400 mt-1">
              {de
                ? `${config.refeedDays.length} Refeed-Tag(e) • Empfehlung: ${recommendation.freq || 0}x/Woche`
                : `${config.refeedDays.length} refeed day(s) • Recommended: ${recommendation.freq || 0}x/week`
              }
            </p>
          </div>

          {/* Refeed Day Macros */}
          {config.refeedDays.length > 0 && (
            <div className="bg-orange-50 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap className="h-3 w-3 text-orange-500" />
                <p className="text-[10px] text-orange-700 font-medium">
                  {de ? 'Refeed-Tag Makros' : 'Refeed Day Macros'}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="bg-white/70 rounded py-1">
                  <p className="text-xs font-bold text-gray-900">{refeedMacros.calories}</p>
                  <p className="text-[8px] text-gray-500">kcal</p>
                </div>
                <div className="bg-white/70 rounded py-1">
                  <p className="text-xs font-bold text-teal-700">{refeedMacros.protein}g</p>
                  <p className="text-[8px] text-teal-600">Protein</p>
                </div>
                <div className="bg-white/70 rounded py-1">
                  <p className="text-xs font-bold text-blue-700">{refeedMacros.carbs}g</p>
                  <p className="text-[8px] text-blue-600">Carbs</p>
                </div>
                <div className="bg-white/70 rounded py-1">
                  <p className="text-xs font-bold text-amber-700">{refeedMacros.fat}g</p>
                  <p className="text-[8px] text-amber-600">{de ? 'Fett' : 'Fat'}</p>
                </div>
              </div>
              <p className="text-[9px] text-orange-500 mt-1.5">
                {de
                  ? 'TDEE + Extra-Carbs (+1.5g/kg). Protein bleibt hoch, Fett minimiert.'
                  : 'TDEE + extra carbs (+1.5g/kg). Protein stays high, fat minimized.'
                }
              </p>
            </div>
          )}

          {/* Diet Break Section */}
          <div>
            <button
              onClick={() => setShowDietBreak(!showDietBreak)}
              className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 hover:text-gray-700"
            >
              <Pause className="h-3 w-3" />
              {de ? 'Diet Break planen' : 'Plan Diet Break'}
              {showDietBreak ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showDietBreak && (
              <div className="mt-2 bg-gray-50 rounded-lg p-2.5 space-y-2">
                {/* Diet break status */}
                {dietBreakStatus && !dietBreakStatus.isPast && (
                  <div className={`rounded-lg p-2 text-xs ${
                    dietBreakStatus.isActive ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {dietBreakStatus.isActive ? (
                      <span>
                        {de ? `Diet Break aktiv! Noch ${dietBreakStatus.daysLeft} Tage (bis ${dietBreakStatus.endFormatted})`
                             : `Diet break active! ${dietBreakStatus.daysLeft} days left (until ${dietBreakStatus.endFormatted})`
                        }
                      </span>
                    ) : (
                      <span>
                        {de ? `Geplant: ${dietBreakStatus.startFormatted} - ${dietBreakStatus.endFormatted}`
                             : `Scheduled: ${dietBreakStatus.startFormatted} - ${dietBreakStatus.endFormatted}`
                        }
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-500 flex-shrink-0">
                    {de ? 'Start:' : 'Start:'}
                  </label>
                  <input
                    type="date"
                    value={config.dietBreakStart ?? ''}
                    onChange={(e) => updateConfig({ dietBreakStart: e.target.value || null })}
                    className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-300"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-500 flex-shrink-0">
                    {de ? 'Dauer:' : 'Duration:'}
                  </label>
                  <div className="flex gap-1">
                    {[7, 10, 14].map(d => (
                      <button
                        key={d}
                        onClick={() => updateConfig({ dietBreakDuration: d })}
                        className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                          config.dietBreakDuration === d
                            ? 'bg-orange-500 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {d} {de ? 'Tage' : 'days'}
                      </button>
                    ))}
                  </div>
                </div>

                {config.dietBreakStart && (
                  <button
                    onClick={() => updateConfig({ dietBreakStart: null })}
                    className="text-[10px] text-red-500 hover:text-red-600"
                  >
                    {de ? 'Diet Break entfernen' : 'Remove diet break'}
                  </button>
                )}

                <p className="text-[9px] text-gray-400">
                  {de
                    ? 'Diet Break = TDEE (kein Defizit) fuer 7-14 Tage. Protein 2.0g/kg. Empfohlen nach 12+ Wochen Cut (Byrne 2018, MATADOR).'
                    : 'Diet break = TDEE (no deficit) for 7-14 days. Protein 2.0g/kg. Recommended after 12+ weeks of cutting (Byrne 2018, MATADOR).'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Evidence */}
          <p className="text-[9px] text-gray-300">
            Byrne et al. 2018 (MATADOR) • Trexler et al. 2014 • Campbell et al. 2020
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Check if today is a refeed day (for external components).
 */
export function isTodayRefeedDay(): boolean {
  const config = loadConfig();
  const todayDayIdx = (new Date().getDay() + 6) % 7;
  return config.refeedDays.includes(todayDayIdx);
}

/**
 * Check if today is in a diet break period.
 */
export function isTodayInDietBreak(): boolean {
  const config = loadConfig();
  if (!config.dietBreakStart) return false;
  const start = new Date(config.dietBreakStart).getTime();
  const end = start + config.dietBreakDuration * 24 * 60 * 60 * 1000;
  const now = Date.now();
  return now >= start && now <= end;
}
