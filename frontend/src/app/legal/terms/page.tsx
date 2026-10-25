import type { Metadata } from 'next';
import React from 'react';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms — draft | RYDEXA',
  description:
    'Draft terms for the RYDEXA demo: a historical demand model, not a live operational system.',
};

const sectionTitle = 'text-base font-semibold tracking-tight text-[var(--foreground)]';

export default function TermsDraftPage() {
  return (
    <LegalPage title="Terms of use" updated="25 October 2026">
      <section className="space-y-2">
        <h2 className={sectionTitle}>Draft status</h2>
        <p>
          These terms are a working draft for a demonstration project. They are not legal advice and
          have not been reviewed by counsel. Do not treat them as a final agreement.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>What this site is</h2>
        <p>
          RYDEXA is a portfolio and research demo that serves predictions from a model trained on
          the public UCI Capital Bikeshare dataset covering Washington, D.C. in 2011–2012. It
          illustrates a chronological machine-learning workflow; it is not a commercial dispatch,
          pricing, or fleet-management service.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>No operational reliance</h2>
        <p>
          Predictions are statistical estimates based on historical patterns, weather, and calendar
          features. They are not live fleet telemetry and may be wrong for modern vehicles, cities,
          events, or conditions outside the training data. Do not use them for safety-critical,
          contractual, or financial decisions without independent validation.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Acceptable use</h2>
        <p>Do not use the site or its API to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>disrupt availability, probe for vulnerabilities without permission, or bypass rate limits;</li>
          <li>send unlawful, abusive, or unsolicited bulk messages through the contact form;</li>
          <li>misrepresent model output as measured live demand or as the operator&apos;s advice;</li>
          <li>violate the rights of the dataset publishers or any third party.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Availability</h2>
        <p>
          This is a development demo provided as-is. Features, model artifacts, and endpoints may
          change or go offline without notice, and no uptime or support commitment is made.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Data and attribution</h2>
        <p>
          The bike-sharing dataset is published by the UCI Machine Learning Repository and remains
          subject to its publishers&apos; terms; see the{' '}
          <a
            href="https://archive.ics.uci.edu/dataset/275/bike+sharing+dataset"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--foreground)] underline underline-offset-2"
          >
            dataset page
          </a>
          . The RYDEXA name and interface belong to their respective owner. Nothing here grants a
          license to the dataset, third-party trademarks, or the site&apos;s code.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Third-party links</h2>
        <p>
          Links to Instagram, GitHub, and the UCI repository open external sites. Those sites have
          their own terms and privacy practices, which this project does not control.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Limitation of liability</h2>
        <p>
          To the extent permitted by applicable law, the operator is not liable for losses arising
          from use of, or reliance on, this demo or its predictions. This draft does not create
          warranties, service levels, or indemnities.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Changes and contact</h2>
        <p>
          These draft terms may change as the project evolves. Questions can be sent through the
          contact form on the main site or the Instagram profile linked in the footer.
        </p>
      </section>
    </LegalPage>
  );
}
