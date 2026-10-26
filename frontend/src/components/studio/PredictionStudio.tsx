'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { predictDemand } from '@/lib/api';
import { PredictionRequest, PredictionResponse } from '@/lib/types';
import {
  Clock,
  CloudSun,
  Thermometer,
  Droplets,
  Wind,
  Calendar,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  Sliders,
  Info,
  RefreshCw,
  Layers,
} from 'lucide-react';
import { SectionHeading } from '@/components/animations/SectionHeading';

interface ScenarioPreset {
  name: string;
  desc: string;
  params: PredictionRequest;
}

const PRESETS: ScenarioPreset[] = [
  {
    name: 'Weekday Morning Rush',
    desc: '8:00 AM sunny commute on a typical Wednesday',
    params: {
      hour: 8,
      season: 3,
      month: 9,
      weekday: 3,
      workingday: 1,
      holiday: 0,
      weather_condition: 1,
      temperature_c: 22.0,
      humidity_pct: 60.0,
      wind_speed_kmh: 12.0
    }
  },
  {
    name: 'Evening Peak Surge',
    desc: '5:00 PM Thursday rush hour with optimal weather',
    params: {
      hour: 17,
      season: 2,
      month: 6,
      weekday: 4,
      workingday: 1,
      holiday: 0,
      weather_condition: 1,
      temperature_c: 27.0,
      humidity_pct: 48.0,
      wind_speed_kmh: 14.0
    }
  },
  {
    name: 'Rainy Commute Dampening',
    desc: '8:00 AM Monday with light rain and high humidity',
    params: {
      hour: 8,
      season: 4,
      month: 11,
      weekday: 1,
      workingday: 1,
      holiday: 0,
      weather_condition: 3,
      temperature_c: 11.0,
      humidity_pct: 85.0,
      wind_speed_kmh: 24.0
    }
  },
  {
    name: 'Saturday Leisure Peak',
    desc: '2:00 PM sunny weekend recreational ridership',
    params: {
      hour: 14,
      season: 2,
      month: 5,
      weekday: 6,
      workingday: 0,
      holiday: 0,
      weather_condition: 1,
      temperature_c: 25.0,
      humidity_pct: 45.0,
      wind_speed_kmh: 10.0
    }
  }
];

export const PredictionStudio: React.FC = () => {
  // Input parameters state
  const [hour, setHour] = useState<number>(17);
  const [season, setSeason] = useState<number>(3); // 1:Spring, 2:Summer, 3:Fall, 4:Winter
  const [month, setMonth] = useState<number>(9);
  const [weekday, setWeekday] = useState<number>(3); // 3 = Wednesday
  const [workingday, setWorkingday] = useState<number>(1);
  const [holiday, setHoliday] = useState<number>(0);
  const [weatherCondition, setWeatherCondition] = useState<number>(1);
  const [temperatureC, setTemperatureC] = useState<number>(24.0);
  const [humidityPct, setHumidityPct] = useState<number>(50.0);
  const [windSpeedKmh, setWindSpeedKmh] = useState<number>(14.0);

  // Interaction & Result state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [displayedDemand, setDisplayedDemand] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);

  // Animated Counter Effect
  useEffect(() => {
    if (!prediction) return;
    const target = prediction.predicted_demand;
    const start = displayedDemand;
    const duration = 500;
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(start + (target - start) * easedProgress);
      setDisplayedDemand(currentVal);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    const rafId = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(rafId);
  }, [prediction, displayedDemand]);

  // Execute prediction
  const handlePredict = useCallback(async (customParams?: PredictionRequest) => {
    setIsLoading(true);
    setErrorMsg(null);
    const startTime = performance.now();

    const payload: PredictionRequest = customParams || {
      hour,
      season,
      month,
      weekday,
      workingday,
      holiday,
      weather_condition: weatherCondition,
      temperature_c: temperatureC,
      humidity_pct: humidityPct,
      wind_speed_kmh: windSpeedKmh
    };

    try {
      const res = await predictDemand(payload);
      const latency = Math.round(performance.now() - startTime);
      setLastLatencyMs(latency);
      setPrediction(res);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error communicating with FastAPI backend.');
      setPrediction(null);
    } finally {
      setIsLoading(false);
    }
  }, [hour, season, month, weekday, workingday, holiday, weatherCondition, temperatureC, humidityPct, windSpeedKmh]);

  // Run initial prediction on load
  useEffect(() => {
    // Use setTimeout to defer the initial prediction outside the effect's synchronous phase
    const initId = setTimeout(() => {
      handlePredict();
    }, 0);
    return () => clearTimeout(initId);
  }, [handlePredict]);

  const applyPreset = (preset: ScenarioPreset) => {
    setHour(preset.params.hour);
    setSeason(preset.params.season);
    setMonth(preset.params.month);
    setWeekday(preset.params.weekday);
    setWorkingday(preset.params.workingday);
    setHoliday(preset.params.holiday);
    setWeatherCondition(preset.params.weather_condition);
    setTemperatureC(preset.params.temperature_c);
    setHumidityPct(preset.params.humidity_pct);
    setWindSpeedKmh(preset.params.wind_speed_kmh);
    handlePredict(preset.params);
  };

  const weatherOptions = [
    { id: 1, label: 'Clear / Partly Cloudy', icon: '☀️' },
    { id: 2, label: 'Mist / Overcast', icon: '⛅' },
    { id: 3, label: 'Light Rain / Snow', icon: '🌧️' },
    { id: 4, label: 'Heavy Storm / Ice', icon: '⛈️' }
  ];

  const seasonOptions = [
    { id: 1, label: 'Spring' },
    { id: 2, label: 'Summer' },
    { id: 3, label: 'Fall' },
    { id: 4, label: 'Winter' }
  ];

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <motion.section
      id="studio"
      initial={{ opacity: 0, y: 40, scale: 0.975 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="py-20 sm:py-28 px-4 sm:px-8 max-w-7xl mx-auto scroll-mt-20"
    >
      {/* Section Header */}
      <SectionHeading
        className="mb-12 sm:mb-16"
        eyebrow="INFERENCE CONTROL PANEL"
        icon={<Sliders className="w-3.5 h-3.5 text-[var(--electric-lime-dark)]" />}
        title="Demand Prediction Studio"
        description="Simulate operational fleet scenarios across temporal and meteorological variables. All outputs are computed live by the trained machine learning model."
      >
        {/* Quick Scenario Presets */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-mono text-[var(--muted)] mr-1 hidden sm:inline">QUICK SCENARIOS:</span>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="px-3.5 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-alt)] hover:border-[var(--border-strong)] active:scale-95 transition-all shadow-xs"
            >
              {p.name}
            </button>
          ))}
        </div>
      </SectionHeading>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Parameter Cockpit (7 cols) */}
        <div className="lg:col-span-7 bg-[var(--surface)] rounded-3xl p-6 sm:p-8 border border-[var(--border)] shadow-sm flex flex-col gap-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] tracking-tight">
                Operating Parameters
              </h3>
              <p className="text-xs text-[var(--muted)]">Adjust variables to forecast hourly fleet demand</p>
            </div>
            <button
              onClick={() => handlePredict()}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs font-medium text-[var(--muted-strong)] hover:text-[var(--foreground)] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[var(--electric-lime-dark)]' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Time of Day Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="hour-slider" className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[var(--muted)]" />
                Hour of Day
              </label>
              <span className="font-mono text-sm font-bold text-[var(--foreground)] px-2.5 py-0.5 rounded-md bg-[var(--surface-alt)] border border-[var(--border)]">
                {hour.toString().padStart(2, '0')}:00 {hour >= 12 ? 'PM' : 'AM'}
                {hour >= 7 && hour <= 9 && ' (Morning Rush)'}
                {hour >= 17 && hour <= 19 && ' (Evening Peak)'}
              </span>
            </div>
            <input
              id="hour-slider"
              type="range"
              min="0"
              max="23"
              step="1"
              value={hour}
              onChange={(e) => setHour(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-[var(--surface-alt)] rounded-lg appearance-none cursor-pointer accent-[#6F9410] dark:accent-[#C2F84F]"
            />
            <div className="flex justify-between text-[10px] font-mono text-[var(--muted)] px-0.5">
              <span>00:00 (Night)</span>
              <span>08:00 (Commute)</span>
              <span>12:00 (Noon)</span>
              <span>17:00 (Peak)</span>
              <span>23:00 (Night)</span>
            </div>
          </div>

          {/* Weather Condition Cards */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
              <CloudSun className="w-4 h-4 text-[var(--muted)]" />
              Weather Condition
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {weatherOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setWeatherCondition(opt.id)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    weatherCondition === opt.id
                      ? 'border-[#C2F84F] bg-[#C2F84F] text-[#0A0A0A] shadow-sm'
                      : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-alt)]'
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <span className="text-xs font-medium leading-tight mt-1">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Thermal & Atmospheric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[var(--surface-alt)] border border-[var(--border)]">
            {/* Temperature */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--foreground)] flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-[var(--muted)]" />
                  Temp
                </span>
                <span className="font-mono font-semibold">{temperatureC.toFixed(1)}°C</span>
              </div>
              <input
                type="range"
                min="-5"
                max="40"
                step="0.5"
                value={temperatureC}
                onChange={(e) => setTemperatureC(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[var(--surface-alt)] rounded-lg appearance-none cursor-pointer accent-[#6F9410] dark:accent-[#C2F84F]"
              />
              <span className="text-[10px] text-[var(--muted)] font-mono">
                {temperatureC < 10 ? 'Cold' : temperatureC <= 28 ? 'Optimal' : 'High Heat'}
              </span>
            </div>

            {/* Humidity */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--foreground)] flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-[var(--muted)]" />
                  Humidity
                </span>
                <span className="font-mono font-semibold">{humidityPct.toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="1"
                value={humidityPct}
                onChange={(e) => setHumidityPct(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[var(--surface-alt)] rounded-lg appearance-none cursor-pointer accent-[#6F9410] dark:accent-[#C2F84F]"
              />
              <span className="text-[10px] text-[var(--muted)] font-mono">
                {humidityPct > 75 ? 'Humid' : 'Comfortable'}
              </span>
            </div>

            {/* Wind Speed */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[var(--foreground)] flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-[var(--muted)]" />
                  Wind
                </span>
                <span className="font-mono font-semibold">{windSpeedKmh.toFixed(0)} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="55"
                step="1"
                value={windSpeedKmh}
                onChange={(e) => setWindSpeedKmh(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[var(--surface-alt)] rounded-lg appearance-none cursor-pointer accent-[#6F9410] dark:accent-[#C2F84F]"
              />
              <span className="text-[10px] text-[var(--muted)] font-mono">
                {windSpeedKmh > 30 ? 'High Gusts' : 'Light Breeze'}
              </span>
            </div>
          </div>

          {/* Calendar Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Season Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[var(--muted)]" />
                Season
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {seasonOptions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeason(s.id)}
                    className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                      season === s.id
                        ? 'bg-[#C2F84F] text-[#0A0A0A] border-[#C2F84F]'
                        : 'bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--surface-alt)]'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Day of Week */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                Day of Week
              </label>
              <div className="grid grid-cols-7 gap-1">
                {weekdayNames.map((dayName, idx) => (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => {
                      setWeekday(idx);
                      if (idx === 0 || idx === 6) {
                        setWorkingday(0);
                      } else {
                        setWorkingday(1);
                      }
                    }}
                    className={`py-2 text-xs font-mono font-medium rounded-lg border transition-all ${
                      weekday === idx
                        ? 'bg-[#C2F84F] text-[#0A0A0A] border-[#C2F84F]'
                        : 'bg-[var(--surface)] text-[var(--foreground)] border-[var(--border)] hover:bg-[var(--surface-alt)]'
                    }`}
                  >
                    {dayName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Workingday & Holiday Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={workingday === 1}
                onChange={(e) => setWorkingday(e.target.checked ? 1 : 0)}
                className="w-4 h-4 rounded accent-[#6F9410] dark:accent-[#C2F84F] focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[var(--muted)]" />
                Working Day (Commuter Flow)
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={holiday === 1}
                onChange={(e) => {
                  setHoliday(e.target.checked ? 1 : 0);
                  if (e.target.checked) setWorkingday(0);
                }}
                className="w-4 h-4 rounded accent-[#6F9410] dark:accent-[#C2F84F] focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-medium text-[var(--foreground)]">
                Public Holiday
              </span>
            </label>
          </div>

          {/* Submit Action Button */}
          <button
            onClick={() => handlePredict()}
            disabled={isLoading}
            className="w-full mt-2 py-4 px-6 rounded-2xl bg-[#C2F84F] text-[#0A0A0A] font-semibold text-sm hover:bg-[#D4FF6B] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-[0_0_22px_-8px_rgba(194,248,79,0.8)] disabled:opacity-60 cursor-pointer group"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#0A0A0A]" />
                <span>Executing Model Inference...</span>
              </>
            ) : (
              <>
                <span>Compute Demand Forecast</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#0A0A0A] text-[#C2F84F] text-xs font-bold font-mono transition-transform group-hover:scale-105">
                  LIVE INFERENCE
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right Output Cockpit (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Main Inference Card */}
          <div className="rounded-3xl p-6 sm:p-8 bg-[var(--surface-alt)] text-[var(--foreground)] shadow-xl relative overflow-hidden border border-[var(--border)]">
            {/* Top Engine Pill */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] text-xs">
              <span className="font-mono text-[var(--muted)] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--electric-lime-dark)]" />
                {prediction?.model_name || 'HistGradientBoosting Champion'}
              </span>
              {lastLatencyMs !== null && (
                <span className="font-mono text-[var(--electric-lime-dark)] text-[11px] bg-[var(--surface)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                  {lastLatencyMs} ms latency
                </span>
              )}
            </div>

            {/* Error State Display */}
            {errorMsg ? (
              <div className="my-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-500/30 dark:text-red-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">
                    Inference Offline
                  </span>
                  <p className="text-xs text-red-800/90 dark:text-red-200/90 leading-relaxed">{errorMsg}</p>
                  <p className="text-[11px] text-[var(--muted)] mt-1">
                    RYDEXA strictly avoids fabricated predictions. Start the backend with `python backend/run.py` to restore inference.
                  </p>
                </div>
              </div>
            ) : (
              /* Success State Display with Animated Counter */
              <div className="my-6 flex flex-col">
                <div className="text-xs font-mono text-[var(--muted)] tracking-wider uppercase mb-1">
                  Forecasted Fleet Demand
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl sm:text-7xl font-bold font-mono tracking-tight text-[var(--foreground)]">
                    {displayedDemand}
                  </span>
                  <span className="text-sm font-medium text-[var(--muted)]">
                    rentals / hr
                  </span>
                </div>

                {/* Demand Tier Badge */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-[#C2F84F] text-[#0A0A0A] shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A] animate-pulse" />
                    {prediction?.demand_tier || 'Calculating...'}
                  </span>

                  {prediction?.confidence_interval && (
                    <span className="text-xs font-mono text-[var(--muted-strong)] px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)]">
                      MAE Bounds: [{prediction.confidence_interval.lower_bound} – {prediction.confidence_interval.upper_bound}]
                    </span>
                  )}
                </div>

                {/* Factors Breakdown */}
                {prediction?.factors && (
                  <div className="mt-6 pt-5 border-t border-[var(--border)] grid grid-cols-1 gap-2.5 text-xs">
                    <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-[var(--surface)]">
                      <span className="text-[var(--muted)]">Commute Window:</span>
                      <span className={`font-medium ${prediction.factors.is_commute_peak ? 'text-[var(--electric-lime-dark)]' : 'text-[var(--muted-strong)]'}`}>
                        {prediction.factors.is_commute_peak ? 'Active Rush Surge' : 'Off-Peak Transit Band'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-[var(--surface)]">
                      <span className="text-[var(--muted)]">Weather Factor:</span>
                      <span className="font-medium text-[var(--muted-strong)]">
                        {prediction.factors.weather_impact}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-[var(--surface)]">
                      <span className="text-[var(--muted)]">Thermal Comfort:</span>
                      <span className="font-medium text-[var(--muted-strong)]">
                        {prediction.factors.temperature_rating}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Scientific Historical Disclosure */}
            <div className="pt-4 border-t border-[var(--border)] flex items-start gap-2.5 text-[11px] text-[var(--muted)] leading-relaxed">
              <Info className="w-4 h-4 text-[var(--muted)] shrink-0 mt-0.5" />
              <span>
                {prediction?.disclaimer ||
                  'This prediction is a historical statistical benchmark derived from Capital Bikeshare hourly telemetry (2011–2012). It models behavioral response to environmental parameters.'}
              </span>
            </div>
          </div>

          {/* Operational Guidance Card for Fleet Managers */}
          <div className="bg-[var(--surface)] rounded-3xl p-6 border border-[var(--border)] shadow-sm flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[var(--electric-lime-dark)]" />
              Commercial Demand Intelligence
            </h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              When forecasted demand exceeds 500 rentals/hr, staging stations require preemptive vehicle rebalancing 45 minutes prior. Heavy rain reduces demand by up to 52%, allowing scheduled battery swap windows.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
