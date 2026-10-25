'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { ArrowDown, ArrowUpRight, Cpu, Database, Zap, ChevronRight } from 'lucide-react';
import { useAppMotion } from '@/lib/motionPreference';

const Hero3D = dynamic(() => import('./Hero3D').then((mod) => mod.Hero3D), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] sm:h-[440px] lg:h-[clamp(300px,40vh,400px)] xl:h-[clamp(340px,44vh,440px)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 rounded-full border border-[var(--border)] border-t-[#C2F84F] animate-spin" />
        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[var(--muted)]">
          Loading mobility globe
        </span>
      </div>
    </div>
  ),
});

export const HeroSection: React.FC = () => {
  const fullMotion = useAppMotion();

  // Pointer-driven tilt/parallax. Values are written as CSS custom properties
  // straight on the wrapper: no React state, no re-render, compositor-only.
  const onHeadlinePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    // Touch and reduced-motion users get a completely static headline.
    if (!fullMotion || event.pointerType !== 'mouse') return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    el.classList.add('is-tilting');
    el.style.setProperty('--hero-rx', `${(ny * -3.2).toFixed(2)}deg`);
    el.style.setProperty('--hero-ry', `${(nx * 4.6).toFixed(2)}deg`);
    el.style.setProperty('--hero-tx', `${(nx * 5).toFixed(2)}px`);
    el.style.setProperty('--hero-ty', `${(ny * 4).toFixed(2)}px`);
    el.style.setProperty('--hero-sheen', `${(((nx + 1) / 2) * 100).toFixed(1)}%`);
  };

  const resetHeadline = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    el.classList.remove('is-tilting');
    el.style.setProperty('--hero-rx', '0deg');
    el.style.setProperty('--hero-ry', '0deg');
    el.style.setProperty('--hero-tx', '0px');
    el.style.setProperty('--hero-ty', '0px');
    el.style.setProperty('--hero-sheen', '50%');
  };

  return (
    <section className="relative pt-32 sm:pt-36 pb-10 sm:pb-14 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
      {/* Precision top badge */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[var(--surface-card)] backdrop-blur-md border border-[var(--border)] text-[var(--electric-lime-dark)] text-[11px] sm:text-xs font-mono font-medium tracking-wide mb-6 sm:mb-8"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#C2F84F] shadow-[0_0_8px_rgba(194,248,79,0.9)]" />
        <span className="text-[var(--foreground)]">RYDEXA CORE 1.0</span>
        <span className="text-[var(--border-strong)]">|</span>
        <span className="text-[var(--muted)]">Empirical Demand Engine</span>
      </motion.div>

      {/* Headline â€” spring tilt + parallax, pointer only */}
      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.965, filter: 'blur(12px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.9, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        onPointerMove={onHeadlinePointerMove}
        onPointerLeave={resetHeadline}
        className="hero-headline-wrap relative z-10 w-full max-w-5xl mx-auto px-2 py-2 -my-2"
      >
        <h1 className="hero-headline text-[2.2rem] leading-[1.05] sm:text-5xl sm:leading-[1.06] lg:text-6xl font-bold tracking-tight text-[var(--foreground)] max-w-5xl mx-auto">
          Intelligent Demand Forecasting for{' '}
          <span className="hero-emphasis relative inline-block whitespace-nowrap">
            <span className="relative z-10 bg-gradient-to-r from-[var(--foreground)] via-[var(--muted-strong)] to-[var(--foreground)] bg-clip-text text-transparent">
              Urban Mobility
            </span>
            {/* Restrained lime sheen that tracks the pointer across the phrase */}
            <span aria-hidden="true" className="hero-emphasis-sheen pointer-events-none absolute inset-0 z-20" />
            <span
              aria-hidden="true"
              className="absolute -bottom-1 left-[6%] right-[6%] h-px bg-gradient-to-r from-transparent via-[#C2F84F]/90 to-transparent"
            />
            <span
              aria-hidden="true"
              className="absolute -bottom-2 left-[14%] right-[14%] h-2 bg-[#C2F84F]/25 blur-md"
            />
          </span>
        </h1>
      </motion.div>

      {/* 3D mobility globe â€” headline first, globe second */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full mt-6 sm:mt-4 lg:mt-2"
      >
        <Hero3D />
      </motion.div>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="mt-4 text-base sm:text-lg text-[var(--muted)] max-w-4xl mx-auto font-normal leading-relaxed"
      >
        Engineered for commercial bike-sharing fleets, micro-mobility operators, and municipal
        transit planners. Powered by a verified Gradient Boosting pipeline trained on 17,379
        chronological records.
      </motion.p>

      {/* Primary actions */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 z-10 w-full sm:w-auto"
      >
        <a href="#studio" className="btn-hero btn-hero--primary w-full sm:w-auto justify-center">
          <span className="btn-hero__label">Launch Prediction Studio</span>
          <span className="btn-hero__icon" aria-hidden="true">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </a>

        <a href="#analytics" className="btn-hero btn-hero--secondary w-full sm:w-auto justify-center">
          <span className="btn-hero__label">Explore Historical Data</span>
          <span className="btn-hero__icon btn-hero__icon--ghost" aria-hidden="true">
            <ChevronRight className="w-4 h-4" />
          </span>
        </a>
      </motion.div>

      {/* Supporting verified metrics */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 z-10 mt-8"
      >
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] backdrop-blur-md p-5 flex items-center gap-4 text-left hover:-translate-y-0.5 hover:border-[#C2F84F]/50 hover:bg-[var(--surface)] hover:shadow-[0_18px_36px_-28px_rgba(12,12,16,0.7)] transition-all group">
          <div className="w-11 h-11 rounded-xl bg-[var(--surface-alt)] flex items-center justify-center text-[var(--electric-lime-dark)] group-hover:bg-[#C2F84F]/12 transition-colors">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-[var(--foreground)] tracking-tight">17,379</div>
            <div className="text-xs text-[var(--muted)] font-medium">Verified Records (UCI)</div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] backdrop-blur-md p-5 flex items-center gap-4 text-left hover:-translate-y-0.5 hover:border-[#C2F84F]/50 hover:bg-[var(--surface)] hover:shadow-[0_18px_36px_-28px_rgba(12,12,16,0.7)] transition-all group">
          <div className="w-11 h-11 rounded-xl bg-[var(--surface-alt)] flex items-center justify-center text-[var(--electric-lime-dark)] group-hover:bg-[#C2F84F]/12 transition-colors">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-[var(--foreground)] tracking-tight">89.7% RÂ²</div>
            <div className="text-xs text-[var(--muted)] font-medium">Held-Out Test Accuracy</div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-card)] backdrop-blur-md p-5 flex items-center gap-4 text-left hover:-translate-y-0.5 hover:border-[#C2F84F]/50 hover:bg-[var(--surface)] hover:shadow-[0_18px_36px_-28px_rgba(12,12,16,0.7)] transition-all group">
          <div className="w-11 h-11 rounded-xl bg-[var(--surface-alt)] flex items-center justify-center text-[var(--electric-lime-dark)] group-hover:bg-[#C2F84F]/12 transition-colors">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-[var(--foreground)] tracking-tight">&lt; 30 ms</div>
            <div className="text-xs text-[var(--muted)] font-medium">FastAPI Local Latency</div>
          </div>
        </div>
      </motion.div>

      {/* Scroll cue */}
      <motion.a
        href="#patterns"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="group inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mt-8 z-10"
      >
        <span>Explore demand patterns</span>
        <ArrowDown className="w-3.5 h-3.5 text-[#9FD028] dark:text-[#C2F84F] transition-transform duration-300 group-hover:translate-y-0.5" />
      </motion.a>
    </section>
  );
};

