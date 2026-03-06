/**
 * WarmupCard — Cardio warm-up with functional countdown timer.
 *
 * Two phases:
 * 1. Setup — Pick cardio type, duration, description
 * 2. Active — Live countdown timer with pause/resume + early finish
 *
 * MET-based calorie calculation updates in real-time during the active phase.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Flame, SkipForward, Play, Pause, CheckCircle2,
  Timer, RotateCcw,
} from 'lucide-react';
import { useTranslation } from '../../../i18n';
import type { WarmupResult } from '../../../types/health';
import { calculateWarmupCalories } from '../utils/calorieCalculation';

interface WarmupCardProps {
  weightKg: number;
  onSave: (warmup: WarmupResult) => void;
  onSkip: () => void;
}

const CARDIO_TYPES = [
  { key: 'treadmill', de: 'Laufband', en: 'Treadmill' },
  { key: 'bike', de: 'Ergometer', en: 'Stationary Bike' },
  { key: 'rowing', de: 'Rudergerät', en: 'Rowing Machine' },
  { key: 'elliptical', de: 'Crosstrainer', en: 'Elliptical' },
  { key: 'jump_rope', de: 'Seilspringen', en: 'Jump Rope' },
  { key: 'walking', de: 'Gehen', en: 'Walking' },
] as const;

const QUICK_DURATIONS = [5, 10, 15, 20];

type WarmupPhase = 'setup' | 'active';

export function WarmupCard({ weightKg, onSave, onSkip }: WarmupCardProps) {
  const { language } = useTranslation();
  const isDE = language === 'de';

  // Setup state
  const [duration, setDuration] = useState(10);
  const [cardioType, setCardioType] = useState('treadmill');
  const [customDescription, setCustomDescription] = useState('');

  // Timer state
  const [phase, setPhase] = useState<WarmupPhase>('setup');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const targetSeconds = duration * 60;
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
  const progressPct = targetSeconds > 0 ? Math.min(100, (elapsedSeconds / targetSeconds) * 100) : 0;

  const selectedCardio = CARDIO_TYPES.find(c => c.key === cardioType);
  const description = customDescription.trim()
    || `${duration} Min ${isDE ? selectedCardio?.de : selectedCardio?.en}`;

  // Real-time calorie calculation based on actual elapsed time
  const actualMinutes = phase === 'active' ? Math.max(1, Math.ceil(elapsedSeconds / 60)) : duration;
  const { calories } = calculateWarmupCalories(description, actualMinutes, weightKg);

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  // Auto-complete when countdown reaches 0
  useEffect(() => {
    if (phase === 'active' && elapsedSeconds >= targetSeconds && isRunning) {
      setIsRunning(false);
      // Vibrate if available
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  }, [elapsedSeconds, targetSeconds, phase, isRunning]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const handleStart = () => {
    setPhase('active');
    setElapsedSeconds(0);
    setIsRunning(true);
  };

  const handlePauseResume = () => {
    setIsRunning(!isRunning);
  };

  const handleFinish = () => {
    setIsRunning(false);
    const actualDuration = Math.max(1, Math.ceil(elapsedSeconds / 60));
    const finalCalories = calculateWarmupCalories(description, actualDuration, weightKg);
    onSave({
      description,
      duration_minutes: actualDuration,
      calories_burned: finalCalories.calories,
      met_value: finalCalories.met,
    });
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setPhase('setup');
  };

  // ── Setup Phase ────────────────────────────────────────────────────────

  if (phase === 'setup') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">
            {isDE ? 'Aufwärmen (Cardio)' : 'Warm-up (Cardio)'}
          </h3>
        </div>

        {/* Cardio Type */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            {isDE ? 'Gerät / Art' : 'Equipment / Type'}
          </label>
          <div className="flex flex-wrap gap-2">
            {CARDIO_TYPES.map(ct => (
              <button
                key={ct.key}
                onClick={() => setCardioType(ct.key)}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                  cardioType === ct.key
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isDE ? ct.de : ct.en}
              </button>
            ))}
          </div>
        </div>

        {/* Duration Quick Select */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            {isDE ? 'Dauer (Minuten)' : 'Duration (minutes)'}
          </label>
          <div className="flex gap-2">
            {QUICK_DURATIONS.map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  duration === d
                    ? 'bg-teal-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d} Min
              </button>
            ))}
          </div>
          {/* Custom duration input */}
          <input
            type="number"
            min={1}
            max={60}
            value={duration}
            onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
            className="mt-2 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder={isDE ? 'Oder eigene Dauer...' : 'Or custom duration...'}
          />
        </div>

        {/* Custom Description (optional) */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            {isDE ? 'Beschreibung (optional)' : 'Description (optional)'}
          </label>
          <input
            type="text"
            value={customDescription}
            onChange={e => setCustomDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder={isDE ? 'z.B. Leichtes Joggen, Zone 2' : 'e.g. Light jogging, Zone 2'}
          />
        </div>

        {/* Calorie Preview */}
        <div className="bg-orange-50 rounded-lg px-3 py-2 flex items-center justify-between">
          <span className="text-sm text-orange-700">
            {isDE ? 'Geschätzter Verbrauch' : 'Estimated burn'}
          </span>
          <span className="text-sm font-semibold text-orange-700">
            ~{calories} kcal
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <SkipForward className="h-4 w-4" />
            {isDE ? 'Überspringen' : 'Skip'}
          </button>
          <button
            onClick={handleStart}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors font-medium"
          >
            <Play className="h-4 w-4" />
            {isDE ? 'Starten' : 'Start'}
          </button>
        </div>
      </div>
    );
  }

  // ── Active Timer Phase ─────────────────────────────────────────────────

  const isComplete = elapsedSeconds >= targetSeconds;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">
            {isDE ? 'Aufwärmen läuft' : 'Warming up'}
          </h3>
        </div>
        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
          {isDE ? selectedCardio?.de : selectedCardio?.en}
        </span>
      </div>

      {/* Large Timer Display */}
      <div className="text-center py-4">
        {/* Remaining time (countdown) */}
        <div className={`text-5xl font-bold font-mono tabular-nums ${
          isComplete ? 'text-green-500' : isRunning ? 'text-teal-500' : 'text-gray-400'
        }`}>
          {isComplete ? '00:00' : formatTime(remainingSeconds)}
        </div>

        {/* Elapsed / Target */}
        <div className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
          <Timer className="h-3 w-3" />
          {formatTime(elapsedSeconds)} / {formatTime(targetSeconds)}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 mx-auto max-w-xs h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
              isComplete ? 'bg-green-500' : 'bg-teal-500'
            }`}
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>

        {/* Status text */}
        {isComplete && (
          <p className="text-sm font-medium text-green-600 mt-3">
            {isDE ? 'Aufwärmen abgeschlossen!' : 'Warm-up complete!'}
          </p>
        )}
      </div>

      {/* Calorie counter (real-time) */}
      <div className="bg-orange-50 rounded-lg px-3 py-2 flex items-center justify-between">
        <span className="text-sm text-orange-700">
          {isDE ? 'Verbrauch' : 'Burn'}
        </span>
        <span className="text-sm font-semibold text-orange-700">
          ~{calories} kcal
        </span>
      </div>

      {/* Timer Controls — Row 1: Main action */}
      <div className="flex gap-2">
        {/* Pause / Resume (primary action) */}
        {!isComplete && (
          <button
            onClick={handlePauseResume}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm rounded-xl transition-colors font-medium ${
              isRunning
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'bg-teal-500 text-white hover:bg-teal-600'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                {isDE ? 'Pause' : 'Pause'}
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                {isDE ? 'Fortsetzen' : 'Resume'}
              </>
            )}
          </button>
        )}

        {/* Finish — always available (with calorie data) */}
        <button
          onClick={handleFinish}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm rounded-xl transition-colors font-medium ${
            isComplete
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-teal-500/20 text-teal-700 hover:bg-teal-500/30'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          {isDE ? 'Fertig — weiter' : 'Done — continue'}
        </button>
      </div>

      {/* Timer Controls — Row 2: Secondary actions */}
      <div className="flex gap-2">
        <button
          onClick={handleReset}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {isDE ? 'Neustart' : 'Reset'}
        </button>
        <button
          onClick={onSkip}
          className="flex-1 flex items-center justify-center gap-2 py-2 text-xs text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <SkipForward className="h-3.5 w-3.5" />
          {isDE ? 'Überspringen' : 'Skip'}
        </button>
      </div>
    </div>
  );
}
