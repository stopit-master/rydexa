'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';
import { ArrowUpRight, Mail } from 'lucide-react';
import { ContactForm } from './ContactForm';
import { siteConfig } from '@/lib/siteConfig';
import { checkHealth } from '@/lib/api';
import { useAppMotion } from '@/lib/motionPreference';

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.4" cy="6.6" r="1.05" fill="currentColor" stroke="none" />
  </svg>
);

const GitHubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.55v-2.15c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.35.78 1.05.78 2.12v3.14c0 .3.21.66.8.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
  </svg>
);

type ApiState = 'checking' | 'online' | 'offline';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Demand Studio', href: '#studio' },
      { label: 'Historical Analytics', href: '#analytics' },
      { label: 'Model Metrics', href: '#metrics' },
      { label: 'Contact', href: '#contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      {
        label: 'UCI Dataset Provenance',
        href: 'https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset',
        external: true,
      },
      {
        label: 'Training Notebook',
        href: siteConfig.notebookDownloadPath,
        download: true,
      },
      { label: 'GitHub Profile', href: siteConfig.githubUrl, external: true },
      { label: 'Held-out Metrics', href: '#metrics' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About RYDEXA', href: '#about' },
      { label: 'Method & Scope', href: '#metrics' },
      { label: 'Commercial Roadmap', href: '#about' },
      { label: 'Start a Conversation', href: '#contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy (draft)', href: '/legal/privacy' },
      { label: 'Terms (draft)', href: '/legal/terms' },
      {
        label: 'Dataset License',
        href: 'https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset',
        external: true,
      },
    ],
  },
] as const;

export const Footer: React.FC = () => {
  const [api, setApi] = useState<ApiState>('checking');
  const [modelLoaded, setModelLoaded] = useState(false);
  const footerRef = useRef<HTMLElement>(null);
  const fullMotion = useAppMotion();

  // Scroll-linked liquid finale. Progress runs 0→1 between the footer entering
  // the viewport and the page bottom. Spring smoothing makes the crest settle
  // rather than snap, and reversing the scroll reverses the expansion.
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ['start end', 'end end'],
  });
  const liquid = useSpring(scrollYProgress, {
    stiffness: 78,
    damping: 22,
    restDelta: 0.001,
  });
  const backY = useTransform(liquid, [0, 1], ['84%', '12%']);
  const midY = useTransform(liquid, [0, 1], ['100%', '2%']);
  const frontY = useTransform(liquid, [0, 1], ['116%', '-4%']);
  const liquidOpacity = useTransform(liquid, [0, 0.12, 1], [0.25, 0.9, 1]);
  const liquidScale = useTransform(liquid, [0, 1], [0.9, 1]);

  const layerStyle = (y: typeof backY) =>
    fullMotion
      ? { y, opacity: liquidOpacity, scaleY: liquidScale }
      : { y: 0, opacity: 1, scaleY: 1 };

  useEffect(() => {
    let active = true;
    checkHealth()
      .then((health) => {
        if (!active) return;
        setModelLoaded(Boolean(health.model_loaded));
        setApi('online');
      })
      .catch(() => {
        if (active) setApi('offline');
      });
    return () => {
      active = false;
    };
  }, []);

  const apiLabel =
    api === 'checking'
      ? 'Checking inference API…'
      : api === 'online'
        ? modelLoaded
          ? 'Inference API online · model loaded'
          : 'Inference API online · model missing'
        : 'Inference API offline (local demo)';

  return (
    <footer
      ref={footerRef}
      id="contact"
      className="relative z-10 mt-20 overflow-hidden border-t border-[var(--border)] bg-[var(--surface)]"
    >
      <div className="footer-reveal max-w-7xl mx-auto px-4 sm:px-8 pt-14 sm:pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-4">
            <a href="#" className="inline-flex items-center gap-3 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-[var(--charcoal)] flex items-center justify-center text-[#C2F84F] font-black text-sm">
                R
              </div>
              <div>
                <div className="font-semibold text-base tracking-tight text-[var(--foreground)]">
                  RYDEXA
                </div>
                <div className="text-[10px] tracking-widest text-[var(--muted)] uppercase font-mono">
                  Micro-Mobility Demand Intelligence
                </div>
              </div>
            </a>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-[var(--muted)]">
              Empirical demand forecasting for bike-sharing fleets and municipal transit planners.
              Trained on the UCI Capital Bikeshare record, evaluated chronologically, and served
              without fabricated telemetry.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {siteConfig.instagramUrl && (
                <a
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="RYDEXA on Instagram (opens in a new tab)"
                  className="group inline-flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-2.5 text-xs font-medium text-[var(--foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C2F84F]/60 hover:shadow-[0_10px_28px_-14px_rgba(194,248,79,0.8)] active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none"
                >
                  <InstagramIcon className="h-4 w-4 text-[var(--electric-lime-dark)] transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none" />
                  Instagram
                  <ArrowUpRight className="h-3 w-3 text-[var(--muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" />
                </a>
              )}

              <a
                href={siteConfig.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="RYDEXA on GitHub (opens in a new tab)"
                className="group inline-flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-2.5 text-xs font-medium text-[var(--foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C2F84F]/60 hover:shadow-[0_10px_28px_-14px_rgba(194,248,79,0.8)] active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none"
              >
                <GitHubIcon className="h-4 w-4 text-[var(--electric-lime-dark)] transition-transform duration-200 group-hover:scale-110 motion-reduce:transform-none" />
                GitHub
                <ArrowUpRight className="h-3 w-3 text-[var(--muted)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" />
              </a>

              {siteConfig.contactEmail && (
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  aria-label={`Email RYDEXA at ${siteConfig.contactEmail}`}
                  className="group inline-flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 py-2.5 text-xs font-medium text-[var(--foreground)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C2F84F]/60 hover:shadow-[0_10px_28px_-14px_rgba(194,248,79,0.8)] active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none"
                >
                  <Mail className="h-4 w-4 text-[var(--electric-lime-dark)]" />
                  Email
                </a>
              )}
            </div>
          </div>

          {/* Link columns */}
          <nav aria-label="Footer" className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
            {columns.map((column) => (
              <div key={column.title}>
                <h2 className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--muted)]">
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => {
                    const linkClass =
                      'inline-flex items-center gap-1 text-xs text-[var(--muted)] transition-colors hover:text-[var(--foreground)] focus-visible:text-[var(--foreground)]';
                    const content = (
                      <>
                        {link.label}
                        {'external' in link && link.external && (
                          <ArrowUpRight className="h-3 w-3 opacity-60" aria-hidden="true" />
                        )}
                      </>
                    );

                    // Legal pages are real routes: use the client router so the
                    // shared route transition runs instead of a full reload.
                    // Hashes stay native anchors for smooth in-page scrolling.
                    return (
                      <li key={link.label}>
                        {link.href.startsWith('/') ? (
                          <Link href={link.href} className={linkClass}>
                            {content}
                          </Link>
                        ) : (
                          <a
                            href={link.href}
                            {...('external' in link && link.external
                              ? { target: '_blank', rel: 'noopener noreferrer' }
                              : {})}
                            {...('download' in link && link.download ? { download: true } : {})}
                            className={linkClass}
                          >
                            {content}
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Contact */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-[0.72fr_1.28fr] gap-8 rounded-3xl border border-[var(--border)] bg-[var(--surface-alt)]/60 p-5 sm:p-7 backdrop-blur-md">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--electric-lime-dark)]">
              Contact
            </span>
            <h2 className="mt-1.5 text-xl sm:text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Start a conversation
            </h2>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-[var(--muted)]">
              Fleet pilots, municipal evaluations, or a walkthrough of the model and its held-out
              results. Every message is delivered through a real channel — never a simulated
              success.
            </p>
          </div>
          <ContactForm />
        </div>
      </div>

      {/* Status row */}
      <div className="border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-[var(--muted)]">
          <p>© 2026 RYDEXA · Micro-Mobility Demand Intelligence</p>
          <p className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                api === 'online'
                  ? 'bg-emerald-500'
                  : api === 'offline'
                    ? 'bg-[var(--muted)]/60'
                    : 'bg-[var(--muted)] animate-pulse'
              }`}
            />
            {apiLabel}
          </p>
          <p className="text-center sm:text-right">
            No live telemetry · UCI Capital Bikeshare 2011–2012
          </p>
        </div>
      </div>

      {/* Liquid wave finale — scroll-driven, layered, GPU transforms only */}
      <div className="footer-liquid" aria-hidden="true">
        <div className="footer-liquid__scrim" />
        <motion.div
          className="footer-liquid__layer footer-liquid__layer--back"
          style={layerStyle(backY)}
        >
          <svg viewBox="0 0 1440 240" preserveAspectRatio="none" focusable="false">
            <defs>
              <linearGradient id="footer-liquid-back" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#C2F84F" />
                <stop offset="30%" stopColor="#46BAFF" />
                <stop offset="58%" stopColor="#A78BFA" />
                <stop offset="82%" stopColor="#FF60BE" />
                <stop offset="100%" stopColor="#FFAB5A" />
              </linearGradient>
            </defs>
            <path
              d="M0,150 C 180,80 320,192 520,140 C 720,88 862,42 1060,112 C 1240,174 1330,122 1440,86 L1440,240 L0,240 Z"
              fill="url(#footer-liquid-back)"
              fillOpacity="0.34"
            />
          </svg>
        </motion.div>

        <motion.div
          className="footer-liquid__layer footer-liquid__layer--mid"
          style={layerStyle(midY)}
        >
          <svg viewBox="0 0 1440 240" preserveAspectRatio="none" focusable="false">
            <defs>
              <linearGradient id="footer-liquid-mid" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#9FDB2E" />
                <stop offset="26%" stopColor="#38B6E8" />
                <stop offset="54%" stopColor="#8B6CF0" />
                <stop offset="78%" stopColor="#F04FAE" />
                <stop offset="100%" stopColor="#F29A4A" />
              </linearGradient>
            </defs>
            <path
              d="M0,172 C 200,110 360,212 560,160 C 760,108 940,72 1120,142 C 1280,202 1360,152 1440,120 L1440,240 L0,240 Z"
              fill="url(#footer-liquid-mid)"
              fillOpacity="0.42"
            />
          </svg>
        </motion.div>

        <motion.div
          className="footer-liquid__layer footer-liquid__layer--front"
          style={layerStyle(frontY)}
        >
          <svg viewBox="0 0 1440 240" preserveAspectRatio="none" focusable="false">
            <defs>
              <linearGradient id="footer-liquid-front" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#D9FF7A" />
                <stop offset="24%" stopColor="#5FD3FF" />
                <stop offset="50%" stopColor="#B49CFF" />
                <stop offset="74%" stopColor="#FF7FC8" />
                <stop offset="100%" stopColor="#FFC077" />
              </linearGradient>
            </defs>
            <path
              d="M0,196 C 220,150 380,228 600,190 C 820,152 980,118 1160,178 C 1300,224 1370,182 1440,164 L1440,240 L0,240 Z"
              fill="url(#footer-liquid-front)"
              fillOpacity="0.58"
            />
            <path
              d="M0,196 C 220,150 380,228 600,190 C 820,152 980,118 1160,178 C 1300,224 1370,182 1440,164"
              fill="none"
              stroke="#E7FFB8"
              strokeOpacity="0.5"
              strokeWidth="1.2"
            />
          </svg>
        </motion.div>

        <div className="footer-liquid__haze" />
      </div>
    </footer>
  );
};
