import type { Metadata } from 'next';
import React from 'react';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy — draft | RYDEXA',
  description:
    'Draft privacy notice for the RYDEXA demo: what the contact form and prediction studio handle.',
};

const sectionTitle = 'text-base font-semibold tracking-tight text-[var(--foreground)]';

export default function PrivacyDraftPage() {
  return (
    <LegalPage title="Privacy notice" updated="25 October 2026">
      <section className="space-y-2">
        <h2 className={sectionTitle}>Draft status</h2>
        <p>
          This is a working draft that describes the current RYDEXA demo as accurately as possible.
          It has not been reviewed by a lawyer and is not legal advice. If you need a binding
          policy, have counsel review and replace this page.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Information you choose to send</h2>
        <p>
          The contact form collects your name, email address, an optional company name, and your
          message. It also includes a hidden anti-spam field; if that field is filled, the
          submission is discarded without notification.
        </p>
        <p>
          Nothing else is required to use the site. There are no accounts, payments, or profile
          pages.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>How a message is delivered</h2>
        <p>
          The form posts to this site&apos;s <code className="rounded bg-[var(--surface-alt)] px-1 py-0.5 text-[var(--foreground)]">/api/contact</code>{' '}
          endpoint. Delivery is attempted in this order, depending on how the deployment is
          configured:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>a webhook endpoint operated by the site owner;</li>
          <li>a transactional email provider (Resend); or</li>
          <li>a local JSONL inbox on the machine running the site.</li>
        </ul>
        <p>
          The form reports success only after one of these channels actually accepts the message.
          If none is available, it asks you to try again rather than pretending to send.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Prediction inputs</h2>
        <p>
          The Demand Studio sends only numeric operating conditions: hour, season, month, weekday,
          working-day and holiday flags, weather condition, temperature, humidity, and wind speed.
          The backend uses them to compute a prediction and does not intentionally store them. It
          does not receive your name, email, or location.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Cookies and local storage</h2>
        <p>
          This project does not include third-party analytics, advertising, or tracking pixels. The
          site stores two preferences in your browser&apos;s local storage: the selected theme and
          the motion preference. They stay on your device and are not sent to the backend.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Retention and sharing</h2>
        <p>
          Messages are not sold. They are shared only with the configured delivery channel (webhook
          or email provider) and the hosting infrastructure needed to run the site. A local inbox is
          kept on the server until the operator deletes it; email and webhook copies follow that
          provider&apos;s retention rules. Server infrastructure may also keep standard request logs
          such as IP address and timestamps.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Your choices</h2>
        <p>
          You can ask for a copy or deletion of a message you sent by contacting the operator through
          the Instagram profile linked in the site footer. Include the email address you used so the
          message can be located. Deleting a local copy does not automatically delete copies held by
          an email provider or webhook recipient.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className={sectionTitle}>Changes</h2>
        <p>
          This draft may change as the project evolves. The date at the top shows the current
          revision. Material changes should be reviewed before this page is presented as a final
          policy.
        </p>
      </section>
    </LegalPage>
  );
}
