'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Layers, Server, Database, Compass } from 'lucide-react';
import { SectionHeading } from '@/components/animations/SectionHeading';

const staggerGroup = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.08 } },
};

const staggerCard = {
  hidden: { opacity: 0, y: 26, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export const AboutSection: React.FC = () => {
  return (
    <motion.section
      id="about"
      initial={{ opacity: 0, y: 40, scale: 0.975 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto scroll-mt-20"
    >
      <SectionHeading
        className="mb-16"
        eyebrow="PROVENANCE & ARCHITECTURE"
        icon={<Compass className="w-3.5 h-3.5 text-[var(--electric-lime-dark)]" />}
        title="Engineered for Commercial Micro-Mobility"
        description="RYDEXA separates training pipelines from high-throughput inference services, laying the foundation for enterprise fleet orchestration."
      />

      {/* Architecture Cards with Motion Stagger */}
      <motion.div
        variants={staggerGroup}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Tier 1: ML Engine */}
        <motion.div variants={staggerCard} className="bg-[var(--surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border)] shadow-sm flex flex-col justify-between hover:border-[var(--border-strong)] hover:shadow-md hover:-translate-y-1 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-alt)] flex items-center justify-center text-[var(--foreground)] mb-6">
              <Database className="w-6 h-6 text-[var(--foreground)]" />
            </div>
            <span className="text-xs font-mono text-[var(--muted)] uppercase tracking-wider">
              Layer 01
            </span>
            <h3 className="text-xl font-bold text-[var(--foreground)] mt-1 mb-3">
              Model Training & Provenance
            </h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Trained on the peer-reviewed UCI Bike Sharing dataset (Capital Bikeshare). Built with Scikit-Learn Gradient Boosting, featuring chronological splitting to ensure zero temporal lookahead bias.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--border)] text-[11px] font-mono text-[var(--muted)]">
            Export format: <span className="text-[var(--foreground)] font-bold">Joblib artifact (model.joblib)</span>
          </div>
        </motion.div>

        {/* Tier 2: FastAPI Service */}
        <motion.div variants={staggerCard} className="bg-[var(--surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border)] shadow-sm flex flex-col justify-between hover:border-[var(--border-strong)] hover:shadow-md hover:-translate-y-1 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-alt)] flex items-center justify-center text-[var(--foreground)] mb-6">
              <Server className="w-6 h-6 text-[var(--foreground)]" />
            </div>
            <span className="text-xs font-mono text-[var(--muted)] uppercase tracking-wider">
              Layer 02
            </span>
            <h3 className="text-xl font-bold text-[var(--foreground)] mt-1 mb-3">
              FastAPI Inference Microservice
            </h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Asynchronous Python backend loading pre-fitted estimators into memory. Enforces Pydantic request validation, normalizes physical units (Celsius, km/h), and returns sub-30ms predictions.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--border)] text-[11px] font-mono text-[var(--muted)]">
            Endpoints: <span className="text-[var(--foreground)] font-bold">/api/predict, /api/health</span>
          </div>
        </motion.div>

        {/* Tier 3: Next.js Studio */}
        <motion.div variants={staggerCard} className="bg-[var(--surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border)] shadow-sm flex flex-col justify-between hover:border-[var(--border-strong)] hover:shadow-md hover:-translate-y-1 transition-all">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface-alt)] flex items-center justify-center text-[var(--foreground)] mb-6">
              <Layers className="w-6 h-6 text-[var(--foreground)]" />
            </div>
            <span className="text-xs font-mono text-[var(--muted)] uppercase tracking-wider">
              Layer 03
            </span>
            <h3 className="text-xl font-bold text-[var(--foreground)] mt-1 mb-3">
              Apple-Inspired Next.js Studio
            </h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Minimalist interface built with TypeScript, Tailwind CSS, Motion, and Three.js. Delivers accessible controls, responsive layouts, and zero simulated metrics.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--border)] text-[11px] font-mono text-[var(--muted)]">
            Stack: <span className="text-[var(--foreground)] font-bold">Next.js 16 + React 19 + Three.js</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Commercial Evolution Roadmap */}
      <div className="mt-12 bg-[var(--surface-alt)] text-[var(--foreground)] rounded-3xl p-8 sm:p-12 border border-[var(--border)] shadow-lg">
        <div className="max-w-3xl">
          <span className="text-xs font-mono text-[var(--electric-lime-dark)] tracking-wider uppercase">
            Commercial Roadmap
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1 mb-4">
            Evolving RYDEXA into an Enterprise Fleet OS
          </h3>
          <p className="text-xs sm:text-sm text-[var(--muted-strong)] leading-relaxed">
            The initial version establishes core demand forecasting from verified empirical telemetry. The architectural design enables modular expansion without restructuring:
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-[var(--muted-strong)]">
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[var(--electric-lime-dark)] font-mono text-sm font-bold mb-1">01. Dock Telemetry</div>
              <p className="text-[var(--muted)]">
                Integration with live GBFS (General Bikeshare Feed Specification) feeds for real-time station occupancy tracking.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[var(--electric-lime-dark)] font-mono text-sm font-bold mb-1">02. Fleet Rebalancing</div>
              <p className="text-[var(--muted)]">
                Automated dispatch algorithms optimizing van routes to move vehicles from surplus hubs to impending commute surges.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-[var(--electric-lime-dark)] font-mono text-sm font-bold mb-1">03. Weather Alert Hooks</div>
              <p className="text-[var(--muted)]">
                Proactive notifications for rapid battery swaps ahead of extreme heat or rain dampening windows.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
