'use client';

import React from 'react';
import { MotionConfig } from 'motion/react';
import { useAppMotion } from '@/lib/motionPreference';

/**
 * Single global motion policy.
 *
 * When the visitor prefers reduced motion (and has not explicitly enabled the
 * navbar motion override), Motion skips transforms and keeps opacity fades.
 * CSS backgrounds and the page zoom follow the same `motion-full` class.
 */
export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const full = useAppMotion();
  return <MotionConfig reducedMotion={full ? 'never' : 'always'}>{children}</MotionConfig>;
};
