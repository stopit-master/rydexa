'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useAppMotion } from '@/lib/motionPreference';

/**
 * Skiper61-inspired spring pointer follower.
 *
 * Coordinate system: the overlay is `position: fixed` at the viewport origin
 * and is driven by raw `clientX/clientY` (viewport) values. There is no
 * container offset and no static-position fallback, so the orb sits exactly
 * on the pointer at every scroll position.
 *
 * The system cursor stays visible; this is purely decorative and
 * `pointer-events-none`.
 */
const TRACK_QUERIES = ['(pointer: fine)', '(hover: hover)'];

const subscribeTrackQueries = (onChange: () => void) => {
  const lists = TRACK_QUERIES.map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener('change', onChange));
  return () => lists.forEach((l) => l.removeEventListener('change', onChange));
};

const getCanTrack = () => TRACK_QUERIES.every((q) => window.matchMedia(q).matches);

export const SpringMouseFollow: React.FC = () => {
  const fullMotion = useAppMotion();
  // Only fine, hover-capable pointers get the follower; false during SSR.
  const canTrack = useSyncExternalStore(subscribeTrackQueries, getCanTrack, () => false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Viewport coordinates. Start off-screen so nothing flashes at 0,0.
  const rawX = useMotionValue(-200);
  const rawY = useMotionValue(-200);

  // Tight spring: primary ring tracks the pointer closely.
  const springX = useSpring(rawX, { stiffness: 420, damping: 32, mass: 0.35 });
  const springY = useSpring(rawY, { stiffness: 420, damping: 32, mass: 0.35 });

  // Loose spring: ambient lime aura trails behind.
  const auraX = useSpring(rawX, { stiffness: 90, damping: 18, mass: 0.9 });
  const auraY = useSpring(rawY, { stiffness: 90, damping: 18, mass: 0.9 });

  useEffect(() => {
    if (!fullMotion || !canTrack) return;

    const handleMove = (event: PointerEvent) => {
      // clientX/clientY are viewport-relative: exactly what a fixed
      // element at top:0/left:0 needs. No rect math, no double offset.
      rawX.set(event.clientX);
      rawY.set(event.clientY);
      setIsVisible(true);
    };

    const handleLeave = () => setIsVisible(false);
    const handleDown = () => setIsPressed(true);
    const handleUp = () => setIsPressed(false);

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerdown', handleDown, { passive: true });
    window.addEventListener('pointerup', handleUp, { passive: true });
    document.addEventListener('pointerleave', handleLeave);
    window.addEventListener('blur', handleLeave);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerdown', handleDown);
      window.removeEventListener('pointerup', handleUp);
      document.removeEventListener('pointerleave', handleLeave);
      window.removeEventListener('blur', handleLeave);
    };
  }, [fullMotion, canTrack, rawX, rawY]);

  if (!fullMotion || !canTrack) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
    >
      {/* Ambient aura — large, slow, restrained lime wash */}
      <motion.div
        className="absolute left-0 top-0 will-change-transform"
        style={{ x: auraX, y: auraY }}
      >
        <div
          style={{
            width: 220,
            height: 220,
            marginLeft: -110,
            marginTop: -110,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(194, 248, 79, 0.16) 0%, rgba(194, 248, 79, 0.06) 42%, rgba(194, 248, 79, 0) 70%)',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 320ms ease',
          }}
        />
      </motion.div>

      {/* Primary spring ring — sharp, responsive */}
      <motion.div
        className="absolute left-0 top-0 will-change-transform"
        style={{ x: springX, y: springY }}
      >
        <motion.div
          animate={{ scale: isPressed ? 0.72 : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.4 }}
          style={{
            width: 30,
            height: 30,
            marginLeft: -15,
            marginTop: -15,
            borderRadius: '50%',
            border: '1.5px solid var(--electric-lime-dark)',
            boxShadow: '0 0 14px rgba(194, 248, 79, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 180ms ease',
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--electric-lime-dark)',
              boxShadow: '0 0 8px rgba(194, 248, 79, 0.9)',
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};
