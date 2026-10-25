import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { HeroSection } from '@/components/hero/HeroSection';
import { DemandPatternFlow } from '@/components/animations/DemandPatternFlow';
import { PredictionStudio } from '@/components/studio/PredictionStudio';
import { AnalyticsSection } from '@/components/analytics/AnalyticsSection';
import { ModelMetricsSection } from '@/components/metrics/ModelMetricsSection';
import { AboutSection } from '@/components/about/AboutSection';
import { Footer } from '@/components/layout/Footer';
import { SpringMouseFollow } from '@/components/animations/SpringMouseFollow';
import { ThemeBackdrop } from '@/components/layout/ThemeBackdrop';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)] selection:bg-[#C2F84F] selection:text-[#121214]">
      {/* Theme-reactive ambient background (spectral bands / kinetic grid) */}
      <ThemeBackdrop />

      {/* Skiper61 spring pointer follower (viewport-fixed overlay) */}
      <SpringMouseFollow />

      {/* Floating Header */}
      <Navbar />

      {/* Main Content Flow */}
      <main className="relative z-10 flex flex-col page-enter">
        {/* 1. Hero: headline, then the 3D Earth globe, then verified metrics */}
        <div className="relative">
          <HeroSection />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[var(--background)]"
          />
        </div>

        {/* 2. Skiper19 SVG progressive scroll drawing ("Demand follows patterns.") */}
        <div id="patterns">
          <DemandPatternFlow />
        </div>

        {/* 3. Real-Time Demand Prediction Studio */}
        <PredictionStudio />

        {/* 4. Historical Demand Intelligence (Empirical UCI Aggregations) */}
        <AnalyticsSection />

        {/* 5. Model Rigor & Held-Out Benchmarks */}
        <ModelMetricsSection />

        {/* 6. Provenance, System Architecture & Commercial Roadmap */}
        <AboutSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
