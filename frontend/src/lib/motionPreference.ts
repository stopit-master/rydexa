'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

/**
 * `system` follows the OS/browser reduced-motion setting.
 * `full` forces every decorative effect on.
 * `off` forces every decorative effect off, independent of the OS setting.
 */
export type MotionOverride = 'system' | 'full' | 'off';

const STORAGE_KEY = 'rydexa-motion';
const EVENT_NAME = 'rydexa-motion-change';

function readOverride(): MotionOverride {
  if (typeof window === 'undefined') return 'system';
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'full' || value === 'off' ? value : 'system';
  } catch {
    return 'system';
  }
}

function computeFullMotion(): boolean {
  if (typeof window === 'undefined') return true;
  const override = readOverride();
  if (override === 'off') return false;
  if (override === 'full') return true;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function applyMotionClass(full: boolean) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('motion-full', full);
  root.classList.toggle('motion-off', !full);
}

/**
 * Reactive full-motion flag.
 * True when decorative motion should run (system preference not reduced,
 * or the user explicitly enabled it via the navbar effects control).
 */
export function useAppMotion(): boolean {
  const [full, setFull] = useState(true); // SSR-safe default; corrected on mount

  useEffect(() => {
    const update = () => {
      const next = computeFullMotion();
      applyMotionClass(next);
      setFull(next);
    };
    update();
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener('change', update);
    window.addEventListener(EVENT_NAME, update);
    window.addEventListener('storage', update);
    return () => {
      mq.removeEventListener('change', update);
      window.removeEventListener(EVENT_NAME, update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return full;
}

/** Reactive override value for the effects toggle UI. */
export function useMotionOverride(): MotionOverride {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener(EVENT_NAME, onChange);
      window.addEventListener('storage', onChange);
      return () => {
        window.removeEventListener(EVENT_NAME, onChange);
        window.removeEventListener('storage', onChange);
      };
    },
    readOverride,
    () => 'system'
  );
}

/** Current resolved state without subscribing (for imperative checks). */
export function isFullMotion(): boolean {
  return computeFullMotion();
}

/** Persist the next override, apply classes immediately, and notify listeners. */
export function setMotionOverride(next: MotionOverride): MotionOverride {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  applyMotionClass(computeFullMotion());
  window.dispatchEvent(new Event(EVENT_NAME));
  return next;
}

export function getMotionOverride(): MotionOverride {
  return readOverride();
}
