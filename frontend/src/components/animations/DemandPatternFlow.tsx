'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionTemplate } from 'motion/react';
import { Activity, Sunrise, Sun, Sunset } from 'lucide-react';
import { SectionHeading } from '@/components/animations/SectionHeading';

/**
 * Skiper19-inspired scroll-linked SVG path drawing.
 * scrollYProgress (section-relative) → spring smoothing → pathLength 0→1
 * bound to motion.path's dash system. The stroke draws while scrolling
 * through the section — it does not animate on page load.
 */
export const DemandPatternFlow: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);

  // Section-relative progress: 0 when the section top reaches the viewport
  // top, 1 when the section bottom reaches the viewport bottom.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 25,
    restDelta: 0.001,
  });

  // SVG stroke draws from 0→1 across 8%–88% of the section scroll range
  const pathLength = useTransform(smoothProgress, [0.05, 0.88], [0, 1]);

  // Glow strength follows the drawn fraction
  const glowOpacity = useTransform(pathLength, [0, 1], [0.35, 1]);
  const glow = useMotionTemplate`drop-shadow(0 0 12px rgba(194, 248, 79, ${glowOpacity}))`;

  // Card reveals tied to scroll stages
  const card1Opacity = useTransform(smoothProgress, [0.15, 0.28], [0, 1]);
  const card1Y = useTransform(smoothProgress, [0.15, 0.28], [20, 0]);
  const card2Opacity = useTransform(smoothProgress, [0.42, 0.55], [0, 1]);
  const card2Y = useTransform(smoothProgress, [0.42, 0.55], [20, 0]);
  const card3Opacity = useTransform(smoothProgress, [0.68, 0.80], [0, 1]);
  const card3Y = useTransform(smoothProgress, [0.68, 0.80], [20, 0]);

  // Leading dot rides the path via CSS offset-path, driven by the same progress
  const dotDistance = useTransform(pathLength, [0, 1], ['0%', '100%']);

  // 24h diurnal curve: low night → 08:00 rush → midday dip → 17:00 peak → taper
  const svgPath =
    'M 20 235 C 80 242, 130 250, 185 255 C 240 260, 295 195, 345 88 C 375 35, 420 128, 480 155 C 545 175, 600 162, 650 142 C 700 118, 732 32, 795 28 C 855 24, 892 88, 933 158 C 960 208, 978 228, 990 235';

  return (
    <section
      ref={containerRef}
      className="relative bg-[var(--background)] border-y border-[var(--border)]"
      style={{ minHeight: '220vh' }}
    >
      {/* Sticky viewport — holds the scene while the section scrolls through */}
      <div className="sticky top-0 h-screen flex flex-col justify-between py-8 sm:py-12 px-4 sm:px-8 max-w-7xl mx-auto z-10 overflow-hidden">
        {/* Section header */}
        <SectionHeading
          className="max-w-3xl mx-auto"
          eyebrow="CHRONOLOGICAL BEHAVIORAL WAVE"
          icon={<Activity className="w-3.5 h-3.5 text-[var(--electric-lime-dark)]" />}
          title="Demand follows patterns."
          titleClassName="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--foreground)]"
          description="From dawn commuter flows to twilight surges, urban transit follows mathematical rhythms. Scroll to trace empirical hourly velocity across 17,379 observations."
        />

        {/* SVG drawing canvas */}
        <div className="relative w-full flex-1 flex items-center py-2 min-h-0">
          <svg
            viewBox="0 0 1010 290"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
            style={{ overflow: 'visible' }}
            preserveAspectRatio="xMidYMid meet"
            aria-label="Hourly demand curve drawing progressively as you scroll"
          >
            {/* Soft guide grid */}
            <line x1="20" y1="260" x2="990" y2="260" className="stroke-[var(--border)]" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="20" y1="145" x2="990" y2="145" className="stroke-[var(--border)]" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="20" y1="32" x2="990" y2="32" className="stroke-[var(--border)]" strokeWidth="1" strokeDasharray="4 4" />

            {/* Inactive ghost track */}
            <path d={svgPath} className="stroke-[var(--border-strong)]" strokeWidth="4" strokeLinecap="round" fill="none" />

            {/* Progressive lime stroke — draws with scroll */}
            <motion.path
              d={svgPath}
              stroke="var(--chart-accent)"
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
              pathLength={pathLength}
              style={{ filter: glow }}
            />

            {/* Leading dot riding the draw point (visible only while drawing) */}
            <motion.circle
              r="7"
              fill="var(--chart-accent)"
              style={{
                opacity: pathLength,
                offsetPath: `path('${svgPath}')`,
                offsetDistance: dotDistance,
                offsetRotate: '0deg',
              }}
            />

            {/* Time labels — themed via CSS so they stay readable in both themes */}
            <text x="14" y="278" fontSize="11" fontFamily="monospace" className="fill-[var(--muted)]">00:00</text>
            <text x="14" y="289" fontSize="10" fontFamily="monospace" className="fill-[var(--muted)]">Base: 54</text>

            <text x="300" y="22" fontSize="12" fontWeight="bold" fontFamily="monospace" className="fill-[var(--foreground)]">08:00</text>
            <text x="300" y="36" fontSize="10" fontFamily="monospace" className="fill-[var(--muted)]">Rush: 363/hr</text>

            <text x="490" y="134" fontSize="11" fontFamily="monospace" className="fill-[var(--muted)]">14:00</text>
            <text x="490" y="146" fontSize="10" fontFamily="monospace" className="fill-[var(--muted)]">Mid: 221/hr</text>

            <text x="756" y="17" fontSize="12" fontWeight="bold" fontFamily="monospace" className="fill-[var(--foreground)]">17:00</text>
            <text x="756" y="30" fontSize="10" fontFamily="monospace" className="fill-[var(--muted)]">Peak: 525/hr</text>

            <text x="910" y="278" fontSize="11" fontFamily="monospace" className="fill-[var(--muted)]">23:00</text>
            <text x="910" y="289" fontSize="10" fontFamily="monospace" className="fill-[var(--muted)]">Taper: 88</text>
          </svg>
        </div>

        {/* Staged insight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full">
          {/* Phase 01 — Morning Rush */}
          <motion.div
            style={{ opacity: card1Opacity, y: card1Y }}
            className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold uppercase text-[var(--muted)] flex items-center gap-1.5">
                <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                Phase 01 · 08:00 AM
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--surface-alt)] text-[10px] font-mono font-bold text-[var(--foreground)]">
                +410% Surge
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--foreground)] tracking-tight">
                363.2 <span className="text-xs font-normal text-[var(--muted)] font-sans">avg rentals/hr</span>
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-1 leading-snug">
                Suburban ingress towards central commercial corridors. Residential docks require overnight pre-fill.
              </p>
            </div>
          </motion.div>

          {/* Phase 02 — Midday Plateau */}
          <motion.div
            style={{ opacity: card2Opacity, y: card2Y }}
            className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold uppercase text-[var(--muted)] flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                Phase 02 · 02:00 PM
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--surface-alt)] text-[10px] font-mono font-bold text-[var(--foreground)]">
                Thermal Optimum
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--foreground)] tracking-tight">
                221.4 <span className="text-xs font-normal text-[var(--muted)] font-sans">avg rentals/hr</span>
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-1 leading-snug">
                Balanced inter-district and recreational circulation. Velocity correlates strongly with temperature 20°C–28°C.
              </p>
            </div>
          </motion.div>

          {/* Phase 03 — Twilight Peak */}
          <motion.div
            style={{ opacity: card3Opacity, y: card3Y }}
            className="p-4 sm:p-5 rounded-2xl bg-[var(--surface-card)] backdrop-blur-md text-[var(--foreground)] border border-[var(--border)] shadow-md flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold uppercase text-[var(--electric-lime-dark)] flex items-center gap-1.5">
                <Sunset className="w-3.5 h-3.5 text-[var(--electric-lime-dark)]" />
                Phase 03 · 05:00 PM
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#C2F84F] text-[#121214] text-[10px] font-mono font-bold">
                Peak Velocity
              </span>
            </div>
            <div className="mt-3">
              <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--foreground)] tracking-tight">
                525.6 <span className="text-xs font-normal text-[var(--muted)] font-sans">avg (856 peak)</span>
              </div>
              <p className="text-[11px] text-[var(--muted-strong)] mt-1 leading-snug">
                Maximum commercial system stress. Dispatch algorithms deploy rebalancing vans 45 minutes prior.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <div className="text-center pt-2">
          <span className="text-[11px] font-mono text-[var(--muted)]">
            Scroll to step through dynamic demand intelligence ↓
          </span>
        </div>
      </div>
    </section>
  );
};
