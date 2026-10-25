'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { fetchAnalytics } from '@/lib/api';
import { AnalyticsSummary } from '@/lib/types';
import { BarChart3, AlertCircle } from 'lucide-react';
import { SectionHeading } from '@/components/animations/SectionHeading';

export const AnalyticsSection: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hourly' | 'weather' | 'season' | 'temp'>('hourly');
  const [hoveredHour, setHoveredHour] = useState<number | null>(17);

  useEffect(() => {
    let isMounted = true;
    const loadAnalytics = async () => {
      try {
        const summary = await fetchAnalytics();
        if (isMounted) {
          setData(summary);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unable to load dataset analytics.');
          setLoading(false);
        }
      }
    };
    loadAnalytics();
    return () => { isMounted = false; };
  }, []);

  const maxHourlyAvg = data
    ? Math.max(...data.hourly_pattern.map(p => Math.max(p.workingday_avg, p.non_workingday_avg)))
    : 530;

  const activeHourData = data?.hourly_pattern.find(p => p.hour === (hoveredHour ?? 17));

  return (
    <motion.section
      id="analytics"
      initial={{ opacity: 0, y: 40, scale: 0.975 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto scroll-mt-20"
    >
      <SectionHeading
        className="mb-12"
        eyebrow="EMPIRICAL BENCHMARKS"
        icon={<BarChart3 className="w-3.5 h-3.5 text-[var(--electric-lime-dark)]" />}
        title="Historical Demand Intelligence"
        description="Aggregations calculated directly from all 17,379 chronological observations of the Capital Bikeshare system."
      >
        {/* Tab switchers */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)]">
          <button
            onClick={() => setActiveTab('hourly')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'hourly'
                ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-xs'
                : 'text-[var(--muted-strong)] hover:text-[var(--foreground)]'
            }`}
          >
            24h Commute Dynamics
          </button>
          <button
            onClick={() => setActiveTab('weather')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'weather'
                ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-xs'
                : 'text-[var(--muted-strong)] hover:text-[var(--foreground)]'
            }`}
          >
            Weather Impact
          </button>
          <button
            onClick={() => setActiveTab('season')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'season'
                ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-xs'
                : 'text-[var(--muted-strong)] hover:text-[var(--foreground)]'
            }`}
          >
            Seasonal Distribution
          </button>
          <button
            onClick={() => setActiveTab('temp')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'temp'
                ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-xs'
                : 'text-[var(--muted-strong)] hover:text-[var(--foreground)]'
            }`}
          >
            Temperature Sensitivity
          </button>
        </div>
      </SectionHeading>

      {/* Analytics Content Area */}
      {loading ? (
        <div className="w-full h-80 frosted-glass rounded-3xl flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--border)] border-t-[#6F9410] dark:border-t-[#C2F84F] animate-spin" />
        </div>
      ) : error ? (
        <div className="w-full p-8 frosted-glass rounded-3xl border border-red-200 text-center flex flex-col items-center justify-center">
          <AlertCircle className="w-8 h-8 text-amber-600 mb-2" />
          <h4 className="text-sm font-semibold text-[var(--foreground)]">Analytics Unavailable</h4>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-md">{error}</p>
        </div>
      ) : data ? (
        <div className="bg-[var(--surface)] rounded-3xl p-6 sm:p-10 border border-[var(--border)] shadow-sm flex flex-col gap-8">
          {/* TAB 1: 24h Hourly Commute Dynamics */}
          {activeTab === 'hourly' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[var(--border)] gap-4">
                <div>
                  <h3 className="text-base font-bold text-[var(--foreground)]">
                    24-Hour Diurnal Demand Profile
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Working Days show twin commute peaks at 8 AM (363 avg) and 5 PM (525 avg). Non-working days form a gentle curve peaking at 2 PM.
                  </p>
                </div>
                {/* Active Hover Detail Pill */}
                {activeHourData && (
                  <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] text-[var(--foreground)] text-xs font-mono">
                    <span className="text-[var(--electric-lime-dark)] font-bold">{activeHourData.hour.toString().padStart(2, '0')}:00</span>
                    <span className="text-[var(--muted)]">|</span>
                    <span>Workday: <b className="text-[var(--foreground)]">{activeHourData.workingday_avg}</b>/hr</span>
                    <span className="text-[var(--muted)]">|</span>
                    <span>Weekend: <b className="text-[var(--foreground)]">{activeHourData.non_workingday_avg}</b>/hr</span>
                  </div>
                )}
              </div>

              {/* Responsive 24-Bar Interactive Visual Chart */}
              <div className="mt-8">
                <div className="h-64 sm:h-72 w-full flex items-end justify-between gap-1 sm:gap-2 px-2 border-b border-[var(--border)] pb-2">
                  {data.hourly_pattern.map((pt) => {
                    const wHeight = Math.round((pt.workingday_avg / maxHourlyAvg) * 100);
                    const nwHeight = Math.round((pt.non_workingday_avg / maxHourlyAvg) * 100);
                    const isSelected = hoveredHour === pt.hour;

                    return (
                      <div
                        key={pt.hour}
                        onMouseEnter={() => setHoveredHour(pt.hour)}
                        className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group relative"
                      >
                        {/* Dual bars side-by-side with motion */}
                        <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1.5 h-full">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${wHeight}%` }}
                            transition={{ duration: 0.6, delay: pt.hour * 0.02, ease: 'easeOut' }}
                            className={`w-full max-w-[12px] rounded-t-sm transition-all duration-200 ${
                              isSelected ? 'bg-[var(--chart-primary)] scale-y-105' : 'bg-[var(--chart-primary)] opacity-85 group-hover:opacity-100'
                            }`}
                          />
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${nwHeight}%` }}
                            transition={{ duration: 0.6, delay: pt.hour * 0.02, ease: 'easeOut' }}
                            className={`w-full max-w-[12px] rounded-t-sm transition-all duration-200 border border-[var(--border)] ${
                              isSelected ? 'bg-[var(--chart-accent-strong)] scale-y-105 shadow-[0_0_8px_rgba(194,248,79,0.4)]' : 'bg-[var(--chart-accent)] opacity-85 group-hover:opacity-100'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Hour timeline labels */}
                <div className="flex justify-between text-[10px] font-mono text-[var(--muted)] pt-2 px-2">
                  <span>00h</span>
                  <span>04h</span>
                  <span>08h (Rush)</span>
                  <span>12h</span>
                  <span>17h (Peak)</span>
                  <span>20h</span>
                  <span>23h</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Weather Impact */}
          {activeTab === 'weather' && (
            <div>
              <div className="pb-6 border-b border-[var(--border)]">
                <h3 className="text-base font-bold text-[var(--foreground)]">
                  Precipitation & Weather Impact on Hourly Ridership
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Adverse meteorological conditions dramatically compress micro-mobility velocity and volume.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.weather_pattern.map((w, i) => (
                  <motion.div
                    key={w.weathersit_id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-5 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] flex flex-col justify-between hover:border-[var(--border-strong)] hover:shadow-xs transition-all"
                  >
                    <div>
                      <span className="text-xs font-mono text-[var(--muted)]">
                        Condition #{w.weathersit_id}
                      </span>
                      <h4 className="font-bold text-sm text-[var(--foreground)] mt-1">
                        {w.weather_name}
                      </h4>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold font-mono text-[var(--foreground)]">
                          {w.mean_hourly}
                        </span>
                        <span className="text-xs text-[var(--muted)]">avg rentals / hr</span>
                      </div>
                      <div className="text-[11px] font-mono text-[var(--muted)] mt-1">
                        Sample: {w.sample_count.toLocaleString()} observed hours
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Seasonal Distribution */}
          {activeTab === 'season' && (
            <div>
              <div className="pb-6 border-b border-[var(--border)]">
                <h3 className="text-base font-bold text-[var(--foreground)]">
                  Seasonal Velocity & Aggregate Ridership
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Demand accelerates in Summer and peaks in Fall before declining in cold winter months.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
                {data.season_pattern.map((s, i) => (
                  <motion.div
                    key={s.season_id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-5 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] flex flex-col justify-between hover:border-[var(--border-strong)] hover:shadow-xs transition-all"
                  >
                    <div>
                      <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)]">
                        Season {s.season_id}
                      </span>
                      <h4 className="font-bold text-lg text-[var(--foreground)] mt-0.5">
                        {s.season_name}
                      </h4>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold font-mono text-[var(--foreground)]">
                          {s.mean_hourly}
                        </span>
                        <span className="text-xs text-[var(--muted)]">mean / hr</span>
                      </div>
                      <div className="text-[11px] font-mono text-[var(--muted)] mt-2">
                        Total: {s.total_rentals.toLocaleString()} rentals
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Temperature Sensitivity */}
          {activeTab === 'temp' && (
            <div>
              <div className="pb-6 border-b border-[var(--border)]">
                <h3 className="text-base font-bold text-[var(--foreground)]">
                  Thermal Band Response Curve
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Ridership rises monotonically as ambient temperature enters the comfortable 20°C - 30°C comfort window.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
                {data.temperature_pattern.map((t, i) => (
                  <motion.div
                    key={t.temp_range}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-5 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)] flex flex-col justify-between hover:border-[var(--border-strong)] hover:shadow-xs transition-all"
                  >
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      {t.temp_range}
                    </span>

                    <div className="mt-6">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold font-mono text-[var(--foreground)]">
                          {t.mean_hourly}
                        </span>
                        <span className="text-xs text-[var(--muted)]">avg / hr</span>
                      </div>
                      <div className="text-[11px] font-mono text-[var(--muted)] mt-1">
                        Sample: {t.sample_count.toLocaleString()} hours
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Dataset Disclosure Banner */}
          <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[var(--muted)] gap-2">
            <span>
              Source: Capital Bikeshare System (Washington D.C., 2011–2012) via UCI Machine Learning Repository.
            </span>
            <span className="font-mono">Total Verified Observations: 17,379</span>
          </div>
        </div>
      ) : null}
    </motion.section>
  );
};
