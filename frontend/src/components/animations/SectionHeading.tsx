'use client';

import React, { useRef } from 'react';
import { motion, useSpring } from 'motion/react';
import { useAppMotion } from '@/lib/motionPreference';

type Align = 'center' | 'left';

export interface SectionHeadingProps {
  eyebrow?: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Semantic level for the title. Defaults to h2. */
  as?: 'h1' | 'h2';
  align?: Align;
  className?: string;
  /** Full replacement for the default title typography classes. */
  titleClassName?: string;
  children?: React.ReactNode;
}

/**
 * Shared heading language for every major section.
 *
 * - scroll-triggered lift/blur entrance (once)
 * - spring pointer tilt on fine-pointer desktops only
 * - pointer spotlight + lime rule, both purely decorative
 *
 * The content is normal, selectable text: the tilt wrapper only adds a
 * transformed ancestor, never a mask or hidden state.
 */
export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  icon,
  title,
  description,
  as = 'h2',
  align = 'center',
  className = '',
  titleClassName,
  children,
}) => {
  const fullMotion = useAppMotion();
  const tiltRef = useRef<HTMLDivElement>(null);
  const rx = useSpring(0, { stiffness: 170, damping: 20, mass: 0.35 });
  const ry = useSpring(0, { stiffness: 170, damping: 20, mass: 0.35 });
  const tx = useSpring(0, { stiffness: 190, damping: 22, mass: 0.3 });
  const ty = useSpring(0, { stiffness: 190, damping: 22, mass: 0.3 });

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!fullMotion || event.pointerType !== 'mouse') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    rx.set(ny * -2.2);
    ry.set(nx * 3);
    tx.set(nx * 4);
    ty.set(ny * 3);
    el.style.setProperty('--heading-x', `${(((nx + 1) / 2) * 100).toFixed(1)}%`);
  };

  const onPointerLeave = (event: React.PointerEvent<HTMLDivElement>) => {
    rx.set(0);
    ry.set(0);
    tx.set(0);
    ty.set(0);
    event.currentTarget.style.setProperty('--heading-x', '50%');
  };

  const TitleTag = as;
  const centered = align === 'center';
  const titleClasses =
    titleClassName ??
    'text-3xl sm:text-5xl font-bold tracking-tight text-[var(--foreground)]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px -8% 0px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex flex-col ${
        centered ? 'items-center text-center' : 'items-start text-left'
      } ${className}`}
    >
      {eyebrow && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-alt)] border border-[var(--border)] text-xs font-mono font-medium text-[var(--foreground)] mb-3"
        >
          {icon}
          <span>{eyebrow}</span>
        </motion.div>
      )}

      <div
        ref={tiltRef}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        className="section-heading-tilt relative w-full"
      >
        <span aria-hidden="true" className="section-heading__spot" />
        <motion.div
          style={{
            rotateX: rx,
            rotateY: ry,
            x: tx,
            y: ty,
            transformStyle: 'preserve-3d',
          }}
          className="relative"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            <TitleTag className={titleClasses}>{title}</TitleTag>
          </motion.div>
        </motion.div>
      </div>

      <motion.span
        aria-hidden="true"
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`section-heading__rule mt-4 ${centered ? 'self-center' : 'self-start'}`}
      />

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`mt-3 text-sm sm:text-base text-[var(--muted)] leading-relaxed ${
            centered ? 'max-w-2xl' : 'max-w-xl'
          }`}
        >
          {description}
        </motion.p>
      )}

      {children}
    </motion.div>
  );
};
