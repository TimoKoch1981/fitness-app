/**
 * WaterRipple — Animated blue circle ripple effect.
 *
 * Triggers a water-drop ripple animation on each water add.
 * Blue circle expanding outward with fading opacity.
 * Uses framer-motion for smooth animation.
 */

import { motion, AnimatePresence } from 'framer-motion';

interface WaterRippleProps {
  /** Incrementing trigger key — change to fire a new ripple. */
  trigger: number;
  /** Size of the ripple in pixels. Default: 80. */
  size?: number;
}

export function WaterRipple({ trigger, size = 80 }: WaterRippleProps) {
  return (
    <AnimatePresence>
      {trigger > 0 && (
        <motion.div
          key={trigger}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
        >
          <motion.div
            className="rounded-full border-2 border-blue-400"
            initial={{ width: 0, height: 0, opacity: 0.8 }}
            animate={{ width: size, height: size, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
