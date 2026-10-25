/**
 * Public site configuration.
 *
 * Nothing here is invented: optional links only render when the matching
 * environment variable is present. Copy `.env.example` to `.env.local`
 * and fill in the real values before deploying.
 */

function safeUrl(value: string | undefined): string {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export const siteConfig = {
  /** e.g. https://www.instagram.com/your-handle/ */
  instagramUrl: safeUrl(process.env.NEXT_PUBLIC_INSTAGRAM_URL),
  /** Public GitHub profile (provided by the project owner). */
  githubUrl: 'https://github.com/stopit-master',
  /**
   * Optional direct Colab notebook URL (GitHub/Drive). When empty the UI links
   * to Colab and asks the visitor to upload the downloadable notebook, because
   * this repository has no public hosted copy to open directly.
   */
  colabNotebookUrl: safeUrl(process.env.NEXT_PUBLIC_COLAB_NOTEBOOK_URL),
  notebookDownloadPath: '/ml/rydexa_training_pipeline.ipynb',
  /** e.g. hello@your-domain.com */
  contactEmail: (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '').trim(),
  contactEndpoint: '/api/contact',
} as const;
