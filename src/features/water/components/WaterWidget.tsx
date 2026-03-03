/**
 * WaterWidget — Compact, interactive water tracking card for the Cockpit page.
 *
 * Features:
 * - Visual circular progress ring with fill animation
 * - Quick-add buttons: +250ml (glass), +500ml (bottle), custom
 * - Current total / goal display (e.g., "1750 / 2500 ml")
 * - Tap on droplet icon = +250ml quick-add
 * - Undo button for last entry
 * - Teal/blue color scheme (water theme)
 * - Ripple animation on each add
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Plus, GlassWater, Undo2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useWaterIntake } from '../hooks/useWaterIntake';
import { WaterRipple } from './WaterRipple';

// ── Progress Ring SVG ───────────────────────────────────────────────────

interface ProgressRingProps {
  percentage: number;
  size: number;
  strokeWidth: number;
}

function ProgressRing({ percentage, size, strokeWidth }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-blue-100"
      />
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#waterGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
      {/* Gradient definition */}
      <defs>
        <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Custom Amount Input ─────────────────────────────────────────────────

interface CustomInputProps {
  onAdd: (ml: number) => void;
  onClose: () => void;
  label: string;
  addLabel: string;
}

function CustomAmountInput({ onAdd, onClose, label, addLabel }: CustomInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const ml = parseInt(value);
    if (ml > 0 && ml <= 5000) {
      onAdd(ml);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-2 mt-2">
        <input
          type="number"
          min="1"
          max="5000"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={label}
          className="flex-1 px-2 py-1.5 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!value || parseInt(value) <= 0}
          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {addLabel}
        </button>
        <button
          onClick={onClose}
          className="px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          &times;
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Widget ─────────────────────────────────────────────────────────

export function WaterWidget() {
  const { t } = useTranslation();
  const water = useWaterIntake();
  const [rippleKey, setRippleKey] = useState(0);
  const [showCustom, setShowCustom] = useState(false);

  const handleAdd = useCallback(
    (ml: number) => {
      water.addWater(ml);
      setRippleKey((k) => k + 1);
    },
    [water]
  );

  const handleUndo = useCallback(() => {
    water.removeLastWater();
  }, [water]);

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm relative overflow-hidden">
      {/* Ripple overlay */}
      <WaterRipple trigger={rippleKey} size={120} />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Droplets className="h-4 w-4 text-blue-500" />
          <p className="text-xs text-gray-500 font-medium">{t.water.title}</p>
        </div>
        {water.entries.length > 0 && (
          <button
            onClick={handleUndo}
            disabled={water.isRemoving}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-40"
            title={t.water.undo}
          >
            <Undo2 className="h-3 w-3" />
            {t.water.undo}
          </button>
        )}
      </div>

      {/* Center section: Ring + Total */}
      <div className="flex items-center gap-4">
        {/* Progress Ring with tappable droplet */}
        <div className="relative flex-shrink-0">
          <ProgressRing percentage={water.percentage} size={72} strokeWidth={6} />
          <button
            onClick={() => handleAdd(250)}
            className="absolute inset-0 flex flex-col items-center justify-center group"
            title={t.water.addGlass}
          >
            <Droplets className="h-5 w-5 text-blue-500 group-hover:text-blue-600 group-active:scale-110 transition-all" />
            <span className="text-[9px] text-blue-400 font-medium mt-0.5">
              {water.percentage}%
            </span>
          </button>
        </div>

        {/* Total and goal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <motion.span
              key={water.totalMl}
              initial={{ scale: 1.2, color: '#3b82f6' }}
              animate={{ scale: 1, color: '#1f2937' }}
              transition={{ duration: 0.3 }}
              className="text-2xl font-bold"
            >
              {water.totalMl}
            </motion.span>
            <span className="text-sm text-gray-400">/ {water.goalMl} {t.water.ml}</span>
          </div>

          {/* Status message */}
          <p className="text-[10px] text-gray-400 mt-0.5">
            {water.goalReached ? (
              <span className="text-blue-500 font-medium">{t.water.goalReached}</span>
            ) : (
              `${water.remainingMl} ${t.water.ml} ${t.water.remaining}`
            )}
          </p>

          {/* Entry count */}
          {water.entries.length > 0 && (
            <p className="text-[9px] text-gray-300 mt-0.5">
              {water.entries.length} {t.water.glasses}
            </p>
          )}
        </div>
      </div>

      {/* Quick-add buttons */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => handleAdd(250)}
          disabled={water.isAdding}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 active:bg-blue-200 transition-colors disabled:opacity-50"
        >
          <GlassWater className="h-3.5 w-3.5" />
          {t.water.addGlass}
        </button>
        <button
          onClick={() => handleAdd(500)}
          disabled={water.isAdding}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 active:bg-blue-200 transition-colors disabled:opacity-50"
        >
          <Droplets className="h-3.5 w-3.5" />
          {t.water.addBottle}
        </button>
        <button
          onClick={() => setShowCustom(!showCustom)}
          className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 rounded-lg hover:bg-blue-50 hover:text-blue-500 transition-colors"
          title={t.water.custom}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Custom amount input */}
      <AnimatePresence>
        {showCustom && (
          <CustomAmountInput
            onAdd={handleAdd}
            onClose={() => setShowCustom(false)}
            label={t.water.customPlaceholder}
            addLabel={t.common.add}
          />
        )}
      </AnimatePresence>

      {/* Animated fill bar at bottom */}
      <div className="mt-3 bg-blue-50 rounded-full h-1.5 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-sky-400 to-blue-500 rounded-full h-1.5"
          initial={{ width: '0%' }}
          animate={{ width: `${water.percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}
