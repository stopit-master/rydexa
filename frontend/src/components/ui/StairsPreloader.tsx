'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { isFullMotion } from '@/lib/motionPreference';

const TOTAL_STAIRS = 5;
const EASE_STAIRS: [number, number, number, number] = [0.76, 0, 0.24, 1];

const ENTER_MS = 1500;
const DONE_MS = 2850;
const HARD_LIMIT_MS = 4000;

export const StairsPreloader: React.FC = () => {
  const pathname = usePathname();

  const [enabled] = useState(() => pathname === '/');
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  const mountedAt = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    let finished = false;
    let interval: number | undefined;
    let exitTimer: number | undefined;
    let doneTimer: number | undefined;
    let hardLimitTimer: number | undefined;

    const originalOverflow = document.body.style.overflow;

    const finish = () => {
      if (finished) return;
      finished = true;

      if (interval !== undefined) window.clearInterval(interval);
      if (exitTimer !== undefined) window.clearTimeout(exitTimer);
      if (doneTimer !== undefined) window.clearTimeout(doneTimer);
      if (hardLimitTimer !== undefined) window.clearTimeout(hardLimitTimer);

      document.body.style.overflow = originalOverflow;
      document.documentElement.classList.add('rydexa-revealed');

      setProgress(100);
      setIsExiting(true);
      setIsDone(true);
    };

    const mountTimer = window.setTimeout(() => {
      mountedAt.current = Date.now();
      setMounted(true);

      const full = isFullMotion();
      const enterMs = full ? ENTER_MS : 300;
      const doneMs = full ? DONE_MS : 900;

      document.body.style.overflow = 'hidden';

      interval = window.setInterval(() => {
        setProgress((previous) => {
          if (previous >= 100) {
            if (interval !== undefined) window.clearInterval(interval);
            return 100;
          }

          return Math.min(
            100,
            previous + Math.floor(Math.random() * 16) + 10,
          );
        });
      }, full ? 110 : 60);

      exitTimer = window.setTimeout(() => {
        if (!finished) setIsExiting(true);
      }, enterMs);

      doneTimer = window.setTimeout(finish, doneMs);
      hardLimitTimer = window.setTimeout(finish, HARD_LIMIT_MS);
    }, 0);

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        mountedAt.current > 0 &&
        Date.now() - mountedAt.current >= HARD_LIMIT_MS
      ) {
        finish();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearTimeout(mountTimer);

      if (interval !== undefined) window.clearInterval(interval);
      if (exitTimer !== undefined) window.clearTimeout(exitTimer);
      if (doneTimer !== undefined) window.clearTimeout(doneTimer);
      if (hardLimitTimer !== undefined) window.clearTimeout(hardLimitTimer);

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange,
      );

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
      <div className="absolute inset-0 flex h-full w-full">
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
                  ? {
                      duration: 0.75,
                      ease: EASE_STAIRS,
                      delay: exitDelay,
                    }
                  : {
                      duration: 0.6,
                      ease: EASE_STAIRS,
                      delay: enterDelay,
                    }
              }
              className="relative h-full flex-1 border-r border-white/[0.06] bg-[#0A0A0C] last:border-r-0"
            >
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C2F84F]/50 to-transparent" />
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={
          isExiting
            ? { opacity: 0, y: -24, scale: 0.96 }
            : { opacity: 1, y: 0, scale: 1 }
        }
        transition={{
          duration: isExiting ? 0.35 : 0.55,
          ease: 'easeOut',
          delay: isExiting ? 0 : 0.5,
        }}
        className="absolute inset-0 z-10 flex select-none flex-col items-center justify-center px-4 text-center"
      >
        <div className="relative mb-6">
          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#141417] shadow-2xl">
            <span className="text-2xl font-black tracking-wider text-[#C2F84F]">
              R
            </span>
          </div>

          <div className="absolute inset-0 rounded-2xl bg-[#C2F84F]/20 blur-xl" />
        </div>

        <div className="flex flex-col items-center gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            RYDEXA
          </span>

          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
            Demand Intelligence Engine
          </span>
        </div>

        <div className="mt-8 flex items-center gap-1.5">
          {Array.from({ length: TOTAL_STAIRS }).map((_, index) => {
            const active = progress >= (index + 1) * 20;

            return (
              <div
                key={index}
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
          <span className="text-sm font-semibold text-white">
            {progress}%
          </span>
          <span className="ml-1.5 text-white/35">READY</span>
        </div>
      </motion.div>

      <div className="absolute bottom-8 left-0 right-0 z-10 text-center font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">
        Empirical Micro-Mobility Architecture
      </div>
    </div>
  );
};

