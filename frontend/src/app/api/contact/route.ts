import type { NextRequest } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

interface LeadPayload {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  message?: unknown;
  website?: unknown;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Best-effort in-memory throttle. Serverless instances each keep their own
// window, which is enough to blunt casual form spam without extra services.
const attempts = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 6;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 500) {
    for (const [entryKey, times] of attempts) {
      if (!times.some((time) => now - time < WINDOW_MS)) attempts.delete(entryKey);
    }
  }
  return recent.length > MAX_ATTEMPTS;
}

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

interface Lead {
  name: string;
  email: string;
  company: string | null;
  message: string;
  submittedAt: string;
}

/**
 * Delivery channels, tried in order:
 *   1. CONTACT_WEBHOOK_URL — any POST endpoint (Make, Zapier, n8n, CRM…)
 *   2. RESEND_API_KEY + CONTACT_TO_EMAIL — transactional email via Resend
 *   3. Local durable inbox — `.data/leads.jsonl` (override with CONTACT_STORE_DIR)
 *
 * A request is only reported as successful after at least one channel has
 * genuinely accepted the message. Nothing is ever reported as sent when it was
 * not stored or transmitted.
 */

async function deliverViaWebhook(lead: Lead): Promise<boolean> {
  const webhook = (process.env.CONTACT_WEBHOOK_URL ?? '').trim();
  if (!webhook) return false;
  const secret = (process.env.CONTACT_WEBHOOK_SECRET ?? '').trim();
  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(secret ? { authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function deliverViaEmail(lead: Lead): Promise<boolean> {
  const apiKey = (process.env.RESEND_API_KEY ?? '').trim();
  const to = (process.env.CONTACT_TO_EMAIL ?? process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '').trim();
  if (!apiKey || !to) return false;

  const from = (process.env.CONTACT_FROM_EMAIL ?? 'RYDEXA <onboarding@resend.dev>').trim();
  const text = [
    `New RYDEXA enquiry`,
    ``,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Company: ${lead.company ?? '—'}`,
    `Received: ${lead.submittedAt}`,
    ``,
    lead.message,
  ].join('\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: lead.email,
        subject: `RYDEXA enquiry — ${lead.name}`,
        text,
      }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function storeLocally(lead: Lead): Promise<boolean> {
  const directory =
    (process.env.CONTACT_STORE_DIR ?? '').trim() || path.join(process.cwd(), '.data');
  try {
    await fs.mkdir(directory, { recursive: true });
    await fs.appendFile(
      path.join(directory, 'leads.jsonl'),
      `${JSON.stringify(lead)}\n`,
      { encoding: 'utf8', mode: 0o600 }
    );
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 20_000) {
    return Response.json(
      { ok: false, code: 'too_large', message: 'Message is too large.' },
      { status: 413 }
    );
  }

  let payload: LeadPayload;
  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return Response.json(
      { ok: false, code: 'invalid_json', message: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const name = clean(payload.name, 120);
  const email = clean(payload.email, 200);
  const company = clean(payload.company, 160);
  const message = clean(payload.message, 4000);
  const honeypot = clean(payload.website, 200);

  // Honeypot: accepted silently, never stored and never notified.
  if (honeypot) {
    return Response.json({ ok: true, delivered: true, channel: 'filtered' }, { status: 202 });
  }

  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = 'Please enter your name.';
  if (!EMAIL_RE.test(email)) fieldErrors.email = 'Please enter a valid email address.';
  if (message.length < 10) fieldErrors.message = 'Please add at least 10 characters.';

  if (Object.keys(fieldErrors).length > 0) {
    return Response.json(
      { ok: false, code: 'validation', fieldErrors, message: 'Please check the highlighted fields.' },
      { status: 422 }
    );
  }

  const forwarded = request.headers.get('x-forwarded-for') ?? '';
  const ip = forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  if (isRateLimited(ip)) {
    return Response.json(
      {
        ok: false,
        code: 'rate_limited',
        message: 'A few messages were already sent. Please try again a little later.',
      },
      { status: 429 }
    );
  }

  const lead: Lead = {
    name,
    email,
    company: company || null,
    message,
    submittedAt: new Date().toISOString(),
  };

  let channel: 'webhook' | 'email' | 'inbox' | null = null;
  if (await deliverViaWebhook(lead)) channel = 'webhook';
  else if (await deliverViaEmail(lead)) channel = 'email';
  else if (await storeLocally(lead)) channel = 'inbox';

  if (!channel) {
    console.error('[contact] no delivery channel accepted the lead');
    return Response.json(
      {
        ok: false,
        code: 'delivery_failed',
        message:
          'The message could not be delivered right now. Please try again in a moment.',
      },
      { status: 502 }
    );
  }

  console.info(`[contact] lead accepted via ${channel}`);
  return Response.json({ ok: true, delivered: true, channel, submittedAt: lead.submittedAt });
}
