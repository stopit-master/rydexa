'use client';

import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { useAppMotion } from '@/lib/motionPreference';

type ThemeMode = 'light' | 'dark';

/** Reads the theme class and stays in sync with the navbar toggle. */
function useThemeMode(): ThemeMode | null {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
      window.addEventListener('rydexa-theme-change', onChange);
      return () => {
        observer.disconnect();
        window.removeEventListener('rydexa-theme-change', onChange);
      };
    },
    () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'),
    () => null
  );
}

type GridPoint = { x: number; y: number };

/**
 * Light-mode kinetic grid: a quiet canvas grid whose intersections bend and
 * brighten toward the pointer. It only paints while the pointer is moving
 * (plus a short settle window), pauses when the tab is hidden, and draws a
 * single static frame when motion is reduced.
 */
function KineticGrid({ fullMotion }: { fullMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const lowPower = (navigator.hardwareConcurrency || 8) <= 4;
    const dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.5);
    let width = 0;
    let height = 0;
    let cols: number[] = [];
    let rows: number[] = [];
    let flat: GridPoint[] = [];
    let spacing = 64;
    let pageBackground = '#F6F6F2';
    const pointer = { x: -9999, y: -9999 };
    const eased = { x: -9999, y: -9999 };
    const spring = { vx: 0, vy: 0 };
    const radius = () => (lowPower ? 145 : 225);

    let raf = 0;
    let running = false;
    let lastMove = 0;
    let lastPaint = 0;
    const HOLD_MS = 1600;
    const frameMs = lowPower ? 1000 / 24 : 1000 / 45;

    const layout = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      spacing = width < 640 ? 44 : width < 1100 ? 58 : 72;
      pageBackground =
        getComputedStyle(document.documentElement).getPropertyValue('--background').trim() ||
        '#F6F6F2';
      const offsetX = (width % spacing) / 2;
      const offsetY = (height % spacing) / 2;
      cols = [];
      rows = [];
      for (let x = offsetX; x <= width; x += spacing) cols.push(x);
      for (let y = offsetY; y <= height; y += spacing) rows.push(y);
      flat = rows.flatMap((y) => cols.map((x) => ({ x, y })));
    };

    const paint = (time: number) => {
      ctx.fillStyle = pageBackground;
      ctx.fillRect(0, 0, width, height);

      const R = radius();
      const R2 = R * R;
      const active = pointer.x > -1000;
      const px = eased.x;
      const py = eased.y;

      // Soft lime light that follows the pointer.
      if (active) {
        const glow = ctx.createRadialGradient(px, py, 0, px, py, R * 1.15);
        glow.addColorStop(0, 'rgba(194, 248, 79, 0.24)');
        glow.addColorStop(0.45, 'rgba(194, 248, 79, 0.075)');
        glow.addColorStop(1, 'rgba(194, 248, 79, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
      }

      // Displace intersections near the pointer, then draw the mesh.
      const shifted = flat.map((p) => {
        if (!active) return p;
        const dx = p.x - px;
        const dy = p.y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 > R2) return p;
        const d = Math.sqrt(d2) || 1;
        const pull = (1 - d / R) * 11;
        return { x: p.x - (dx / d) * pull, y: p.y - (dy / d) * pull };
      });

      const index = (c: number, r: number) => r * cols.length + c;

      // Horizontal + vertical base lines.
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(22, 22, 26, 0.06)';
      ctx.beginPath();
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < cols.length - 1; c++) {
          const a = shifted[index(c, r)];
          const b = shifted[index(c + 1, r)];
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
      }
      for (let c = 0; c < cols.length; c++) {
        for (let r = 0; r < rows.length - 1; r++) {
          const a = shifted[index(c, r)];
          const b = shifted[index(c, r + 1)];
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
      }
      ctx.stroke();

      if (!active) return;

      // Lime segments + intersection dots near the pointer.
      for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < cols.length - 1; c++) {
          const a = shifted[index(c, r)];
          const b = shifted[index(c + 1, r)];
          const mx = (a.x + b.x) / 2 - px;
          const my = (a.y + b.y) / 2 - py;
          const proximity = 1 - Math.sqrt(mx * mx + my * my) / R;
          if (proximity <= 0) continue;
          ctx.strokeStyle = `rgba(111, 148, 16, ${0.42 * proximity})`;
          ctx.lineWidth = 1 + proximity * 0.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      for (let c = 0; c < cols.length; c++) {
        for (let r = 0; r < rows.length - 1; r++) {
          const a = shifted[index(c, r)];
          const b = shifted[index(c, r + 1)];
          const mx = (a.x + b.x) / 2 - px;
          const my = (a.y + b.y) / 2 - py;
          const proximity = 1 - Math.sqrt(mx * mx + my * my) / R;
          if (proximity <= 0) continue;
          ctx.strokeStyle = `rgba(111, 148, 16, ${0.36 * proximity})`;
          ctx.lineWidth = 1 + proximity * 0.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (let i = 0; i < shifted.length; i++) {
        const p = shifted[i];
        const dx = p.x - px;
        const dy = p.y - py;
        const proximity = 1 - Math.sqrt(dx * dx + dy * dy) / R;
        if (proximity <= 0) continue;
        ctx.fillStyle = `rgba(111, 148, 16, ${0.62 * proximity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.1 + proximity * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Keep the eased pointer independent of the paint timestamps.
      void time;
    };

    const loop = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(loop);
      if (now - lastPaint < frameMs) return;
      lastPaint = now;

      if (pointer.x > -1000) {
        if (eased.x < -1000) {
          eased.x = pointer.x;
          eased.y = pointer.y;
          spring.vx = 0;
          spring.vy = 0;
        } else {
          // Light spring integration: overshoots slightly, then settles.
          // Velocities are clamped so a large pointer jump stays calm.
          const k = 0.085;
          const damping = 0.86;
          spring.vx = Math.max(-42, Math.min(42, (spring.vx + (pointer.x - eased.x) * k) * damping));
          spring.vy = Math.max(-42, Math.min(42, (spring.vy + (pointer.y - eased.y) * k) * damping));
          eased.x += spring.vx;
          eased.y += spring.vy;
        }
      }
      paint(now);

      const settled =
        Math.abs(pointer.x - eased.x) < 0.6 &&
        Math.abs(pointer.y - eased.y) < 0.6 &&
        Math.abs(spring.vx) < 0.05 &&
        Math.abs(spring.vy) < 0.05;
      if (settled && now - lastMove > HOLD_MS) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    const start = () => {
      if (running || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      eased.x = eased.x < -1000 ? event.clientX : eased.x;
      eased.y = eased.y < -1000 ? event.clientY : eased.y;
      if (eased.x === event.clientX && eased.y === event.clientY) {
        spring.vx = 0;
        spring.vy = 0;
      }
      lastMove = performance.now();
      start();
    };

    const onPointerLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
      eased.x = -9999;
      eased.y = -9999;
      spring.vx = 0;
      spring.vy = 0;
      lastMove = performance.now();
      start();
    };

    const onResize = () => {
      layout();
      paint(performance.now());
      if (fullMotion) start();
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else {
        paint(performance.now());
        if (fullMotion) start();
      }
    };

    layout();
    paint(performance.now());

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);

    if (fullMotion) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerleave', onPointerLeave);
      start();
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [fullMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  );
}

/** Dark-mode spectral bands + fine grid + one pointer-driven lime light. */
function SpectralBands({ fullMotion }: { fullMotion: boolean }) {
  const glowRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  // Capability + visibility are external stores, read without setState-in-effect.
  const lowPower = useSyncExternalStore(
    () => () => {},
    () => (navigator.hardwareConcurrency || 8) <= 4,
    () => false
  );
  const hidden = useSyncExternalStore(
    (onChange) => {
      document.addEventListener('visibilitychange', onChange);
      return () => document.removeEventListener('visibilitychange', onChange);
    },
    () => document.hidden,
    () => false
  );

  // The pointer light is moved once per animation frame — no standing loop,
  // no React state. Disabled for reduced motion and coarse pointers.
  useEffect(() => {
    if (!fullMotion) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const glow = glowRef.current;
    if (!glow) return;
    const stage = stageRef.current;

    let raf = 0;
    let x = 0;
    let y = 0;
    let visible = false;

    const commit = () => {
      raf = 0;
      const nx = x / window.innerWidth - 0.5;
      const ny = y / window.innerHeight - 0.5;
      glow.style.transform = `translate3d(${x - window.innerWidth / 2}px, ${
        y - window.innerHeight / 2
      }px, 0)`;
      if (stage) {
        stage.style.transform = `translate3d(${(nx * 22).toFixed(1)}px, ${(ny * 16).toFixed(
          1
        )}px, 0)`;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || document.hidden) return;
      x = event.clientX;
      y = event.clientY;
      if (!visible) {
        visible = true;
        glow.style.opacity = '1';
      }
      if (!raf) raf = requestAnimationFrame(commit);
    };

    const onPointerLeave = () => {
      visible = false;
      glow.style.opacity = '0';
      if (stage) stage.style.transform = 'translate3d(0, 0, 0)';
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [fullMotion]);

  const bands = lowPower
    ? ['violet', 'cyan', 'lime']
    : ['violet', 'cyan', 'lime', 'magenta', 'warm'];

  return (
    <>
      <div
        ref={stageRef}
        className="spectral-stage"
        style={{
          animationPlayState: fullMotion && !hidden ? 'running' : 'paused',
        }}
      >
        <div className="spectral-veil absolute inset-0" />
        {bands.map((tone, index) => (
          <span
            key={tone}
            className={`spectral-band spectral-band--${tone}`}
            style={{
              animationDelay: `${index * -6.5}s`,
              animationDuration: `${30 + index * 3}s`,
              animationPlayState: fullMotion && !hidden ? 'running' : 'paused',
            }}
          />
        ))}
      </div>
      <div className="spectral-grid" />
      <div ref={glowRef} className="spectral-pointer" />
    </>
  );
}

/**
 * Page-wide theme backdrop. Only the active theme's effect is mounted.
 * Both variants are fixed behind the content and never intercept input.
 */
export const ThemeBackdrop: React.FC = () => {
  const mode = useThemeMode();
  const fullMotion = useAppMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {mode === 'dark' ? (
        <SpectralBands fullMotion={fullMotion} />
      ) : mode === 'light' ? (
        <KineticGrid fullMotion={fullMotion} />
      ) : null}
    </div>
  );
};
