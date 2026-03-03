/**
 * TimerBubble — Small floating circular overlay when the rest timer is minimized.
 *
 * Features:
 * - Shows countdown in compact form
 * - Click to expand back (calls onExpand)
 * - Position: bottom-right, above navigation bar
 * - Draggable with framer-motion
 * - Color changes based on remaining time
 */

import { motion } from 'framer-motion';
import { useRestTimerContext } from '../context/RestTimerContext';

function formatCompact(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`;
  return `${s}s`;
}

function getBubbleColor(seconds: number): string {
  if (seconds <= 10) return 'bg-red-500';
  if (seconds <= 30) return 'bg-yellow-500';
  return 'bg-green-500';
}

interface TimerBubbleProps {
  onExpand: () => void;
}

export function TimerBubble({ onExpand }: TimerBubbleProps) {
  const timer = useRestTimerContext();

  if (!timer.isRunning) return null;

  return (
    <motion.button
      drag
      dragMomentum={false}
      dragElastic={0.1}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onExpand}
      className={`fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full ${getBubbleColor(timer.seconds)} text-white shadow-lg flex items-center justify-center cursor-pointer select-none`}
      style={{ touchAction: 'none' }}
      aria-label="Expand rest timer"
    >
      <motion.span
        key={timer.seconds}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="text-xs font-bold font-mono"
      >
        {formatCompact(timer.seconds)}
      </motion.span>
    </motion.button>
  );
}
