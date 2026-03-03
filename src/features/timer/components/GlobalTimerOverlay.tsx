/**
 * GlobalTimerOverlay — Shows a floating timer bubble when a rest timer
 * is running and the user is not on the training page (or minimized it).
 * Click to expand into a mini RestTimerWidget overlay.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRestTimerContext } from '../context/RestTimerContext';
import { TimerBubble } from './TimerBubble';
import { RestTimerWidget } from './RestTimerWidget';

export function GlobalTimerOverlay() {
  const timer = useRestTimerContext();
  const [expanded, setExpanded] = useState(false);

  if (!timer.isRunning) return null;

  return (
    <AnimatePresence>
      {expanded ? (
        <motion.div
          key="expanded"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 right-4 z-50 w-64"
        >
          <RestTimerWidget onMinimize={() => setExpanded(false)} />
        </motion.div>
      ) : (
        <TimerBubble key="bubble" onExpand={() => setExpanded(true)} />
      )}
    </AnimatePresence>
  );
}
