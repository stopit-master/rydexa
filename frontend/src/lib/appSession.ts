/**
 * Document-level lifecycle flag.
 *
 * It flips to true once the persistent route wrapper has committed for the
 * first time. That lets the first paint keep the staircase preloader and the
 * preloader-gated page entrance, while every later client navigation gets the
 * short route fade/zoom — including a return to the home route, which must not
 * replay the full preloader.
 *
 * This module is shared by the root layout wrapper and the home preloader, so
 * it is one instance for the whole document (unlike per-route bundles).
 */
let mounted = false;

export function markAppMounted() {
  mounted = true;
}

export function isInitialDocumentLoad(): boolean {
  return !mounted;
}
