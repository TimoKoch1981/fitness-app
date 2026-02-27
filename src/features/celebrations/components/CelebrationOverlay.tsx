/**
 * CelebrationOverlay — Confetti + Toast animation for achievements.
 * Levels: 'mega' (full confetti), 'big' (confetti + toast), 'medium' (toast + pulse), 'small' (toast only)
 */
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Target, TrendingUp, Heart, Star } from 'lucide-react';

export type CelebrationLevel = 'mega' | 'big' | 'medium' | 'small';
export type CelebrationCategory = 'training' | 'nutrition' | 'body' | 'health' | 'streak' | 'general';

export interface CelebrationEvent {
  id: string;
  level: CelebrationLevel;
  category: CelebrationCategory;
  titleDe: string;
  titleEn: string;
  descriptionDe: string;
  descriptionEn: string;
}

interface CelebrationOverlayProps {
  event: CelebrationEvent | null;
  language: 'de' | 'en';
  onDismiss: () => void;
}

const CATEGORY_ICONS: Record<CelebrationCategory, typeof Trophy> = {
  training: Trophy,
  nutrition: Target,
  body: TrendingUp,
  health: Heart,
  streak: Flame,
  general: Star,
};

const CATEGORY_COLORS: Record<CelebrationCategory, string> = {
  training: 'from-amber-400 to-orange-500',
  nutrition: 'from-emerald-400 to-teal-500',
  body: 'from-blue-400 to-indigo-500',
  health: 'from-rose-400 to-pink-500',
  streak: 'from-orange-400 to-red-500',
  general: 'from-purple-400 to-violet-500',
};

// Simple confetti particle
function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 6 + Math.random() * 8;
  const rotation = Math.random() * 360;

  return (
    <motion.div
      className="absolute rounded-sm pointer-events-none"
      style={{
        width: size,
        height: size * 0.6,
        backgroundColor: color,
        left: `${x}%`,
        top: -20,
      }}
      initial={{ y: -20, rotate: 0, opacity: 1 }}
      animate={{
        y: [0, window.innerHeight + 50],
        rotate: [rotation, rotation + 720],
        x: [0, (Math.random() - 0.5) * 200],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 2.5 + Math.random(),
        delay,
        ease: 'easeIn',
      }}
    />
  );
}

export function CelebrationOverlay({ event, language, onDismiss }: CelebrationOverlayProps) {
  const [confettiPieces, setConfettiPieces] = useState<Array<{ id: number; delay: number; x: number }>>([]);

  const createConfetti = useCallback((count: number) => {
    const pieces = Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: Math.random() * 0.8,
      x: Math.random() * 100,
    }));
    setConfettiPieces(pieces);
  }, []);

  useEffect(() => {
    if (!event) {
      setConfettiPieces([]);
      return;
    }

    // Create confetti based on level
    if (event.level === 'mega') createConfetti(60);
    else if (event.level === 'big') createConfetti(30);
    else setConfettiPieces([]);

    // Auto-dismiss
    const timer = setTimeout(onDismiss, event.level === 'mega' ? 5000 : event.level === 'big' ? 4000 : 3000);
    return () => clearTimeout(timer);
  }, [event, createConfetti, onDismiss]);

  const Icon = event ? CATEGORY_ICONS[event.category] : Star;
  const gradient = event ? CATEGORY_COLORS[event.category] : '';
  const title = event ? (language === 'de' ? event.titleDe : event.titleEn) : '';
  const description = event ? (language === 'de' ? event.descriptionDe : event.descriptionEn) : '';

  return (
    <AnimatePresence>
      {event && (
        <>
          {/* Confetti layer */}
          {confettiPieces.length > 0 && (
            <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
              {confettiPieces.map(p => (
                <ConfettiParticle key={p.id} delay={p.delay} x={p.x} />
              ))}
            </div>
          )}

          {/* Toast */}
          <motion.div
            className="fixed top-6 left-1/2 z-[201] w-[90%] max-w-sm pointer-events-auto"
            initial={{ x: '-50%', y: -100, opacity: 0, scale: 0.8 }}
            animate={{ x: '-50%', y: 0, opacity: 1, scale: 1 }}
            exit={{ x: '-50%', y: -100, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={onDismiss}
          >
            <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-4 shadow-2xl text-white`}>
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="bg-white/20 rounded-xl p-2.5"
                >
                  <Icon className="h-6 w-6" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <motion.p
                    className="font-bold text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {title}
                  </motion.p>
                  <motion.p
                    className="text-xs text-white/90 mt-0.5"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {description}
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
