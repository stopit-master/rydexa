import React from 'react';
import Link from 'next/link';
import { SectionHeading } from '@/components/animations/SectionHeading';

interface LegalPageProps {
  title: string;
  updated: string;
  children: React.ReactNode;
}

/**
 * Minimal shell for the draft policy pages. Deliberately does not include the
 * marketing footer/contact form: these pages should stay short and readable.
 */
export const LegalPage: React.FC<LegalPageProps> = ({ title, updated, children }) => {
  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-2.5 rounded-xl">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--charcoal)] text-sm font-black text-[#C2F84F]">
              R
            </span>
            <span className="text-sm font-semibold tracking-tight">RYDEXA</span>
          </Link>
          <Link
            href="/"
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-[11px] font-medium text-[var(--muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--foreground)]"
          >
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-8 sm:py-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Draft · not legal advice
        </div>

        <SectionHeading
          as="h1"
          align="left"
          className="mt-5"
          title={title}
          titleClassName="text-3xl font-bold tracking-tight sm:text-4xl"
          description={`Last updated: ${updated}`}
        />

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-[var(--muted)]">
          {children}
        </div>

        <div className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-[var(--border)] pt-6 text-xs">
          <Link href="/legal/privacy" className="text-[var(--muted)] hover:text-[var(--foreground)]">
            Privacy draft
          </Link>
          <Link href="/legal/terms" className="text-[var(--muted)] hover:text-[var(--foreground)]">
            Terms draft
          </Link>
          <Link href="/#contact" className="text-[var(--muted)] hover:text-[var(--foreground)]">
            Contact
          </Link>
        </div>
      </main>
    </div>
  );
};
