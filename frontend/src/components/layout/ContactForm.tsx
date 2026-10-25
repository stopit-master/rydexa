'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Check, Loader2, Mail, Send, X } from 'lucide-react';
import { siteConfig } from '@/lib/siteConfig';

type Status = 'idle' | 'submitting' | 'success';

interface FormState {
  name: string;
  email: string;
  company: string;
  message: string;
  website: string;
}

const EMPTY: FormState = { name: '', email: '', company: '', message: '', website: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/60 hover:border-[var(--border-strong)] focus:border-[#C2F84F]/70 transition-colors';

const BURST_DIRECTIONS = [
  [0, -1],
  [0.71, -0.71],
  [1, 0],
  [0.71, 0.71],
  [0, 1],
  [-0.71, 0.71],
  [-1, 0],
  [-0.71, -0.71],
] as const;

/** Celebration overlay shown only after the server confirms acceptance. */
const SuccessDialog: React.FC<{
  open: boolean;
  name: string;
  email: string;
  onClose: () => void;
}> = ({ open, name, email, onClose }) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = originalOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const firstName = name.trim().split(/\s+/)[0] || 'there';

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-success-title"
      aria-describedby="contact-success-desc"
      ref={dialogRef}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="rydexa-fade absolute inset-0 bg-[#050506]/60 backdrop-blur-md"
      />

      <div className="rydexa-pop relative w-full max-w-[420px] overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7 sm:p-8 text-center shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)]">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close confirmation"
          className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--surface-alt)] hover:text-[var(--foreground)] active:scale-90 transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative mx-auto mb-5 grid h-16 w-16 place-items-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[#C2F84F]/20 blur-xl"
          />
          <span className="relative grid h-16 w-16 place-items-center rounded-full bg-[#C2F84F] text-[#0A0A0A] shadow-[0_0_30px_-6px_rgba(194,248,79,0.85)]">
            <Check className="h-8 w-8" strokeWidth={3} />
          </span>
          {BURST_DIRECTIONS.map(([x, y], index) => (
            <span
              key={index}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-[#C2F84F] motion-reduce:hidden"
              style={
                {
                  '--burst-x': `${x * 46}px`,
                  '--burst-y': `${y * 46}px`,
                  animation: `rydexa-burst 900ms cubic-bezier(0.16, 1, 0.3, 1) ${index * 35}ms both`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>

        <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--electric-lime-dark)]">
          Message sent
        </span>
        <h3
          id="contact-success-title"
          className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]"
        >
          Congratulations, {firstName}
        </h3>
        <p
          id="contact-success-desc"
          className="mx-auto mt-2 max-w-[33ch] text-sm leading-relaxed text-[var(--muted)]"
        >
          Your message went through. We&apos;ll reply to{' '}
          <span className="font-medium text-[var(--foreground)]">{email}</span>.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#C2F84F] px-6 py-3 text-sm font-semibold text-[#0A0A0A] shadow-[0_0_24px_-8px_rgba(194,248,79,0.8)] hover:bg-[#D4FF6B] active:scale-[0.98] transition-all"
        >
          Done
        </button>
      </div>
    </div>,
    document.body
  );
};

export const ContactForm: React.FC = () => {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [notice, setNotice] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sent, setSent] = useState({ name: '', email: '' });

  const mailtoHref = useMemo(
    () => (siteConfig.contactEmail ? `mailto:${siteConfig.contactEmail}` : ''),
    []
  );

  const closeDialog = () => setDialogOpen(false);

  const update = (key: keyof FormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((previous) => ({ ...previous, [key]: event.target.value }));
    if (errors[key]) setErrors((previous) => ({ ...previous, [key]: undefined }));
    if (notice) setNotice('');
    if (status === 'success') setStatus('idle');
  };

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) next.name = 'Please enter your name.';
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Please enter a valid email address.';
    if (form.message.trim().length < 10) next.message = 'Please add at least 10 characters.';
    if (form.company.trim().length > 160) next.company = 'Company name is too long.';
    setErrors(next);
    const first = (Object.keys(next) as Array<keyof FormState>)[0];
    if (first) document.getElementById(`contact-${first}`)?.focus();
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting') return;
    setNotice('');
    if (!validate()) return;

    const submitting: FormState = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      company: form.company.trim(),
      message: form.message.trim(),
    };

    setStatus('submitting');

    try {
      const response = await fetch(siteConfig.contactEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: submitting.name,
          email: submitting.email,
          company: submitting.company,
          message: submitting.message,
          website: submitting.website,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; delivered?: boolean; message?: string; fieldErrors?: Record<string, string> }
        | null;

      // The celebration appears only when the server confirms the message was
      // accepted by a real delivery channel.
      if (response.ok && data?.ok === true && data?.delivered === true) {
        setSent({ name: submitting.name, email: submitting.email });
        setForm(EMPTY);
        setErrors({});
        setStatus('success');
        setDialogOpen(true);
        return;
      }

      if (data?.fieldErrors) setErrors(data.fieldErrors);
      setStatus('idle');
      setNotice(
        data?.message ??
          'That did not go through. Please check your connection and try once more.'
      );
    } catch {
      setStatus('idle');
      setNotice('That did not go through. Please check your connection and try once more.');
    }
  };

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="contact-name" className="block text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--muted)] mb-1.5">
              Name <span className="text-[var(--electric-lime-dark)]">*</span>
            </label>
            <input
              id="contact-name"
              name="name"
              autoComplete="name"
              required
              value={form.name}
              onChange={update('name')}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'contact-name-error' : undefined}
              placeholder="Your name"
              className={inputClass}
            />
            {errors.name && (
              <p id="contact-name-error" className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contact-email" className="block text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--muted)] mb-1.5">
              Email <span className="text-[var(--electric-lime-dark)]">*</span>
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={update('email')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'contact-email-error' : undefined}
              placeholder="you@company.com"
              className={inputClass}
            />
            {errors.email && (
              <p id="contact-email-error" className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3.5">
          <label htmlFor="contact-company" className="block text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--muted)] mb-1.5">
            Company <span className="normal-case tracking-normal text-[var(--muted)]/70">(optional)</span>
          </label>
          <input
            id="contact-company"
            name="company"
            autoComplete="organization"
            value={form.company}
            onChange={update('company')}
            aria-invalid={Boolean(errors.company)}
            placeholder="Operator, agency, or university"
            className={inputClass}
          />
          {errors.company && (
            <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{errors.company}</p>
          )}
        </div>

        <div className="mt-3.5">
          <label htmlFor="contact-message" className="block text-[10px] font-mono uppercase tracking-[0.14em] text-[var(--muted)] mb-1.5">
            Message <span className="text-[var(--electric-lime-dark)]">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={4}
            value={form.message}
            onChange={update('message')}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'contact-message-error' : undefined}
            placeholder="Tell us about your fleet, city, or evaluation plans."
            className={`${inputClass} resize-y min-h-[104px]`}
          />
          {errors.message && (
            <p id="contact-message-error" className="mt-1 text-[11px] text-red-600 dark:text-red-400">
              {errors.message}
            </p>
          )}
        </div>

        {/* Honeypot — hidden from humans and assistive tech. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={update('website')}
          />
        </div>

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C2F84F] px-6 py-3 text-sm font-semibold text-[#0A0A0A] shadow-[0_0_22px_-8px_rgba(194,248,79,0.8)] hover:bg-[#D4FF6B] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 transition-all"
          >
            {status === 'submitting' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {status === 'submitting' ? 'Sending…' : 'Send message'}
          </button>

          {mailtoHref && (
            <a
              href={mailtoHref}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-alt)] active:scale-[0.98] transition-all"
            >
              <Mail className="w-4 h-4 text-[var(--electric-lime-dark)]" />
              Email directly
            </a>
          )}
        </div>

        {/* Calm, non-alarming retry notice. Success uses the dialog above. */}
        <div aria-live="polite" aria-atomic="true">
          {notice && (
            <div className="rydexa-fade mt-4 flex items-start gap-2.5 rounded-xl border border-amber-300/70 bg-amber-50 p-3.5 text-[12px] leading-relaxed text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertCircle className="mt-0.5 w-4 h-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {status === 'success' && !dialogOpen && (
            <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--electric-lime-dark)]">
              <Check className="h-3.5 w-3.5" />
              Message sent — thank you.
            </p>
          )}
        </div>

        <p className="mt-3 text-[10px] leading-relaxed text-[var(--muted)]">
          Your details are used only to reply to this enquiry. No newsletters, no resale.
        </p>
      </form>

      <SuccessDialog
        open={dialogOpen}
        name={sent.name}
        email={sent.email}
        onClose={closeDialog}
      />
    </>
  );
};
