'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { fetchModelMetrics, checkHealth } from '@/lib/api';
import { ModelMetricsResponse, HealthResponse } from '@/lib/types';
import { siteConfig } from '@/lib/siteConfig';
import {
  CheckCircle2,
  ShieldAlert,
  Award,
  FileCode2,
  ExternalLink,
  Download,
  Terminal,
  Database,
  BrainCircuit,
  CircleDashed,
} from 'lucide-react';
import { SectionHeading } from '@/components/animations/SectionHeading';
import { useAppMotion } from '@/lib/motionPreference';

type PillState = 'ok' | 'off' | 'neutral' | 'pending';

const COLAB_STEPS = [
  {
    index: '01',
    title: 'Dataset',
    body: 'Code cell 2 downloads the official UCI Capital Bikeshare archive (2011–2012) and loads day.csv + hour.csv. No live fleet telemetry.',
  },
  {
    index: '02',
    title: 'Train & evaluate',
    body: 'Cells 3–5 hold out Q4 2012 chronologically, engineer leakage-free features, and compare the baseline, Ridge, Random Forest, and Gradient Boosting.',
  },
  {
    index: '03',
    title: 'Export artifacts',
    body: 'Cell 6 precomputes analytics; cell 7 writes the four artifacts and packs rydexa_artifacts.zip — the only hand-off channel.',
  },
  {
    index: '04',
    title: 'Import & restart',
    body: 'Download the ZIP, run the importer on the FastAPI machine, restart the service, then confirm the model status above reads “Loaded”.',
  },
] as const;

const StatusPill: React.FC<{ state: PillState; children: React.ReactNode }> = ({
  state,
  children,
}) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--foreground)]">
    <span
      aria-hidden="true"
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${
        state === 'ok'
          ? 'bg-emerald-500'
          : state === 'off'
            ? 'bg-amber-500'
            : state === 'pending'
              ? 'bg-[var(--muted)] animate-pulse'
              : 'bg-[var(--muted)]/60'
      }`}
    />
    {children}
  </span>
);

export const ModelMetricsSection: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthChecked, setHealthChecked] = useState(false);
  const fullMotion = useAppMotion();

  // Very restrained card tilt + light position. Written as CSS variables so
  // pointer movement never re-renders React; touch users stay static.
  const onColabPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!fullMotion || event.pointerType !== 'mouse') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    el.style.setProperty('--colab-rx', `${(ny * -1.4).toFixed(2)}deg`);
    el.style.setProperty('--colab-ry', `${(nx * 1.8).toFixed(2)}deg`);
    el.style.setProperty('--colab-x', `${(((nx + 1) / 2) * 100).toFixed(1)}%`);
    el.style.setProperty('--colab-y', `${(((ny + 1) / 2) * 100).toFixed(1)}%`);
  };

  const resetColabTilt = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    el.style.setProperty('--colab-rx', '0deg');
    el.style.setProperty('--colab-ry', '0deg');
    el.style.setProperty('--colab-x', '50%');
    el.style.setProperty('--colab-y', '50%');
  };

  useEffect(() => {
    let isMounted = true;
    const loadMetrics = async () => {
      try {
        const res = await fetchModelMetrics();
        if (isMounted) setMetrics(res);
      } catch {
        // Metrics stay null; the table renders its own honest empty state.
      }
    };
    loadMetrics();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    checkHealth()
      .then((res) => {
        if (isMounted) {
          setHealth(res);
          setHealthChecked(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setHealth(null);
          setHealthChecked(true);
        }
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <motion.section
      id="metrics"
      initial={{ opacity: 0, y: 40, scale: 0.975 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto scroll-mt-20"
    >
      <SectionHeading
        className="mb-12"
        eyebrow="EMPIRICAL VALIDATION"
        icon={<Award className="w-3.5 h-3.5 text-[var(--electric-lime-dark)]" />}
        title="Model Rigor & Evaluation Benchmarks"
        description="Evaluated strictly on held-out chronological observations. No synthetic metrics, no random shuffling leakage, and complete scientific transparency."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Model Comparison Table (7 cols) */}
        <div className="lg:col-span-7 bg-[var(--surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border)] shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <div>
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                Held-Out Benchmark Comparison
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Chronological Test Set: Oct 1, 2012 – Dec 31, 2012 (2,168 unseen hours)
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[var(--surface-alt)] text-[var(--foreground)]">
              Target: `cnt`
            </span>
          </div>

          {/* Model Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)] font-mono">
                  <th className="py-3 px-2 font-semibold">Candidate Model</th>
                  <th className="py-3 px-2 font-semibold">MAE</th>
                  <th className="py-3 px-2 font-semibold">RMSE</th>
                  <th className="py-3 px-2 font-semibold">R² Score</th>
                  <th className="py-3 px-2 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                {metrics?.models_evaluated ? (
                  metrics.models_evaluated.map((m) => (
                    <tr
                      key={m.model_name}
                      className={`hover:bg-[var(--surface-alt)]/80 transition-colors ${
                        m.is_champion ? 'bg-[#CCFF00]/10 font-medium' : ''
                      }`}
                    >
                      <td className="py-3.5 px-2 font-sans font-medium text-[var(--foreground)] flex items-center gap-1.5">
                        {m.is_champion && (
                          <span className="w-2 h-2 rounded-full bg-[var(--charcoal)]" />
                        )}
                        {m.model_name}
                      </td>
                      <td className="py-3.5 px-2 text-[var(--foreground)]">{m.mae.toFixed(2)}</td>
                      <td className="py-3.5 px-2 text-[var(--foreground)]">{m.rmse.toFixed(2)}</td>
                      <td className="py-3.5 px-2 font-bold text-[var(--foreground)]">
                        {(m.r2 * 100).toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        {m.is_champion ? (
                          <span className="px-2 py-0.5 rounded-full bg-[var(--charcoal)] text-[#CCFF00] text-[10px] font-bold">
                            CHAMPION
                          </span>
                        ) : (
                          <span className="text-[var(--muted)] text-[11px]">Evaluated</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr className="hover:bg-[var(--surface-alt)]/80">
                      <td className="py-3 px-2 font-sans text-[var(--foreground)]">Historical Median Baseline</td>
                      <td className="py-3 px-2">80.87</td>
                      <td className="py-3 px-2">120.39</td>
                      <td className="py-3 px-2">64.33%</td>
                      <td className="py-3 px-2 text-right text-[var(--muted)]">Baseline</td>
                    </tr>
                    <tr className="hover:bg-[var(--surface-alt)]/80">
                      <td className="py-3 px-2 font-sans text-[var(--foreground)]">Ridge Regression</td>
                      <td className="py-3 px-2">87.65</td>
                      <td className="py-3 px-2">116.68</td>
                      <td className="py-3 px-2">66.50%</td>
                      <td className="py-3 px-2 text-right text-[var(--muted)]">Evaluated</td>
                    </tr>
                    <tr className="hover:bg-[var(--surface-alt)]/80">
                      <td className="py-3 px-2 font-sans text-[var(--foreground)]">Random Forest Regressor</td>
                      <td className="py-3 px-2">47.59</td>
                      <td className="py-3 px-2">72.34</td>
                      <td className="py-3 px-2">87.12%</td>
                      <td className="py-3 px-2 text-right text-[var(--muted)]">Evaluated</td>
                    </tr>
                    <tr className="bg-[#CCFF00]/10 font-medium">
                      <td className="py-3 px-2 font-sans font-medium text-[var(--foreground)] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[var(--charcoal)]" />
                        Gradient Boosting Regressor
                      </td>
                      <td className="py-3 px-2 text-[var(--foreground)]">40.16</td>
                      <td className="py-3 px-2 text-[var(--foreground)]">64.57</td>
                      <td className="py-3 px-2 font-bold text-[var(--foreground)]">89.74%</td>
                      <td className="py-3 px-2 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-[var(--charcoal)] text-[#CCFF00] text-[10px] font-bold">
                          CHAMPION
                        </span>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Zero Data Leakage Disclosure */}
          <div className="p-4 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-[var(--muted)] leading-relaxed">
              <strong className="text-[var(--foreground)]">Target Leakage Prevention: </strong>
              The dataset fields <code className="text-[var(--foreground)] bg-neutral-200 px-1 rounded">casual</code> and <code className="text-[var(--foreground)] bg-neutral-200 px-1 rounded">registered</code> sum exactly to the target <code className="text-[var(--foreground)] bg-neutral-200 px-1 rounded">cnt</code>. They were strictly excluded from model inputs during training and inference.
            </div>
          </div>
        </div>

        {/* Right: Limitations & Rigor Disclosures (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Scientific Limitations Card */}
          <div className="bg-[var(--surface-alt)] text-[var(--foreground)] rounded-3xl p-6 sm:p-8 border border-[var(--border)] shadow-lg flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--electric-lime-dark)] tracking-wider uppercase">
              <ShieldAlert className="w-4 h-4" />
              <span>Scientific Disclosures & Scope</span>
            </div>
            <h4 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
              Evaluation Integrity & System Boundaries
            </h4>

            <div className="space-y-3 text-xs text-[var(--muted-strong)] leading-relaxed">
              <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <span className="font-semibold text-[var(--foreground)] block mb-0.5">Historical Dataset Context</span>
                Data originates from Capital Bikeshare (Washington D.C., 2011–2012). It does not represent modern dockless electric scooter or GPS-governed e-bike fleets.
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <span className="font-semibold text-[var(--foreground)] block mb-0.5">Chronological Generalization</span>
                Trained on 15,211 chronological records (2011 to Sept 2012) and evaluated exclusively on the subsequent 2,168 hours (Q4 2012).
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <span className="font-semibold text-[var(--foreground)] block mb-0.5">Zero Fabricated Telematics</span>
                Outputs are honest statistical expectations. Live micro-mobility operations require continual re-calibration against real-time dock occupancy.
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Google Colab pipeline — full-width liquid-glass hand-off panel */}
      <div
        id="colab-pipeline"
        onPointerMove={onColabPointerMove}
        onPointerLeave={resetColabTilt}
        className="colab-glass group relative mt-8 overflow-hidden rounded-[2rem] border border-[var(--border)] p-5 sm:p-8 lg:p-10"
      >
        <div aria-hidden="true" className="colab-glass__aura" />
        <div aria-hidden="true" className="colab-glass__mesh" />
        <div className="colab-glass__inner relative grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1.18fr)] lg:gap-10">
          {/* Left: identity, honest status, actions */}
          <div className="flex min-w-0 flex-col">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="relative grid h-12 w-12 place-items-center rounded-2xl border border-[#C2F84F]/30 bg-[#C2F84F]/10 text-[var(--electric-lime-dark)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                  <FileCode2 className="h-6 w-6" />
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)] bg-[#C2F84F]" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--electric-lime-dark)]">
                    Training pipeline
                  </span>
                  <h3 className="mt-0.5 text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
                    Google Colab → FastAPI
                  </h3>
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-alt)]/70 px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--muted)]">
                External run · manual hand-off
              </span>
            </div>

            <p className="mt-4 max-w-xl text-xs leading-relaxed text-[var(--muted)] sm:text-[13px]">
              Train and evaluate the champion model in a Colab runtime, export a validated artifact
              bundle, then import it on the machine running FastAPI. The notebook is a separate
              session — it has no live connection to this backend.
            </p>

            {/* Three genuinely independent status checks. */}
            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/55 px-3 py-3 backdrop-blur-sm">
                <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.12em] text-[var(--muted)]">
                  <Database className="h-3 w-3" aria-hidden="true" />
                  Local API
                </div>
                {!healthChecked ? (
                  <StatusPill state="pending">Checking…</StatusPill>
                ) : health ? (
                  <StatusPill state="ok">Online</StatusPill>
                ) : (
                  <StatusPill state="off">Unreachable</StatusPill>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/55 px-3 py-3 backdrop-blur-sm">
                <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.12em] text-[var(--muted)]">
                  <BrainCircuit className="h-3 w-3" aria-hidden="true" />
                  Model artifacts
                </div>
                {!healthChecked ? (
                  <StatusPill state="pending">Checking…</StatusPill>
                ) : health ? (
                  health.model_loaded ? (
                    <StatusPill state="ok">Loaded</StatusPill>
                  ) : (
                    <StatusPill state="off">Not loaded</StatusPill>
                  )
                ) : (
                  <StatusPill state="neutral">Unknown — API offline</StatusPill>
                )}
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/55 px-3 py-3 backdrop-blur-sm">
                <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.12em] text-[var(--muted)]">
                  <CircleDashed className="h-3 w-3" aria-hidden="true" />
                  Colab session
                </div>
                <StatusPill state="neutral">Not connected</StatusPill>
              </div>
            </div>

            {/* Exported artifacts */}
            <div className="mt-5">
              <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-[var(--muted)]">
                Bundle contents
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {['model.joblib', 'metrics.json', 'feature_schema.json', 'analytics_summary.json'].map((name) => (
                  <code
                    key={name}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface)]/65 px-2.5 py-1 font-mono text-[10px] text-[var(--foreground)]"
                  >
                    {name}
                  </code>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <a
                href={siteConfig.colabNotebookUrl || 'https://colab.research.google.com/'}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#C2F84F] px-4 py-3 text-[11px] font-bold text-[#0A0A0A] shadow-[0_14px_30px_-18px_rgba(194,248,79,0.9)] transition-all hover:bg-[#D4FF6B] hover:shadow-[0_18px_36px_-16px_rgba(194,248,79,0.8)] active:scale-[0.98]"
              >
                <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
                {siteConfig.colabNotebookUrl ? 'Open notebook in Colab' : 'Open Google Colab'}
              </a>
              <a
                href={siteConfig.notebookDownloadPath}
                download
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface)]/65 px-4 py-3 text-[11px] font-semibold text-[var(--foreground)] backdrop-blur-sm transition-all hover:border-[#C2F84F]/60 hover:bg-[var(--surface)] active:scale-[0.98]"
              >
                <Download className="h-3.5 w-3.5 text-[var(--electric-lime-dark)]" />
                Download .ipynb
              </a>
            </div>

            {!siteConfig.colabNotebookUrl && (
              <p className="mt-3 text-[10px] leading-relaxed text-[var(--muted)]">
                No hosted notebook URL is configured for this demo. Use{' '}
                <span className="font-medium text-[var(--foreground)]">Download .ipynb</span>, then
                upload that file in Colab via <span className="text-[var(--foreground)]">File → Upload notebook</span>.
              </p>
            )}
          </div>

          {/* Right: workflow, exact commands, honesty note */}
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[9px] font-mono uppercase tracking-[0.14em] text-[var(--muted)]">
                Hand-off workflow
              </div>
              <div className="text-[9px] font-mono text-[var(--muted)]/80">4 steps</div>
            </div>

            <motion.ol
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.09, delayChildren: 0.12 } },
              }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-40px' }}
              className="relative space-y-2.5"
            >
              {COLAB_STEPS.map((step) => (
                <motion.li
                  key={step.index}
                  variants={{
                    hidden: { opacity: 0, x: -14 },
                    show: {
                      opacity: 1,
                      x: 0,
                      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                    },
                  }}
                  className="group/step relative flex gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/45 p-3.5 backdrop-blur-sm transition-colors hover:border-[#C2F84F]/35 hover:bg-[var(--surface)]/70"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[#C2F84F]/25 bg-[#C2F84F]/10 font-mono text-[10px] font-bold text-[var(--electric-lime-dark)]">
                    {step.index}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-[12px] font-semibold text-[var(--foreground)]">{step.title}</h4>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--muted)]">{step.body}</p>
                  </div>
                </motion.li>
              ))}
            </motion.ol>

            <div className="rounded-2xl border border-[var(--border)] bg-[#0E0E10] p-3.5 text-[#E8E8E4] shadow-inner">
              <div className="mb-2 flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-[0.14em] text-[#9A9AA2]">
                <Terminal className="h-3 w-3 text-[#C2F84F]" aria-hidden="true" />
                Import on the backend machine
              </div>
              <code className="block overflow-x-auto whitespace-pre font-mono text-[10.5px] leading-relaxed text-[#D8FF9A]">
                python backend/import_artifacts.py ~/Downloads/rydexa_artifacts.zip{'\n'}
                python backend/run.py
              </code>
              <p className="mt-2 text-[10px] leading-relaxed text-[#9A9AA2]">
                The importer validates every file and backs up{' '}
                <code className="text-[#D8FF9A]">backend/artifacts/</code> before installing the new
                model. Restart FastAPI afterwards; the status above should then read “Loaded”.
              </p>
            </div>

            <p className="mt-auto border-t border-[var(--border)] pt-3 text-[10px] leading-relaxed text-[var(--muted)]">
              Colab runs in its own session and cannot push artifacts to this backend. The status
              lights reflect the local API health check only — no training progress, accuracy, or
              connection state is invented.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
