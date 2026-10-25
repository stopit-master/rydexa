'use client';

import React, { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { checkHealth } from '@/lib/api';
import { Sun, Moon, Zap, ZapOff } from 'lucide-react';
import { setMotionOverride, useAppMotion, useMotionOverride } from '@/lib/motionPreference';

/** Subscribes to the <html class="dark"> flag without setState-in-effect. */
function useIsDark(): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
      window.addEventListener('rydexa-theme-change', onChange);
      return () => {
        observer.disconnect();
        window.removeEventListener('rydexa-theme-change', onChange);
      };
    },
    () => document.documentElement.classList.contains('dark'),
    () => null
  );
}

function ThemeToggle() {
  const isDark = useIsDark();

  const toggle = useCallback(() => {
    const root = document.documentElement;
    const next = root.classList.contains('dark') ? 'light' : 'dark';
    root.classList.add('theme-animating');
    root.classList.toggle('dark', next === 'dark');
    root.style.colorScheme = next;
    try {
      localStorage.setItem('rydexa-theme', next);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent('rydexa-theme-change'));
    window.setTimeout(() => root.classList.remove('theme-animating'), 380);
  }, []);

  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="relative w-9 h-9 rounded-full bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--border-strong)] active:scale-95 transition-all"
    >
      <span
        className="block transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          transform: isDark === null ? 'none' : isDark ? 'rotate(0deg) scale(1)' : 'rotate(-180deg) scale(1)',
        }}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-[var(--electric-lime-dark)]" />
        ) : (
          <Moon className="w-4 h-4 text-[var(--foreground)]" />
        )}
      </span>
    </button>
  );
}

/**
 * Effects toggle. It starts/stops the decorative layer as a whole:
 * backdrop canvas / spectral bands, globe loop, spring pointer follower and
 * CSS loops. The theme control is intentionally separate.
 */
function EffectsToggle() {
  const fullMotion = useAppMotion();
  const override = useMotionOverride();

  const toggle = useCallback(() => {
    // Turning effects off is explicit, so it works even on systems that do
    // not advertise a reduced-motion preference.
    setMotionOverride(fullMotion ? 'off' : 'full');
  }, [fullMotion]);

  const label = fullMotion ? 'Disable visual effects' : 'Enable visual effects';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Visual effects"
      aria-pressed={fullMotion}
      title={
        override === 'system'
          ? `${label} (currently following system preference)`
          : label
      }
      className="relative w-9 h-9 rounded-full bg-[var(--surface-alt)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--border-strong)] active:scale-95 transition-all"
    >
      {fullMotion ? (
        <Zap className="w-4 h-4 text-[var(--electric-lime-dark)]" />
      ) : (
        <ZapOff className="w-4 h-4 text-[var(--muted)]" />
      )}
    </button>
  );
}

export const Navbar: React.FC = () => {
  const [isLive, setIsLive] = useState<boolean | null>(null);
  const [modelName, setModelName] = useState<string>('Gradient Boosting');

  // Smooth scroll progress bar at top of screen
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    let isMounted = true;
    const verifyConnection = async () => {
      try {
        const health = await checkHealth();
        if (isMounted) {
          setIsLive(health.model_loaded);
          if (health.champion_model) {
            setModelName(health.champion_model);
          }
        }
      } catch {
        if (isMounted) setIsLive(false);
      }
    };

    verifyConnection();
    const interval = setInterval(verifyConnection, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-3 transition-all duration-300">
      {/* Scroll Progress Bar in #C2F84F */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-[#C2F84F] origin-left z-50 shadow-[0_0_8px_rgba(194,248,79,0.8)]"
        style={{ scaleX }}
      />

      <div className="max-w-7xl mx-auto nav-glass rounded-2xl px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Brand */}
        <a href="#" className="flex items-center gap-2.5 group min-w-0" aria-label="RYDEXA home">
          <span className="logo-mark relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--charcoal)] shadow-sm transition-transform duration-300 group-hover:scale-105">
            <span className="relative z-10 text-[#C2F84F] font-black text-sm tracking-wider">R</span>
          </span>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-base sm:text-lg tracking-tight text-[var(--foreground)] leading-tight">
              RYDEXA
            </span>
            <span className="text-[10px] tracking-widest text-[var(--muted)] uppercase font-mono hidden sm:inline">
              Demand Intelligence
            </span>
          </div>
        </a>

        {/* API status + controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Real Backend Status Indicator */}
          <div
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono border transition-all ${
              isLive === true
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : isLive === false
                ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                : 'bg-[var(--surface-alt)] text-[var(--muted)] border-[var(--border)]'
            }`}
            title={isLive ? `Backend operational: ${modelName}` : 'FastAPI inference server unreachable'}
          >
            <span
              className={`w-2 h-2 shrink-0 rounded-full ${
                isLive === true
                  ? 'bg-emerald-500 animate-pulse'
                  : isLive === false
                  ? 'bg-amber-500'
                  : 'bg-neutral-400'
              }`}
            />
            <span className="whitespace-nowrap hidden min-[360px]:inline">
              {isLive === true ? 'API LIVE' : isLive === false ? 'API OFFLINE' : 'CONNECTING'}
            </span>
            <span className="whitespace-nowrap min-[360px]:hidden">
              {isLive === true ? 'LIVE' : isLive === false ? 'OFF' : '…'}
            </span>
          </div>

          <EffectsToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
