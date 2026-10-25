'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { isFullMotion } from '@/lib/motionPreference';

const TOTAL_STAIRS = 5;
const EASE_STAIRS: [number, number, number, number] = [0.76, 0, 0.24, 1];

const ENTER_MS = 1500;
const DONE_MS = 2850;
const HARD_LIMIT_MS = 3600;

/**
 * Skiper9-inspired staircase preloader.
 *
 * Entrance: five vertical panels rise bottom→top with a stagger.
 * Hold: RYDEXA brand + stepped progress.
 * Exit: panels lift away in reverse stagger while the brand fades.
 *
 * Lifecycle is driven by timers, not by the animation completing, so a
 * throttled/occluded tab can never leave the page permanently blocked.
 */
export const StairsPreloader: React.FC = () => {
  const pathname = usePathname();
  // Mounted once in the root layout, so this initial value decides whether the
  // document gets the full intro. Legal pages are meant to open instantly;
  // every later client navigation inherits the already-finished instance.
  const [enabled] = useState(() => pathname === '/');
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const mountedAt = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    setMounted(true);
    mountedAt.current = Date.now();

    // Reduced motion: no staircase travel, a brief static brand hold instead.
    const full = isFullMotion();
    const enterMs = full ? ENTER_MS : 300;
    const doneMs = full ? DONE_MS : 900;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const interval = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(interval);
          return 100;
        }
        return Math.min(100, prev + Math.floor(Math.random() * 16) + 10);
      });
    }, full ? 110 : 60);

    const exitTimer = window.setTimeout(() => setIsExiting(true), enterMs);
    const doneTimer = window.setTimeout(() => {
      document.body.style.overflow = originalOverflow;
      // Hand off to the page zoom-in exactly when the staircase has lifted.
      // The keyframe starts at 85% opacity, so no blank frame is shown.
      document.documentElement.classList.add('rydexa-revealed');
      setIsDone(true);
    }, doneMs);

    // Safety net: if the tab was backgrounded and timers were throttled,
    // finish immediately when it becomes visible again.
    const finishIfStale = () => {
      if (document.visibilityState === 'visible' && Date.now() - mountedAt.current > HARD_LIMIT_MS) {
        setIsExiting(true);
        document.documentElement.classList.add('rydexa-revealed');
        setIsDone(true);
        document.body.style.overflow = originalOverflow;
      }
    };
    document.addEventListener('visibilitychange', finishIfStale);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      document.removeEventListener('visibilitychange', finishIfStale);
      document.body.style.overflow = originalOverflow;
    };
  }, [enabled]);

  if (!enabled || !mounted || isDone) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] overflow-hidden"
      role="status"
      aria-live="polite"
      aria-busy={!isExiting}
    >
      {/* Staircase panels — rise in on mount, lift away on exit */}
      <div className="absolute inset-0 flex w-full h-full">
        {Array.from({ length: TOTAL_STAIRS }).map((_, index) => {
          const enterDelay = index * 0.09;
          const exitDelay = (TOTAL_STAIRS - 1 - index) * 0.09;
          return (
            <motion.div
              key={index}
              initial={isFullMotion() ? { y: '100%' } : false}
              animate={isExiting ? { y: '-100%' } : { y: '0%' }}
              transition={
                isExiting
                  ? { duration: 0.75, ease: EASE_STAIRS, delay: exitDelay }
                  : { duration: 0.6, ease: EASE_STAIRS, delay: enterDelay }
              }
              className="flex-1 h-full bg-[#0A0A0C] border-r border-white/[0.06] last:border-r-0 relative"
            >
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C2F84F]/50 to-transparent" />
            </motion.div>
          );
        })}
      </div>

      {/* Center brand + progress */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={isExiting ? { opacity: 0, y: -24, scale: 0.96 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: isExiting ? 0.35 : 0.55, ease: 'easeOut', delay: isExiting ? 0 : 0.5 }}
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 select-none z-10"
      >
        <div className="relative mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#141417] border border-white/10 flex items-center justify-center shadow-2xl relative z-10">
            <span className="text-[#C2F84F] font-black text-2xl tracking-wider">R</span>
          </div>
          <div className="absolute inset-0 bg-[#C2F84F]/20 rounded-2xl blur-xl" />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">RYDEXA</span>
          <span className="text-[10px] font-mono tracking-[0.25em] text-white/40 uppercase">
            Demand Intelligence Engine
          </span>
        </div>

        <div className="mt-8 flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STAIRS }).map((_, i) => {
            const active = progress >= (i + 1) * 20;
            return (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  active
                    ? 'w-8 bg-[#C2F84F] shadow-[0_0_8px_rgba(194,248,79,0.6)]'
                    : 'w-6 bg-white/10'
                }`}
              />
            );
          })}
        </div>

        <div className="mt-4 font-mono text-xs text-white/40">
          <span className="text-white font-semibold text-sm">{progress}%</span>
          <span className="text-white/35 ml-1.5">READY</span>
        </div>
      </motion.div>

      <div className="absolute bottom-8 left-0 right-0 text-center text-[9px] font-mono text-white/30 uppercase tracking-[0.22em] z-10">
        Empirical Micro-Mobility Architecture
      </div>
    </div>
  );
};
